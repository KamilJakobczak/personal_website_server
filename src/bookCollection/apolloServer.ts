import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { Express } from 'express';
import { Server } from 'http';
import { prisma, Context } from './prismaClient';
import schema from '../graphql/schema';
import config from '../../config';

const port: string = config.port || '3333';
const host: string = config.host || '0.0.0.0';
console.log(port, host);
export const startApolloServer = async (app: Express, httpServer: Server) => {
  const server = new ApolloServer({
    schema,
    context: async ({ req, res }: any): Promise<Context> => {
      return { prisma, req, res };
    },
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: config.graphqlAPI,
  });

  httpServer.listen({ port, host });
  console.log(`Apollo server ready at http://localhost:${port}`);
};
