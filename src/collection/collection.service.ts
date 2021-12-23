import { forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { CollectionRepository } from './collection.repository';
import { createCollectionDto } from './dto/collection.create.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { shareCollectionDto } from './dto/collection.share.dto';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(CollectionRepository)
        private collectionRepository : CollectionRepository,
        @Inject(forwardRef(() => AuthService))
        private authService : AuthService,
    ) { }

    async getCollectionById(id: number, user : User): Promise<Collection>{
        const collection = await this.collectionRepository.findOne({relations: ["pictos", "collections"],where : {id}});
        let index;
        if(!collection) {
            throw new NotFoundException(`Collection with ID '${id}' not found`);
        } else if(user.id === collection.userId){
            return collection;    
        } else {
            index = collection.viewers.indexOf(user.username);
            if(index!=-1){
                return collection;
            }
            index = collection.editors.indexOf(user.username);
            if(index!=-1){
                return collection;
            }
            throw new UnauthorizedException(`User ${user.username} does not have access to this collection`);
        }
    }

    async getAllUserCollections(user:User): Promise<Collection[]>{
        const collection = await this.collectionRepository.find({relations: ["pictos", "collections"],where : {userId: user.id}});
        return collection;
    } 

    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        createCollectionDto.collectionIds = await this.verifyOwnership(createCollectionDto.collectionIds, user);
        return this.collectionRepository.createCollection(createCollectionDto, user, filename);
    }

    async createRoot(user: User): Promise<number>{
        return this.collectionRepository.createRoot(user);
    }

    async deleteCollection(id: number, user: User): Promise<void>{
        if(id!=user.root){
            const result = await this.collectionRepository.delete({
                id: id,
                userId: user.id,
              });
            if(result.affected===0) {
                throw new NotFoundException(`Collection with ID '${id}' not found`);
            }
        } else {
            throw new UnauthorizedException(`Cannot delete root of User ${user.username}`);
        }
    }
    async autoShare(collection : Collection, fatherCollection: Collection): Promise<Collection>{
        return this.collectionRepository.autoShare(collection, fatherCollection);
    }

    async modifyCollection(id: number, user: User, modifyCollectionDto: modifyCollectionDto, filename: string): Promise<Collection>{
        const collection=await this.getCollectionById(id, user);
        const index = collection.editors.indexOf(user.username);
        if(collection.userId===user.id || index!=-1){
            modifyCollectionDto = await this.verifyOwnership(modifyCollectionDto, user);
            return this.collectionRepository.modifyCollection(collection, modifyCollectionDto, user, filename);
        } else {
            throw new UnauthorizedException(`User '${user.username}' is not authorized to modify this collection`);
        }
       
    }

    async shareCollectionById(id: number, user: User, shareCollectionDto: shareCollectionDto): Promise<Collection>{
        const exists = await this.authService.verifyExistence(shareCollectionDto.username);
        if(exists){
            const collection=await this.getCollectionById(id, user);
            if(collection){
                return this.collectionRepository.shareCollection(collection, shareCollectionDto, user);
            } else {
                throw new NotFoundException(`Collection with ID '${id}' not found`);
            }
        } else {
            throw new NotFoundException(`user with name '${shareCollectionDto.username}' not found`);
        }
    }

    async verifyOwnership(verificationDto : any, user: User){
        try{
            for(var i=0; i<verificationDto.collectionIds.length; i++){
                try{
                    const collection = await this.getCollectionById(verificationDto.collectionIds[i], user);
                } catch(error) {
                    i=i-1;
                    verificationDto.collectionIds.splice(i, 1);
                }
            }
        } catch(error){}
        try{
            for(var i=0; i<verificationDto.pictoIds.length; i++){
                try{
                    const collection = await this.getCollectionById(verificationDto.pictoIds[i], user);
                } catch(error) {
                    i=i-1;
                    verificationDto.pictoIds.splice(i, 1);
                }
            }
        } catch(error){}
        return verificationDto;
    }
}