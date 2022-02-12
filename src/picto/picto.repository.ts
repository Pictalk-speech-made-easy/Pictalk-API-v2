import { InternalServerErrorException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { parseNumberArray } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createPictoDto } from "./dto/picto.create.dto";
import { modifyPictoDto } from "./dto/picto.modify.dto";
import { sharePictoDto } from "./dto/picto.share.dto";

@EntityRepository(Picto)
export class PictoRepository extends Repository<Picto> {
    async createPicto(createPictoDto: createPictoDto, user: User, filename: string): Promise<Picto> {
        let { meaning, speech, collectionIds, color} = createPictoDto;
        const picto = new Picto();
        picto.meaning = meaning;
        picto.speech = speech;
        picto.image = filename;
        picto.userId = user.id;
        if(color){
            picto.color=color;
        }
        if(collectionIds){
            collectionIds=parseNumberArray(collectionIds);
            picto.collections = collectionIds.map(collectionIds => ({ id: collectionIds } as any));
        }
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        //delete picto.user;
        return picto;
    }

    async modifyPicto(picto: Picto, modifyPictoDto: modifyPictoDto, user: User, filename: string): Promise<Picto> {
        let { meaning, speech, collectionIds, starred, color} = modifyPictoDto;
        if(meaning){
            picto.meaning = meaning;
        }
        if(speech){
            picto.speech = speech;
        }
        if(color){
            picto.color=color;
        }
        if (filename) {
            picto.image = filename;
        }
        if(collectionIds){
            collectionIds=parseNumberArray(collectionIds);
            picto.collections = collectionIds.map(collectionIds => ({ id: collectionIds } as any));
        }
        if(starred){
            picto.starred = starred;
        }
        await picto.save();
        //delete picto.user;
        return picto;
    }

    async sharePicto(picto: Picto, sharePictoDto: sharePictoDto, user: User): Promise<Picto>{
        try{
            picto=await this.sharePictoFromDto(picto, sharePictoDto);
            try {
                await picto.save();
            } catch (error) {
                throw new InternalServerErrorException('could not save picto');
            }
        } catch(error){
            throw new InternalServerErrorException('could not share picto');
        }
        return picto;
    }

    async sharePictoFromDto(picto: Picto, sharePictoDto: sharePictoDto): Promise<Picto>{
        const {access, username, role} = sharePictoDto;
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
                index = picto.viewers.indexOf(username);
                if(!(index!=-1)){
                    picto.viewers.push(username);
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
    async autoShare(picto : Picto, fatherCollection: Collection): Promise<Picto>{
        picto.editors= fatherCollection.editors;
        picto.viewers= fatherCollection.viewers;
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException('could not auto share picto');
        }
        return picto;
    }
}
