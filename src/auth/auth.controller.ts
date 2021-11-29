import { Body, Controller, forwardRef, Get, Inject, Logger, Post, Put, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from 'src/entities/user.entity';
import { Collection } from 'src/entities/collection.entity';
import { Picto } from 'src/entities/picto.entity';
import { UserRootDto } from './dto/auth.push-root.dto';
import { CollectionService } from 'src/collection/collection.service';
@Controller('')
export class AuthController {
    private logger = new Logger('AuthController');
    constructor(private authService: AuthService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService){}

    @Post('auth/signup')
    async signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<void> {
        this.logger.verbose(`User signin up`);
        const user = await this.authService.signUp(authCredentialsDto);
        const root = await this.collectionService.createRoot(user);
        this.authService.pushRoot(user, root);
        return;
    }

    @Post('auth/signin')
    signIn(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{accesToken : string}> {
        this.logger.verbose(`User getting signin in`);
        return this.authService.signIn(authCredentialsDto);
    }

    @UseGuards(AuthGuard())
    @Get('/user/root')
    async getRoot(@GetUser() user: User): Promise<Collection>{
        this.logger.verbose(`User "${user.username}" getting his root`);
        const root = await this.authService.getRoot(user);
        return this.collectionService.getCollectionById(root, user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/pictos')
    getAllPictos(@GetUser() user: User): Promise<Picto[]>{
        this.logger.verbose(`User "${user.username}" getting all pictos`);
        return this.authService.getAllPictos(user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/collections')
    getAllCollections(@GetUser() user: User): Promise<Collection[]>{
        this.logger.verbose(`User "${user.username}" getting all collections`);
        return this.authService.getAllCollections(user);
    }
}