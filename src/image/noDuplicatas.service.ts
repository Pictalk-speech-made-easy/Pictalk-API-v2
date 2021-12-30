import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { readdirSync, statSync, unlink, copyFile } from "fs";
import { extname } from "path"
import * as sizeOf from "image-size";
import { ISizeCalculationResult } from "image-size/dist/types/interface";
import {imageHash } from "image-hash";

@Injectable()
export class NoDuplicatasService {
    constructor() { }
    private logger = new Logger('NoDuplicatasService');

    async noDuplicatas(newImage: string): Promise<string> {
        let files: string[];
        try {
            files = readdirSync('./files');
        } catch (err) {
            throw new InternalServerErrorException("Cannot read dir");
        }

        const similarFiles:string[] = files.filter((file) => file.startsWith(newImage.split('-')[0]));
        
        if(similarFiles.length == 0){
            this.logger.log(`No image with the same name exists : ${newImage} is being moved to Files`);
            this.moveTmpToFiles(newImage);
            return newImage;
        }
        const isDuplicata: boolean = await this.CheckIfDuplicate(newImage, similarFiles[0]);
        this.logger.debug(`${isDuplicata}`);

        if(!isDuplicata){
            this.logger.log(`${newImage} is being moved to Files after checks`);
            this.moveTmpToFiles(newImage);
            return newImage;
        } else {
            this.logger.log(`${newImage} is being deleted after checks`);
            this.deleteTmpFile(newImage);
            return similarFiles[0];
        }
    }

    private async CheckIfDuplicate(newImage: string, similarImage: string): Promise<boolean> {
        const similarFile: string = "./files/" + similarImage
        const newFile: string = "./tmp/" + newImage
        const statFile = statSync(similarFile);
        const statImg = statSync(newFile);
        if (statFile.size != statImg.size || extname(similarFile) != extname(newFile)) {
            return false;
        }
        this.logger.log(`File(s) have the same size`);
        const similarFileSize: ISizeCalculationResult = sizeOf.default(similarFile)
        const newFileSize: ISizeCalculationResult = sizeOf.default(newFile)
        if (similarFileSize.height != newFileSize.height || similarFileSize.width != newFileSize.width) {
            return false
        }
        this.logger.log(`File(s) have the same dimensions`);

        const hash1: string = await new Promise((resolve, reject) => imageHash(similarFile, 8, false, ((error, hash1) => {
            if (error) {
                reject(error);
            } else {
                resolve(hash1);
            }
        })));
        const hash2: string = await new Promise((resolve, reject) => imageHash(newFile, 8, false, ((error, hash1) => {
            if (error) {
                reject(error);
            } else {
                resolve(hash1);
            }
        })));
        if (hash1 != hash2) {
            return false;
        } else {
            return true;
        }
    }

    private async moveTmpToFiles(filename: string): Promise<void> {
        this.logger.debug(`Moving file: ${filename}`);

        copyFile("./tmp/"+filename,"./files/"+filename, (err)=> {
            if(err){
                throw new NotFoundException(`Couldn't find file: ${filename}, Error is : ${err}`);
            }
            return;
        })
    }
    private async deleteTmpFile(filename: string): Promise<void> {
        this.logger.debug(`Deleting file: ${filename}`);
        unlink("./tmp/"+filename, (err) => {
            if(err){
                throw new InternalServerErrorException(`Couldn't find ${filename}, Error is : ${err}`);
            }
            return;
        });
    }
}