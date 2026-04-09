import { PrismaClient } from '../app/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.startsWith('prisma+postgres://')) {
  try {
    const url = new URL(databaseUrl);
    const apiKey = url.searchParams.get('api_key');
    if (apiKey) {
      const decodedInfo = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf8'));
      if (decodedInfo.databaseUrl) {
        databaseUrl = decodedInfo.databaseUrl;
      }
    }
  } catch (err) {
    console.error('Failed to parse prisma+postgres URL', err);
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: ['query'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
