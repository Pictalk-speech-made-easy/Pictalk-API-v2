import { HttpService } from '@nestjs/axios';
import {
  Body,
  CacheInterceptor,
  Controller,
  InternalServerErrorException,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { encode } from 'querystring';
import { lastValueFrom } from 'rxjs';
import { languageMapping } from 'src/utilities/supported.languages';
import { text } from 'stream/consumers';
import { TranslateDto } from './dto/translation.dto';

export class TranslationResponse{
  translation : string
  constructor(translation: string){
    this.translation = translation;
  }
}

@Controller('translation')
@UseInterceptors(CacheInterceptor)
export class TranslationController {
  constructor(private httpService: HttpService) {}
  private deeplApiDeepL = process.env.DEEPL_API_KEY;
  @UseGuards(AuthGuard())
  @Post()
  async getTraduction(@Body() TranslateDto: TranslateDto): Promise<TranslationResponse> {
    if(languageMapping[TranslateDto.targetLang] !== undefined){
      if(TranslateDto.targetService){
        if(TranslateDto.targetService == "deepl"){
          return this.deepl(TranslateDto);
        }
        else{
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
      return {translation : TranslateDto.text};
    }
    
  }
  async deepl(TranslateDto: TranslateDto): Promise<TranslationResponse>{
    try {
      let request = encodeURI(`https://api-free.deepl.com/v2/translate?auth_key=${this.deeplApiDeepL}&text=${TranslateDto.text}&target_lang=${TranslateDto.targetLang}`);
        const response = await lastValueFrom(
          this.httpService.get(
            request,
          ),
        );
        return new TranslationResponse(response.data.translations[0].text);
    } catch(error) {
      throw new InternalServerErrorException(
        `couldn't get Translation from Deepl`,
      );
    }
  }
  async libretranslate(TranslateDto: TranslateDto): Promise<TranslationResponse>{
    try {
      let request = `http://libretranslate.home.asidiras.dev/translate`;
      const body = {
        q : TranslateDto.text,
        source : TranslateDto.sourceLang,
        target : TranslateDto.targetLang
      };
      const response = await lastValueFrom(this.httpService.post(request, body));
      return new TranslationResponse(response.data.translatedText);;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `couldn't get Translation from Libre Translate`,
      );
    }
  }
}
