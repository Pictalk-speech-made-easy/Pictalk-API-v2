import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { parseNumberArray } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";
import { SearchCollectionDto } from "./dto/collection.search.public.dto";
import { multipleShareCollectionDto, shareCollectionDto } from "./dto/collection.share.dto";

@EntityRepository(Collection)
export class CollectionRepository extends Repository<Collection>{
    async createCollection(createCollectionDto: createCollectionDto, user: User, filename: string): Promise<Collection> {
        let { meaning, speech, pictoIds, collectionIds, color } = createCollectionDto;
        const collection = new Collection();
        collection.meaning = meaning;
        collection.speech = speech;
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
            collection.meaning = meaning;
        }
        if(speech){
            collection.speech = speech;
        }
        if(filename){
            collection.image = filename;
        }  
        if(starred){
            collection.starred = (starred=="true");
        }
        if(pictoIds){
            pictoIds=parseNumberArray(pictoIds);
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
            throw new InternalServerErrorException(`could not save collection properly`);
        }
        //delete collection.user;
        return collection;
    }

    async publishCollection(collection: Collection, publish: number, user: User): Promise<Collection>{
        if(+publish && collection.userId === user.id){
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
            root.meaning = "";
            root.speech = "";
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
            shared.meaning = "";
            shared.speech = "";
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

    async createSider(user: User): Promise<number>{
        if(user.sider===null){
            const sider = new Collection();
            sider.meaning = "";
            sider.speech = "";
            sider.userId = user.id;
            try {
                await sider.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
            user.sider=sider.id;
            try {
                await user.save();
            } catch (error) {
                throw new InternalServerErrorException(error);
            }
        } else {
            throw new ForbiddenException(`cannot create a new sider for User ${user.username}. User already has sider ${user.sider}`);
        } 
        return user.sider;
    }

    async shareCollectionFromDto(collection: Collection, multipleShareCollectionDto: multipleShareCollectionDto): Promise<Collection>{
        const {access, usernames, role} = multipleShareCollectionDto;
        for(let username of usernames){
            let index: number;
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
                    if((index==-1)){
                        collection.viewers.push(username);
                    } 
                } else {
                   throw new BadRequestException(`role must be 'viewer or 'editor'`); 
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
        }
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(`could not save collection ${error}`);
        }
        return collection;
    }

    async sharePictoFromDto(picto: Picto, multipleShareCollectionDto: multipleShareCollectionDto): Promise<Picto>{
        const {access, usernames, role} = multipleShareCollectionDto;
        for(let username of usernames){
            let index: number;
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
                throw new BadRequestException(`role must be 'viewer or 'editor'`); 
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
        }
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(`could not save picto ${error}`);
        }
        return picto;
    }
    async autoShare(collection : Collection, fatherCollection: Collection): Promise<Collection>{
        collection.editors= fatherCollection.editors;
        collection.viewers= fatherCollection.viewers;
        try {
            await collection.save();
        } catch (error) {
            throw new InternalServerErrorException(`could not auto share collection ${error}`);
        }
        return collection;
    }

    async pushCollection(toPushInto: Collection, collection: Collection): Promise<void>{
        toPushInto.collections.push(collection);
        try {
            await toPushInto.save();
        } catch (error) {
            throw new InternalServerErrorException(`Could not push collection ${collection.id} into ${toPushInto.id}`);
        }
        return;
    }

    async pushPicto(toPushInto: Collection, picto:Picto): Promise<void>{
        toPushInto.pictos.push(picto);
        try {
            await toPushInto.save();
        } catch (error) {
            throw new InternalServerErrorException(`Could not push picto ${picto.id} into ${toPushInto.id}`);
        }
        return;
    }

    async getPublicCollections(filterDto: SearchCollectionDto): Promise<Collection[]> {
        let collections: Collection[];
        const page = filterDto.page ? filterDto.page-1 : 0;
        const per_page = filterDto.per_page ? filterDto.per_page: 20;
        const toSkip = page*per_page;
        const toTake = per_page;
        const query = this.createQueryBuilder('collection');
        try {
            query.where('collection.public = :bool', { bool: true });
            if(filterDto.search){
                query.andWhere('LOWER(collection.meaning) like LOWER(:search)', {search: `%${filterDto.search}%`});
                collections = await query.skip(toSkip).take(toTake).getMany();
            } else if (filterDto.page) {
                collections = await query.skip(toSkip).take(toTake).getMany();
            } else {
                collections = await query.getMany();
            }
            return collections;
        } catch(err){
            throw new InternalServerErrorException(`could not get public collections ${err}`);
        }
    }
}