import { BadRequestException, NotFoundException } from '@nestjs/common';
import { copyFile, unlink, constants } from 'fs';
import { imageHash } from 'image-hash';
import { extname } from 'path';

export const maxSize = 524288;

export const getArrayIfNeeded = function(input) {
    return Array.isArray(input) == false ? new Array(input) : input;
};

export const parseNumberArray = function(input) {
  let index = input.indexOf(null);
  while(index!=-1){
    input.splice(index)
    index = input.indexOf(null);
  }
  return input.map(inputString => {return +inputString;})
}

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.normalize().match(/\.(jpeg|png|gif|jpg|JPG|PNG|JPEG)$/)) {
    return callback(new BadRequestException('Only image files are allowed! jpeg|png|gif|jpg'), false);
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

export const boolString = (string) => {
  if(string === "true"){
    return true;
  } else if(string === "false"){
    return false;
  } else {

  }
}

export async function hashImage(file: Express.Multer.File) {
  const filename = file.filename;
  const extension = extname(file.originalname);
  const hash: string = await new Promise((resolve, reject) => imageHash('./tmp/'+filename, 16, false, ((error, hash1) => {
    if (error) {
        reject(error);
    } else {
        resolve(hash1);
    }
  })));
  const hashedname = hash+extension;
  copyFile('./tmp/'+filename, './files/'+hashedname, constants.COPYFILE_EXCL, (err) => {
    if(err){
      if(err.code == 'EEXIST'){
        unlink('./tmp/'+filename, (err)=> {
          if(err){
            throw new NotFoundException(`Couldn't delete file: ${filename}, Error is : ${err}`);
          }
        });
      } else {
        throw new NotFoundException(`Couldn't find file: ${filename}, Error is : ${err}`);
      }
    } else {
      unlink('./tmp/'+filename, (err)=> {
        if(err){
          throw new NotFoundException(`Couldn't delete file: ${filename}, Error is : ${err}`);
        }
      });
    }
  });
  return hashedname;
} 
