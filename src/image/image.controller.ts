import { Controller, Get, Header, Logger, Param, Res } from '@nestjs/common';

@Controller('image')
export class ImageController {
    private logger = new Logger('ImageController');
    @Get('/:imgpath')
    @Header('Cache-Control', 'max-age=31536000')
    seeUploadedFile(@Param('imgpath') image, @Res() res) {
        this.logger.verbose(`Requesting image with path : ${image}`);
        return res.sendFile(image, { root: './files/' });
    }
}
