import { Body, Controller, Delete, Get, Header, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
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

@Controller('picto')
export class PictoController {
    constructor(private pictoService: PictoService){}
    @UseGuards(AuthGuard())
    @Get('/:id')
    getPictoById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Picto>{
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
            throw new NotFoundException(`There is no file or no filename`);
        } else {
            return this.pictoService.createPicto(createPictoDto, user, file.filename);
        }
    }

    @UseGuards(AuthGuard())
    @Delete('/:id')
    deletePicto(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<void> {
        return this.pictoService.deletePicto(id, user);
    }

    @UseGuards(AuthGuard())
    @Patch('/:id')
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
        if(file){
            return this.pictoService.modifyPicto(id, user, modifyPictoDto, file.filename);
        } else {
            return this.pictoService.modifyPicto(id, user, modifyPictoDto, null);
        }
    }
}
