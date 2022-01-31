import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, Query, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { IsValid } from 'src/utilities/creation';
import { editFileName, hashImage, imageFileFilter, maxSize } from 'src/utilities/tools';
import { CollectionService } from './collection.service';
import { createCollectionDto } from './dto/collection.create.dto';
import {ApiOperation} from '@nestjs/swagger';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { shareCollectionDto } from './dto/collection.share.dto';
import { publicCollectionDto } from './dto/collection.public.dto';
import { deleteCollectionDto } from './dto/collection.delete.dto';
import { copyCollectionDto } from './dto/collection.copy.dto';
import { SearchCollectionDto } from './dto/collection.search.public.dto';

@Controller('collection')
export class CollectionController {
  private logger = new Logger('CollectionController');
  constructor(private collectionService: CollectionService){}

  @UseGuards(AuthGuard())
  @Get('find/:id')
  @ApiOperation({summary : 'get a collection that has the provided id'})
  getCollectionById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Collection>{
    this.logger.verbose(`User "${user.username}" getting Collection with id ${id}`);
      return this.collectionService.getCollectionById(id, user);
  }

  @Get('public')
  getPublicCollections(@Query(ValidationPipe) SearchCollectionDto: SearchCollectionDto): Promise<Collection[]>{
      return this.collectionService.getPublicCollection(SearchCollectionDto);
  }
  
  @UseGuards(AuthGuard())
  @Get()
  @ApiOperation({summary : 'get all your collection'})
  getAllUserCollections(@GetUser() user: User): Promise<Collection[]>{
    this.logger.verbose(`User "${user.username}" getting all Collection`);
    return this.collectionService.getAllUserCollections(user);
  }

  @UseGuards(AuthGuard())
  @Post('copy')
  @ApiOperation({summary : 'copy a collection with its ID'})
  async copyCollection(@Body() copyCollectionDto: copyCollectionDto, @GetUser() user: User): Promise<Collection>{
    const fatherCollection = await this.collectionService.getCollectionById(copyCollectionDto.fatherCollectionId, user);
    const copiedId = await this.collectionService.copyCollection(copyCollectionDto.fatherCollectionId, copyCollectionDto.collectionId, user);
    let fatherCollectionsIds = fatherCollection.collections.map(collection => {
      return collection.id;
    })
    fatherCollectionsIds.push(copiedId);
    const modifyCollectionDto : modifyCollectionDto = {
      meaning : null,
      speech : null,
      pictoIds : null,
      starred : null,
      color : null,
      collectionIds : fatherCollectionsIds}
    await this.collectionService.modifyCollection(copyCollectionDto.fatherCollectionId, user, modifyCollectionDto, null);
    return this.getCollectionById(copyCollectionDto.fatherCollectionId, user);
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
    return this.collectionService.shareCollectionVerification(id, user, shareCollectionDto);
  }

  @UseGuards(AuthGuard())
  @Put('publish/:id')
  @UsePipes(ValidationPipe)
  publishCollectionById(@Param('id', ParseIntPipe) id : number, @Body() publicCollectionDto: publicCollectionDto, @GetUser() user: User): Promise<Collection>{
    if(user.admin===true){
      return this.collectionService.publishCollectionById(id, publicCollectionDto, user);
    } else {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can make a collection public`);
    }
  }

  @UseGuards(AuthGuard())
  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './tmp',
        filename: editFileName,
      }),
      limits: {fileSize: maxSize},
      fileFilter: imageFileFilter,
    }),
  )
  async createCollection(@Body() createCollectionDto: createCollectionDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Collection>{
      if(!file){
        this.logger.verbose(`User "${user.username}" Made a bad request that doesn't contain a file`);
        throw new NotFoundException(`There is no file or no filename`);
      } else {
        if(IsValid(createCollectionDto.meaning, createCollectionDto.speech)){
          if(createCollectionDto.fatherCollectionId!=user.shared){
            this.logger.verbose(`User "${user.username}" creating Collection`);
            const filename = await hashImage(file);
            const collection = await this.collectionService.createCollection(createCollectionDto, user, filename);
            const fatherCollection = await this.collectionService.getCollectionById(createCollectionDto.fatherCollectionId, user);
            let fatherCollectionsIds = fatherCollection.collections.map(collection => {
              return collection.id;
            })
            fatherCollectionsIds.push(collection.id);
            const modifyCollectionDto : modifyCollectionDto = {
              meaning : null,
              speech : null,
              pictoIds : null,
              starred : null,
              color : null,
              collectionIds : fatherCollectionsIds}
            this.collectionService.modifyCollection(createCollectionDto.fatherCollectionId, user, modifyCollectionDto, null);
            if(createCollectionDto.share){
              this.collectionService.autoShare(collection, fatherCollection);
              this.logger.verbose(`Auto sharing collection "${collection.id}" with viewers and editors`);
            }
            return collection;
          } else {
            this.logger.verbose(`User "${user.username}" tried to create collection into shared collections`);
            throw new ForbiddenException(`You cannot create a collection into your shared collection`);
          }
        } else {
          this.logger.verbose(`User "${user.username}"Made a bad request where Object has either invalid attributes or "meaning" and "speech" don't have the same length`);
          throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
        }
      }
  }

  @UseGuards(AuthGuard())
  @Post('/root')
  createRoot(@GetUser() user: User): Promise<number>{
    this.logger.verbose(`User "${user.username}" Creating 'Root' Collection if needed`);
    return this.collectionService.createRoot(user);
  }

  @UseGuards(AuthGuard())
  @Delete()
  deleteCollection(@Query(ValidationPipe) deleteCollectionDto: deleteCollectionDto, @GetUser() user: User): Promise<void> {
    deleteCollectionDto.collectionId=Number(deleteCollectionDto.collectionId);
    this.logger.verbose(`User "${user.username}" deleting Collection with id ${deleteCollectionDto.collectionId}`);
    return this.collectionService.deleteCollection(deleteCollectionDto, user);
  }

  @UseGuards(AuthGuard())
  @Put('/:id')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './tmp',
        filename: editFileName,
      }),
      limits: {fileSize: maxSize},
      fileFilter: imageFileFilter,
    }),
  )
  async modifyCollection(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyCollectionDto: modifyCollectionDto, @UploadedFile() file: Express.Multer.File): Promise<Collection>{
    if(IsValid(modifyCollectionDto.meaning, modifyCollectionDto.speech)){      
      this.logger.verbose(`User "${user.username}" Modifying Collection with id ${id}`);
      if(file){
          const filename = await hashImage(file);
        return this.collectionService.modifyCollection(id, user, modifyCollectionDto, filename);
      } else {
        return this.collectionService.modifyCollection(id, user, modifyCollectionDto, null);
      }
    } else {
      this.logger.verbose(`User "${user.username}"Made a bad request where Object has either invalid attributes or "meaning" and "speech" don't have the same length`);
      throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
    }
  }
}
