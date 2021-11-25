import { Body, Controller, Get, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from 'src/entities/user.entity';
import { Collection } from 'src/entities/collection.entity';
import { Picto } from 'src/entities/picto.entity';

@Controller('')
export class AuthController {
    constructor(private authService: AuthService,){}

    @Post('auth/signup')
    signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto){
        return this.authService.signUp(authCredentialsDto);
    }

    @Post('auth/signin')
    signIn(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{accesToken : string}> {
        return this.authService.signIn(authCredentialsDto);
    }

    @UseGuards(AuthGuard())
    @Get('/user/')
    getRoot(@GetUser() user: User): Promise<Collection>{
        return this.authService.getRoot(user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/pictos')
    getAllPictos(@GetUser() user: User): Promise<Picto[]>{
        return this.authService.getAllPictos(user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/collections')
    getAllCollections(@GetUser() user: User): Promise<Collection[]>{
        return this.authService.getAllCollections(user);
    }
}