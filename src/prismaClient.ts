import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({});

export interface Context {
  prisma: PrismaClient;
  userInfo: {
    profileId: string;
    userId: string;
  } | null;
}
