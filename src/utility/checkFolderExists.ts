import fs from 'fs';

const isNodeError = (error: Error): error is NodeJS.ErrnoException =>
  error instanceof Error;

export const checkFolderExists = (folder: string) => {
  try {
    fs.statSync(folder);
  } catch (err) {
    if (err)
      try {
        fs.mkdirSync(folder);
      } catch (err) {
        console.error(
          'checkFolderExists: There was an error creating required folder'
        );
        return false;
      }
    else {
      console.error(
        'checkFolderExists: Error checking if required folder exists'
      );
      return false;
    }
  }
  return true;
};
