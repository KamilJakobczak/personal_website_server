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

export type PrismaModel = keyof PrismaClient;
export const deleteRecord = async (model: PrismaModel, id: string) => {
  const modelDelegate = prisma[model] as unknown as {
    delete: (args: { where: { id: string } }) => Promise<any>;
  };

  if (!modelDelegate.delete) {
    throw new Error(`Model ${model} does not exist or is not deletable`);
  }

  try {
    const deletedRecord = await modelDelegate.delete({
      where: { id },
    });
    console.log(`Deleted ${model}:`, deletedRecord);
    return {
      userErrors: [{ message: '' }],
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting ${model}`, error);
    throw Error;
  }
};
