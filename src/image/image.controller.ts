import { HttpService } from '@nestjs/axios';
import {
  CacheInterceptor,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Logger,
  Param,
  Query,
  Res,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilterDto } from './dto/search.dto';
import { createClient } from 'pexels';
import { WebImage } from 'src/entities/webImage.entity';
const client = createClient('563492ad6f9170000100000141844035a31b4fe8acba00dfd6436b14');

@Controller('image')
@UseInterceptors(CacheInterceptor)
export class ImageController {
  constructor(private httpService: HttpService) {}
  private flickrAPIKey = process.env.FLICKR_API_KEY;
  private unsplashAPIKey = process.env.UNSPLASH_API_KEY;
  private pixabayAPIKey = process.env.PIXABAY_API_KEY
  private logger = new Logger('ImageController');
  private flickr = "https://live.staticflickr.com";
  @Get('/pictalk/:imgpath')
  @Header('Cache-Control', 'max-age=31536000')
  seeUploadedFile(@Param('imgpath') image, @Res() res) {
    this.logger.verbose(`Requesting image with path : ${image}`);
    return res.sendFile(image, { root: './files/' });
  }

  @Get('/flickr/')
  async searchFlickr(
    @Query(ValidationPipe) filterDto: FilterDto): Promise<any> {
    try {
      let perPage = filterDto.perPage ? filterDto.perPage : 8;
      const response = await lastValueFrom(
        this.httpService.get(
          `https://www.flickr.com/services/rest/?sort=relevance&lang=${filterDto.language}&method=flickr.photos.search&api_key=${this.flickrAPIKey}&text=${filterDto.search}&safe_search=true&per_page=${perPage}&format=json&nojsoncallback=1`,
        ),
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`couldn't get images from Flickr`);
    }
  }

  @Get('/unsplash/')
  async searchUnsplash(@Query(ValidationPipe) filterDto: FilterDto): Promise<any> {
    try {
      let perPage = filterDto.perPage ? filterDto.perPage : 8;
      const response = await lastValueFrom(
        this.httpService.get(
          `https://api.unsplash.com/search/photos?query=${filterDto.search}&content_filter=high&lang=${filterDto.language}&per_page=${perPage}&client_id=${this.unsplashAPIKey}`,
        ),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(`couldn't get images from unsplash`);
    }
  }

  @Get('/pexels/')
  async searchPexels(@Query(ValidationPipe) filterDto: FilterDto): Promise<any> {
    try {
      let perPage = filterDto.perPage ? filterDto.perPage : 8;
      const response = client.photos.search({ query: filterDto.search, size: "small", locale: "fr-FR", per_page: perPage });
      return response;
    } catch (error) {
      throw new InternalServerErrorException(`couldn't get images from pexels`);
    }
  }

  @Get('/images/')
  async searchImages(@Query(ValidationPipe) filterDto: FilterDto): Promise<any> {
    let webImages : WebImage[]= [];
    let perPage = filterDto.perPage ? filterDto.perPage : 8;
    const flickrRes = await lastValueFrom(
      this.httpService.get(
        `https://www.flickr.com/services/rest/?sort=relevance&lang=${filterDto.language}&method=flickr.photos.search&api_key=${this.flickrAPIKey}&text=${filterDto.search}&safe_search=true&per_page=${perPage}&format=json&nojsoncallback=1`,
      ),
    ).then((flickrRes) => {
      const images = flickrRes.data.photos.photo;
      for(let image of images){
        webImages.push(new WebImage(
          "flickr", 
          image.title, 
          image.owner,
          `${this.flickr}/${image.server}/${image.id}_${image.secret}_m.jpg`,
          `${this.flickr}/${image.server}/${image.id}_${image.secret}.jpg`
          ));
      }
    }).catch((error) => {})
    const unsplashRes = await lastValueFrom(
    this.httpService.get(
      `https://api.unsplash.com/search/photos?query=${filterDto.search}&content_filter=high&lang=${filterDto.language}&per_page=${perPage}&client_id=${this.unsplashAPIKey}`,
    ),
    ).then((unsplashRes) => {
      const images = unsplashRes.data.results;
      for(let image of images){
        webImages.push(new WebImage(
          "unsplash", 
          filterDto.search, 
          image.user.username, 
          image.urls.thumb,
          image.urls.small
          ));
      }
    }).catch((error) => {});
    const pexelsRes = await client.photos.search({ query: filterDto.search, size: "small", locale: "fr-FR", per_page: perPage }).then(
      (pexelsRes : any) => {
        const images = pexelsRes.photos;
        for(let image of images){
          webImages.push(new WebImage(
            "pexels", 
            filterDto.search, 
            image.photographer, 
            image.src.tiny,
            image.src.medium
            ));
        }
      }
    ).catch((error) => {});

    const pixabayRes = await lastValueFrom(this.httpService.get(`https://pixabay.com/api/?q=${filterDto.search}&lang=${filterDto.language}&safesearch=true&key=${this.pixabayAPIKey}&per_page=${perPage}`)
    ).then((pixabayRes) => {
      const images = pixabayRes.data.hits;
      for(let image of images){
        webImages.push(new WebImage(
          "pixabay",
          filterDto.search,
          image.user,
          image.previewURL,
          image.webformatURL
        ));
      }
    }).catch((error) => {});
    return webImages
  }
}
