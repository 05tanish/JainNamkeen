import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { PrismaClient } = pkg;
const { Pool } = pg;

/**
 * PostgreSQL connection via Prisma with pg adapter
 * Singleton pattern to prevent multiple instances
 */
const globalForPrisma = globalThis;

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Connect to PostgreSQL database
 */
export const connectPostgres = async () => {
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL connected successfully via Prisma');
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        process.exit(1);
    }
};


/**
 * Disconnect from PostgreSQL database
 */
export const disconnectPostgres = async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('PostgreSQL disconnected');
};

export default prisma;
