import { EntityRepository, Repository } from "typeorm";
import { ConflictException, ForbiddenException, InternalServerErrorException, Logger } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import sgMail = require('@sendgrid/mail');
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { EditUserDto } from "./dto/edit-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { getArrayIfNeeded } from "src/utilities/tools";
import { Notif } from "src/entities/notification.entity";
import { APIkey } from "src/entities/keys.entity";
@EntityRepository(User)
export class UserRepository extends Repository<User> {
    private logger = new Logger('AuthService');

    async signUp(createUserDto: CreateUserDto): Promise<User> {
        const { username, password, language, directSharers, languages, apikeys } = createUserDto;
    
        const user = this.create();
        user.username = username;
        user.salt = await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);
    
        user.resetPasswordToken = '';
        user.resetPasswordExpires = '';
        user.language = language;
        if(directSharers){
          user.directSharers = getArrayIfNeeded(directSharers);
        }
        if(apikeys){
          user.apikeys = getArrayIfNeeded(apikeys);
        }
        user.languages = languages
    
        try {
          await user.save();
        } catch (error) {
          if (error.code == 23505) {
            //Duplicate Username
            throw new ConflictException('Username already exists');
          } else {
            this.logger.verbose(
              `Problem while saving the User: ${user.username}, error is : ${error} !`,
            );
            throw new InternalServerErrorException(error);
          }
        }
        try{
          await sgMail.send({from: 'alex@pictalk.xyz', to: user.username, templateId: 'd-33dea01340e5496691a5741588e2d9f7'});
        } catch(error){}
        this.logger.verbose(`User ${user.username} is being saved !`);
        return user;
      }

    async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<string> {
        const {username, password} = authCredentialsDto;
        const user = await this.findOne({ username });
        if(user && await user.validatePassword(password)){
            return user.username;
        } else{
            return null;
        }
    }

    private async hashPassword(password: string, salt: string): Promise<string>{
        return bcrypt.hash(password, salt);
    }

    async pushRoot(user: User, root: number): Promise<void>{
        if(user.root){
            throw new ForbiddenException(`User ${user.username} already has a root with id ${user.root}`);
        } else {
            user.root= root;
        }
        try {
            await user.save();
        } catch(error){
            throw new InternalServerErrorException(error);
        }
        return;
    }

    async resetPassword(
        resetPasswordDto: ResetPasswordDto,
        resetTokenValue: string,
        resetTokenExpiration: string,
      ): Promise<void> {
        const { username } = resetPasswordDto;
        const user = await this.findOne({ username });
        if (!user) {
          return;
        }
    
        user.resetPasswordToken = resetTokenValue;
        user.resetPasswordExpires = resetTokenExpiration;
    
        try {
          await user.save();
        } catch (error) {
          throw new InternalServerErrorException(error);
        }
    
        try {
          sgMail.send({
            from: 'alex@pictalk.xyz',
            to: user.username,
            templateId: 'd-d68b41c356ba493eac635229b678744e',
            dynamicTemplateData: {
              token: resetTokenValue,
            },
          });
        } catch (error) {
          throw new Error(error);
        }
        return;
      }

      async getUserDetails(user: User): Promise<User> {
        delete user.password;
        delete user.salt;
        delete user.collections;
        delete user.resetPasswordToken;
        delete user.resetPasswordExpires;
        delete user.pictos;
        delete user.admin;
        return user;
      }

      async editUser(user: User, editUserDto: EditUserDto): Promise<void> {
        const { username, language, password, directSharers, languages, apikeys, apinames } = editUserDto;
        if (username) {
          user.username = username;
        }
        if (language) {
          user.language = language;
        }
        if (password) {
          user.salt = await bcrypt.genSalt();
          user.password = await this.hashPassword(password, user.salt);
        }
        if (directSharers) {
          user.directSharers=directSharers;
        }
        if (languages){
          user.languages = languages;
        }
        if(apikeys){
          const apis = await this.APIkeyFromDto(editUserDto.apinames, editUserDto.apikeys);
          user.apikeys = await this.APIkeyFromDto(editUserDto.apinames, editUserDto.apikeys);
        }
        try {
          await user.save();
        } catch (error) {
          throw new InternalServerErrorException(error);
        }
      }

      async APIkeyFromDto(apinames: string[], apikeys: string[]): Promise<APIkey[]>{
        const length = apinames.length;
        let apis: APIkey[]=[];
        for(var i=0; i<length; i++){
            const api= new APIkey();
            api.name=apinames[i];
            api.key=apikeys[i];
            apis.push(api);
        }
        return apis
    }

      async changePassword(changePasswordDto: ChangePasswordDto, token: string): Promise<void> {
        const { password } = changePasswordDto;
        const user = await this.findOne({ where: { resetPasswordToken: token } });
        if (!user) {
          return;
        }
        if (Number(user.resetPasswordExpires) > Date.now()) {
          user.salt = await bcrypt.genSalt();
          user.password = await this.hashPassword(password, user.salt);
          user.resetPasswordToken = "";
          user.resetPasswordExpires = "";
          try {
            await user.save();
          } catch (error) {
            throw new InternalServerErrorException(error);
          }
        }
        try {
          sgMail.send({
            from: 'alex@pictalk.xyz',
            to: user.username,
            templateId: 'd-55a93fc67fa346939b6507a6f5cc477f',
          });
        } catch (error) {
          throw new Error(error);
        }
        return;
      }

      async clearNotifications(user: User): Promise<Notif[]>{
        user.notifications=[];
        try {
          await user.save();
        } catch (error) {
          throw new InternalServerErrorException(error);
        }
        return user.notifications;
      }

      async pushNotification(user: User, notification : Notif): Promise<Notif[]>{
        user.notifications.push(notification);
        try {
          await user.save();
        } catch (error) {
          throw new InternalServerErrorException(error);
        }
        return user.notifications;
        
    }
}