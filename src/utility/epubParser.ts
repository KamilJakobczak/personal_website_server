import EPub from 'epub';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prismaClient';

export interface epubParserData {
  authorsIDs: { existing: string[] | null; new: string[] | null } | null;
  genresIDs: { existing: string[] | null; new: string[] | null } | null;
  publisher: {
    existing: {
      id: string;
      name: string;
    } | null;
    new: string | null;
  } | null;
  title: string | null;
  language: string | null;
  cover?: string;
  description: string | null;
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
      const authors = data.creator;
      const description = data.description;
      const genres = data.subject;
      const publisher = data.publisher;
      const title = data.title;
      const language = data.language;

      let parsedData = {
        localId,
        title: title ? title : null,
        description: description ? description : null,
        authorsIDs: await findAuthors(authors),
        genresIDs: await findGenres(genres),
        language: await checkLanguage(language),
        publisher: await findPublisher(publisher),
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

// FUNCTIONS

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

async function findPublisher(publisher: string) {
  if (!publisher) {
    return null;
  }

  const name = () => {
    switch (publisher) {
      case 'RM':
        return 'Wydawnictwo RM';
      case 'Sine Qua Non':
        return 'SQN';
      default:
        return publisher;
    }
  };
  const findPublisher = await prisma.publisher.findUnique({
    where: {
      name: name(),
    },
  });
  if (findPublisher) {
    return {
      existing: { id: findPublisher?.id, name: findPublisher?.name },
      new: null,
    };
  }
  {
    return {
      existing: null,
      new: publisher,
    };
  }
}

async function checkLanguage(language: string) {
  if (!language) {
    return null;
  }
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
  if (!authors) {
    return null;
  }
  const authorsArr = authors.split(',');
  const splitNamesArr: Array<string[]> = [];

  authorsArr.forEach(author => {
    const startingWhitespace = author.startsWith(' ');
    const endingWhitespace = author.endsWith(' ');
    if (startingWhitespace) {
      const newAuthorStr = author.substring(1);
      const splitName = newAuthorStr.split(' ');
      splitNamesArr.push(splitName);
    } else if (endingWhitespace) {
      const newAuthorStr = author.substring(0, author.length - 1);
      const splitName = newAuthorStr.split(' ');
      splitNamesArr.push(splitName);
    } else if (startingWhitespace && endingWhitespace) {
      const newAuthorStr = author.substring(1).substring(0, author.length - 1);
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
  const newAuthors: Array<string> = [];

  for (let i = 0; i < splitNamesArr.length; i++) {
    let nameArr = splitNamesArr[i];
    const author = await prisma.author.findFirst({
      where: {
        lastName: nameArr[nameArr.length - 1],
        AND: { firstName: nameArr[0] },
      },
    });
    if (author) {
      authorsIDs.push(author.id);
    }
    if (!author) {
      newAuthors.push(nameArr.join(' '));
    }
  }

  return {
    existing: authorsIDs.length > 0 ? authorsIDs : null,
    new: newAuthors.length > 0 ? newAuthors : null,
  };
}

async function findGenres(genres: string) {
  if (!genres) {
    return null;
  }

  const genresArr = genres.split(',');
  const splitGenresArr: Array<string> = [];

  genresArr.forEach(genre => {
    if (genre.startsWith(' ')) {
      const newGenreStr = genre.substring(1);
      splitGenresArr.push(newGenreStr);
    } else if (genre.endsWith(' ')) {
      const newGenreStr = genre.substring(0, genre.length - 1);
      splitGenresArr.push(newGenreStr);
    } else if (genre.startsWith(' ') && genre.endsWith(' ')) {
      const newGenreStr = genre.substring(1).substring(0, genre.length - 1);
      splitGenresArr.push(newGenreStr);
    } else {
      splitGenresArr.push(genre);
    }
  });

  const genresIDs: Array<string> = [];
  const newGenres: Array<string> = [];
  for (let i = 0; i < splitGenresArr.length; i++) {
    const element = splitGenresArr[i];
    const genre = await prisma.genre.findFirst({
      where: {
        name: {
          equals: element,
          mode: 'insensitive',
        },
      },
    });
    if (genre) {
      genresIDs.push(genre.id);
    }
    if (!genre) {
      newGenres.push(element);
    }
  }
  return {
    existing: genresIDs ? genresIDs : null,
    new: newGenres ? newGenres : null,
  };
}
