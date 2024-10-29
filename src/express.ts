// Core Modules
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
// Middleware
import { bookSessions } from './bookCollection/sessions';
import { codingSessions } from './codingPlayground/sessions';
// Route Handlers
import { codingProjectRouter } from './codingPlayground/routes';
import { collectionRouter } from './bookCollection/routes';
import { imagesRouter } from './bookCollection/imagesRouter';
import { uploadRouter } from './bookCollection/uploadRouter';

export const app = express();

// Logger middleware
app.use((req, res, next) => {
  console.log('Time: ', Date.now());
  next();
});

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
    origin: 'https://localhost:3000',
    methods: ['POST', 'GET', 'PUT', 'OPTIONS', 'HEAD'],
    credentials: true,
  })
);
// Routes
app.use('/api/images', imagesRouter);
app.use('/api/graphql', bookSessions, collectionRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/projects/coding', codingSessions, codingProjectRouter);
