import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { MLtext } from "src/entities/MLtext.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";

@EntityRepository(Collection)
export class CollectionRepository extends Repository<Collection>{
    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        let { language, meaning, speech, pictoIds, collectionIds, color } = createCollectionDto;
        const collection = new Collection();
        collection.meaning = await this.MLtextFromTexts(language, meaning);
        collection.speech = await this.MLtextFromTexts(language, speech);
        collection.userId = user.id;
        if(pictoIds){
            pictoIds=getArrayIfNeeded(pictoIds);
            collection.pictos = pictoIds.map(pictoIds => ({ id: pictoIds } as any));
        }
        if(collectionIds){
            collectionIds=getArrayIfNeeded(collectionIds);
            collection.collections = collectionIds.map(collectionIds => ({id: collectionIds} as any));
        }
        if(color){
            collection.color = color;
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
        let {language, meaning, speech, starred, pictoIds, collectionIds, color}= modifyCollectionDto;
        if(meaning){
            collection.meaning = await this.MLtextFromTexts(language, meaning);
        }
        if(speech){
            collection.speech = await this.MLtextFromTexts(language, speech);
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
        if(color){
            collection.color = color;
        }
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        //delete collection.user;
        return collection;
    }

    async createRoot(user: User): Promise<number>{
        const collection = new Collection();
        const mltext = new MLtext();
        mltext.language="";
        mltext.text=""
        collection.meaning = getArrayIfNeeded(mltext);
        collection.speech = getArrayIfNeeded(mltext);
        collection.userId = user.id;
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection.id;
    }

    async MLtextFromTexts(language: string[], text: string[]): Promise<MLtext[]>{
        const length = language.length;
        let mltexts: MLtext[]=[];
        for(var i=0; i<length; i++){
            const mltext= new MLtext();
            mltext.language=language[i];
            mltext.text= text[i];
            mltexts.push(mltext);
        }
        
        return mltexts
    }
}