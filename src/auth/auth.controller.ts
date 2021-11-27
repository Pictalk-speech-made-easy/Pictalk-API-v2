import { Body, Controller, Get, Post, Put, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from 'src/entities/user.entity';
import { Collection } from 'src/entities/collection.entity';
import { Picto } from 'src/entities/picto.entity';
import { UserRootDto } from './dto/auth.push-root.dto';
@Controller('')
export class AuthController {
    constructor(private authService: AuthService,){}

    @Post('auth/signup')
    signUp(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<void> {
        this.authService.signUp(authCredentialsDto);
        return;
    }

    @Post('auth/signin')
    signIn(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{accesToken : string}> {
        return this.authService.signIn(authCredentialsDto);
    }

    @UseGuards(AuthGuard())
    @Get('/user/root')
    getRoot(@GetUser() user: User): Promise<number>{
        return this.authService.getRoot(user);
    }

    @UseGuards(AuthGuard())
    @Put('/user/root')
    pushRoot(@GetUser() user: User, @Body(ValidationPipe) UserRootDto : UserRootDto): Promise<void>{
        const {root} = UserRootDto;
        return this.authService.pushRoot(user, root);
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