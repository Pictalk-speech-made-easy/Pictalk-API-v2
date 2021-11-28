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
        const text = new MLtext();
        picto.meaning = getArrayIfNeeded(text);
        picto.speech = speech;
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
        let { meaning, speech, collectionIds, starred} = modifyPictoDto;
        if(meaning){
            picto.meaning = meaning;
        }
        if(speech){
            picto.speech = speech;
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

        async MLtextFromDto()
}
