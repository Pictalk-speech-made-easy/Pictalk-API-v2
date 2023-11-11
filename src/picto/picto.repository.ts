import { InternalServerErrorException } from '@nestjs/common';
import { Collection } from 'src/entities/collection.entity';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { parseNumberArray } from 'src/utilities/tools';
import { CustomRepository } from 'src/utilities/typeorm-ex.decorator';
import { Repository } from 'typeorm';
import { createPictoDto } from './dto/picto.create.dto';
import { modifyPictoDto } from './dto/picto.modify.dto';
import { sharePictoDto } from './dto/picto.share.dto';

@CustomRepository(Picto)
export class PictoRepository extends Repository<Picto> {
  async createPicto(
    createPictoDto: createPictoDto,
    user: User,
    filename: string,
  ): Promise<Picto> {
    let { meaning, speech, collectionIds, color, pictohubId } = createPictoDto;
    const picto = new Picto();
    try {
      picto.speech = JSON.parse(speech);
    } catch (error) {
      picto.speech = {};
    }
    try {
      picto.speech = JSON.parse(speech);
    } catch (error) {
      picto.speech = {};
    }
    picto.image = filename;
    picto.userId = user.id;
    if (color) {
      picto.color = color;
    }
    if (pictohubId) {
      picto.pictohubId = Number(pictohubId);
    }
    if (collectionIds) {
      collectionIds = parseNumberArray(collectionIds);
      picto.collections = collectionIds.map(
        (collectionIds) => ({ id: collectionIds } as any),
      );
    }
    try {
      await picto.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    //delete picto.user;
    return picto;
  }

  async modifyPicto(
    picto: Picto,
    modifyPictoDto: modifyPictoDto,
    user: User,
    filename: string,
  ): Promise<Picto> {
    let { meaning, speech, collectionIds, priority, color, pictohubId } =
      modifyPictoDto;
    if (meaning) {
      try {
        picto.meaning = JSON.parse(meaning);
      } catch (error) {
        picto.meaning = meaning;
      }
    }
    if (speech) {
      try {
        picto.speech = JSON.parse(speech);
      } catch (error) {
        picto.speech = speech;
      }
    }
    if (color) {
      picto.color = color;
    }
    if (filename) {
      picto.image = filename;
    }
    if (pictohubId) {
      picto.pictohubId = Number(pictohubId);
    }
    if (collectionIds) {
      collectionIds = parseNumberArray(collectionIds);
      picto.collections = collectionIds.map(
        (collectionIds) => ({ id: collectionIds } as any),
      );
    }
    if (priority) {
      picto.priority = Number(priority);
    }
    await picto.save();
    //delete picto.user;
    return picto;
  }

  async sharePicto(
    picto: Picto,
    sharePictoDto: sharePictoDto,
    user: User,
  ): Promise<Picto> {
    try {
      picto = await this.sharePictoFromDto(picto, sharePictoDto);
      try {
        await picto.save();
      } catch (error) {
        throw new InternalServerErrorException('could not save picto');
      }
    } catch (error) {
      throw new InternalServerErrorException('could not share picto');
    }
    return picto;
  }

  async sharePictoFromDto(
    picto: Picto,
    sharePictoDto: sharePictoDto,
  ): Promise<Picto> {
    const { access, username, role } = sharePictoDto;
    let index: number;
    if (access == 1) {
      if (role === 'editor') {
        index = picto.viewers.indexOf(username);
        if (index != -1) {
          picto.viewers.splice(index, 1);
        }
        index = picto.editors.indexOf(username);
        if (!(index != -1)) {
          picto.editors.push(username);
        }
      } else if (role === 'viewer') {
        index = picto.editors.indexOf(username);
        if (index != -1) {
          picto.editors.splice(index, 1);
        }
        index = picto.viewers.indexOf(username);
        if (!(index != -1)) {
          picto.viewers.push(username);
        }
      } else {
        throw new InternalServerErrorException(
          `role must be 'viewer or 'editor'`,
        );
      }
    } else {
      index = picto.viewers.indexOf(username);
      if (index != -1) {
        picto.viewers.splice(index, 1);
      }
      index = picto.editors.indexOf(username);
      if (index != -1) {
        picto.editors.splice(index, 1);
      }
    }
    return picto;
  }
  async autoShare(picto: Picto, fatherCollection: Collection): Promise<Picto> {
    picto.editors = fatherCollection.editors;
    picto.viewers = fatherCollection.viewers;
    try {
      await picto.save();
    } catch (error) {
      throw new InternalServerErrorException('could not auto share picto');
    }
    return picto;
  }

  async copyPicto(
    picto: Picto,
    fatherCollectionId: number,
    user: User,
  ): Promise<Picto> {
    const copiedPicto = new Picto();
    try {
      copiedPicto.meaning = JSON.parse(picto.meaning);
    } catch (error) {
      copiedPicto.meaning = picto.meaning;
    }
    try {
      copiedPicto.speech = JSON.parse(picto.speech);
    } catch (error) {
      copiedPicto.speech = picto.speech;
    }
    copiedPicto.image = picto.image;
    copiedPicto.userId = user.id;
    copiedPicto.color = picto.color;
    const collectionIds = [+fatherCollectionId];
    copiedPicto.collections = collectionIds.map(
      (collectionId) => ({ id: collectionId } as any),
    );
    try {
      await copiedPicto.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    //delete picto.user;
    return copiedPicto;
  }
}
