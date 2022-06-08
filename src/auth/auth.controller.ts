import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Logger, NotFoundException, Param, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
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
import { usernameRegexp } from 'src/utilities/creation';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
@Controller('')
export class AuthController {
    private logger = new Logger('AuthController');
    constructor(private authService: AuthService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService){}

    @Post('auth/signup')
    async signUp(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<void> {
        this.logger.verbose(`User signin up`);
        const user = await this.authService.signUp(createUserDto);
        const rootId: number = await this.collectionService.createRoot(user);
        await this.collectionService.createShared(user);
        await this.collectionService.createSider(user);
        if (createUserDto.publicBundleId) {
          const publicBundleCollection: Collection = await this.collectionService.getCollectionById(createUserDto.publicBundleId, user);
          const pictoIdsFromBundle: number[] = await Promise.all(publicBundleCollection?.pictos.map(async (picto) => await this.collectionService.copyPicto(rootId, picto, user)));
          const collectionIdsFromBundle: number[] = await Promise.all(publicBundleCollection?.collections.map(async (collection) => await this.collectionService.copyCollection(rootId, collection.id, user)))
          const modifyCollectionDto : modifyCollectionDto = {
            meaning : null,
            speech : null,
            starred : null,
            color : null,
            collectionIds : collectionIdsFromBundle,
          pictoIds: pictoIdsFromBundle
        }
          await this.collectionService.modifyCollection(rootId, user, modifyCollectionDto, null);
        }
        console.log(await this.collectionService.getCollectionById(rootId, user))
        return;
    }

    @Get('auth/validation/:validationToken')
    async validateUser(@Param('validationToken') validationToken: string): Promise<void>{
      if(validationToken != "verified"){
        return this.authService.userValidation(validationToken);
      } else {
        return
      }
    }

    @Post('auth/validation/:username')
    async sendMail(@Param('username') username: string): Promise<void>{
      if(usernameRegexp.test(username)){
        const user= await this.authService.findWithUsername(username);
        if(user){
          return this.authService.sendMail(user);
        } else {
          throw new NotFoundException(`username ${username} not found`);
        }
      } else {
        throw new BadRequestException(`username ${username} is not a valid username`);
      }
      
    }

    @Post('auth/signin')
    async signIn(
      @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string; expiresIn: string }> {
      this.logger.verbose(
        `User "${authCredentialsDto.username}" is trying to Sign In`,
      );
      
      const signinResponse: any = await this.authService.signIn(authCredentialsDto);
      
      if (signinResponse.accessToken) {
        const user: User = await this.authService.isSiderToCreate(authCredentialsDto.username);
        if (user) {
          this.logger.verbose(
            `User "${authCredentialsDto.username}" is has not a siderbar collection. Creating one.`,
          );
          await this.collectionService.createSider(user);
        }
      }
      return signinResponse;
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
    ): Promise<User> {
      if(editUserDto.mailingList){
        try{
          JSON.parse(editUserDto.mailingList);
        } catch(error){
          throw new BadRequestException(`mailing list ${editUserDto.mailingList} is not valid`);
        }
      }
      if(editUserDto.settings){
        try{
          JSON.parse(editUserDto.settings);
        } catch(error){
          throw new BadRequestException(`settings ${editUserDto.settings} is not valid`);
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
    @Get('/user/sider')
    async getSider(@GetUser() user: User): Promise<Collection>{
        this.logger.verbose(`User "${user.username}" getting his root`);
        const sider = await this.authService.getSider(user);
        return this.collectionService.getCollectionById(sider, user);
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
        return this.authService.getNotifications(user);
    }

    @UseGuards(AuthGuard())
    @Delete('/user/notification')
    async clearNotifications(@GetUser() user: User): Promise<Notif[]>{
        this.logger.verbose(`User "${user.username}" clearing his notifications`);
        return this.authService.clearNotifications(user);
    }
}