import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { languageMapping } from 'src/utilities/supported.languages';
import { TranslateDto } from './dto/translation.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AuthGuard } from 'nest-keycloak-connect';
export class TranslationResponse {
  translation: string;
  constructor(translation: string) {
    this.translation = translation;
  }
}

@Controller('translation')
@UseInterceptors(CacheInterceptor)
export class TranslationController {
  constructor(private httpService: HttpService) {}
  private deeplApiDeepL = process.env.DEEPL_API_KEY;

  @Post()
  async getTraduction(
    @Body() TranslateDto: TranslateDto,
  ): Promise<TranslationResponse> {
    if (languageMapping[TranslateDto.targetLang] !== undefined) {
      if (TranslateDto.targetService) {
        if (TranslateDto.targetService == 'deepl') {
          return this.deepl(TranslateDto);
        } else {
          return this.libretranslate(TranslateDto);
        }
      } else {
        try {
          return this.deepl(TranslateDto);
        } catch (error) {
          try {
            return this.libretranslate(TranslateDto);
          } catch (error) {
            console.log(error);
            throw new InternalServerErrorException(
              `couldn't get Translation from Deepl and Libre Translate`,
            );
          }
        }
      }
    } else {
      return { translation: TranslateDto.text };
    }
  }
  async deepl(TranslateDto: TranslateDto): Promise<TranslationResponse> {
    try {
      let request = encodeURI(
        `https://api-free.deepl.com/v2/translate?auth_key=${this.deeplApiDeepL}&text=${TranslateDto.text}&target_lang=${TranslateDto.targetLang}`,
      );
      const response = await lastValueFrom(
        this.httpService.get(request, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': '*',
          },
        }),
      );
      return new TranslationResponse(response.data.translations[0].text);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `couldn't get Translation from Deepl {${error}}}`,
      );
    }
  }
  async libretranslate(
    TranslateDto: TranslateDto,
  ): Promise<TranslationResponse> {
    try {
      let request = `http://libretranslate.home.asidiras.dev/translate`;
      const body = {
        q: TranslateDto.text,
        source: TranslateDto.sourceLang,
        target: TranslateDto.targetLang,
      };
      const response = await lastValueFrom(
        this.httpService.post(request, body),
      );
      return new TranslationResponse(response.data.translatedText);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `couldn't get Translation from Libre Translate`,
      );
    }
  }
}
