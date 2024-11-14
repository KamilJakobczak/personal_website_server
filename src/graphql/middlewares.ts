import { Request, Response, NextFunction } from 'express';
import { IMiddlewareFunction } from 'graphql-middleware';
import { Context, prisma } from '../bookCollection/prismaClient';

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No session cookie, log in first' });
  }
  const { id } = req.session.user;
  const dbUser = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!dbUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  next();
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // assertSessionUser(req);
  if (req.session.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied, admin rights required' });
  }
  next();
};

export const combinedMiddleware: IMiddlewareFunction = async (resolve, parent, args, context: Context, info) => {
  await new Promise<void>((resolve, reject) => {
    // Check if the user is logged in
    isLoggedIn(context.req, context.res, (err: any) => {
      if (err) return reject(err);
      // Check if the logged-in user is an admin
      isAdmin(context.req, context.res, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
  // Proceed with the resolver function
  return resolve(parent, args, context, info);
};

export const isLoggedInMiddleware: IMiddlewareFunction = async (resolve, parent, args, context: Context, info) => {
  await new Promise<void>((resolve, reject) => {
    isLoggedIn(context.req, context.res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
  return resolve(parent, args, context, info);
};
