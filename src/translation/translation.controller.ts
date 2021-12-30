import { HttpService } from '@nestjs/axios';
import { Controller, Get, InternalServerErrorException, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { deeplAPIkey } from 'api';
import { lastValueFrom } from 'rxjs';
import { TranslateDto } from './dto/translation.dto';

@Controller('translation')
export class TranslationController {
    constructor(private httpService: HttpService) {}
    @UseGuards(AuthGuard())
    @Get()
    async getTraduction(@Query(ValidationPipe) TranslateDto: TranslateDto){
        try{
            const response = await lastValueFrom(this.httpService.get(
                `https://api-free.deepl.com/v2/translate?auth_key=${deeplAPIkey}&text=${TranslateDto.text}&target_lang=${TranslateDto.targetLang}`
                ));
            return response.data;
        } catch(error) {
            throw new InternalServerErrorException(`couldn't get Translation from Deepl`);
        }
    }
}
