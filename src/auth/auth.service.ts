import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';
import * as config from 'config';
import { EditUserDto } from './dto/edit-user.dto';
import { Notif } from 'src/entities/notification.entity';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.directSharers) {
      for (let i = 0; i < createUserDto.directSharers.length; i++) {
        const user = await this.findWithUsername(
          createUserDto.directSharers[i],
        );
        const exists = await this.verifyExistence(user);
        if (!exists) {
          createUserDto.directSharers.splice(i, 1);
        }
      }
    }

    return this.userRepository.signUp(createUserDto);
  }

  async userValidation(validationToken: string): Promise<void> {
    return this.userRepository.userValidation(validationToken);
  }

  async admins(): Promise<User[]> {
    return this.userRepository.find({ where: { admin: true } });
  }

  async getUserCount(): Promise<number> {
    return await this.userRepository.createQueryBuilder('user').getCount();
  }

  async editUser(user: User, editUserDto: EditUserDto): Promise<User> {
    if (editUserDto.directSharers) {
      for (let i = 0; i < editUserDto.directSharers.length; i++) {
        const user = await this.findWithUsername(editUserDto.directSharers[i]);
        const exists = await this.verifyExistence(user);
        if (!exists) {
          editUserDto.directSharers.splice(i);
        }
      }
    }
    return this.userRepository.editUser(user, editUserDto);
  }
  async getUserDetails(user: User): Promise<User> {
    return this.userRepository.getUserDetails(user);
  }
  verifyExistence(user: User): boolean {
    if (typeof user === 'undefined') {
      return false;
    } else {
      return true;
    }
  }

  async pushRoot(user: User, root: number): Promise<void> {
    return this.userRepository.pushRoot(user, root);
  }

  async getRoot(user: User): Promise<number> {
    return user.root;
  }

  async getSider(user: User): Promise<number> {
    return user.sider;
  }

  async getShared(user: User): Promise<number> {
    return user.shared;
  }

  async getNotifications(user: User): Promise<Notif[]> {
    return user.notifications;
  }

  async pushNotification(user: User, notification: Notif): Promise<Notif[]> {
    return this.userRepository.pushNotification(user, notification);
  }

  async clearNotifications(user: User): Promise<Notif[]> {
    return this.userRepository.clearNotifications(user);
  }

  async findWithUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username: username },
    });
    return user;
  }

  async sendMail(user: User): Promise<void> {
    return this.userRepository.sendMail(user);
  }

  async isSiderToCreate(username): Promise<User> {
    const user: User = await this.findWithUsername(username);
    return user.sider ? null : user;
  }
}
