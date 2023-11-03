import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { PictoRepository } from './picto.repository';
import { createPictoDto } from './dto/picto.create.dto';
import { modifyPictoDto } from './dto/picto.modify.dto';
import { sharePictoDto } from './dto/picto.share.dto';
import { AuthService } from 'src/auth/auth.service';
import { Collection } from 'src/entities/collection.entity';
import { CollectionService } from 'src/collection/collection.service';
import { deletePictoDto } from './dto/picto.delete.dto';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
import { Notif } from 'src/entities/notification.entity';
import { SearchService } from 'src/search/search.service';

@Injectable()
export class PictoService {
    constructor(
        @InjectRepository(PictoRepository)
        private pictoRepository : PictoRepository,
        @Inject(forwardRef(() => AuthService))
        private authService : AuthService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService : CollectionService,
        @Inject(forwardRef(() => SearchService))
        private searchService : SearchService,
    ) { }

    async getPictoById(id: number, user : User): Promise<Picto>{
        const picto = await this.pictoRepository.findOne({where : {id}});
        if(!picto) {
            throw new NotFoundException(`Picto with ID '${id}' not found`);
        } else {
            let viewer : number;
            let editor : number;
            viewer = picto.viewers.indexOf(user.username);
            editor = picto.editors.indexOf(user.username);
            if(picto.public === true || viewer!=-1 || editor!=-1 || picto.userId === user.id){
                return picto
            } else {
                throw new UnauthorizedException(`User ${user.username} does not have access to this picto`);
            }
        }
    }

    async autoShare(picto : Picto, fatherCollection: Collection): Promise<Picto>{
        return this.pictoRepository.autoShare(picto, fatherCollection);
    }

    async getPictoCount(): Promise<number>{
        return await this.pictoRepository.createQueryBuilder('picto').getCount()
    }

    async sharePictoById(id: number, user: User, sharePictoDto: sharePictoDto): Promise<Picto>{
        const sharer = await this.authService.findWithUsername(sharePictoDto.username);
        const exists = await this.authService.verifyExistence(sharer);
        if(sharer.username === user.username){
            throw new BadRequestException(`cannot share picto to yourself`);
        }
        if(exists){
            const picto=await this.getPictoById(id, user);
            if(picto){
                const editor = picto.editors.indexOf(user.username);
                if(sharePictoDto.role==="editor" && !(picto.userId === user.id || editor!=-1)){
                    throw new UnauthorizedException(`${user.username} cannot share to ${sharer.username} as editor being a viewer youself`);
                }
                const sharedWithMe = await this.collectionService.getCollectionById(sharer.shared, sharer);
                this.collectionService.pushPicto(sharedWithMe, picto);
                return this.pictoRepository.sharePicto(picto, sharePictoDto, user);
            } else {
                throw new NotFoundException(`Picto with ID '${id}' not found`);
            }
        } else {
        }
    }

    async getAllUserPictos(user:User): Promise<Picto[]>{
        const found = await this.pictoRepository.find({where : {userId: user.id}});
        return found;
    } 

    async getAllPictos(): Promise<Picto[]>{
        const pictos = await this.pictoRepository.find();
        return pictos;
    }

    async createPicto(createPictoDto: createPictoDto, user: User, filename: string): Promise<Picto> {
        return this.pictoRepository.createPicto(createPictoDto, user, filename);
    }

    async deletePicto(deletePictoDto: deletePictoDto, user: User): Promise<void> {
        const picto = await this.getPictoById(deletePictoDto.pictoId, user);
        if(deletePictoDto.fatherId){
            deletePictoDto.fatherId=Number(deletePictoDto.fatherId);
            const fatherCollection = await this.collectionService.getCollectionById(deletePictoDto.fatherId, user);
            let fatherPictosIds = fatherCollection.pictos.map(picto => {return picto.id;})
            fatherPictosIds.splice(fatherPictosIds.indexOf(deletePictoDto.pictoId),1);
            const modifyCollectionDto : modifyCollectionDto = {
                meaning : null,
                speech : null,
                collectionIds : null,
                priority : 10,
                color : null,
                pictohubId: null,
                pictoIds : fatherPictosIds
            }
            await this.collectionService.modifyCollection(deletePictoDto.fatherId, user, modifyCollectionDto, null);
        }
        try {
            const result = await this.pictoRepository.delete({
                id: deletePictoDto.pictoId,
                userId: user.id,
              });
              this.searchService.removePictogram(deletePictoDto.pictoId, false);
            if(result.affected===0) {
                throw new NotFoundException(`Picto with ID "${deletePictoDto.pictoId}" not found`);
            }
        } catch(error){
            if(error.code === "23503"){
                return;
            } else {
                throw new InternalServerErrorException(`couldn't delete picto with id ${deletePictoDto.pictoId}`);
            }
        }
        
    }

    async modifyPicto(id: number, user: User, modifyPictoDto: modifyPictoDto, filename: string): Promise<Picto>{
        const picto=await this.getPictoById(id, user);
        const index = picto.editors.indexOf(user.username);
        if(picto.userId===user.id || index!=-1){
            if(picto.public){
                const admins = await this.authService.admins();
                admins.map(async(admin) => {
                    const notification = await this.createNotif(picto, admin, "public picto", "modified");
                    this.authService.pushNotification(admin, notification);
                });
            }
            return this.pictoRepository.modifyPicto(picto, modifyPictoDto, user, filename);
        } else {
            throw new UnauthorizedException(`User '${user.username}' is not authorized to modify this picto`);
        }
    }

    async createNotif(picto: Picto, user: User, type: string, operation: string): Promise<Notif>{
        const notification: Notif = new Notif(type, operation, picto.id.toString(), picto.meaning, user.username);
        return notification;
    } 

    async copyPicto(fatherCollectionId : number, pictoId: number, user: User): Promise<Picto>{
        const picto = await this.getPictoById(pictoId, user);
        return this.pictoRepository.copyPicto(picto, fatherCollectionId,user)
    }
}