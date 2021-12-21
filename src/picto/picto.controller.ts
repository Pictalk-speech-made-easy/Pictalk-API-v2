import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { verifySameLength } from 'src/utilities/creation';
import { CollectionService } from 'src/collection/collection.service';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('picto')
export class PictoController {
  private logger = new Logger('PictosController');
  constructor(private pictoService: PictoService,
  @Inject(forwardRef(() => CollectionService))
  private collectionService: CollectionService){}
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
  async createPicto(@Body() createPictoDto: createPictoDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Picto>{
      if(!file){
          this.logger.verbose(`User "${user.username}" tryed to create Picto without file or filename`);
          throw new NotFoundException(`There is no file or no filename`);
      } else {
        const {language, meaning, speech, fatherCollectionId} = createPictoDto;
        if(verifySameLength(language, meaning, speech)){
          this.logger.verbose(`User "${user.username}" creating Picto`);
          const picto = await this.pictoService.createPicto(createPictoDto, user, file.filename);
          const modifyCollectionDto : modifyCollectionDto = {
            meaning : null,
            speech : null,
            language : null,
            collectionIds : null,
            starred : null,
            color : null,
            pictoIds : [picto.id]}
          this.collectionService.modifyCollection(fatherCollectionId, user, modifyCollectionDto, null);
          return picto;
        } else {
          this.logger.verbose(`User "${user.username}"Made a bad request were Languages, Meanings, and Speeches don't have the same number of arguments`);
          throw new BadRequestException(`bad request were Languages :${language}, Meanings :${meaning}, and Speeches :${speech} don't have the same number of arguments`);
        }
      }
  }

  @UseGuards(AuthGuard())
  @Delete('/:id')
  deletePicto(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<void> {
    this.logger.verbose(`User "${user.username}" deleting Picto with id ${id}`);
    return this.pictoService.deletePicto(id, user);
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
  modifyPicto(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyPictoDto: modifyPictoDto, file: Express.Multer.File): Promise<Picto>{
    const {language, meaning, speech} = modifyPictoDto;
    if(verifySameLength(language, meaning, speech)){
      this.logger.verbose(`User "${user.username}" Modifying Picto with id ${id}`);
      if(file){
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, file.filename);
      } else {
          return this.pictoService.modifyPicto(id, user, modifyPictoDto, null);
      }
    } else {
      this.logger.verbose(`User "${user.username}"Made a bad request were Languages, Meanings, and Speeches don't have the same number of arguments`);
      throw new BadRequestException(`bad request were Languages :${language}, Meanings :${meaning}, and Speeches :${speech} don't have the same number of arguments`);
    }
  }
}
