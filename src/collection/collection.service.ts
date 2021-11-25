import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { CollectionRepository } from './collection.repository';
import { createCollectionDto } from './dto/collection.create.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(CollectionRepository)
        private collectionRepository : CollectionRepository,
    ) { }

    async getUserCollections(user: User): Promise<Collection[]> {
        const collections: Collection[] = await this.collectionRepository.find({
          where: { userId: user.id },
        });
        if (collections.length !== 0) {
          collections.map(collection => {
            delete collection.pictos;
            delete collection.userId;
          });
        }
        return collections;
    }

    async getCollectionById(id: number, user : User): Promise<Collection>{
        const found = await this.collectionRepository.findOne({relations: ["pictos", "collections"],where : {userId : user.id, id}});
        if(!found) {
            throw new NotFoundException(`Collection with ID "${id}" not found`);
        }
        return found;
    }

    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        createCollectionDto.collectionIds = await this.verifyOwnership(createCollectionDto.collectionIds, user);
        return this.collectionRepository.createCollection(createCollectionDto, user, filename);
    }

    async createRoot(user: User): Promise<Collection>{
        return this.collectionRepository.createRoot(user);
    }
    async deleteCollection(id: number, user: User): Promise<void>{
        const result = await this.collectionRepository.delete({
            id: id,
            userId: user.id,
          });
        if(result.affected===0) {
            throw new NotFoundException(`Collection with ID "${id}" not found`);
        }
    }

    async modifyCollection(id: number, user: User, modifyCollectionDto: modifyCollectionDto, filename: string): Promise<Collection>{
        let collection=await this.getCollectionById(id, user);
        modifyCollectionDto = await this.verifyOwnership(modifyCollectionDto, user);
        return this.collectionRepository.modifyCollection(collection, modifyCollectionDto, user, filename);
    }

    async verifyOwnership(verificationDto : any, user: User){
        try{
            for(var i=0; i<verificationDto.collectionIds.length; i++){
                try{
                    const collection = await this.getCollectionById(verificationDto.collectionIds[i], user);
                } catch(error) {
                    console.log("error");
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
                    console.log("error");
                    i=i-1;
                    verificationDto.pictoIds.splice(i, 1);
                }
            }
        } catch(error){}
        return verificationDto;
    }
}