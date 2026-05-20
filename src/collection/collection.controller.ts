import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, Query, StreamableFile, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/get-user.decorator';
import { Collection } from 'src/entities/collection.entity';
import { User } from 'src/entities/user.entity';
import { IsValid } from '../utilities/creation';
import { editFileName, hashImage, imageFileFilter, maxSize } from 'src/utilities/tools';
import { CollectionService } from './collection.service';
import { createCollectionDto } from './dto/collection.create.dto';
import { ApiOperation } from '@nestjs/swagger';
import { modifyCollectionDto } from './dto/collection.modify.dto';
import { multipleShareCollectionDto, shareCollectionDto } from './dto/collection.share.dto';
import { publicCollectionDto } from './dto/collection.public.dto';
import { deleteCollectionDto } from './dto/collection.delete.dto';
import { copyCollectionDto } from './dto/collection.copy.dto';
import { SearchCollectionDto } from './dto/collection.search.public.dto';
import { OptionnalAuth } from 'src/auth/optionnal_auth.guard';
import { levelCollectionDto } from './dto/collection.level.dto';
import { MoveToCollectionDto } from './dto/collection.move.dto';
import { modifyCollectionV2Dto } from './dto/collection.modify.V2.dto';
import { AuthService } from 'src/auth/auth.service';
import { v1_to_obz } from 'src/utilities/open-board';

