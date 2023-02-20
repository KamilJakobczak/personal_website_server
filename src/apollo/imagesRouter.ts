import express from 'express';
import path from 'path';
import { coverResize } from '../utility/coverResize';
import fs from 'fs';
import sharp from 'sharp';

export const imagesRouter = express.Router();
const imagesDir = path.join(__dirname, '..', '..', 'files', 'images');

imagesRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

imagesRouter.get('/covers/:bookId/:size', async (req, res) => {
  const { bookId, size } = req.params;
  const coversPath = path.join(imagesDir, 'covers');

  const bookDir = path.join(coversPath, bookId);
  const bookDirExists = fs.existsSync(bookDir);
  if (!bookDirExists) {
    res.send('no covers avaiable for this one');
    res.end();
  }

  const filePath = path.join(bookDir, `${size}.jpg`);

  const fileExists = fs.existsSync(filePath);

  const originalPath = path.join(coversPath, bookId, 'original.jpg');
  const originalExists = fs.existsSync(originalPath);
  const originalHeight =
    originalExists && (await sharp(originalPath).metadata()).height;

  const mediumPath = path.join(coversPath, bookId, 'medium.jpg');
  const mediumExists = fs.existsSync(mediumPath);
  const mediumHeight =
    mediumExists && (await sharp(mediumPath).metadata()).height;

  const smallPath = path.join(coversPath, bookId, 'small.jpg');
  const smallExists = fs.existsSync(smallPath);
  const smallHeight = smallExists && (await sharp(smallPath).metadata()).height;

  if (fileExists) {
    res.sendFile(filePath);
  } else if (size === 'big') {
    if (originalHeight && mediumHeight) {
      if (originalHeight > mediumHeight) {
        res.sendFile(originalPath);
      } else res.sendFile(mediumPath);
    }
  } else if (size === 'medium') {
    if (originalHeight && smallHeight) {
      if (originalHeight > smallHeight) {
        res.send(originalPath);
      } else {
        res.send(smallPath);
      }
    }
  } else {
    console.log('Something went wrong with preparing the cover for this one');
    res.send('Something went wrong with preparing the cover for this one');
  }

  // coverResize(path.join(coversPath, bookId, 'original.jpg'));
});
imagesRouter.get('/uploaded/covers/:id', async (req, res) => {
  const { id } = req.params;
  const tempDir = path.join(__dirname, '..', '..', 'files', 'images', 'temp');
  const filePath = path.join(tempDir, 'covers', id);
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    console.log('error');
  } else {
    res.sendFile(filePath);
  }
});
