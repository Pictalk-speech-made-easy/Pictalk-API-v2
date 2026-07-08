import { Body, Controller, forwardRef, Get, Inject, NotFoundException, Param, Post, Query, StreamableFile, UnauthorizedException, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { AuthService } from './auth.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';
import { v1_to_obz } from 'src/utilities/open-board';
import { CollectionService } from 'src/collection/collection.service';

@UseGuards(InternalApiKeyGuard)
@Controller('internal')
export class InternalController {
  constructor(private authService: AuthService, 
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}
  
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

  @Get('export/:username')
  async export_to_obz(
    @Param('username') username: string,
    @Query('image') imageMode?: 'base64' | 'url',
    @Query('include_shared') includeShared?: string,
  ): Promise<StreamableFile> {
    const user = await this.authService.findByUsername(username);
    if (!user) throw new NotFoundException();
    const allCollections = await this.collectionService.get_collections(user);
    const collections = includeShared === 'false'
      ? allCollections.filter(c => c.userId === user.id)
      : allCollections;
    const user_details = await this.authService.getUserDetails(user);
    const buffer = await v1_to_obz(collections, user_details, { imageMode: imageMode === 'url' ? 'url' : 'base64' });

    return new StreamableFile(buffer, { type: 'application/zip', disposition: `attachment; filename="${user_details.username}-pictalk.obz"`});
  }

  @Get('export-matches/:username')
  async export_case_insensitive_matches(@Param('username') username: string): Promise<{ usernames: string[] }> {
    const users = await this.authService.findAllByUsernameCaseInsensitive(username);
    return { usernames: users.map(u => u.username) };
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
    directSharers: user.directSharers ?? [],
  };
}