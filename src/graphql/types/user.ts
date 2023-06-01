import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import validator from 'validator';
import bcrypt from 'bcryptjs';

import { User, Prisma } from '@prisma/client';

enum ROLE {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
type Credentials = {
  email: string;
  password: string;
};

interface SignupArgs {
  credentials: Credentials;
  name: string;
  bio: string;
}
interface SigninArgs {
  credentials: Credentials;
}
interface UserPayload {
  authenticated: boolean;
  userErrors: {
    message: string;
  }[];
  user: User | Prisma.Prisma__UserClient<User> | null;
}
interface AuthPayload {
  authenticated: boolean;
  userErrors: {
    message: string;
  }[];
  user: {
    id: string;
    profileId: string;
    role: ROLE;
  } | null;
}

export const user = gql`
  extend type Query {
    checkLogin: AuthPayload!
    user(id: ID!): User! 
  }

  type Mutation {
    signin(credentials: CredentialsInput!): UserPayload!
    signup(
      credentials: CredentialsInput!
      name: String!
      bio: String
    ): UserPayload!
    signout:AuthPayload!
  }

  type User implements Node {
    id: ID!
    name: String
    role: ROLE
    email: String!
    profile: Profile
  }

  type UserPayload {
    authenticated: Boolean!
    userErrors: [userError!]!
    user: User
  }

  type AuthPayload {
    authenticated: Boolean!
    userErrors: [userError!]!
    user: sessionUser
   
  }
  type sessionUser {
    id: String
    profileId: String
    role: String
  }
  input CredentialsInput {
    email: String!
    password: String!
  }
  enum ROLE {
    ADMIN
    USER
  }
`;

export const userResolvers = {
  Query: {
    checkLogin: async (
      _: any,
      __: any,
      { req }: Context
    ): Promise<AuthPayload> => {
      if (req.session.user) {
        console.log(req.session.user);
        return {
          authenticated: true,
          userErrors: [{ message: '' }],
          user: req.session.user,
        };
      }
      return {
        authenticated: false,
        userErrors: [{ message: '' }],
        user: null,
      };
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
      const { email, password } = credentials;
      const user = await prisma.user.findUnique({
        where: {
          email: email,
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
    signout: async (
      _: any,
      __: any,
      { req }: Context
    ): Promise<AuthPayload> => {
      req.session.destroy();

      return {
        authenticated: false,
        userErrors: [{ message: '' }],
        user: null,
      };
    },
  },
};
