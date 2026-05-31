import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis;

function createClient() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new pg.Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 2,
    });
    pool.on('connect', client => { client.query('SET search_path TO grupo1_academico'); });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prismaAcademico = new Proxy(
  {},
  {
    get(_, prop) {
      if (!globalForPrisma._prismaAcademicoClient) {
        globalForPrisma._prismaAcademicoClient = createClient();
      }
      const client = globalForPrisma._prismaAcademicoClient;
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export default prismaAcademico;
export { prismaAcademico as prisma };
