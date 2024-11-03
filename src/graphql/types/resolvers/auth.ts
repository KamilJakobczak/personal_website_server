import { Request, Response, NextFunction } from 'express';
import { Context, prisma } from '../../../bookCollection/prismaClient';

export const authCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if user is present in the session
  if (!req.session?.user) {
    return {
      userErrors: [{ message: 'Auth check failed' }],
    };
  }

  const { id } = req.session.user;
  // Fetch user from the database
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  // Handle user not found
  if (!user) {
    return {
      userErrors: [{ message: 'user not found' }],
    };
  }
  // Check user role
  if (user.role !== 'ADMIN') {
    return {
      userErrors: [
        { message: 'Not authorized to add records to the database' },
      ],
    };
  }
  return true;
};
