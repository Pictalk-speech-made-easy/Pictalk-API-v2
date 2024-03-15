import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { getArrayIfNeeded } from 'src/utilities/tools';
import { Notif } from 'src/entities/notification.entity';
import { stringifyMap, validLanguage } from 'src/utilities/creation';
import sgMail = require('@sendgrid/mail');
import { welcome } from 'src/utilities/emails';
import { CustomRepository } from 'src/utilities/typeorm-ex.decorator';

@CustomRepository(User)
export class UserRepository extends Repository<User> {
  private logger = new Logger('AuthService');
  private sgmail = sgMail.setApiKey(process.env.SENDGRID_KEY);
  async signUp(createUserDto: CreateUserDto): Promise<User> {
    const { username, language, directSharers, languages, displayLanguage } =
      createUserDto;
    const user = this.create();
    user.username = username;
    user.language = language;
    user.displayLanguage = displayLanguage;
    user.password = 'not_used';
    user.salt = 'salt';
    user.resetPasswordToken = '';
    user.resetPasswordExpires = '';
    user.validationToken = 'verified';
    const voices = validLanguage(languages);
    user.languages = stringifyMap(voices);
    if (directSharers) {
      user.directSharers = getArrayIfNeeded(directSharers);
    }

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
    try {
      await sgMail.send({
        from: 'alex@pictalk.org',
        to: user.username,
        templateId: 'd-33dea01340e5496691a5741588e2d9f7',
        dynamicTemplateData: {
          welcome: welcome[`${user.displayLanguage}`]
            ? welcome[`${user.displayLanguage}`]
            : welcome.en,
          token: user.validationToken,
        },
      });
    } catch (error) {
      console.error(error);
      console.error(error.request);
      if (error.response) {
        console.error(error.response.body);
      }
    }
    this.logger.verbose(
      `User ${user.username} is being saved, validationToken is ${user.validationToken}!`,
    );
    return user;
  }

  async sendMail(user: User): Promise<void> {
    try {
      await sgMail.send({
        from: 'alex@pictalk.org',
        to: user.username,
        templateId: 'd-33dea01340e5496691a5741588e2d9f7',
        dynamicTemplateData: {
          welcome: welcome[`${user.displayLanguage}`]
            ? welcome[`${user.displayLanguage}`]
            : welcome.en,
          token: user.validationToken,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `could not send mail to ${user.username}`,
      );
    }
  }

  async userValidation(validationToken: string): Promise<void> {
    const user = await this.findOne({
      where: { validationToken: validationToken },
    });
    if (user) {
      if (user.validationToken === validationToken) {
        user.validationToken = 'verified';
        try {
          await user.save();
        } catch (error) {
          throw new InternalServerErrorException('cannot save user');
        }
      }
    } else {
      throw new UnauthorizedException(`wrong token ${validationToken}`);
    }
  }

  async pushRoot(user: User, root: number): Promise<void> {
    if (user.root) {
      throw new ForbiddenException(
        `User ${user.username} already has a root with id ${user.root}`,
      );
    } else {
      user.root = root;
    }
    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
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
    return user;
  }

  async editUser(user: User, editUserDto: EditUserDto): Promise<User> {
    const {
      language,
      directSharers,
      languages,
      displayLanguage,
      settings,
      mailingList,
    } = editUserDto;
    if (language) {
      user.language = language;
    }
    if (directSharers) {
      user.directSharers = directSharers;
    }
    if (languages) {
      user.languages = languages;
    }
    if (displayLanguage) {
      user.displayLanguage = displayLanguage;
    }
    if (settings) {
      user.settings = settings;
    }
    if (mailingList) {
      user.mailingList = mailingList;
    }
    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return this.getUserDetails(user);
  }

  async clearNotifications(user: User): Promise<Notif[]> {
    user.notifications = [];
    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return user.notifications;
  }

  async pushNotification(user: User, notification: Notif): Promise<Notif[]> {
    user.notifications.push(notification);
    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return user.notifications;
  }

  async deleteUser(user: User): Promise<void>{
    try {
      await user.remove();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return;
  }
}
