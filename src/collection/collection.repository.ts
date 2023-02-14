import { meaningRoot } from './../utilities/meaning';
import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Collection, Plext } from "src/entities/collection.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { parseNumberArray } from "src/utilities/tools";
import { CustomRepository } from "src/utilities/typeorm-ex.decorator";
import { Repository } from "typeorm";
import { createCollectionDto } from "./dto/collection.create.dto";
import { modifyCollectionDto } from "./dto/collection.modify.dto";
import { SearchCollectionDto } from "./dto/collection.search.public.dto";
import { multipleShareCollectionDto, shareCollectionDto } from "./dto/collection.share.dto";
import { generateAvatar, generateRandomColor } from 'src/utilities/creation';
import { writeFile, writeFileSync } from "fs";
@CustomRepository(Collection)

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
        let {meaning, speech, priority, pictoIds, collectionIds, color}= modifyCollectionDto;
        if(meaning){
            collection.meaning = meaning;
        }
        if(speech){
            collection.speech = speech;
        }
        if(filename){
            collection.image = filename;
        }  
        if(priority){
            collection.priority = Number(priority);
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

    createPlextFromJSON(json: string): Plext[]{
        const plexts: Plext[] = [];
        const locale_text = JSON.parse(json);
        for (const locale in locale_text) {
            const plext = new Plext(locale, locale_text[locale]);
            plexts.push(plext);
        }
        return plexts;
    }

    async createRoot(user: User): Promise<Collection>{
        const name = user.username.split('@')[0]?.replace(/[^a-zA-Z]/gi, '');
        const root = new Collection();
        root.meaning = this.createPlextFromJSON(
            JSON.stringify({
            en: name + meaningRoot.en, 
            fr: meaningRoot.fr+ name, 
            es: meaningRoot.es + name,
            it: meaningRoot.it + name,
            de: name + meaningRoot.de,
            ro: meaningRoot.ro + name,
            po: meaningRoot.po + name,
            el: meaningRoot.el + name,
        }));
        root.speech = this.createPlextFromJSON(JSON.stringify({
            en: name + meaningRoot.en, 
            fr: meaningRoot.fr+ name, 
            es: meaningRoot.es + name,
            it: meaningRoot.it + name,
            de: name + meaningRoot.de,
            ro: meaningRoot.ro + name,
            po: meaningRoot.po + name,
            el: meaningRoot.el + name,
        }));
        const avatarPng = generateAvatar(name.slice(0, 2), generateRandomColor(), "#FFFFFF");
        writeFile(`./files/${user.username}.png`, avatarPng, (err) => {console.log(err)});
        root.image = `${user.username}.png`;
        return root;
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
                        collection.viewers.splice(index, 1);
                    }
                    index = collection.editors.indexOf(username);
                    if(!(index!=-1)){
                        collection.editors.push(username);
                    }
                } else if(role==='viewer'){
                    index = collection.editors.indexOf(username);
                    if(index!=-1){
                        collection.editors.splice(index, 1);
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
                    collection.viewers.splice(index, 1);
                }
                index = collection.editors.indexOf(username);
                if(index!=-1){
                    collection.editors.splice(index, 1);
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
                        picto.viewers.splice(index, 1);
                    }
                    index = picto.editors.indexOf(username);
                    if(!(index!=-1)){
                        picto.editors.push(username);
                    }
                } else if(role==='viewer'){
                    index = picto.editors.indexOf(username);
                    if(index!=-1){
                        picto.editors.splice(index, 1);
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
                    picto.viewers.splice(index, 1);
                }
                index = picto.editors.indexOf(username);
                if(index!=-1){
                    picto.editors.splice(index, 1);
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