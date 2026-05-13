/**
 * ORDER QUEUE — apps/backend/src/queues/order.queue.js
 *
 * WHY THIS FILE EXISTS:
 * After a user places an order, we need to send a confirmation email.
 * We could do it directly inside createOrder(), but that has two problems:
 *
 *  1. The email call (Resend API) happens INSIDE the Prisma transaction.
 *     If Resend is slow (500ms+), the DB transaction stays open longer,
 *     holding row locks and blocking other requests.
 *
 *  2. If the email fails, should the order fail too? No — the order is
 *     already saved. The email is a side-effect, not part of the core flow.
 *
 * SOLUTION — BullMQ:
 *  - We push a lightweight job object to Redis (fast, <1ms).
 *  - The transaction commits immediately.
 *  - A separate worker process (order.worker.js) picks up the job from
 *    Redis and sends the email outside the request lifecycle.
 *  - If the email fails, BullMQ retries automatically (up to 3 times
 *    with exponential backoff) without affecting the user's order.
 *
 * HOW BULLMQ WORKS:
 *  Queue  → adds jobs to Redis
 *  Worker → reads jobs from Redis and processes them
 *  They communicate only through Redis — no direct connection between them.
 *  This means workers can run on a completely separate server/process.
 */

import { Queue } from 'bullmq';
import { logger } from '../utils/logger.js';

// Redis connection config for BullMQ.
// BullMQ uses ioredis internally — we pass the same Redis URL used elsewhere.
// WHY a separate connection object instead of reusing the existing Redis client?
// BullMQ manages its own connection lifecycle (reconnects, blocking commands).
// Sharing a client with the app's cache layer can cause interference.
const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

/**
 * The order queue.
 * 'order-jobs' is the queue name — it's the Redis key prefix BullMQ uses.
 * Both the Queue (producer) and Worker (consumer) must use the same name.
 */
export const orderQueue = new Queue('order-jobs', {
    connection,
    defaultJobOptions: {
        // Keep completed jobs for 24 hours so you can inspect them in Bull Board
        removeOnComplete: { age: 24 * 60 * 60 },
        // Keep failed jobs for 7 days for debugging
        removeOnFail: { age: 7 * 24 * 60 * 60 },
        // Retry failed jobs up to 3 times with exponential backoff:
        // attempt 1 → wait 2s, attempt 2 → wait 4s, attempt 3 → wait 8s
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000, // 2 seconds base delay
        },
    },
});

// Handle queue errors gracefully
orderQueue.on('error', (err) => {
    logger.error(`Order queue error: ${err.message}`);
});

// Log successful connection
orderQueue.on('ready', () => {
    logger.info('✅ Order queue connected to Redis');
});

// Handle disconnection
orderQueue.on('disconnected', () => {
    logger.warn('⚠️  Order queue disconnected from Redis');
});

logger.info('✅ Order queue initialized');
