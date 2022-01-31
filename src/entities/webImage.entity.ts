export class WebImage{
    source : string;
    title : string;
    author : string;
    thumbnail : string;
    download : string;

    constructor(source : string, title : string, author : string, thumbnail : string, download : string){
        this.source = source;
        this.title = title;
        this.author = author;
        this.thumbnail = thumbnail;
        this.download = download;
    }
}