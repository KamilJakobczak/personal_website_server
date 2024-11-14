// Apollo and Express
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { Express } from 'express';
import { Server } from 'http';
// App Modules
import { prisma, Context } from './prismaClient';
import schemaWithMiddleware from '../graphql/schema';
// Configuration
import config from '../../config';

export const startApolloServer = async (app: Express, httpServer: Server) => {
  try {
    const server = new ApolloServer<Context>({
      schema: schemaWithMiddleware,
      // context: async ({ req, res }): Promise<Context> => {
      //   return { prisma, req, res, user: req.session.user };
      // },
      csrfPrevention: true,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      introspection: process.env.NODE_ENV !== 'production',
    });

    await server.start();

    app.use(
      `${config.graphqlAPI}`,
      expressMiddleware(server, {
        context: async ({ req, res }): Promise<Context> => {
          return { prisma, req, res, user: req.session.user };
        },
      })
    );
    // server.applyMiddleware({
    //   app,
    //   path: config.graphqlAPI,
    // });

    console.log(`Apollo server ready at http://${config.host}:${config.backPort}${config.graphqlAPI}`);
  } catch (error) {
    console.error('Apollo Server Initialization Error:', error);
  }
};
