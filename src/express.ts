// Core Modules
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
// Middleware
import { bookSessions } from './bookCollection/sessions';
import { codingSessions } from './codingPlayground/sessions';
// Route Handlers
import { codingProjectRouter } from './codingPlayground/routes';
import { collectionRouter } from './bookCollection/routes';
import { imagesRouter } from './bookCollection/imagesRouter';
import { uploadRouter } from './bookCollection/uploadRouter';
// Configuration
import config from '../config';

// Create Express App
export const app = express();

// Middleware Setup
// Compression middleware
app.use(compression());
// JSON parsing middleware
app.use(express.json());
// HTTP request logger middleware
app.use(morgan('combined'));
// URL-encoded form data middleware
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: `https://${config.host}${config.frontPort ? ':' + config.frontPort : null}`,
    methods: ['POST', 'GET', 'PUT', 'OPTIONS', 'HEAD'],
    credentials: true,
  })
);

// Routes
app.use('/api/images', imagesRouter);
app.use('/api/graphql', bookSessions, collectionRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/projects/coding', codingSessions, codingProjectRouter);

// Serve Frontend
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
// });
app.get('/*', async (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});
