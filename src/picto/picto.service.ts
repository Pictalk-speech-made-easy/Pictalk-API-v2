import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { PictoRepository } from './picto.repository';
import { createPictoDto } from './dto/picto.create.dto';
import { modifyPictoDto } from './dto/picto.modify.dto';

@Injectable()
export class PictoService {
    constructor(
        @InjectRepository(PictoRepository)
        private pictoRepository : PictoRepository,
    ) { }

    async getPictoById(id: number, user : User): Promise<Picto>{
        const found = await this.pictoRepository.findOne({where : {id}});
        if(!found) {
            throw new NotFoundException(`Picto with ID "${id}" not found`);
        } else if(!(user.id == found.userId)){
            if(found.editorsIds!=null){
                if(user.id in found.editorsIds){
                    return found;
                }
            } else if(found.viewersIds != null){
                if(user.id in found.viewersIds){
                    return found;
                }
            }
        } else {
            return found;
        }
        throw new UnauthorizedException(`${user.username} does not have acces to this picto`);
    }

    async createPicto(createPictoDto: createPictoDto, user: User, filename: string): Promise<Picto> {
        return this.pictoRepository.createPicto(createPictoDto, user, filename);
    }

    async deletePicto(id: number, user: User): Promise<void> {
        const result = await this.pictoRepository.delete({
            id: id,
            userId: user.id,
          });
        if(result.affected===0) {
            throw new NotFoundException(`Picto with ID "${id}" not found`);
        }
    }

    async modifyPicto(id: number, user: User, modifyPictoDto: modifyPictoDto, filename: string): Promise<Picto>{
        const picto=await this.getPictoById(id, user);
        return this.pictoRepository.modifyPicto(picto, modifyPictoDto, user, filename);
    }
}