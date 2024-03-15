import { multipleShareCollectionDto } from './../collection/dto/collection.share.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Logger,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/entities/user.entity';
import { Collection } from 'src/entities/collection.entity';
import { CollectionService } from 'src/collection/collection.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { Notif } from 'src/entities/notification.entity';
import { modifyCollectionDto } from 'src/collection/dto/collection.modify.dto';
import { UserGuard } from './user.guard';
import { GetUser } from './get-user.decorator';
import { AuthenticatedUser } from 'nest-keycloak-connect';

@Controller('')
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Post('auth/signup')
  async signUp(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @AuthenticatedUser() kcUser: any,
  ): Promise<void> {
    this.logger.verbose(`User sign up`);
    const username = kcUser?.preferred_username || kcUser?.email;
    createUserDto.username = username;
    const user = await this.authService.signUp(createUserDto);
    const rootId: number = await this.collectionService.createRoot(user);
    await this.collectionService.createShared(user);
    await this.collectionService.createSider(user);
    if (createUserDto.publicBundleId) {
      const publicBundleCollection: Collection =
        await this.collectionService.getCollectionById(
          createUserDto.publicBundleId,
          user,
        );
      const pictoIdsFromBundle: number[] = await Promise.all(
        publicBundleCollection?.pictos.map(
          async (picto) =>
            await this.collectionService.copyPicto(rootId, picto, user),
        ),
      );
      const collectionIdsFromBundle: number[] = await Promise.all(
        publicBundleCollection?.collections.map(
          async (collection) =>
            await this.collectionService.copyCollection(
              rootId,
              collection.id,
              user,
            ),
        ),
      );
      const modifyCollectionDto: modifyCollectionDto = {
        meaning: null,
        speech: null,
        priority: 10,
        color: null,
        collectionIds: collectionIdsFromBundle,
        pictoIds: pictoIdsFromBundle,
        pictohubId: null,
      };
      await this.collectionService.modifyCollection(
        rootId,
        user,
        modifyCollectionDto,
        null,
      );
    }
    if (user.directSharers.length != 0) {
      const multipleShareCollectionDto: multipleShareCollectionDto = {
        access: 1,
        usernames: user.directSharers,
        role: 'editor',
      };
      await this.collectionService.shareCollectionVerification(
        rootId,
        user,
        multipleShareCollectionDto,
      );
    }
    console.log(await this.collectionService.getCollectionById(rootId, user));
    return;
  }

  @UseGuards(UserGuard)
  @Get('user/details')
  getUserDetails(@GetUser() user: User): Promise<User> {
    this.logger.verbose(`User "${user.username}" is trying to get Details`);
    return this.authService.getUserDetails(user);
  }

  @UseGuards(UserGuard)
  @Put('user/details')
  async editUser(
    @GetUser() user: User,
    @Body(ValidationPipe) editUserDto: EditUserDto,
  ): Promise<User> {
    if (editUserDto.mailingList) {
      try {
        JSON.parse(editUserDto.mailingList);
      } catch (error) {
        throw new BadRequestException(
          `mailing list ${editUserDto.mailingList} is not valid`,
        );
      }
    }
    if (editUserDto.settings) {
      try {
        JSON.parse(editUserDto.settings);
      } catch (error) {
        throw new BadRequestException(
          `settings ${editUserDto.settings} is not valid`,
        );
      }
    }
    this.logger.verbose(`User "${user.username}" is trying to modify Details`);
    const editedUser = await this.authService.editUser(user, editUserDto);
    if (editedUser.directSharers.length != 0) {
      const multipleShareCollectionDto: multipleShareCollectionDto = {
        access: 1,
        usernames: user.directSharers,
        role: 'editor',
      };
      await this.collectionService.shareCollectionVerification(
        editedUser.root,
        editedUser,
        multipleShareCollectionDto,
      );
    }
    return editedUser;
  }

  @UseGuards(UserGuard)
  @Get('/user/root')
  async getRoot(@GetUser() user: User): Promise<Collection> {
    this.logger.verbose(`User "${user.username}" getting his root`);
    const root = await this.authService.getRoot(user);
    return this.collectionService.getCollectionById(root, user);
  }

  @UseGuards(UserGuard)
  @Get('/user/sider')
  async getSider(@GetUser() user: User): Promise<Collection> {
    this.logger.verbose(`User "${user.username}" getting his root`);
    const sider = await this.authService.getSider(user);
    return this.collectionService.getCollectionById(sider, user);
  }

  @UseGuards(UserGuard)
  @Get('/user/shared')
  async getShared(@GetUser() user: User): Promise<Collection> {
    this.logger.verbose(
      `User "${user.username}" getting his shared with me Collection`,
    );
    const shared = await this.authService.getShared(user);
    return this.collectionService.getCollectionById(shared, user);
  }

  @UseGuards(UserGuard)
  @Get('/user/notification')
  async getNotifications(@GetUser() user: User): Promise<Notif[]> {
    return this.authService.getNotifications(user);
  }

  @UseGuards(UserGuard)
  @Delete('/user/notification')
  async clearNotifications(@GetUser() user: User): Promise<Notif[]> {
    this.logger.verbose(`User "${user.username}" clearing his notifications`);
    return this.authService.clearNotifications(user);
  }
}
