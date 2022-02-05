import { HttpService } from '@nestjs/axios';
import {
  CacheInterceptor,
  Controller,
  Get,
  Header,
  Logger,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilterDto } from './dto/search.dto';
import { createClient } from 'pexels';
import { WebImage } from 'src/entities/webImage.entity';
import { AuthGuard } from '@nestjs/passport';
import { languageMapping } from 'src/utilities/supported.languages';
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
  private per_page_default = 10;
  @Get('/pictalk/:imgpath')
  @Header('Cache-Control', 'max-age=31536000')
  seeUploadedFile(@Param('imgpath') image, @Res() res) {
    this.logger.verbose(`Requesting image with path : ${image}`);
    return res.sendFile(image, { root: './files/' });
  }

  @Get('/web/')
  @UseGuards(AuthGuard())
  async searchImages(@Query(ValidationPipe) filterDto: FilterDto): Promise<WebImage[]> {
    let webImages : WebImage[]= [];
    let promises : Promise<any>[] = [];
    
    const flickrRes = lastValueFrom(this.httpService.get(this.generateLinks(filterDto, "flickr"))).then((flickrRes) => {
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
    }).catch((error) => {if(error.response.status ==429){this.logger.verbose("[ERR] FLICKR TOO MUCH REQUESTS");}});

    const unsplashRes = lastValueFrom(
    this.httpService.get(this.generateLinks(filterDto, "unsplash")),
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
    }).catch((error) => {if(error.response.status ==429){this.logger.verbose("[ERR] UNSPLASH TOO MUCH REQUESTS");}});

    const pexelsRes = client.photos.search({
      query: filterDto.search,
      size: "small",
      locale: languageMapping[`${filterDto.language}`],
      per_page: filterDto.perPage ? filterDto.perPage : this.per_page_default}).then(
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
    ).catch((error) => {if(error.response.status ==429){this.logger.verbose("[ERR] PEXELS TOO MUCH REQUESTS");}});

    const pixabayRes = lastValueFrom(this.httpService.get(this.generateLinks(filterDto, "pixabay"))
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
    }).catch((error) => {if(error.response.status ==429){this.logger.verbose("[ERR] PIXABAY TOO MUCH REQUESTS");}});
    promises.push(flickrRes);
    promises.push(unsplashRes);
    promises.push(pexelsRes);
    promises.push(pixabayRes);
    return Promise.allSettled(promises).then(()=>{return webImages});
  }

  generateLinks(filterDto: FilterDto, api: string): string{
    let perPage = filterDto.perPage ? filterDto.perPage : this.per_page_default;
    if(api === "flickr"){
      return `https://www.flickr.com/services/rest/?sort=relevance&lang=${filterDto.language}&method=flickr.photos.search&api_key=${this.flickrAPIKey}&text=${filterDto.search}&safe_search=true&per_page=${perPage}&format=json&nojsoncallback=1`
    } else if(api === "unsplash"){
      return `https://api.unsplash.com/search/photos?query=${filterDto.search}&content_filter=high&lang=${filterDto.language}&per_page=${perPage}&client_id=${this.unsplashAPIKey}`
    } else if(api === "pixabay"){
      return `https://pixabay.com/api/?q=${filterDto.search}&lang=${filterDto.language}&safesearch=true&key=${this.pixabayAPIKey}&per_page=${perPage}`
    }
    return null;
  }
}
