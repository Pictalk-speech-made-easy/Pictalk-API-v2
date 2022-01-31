import { HttpService } from '@nestjs/axios';
import {
  CacheInterceptor,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { lastValueFrom } from 'rxjs';
import { TranslateDto } from './dto/translation.dto';

@Controller('translation')
@UseInterceptors(CacheInterceptor)
export class TranslationController {
  constructor(private httpService: HttpService) {}
  private deeplApiDeepL = process.env.DEEPL_API_KEY;
  @UseGuards(AuthGuard())
  @Get()
  async getTraduction(@Query(ValidationPipe) TranslateDto: TranslateDto) {
    try {
      let request = `https://api-free.deepl.com/v2/translate?auth_key=${this.deeplApiDeepL}&text=${TranslateDto.text}&target_lang=${TranslateDto.targetLang}`;
      if(TranslateDto.sourceLang){
        request = request + `&source_lang=${TranslateDto.sourceLang}`
      }
      const response = await lastValueFrom(
        this.httpService.get(
          request,
        ),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        `couldn't get Translation from Deepl`,
      );
    }
  }
}
