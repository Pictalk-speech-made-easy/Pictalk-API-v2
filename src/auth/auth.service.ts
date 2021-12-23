import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from './jwt-payload.interface';
import { UserRepository } from './user.repository';
import * as config from 'config';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';
import { EditUserDto } from './dto/edit-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    private logger = new Logger('AuthService');
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService : JwtService,
        ){}

    async signUp(createUserDto: CreateUserDto): Promise<User> {
        return this.userRepository.signUp(createUserDto);
    }

    async signIn(
        authCredentialsDto: AuthCredentialsDto,
        ): Promise<{ accessToken: string; expiresIn: string }> {
        const jwtConfig = config.get('jwt');
        const expiresIn = jwtConfig.expiresIn;
        const username = await this.userRepository.validateUserPassword(
            authCredentialsDto,
        );

        if (!username) {
            throw new UnauthorizedException('Invalid Credentials');
        } else {
            const payload: JwtPayload = { username };
            const accessToken = await this.jwtService.sign(payload);
            this.logger.debug(
                `Generated JWT Token with payload ${JSON.stringify(payload)}`,
            );
        return { accessToken, expiresIn };
        }
        }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const resetTokenValue = randomBytes(20).toString('hex');
    const resetTokenExpiration = String(Date.now() + 3600000);
    return this.userRepository.resetPassword(
        resetPasswordDto,
        resetTokenValue,
        resetTokenExpiration,
    );
    }

    async editUser(user: User, editUserDto: EditUserDto): Promise<void> {
    return this.userRepository.editUser(user, editUserDto);
    }
    async getUserDetails(user: User): Promise<User> {
    return this.userRepository.getUserDetails(user);
    }
    async verifyExistence(username: string): Promise<boolean> {
        const user = await this.userRepository.findOne({where : {username: username}});
        if(typeof(user) === 'undefined'){
            return false;
        } else {
            return true;
        }
    }
    
    async changePassword(changePasswordDto: ChangePasswordDto, token: string): Promise<void> {
    return this.userRepository.changePassword(changePasswordDto, token);
    }

    async pushRoot(user: User, root: number): Promise<void>{
        return this.userRepository.pushRoot(user, root);
    }

    async getRoot(user: User): Promise<number>{
        return user.root;
    }
}