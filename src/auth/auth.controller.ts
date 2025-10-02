import { multipleShareCollectionDto } from './../collection/dto/collection.share.dto';
import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Logger, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards, ValidationPipe } from '@nestjs/common';
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
import { PictoService } from 'src/picto/picto.service';
import { HttpService } from '@nestjs/axios';
import { OptionnalAuth } from './optionnal_auth.guard';
@Controller('')
export class AuthController {
        private KC_ODOO_URL = process.env.KC_ODOO_URL;
        private logger = new Logger('AuthController');
        constructor(private authService: AuthService,
                @Inject(forwardRef(() => CollectionService))
                private collectionService: CollectionService,
                @Inject(forwardRef(() => PictoService))
                private pictoService: PictoService,
                private httpService: HttpService) { }

        @Post('auth/signup')
        async signUp(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<void> {
                const user = await this.authService.signUp(createUserDto);
                const rootId: number = await this.collectionService.createRoot(user);
                await this.collectionService.createShared(user);
                await this.collectionService.createSider(user);
                if (createUserDto.publicBundleId) {
                        const publicBundleCollection: Collection = await this.collectionService.getCollectionById(createUserDto.publicBundleId, user);
                        const pictoIdsFromBundle: number[] = await Promise.all(publicBundleCollection?.pictos.map(async (picto) => this.collectionService.copyPicto(rootId, picto, user)));
                        const collectionIdsFromBundle: number[] = await Promise.all(publicBundleCollection?.collections.map(async (collection) => this.collectionService.copyCollectionWithTransaction(rootId, collection.id, user)));
                        const modifyCollectionDto: modifyCollectionDto = {
                                meaning: null,
                                speech: null,
                                priority: 10,
                                color: null,
                                collectionIds: collectionIdsFromBundle,
                                pictoIds: pictoIdsFromBundle,
                                pictohubId: null,

                        }
                        await this.collectionService.modifyCollection(rootId, user, modifyCollectionDto, null);
                }
                if (user.directSharers.length != 0) {
                        const multipleShareCollectionDto: multipleShareCollectionDto = { access: 1, usernames: user.directSharers, role: 'editor' }
                        await this.collectionService.shareCollectionVerification(rootId, user, multipleShareCollectionDto);
                }
                return;
        }

        @UseGuards(OptionnalAuth)
        @Get('auth/validation/:validationToken')
        async validateUser(@Param('validationToken') validationToken: string, @GetUser() user: User): Promise<void> {
                if (user && user.validationToken === "verified") return;
                if (validationToken != "verified") {
                        return this.authService.userValidation(validationToken);
                }
                return;
        }

        @UseGuards(OptionnalAuth)
        @Get('auth/validation-by-username/:username')
        async validateUserByusername(@Param('username') username: string, @GetUser() user: User): Promise<void> {
                if (user && user.validationToken === "verified") return;
                const dbUser = await this.authService.findWithUsername(username);
                if (dbUser && dbUser.validationToken === "verified") {
                        return;
                } else {
                        throw new NotFoundException(`username ${username} not found`);
                }
        }

        @Post('auth/validation/:username')
        async sendMail(@Param('username') username: string): Promise<void> {
                if (usernameRegexp.test(username)) {
                        const user = await this.authService.findWithUsername(username);
                        if (user) {
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
                const signinResponse: any = await this.authService.signIn(authCredentialsDto);

                if (signinResponse.accessToken) {
                        const userToCreateSider: User = await this.authService.isSiderToCreate(authCredentialsDto.username);
                        if (userToCreateSider) {
                                await this.collectionService.createSider(userToCreateSider);
                        }
                }
                return signinResponse;
        }

        @Post('user/resetPassword')
        resetPassword(
                @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
        ): Promise<void> {
                return this.authService.resetPassword(resetPasswordDto);
        }

        @Post('user/changePassword/:token')
        changePassword(
                @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
                @Param('token') token: string,
        ): Promise<void> {
                return this.authService.changePassword(changePasswordDto, token);
        }

        @Get('user/details')
        @UseGuards(AuthGuard())
        getUserDetails(@GetUser() user: User): Promise<User> {
                return this.authService.getUserDetails(user);
        }

        @Put('user/details')
        @UseGuards(AuthGuard())
        async editUser(
                @GetUser() user: User,
                @Body(ValidationPipe) editUserDto: EditUserDto,
        ): Promise<User> {
                if (editUserDto.mailingList) {
                        try {
                                JSON.parse(editUserDto.mailingList);
                        } catch (error) {
                                throw new BadRequestException(`mailing list ${editUserDto.mailingList} is not valid`);
                        }
                }
                if (editUserDto.settings) {
                        try {
                                JSON.parse(editUserDto.settings);
                        } catch (error) {
                                throw new BadRequestException(`settings ${editUserDto.settings} is not valid`);
                        }
                }
                const editedUser = await this.authService.editUser(user, editUserDto);
                if (editedUser.directSharers.length != 0) {
                        const multipleShareCollectionDto: multipleShareCollectionDto = { access: 1, usernames: user.directSharers, role: 'editor' }
                        await this.collectionService.shareCollectionVerification(editedUser.root, editedUser, multipleShareCollectionDto);
                }
                return editedUser;
        }

        @UseGuards(AuthGuard())
        @Get('/user/root')
        async getRoot(@GetUser() user: User): Promise<Collection> {
                const root = await this.authService.getRoot(user);
                return this.collectionService.getCollectionById(root, user);
        }

        @UseGuards(AuthGuard())
        @Get('/user/sider')
        async getSider(@GetUser() user: User): Promise<Collection> {
                const sider = await this.authService.getSider(user);
                return this.collectionService.getCollectionById(sider, user);
        }

        @UseGuards(AuthGuard())
        @Get('/user/shared')
        async getShared(@GetUser() user: User): Promise<Collection> {
                const shared = await this.authService.getShared(user);
                return this.collectionService.getCollectionById(shared, user);
        }

        @UseGuards(AuthGuard())
        @Get('/user/notification')
        async getNotifications(@GetUser() user: User): Promise<Notif[]> {
                return this.authService.getNotifications(user);
        }

        @UseGuards(AuthGuard())
        @Delete('/user/notification')
        async clearNotifications(@GetUser() user: User): Promise<Notif[]> {
                return this.authService.clearNotifications(user);
        }

        @UseGuards(AuthGuard())
        @Delete('/user/:id')
        async deleteUser(@GetUser() user: User, @Param('id', ParseIntPipe) userId: number): Promise<void> {
                if (user.admin === false && user.id !== userId) {
                        return;
                }
                if (user.admin) {
                        user = await this.authService.findWithId(userId);
                        if (!user) {
                                return;
                        }
                } else {
                }
                try {
                        // Delete all user pictograms
                        await this.collectionService.deleteAllCollections(user);
                        await this.pictoService.deleteAllPictos(user);
                } catch (error) {
                }
                try {
                        await this.collectionService.deleteCollection({ collectionId: user.root, fatherId: undefined }, user);
                } catch (error) {
                }
                try {
                        await this.collectionService.deleteCollection({ collectionId: user.sider, fatherId: undefined }, user);
                } catch (error) {
                }
                try {
                        await this.collectionService.deleteCollection({ collectionId: user.shared, fatherId: undefined }, user);
                } catch (error) {
                }

                return this.authService.deleteUser(user);
        }
}