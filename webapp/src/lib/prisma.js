import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function getClient() {
  if (!globalForPrisma._prismaClient) {
    globalForPrisma._prismaClient = new PrismaClient();
  }
  return globalForPrisma._prismaClient;
}

const prisma = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export default prisma;
export { prisma };
