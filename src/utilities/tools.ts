import { extname } from 'path';

export const getArrayIfNeeded = function(input) {
    return Array.isArray(input) == false ? new Array(input) : input;
};

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.normalize().match(/\.(jpeg|png|gif|jpg)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.normalize().split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(8)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};