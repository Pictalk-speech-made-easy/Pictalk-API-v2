import { deletePictoDto } from './../picto/dto/picto.delete.dto';
import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Collection } from 'src/entities/collection.entity';
import { Notif } from 'src/entities/notification.entity';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { createPictoDto  } from 'src/picto/dto/picto.create.dto';
import { PictoService } from 'src/picto/picto.service';
import { CollectionRepository } from './collection.repository';
import { createCollectionDto } from './dto/collection.create.dto';
import { deleteCollectionDto } from './dto/collection.delete.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { MoveToCollectionDto } from './dto/collection.move.dto';
import { publicCollectionDto } from './dto/collection.public.dto';
import { SearchCollectionDto } from './dto/collection.search.public.dto';
import { shareCollectionDto, multipleShareCollectionDto } from './dto/collection.share.dto';
import { In } from 'typeorm';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(CollectionRepository)
        private collectionRepository : CollectionRepository,
        @Inject(forwardRef(() => AuthService))
        private authService : AuthService,
        @Inject(forwardRef(() => PictoService))
        private pictoService : PictoService,

    ) { }

    async getCollectionCount(): Promise<number>{
        return await this.collectionRepository.createQueryBuilder('collection').getCount()
    }

    async getCollectionById(id: number, user : User): Promise<Collection>{
        const collection = await this.collectionRepository.findOne({relations: ["pictos", "collections"],where : {id}});
        
        if(!collection) {
            throw new NotFoundException(`Collection with ID '${id}' not found`);  
        } else {
            let viewer : number;
            let editor : number;
            viewer = collection.viewers.indexOf(user.username);
            editor = collection.editors.indexOf(user.username);
            if(collection.public === true || viewer!=-1 || editor!=-1 || collection.userId === user.id){
                return this.verifyAcces(collection, user);
            } else {
                throw new UnauthorizedException(`User ${user.username} does not have access to this collection`);
            }
        }
    }

    verifyAcces(collection: Collection, user: User): Collection{
        let viewer : number;
        let editor : number;
        for(let index = 0; index < collection.collections.length; index++){
            viewer = collection.collections[index].viewers.indexOf(user.username);
            editor = collection.collections[index].editors.indexOf(user.username);
            if(collection.collections[index].public === false && viewer ===-1 && editor ===-1 && collection.collections[index].userId != user.id){
                collection.collections.splice(index, 1);
            }   
        }
        for(let index = 0; index < collection.pictos.length; index++){
            viewer = collection.pictos[index].viewers.indexOf(user.username);
            editor = collection.pictos[index].editors.indexOf(user.username);
            if(collection.pictos[index].public === false && viewer ===-1 && editor ===-1 && collection.pictos[index].userId != user.id){
                collection.pictos.splice(index, 1);
            }   
        }
        return collection;
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

    async createSider(user: User): Promise<number>{
        return this.collectionRepository.createSider(user);
    }

    async createShared (user: User): Promise<number>{
        return this.collectionRepository.createShared(user);
    }

    async deleteCollection(deleteCollectionDto: deleteCollectionDto, user: User): Promise<void>{
        if(deleteCollectionDto.collectionId!=user.root && deleteCollectionDto.collectionId!=user.shared){
            const collection = await this.getCollectionById(deleteCollectionDto.collectionId, user);
            if(deleteCollectionDto.fatherId){
                deleteCollectionDto.fatherId=Number(deleteCollectionDto.fatherId);
                const fatherCollection = await this.getCollectionById(deleteCollectionDto.fatherId, user);
                let fatherCollectionsIds = fatherCollection.collections.map(collection => {return collection.id;})
                fatherCollectionsIds.splice(fatherCollectionsIds.indexOf(deleteCollectionDto.collectionId),1);
                const modifyCollectionDto : modifyCollectionDto = {
                    meaning : null,
                    speech : null,
                    pictoIds : null,
                    priority : 10,
                    color : null,
                    collectionIds : fatherCollectionsIds,
                    pictohubId: null
                }
                await this.modifyCollection(deleteCollectionDto.fatherId, user, modifyCollectionDto, null);
            }
            try{
                const result = await this.collectionRepository.delete({
                    id: deleteCollectionDto.collectionId,
                    userId: user.id,
                  });
            } catch(error){
                if(error.code === "23503"){
                    return;
                } else {
                    throw new InternalServerErrorException(`couldn't delete collection with id ${deleteCollectionDto.collectionId}`);
                }
            }
        } else {
            throw new UnauthorizedException(`Cannot delete "root" or "shared with me" Collections of User ${user.username}`);
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
            if(collection.public){
                const admins = await this.authService.admins();
                admins.map(async(admin) => {
                    const notification = await this.createNotif(collection, admin, "public collection", "modified");
                    this.authService.pushNotification(admin, notification);
                });
            }
            return this.collectionRepository.modifyCollection(collection, modifyCollectionDto, user, filename);
        } else {
            throw new UnauthorizedException(`User '${user.username}' is not authorized to modify this collection`);
        }
       
    }

    async shareCollectionVerification(id: number, user: User, multipleShareCollectionDto: multipleShareCollectionDto): Promise<Collection>{
        //filter all the users that don't exist and remove them from the operation
        let sharers = await Promise.all(multipleShareCollectionDto.usernames.map(async username => {
            const sharer = await this.authService.findWithUsername(username);
            const exists = this.authService.verifyExistence(sharer)
            if(exists && (sharer.username !== user.username)){
                return sharer;
            }
        }));
        sharers = sharers.filter(Boolean);
        multipleShareCollectionDto.usernames = sharers.map(sharer => {return sharer.username});
        if(sharers.length>0){
            const collection=await this.getCollectionById(id, user);
            if(collection){
                const editor = collection.editors.indexOf(user.username);
                if(multipleShareCollectionDto.role==="editor" && !(collection.userId === user.id || editor!=-1)){
                    throw new UnauthorizedException(`${user.username} cannot share to ${sharers} as editor being a viewer youself`);
                }
                // here we add the shared collection in the 'hared with me' collection of each sharer and send notifications if necessary
                for(let sharer of sharers){
                    const sharedWithMe = await this.getCollectionById(sharer.shared, sharer);
                    this.collectionRepository.pushCollection(sharedWithMe, collection);
                    const directSharer = sharer.directSharers.indexOf(user.username);
                    if(directSharer!=-1){
                        const sharerRoot = await this.getCollectionById(sharer.root, sharer);
                        this.collectionRepository.pushCollection(sharerRoot, collection);
                    }
                    if(multipleShareCollectionDto.access==1){
                        if((collection.editors.indexOf(sharer.username)==-1) && (collection.viewers.indexOf(sharer.username)==-1)){
                            const notification = await this.createNotif(collection, user, "collection", "share");
                            this.authService.pushNotification(sharer, notification);
                        }
                    }
                    if (multipleShareCollectionDto.access == 0){
                        if((collection.editors.indexOf(sharer.username)!==-1) || (collection.viewers.indexOf(sharer.username)!==-1)){
                            const notification = await this.createNotif(collection, user, "collection", "unshare");
                            this.authService.pushNotification(sharer, notification);  
                        }
                    }
                }
                return this.shareCollectionById(id, multipleShareCollectionDto, user);  
            } else {
                throw new NotFoundException(`Collection with ID '${id}' not found`);
            }
        } else {// does nothing because no one to share to, unvalid usernames
            throw new ForbiddenException(`sharers is empty or does not exist`);
        }
    }

    async createNotif(collection: Collection, user: User, type: string, operation: string): Promise<Notif>{
        try{
            const notification: Notif = new Notif(type, operation, collection.id.toString(), collection.meaning, user.username);
            return notification;
        } catch(error){
            throw new InternalServerErrorException(`could not create notification ${error}`);
        }
    } 

    async shareCollectionById(collectionId : number, multipleShareCollectionDto: multipleShareCollectionDto, user: User): Promise<Collection>{
        this.sharingtTestquery(collectionId, multipleShareCollectionDto, user);
        /*
        let collection = await this.getCollectionById(collectionId, user);
        try{
            collection.collections.map(collection => this.shareCollectionById(collection.id, multipleShareCollectionDto, user));
        } catch(error){}
        try{
            collection.pictos.map(picto => this.collectionRepository.sharePictoFromDto(picto, multipleShareCollectionDto));
        } catch(error){}
        try{
            collection=await this.collectionRepository.shareCollectionFromDto(collection, multipleShareCollectionDto);
        } catch(error){}
        return collection;
        */
       return new Collection();
    }

    async publishCollectionById(collectionId : number, publicCollectionDto: publicCollectionDto, user: User): Promise<Collection>{
        let collection = await this.getCollectionById(collectionId, user);
        if(collection.userId === user.id){
            try{
                collection.collections.map(collection => this.publishCollectionById(collection.id, publicCollectionDto, user));
            } catch(error){}
            try{
                collection.pictos.map(picto => this.collectionRepository.publishPicto(picto, publicCollectionDto.publish, user));
            } catch(error){}
            try{
                collection=await this.collectionRepository.publishCollection(collection, publicCollectionDto.publish, user);
            } catch(error){}
        }
        return collection;
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
                    const picto = await this.pictoService.getPictoById(verificationDto.pictoIds[i], user);
                } catch(error) {
                    i=i-1;
                    verificationDto.pictoIds.splice(i, 1);
                }
            }
        } catch(error){}
        return verificationDto;
    }

    async pushPicto(collection: Collection, picto: Picto):Promise<void>{
        return this.collectionRepository.pushPicto(collection, picto);
    }

    async getPublicCollection(SearchCollectionDto: SearchCollectionDto): Promise<Collection[]>{
        return this.collectionRepository.getPublicCollections(SearchCollectionDto);
    }
    
    async copyPicto(fatherId: number, picto: Picto, user: User): Promise<number>{
        const editor = picto.editors.indexOf(user.username);
        const viewer = picto.viewers.indexOf(user.username);
        if(picto.userId===user.id || editor!=-1 || viewer!=-1 || picto.public){
            const createPictoDto : createPictoDto = {
                meaning : picto.meaning,
                speech : picto.speech,
                color : picto.color,
                collectionIds : null,
                fatherCollectionId : fatherId,
                share : 1,
                pictohubId: null,
            }  
            const copiedPicto = await this.pictoService.createPicto(createPictoDto, user, picto.image);
            return copiedPicto.id;  
        } else {
            return null;
        }
    }

    async copyCollection(fatherId: number, collectionId: number, user: User): Promise<number>{
        try{
            const collection = await this.getCollectionById(collectionId, user);
            if(collection){
                const createCollectionDto : createCollectionDto = {
                    meaning : collection.meaning,
                    speech : collection.speech,
                    color : collection.color,
                    pictohubId: null,
                    collectionIds : await Promise.all(collection.collections.map(child => {return this.copyCollection(collection.id, child.id, user);})),
                    pictoIds : await Promise.all(collection.pictos.map(child => {return this.copyPicto(collection.id, child, user);})),
                    fatherCollectionId : fatherId,
                    share : 0,
                }  
                const copiedCollection = await this.createCollection(createCollectionDto, user, collection.image);
                return copiedCollection.id;  
            }
        } catch(error){
            if(error.status == "401" || error.status == "404"){
                return null;
            } else {
                console.log(error);
                throw new InternalServerErrorException(`couldn't copy Collection`);
            }
        }
    }

    async moveToCollection(user: User, moveToCollectionDto: MoveToCollectionDto, fatherCollectionId: number): Promise<Collection> {
        const targetCollection = await this.getCollectionById(moveToCollectionDto.targetCollectionId, user);
        if (moveToCollectionDto.sourceCollectionId) {
            const modifyCollection = new modifyCollectionDto()
            modifyCollection.collectionIds = targetCollection.collections.map(collection => collection.id);
            modifyCollection.collectionIds.push(moveToCollectionDto.sourceCollectionId)
            const deleteCollection = new deleteCollectionDto()
            deleteCollection.collectionId = Number(moveToCollectionDto.sourceCollectionId);
            deleteCollection.fatherId = fatherCollectionId;
            await this.collectionRepository.modifyCollection(targetCollection, modifyCollection, user, null)
            await this.deleteCollection(deleteCollection, user)
        } else if (moveToCollectionDto.sourcePictoId) {
            const modifyCollection = new modifyCollectionDto();
            modifyCollection.pictoIds = targetCollection.pictos.map(collection => collection.id);
            modifyCollection.pictoIds.push(moveToCollectionDto.sourcePictoId);
            const deletePicto = new deletePictoDto();
            deletePicto.fatherId = fatherCollectionId;
            deletePicto.pictoId = Number(moveToCollectionDto.sourcePictoId);
            await this.collectionRepository.modifyCollection(targetCollection, modifyCollection, user, null)
            await this.pictoService.deletePicto(deletePicto, user)
        }
        return await this.getCollectionById(fatherCollectionId, user);
    }
    async getAllChildren(fatherId: number): Promise<any> {
        let children = await this.collectionRepository.query(
            `WITH RECURSIVE c AS (
                SELECT ${fatherId} AS id
                UNION ALL
                SELECT cr.child
                FROM c_relations AS cr
                   JOIN c ON c.id = cr. parent
             )
             SELECT id FROM c;`
            //`SELECT collectionId_1 FROM collection_collections_collection`
        )
        return children.map((child)=>{return child.id});
    }

    async sharingtTestquery(collectionId : number, multipleShareCollectionDto: multipleShareCollectionDto, user: User) { //inserts array of names into viewers and removes duplicates !
        const collectionIds = await this.getAllChildren(collectionId);

        const users = multipleShareCollectionDto.usernames.map((username)=>{
            return `'${username}'`;
        });
        console.log(users);
        const sql = `UPDATE collection SET ${multipleShareCollectionDto.role}s = (SELECT array_remove(array_agg(DISTINCT x), NULL)::text[] FROM unnest(${multipleShareCollectionDto.role}s || ARRAY[${users}]) x) WHERE id IN (${collectionIds});`
        console.log(sql);
        const result = await this.collectionRepository.query(sql)
        console.log(result);
    }
    //NEXT STEP - combine the "getallchildren" and this to do the sharing
    //NEXT NEXT STEP - redo the copy paste
}
// const userRepository = getManager().getRepository(User);

// const usernames = ["alice", "bob", "charlie", "bob"];

// const queryBuilder = userRepository.createQueryBuilder();
// queryBuilder
//   .insert()
//   .into(User)
//   .values(usernames.map(username => ({ username })))
//   .onConflict(`("username") DO NOTHING`)
//   .execute()
//   .then(result => console.log(result))
//   .catch(error => console.error(error));
// }