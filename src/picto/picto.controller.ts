import { BadRequestException, Body, Controller, Delete, ForbiddenException, forwardRef, Get, Inject, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { editFileName, imageFileFilter } from 'src/utilities/tools';
import { PictoService } from './picto.service';
import { createPictoDto } from './dto/picto.create.dto';
import { modifyPictoDto } from './dto/picto.modify.dto';
import { verifySameLength, verifyText } from 'src/utilities/creation';
import { CollectionService } from 'src/collection/collection.service';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
import { ApiOperation } from '@nestjs/swagger';
import { sharePictoDto } from './dto/picto.share.dto';
import { NoDuplicatasService } from 'src/image/noDuplicatas.service';
import { deletePictoDto } from './dto/picto.delete.dto';

@Controller('picto')
export class PictoController {
  private logger = new Logger('PictosController');
  constructor(
  private pictoService: PictoService,
  private noDuplicatasService: NoDuplicatasService,
  @Inject(forwardRef(() => CollectionService))
  private collectionService: CollectionService
  ){}
  @UseGuards(AuthGuard())

  @Get('/:id')
  getPictoById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Picto>{
    this.logger.verbose(`User "${user.username}" getting Picto with id ${id}`);
      return this.pictoService.getPictoById(id, user);
  }

  @UseGuards(AuthGuard())
  @Get()
  @ApiOperation({summary : 'get all your pictos'})
  getAllUserPictos(@GetUser() user: User): Promise<Picto[]>{
    this.logger.verbose(`User "${user.username}" getting all Picto`);
    return this.pictoService.getAllUserPictos(user);
  }

  @UseGuards(AuthGuard())
  @Put('share/:id')
  @UsePipes(ValidationPipe)
  @ApiOperation({summary : 'share a picto with another user, with readonly or editor role'})
  sharePictoById(@Param('id', ParseIntPipe) id : number, @Body() sharePictoDto: sharePictoDto, @GetUser() user: User): Promise<Picto>{
    if(sharePictoDto.access){
      this.logger.verbose(`User "${user.username}" sharing Picto with id ${id} to User ${sharePictoDto.username} as ${sharePictoDto.role}`);
    } else {
      this.logger.verbose(`User "${user.username}" revoking access to Picto with id ${id} for User ${sharePictoDto.username}`);
    }
    return this.pictoService.sharePictoById(id, user, sharePictoDto);
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
      fileFilter: imageFileFilter,
    }),
  )
  async createPicto(@Body() createPictoDto: createPictoDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Picto>{
      if(!file){
          this.logger.verbose(`User "${user.username}" tryed to create Picto without file or filename`);
          throw new NotFoundException(`There is no file or no filename`);
      } else {
        try {
          createPictoDto.meaning = JSON.parse(createPictoDto.meaning);
          createPictoDto.speech = JSON.parse(createPictoDto.speech);
        } catch (error) {
            throw new BadRequestException(`Object is invalid, should be "[{language: <xx-XX>, text: <string>}]"`);
        }
        if(verifyText(createPictoDto.meaning, createPictoDto.speech) && verifySameLength(createPictoDto.meaning, createPictoDto.speech)){
          if(createPictoDto.fatherCollectionId!=user.shared){
            this.logger.verbose(`User "${user.username}" creating Picto`);
            const filename: string = await this.noDuplicatasService.noDuplicatas(file.filename);
            const picto = await this.pictoService.createPicto(createPictoDto, user, filename);
            const fatherCollection = await this.collectionService.getCollectionById(createPictoDto.fatherCollectionId, user);
            let fatherPictosIds = fatherCollection.pictos.map(picto => {return picto.id;})
            fatherPictosIds.push(picto.id);
            const modifyCollectionDto : modifyCollectionDto = {
              meaning : null,
              speech : null,
              collectionIds : null,
              starred : null,
              color : null,
              pictoIds : fatherPictosIds}
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
          throw new BadRequestException(`Object is invalid, should be "[{language: <xx-XX>, text: <string>}] and both should have same length"`);
        }
      }
  }

  @UseGuards(AuthGuard())
  @Delete()
  deletePicto(@Query(ValidationPipe) deletePictoDto: deletePictoDto, @GetUser() user: User): Promise<void> {
    deletePictoDto.pictoId=Number(deletePictoDto.pictoId);
    this.logger.verbose(`User "${user.username}" deleting Picto with id ${deletePictoDto.pictoId}`);
    return this.pictoService.deletePicto(deletePictoDto, user);
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
      fileFilter: imageFileFilter,
    }),
  )
  async modifyPicto(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyPictoDto: modifyPictoDto, @UploadedFile() file: Express.Multer.File): Promise<Picto>{
    try {
        if(modifyPictoDto.meaning != undefined &&  modifyPictoDto.speech != undefined){
          modifyPictoDto.meaning = JSON.parse(modifyPictoDto.meaning);
          modifyPictoDto.speech = JSON.parse(modifyPictoDto.speech);
        }
      } catch (error) {
          throw new BadRequestException(`Object is invalid, should be "[{language: <xx-XX>, text: <string>}]"`);
      }
    if((verifyText(modifyPictoDto.meaning, modifyPictoDto.speech) && verifySameLength(modifyPictoDto.meaning, modifyPictoDto.speech)) || (modifyPictoDto.speech===null && modifyPictoDto.meaning === null)){
      this.logger.verbose(`User "${user.username}" Modifying Picto with id ${id}`);
      if(file){
          const filename: string = await this.noDuplicatasService.noDuplicatas(file.filename);
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, filename);
      } else {
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, null);
      }
    } else {
      this.logger.verbose(`User "${user.username}"Made a bad request where Object has either invalid attributes or "meaning" and "speech" don't have the same length`);
      throw new BadRequestException(`Object is invalid, should be "[{language: <xx-XX>, text: <string>}] and both should have same length`);
    }
  }
}
