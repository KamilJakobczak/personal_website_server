import EPub from 'epub';
import path from 'path';
import fs from 'fs';
import { prisma } from '../bookCollection/prismaClient';
import config from '../../config';

const { host } = config;

export interface epubParserData {
	authors: {
		existing: string[] | null;
		new:
			| {
					firstName: string;
					secondName: string;
					thirdName: string;
					lastName: string;
			  }[]
			| null;
	} | null;
	genres: { existing: string[] | null; new: string[] | null } | null;
	publisher: {
		existing: { id: string; name: string } | null;
		new: string | null;
	} | null;
	title: string | null;
	language: string | null;
	cover?: string;
	description: string | null;
	isbn: string | null;
	bookExists: boolean;
}

export const epubParser = async (
	filepath: string,
	fileName: string
): Promise<epubParserData> => {
	const coverTempPath = path.join(
		__dirname,
		'..',
		'..',
		'files',
		'images',
		'temp',
		'covers'
	);
	const epub = new EPub(
		filepath,
		path.join(__dirname, '..', '..', 'files', 'temp', 'covers'),
		'../../files/temp'
	);
	return new Promise<epubParserData>((resolve, reject) => {
		epub.on('end', async () => {
			try {
				const {
					title,
					creator,
					description,
					subject,
					ISBN,
					publisher,
					language,
					cover,
				} = epub.metadata;
				const localId = fileName;
				let bookExistsRecord = null;
				if (ISBN) {
					bookExistsRecord = await prisma.book.findFirst({
						where: {
							isbn: ISBN,
						},
					});
				}
				if (!bookExistsRecord && title) {
					bookExistsRecord = await prisma.book.findFirst({
						where: {
							title: {
								equals: title,
								mode: 'insensitive',
							},
						},
					});
				}
				const bookExists = !!bookExistsRecord;

				let parsedData: epubParserData = {
					title: title ?? null,
					description: description ?? null,
					isbn: ISBN ? ISBN : null,
					authors: await findAuthors(creator),
					genres: await findGenres(subject),
					language: await checkLanguage(language),
					publisher: await findPublisher(publisher),
					bookExists: bookExists,
				};

				if (cover) {
					const coverPath = path.join(coverTempPath, localId, '.jpg');
					try {
						await extractImage(epub, cover, coverPath);
						parsedData.cover = `${host}/api/images/uploaded/covers/${localId}.jpg`;
					} catch {
						console.warn(
							`[Cover Fail] Could not extract cover for ${title}`
						);
					}
				}
				resolve(parsedData);
			} catch (err) {
				console.error('[Parsing Error]', err);
				reject(err);
			}

			epub.on('error', error => {
				console.error('[EPUB Error]', error);
				reject(error);
			});
		});
		epub.parse();
		console.log(`[EPUB Parse Triggered] ${fileName}`);
	});
	//const epub = new EPub(
	// 	filepath,
	// 	path.join(__dirname, '..', '..', 'files', 'temp', 'covers'),
	// 	'../../files/temp'
	// );
	// 	epub.on('end', async function () {
	// 		const localId = fileName;

	// 		const data = epub.metadata;
	// 		console.log(data);
	// 		const isbn = data.ISBN;
	// 		const bookExists = await prisma.book.findFirst({
	// 			where: {
	// 				isbn: isbn,
	// 			},
	// 		});
	// 		if (bookExists) {
	// 			return 'book is already in the database';
	// 		}
	// 		const cover = data.cover;
	// 		const authors = data.creator;
	// 		const description = data.description;
	// 		const genres = data.subject;
	// 		const title = data.title;
	// 		const publisher = data.publisher;
	// 		const language = data.language;
	// 		console.log(isbn);

	// 		let parsedData = {
	// 			localId,
	// 			title: title ? title : null,
	// 			description: description ? description : null,
	// 			isbn: isbn ? isbn : null,
	// 			authors: await findAuthors(authors),
	// 			genres: await findGenres(genres),
	// 			language: await checkLanguage(language),
	// 			publisher: await findPublisher(publisher),
	// 			bookExists: bookExists ? true : false,
	// 		};

	// 		if (cover === undefined) {
	// 			console.log(`${title} has no cover`);
	// 		} else {
	// 			const coverPath = path.join(
	// 				__dirname,
	// 				'..',
	// 				'..',
	// 				'files',
	// 				'images',
	// 				'temp',
	// 				'covers',
	// 				`${localId}.jpg`
	// 			);
	// 			const isCover = extractImage(epub, cover, coverPath);
	// 			if (isCover !== false) {
	// 				parsedData = {
	// 					...parsedData,
	// 					...{
	// 						cover: `${host}/api/images/uploaded/covers/${localId}.jpg`,
	// 					},
	// 				};
	// 			}
	// 		}

	// 		resolve(parsedData);
	// 	});

	// 	epub.parse();
	// });
};

// FUNCTIONS

function extractImage(
	epub: EPub,
	cover: string,
	coverPath: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		epub.getImage(cover, (error, img) => {
			if (error) return reject(error);
			try {
				fs.writeFileSync(coverPath, img);
				resolve();
			} catch (err) {
				console.log(err);
				reject(err);
			}
		});
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
			existing: { id: findPublisher.id, name: findPublisher.name },
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

async function checkLanguage(language: string): Promise<string | null> {
	if (!language) {
		return null;
	}
	const langMap: Record<string, string> = {
		'pl-pl': 'Polish',
		pl: 'Polish',
		'en-gb': 'English',
		en: 'English',
		'en-us': 'English',
	};
	return langMap[language.toLowerCase()] || '';
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
			const newAuthorStr = author
				.substring(1)
				.substring(0, author.length - 1);
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
	const newAuthors: Array<{
		firstName: string;
		secondName: string;
		thirdName: string;
		lastName: string;
	}> = [];

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
			const newAuthor = {
				firstName: nameArr[0],
				secondName: nameArr.length > 2 ? nameArr[1] : '',
				thirdName: nameArr.length > 3 ? nameArr[2] : '',
				lastName: nameArr[nameArr.length - 1],
			};
			newAuthors.push(newAuthor);
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
