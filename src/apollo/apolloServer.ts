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

interface ExpressContext {
  req: Express.Request;
  res: Express.Response;
}

export const startApolloServer = async (app: Express, httpServer: Server) => {
  const server = new ApolloServer({
    schema,
    context: async ({ req, res }: any): Promise<Context> => {
      const userInfo = await getUserFromToken(req.headers.authorization);
      // console.log(req.headers);
      // console.log(req.headers);
      res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin,X-Requested-With,content-type,set-cookie'
      );
      res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE'
      );
      // const userInfo = { profileId: '', userId: '' };
      return { prisma, userInfo, req, res };
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
