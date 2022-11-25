import { JWT_SIGNATURE } from '../keys';
import jwt from 'jsonwebtoken';

export const getUserFromToken = async (token: string) => {
  if (!token) {
    return null;
  }
  return jwt.verify(token, JWT_SIGNATURE) as {
    userId: string;
    profileId: string;
  };
};
