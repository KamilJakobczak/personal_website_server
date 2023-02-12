import express from 'express';
import path from 'path';
import { coverResize } from '../utility/coverResize';
import fs from 'fs';
export const imagesRouter = express.Router();
const imagesDir = path.join(__dirname, '..', '..', 'images');

imagesRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

imagesRouter.get('/covers/:bookId/:size', async (req, res) => {
  const { bookId, size } = req.params;
  const coversPath = path.join(imagesDir, 'covers');

  const filePath = path.join(coversPath, bookId, `${size}.jpg`);

  const fileExists = fs.existsSync(filePath);

  const mediumPath = path.join(coversPath, bookId, 'medium.jpg');
  const mediumExists = fs.existsSync(mediumPath);
  const smallPath = path.join(coversPath, bookId, 'small.jpg');
  const smallExists = fs.existsSync(smallPath);

  if (fileExists) {
    res.sendFile(filePath);
  } else if (size === 'big' && mediumExists) {
    res.sendFile(mediumPath);
  } else if (size === 'medium' && smallExists) {
    res.sendFile(smallPath);
  } else {
    console.log('Something went wrong with preparing the cover for this one');
    res.send('Something went wrong with preparing the cover for this one');
  }

  coverResize(path.join(coversPath, bookId, 'original.jpg'));
});
