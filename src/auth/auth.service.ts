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
import { Notif } from 'src/entities/notification.entity';

@Injectable()
export class AuthService {
    private logger = new Logger('AuthService');
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService : JwtService,
        ){}

    async signUp(createUserDto: CreateUserDto): Promise<User> {
        if(createUserDto.directSharers){
            for(let i=0; i<createUserDto.directSharers.length; i++){
                const user = await this.findWithUsername(createUserDto.directSharers[i]);
                const exists = await this.verifyExistence(user);
                if(!exists){
                    createUserDto.directSharers.splice(i);
                }
            }
        }
        
        return this.userRepository.signUp(createUserDto);
    }

    async userValidation(validationToken: string): Promise<void>{
        return this.userRepository.userValidation(validationToken);
    }

    async signIn(
        authCredentialsDto: AuthCredentialsDto,
        ): Promise<{ accessToken: string; expiresIn: string }> {
        const jwtConfig = config.get('jwt');
        const expiresIn = jwtConfig.expiresIn;
        const validate = await this.userRepository.validateUserPassword(
            authCredentialsDto,
        );
        if (!validate) {
            throw new UnauthorizedException('Invalid Credentials');
        } else if (validate.validationToken!='verified') {
            throw new UnauthorizedException('User has not verified his account, please verify your mailing address')
        } else {
            const username = validate.username
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
    async verifyExistence(user: User): Promise<boolean> {
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

    async getShared(user: User): Promise<number>{
        return user.shared;
    }

    async getNotifications(user: User): Promise<Notif[]>{
        return user.notifications;
    }

    async pushNotification(user: User, notification : Notif): Promise<Notif[]>{
        return this.userRepository.pushNotification(user, notification);
    }

    async clearNotifications(user: User): Promise<Notif[]>{
        return this.userRepository.clearNotifications(user);
    }

    async findWithUsername(username: string): Promise<User>{
        const user = await this.userRepository.findOne({where : {username: username}});
        return user;
    }
}