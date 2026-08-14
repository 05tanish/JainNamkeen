import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// Initialize connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    log: ['error'],
});

async function main() {
    console.log('🔍 Verifying seeded users in database...');

    const expectedUsers = [
        { email: 'user@demo.com', role: 'USER' },
        { email: 'admin@demo.com', role: 'ADMIN' },
        { email: 'staff@demo.com', role: 'STAFF' }
    ];

    let allFound = true;

    for (const expected of expectedUsers) {
        const user = await prisma.user.findUnique({
            where: { email: expected.email },
            select: { email: true, role: true, isActive: true }
        });

        if (user) {
            if (user.role === expected.role) {
                console.log(`✅ Found user: ${user.email} with correct role: ${user.role} (Active: ${user.isActive})`);
            } else {
                console.error(`❌ User role mismatch for ${expected.email}: expected ${expected.role}, found ${user.role}`);
                allFound = false;
            }
        } else {
            console.error(`❌ User not found: ${expected.email}`);
            allFound = false;
        }
    }

    if (allFound) {
        console.log('🎉 All user verifications passed successfully!');
        process.exit(0);
    } else {
        console.error('⚠️ Verification failed: Some expected users were missing or incorrect.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Error during user verification:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
