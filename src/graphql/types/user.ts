import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import validator from 'validator';
import bcrypt from 'bcryptjs';

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
  authenticated: boolean;
  userErrors: {
    message: string;
  }[];
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
    ): AuthPayload!
  }

  type User implements Node {
    id: ID!
    name: String
    email: String!
    profile: Profile
  }

  type AuthPayload {
    authenticated: Boolean!
    userErrors: [userError!]!
    user: User
   
  }
  input CredentialsInput {
    username: String!
    password: String!
  }
`;

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, { prisma, req }: Context) => {
      if (!req.session.user) {
        return null;
      }
      return prisma.user.findUnique({
        where: {
          id: req.session.user.id,
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
          authenticated: false,
          userErrors: [{ message: 'Invalid credentials' }],
          user: null,
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          authenticated: false,
          userErrors: [
            {
              message: 'Invalid credentials',
            },
          ],
          user: null,
        };
      }
      const profile = await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      });

      const sessionUser = {
        id: user.id,
        profileId: profile?.id,
        role: user.role,
      };
      req.session.user = sessionUser;

      return {
        authenticated: true,
        userErrors: [{ message: '' }],
        user,
      };
    },
    signup: async (
      _: any,
      { credentials, name, bio }: SignupArgs,
      { prisma, req }: Context
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
          authenticated: false,
          userErrors: [{ message: 'This email is already in use' }],
          user: null,
        };
      }

      if (!isEmail) {
        return {
          authenticated: false,
          userErrors: [
            {
              message: 'Invalid email',
            },
          ],
          user: null,
        };
      }

      const isValidPassword = validator.isLength(password, { min: 5 });

      if (!isValidPassword) {
        return {
          authenticated: false,
          userErrors: [
            {
              message: 'Invalid password',
            },
          ],
          user: null,
        };
      }

      const isValidName = validator.isLength(name, { min: 2 });

      if (!isValidName) {
        return {
          authenticated: false,
          userErrors: [
            {
              message: 'Invalid name or bio',
            },
          ],
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

      const profile = await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      });

      const sessionUser = {
        id: user.id,
        profileId: profile?.id,
        role: user.role,
      };
      req.session.user = sessionUser;

      return {
        authenticated: true,
        userErrors: [{ message: '' }],
        user: user,
      };
    },
  },
};
