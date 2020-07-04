import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,

  storage: multer.diskStorage({
    destination: tmpFolder,
    filename: (request, file, callback) => {
      try {
        const fileHash = crypto.randomBytes(4).toString('hex');
        const fileName = `${Date.now() + fileHash}-${file.originalname}`;

        return callback(null, fileName);
      } catch (err) {
        throw new Error(err.message);
      }
    },
  }),
};
