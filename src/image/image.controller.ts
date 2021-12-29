import { HttpService } from '@nestjs/axios';
import { Controller, Get, Header, Logger, Param, Query, Res, ValidationPipe } from '@nestjs/common';
import { flickrAPIKey } from 'api';
import { FilterDto } from './dto/flickr.search.dto';


@Controller('image')
export class ImageController {
    constructor(private httpService: HttpService) {}
    private logger = new Logger('ImageController');
    @Get('/pictalk/:imgpath')
    @Header('Cache-Control', 'max-age=31536000')
    seeUploadedFile(@Param('imgpath') image, @Res() res) {
        this.logger.verbose(`Requesting image with path : ${image}`);
        return res.sendFile(image, { root: './files/' });
    }

    @Get('/flickr/')
    searchFlickr(@Query(ValidationPipe) filterDto: FilterDto): any {
        return this.httpService.get(`https://www.flickr.com/services/rest/?sort=relevance&lang=${filterDto.language}&method=flickr.photos.search&api_key=${flickrAPIKey}&text=${filterDto.search}&safe_search=true&per_page=40&format=json&nojsoncallback=1`);
    }
}
