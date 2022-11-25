import http from 'http';
import * as dotenv from 'dotenv';
import { startApolloServer } from './apollo/apolloServer';
import { app } from './express';

dotenv.config();
const httpServer = http.createServer(app);

startApolloServer(app, httpServer);
