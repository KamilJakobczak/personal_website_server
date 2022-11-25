import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { Express } from 'express';
import { Server } from 'http';
import { prisma, Context } from '../prismaClient';
import schema from '../graphql/schema';
import { getUserFromToken } from '../graphql/utils/getUserFromToken';

const port: number = 4000;

export const startApolloServer = async (app: Express, httpServer: Server) => {
  const server = new ApolloServer({
    schema,
    context: async ({ req }: any): Promise<Context> => {
      const userInfo = await getUserFromToken(req.headers.authorization);
      // const userInfo = { profileId: '', userId: '' };
      return { prisma, userInfo };
    },
    csrfPrevention: true,

    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // ApolloServerPluginLandingPageDisabled(),
    ],
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: '/api/graphql',
  });

  httpServer.listen({ port });
  console.log(`Apollo server ready at http://localhost:${port}`);
};
