import { Request } from 'express';
import { Role } from '@prisma/client';

interface SessionUser {
  id: string;
  profileId: string;
  role: Role;
}

export const isSessionUser = (user: any): user is SessionUser => {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.profileId === 'string' &&
    typeof user.role === 'string'
  );
};

export function assertSessionUser(
  req: Request
): asserts req is Request & { session: { user: SessionUser } } {
  if (!isSessionUser(req.session.user)) {
    throw new Error('Session user is not valid');
  }
}
