import { InternalServerErrorException } from "@nestjs/common";
import { Collection } from "src/entities/collection.entity";
import { MLtext } from "src/entities/MLtext.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createPictoDto } from "./dto/picto.create.dto";
import { modifyPictoDto } from "./dto/picto.modify.dto";
import { sharePictoDto } from "./dto/picto.share.dto";

@EntityRepository(Picto)
export class PictoRepository extends Repository<Picto> {
    async createPicto(createPictoDto: createPictoDto, user: User, filename: string): Promise<Picto> {
        let { meaning, speech, language, collectionIds} = createPictoDto;
        const picto = new Picto();
        picto.meaning = await this.MLtextFromTexts(language, meaning);
        picto.speech = await this.MLtextFromTexts(language, speech);
        picto.image = filename;
        picto.userId = user.id;
        if(collectionIds){
            collectionIds=getArrayIfNeeded(collectionIds);
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
        let { language, meaning, speech, collectionIds, starred} = modifyPictoDto;
        if(meaning){
            picto.meaning = await this.MLtextFromTexts(language, meaning);
        }
        if(speech){
            picto.speech = await this.MLtextFromTexts(language, speech);
        }
        if(filename){
            picto.image = filename;
        }
        if(collectionIds){
            collectionIds=getArrayIfNeeded(collectionIds);
            picto.collections = collectionIds.map(collectionIds => ({ id: collectionIds } as any));
        }
        if(starred){
            picto.starred = starred;
        }
        await picto.save();
        //delete picto.user;
        return picto;
    }

    async MLtextFromTexts(language, text): Promise<MLtext[]>{
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

    async sharePicto(picto: Picto, sharePictoDto: sharePictoDto, user: User): Promise<Picto>{
        try{
            picto=await this.sharePictoFromDto(picto, sharePictoDto);
        } catch(error){}
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return picto;
    }

    async sharePictoFromDto(picto: Picto, sharePictoDto: sharePictoDto): Promise<Picto>{
        const {access, username, role} = sharePictoDto;
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
    async autoShare(picto : Picto, fatherCollection: Collection): Promise<Picto>{
        picto.editors= fatherCollection.editors;
        picto.viewers= fatherCollection.viewers;
        try {
            await picto.save();
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        return picto;
    }
}
