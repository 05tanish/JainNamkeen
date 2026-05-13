import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../utils/logger.js';

const { PrismaClient } = pkg;
const { Pool } = pg;

const globalForPrisma = globalThis;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration
    max: 20, // Maximum number of clients in pool
    min: 2,  // Minimum number of clients in pool
    idleTimeoutMillis: 30000, // Close idle clients after 30s
    connectionTimeoutMillis: 5000, // Timeout if can't connect in 5s
    maxUses: 7500, // Close connection after 7500 uses (prevents memory leaks)
});

// Pool event handlers for monitoring
pool.on('connect', (client) => {
    logger.debug('New PostgreSQL client connected to pool');
});

pool.on('acquire', (client) => {
    logger.debug('PostgreSQL client acquired from pool');
});

pool.on('error', (err, client) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

pool.on('remove', (client) => {
    logger.debug('PostgreSQL client removed from pool');
});

const adapter = new PrismaPg(pool);

const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export const connectPostgres = async () => {
    try {
        await prisma.$connect();
        // Use logger (Winston) not console.log — so this appears in structured logs / Loki
        logger.info('✅ PostgreSQL connected successfully via Prisma');
    } catch (error) {
        logger.error(`❌ PostgreSQL connection failed: ${error.message}`);
        process.exit(1);
    }
};

export const disconnectPostgres = async () => {
    await prisma.$disconnect();
    await pool.end();
    logger.info('PostgreSQL disconnected');
};

export { prisma };
