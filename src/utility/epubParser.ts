import EPub from 'epub';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prismaClient';

export interface epubParserData {
  authorsIDs: string[];
  genre: string;
  publisher: {
    id?: string;
    name?: string;
  };
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
      console.log(data);
      const cover = data.cover;
      const authors = data.creator;
      const description = data.description;

      const genre = data.subject;
      const publisher = data.publisher;
      const title = data.title;
      const language = data.language;

      const findPublisher = await prisma.publisher.findUnique({
        where: {
          name: publisher === 'Sine Qua Non' ? 'SQN' : publisher,
        },
      });

      const authorsIDs = await findAuthors(authors);

      let parsedData = {
        authorsIDs: authorsIDs || [],
        genre,
        publisher: { id: findPublisher?.id, name: findPublisher?.name },
        title,
        language: await checkLanguage(language),
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
          'temp',
          'covers',
          `${localId}.jpg`
        );
        const isCover = extractImage(epub, cover, coverPath);
        if (isCover !== false) {
          parsedData = {
            ...parsedData,
            ...{
              cover: `http://localhost:4000/api/images/uploaded/covers/${localId}.jpg`,
            },
          };
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

async function checkLanguage(language: string) {
  switch (language) {
    case 'pl-pl':
      return 'Polish';
    case 'pl':
      return 'Polish';
    case 'en-gb':
      return 'English';
    case 'en':
      return 'English';
    case 'en-us':
      return 'English';

    default:
      return '';
  }
}

async function findAuthors(authors: string) {
  const authorsArr = authors.split(',');
  const splitNamesArr: Array<string[]> = [];

  authorsArr.forEach(author => {
    const length = author.length;
    if (author.startsWith(' ')) {
      const newAuthorStr = author.substring(1);
      const splitName = newAuthorStr.split(' ');
      splitNamesArr.push(splitName);
    } else if (author.endsWith(' ')) {
      const newAuthorStr = author.substring(0, length - 1);
      const splitName = newAuthorStr.split(' ');
      splitNamesArr.push(splitName);
    } else {
      const splitName = author.split(' ');
      let newSplitName: Array<string> = [];
      for (let i = 0; i < splitName.length; i++) {
        if (!splitName[i].includes('.')) {
          newSplitName.push(splitName[i]);
        }
      }

      splitNamesArr.push(newSplitName);
    }
  });

  const authorsIDs: Array<string> = [];

  for (let i = 0; i < splitNamesArr.length; i++) {
    let nameArr = splitNamesArr[i];
    const author = await prisma.author.findFirst({
      where: {
        lastName: nameArr[nameArr.length - 1],
        AND: { firstName: nameArr[0] },
      },
    });
    author && authorsIDs.push(author.id);
    if (i === splitNamesArr.length - 1) {
      return authorsIDs;
    }
  }
}
