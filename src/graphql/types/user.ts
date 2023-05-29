import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { JWT_SIGNATURE } from '../keys';
import { User, Prisma } from '@prisma/client';

interface SignupArgs {
  credentials: {
    email: string;
    password: string;
  };
  name: string;
  bio: string;
}
interface SigninArgs {
  credentials: {
    username: string;
    password: string;
  };
}
interface UserPayload {
  userErrors: {
    message: string;
  }[];
  token: string | null;
  user: User | Prisma.Prisma__UserClient<User> | null;
}

export const user = gql`
  extend type Query {
    me: User
    user(id: ID!): User!
   
    
  }

  type Mutation {
    signin(credentials: CredentialsInput!): AuthPayload!
    signup(
      credentials: CredentialsInput!
      name: String!
      bio: String
    ): SignupPayload!
    
  }

  type User implements Node {
    id: ID!
    name: String
    email: String!
    profile: Profile
  }

  type SignupPayload {
    userErrors: [userError!]!
    token: String
    user: User
  }
  type AuthPayload {
    userErrors: [userError!]!
    token: String
  }
  input CredentialsInput {
    username: String!
    password: String!
  }
`;

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, { userInfo, prisma }: Context) => {
      if (!userInfo) {
        return null;
      }
      return prisma.user.findUnique({
        where: {
          id: userInfo.userId,
        },
      });
    },
    user: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.user.findUnique({
        where: { id },
      });
    },
  },
  User: {
    profile: async ({ id }: { id: string }, __: any, { prisma }: Context) => {
      return prisma.profile.findUnique({
        where: {
          userId: id,
        },
      });
    },
  },
  Mutation: {
    signin: async (
      _: any,
      { credentials }: SigninArgs,
      { prisma, req }: Context
    ): Promise<UserPayload> => {
      const { username, password } = credentials;
      const user = await prisma.user.findUnique({
        where: {
          email: username,
        },
      });

      if (!user) {
        return {
          userErrors: [{ message: 'Invalid credentials' }],
          token: null,
          user: null,
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          userErrors: [
            {
              message: 'Invalid credentials',
            },
          ],
          token: null,
          user: null,
        };
      }
      const profile = await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      });

      const token = JWT.sign(
        { userId: user.id, profileId: profile?.id },
        JWT_SIGNATURE,
        {
          expiresIn: 864000000,
        }
      );

      const sessionUser = {
        id: user.id,
        profileId: profile?.id,
        role: user.role,
      };
      req.session.user = sessionUser;

      // const cookieOptions = {
      //   httpOnly: true,
      //   maxAge: 1000 * 60 * 60 * 24 * 10,
      //   sameSite: 'none',
      //   secure: true,
      //   requireSSL: false,
      // };

      return {
        userErrors: [{ message: '' }],
        token,
        user: null,
      };
    },
    signup: async (
      _: any,
      { credentials, name, bio }: SignupArgs,
      { prisma, req, res }: Context
    ): Promise<UserPayload> => {
      const { email, password } = credentials;
      const isEmail = validator.isEmail(email);

      const userExists = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (userExists) {
        return {
          userErrors: [{ message: 'This email is already in use' }],
          token: null,
          user: null,
        };
      }

      if (!isEmail) {
        return {
          userErrors: [
            {
              message: 'Invalid email',
            },
          ],
          token: null,
          user: null,
        };
      }

      const isValidPassword = validator.isLength(password, { min: 5 });

      if (!isValidPassword) {
        return {
          userErrors: [
            {
              message: 'Invalid password',
            },
          ],
          token: null,
          user: null,
        };
      }

      const isValidName = validator.isLength(name, { min: 2 });

      if (!isValidName) {
        return {
          userErrors: [
            {
              message: 'Invalid name or bio',
            },
          ],
          token: null,
          user: null,
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });
      const token = JWT.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SIGNATURE,
        {
          expiresIn: 864000000,
        }
      );
      const cookieOptions = {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 10,
        sameSite: 'none',
        secure: true,
        requireSSL: false,
      };

      // res.cookie('authorization', token, cookieOptions);
      // res.cookie('loggedIn', true, {
      //   httpOnly: false,
      //   maxAge: 1000 * 60 * 60 * 24 * 10,
      //   sameSite: 'none',
      //   secure: true,
      //   requireSSL: false,
      // });

      return {
        userErrors: [{ message: '' }],
        token,
        user: user,
      };
    },
  },
};