@Controller('collection')
export class CollectionController {
        private logger = new Logger('CollectionController');
        constructor(private collectionService: CollectionService, private authService: AuthService) { }
        @UseGuards(OptionnalAuth)
        @Get('find/:id')
        @ApiOperation({ summary: 'get a collection that has the provided id' })
        getCollectionById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User): Promise<Collection> {
                return this.collectionService.getCollectionById(id, user);
        }

        @Get('/levels')
        @ApiOperation({ summary: 'get all the levels collections' })
        async getLevelCollections(): Promise<levelCollectionDto> {
                const collectionArray: levelCollectionDto = new levelCollectionDto();
                if (parseInt(process.env.LEVEL_A_COLLECTION_ID)) {
                        collectionArray.levelA = (await this.collectionService.getCollectionById(parseInt(process.env.LEVEL_A_COLLECTION_ID), new User()));
                }
                if (parseInt(process.env.LEVEL_B_COLLECTION_ID)) {
                        collectionArray.levelB = (await this.collectionService.getCollectionById(parseInt(process.env.LEVEL_B_COLLECTION_ID), new User()));
                }
                if (parseInt(process.env.LEVEL_C_COLLECTION_ID)) {
                        collectionArray.levelC = (await this.collectionService.getCollectionById(parseInt(process.env.LEVEL_C_COLLECTION_ID), new User()));
                }
                // Envoyer plutot un array d'objet avec le 'niveau' en propriété et la collection en value
                return collectionArray;
        }

        @Get('public')
        getPublicCollections(@Query(ValidationPipe) SearchCollectionDto: SearchCollectionDto): Promise<Collection[]> {
                if (SearchCollectionDto.page) {
                        if (SearchCollectionDto.page >= 1) {
                                SearchCollectionDto.page = SearchCollectionDto.page | 0;
                        } else {
                                throw new BadRequestException(`page must be an integer greater or equal to 1`);
                        }
                }
                if (SearchCollectionDto.per_page) {
                        if (SearchCollectionDto.per_page >= 5 && SearchCollectionDto.per_page <= 100) {
                                SearchCollectionDto.page = SearchCollectionDto.page | 0;
                        } else {
                                throw new BadRequestException(`per_page must be an integer greater or equal to 5 and inferior or equal to 100`);
                        }
                }
                return this.collectionService.getPublicCollection(SearchCollectionDto);
        }

        @UseGuards(AuthGuard())
        @Get()
        @ApiOperation({ summary: 'get all your collection' })
        getAllUserCollections(@GetUser() user: User): Promise<Collection[]> {
                return this.collectionService.getAllUserCollections(user);
        }

        @UseGuards(AuthGuard())
        @Post('copy')
        @ApiOperation({ summary: 'copy a collection with its ID' })
        async copyCollection(@Body() copyCollectionDto: copyCollectionDto, @GetUser() user: User): Promise<Collection> {
                await this.collectionService.copyCollectionWithTransaction(copyCollectionDto.fatherCollectionId, copyCollectionDto.collectionId, user);
                return this.getCollectionById(copyCollectionDto.fatherCollectionId, user);
        }

        @UseGuards(AuthGuard())
        @Put('share/:id')
        @UsePipes(ValidationPipe)
        @ApiOperation({ summary: 'share a collection with another user, with readonly or editor role' })
        async shareCollectionById(@Param('id', ParseIntPipe) id: number, @Body() multipleShareCollectionDto: multipleShareCollectionDto, @GetUser() user: User): Promise<Collection> {
                let collection: Collection;
                if (!multipleShareCollectionDto.role) {
                        multipleShareCollectionDto.role = 'viewer';
                }
                multipleShareCollectionDto.access = +multipleShareCollectionDto.access;
                collection = await this.collectionService.shareCollectionVerification(id, user, multipleShareCollectionDto);
                return collection;
        }

        @UseGuards(AuthGuard())
        @Put('publish/:id')
        @UsePipes(ValidationPipe)
        publishCollectionById(@Param('id', ParseIntPipe) id: number, @Body() publicCollectionDto: publicCollectionDto, @GetUser() user: User): Promise<Collection> {
                if (user.admin === true) {
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
                        limits: { fileSize: maxSize },
                        fileFilter: imageFileFilter,
                }),
        )
        async createCollection(@Body() createCollectionDto: createCollectionDto, @GetUser() user: User, @UploadedFile() file: Express.Multer.File,): Promise<Collection> {
                if (!file) {
                        throw new NotFoundException(`There is no file or no filename`);
                } else {
                        if (IsValid(createCollectionDto.meaning, createCollectionDto.speech)) {
                                if (createCollectionDto.fatherCollectionId != user.shared) {
                                        const filename = await hashImage(file);
                                        const collection = await this.collectionService.createCollection(createCollectionDto, user, filename);
                                        const fatherCollection = await this.collectionService.getCollectionById(createCollectionDto.fatherCollectionId, user);
                                        let fatherCollectionsIds = fatherCollection.collections.map(collection => {
                                                return collection.id;
                                        })
                                        fatherCollectionsIds.push(collection.id);
                                        const modifyCollectionDto: modifyCollectionDto = {
                                                meaning: null,
                                                speech: null,
                                                pictoIds: null,
                                                priority: null,
                                                color: null,
                                                collectionIds: fatherCollectionsIds,
                                                pictohubId: null
                                        }
                                        this.collectionService.modifyCollection(createCollectionDto.fatherCollectionId, user, modifyCollectionDto, null);
                                        if (createCollectionDto.share != 0) {
                                                this.collectionService.autoShare(collection, fatherCollection, user);
                                        }
                                        return collection;
                                } else {
                                        throw new ForbiddenException(`You cannot create a collection into your shared collection`);
                                }
                        } else {
                                throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
                        }
                }
        }

        @UseGuards(AuthGuard())
        @Post('/root')
        createRoot(@GetUser() user: User): Promise<number> {
                return this.collectionService.createRoot(user);
        }

        @UseGuards(AuthGuard())
        @Delete()
        deleteCollection(@Query(ValidationPipe) deleteCollectionDto: deleteCollectionDto, @GetUser() user: User): Promise<void> {
                deleteCollectionDto.collectionId = Number(deleteCollectionDto.collectionId);
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
                        limits: { fileSize: maxSize },
                        fileFilter: imageFileFilter,
                }),
        )
        async modifyCollection(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyCollectionDto: modifyCollectionDto, @UploadedFile() file: Express.Multer.File): Promise<Collection> {
                if (IsValid(modifyCollectionDto.meaning, modifyCollectionDto.speech)) {
                        if (file) {
                                const filename = await hashImage(file);
                                return this.collectionService.modifyCollection(id, user, modifyCollectionDto, filename);
                        } else {
                                return this.collectionService.modifyCollection(id, user, modifyCollectionDto, null);
                        }
                } else {
                        throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
                }
        }

        @UseGuards(AuthGuard())
        @Put('/V2/:id')
        @UsePipes(ValidationPipe)
        @UseInterceptors(
                FileInterceptor('image', {
                        storage: diskStorage({
                                destination: './tmp',
                                filename: editFileName,
                        }),
                        limits: { fileSize: maxSize },
                        fileFilter: imageFileFilter,
                }),
        )
        async modifyCollectionV2(@Param('id', ParseIntPipe) id: number, @GetUser() user: User, @Body() modifyCollectionDto: modifyCollectionV2Dto, @UploadedFile() file: Express.Multer.File): Promise<Collection> {
                if (IsValid(modifyCollectionDto.meaning, modifyCollectionDto.speech)) {
                        if (file) {
                                const filename = await hashImage(file);
                                const res = await this.collectionService.modifyCollectionV2(id, user, modifyCollectionDto, filename);
                                return res;
                        } else {
                                const res = await this.collectionService.modifyCollectionV2(id, user, modifyCollectionDto, null);
                                return res;
                        }
                } else {
                        throw new BadRequestException(`Object is invalid, should be "{language <xx-XX> : text <string>} and both should have same length`);
                }
        }

        @UseGuards(AuthGuard())
        @Put('/move/:id')
        @UsePipes(ValidationPipe)
        async moveToCollection(@Param('id', ParseIntPipe) fatherCollectionId: number, @GetUser() user: User, @Body() moveToCollectionDto: MoveToCollectionDto): Promise<Collection> {
                return this.collectionService.moveToCollection(user, moveToCollectionDto, fatherCollectionId);
        }

        @UseGuards(AuthGuard())
        @Get('orphaned')
        @ApiOperation({ summary: 'get all the orphaned collections' })
        async getOrphanedCollections(@GetUser() user: User): Promise<Collection[]> {
                return this.collectionService.getOrphanedCollections(user);
        }
        @UseGuards(AuthGuard())
        @Get('all')
        async get_all_collections(@GetUser() user: User): Promise<Collection[]> {
                return this.collectionService.get_collections(user);
        }
        @UseGuards(AuthGuard())
        @Get('export/obz')
        async export_to_obz(@GetUser() user: User): Promise<StreamableFile> {
                try {
                        const collections = await this.collectionService.get_collections(user);
                        const user_details = await this.authService.getUserDetails(user);
        
                        const buffer = await v1_to_obz(collections, user_details);
        
                        return new StreamableFile(buffer, {
                                type: 'application/zip',
                                disposition: `attachment; filename="${user_details.username}-pictalk.obz"`,
                        });
                } catch (error) {
                        this.logger.error(`Failed to export collections for user ${user.username}: ${error.message}`);
                        throw new BadRequestException(`Failed to export collections: ${error.message}`);
                }
        }
}