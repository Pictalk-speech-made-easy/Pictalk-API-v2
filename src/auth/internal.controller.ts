import { Body, Controller, Get, NotFoundException, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { AuthService } from './auth.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';

@UseGuards(InternalApiKeyGuard)
@Controller('internal')
export class InternalController {
  constructor(private authService: AuthService) {}

  @Get('users/:username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.authService.findByUsername(username);
    if (!user) {
      throw new NotFoundException();
    }
    return toDto(user);
  }

  @Post('verify')
  async verify(@Body() body: { username: string; password: string }): Promise<void> {
    const user = await this.authService.findByUsername(body.username);
    if (!user) {
      throw new UnauthorizedException();
    }

    const hash = await bcrypt.hash(body.password, user.salt);
    if (hash !== user.password) {
      throw new UnauthorizedException();
    }
  }
}

function toDto(user: User) {
  let userType: string | undefined;
  try {
    userType = JSON.parse(user.settings)?.userType;
  } catch {
    userType = undefined;
  }

  return {
    id: user.id,
    username: user.username,
    displayLanguage: user.displayLanguage,
    userType,
    admin: user.admin,
    createdDate: user.createdDate,
    last_connection: user.last_connection,
  };
}