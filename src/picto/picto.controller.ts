import { BadRequestException, Body, Controller, Delete, Get, Header, Logger, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
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

@Controller('picto')
export class PictoController {
  private logger = new Logger('PictosController');
  constructor(private pictoService: PictoService){}
  @UseGuards(AuthGuard())
  @Get('/:id')
  getPictoById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Picto>{
    this.logger.verbose(`User "${user.username}" getting Picto with id ${id}`);
      return this.pictoService.getPictoById(id, user);
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
  createPicto(@Body() createPictoDto: createPictoDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Picto>{
      if(!file){
          this.logger.verbose(`User "${user.username}" tryed to create Picto without file or filename`);
          throw new NotFoundException(`There is no file or no filename`);
      } else {
        const {language, meaning, speech} = createPictoDto;
        if(verifySameLength(language, meaning, speech)){
          this.logger.verbose(`User "${user.username}" creating Picto`);
          return this.pictoService.createPicto(createPictoDto, user, file.filename);
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
