import { BadRequestException, Body, Controller, Delete, Get, Header, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { verifySameLength } from 'src/utilities/creation';
import { editFileName, imageFileFilter } from 'src/utilities/tools';
import { CollectionService } from './collection.service';
import { createCollectionDto } from './dto/collection.create.dto';
import { modifyCollectionDto } from './dto/collection.modify.dto';

@Controller('collection')
export class CollectionController {
  private logger = new Logger('CollectionController');
  constructor(private collectionService: CollectionService){}
  @UseGuards(AuthGuard())
  @Get('/:id')
  getCollectionById(@Param('id', ParseIntPipe) id : number, @GetUser() user: User): Promise<Collection>{
    this.logger.verbose(`User "${user.username}" getting Collection with id ${id}`);
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
        this.logger.verbose(`User "${user.username}" Made a bad request that doesn't contain a file`);
        throw new NotFoundException(`There is no file or no filename`);
      } else {
        const {language, meaning, speech} = createCollectionDto;
        if(verifySameLength(language, meaning, speech)){
          this.logger.verbose(`User "${user.username}" creating Collection`);
          return this.collectionService.createCollection(createCollectionDto, user, file.filename);
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
