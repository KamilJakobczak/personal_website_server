import path from 'path';
import formidable, { IncomingForm } from 'formidable';
import { epubParser, epubParserData } from './epubParser';
import { nanoid } from 'nanoid';
import { checkFolderExists } from './checkFolderExists';

export async function handleUpload(req: any, res: any) {
  return new Promise<epubParserData>(function (resolve, reject) {
    const uploadDir = path.join(__dirname, '..', '..', 'files', 'uploads');

    const checkUploadDir = checkFolderExists(uploadDir);
    if (!checkUploadDir) {
      return reject('There was a problem with uploads directory');
    }

    const form = new IncomingForm({
      multiples: false,
      maxFileSize: 500 * 1024 * 1024,
      uploadDir: uploadDir,
    });

    form.parse(req, async (err, fields, files) => {
      const file = files.file as formidable.File;
      const fileName = file.newFilename;

      const isValid = isFileValid(file);
      if (!isValid) {
        return res.status(400).json({
          status: 'fail',
          message: 'The file type is not a valid type',
        });
      }

      const data = await epubParser(file.filepath, fileName);
      resolve(data);
    });
  });
}
//helpers

const isFileValid = (file: any) => {
  const type = file.originalFilename.endsWith('.epub');

  if (!type) {
    console.error('The file type is invalid');
    return false;
  }
  return true;
};
