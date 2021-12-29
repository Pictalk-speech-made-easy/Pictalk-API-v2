import { forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Collection } from 'src/entities/collection.entity';
import { Notif } from 'src/entities/notification.entity';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { PictoService } from 'src/picto/picto.service';
import { CollectionRepository } from './collection.repository';
import { createCollectionDto } from './dto/collection.create.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { publicCollectionDto } from './dto/collection.public.dto';
import { shareCollectionDto } from './dto/collection.share.dto';

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
            if(collection.public===true){
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

    async createShared (user: User): Promise<number>{
        return this.collectionRepository.createShared(user);
    }

    async deleteCollection(id: number, user: User): Promise<void>{
        if(id!=user.root && id!=user.shared){
            const result = await this.collectionRepository.delete({
                id: id,
                userId: user.id,
              });
            if(result.affected===0) {
                throw new NotFoundException(`Collection with ID '${id}' not found`);
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
            return this.collectionRepository.modifyCollection(collection, modifyCollectionDto, user, filename);
        } else {
            throw new UnauthorizedException(`User '${user.username}' is not authorized to modify this collection`);
        }
       
    }

    async shareCollectionVerification(id: number, user: User, shareCollectionDto: shareCollectionDto): Promise<Collection>{
        const sharer = await this.authService.findWithUsername(shareCollectionDto.username);
        const exists = await this.authService.verifyExistence(sharer);
        if(exists){
            const collection=await this.getCollectionById(id, user);
            if(collection){
                const editor = collection.editors.indexOf(user.username);
                if(!(shareCollectionDto.role==="editor" && (collection.userId === user.id || editor!=-1))){
                    throw new UnauthorizedException(`${user.username} cannot share to ${sharer.username} as editor being a viewer youself`);
                 }
                const sharedWithMe = await this.getCollectionById(sharer.shared, sharer);
                this.collectionRepository.pushCollection(sharedWithMe, collection);
                const directSharer = sharer.directSharers.indexOf(user.username);
                if(directSharer!=-1){
                    const sharerRoot = await this.getCollectionById(sharer.root, sharer);
                    this.collectionRepository.pushCollection(sharerRoot, collection);
                }
                const notification = await this.createNotif(id, user, "collection", "share");
                this.authService.pushNotification(sharer, notification);
                return this.shareCollectionById(id, shareCollectionDto, user);
            } else {
                throw new NotFoundException(`Collection with ID '${id}' not found`);
            }
        } else {
            throw new NotFoundException(`user with name '${shareCollectionDto.username}' not found`);
        }
    }

    async createNotif(id : number, user: User, type: string, operation: string): Promise<Notif>{
        const notification = new Notif()
        notification.affected=id;
        notification.operation=operation;
        notification.type=type;
        notification.username=user.username;
        return notification;
    } 

    async shareCollectionById(collectionId : number, shareCollectionDto: shareCollectionDto, user: User): Promise<Collection>{
        let collection = await this.getCollectionById(collectionId, user);
        try{
            collection.collections.map(collection => this.shareCollectionById(collection.id, shareCollectionDto, user));
        } catch(error){}
        try{
            collection.pictos.map(picto => this.collectionRepository.sharePictoFromDto(picto, shareCollectionDto));
        } catch(error){}
        try{
            collection=await this.collectionRepository.shareCollectionFromDto(collection, shareCollectionDto);
        } catch(error){}
        return collection;
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

    async getPublicCollection(): Promise<Collection[]>{
        const publicCollections = await this.collectionRepository.find({relations: ["pictos", "collections"],where : {public : true}});
        if(publicCollections){
            return publicCollections;
        } else {
            throw new NotFoundException(`there are no public collections`);
        }
    }
}