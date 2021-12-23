import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { verifySameLength } from 'src/utilities/creation';
import { editFileName, getArrayIfNeeded, imageFileFilter } from 'src/utilities/tools';
import { CollectionService } from './collection.service';
import { createCollectionDto } from './dto/collection.create.dto';
import {ApiOperation} from '@nestjs/swagger';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { shareCollectionDto } from './dto/collection.share.dto';

@Controller('collection')
export class CollectionController {
  private logger = new Logger('CollectionController');
  constructor(private collectionService: CollectionService){}

  @UseGuards(AuthGuard())
  @Get('/:id')
  @ApiOperation({summary : 'get a collection that has the provided id'})
  getCollectionById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Collection>{
    this.logger.verbose(`User "${user.username}" getting Collection with id ${id}`);
      return this.collectionService.getCollectionById(id, user);
  }

  @UseGuards(AuthGuard())
  @Get()
  @ApiOperation({summary : 'get all your collection'})
  getAllUserCollections(@GetUser() user: User): Promise<Collection[]>{
    this.logger.verbose(`User "${user.username}" getting all Collection`);
    return this.collectionService.getAllUserCollections(user);
  }

  @UseGuards(AuthGuard())
  @Put('share/:id')
  @UsePipes(ValidationPipe)
  @ApiOperation({summary : 'share a collection with another user, with readonly or editor role'})
  shareCollectionById(@Param('id', ParseIntPipe) id : number, @Body() shareCollectionDto: shareCollectionDto, @GetUser() user: User): Promise<Collection>{
    if(shareCollectionDto.access){
      this.logger.verbose(`User "${user.username}" sharing Collection with id ${id} to User ${shareCollectionDto.username} as ${shareCollectionDto.role}`);
    } else {
      this.logger.verbose(`User "${user.username}" revoking access to Collection with id ${id} for User ${shareCollectionDto.username}`);
    }
    return this.collectionService.shareCollectionById(id, user, shareCollectionDto);
  }

  @UseGuards(AuthGuard())
  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './files/image',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async createCollection(@Body() createCollectionDto: createCollectionDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Collection>{
      if(!file){
        this.logger.verbose(`User "${user.username}" Made a bad request that doesn't contain a file`);
        throw new NotFoundException(`There is no file or no filename`);
      } else {
        const {language, meaning, speech, fatherCollectionId} = createCollectionDto;
        if(verifySameLength(language, meaning, speech)){
          this.logger.verbose(`User "${user.username}" creating Collection`);
          const collection = await this.collectionService.createCollection(createCollectionDto, user, file.filename);
          const fatherCollection = await this.collectionService.getCollectionById(fatherCollectionId, user);
          let fatherCollectionsIds = fatherCollection.collections.map(collection => {
            return collection.id;
          })
          fatherCollectionsIds.push(collection.id);
          const modifyCollectionDto : modifyCollectionDto = {
            meaning : null,
            speech : null,
            language : null,
            pictoIds : null,
            starred : null,
            color : null,
            collectionIds : fatherCollectionsIds}
          this.collectionService.modifyCollection(fatherCollectionId, user, modifyCollectionDto, null);
          if(createCollectionDto.share){
            this.collectionService.autoShare(collection, fatherCollection);
            this.logger.verbose(`Auto sharing collection "${collection.id}" with viewers and editors`);
          }
          return collection;
        } else {
          this.logger.verbose(`User "${user.username}"Made a bad request were Languages, Meanings, and Speeches don't have the same number of arguments`);
          throw new BadRequestException(`bad request were Languages :${language}, Meanings :${meaning}, and Speeches :${speech} don't have the same number of arguments`);
        }
      }
  }

  @UseGuards(AuthGuard())
  @Post('/root')
  createRoot(@GetUser() user: User): Promise<number>{
    this.logger.verbose(`User "${user.username}" Creating Root`);
    return this.collectionService.createRoot(user);
  }

  @UseGuards(AuthGuard())
  @Delete('/:id')
  deleteCollection(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<void> {
    this.logger.verbose(`User "${user.username}" deleting Collection with id ${id}`);
    return this.collectionService.deleteCollection(id, user);
  }

  @UseGuards(AuthGuard())
  @Put('/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './files/image',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  modifyCollection(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyCollectionDto: modifyCollectionDto, file: Express.Multer.File): Promise<Collection>{
    
    const {language, meaning, speech} = modifyCollectionDto;
    if(verifySameLength(language, meaning, speech)){
      this.logger.verbose(`User "${user.username}" Modifying Collection with id ${id}`);
      if(file){
        return this.collectionService.modifyCollection(id, user, modifyCollectionDto, file.filename);
      } else {
        return this.collectionService.modifyCollection(id, user, modifyCollectionDto, null);
      }
    } else {
      this.logger.verbose(`User "${user.username}"Made a bad request were Languages, Meanings, and Speeches don't have the same number of arguments`);
      throw new BadRequestException(`bad request were Languages :${language}, Meanings :${meaning}, and Speeches :${speech} don't have the same number of arguments`);
    }
  }
}
