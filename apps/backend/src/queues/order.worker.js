/**
 * ORDER WORKER — apps/backend/src/queues/order.worker.js
 *
 * WHY THIS FILE EXISTS:
 * This is the CONSUMER side of BullMQ. The queue (order.queue.js) adds jobs;
 * this worker picks them up and processes them.
 *
 * HOW TO RUN:
 *   node src/queues/order.worker.js
 *
 * In production, run this as a SEPARATE process alongside the main server:
 *   Process 1: node src/server.js        ← handles HTTP requests
 *   Process 2: node src/queues/order.worker.js  ← processes background jobs
 *
 * WHY SEPARATE PROCESS?
 *  - If the worker crashes, the API server keeps running (and vice versa).
 *  - You can scale workers independently (e.g., 1 API server, 3 workers).
 *  - Workers can be on a different machine entirely.
 *
 * WHAT HAPPENS IF REDIS IS DOWN?
 *  - Jobs that were already in Redis will be processed when Redis comes back.
 *  - New jobs added while Redis is down will fail silently (the order still
 *    saves — only the email is lost). This is acceptable for email.
 */

import 'dotenv/config';
import { Worker } from 'bullmq';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { connectDB } from '../config/mongodb.js';
import { connectPostgres } from '../config/Postgrsedb.js';
import { connectRedis } from '../config/Redis.js';
import { workerMetrics } from '../middleware/metrics.js';
import express from 'express';
import promClient from 'prom-client';

// Same Redis connection config as the queue — must match exactly
const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

/**
 * The processor function — called once per job.
 *
 * @param {import('bullmq').Job} job - The job object from Redis.
 *   job.name  → the job type string we passed in orderQueue.add(name, data)
 *   job.data  → the payload we passed in orderQueue.add(name, data)
 *   job.id    → unique job ID assigned by BullMQ
 *   job.attemptsMade → how many times this job has been attempted (for logging)
 */
const processOrderJob = async (job) => {
    const startTime = Date.now();
    
    logger.info(`Processing job [${job.id}] type="${job.name}" attempt=${job.attemptsMade + 1}`);

    try {
        // Route to the correct handler based on job type.
        // Using a switch makes it easy to add new job types later
        // (e.g., 'low-stock-alert', 'order-shipped') without changing this file's structure.
        switch (job.name) {
            case 'order-confirmation':
                await handleOrderConfirmation(job.data);
                break;

            default:
                // Don't throw — unknown job types should not block the queue.
                // Log and move on.
                logger.warn(`Unknown job type: ${job.name} — skipping`);
        }

        // Track success metrics
        const duration = Date.now() - startTime;
        workerMetrics.jobsProcessed.inc({
            queue: 'order-jobs',
            job_type: job.name,
            status: 'success'
        });
        workerMetrics.jobDuration.observe({
            queue: 'order-jobs',
            job_type: job.name
        }, duration);

    } catch (error) {
        // Track failure metrics
        workerMetrics.jobsProcessed.inc({
            queue: 'order-jobs',
            job_type: job.name,
            status: 'failed'
        });
        throw error; // Re-throw for BullMQ retry logic
    }
};

/**
 * Sends an order confirmation email to the customer.
 *
 * @param {object} data - Job payload set in order.service.js
 * @param {string} data.orderId
 * @param {string} data.customerEmail
 * @param {string} data.customerName
 * @param {number} data.totalAmount
 * @param {Array}  data.items
 */
const handleOrderConfirmation = async ({ orderId, customerEmail, customerName, totalAmount, items }) => {
    if (!customerEmail) {
        // This should never happen, but guard anyway — don't crash the worker
        logger.warn(`order-confirmation job for ${orderId}: missing customerEmail — skipping`);
        return;
    }

    await sendOrderConfirmationEmail(customerEmail, customerName, {
        orderId,
        totalAmount,
        items,
    });

    logger.info(`Order confirmation email sent → ${customerEmail} for order ${orderId}`);
};

/**
 * Create the Worker.
 * 'order-jobs' must match the queue name in order.queue.js exactly.
 * concurrency: 5 means this worker processes up to 5 jobs simultaneously.
 * Increase this if email sending is slow and jobs are piling up.
 */
const createWorker = () => {
    const worker = new Worker('order-jobs', processOrderJob, {
        connection,
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
    });

    // ── Event listeners for observability ─────────────────────────────────────────

    worker.on('completed', (job) => {
        logger.info(`Job [${job.id}] "${job.name}" completed successfully`);
    });

    worker.on('failed', (job, err) => {
        // BullMQ will retry automatically based on the attempts/backoff config in the queue.
        // This log fires on EACH failed attempt, not just the final one.
        logger.error(`Job [${job?.id}] "${job?.name}" failed (attempt ${job?.attemptsMade}): ${err.message}`);
    });

    worker.on('error', (err) => {
        // Connection-level errors (Redis down, etc.)
        logger.error(`Worker connection error: ${err.message}`);
    });

    // Graceful shutdown — finish current jobs before exiting
    process.on('SIGTERM', async () => {
        logger.info('Worker: SIGTERM received — closing gracefully');
        await worker.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('Worker: SIGINT received — closing gracefully');
        await worker.close();
        process.exit(0);
    });

    return worker;
};

// ── Start Worker with Database Connections ────────────────────────────────────
const start = async () => {
    try {
        logger.info('🚀 Starting Order Worker...');

        // Connect to all databases before processing jobs
        await connectDB();
        await connectPostgres();
        await connectRedis();

        logger.info('✅ Worker database connections established');

        // Create and start the worker
        const worker = createWorker();
        
        // Mark worker as active
        workerMetrics.workerActive.set({ queue: 'order-jobs' }, 1);

        // Start metrics endpoint for Prometheus
        const metricsApp = express();
        metricsApp.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', promClient.register.contentType);
                const metrics = await promClient.register.metrics();
                res.end(metrics);
            } catch (error) {
                logger.error('Error generating worker metrics', { error: error.message });
                res.status(500).end('Error generating metrics');
            }
        });
        
        metricsApp.listen(9091, () => {
            logger.info('📊 Worker metrics available at http://localhost:9091/metrics');
        });

        // Monitor queue depth every 15 seconds
        const monitorQueueDepth = async () => {
            const { orderQueue } = await import('./order.queue.js');
            
            setInterval(async () => {
                try {
                    const waiting = await orderQueue.getWaitingCount();
                    const active = await orderQueue.getActiveCount();
                    const delayed = await orderQueue.getDelayedCount();
                    const failed = await orderQueue.getFailedCount();
                    
                    workerMetrics.queueDepth.set({ queue: 'order-jobs', status: 'waiting' }, waiting);
                    workerMetrics.queueDepth.set({ queue: 'order-jobs', status: 'active' }, active);
                    workerMetrics.queueDepth.set({ queue: 'order-jobs', status: 'delayed' }, delayed);
                    workerMetrics.queueDepth.set({ queue: 'order-jobs', status: 'failed' }, failed);
                } catch (err) {
                    logger.error(`Failed to get queue depth: ${err.message}`);
                }
            }, 15000); // Every 15 seconds
        };
        
        await monitorQueueDepth();

        logger.info('✅ Order worker started — listening for jobs on "order-jobs" queue');
        logger.info(`📊 Worker concurrency: ${process.env.QUEUE_CONCURRENCY || 5}`);

    } catch (error) {
        logger.error(`❌ Failed to start worker: ${error.message}`);
        workerMetrics.workerActive.set({ queue: 'order-jobs' }, 0);
        process.exit(1);
    }
};

// Start the worker
start();
