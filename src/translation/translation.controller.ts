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
  @Get()
  async getTraduction(@Query(ValidationPipe) TranslateDto: TranslateDto): Promise<TranslationResponse> {
    
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
      console.log(response.data);
      return new TranslationResponse(response.data.translations[0].text);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `couldn't get Translation from Deepl`,
      );
    }
    
    /*
    try {
      let request = `http://localhost:5000/translate`;
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
        `couldn't get Translation from LibreTranslate`,
      );
    }
    */
  }
}
