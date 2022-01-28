import { getArrayIfNeeded } from "src/utilities/tools";

export class VoiceURI{

    device : string
    voiceURI: string;
    pitch : number;
    speed : number;

    constructor(device: string, voiceURI: string, pitch : number, speed : number){
        this.device = device;
        this.voiceURI = voiceURI;
        this.pitch = pitch;
        this.speed = speed;
    }

   public Dict() {
    let Dict = new Map<string, Object>();
    Dict.set(this.device, {voiceURI: this.voiceURI, pitch: this.pitch, speed: this.speed})
    return Dict;
   }
}

export class Voice {
   voice : Map<string, VoiceURI[]>
    public Dict(language: string, voiceURI : VoiceURI) {
        if(this.voice.has(`${language}`)){
            let voiceURIs = this.voice.get(`${language}`)
            
                } else {
            this.voice.set(language, getArrayIfNeeded(voiceURI));
        }
        return this.voice;
       }
}

"""{\""fr\"":{\""UNIX108019201\"":{\""voiceURI\"":\""urn:moz-tts:speechd:French%20(Belgium)?fr\"",\""pitch\"":\""\""}}}"""