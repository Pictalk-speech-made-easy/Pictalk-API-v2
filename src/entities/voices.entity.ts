export class VoiceURI{

    voiceURI: string;
    pitch : number;
    rate : number;

    constructor(voiceURI: string, pitch : number, rate : number){
        this.voiceURI = voiceURI;
        this.pitch = pitch;
        this.rate = rate;
    }
}

export class Voice{
    device : string;
    voiceURI : VoiceURI;

    constructor(device : string, voiceURI : VoiceURI){
        this.device = device;
        this.voiceURI = voiceURI;
    }

    public Dict(): Map<string, VoiceURI>{
        let voice = new Map<string, VoiceURI>();
        voice.set(this.device, this.voiceURI);
        return voice;
       }
}

export class Languages {
   languages : Map<string, Map<string, VoiceURI>>
   constructor(){
       this.languages = new Map<string, Map<string, VoiceURI>>();
   }
    public add(language: string, voice: Voice) {
        if(this.languages.has(`${language}`)){
            if(this.languages.get(`${language}`).has(`${voice.device}`)){
                this.languages.get(`${language}`).delete(`${voice.device}`)    
            }
            this.languages.set(language, voice.Dict());
        } else {
            this.languages.set(language, voice.Dict());
        }
        return this.languages;
       }
    
}
