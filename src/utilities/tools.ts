import { BadRequestException, NotFoundException } from '@nestjs/common';
import { response } from 'express';
import { copyFile, unlink, constants, promises } from 'fs';
import { imageHash } from 'image-hash';
import { extname } from 'path';
import * as getColors from 'get-image-colors';
import * as mime from 'mime-types';
import * as sha from 'sha.js';

export const maxSize = 524288;

export const getArrayIfNeeded = function(input) {
    return Array.isArray(input) == false ? new Array(input) : input;
};

export const parseNumberArray = function(input) {
  let index = input.indexOf(null);
  while(index!=-1){
    input.splice(index, 1);
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

export async function getImageColors(filename: string, extension: string): Promise<any> {
  return getColors('./tmp/'+filename, extension);
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
  let hashedname = hash+extension;
  try {
    await promises.copyFile('./tmp/'+filename, './files/'+hashedname, constants.COPYFILE_EXCL);
    unlink('./tmp/'+filename, (err)=> {
      if(err){
        throw new NotFoundException(`Couldn't delete file: ${filename}, Error is : ${err}`);
      }
    });
  } catch (err) {
    console.log(err);
    if(err.code == 'EEXIST'){
      console.log('File already exists, checking colors')
      const colors1 = (await getImageColors(filename, mime.lookup(extension))).map(color => {return color.hex();}).toString();
      const colors2 = (await getImageColors('../files/'+hashedname, mime.lookup(extname(hashedname)))).map(color => {return color.hex();}).toString();
      console.log('Colors are : '+colors1+' and '+colors2)
      if(colors1!=colors2){
        const hash1 = sha('sha1').update(colors1).digest('hex');
        console.log("Colors are different");
        try {
          hashedname = hash1+hashedname;
          await promises.copyFile('./tmp/'+filename, './files/'+hash1+hashedname, constants.COPYFILE_EXCL);
          console.log('Colors are different, new file is : '+hashedname);
        } catch (err) {
          console.log(err);
          if (err?.code != 'EEXIST') {
            throw new NotFoundException(`Couldn't copy file: ${filename}, Error is : ${err}`);
          }
        }
      }
      
      unlink('./tmp/'+filename, (err)=> {
        if(err){
          throw new NotFoundException(`Couldn't delete file: ${filename}, Error is : ${err}`);
        }
      });
    } else {
      throw new NotFoundException(`Couldn't find file: ${filename}, Error is : ${err}`);
    }
  }
  
  console.log('Returned Hashedname is : '+hashedname)
  return hashedname;
} 

export async function fetchWithoutError(url: string, options: any):Promise<void | Response> {
  return fetch(url, options)
  .then((response)=>{return response;})
  .catch((error)=>{console.log(error);});
}