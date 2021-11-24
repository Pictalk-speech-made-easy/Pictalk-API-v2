import { Controller, Get, Header, Param, Res } from '@nestjs/common';

@Controller('image')
export class ImageController {
    @Get('/:imgpath')
    @Header('Cache-Control', 'max-age=31536000')
    seeUploadedFile(@Param('imgpath') image, @Res() res) {
        return res.sendFile(image, { root: './files/image' });
    }
}
