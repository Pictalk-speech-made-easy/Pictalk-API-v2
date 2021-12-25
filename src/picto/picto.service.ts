import { forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class PictoService {
    constructor(
        @InjectRepository(PictoRepository)
        private pictoRepository : PictoRepository,
        @Inject(forwardRef(() => AuthService))
        private authService : AuthService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService : CollectionService,
    ) { }

    async getPictoById(id: number, user : User): Promise<Picto>{
        const picto = await this.pictoRepository.findOne({where : {id}});
        let index;
        if(!picto) {
            throw new NotFoundException(`Picto with ID '${id}' not found`);
        } else if(user.id === picto.userId){
            return picto;    
        } else {
            index = picto.viewers.indexOf(user.username);
            if(index!=-1){
                return picto;
            }
            index = picto.editors.indexOf(user.username);
            if(index!=-1){
                return picto;
            }
            throw new UnauthorizedException(`User ${user.username} does not have access to this picto`);
        }
    }

    async autoShare(picto : Picto, fatherCollection: Collection): Promise<Picto>{
        return this.pictoRepository.autoShare(picto, fatherCollection);
    }

    async sharePictoById(id: number, user: User, sharePictoDto: sharePictoDto): Promise<Picto>{
        const sharer = await this.authService.findWithUsername(sharePictoDto.username);
        const exists = await this.authService.verifyExistence(sharer);
        if(exists){
            const picto=await this.getPictoById(id, user);
            if(picto){
                const sharedWithMe = await this.collectionService.getCollectionById(sharer.shared, sharer);
                this.collectionService.pushPicto(sharedWithMe, picto);
                return this.pictoRepository.sharePicto(picto, sharePictoDto, user);
            } else {
                throw new NotFoundException(`Picto with ID '${id}' not found`);
            }
        } else {
            throw new NotFoundException(`user with name '${sharePictoDto.username}' not found`);
        }
    }

    async getAllUserPictos(user:User): Promise<Picto[]>{
        const found = await this.pictoRepository.find({where : {userId: user.id}});
        return found;
    } 

    async createPicto(createPictoDto: createPictoDto, user: User, filename: string): Promise<Picto> {
        return this.pictoRepository.createPicto(createPictoDto, user, filename);
    }

    async deletePicto(id: number, user: User): Promise<void> {
        const result = await this.pictoRepository.delete({
            id: id,
            userId: user.id,
          });
        if(result.affected===0) {
            throw new NotFoundException(`Picto with ID "${id}" not found`);
        }
    }

    async modifyPicto(id: number, user: User, modifyPictoDto: modifyPictoDto, filename: string): Promise<Picto>{
        const picto=await this.getPictoById(id, user);
        return this.pictoRepository.modifyPicto(picto, modifyPictoDto, user, filename);
    }
}