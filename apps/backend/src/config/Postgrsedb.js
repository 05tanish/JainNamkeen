import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { PrismaClient } = pkg;
const { Pool } = pg;

const globalForPrisma = globalThis;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
        console.log('✅ PostgreSQL connected successfully via Prisma');
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        process.exit(1);
    }
};

export const disconnectPostgres = async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('PostgreSQL disconnected');
};

export { prisma };
