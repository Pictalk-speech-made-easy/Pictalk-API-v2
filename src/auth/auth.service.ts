import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from 'src/entities/collection.entity';
import { Picto } from 'src/entities/picto.entity';
import { User } from 'src/entities/user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { UserRepository } from './user.repository';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService : JwtService,
        ){}

    async signUp(authCredentialsDto : AuthCredentialsDto): Promise<User>{
        return await this.userRepository.signUp(authCredentialsDto);  
    }

    async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{accesToken : string}> {
        const username = await this.userRepository.validateUserPassword(authCredentialsDto);
        if(!username){
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload: JwtPayload = { username };
        const accesToken = await this.jwtService.sign(payload);
        return { accesToken };

    }

    async pushRoot(user: User, root: number): Promise<void>{
        return this.userRepository.pushRoot(user, root);
    }

    async getRoot(user: User): Promise<number>{
        return user.root;
    }

    async getAllPictos(user: User): Promise<Picto[]>{
        return user.pictos;
    }

    async getAllCollections(user: User): Promise<Collection[]>{
        return user.collections;
    }
}