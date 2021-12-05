import { InternalServerErrorException } from "@nestjs/common";
import { MLtext } from "src/entities/MLtext.entity";
import { Picto } from "src/entities/picto.entity";
import { User } from "src/entities/user.entity";
import { getArrayIfNeeded } from "src/utilities/tools";
import { EntityRepository, Repository } from "typeorm";
import { createPictoDto } from "./dto/picto.create.dto";
import { modifyPictoDto } from "./dto/picto.modify.dto";

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
}
