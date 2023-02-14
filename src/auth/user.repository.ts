import { Repository } from "typeorm";
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { Language, User } from "src/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { EditUserDto } from "./dto/edit-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { getArrayIfNeeded } from "src/utilities/tools";
import { Notif } from "src/entities/notification.entity";
import { generateAvatar, generateRandomColor, stringifyMap, validLanguage } from "src/utilities/creation";
import sgMail = require('@sendgrid/mail');
import { randomBytes } from "crypto";
import { Validation } from "./dto/user-validation.dto";
import { resetPassword, welcome } from "src/utilities/emails";
import { CustomRepository } from "src/utilities/typeorm-ex.decorator";
import { Collection, Plext } from "src/entities/collection.entity";
import { CollectionRepository } from "src/collection/collection.repository";
import { meaningRoot } from "src/utilities/meaning";
import { writeFile } from "fs";
import { CreateLanguageDto } from "./dto/create-language.dto";
import { Group } from "src/entities/group.entity";
import { CreateGroupDto } from "./dto/create-group.dto";
import { DeleteGroupDto } from "./dto/delete-group.dto";
import { EditGroupDto } from "./dto/edit-group.dto";

@CustomRepository(User)
export class UserRepository extends Repository<User> {
    private logger = new Logger('AuthService');
    private sgmail = sgMail.setApiKey(process.env.SENDGRID_KEY);
    async signUp(createUserDto: CreateUserDto): Promise<User> {
        const { username, password, displayLanguage } = createUserDto;
        const user = new User();
        user.username = username;
        user.salt = await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);
        user.displayLanguage = displayLanguage;
        user.root = await this.createRoot(user);
        user.shared = new Collection();
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
            throw new InternalServerErrorException(`could not save user`);
          }
        }
        try{
          await this.sendMail(user);
        } catch(error){
          console.error(error);
          if (error.response) {
            console.error(error.response.body)
          }
        }
        this.logger.verbose(`User ${user.username} is being saved, validationToken is ${user.validationToken}!`);
        return user;
      }

    async createRoot(user: User): Promise<Collection>{
        const name = user.username.split('@')[0]?.replace(/[^a-zA-Z]/gi, '');
        const root = new Collection();
        root.meaning = root.createPlextFromJSON(
            {
            en: name + meaningRoot.en, 
            fr: meaningRoot.fr+ name, 
            es: meaningRoot.es + name,
            it: meaningRoot.it + name,
            de: name + meaningRoot.de,
            ro: meaningRoot.ro + name,
            po: meaningRoot.po + name,
            el: meaningRoot.el + name,
        });
        root.speech = root.createPlextFromJSON({
            en: name + meaningRoot.en, 
            fr: meaningRoot.fr+ name, 
            es: meaningRoot.es + name,
            it: meaningRoot.it + name,
            de: name + meaningRoot.de,
            ro: meaningRoot.ro + name,
            po: meaningRoot.po + name,
            el: meaningRoot.el + name,
        });
        const avatarPng = generateAvatar(name.slice(0, 2), generateRandomColor(), "#FFFFFF");
        writeFile(`./files/${user.username}.png`, avatarPng, (err) => {console.log(err)});
        root.image = `${user.username}.png`;
        return root;
    }
    async sendMail(user: User): Promise<void>{
      try{
        await sgMail.send({
          from: 'alex@pictalk.org', 
          to: user.username, 
          templateId: 'd-33dea01340e5496691a5741588e2d9f7',
          dynamicTemplateData: {
            welcome : welcome[`${user.displayLanguage}`] ? welcome[`${user.displayLanguage}`] : welcome.en,
            token: user.validationToken,
          },
        });
      } catch(error){
        throw new InternalServerErrorException(`could not send mail to ${user.username}`)
      }
    }
    async userValidation(validationToken: string): Promise<void>{
      const user = await this.createQueryBuilder('user').update(User)
      .set({validationToken: 'verified'})
      .where('validationToken = :validationToken', {validationToken: validationToken})
      .execute();
      if(user.affected == 0){
        throw new UnauthorizedException(`Token ${validationToken} is invalid`);
      } else {
        return;
      }
    }
    async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<Validation> {
        const {username, password} = authCredentialsDto;
        const user = await this.findOne({ where: {username: username},});
        if(user && await user.validatePassword(password)){
            return new Validation(user.username, user.validationToken);
        } else{
            return null;
        }
    }
    private async hashPassword(password: string, salt: string): Promise<string>{
        return bcrypt.hash(password, salt);
    }
    async resetPassword(
        resetPasswordDto: ResetPasswordDto,
        resetTokenValue: string,
        resetTokenExpiration: string,
      ): Promise<void> {
        const { username } = resetPasswordDto;
        const user = await this.findOne({ where: {
          username,
        }, });
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
            from: 'alex@pictalk.org',
            to: user.username,
            templateId: 'd-d68b41c356ba493eac635229b678744e',
            dynamicTemplateData: {
              resetPassword : resetPassword[`${user.displayLanguage}`] ? resetPassword[`${user.displayLanguage}`] : resetPassword.en,
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
      return user;
    }
    async createLanguage(language: CreateLanguageDto, user: User): Promise<Language[]> {
      user.languages.push(new Language(language.device, language.locale, language.voiceuri, language.picth, language.rate));
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
      return user.languages;
    }

    // TODO create, edit, delete group, share collection to group
    // update language, update settings(override), 
    // change Tabs

    async createGroup(group: CreateGroupDto, user: User): Promise<Group[]> {
      user.groups.push(new Group(group.name, group.members));
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
      return user.groups;
    }
    async editGroup(editedgroup: EditGroupDto, user: User): Promise<Group[]> {
      const index = user.groups.findIndex((group) => group.name === editedgroup.name);
      if (index > -1) {
        user.groups[index].members = editedgroup.members;
      }
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
      return user.groups;
    }
    async deleteGroup(delete_id: DeleteGroupDto, user: User): Promise<void> {
      const index = user.groups.findIndex((group) => group.id === delete_id);
      if (index > -1) {
        user.groups.splice(index, 1);
      }
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
      return;
    }
    
    async editUser(user: User, editUserDto: EditUserDto): Promise<User> {
      const { language, directSharers, languages, displayLanguage, settings, mailingList } = editUserDto;
      if (language) {
        user.language = language;
      }
      if (directSharers) {
        user.directSharers=directSharers;
      }
      if (languages){
        user.languages = languages;
      }
      if(displayLanguage){
        user.displayLanguage = displayLanguage;
      }
      if(settings){
        user.settings = settings;
      }
      if(mailingList){
        user.mailingList = mailingList;
      }
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
      return this.getUserDetails(user);
    }



}