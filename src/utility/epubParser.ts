import EPub from 'epub';
import path from 'path';
import fs from 'fs';

export interface epubParserData {
  author: string;
  genre: string;
  publisher: string;
  title: string;
  language: string;
  cover?: string;
}

export const epubParser = async (filepath: string, fileName: string) => {
  return new Promise<epubParserData>(function (resolve, reject) {
    const epub = new EPub(
      filepath,
      path.join(__dirname, '..', '..', 'files', 'temp', 'covers'),
      '../../files/temp'
    );
    epub.on('end', async function () {
      const localId = fileName;

      const data = epub.metadata;

      const cover = data.cover;
      const author = data.creator;
      const description = data.description;

      const genre = data.subject;
      const publisher = data.publisher;
      const title = data.title;
      const language = data.language;

      let parsedData = {
        author,
        genre,
        publisher,
        title,
        language,
        localId,
      };

      if (cover === undefined) {
        console.log(`${title} has no cover`);
      } else {
        const coverPath = path.join(
          __dirname,
          '..',
          '..',
          'files',
          'images',
          'covers',
          `${localId}.jpg`
        );
        const isCover = extractImage(epub, cover, coverPath);
        if (isCover !== false) {
          parsedData = { ...parsedData, ...{ cover: coverPath } };
        }
      }
      resolve(parsedData);
    });
    epub.parse();
  });
};

//helpers

function extractImage(
  epub: EPub,
  cover: string,
  coverPath: string
): void | boolean {
  epub.getImage(cover, async function (error, img, mimeType) {
    try {
      fs.writeFileSync(coverPath, img);
    } catch (err) {
      console.log(err);
      return false;
    }
  });
}
