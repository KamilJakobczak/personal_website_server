import http from 'http';
import dotenv from 'dotenv';
import { startApolloServer } from './apollo/apolloServer';
import { app } from './express';
// import fs from 'fs';
dotenv.config();

// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem'),
// };
const httpServer = http.createServer(app);

startApolloServer(app, httpServer);
