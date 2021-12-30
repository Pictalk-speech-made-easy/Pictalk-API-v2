import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { MLtext } from "src/entities/MLtext.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded, parseNumberArray } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";
import { shareCollectionDto } from "./dto/collection.share.dto";

@EntityRepository(Collection)
export class CollectionRepository extends Repository<Collection>{
    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        let { meaning, speech, pictoIds, collectionIds, color } = createCollectionDto;
        const collection = new Collection();
        collection.meaning = await this.MLtextsFromObjects(meaning);
        collection.speech = await this.MLtextsFromObjects(speech);
        collection.userId = user.id;
        if(pictoIds){
            pictoIds=parseNumberArray(pictoIds);
            collection.pictos = pictoIds.map(pictoIds => ({ id: pictoIds } as any));
        }
        if(collectionIds){
            collectionIds=parseNumberArray(collectionIds);
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
        let {meaning, speech, starred, pictoIds, collectionIds, color}= modifyCollectionDto;
        if(meaning){
            collection.meaning = await this.MLtextsFromObjects(meaning);
        }
        if(speech){
            collection.speech = await this.MLtextsFromObjects(speech);
        }
        if(filename){
            collection.image = filename;
        }  
        if(starred){
            collection.starred = starred;
        }
        if(pictoIds){
            collection.pictos = pictoIds.map(pictoIds => ({ id: pictoIds } as any));
        }
        if(collectionIds){
            collectionIds=parseNumberArray(collectionIds);
            collection.collections = collectionIds.map(collectionIds => ({ id: collectionIds } as any));

            
        }
        if(color){
            collection.color = color;
        }
        try {
            await collection.save();
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException(error);
        }
        //delete collection.user;
        return collection;
    }

    async publishCollection(collection: Collection, publish: number, user: User): Promise<Collection>{
        if(publish && collection.userId === user.id){
            collection.public=true;
        } else {
            collection.public=false;
        }
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection;
    }

    async publishPicto(picto: Picto, publish: number, user: User): Promise<Picto>{
        if(publish && picto.userId === user.id){
            picto.public=true;
        } else {
            picto.public=false;
        }
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        
        return picto;
    }

    async createRoot(user: User): Promise<number>{
        if(user.root===null){
            const root = new Collection();
            const mltext = new MLtext();
            mltext.language="";
            mltext.text=""
            root.meaning = getArrayIfNeeded(mltext);
            root.speech = getArrayIfNeeded(mltext);
            root.userId = user.id;
            try {
                await root.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
            user.root=root.id;
            try {
                await user.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
        } else {
            throw new ForbiddenException(`cannot create a new root for User ${user.username}. User already has root ${user.root}`);
        } 
        return user.root;
    }

    async createShared(user: User): Promise<number>{
        if(user.shared===null){
            const shared = new Collection();
            const mltext = new MLtext();
            mltext.language="";
            mltext.text=""
            shared.meaning = getArrayIfNeeded(mltext);
            shared.speech = getArrayIfNeeded(mltext);
            shared.userId = user.id;
            try {
                await shared.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
            user.shared=shared.id;
            try {
                await user.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
        } else {
            throw new ForbiddenException(`cannot create a new "shared with me" for User ${user.username}. User already has a shared collection ${user.shared}`);
        }
        return user.shared;
    }

    

    async MLtextFromObject(object :any): Promise<MLtext>{
        const mltext = new MLtext();
        mltext.language=object['language'];
        mltext.text=object['text'];
        return mltext
    }

    async MLtextsFromObjects(array : any): Promise<MLtext[]>{
        const mltexts: MLtext[]=[];
        if(array.length!=undefined){
            for(let index = 0; index<array.length; index++){
                mltexts.push(await this.MLtextFromObject(array[index]));
            }
        } else {
            mltexts.push(await this.MLtextFromObject(array));
        }
        return mltexts;
    }

    async shareCollectionFromDto(collection: Collection, shareCollectionDto: shareCollectionDto): Promise<Collection>{
        const {access, username, role} = shareCollectionDto;
        let index;
        if(access==1){
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
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return collection;
    }

    async sharePictoFromDto(picto: Picto, shareCollectionDto: shareCollectionDto): Promise<Picto>{
        const {access, username, role} = shareCollectionDto;
        let index;
        if(access==1){
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
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
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

    async pushCollection(toPushInto: Collection, collection: Collection): Promise<void>{
        toPushInto.collections.push(collection);
        try {
            await toPushInto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return;
    }

    async pushPicto(toPushInto: Collection, picto:Picto): Promise<void>{
        toPushInto.pictos.push(picto);
        try {
            await toPushInto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return;
    }
}