import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { SessionData } from 'express-session';

export const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  req: Request;
  res: Response;
  user?: SessionData['user'];
}
