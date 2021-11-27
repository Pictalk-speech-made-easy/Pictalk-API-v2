import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";

@EntityRepository(Collection)
export class CollectionRepository extends Repository<Collection>{
    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        let { meaning, speech, pictoIds, collectionIds } = createCollectionDto;
        const collection = new Collection();
        collection.meaning = meaning;
        collection.speech = speech;
        collection.userId = user.id;
        if(pictoIds){
            pictoIds=getArrayIfNeeded(pictoIds);
            collection.pictos = pictoIds.map(pictoIds => ({ id: pictoIds } as any));
        }
        if(collectionIds){
            collectionIds=getArrayIfNeeded(collectionIds);
            collection.collections = collectionIds.map(collectionIds => ({id: collectionIds} as any));
        }
        if(filename){
            collection.image=filename;
        } else {
            throw new NotFoundException(`filename not found`);
        }
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection;
    }

    async modifyCollection(collection: Collection, modifyCollectionDto: modifyCollectionDto, user: User, filename: string): Promise<Collection>{
        let {meaning, speech, starred, pictoIds, collectionIds}= modifyCollectionDto;
        if(meaning){
            collection.meaning = meaning;
        }
        if(speech){
            collection.speech = speech;
        }
        if(filename){
            collection.image = filename;
        }  
        if(starred){
            collection.starred = starred;
        }
        if(pictoIds){
            pictoIds=getArrayIfNeeded(pictoIds);
            collection.pictos = pictoIds.map(pictoIds => ({ id: pictoIds } as any));
        }
        if(collectionIds){
            collectionIds=getArrayIfNeeded(collectionIds);
            collection.collections = collectionIds.map(collectionIds => ({ id: collectionIds } as any));
        }
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        //delete collection.user;
        return collection;
    }
}