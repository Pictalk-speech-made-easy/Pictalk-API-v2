import { Body, Controller, Delete, Get, Header, NotFoundException, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { editFileName, imageFileFilter } from 'src/utilities/tools';
import { CollectionService } from './collection.service';
import { createCollectionDto } from './dto/collection.create.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';

@Controller('collection')
export class CollectionController {
    constructor(private collectionService: CollectionService){}
    @UseGuards(AuthGuard())
    @Get('/:id')
    getCollectionById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Collection>{
        return this.collectionService.getCollectionById(id, user);
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
    createCollection(@Body() createCollectionDto: createCollectionDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Collection>{
        if(!file){
            throw new NotFoundException(`There is no file or no filename`);
        } else {
            return this.collectionService.createCollection(createCollectionDto, user, file.filename);
        }
    }

    @UseGuards(AuthGuard())
    @Delete('/:id')
    deleteCollection(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<void> {
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
        if(file){
            return this.collectionService.modifyCollection(id, user, modifyCollectionDto, file.filename);
        } else {
            return this.collectionService.modifyCollection(id, user, modifyCollectionDto, null);
        }
    }
}
