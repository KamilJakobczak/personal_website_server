import path from 'path';
import { Request, Response } from 'express';
import formidable, { IncomingForm } from 'formidable';
import { epubParser, epubParserData } from './epubParser';
import { checkFolderExists } from './checkFolderExists';

export async function handleUpload(req: Request, res: Response) {
  return new Promise<epubParserData>(async (resolve, reject) => {
    const uploadDir = path.join(__dirname, '..', '..', 'files', 'uploads');

    // Check if the upload directory exists
    const checkUploadDir = checkFolderExists(uploadDir);
    if (!checkUploadDir) {
      reject('There was a problem with uploads directory');
    }

    const form = new IncomingForm({
      multiples: false,
      maxFileSize: 50 * 1024 * 1024, // Max file size: 50MB
      uploadDir: uploadDir,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing the form:', err);
        return res.status(500).send('Form parsing error');
      }
      const file = files.file as formidable.File;
      const fileName = file.newFilename;

      if (!isFileValid(file)) {
        return res.status(400).send('The file type is not a valid type');
      }
      try {
        const data = await epubParser(file.filepath, fileName);
        resolve(data);
      } catch (error) {
        console.error('Error parsing epub file', error);
        reject('Error parsing epub file');
      }
    });
  });
}

const isFileValid = (file: formidable.File) => {
  const isValid = file.originalFilename
    ? file.originalFilename.endsWith('.epub')
    : null;

  if (!isValid) {
    console.error('The file type is invalid');
    return false;
  }
  return true;
};
