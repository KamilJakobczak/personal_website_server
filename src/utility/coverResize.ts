import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

export const coverResize = async (filePath: string) => {
  const coverDir = path.join(filePath, '..');
  const coverHeight = (await sharp(filePath).metadata()).height;
  const bigExists = fs.existsSync(path.join(coverDir, 'big.jpg'));
  const mediumExists = fs.existsSync(path.join(coverDir, 'medium.jpg'));
  const smallExists = fs.existsSync(path.join(coverDir, 'small.jpg'));
  const thumbnailExists = fs.existsSync(path.join(coverDir, 'thumbnail.jpg'));

  if (coverHeight) {
    if (coverHeight >= 1000 && !bigExists) {
      if (coverHeight === 1000) {
        sharp(filePath).toFile(`${coverDir}/big.jpg`);
      }
      if (coverHeight > 1000) {
        sharp(filePath).resize({ height: 1000 }).toFile(`${coverDir}/big.jpg`);
      }
      sharp(filePath).resize({ height: 500 }).toFile(`${coverDir}/medium.jpg`);
      sharp(filePath).resize({ height: 200 }).toFile(`${coverDir}/small.jpg`);
    } else if (coverHeight >= 500 && coverHeight < 1000 && !mediumExists) {
      if (coverHeight === 500) {
        sharp(filePath).toFile(`${coverDir}/medium.jpg`);
      }
      if (coverHeight > 500) {
        sharp(filePath)
          .resize({ height: 500 })
          .toFile(`${coverDir}/medium.jpg`);
      }
      sharp(filePath).resize({ height: 200 }).toFile(`${coverDir}/small.jpg`);
    } else if (coverHeight >= 200 && coverHeight < 500 && !smallExists) {
      if (coverHeight === 200) {
        sharp(filePath).toFile(`${coverDir}/small.jpg`);
      } else {
        sharp(filePath).resize({ height: 200 }).toFile(`${coverDir}/small.jpg`);
      }
    }
    !thumbnailExists &&
      sharp(filePath)
        .resize({ height: 100 })
        .toFile(`${coverDir}/thumbnail.jpg`);
  }
};
