import { Worker } from 'bullmq';
import { queueConnection } from '../config/queue.js';
import { processVerificationEmail, processPasswordResetEmail, processOrderConfirmationEmail } from './emailService.js';
import { logger } from './logger.js';

export const emailWorker = new Worker('email-queue', async job => {
    logger.info(`Processing email job ${job.id} of type ${job.name}`);
    const { data } = job;
    
    try {
        if (job.name === 'send-verification-email') {
            await processVerificationEmail(data.email, data.name, data.verificationToken);
        } else if (job.name === 'send-password-reset-email') {
            await processPasswordResetEmail(data.email, data.name, data.resetToken);
        } else if (job.name === 'send-order-confirmation-email') {
            await processOrderConfirmationEmail(data.email, data.name, data.orderDetails);
        } else {
            logger.warn(`Unknown job name: ${job.name}`);
        }
    } catch (error) {
        logger.error(`Failed to process email job ${job.id}: ${error.message}`);
        throw error; // Re-throw so BullMQ can handle retries
    }
}, { connection: queueConnection });

emailWorker.on('completed', job => {
    logger.info(`Email job ${job.id} has been completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job.id} has failed: ${err.message}`);
});
