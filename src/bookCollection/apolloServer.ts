import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { Express } from 'express';

import { Server } from 'http';
import { prisma, Context } from './prismaClient';
import schema from '../graphql/schema';

const port: string = process.env.PORT || '4000';

export const startApolloServer = async (app: Express, httpServer: Server) => {
  const server = new ApolloServer({
    schema,
    context: async ({ req, res }: any): Promise<Context> => {
      return { prisma, req, res };
    },
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: '/api/graphql',
  });

  httpServer.listen({ port });
  console.log(`Apollo server ready at http://localhost:${port}`);
};
