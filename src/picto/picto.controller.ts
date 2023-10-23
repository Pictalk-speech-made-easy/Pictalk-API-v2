import { BadRequestException, Body, Controller, Delete, ForbiddenException, forwardRef, Get, Inject, InternalServerErrorException, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { editFileName, hashImage, imageFileFilter, maxSize } from 'src/utilities/tools';
import { PictoService } from './picto.service';
import { createPictoDto } from './dto/picto.create.dto';
import { modifyPictoDto } from './dto/picto.modify.dto';
import { IsValid } from 'src/utilities/creation';
import { CollectionService } from 'src/collection/collection.service';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
import { ApiOperation } from '@nestjs/swagger';
import { multipleSharePictoDto, sharePictoDto } from './dto/picto.share.dto';
import { deletePictoDto } from './dto/picto.delete.dto';
import { copyPictoDto } from './dto/picto.copy.dto';
import { Collection } from 'src/entities/collection.entity';
import { AuthenticatedUser, Public, AuthGuard } from 'nest-keycloak-connect';
@Controller('picto')
export class PictoController {
  private logger = new Logger('PictosController');
  constructor(
  private pictoService: PictoService,
  @Inject(forwardRef(() => CollectionService))
  private collectionService: CollectionService
  ){}

  @Public(true)
  @Get('/:id')
  getPictoById(@Param('id', ParseIntPipe) id : number, @AuthenticatedUser() user: User): Promise<Picto>{
    this.logger.verbose(`User "${user.username}" getting Picto with id ${id}`);
      return this.pictoService.getPictoById(id, user);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({summary : 'get all your pictos'})
  getAllUserPictos(@AuthenticatedUser() user: User): Promise<Picto[]>{
    this.logger.verbose(`User "${user.username}" getting all Picto`);
    return this.pictoService.getAllUserPictos(user);
  }

  @UseGuards(AuthGuard)
  @Put('share/:id')
  @UsePipes(ValidationPipe)
  @ApiOperation({summary : 'share a picto with another user, with readonly or editor role'})
  async sharePictoById(@Param('id', ParseIntPipe) id : number, @Body() multipleSharePictoDto: multipleSharePictoDto, @AuthenticatedUser() user: User): Promise<Picto>{
      let picto: Picto;
      if(!multipleSharePictoDto.role){
        multipleSharePictoDto.role = 'viewer';
      }
      for(let username of multipleSharePictoDto.usernames){
        multipleSharePictoDto.access= +multipleSharePictoDto.access;
        if(multipleSharePictoDto.access){
          this.logger.verbose(`User "${user.username}" sharing Picto with id ${id} to User ${username} as ${multipleSharePictoDto.role}`);
        } else {
          this.logger.verbose(`User "${user.username}" revoking access to Picto with id ${id} for User ${username}`);
        }
        picto = await this.pictoService.sharePictoById(id, user, new sharePictoDto(multipleSharePictoDto.access, username, multipleSharePictoDto.role));
      }
      return picto;
    }
  
  @UseGuards(AuthGuard)
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
  async createPicto(@Body() createPictoDto: createPictoDto, @AuthenticatedUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Picto>{
      if(!file){
          this.logger.verbose(`User "${user.username}" tryed to create Picto without file or filename`);
          throw new NotFoundException(`There is no file or no filename`);
      } else {
        if(IsValid(createPictoDto.meaning, createPictoDto.speech)){
          if(createPictoDto.fatherCollectionId!=user.shared){
            this.logger.verbose(`User "${user.username}" creating Picto`);
            const filename = await hashImage(file);
            const picto = await this.pictoService.createPicto(createPictoDto, user, filename);
            const fatherCollection = await this.collectionService.getCollectionById(createPictoDto.fatherCollectionId, user);
            let fatherPictosIds = fatherCollection.pictos.map(picto => {return picto.id;})
            fatherPictosIds.push(picto.id);
            const modifyCollectionDto : modifyCollectionDto = {
              meaning : null,
              speech : null,
              collectionIds : null,
              priority : 10,
              color : null,
              pictoIds : fatherPictosIds,
              pictohubId: null
            }
            this.collectionService.modifyCollection(createPictoDto.fatherCollectionId, user, modifyCollectionDto, null);
            if(createPictoDto.share!=0){
              this.pictoService.autoShare(picto, fatherCollection);
              this.logger.verbose(`Auto sharing picto "${picto.id}" with viewers and editors`);
            }
            return picto;
          } else {
            this.logger.verbose(`User "${user.username}" tried to create collection into shared collections`);
            throw new ForbiddenException(`You cannot create a collection into your shared collection`);
          }
        } else {
          this.logger.verbose(`User "${user.username}"Made a bad request where Object has either invalid attributes or "meaning" and "speech" don't have the same length`);
          throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length"`);
        }
      }
  }

  @UseGuards(AuthGuard)
  @Delete()
  deletePicto(@Query(ValidationPipe) deletePictoDto: deletePictoDto, @AuthenticatedUser() user: User): Promise<void> {
    deletePictoDto.pictoId=Number(deletePictoDto.pictoId);
    this.logger.verbose(`User "${user.username}" deleting Picto with id ${deletePictoDto.pictoId}`);
    return this.pictoService.deletePicto(deletePictoDto, user);
  }

  @UseGuards(AuthGuard)
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
  async modifyPicto(@Param('id', ParseIntPipe) id: number, @AuthenticatedUser() user: User, @Body() modifyPictoDto: modifyPictoDto, @UploadedFile() file: Express.Multer.File): Promise<Picto>{
    if(IsValid(modifyPictoDto.meaning, modifyPictoDto.speech)){
      this.logger.verbose(`User "${user.username}" Modifying Picto with id ${id}`);
      if(file){
          const filename = await hashImage(file);
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, filename);
      } else {
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, null);
      }
    } else {
      this.logger.verbose(`User "${user.username}"Made a bad request where Object has either invalid attributes or "meaning" and "speech" don't have the same length`);
      throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
    }
  }
  @UseGuards(AuthGuard)
  @Post('copy')
  async copyPicto(@Body() copyPictoDto: copyPictoDto, @AuthenticatedUser() user: User): Promise<Collection>{
    this.logger.verbose(`User "${user.username}" copying Picto with id ${copyPictoDto.pictoId}`);
    await this.pictoService.copyPicto(copyPictoDto.fatherCollectionId, copyPictoDto.pictoId, user);
    return this.collectionService.getCollectionById(copyPictoDto.fatherCollectionId, user)
  }
}
