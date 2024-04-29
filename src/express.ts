import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { codingProjectRouter, codingSessions } from './routes';
import { collectionRouter } from './apollo/routes';
import { imagesRouter } from './apollo/imagesRouter';
import { uploadRouter } from './apollo/uploadRouter';

import { sessionConfig } from './sessions';

export const app = express();

app.use(function (req, res, next) {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/images', imagesRouter);

app.use('/api/graphql', sessionConfig, collectionRouter);

app.use('/api/upload', uploadRouter);
app.use(
  cors({
    origin: 'https://localhost:3000',
    methods: ['POST', 'GET', 'PUT', 'OPTIONS', 'HEAD'],
    credentials: true,
  })
);
// app.use(cors);
app.use('/api/projects/coding', codingSessions, codingProjectRouter);
