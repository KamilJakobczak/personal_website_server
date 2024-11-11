import * as jwt from 'jsonwebtoken';
import config from '../../../config';

export const getUserFromToken = async (token: string) => {
  if (!token) {
    return null;
  }
  return jwt.verify(token, config.jwt) as {
    userId: string;
    profileId: string;
  };
};
