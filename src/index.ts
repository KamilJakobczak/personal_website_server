import http from 'http';
import { startApolloServer } from './bookCollection/apolloServer';
import { app } from './express';

// Uncomment if you need HTTPS options in the future
// const options = { // key: fs.readFileSync('key.pem'),
// cert: fs.readFileSync('cert.pem'),

const httpServer = http.createServer(app);
startApolloServer(app, httpServer);
