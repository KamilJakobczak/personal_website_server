import gql from 'graphql-tag';
import { Context } from '../../prismaClient';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { JWT_SIGNATURE } from '../keys';

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
    ): AuthPayload
  }

  type User implements Node {
    id: ID!
    name: String
    email: String!
    profile: Profile
  }

  type AuthPayload {
    userErrors: [userError!]!
    token: String
  }
  input CredentialsInput {
    email: String!
    password: String!
  }
`;

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
    email: string;
    password: string;
  };
}
interface UserPayload {
  userErrors: {
    message: string;
  }[];
  token: string | null;
}

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
      { prisma }: Context
    ): Promise<UserPayload> => {
      const { email, password } = credentials;
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        return {
          userErrors: [{ message: 'Invalid credentials' }],
          token: null,
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
        };
      }
      const profile = await prisma.profile.findUnique({
        where: {
          userId: user.id,
        },
      });

      return {
        userErrors: [{ message: '' }],
        token: JWT.sign(
          { userId: user.id, profileId: profile?.id },
          JWT_SIGNATURE,
          {
            expiresIn: 360000,
          }
        ),
      };
    },
    signup: async (
      _: any,
      { credentials, name, bio }: SignupArgs,
      { prisma }: Context
    ): Promise<UserPayload> => {
      const { email, password } = credentials;
      const isEmail = validator.isEmail(email);

      if (!isEmail) {
        return {
          userErrors: [
            {
              message: 'Invalid email',
            },
          ],
          token: null,
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

      return {
        userErrors: [{ message: '' }],
        token: JWT.sign(
          {
            userId: user.id,
            email: user.email,
          },
          JWT_SIGNATURE,
          {
            expiresIn: 360000,
          }
        ),
      };
    },
  },
};
