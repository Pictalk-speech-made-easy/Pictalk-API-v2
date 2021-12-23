import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { MLtext } from "src/entities/MLtext.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";
import { shareCollectionDto } from "./dto/collection.share.dto";

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

    async shareCollection(collection: Collection, shareCollectionDto: shareCollectionDto, user: User): Promise<Collection>{
        try{
            collection.collections.map(collection => this.shareCollection(collection, shareCollectionDto, user));
        } catch(error){}
        try{
            collection.pictos.map(picto => this.sharePictoFromDto(picto, shareCollectionDto));
        } catch(error){}
        try{
            collection=await this.shareCollectionFromDto(collection, shareCollectionDto);
        } catch(error){}
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection;
    }

    async createRoot(user: User): Promise<number>{
        if(user.root===null){
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
            user.root=collection.id;
            try {
                await user.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
            return collection.id;
        } else {
            throw new ForbiddenException(`cannot create a new root for User ${user.username}. User already has root ${user.root}`);
        }
        
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

    async shareCollectionFromDto(collection: Collection, shareCollectionDto: shareCollectionDto): Promise<Collection>{
        const {access, username, role} = shareCollectionDto;
        let index;
        if(access){
            if(role==='editor'){
                index = collection.viewers.indexOf(username);
                if(index!=-1){
                    collection.viewers.splice(index);
                }
                index = collection.editors.indexOf(username);
                if(!(index!=-1)){
                    collection.editors.push(username);
                }
            } else if(role==='viewer'){
                index = collection.editors.indexOf(username);
                if(index!=-1){
                    collection.editors.splice(index);
                }
                index = collection.viewers.indexOf(username);
                if(!(index!=-1)){
                    collection.viewers.push(username);
                } 
            } else {
               throw new InternalServerErrorException(`role must be 'viewer or 'editor'`); 
            }
        } else {
            index = collection.viewers.indexOf(username);
            if(index!=-1){
                collection.viewers.splice(index);
            }
            index = collection.editors.indexOf(username);
            if(index!=-1){
                collection.editors.splice(index);
            }
        }
        return collection;
    }

    async sharePictoFromDto(picto: Picto, shareCollectionDto: shareCollectionDto): Promise<Picto>{
        const {access, username, role} = shareCollectionDto;
        let index;
        if(access){
            if(role==='editor'){
                index = picto.viewers.indexOf(username);
                if(index!=-1){
                    picto.viewers.splice(index);
                }
                index = picto.editors.indexOf(username);
                if(!(index!=-1)){
                    picto.editors.push(username);
                }
            } else if(role==='viewer'){
                index = picto.editors.indexOf(username);
                if(index!=-1){
                    picto.editors.splice(index);
                }
                index = picto.editors.indexOf(username);
                if(!(index!=-1)){
                    picto.editors.push(username);
                } 
            } else {
               throw new InternalServerErrorException(`role must be 'viewer or 'editor'`); 
            }
        } else {
            index = picto.viewers.indexOf(username);
            if(index!=-1){
                picto.viewers.splice(index);
            }
            index = picto.editors.indexOf(username);
            if(index!=-1){
                picto.editors.splice(index);
            }
        }
        return picto;
    }
    async autoShare(collection : Collection, fatherCollection: Collection): Promise<Collection>{
        collection.editors= fatherCollection.editors;
        collection.viewers= fatherCollection.viewers;
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection;
    }
}