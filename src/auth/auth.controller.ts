import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Logger, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from 'src/entities/user.entity';
import { Collection } from 'src/entities/collection.entity';
import { CollectionService } from 'src/collection/collection.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { Notif } from 'src/entities/notification.entity';
import { verifyAPIs } from 'src/utilities/creation';
import { getArrayIfNeeded } from 'src/utilities/tools';
@Controller('')
export class AuthController {
    private logger = new Logger('AuthController');
    constructor(private authService: AuthService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService){}

    @Post('auth/signup')
    async signUp(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<void> {
        this.logger.verbose(`User signin up`);
        if(createUserDto.apinames && createUserDto.apikeys){
          createUserDto.apinames=getArrayIfNeeded(createUserDto.apinames);
          createUserDto.apikeys=getArrayIfNeeded(createUserDto.apikeys);
          if(!verifyAPIs(createUserDto.apinames, createUserDto.apikeys)){
            throw new BadRequestException(`You must have as many API names as API keys`);
          }
        }
        const user = await this.authService.signUp(createUserDto);
        await this.collectionService.createRoot(user);
        await this.collectionService.createShared(user);
        return;
    }

    @Post('auth/signin')
    signIn(
        @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string; expiresIn: string }> {
        this.logger.verbose(
          `User "${authCredentialsDto.username}" is trying to Sign In`,
        );
        return this.authService.signIn(authCredentialsDto);
      }

      @Post('user/resetPassword')
      resetPassword(
        @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
      ): Promise<void> {
        this.logger.verbose(
          `User "${resetPasswordDto.username}" is trying to Reset Password`,
        );
        return this.authService.resetPassword(resetPasswordDto);
      }
      @Post('user/changePassword/:token')
      changePassword(
        @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
        @Param('token') token: string,
      ): Promise<void> {
        this.logger.verbose(
          `${token} is being used !`,
        );
        return this.authService.changePassword(changePasswordDto, token);
      }
    
      @Get('user/details')
      @UseGuards(AuthGuard())
      getUserDetails(@GetUser() user: User): Promise<User> {
        this.logger.verbose(`User "${user.username}" is trying to get Details`);
        return this.authService.getUserDetails(user);
      }
    
      @Put('user/details')
      @UseGuards(AuthGuard())
      editUser(
        @GetUser() user: User,
        @Body(ValidationPipe) editUserDto: EditUserDto,
      ): Promise<void> {
        if(editUserDto.apinames && editUserDto.apikeys){
          editUserDto.apinames=getArrayIfNeeded(editUserDto.apinames);
          editUserDto.apikeys=getArrayIfNeeded(editUserDto.apikeys);
          if(!verifyAPIs(editUserDto.apinames, editUserDto.apikeys)){
            throw new BadRequestException(`You must have as many API names as API keys`);
          }
        }
        this.logger.verbose(`User "${user.username}" is trying to modify Details`);
        return this.authService.editUser(user, editUserDto);
      }

    @UseGuards(AuthGuard())
    @Get('/user/root')
    async getRoot(@GetUser() user: User): Promise<Collection>{
        this.logger.verbose(`User "${user.username}" getting his root`);
        const root = await this.authService.getRoot(user);
        return this.collectionService.getCollectionById(root, user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/shared')
    async getShared(@GetUser() user: User): Promise<Collection>{
        this.logger.verbose(`User "${user.username}" getting his shared with me Collection`);
        const shared = await this.authService.getShared(user);
        return this.collectionService.getCollectionById(shared, user);
    }

    @UseGuards(AuthGuard())
    @Get('/user/notification')
    async getNotifications(@GetUser() user: User): Promise<Notif[]>{
        this.logger.verbose(`User "${user.username}" getting his notifications`);
        return this.authService.getNotifications(user);
    }

    @UseGuards(AuthGuard())
    @Delete('/user/notification')
    async clearNotifications(@GetUser() user: User): Promise<Notif[]>{
        this.logger.verbose(`User "${user.username}" clearing his notifications`);
        return this.authService.clearNotifications(user);
    }
}