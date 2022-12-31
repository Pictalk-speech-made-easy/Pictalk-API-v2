import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { Languages, Voice, VoiceURI } from "src/entities/voices.entity";
import { languagesRegex } from "./supported.languages";
import { getArrayIfNeeded } from "./tools";

export const usernameRegexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

export const IsValid = (meaning: any, speech : any) => {
    try {
        meaning = JSON.parse(meaning);
        speech = JSON.parse(speech);
        const meaningkeys=getArrayIfNeeded(Object.keys(meaning));
        const speechkeys=getArrayIfNeeded (Object.keys(speech));
        if(meaningkeys.length === speechkeys.length){
            for(let index=0; index<meaningkeys.length; index++){
                if(!(languagesRegex.test(meaningkeys[index]))||!(languagesRegex.test(speechkeys[index]))){
                    return false
                }
            }
            return true;
        } else {
            return false;
        }
    } catch(error){
        if(meaning === undefined && speech === undefined){
            return true 
        } else {
            return false;
        }
    }
}

export const verifyAPIs = (apinames: string[], apikeys: string[]) => {
    try{
        if(apinames.length === apikeys.length){
            return 1;
        }
    }
    catch(error){
        if(apinames || apikeys){
            return 0;
        } else {
            return 1;
        }
        
    }
};

export const validLanguage = (language : string) => {
    try{
        let languages = new Languages();
        const languageDict = JSON.parse(language);
        const langKeys = Object.keys(languageDict);
        langKeys.map(langKey => {
            const deviceKeys = Object.keys(languageDict[`${langKey}`]);
            deviceKeys.map(deviceKey => {
                const voiceKeys = Object.keys(languageDict[`${langKey}`][`${deviceKey}`]);
                if(voiceKeys.indexOf('voiceURI')==-1){
                    throw new BadRequestException('there is no voiceURI key');
                }
                let pitch = languageDict[`${langKey}`][`${deviceKey}`]['pitch'];
                let rate = languageDict[`${langKey}`][`${deviceKey}`]['rate'];
                const URI = languageDict[`${langKey}`][`${deviceKey}`]['voiceURI'];
                pitch = pitch && !isNaN(pitch) ? pitch: 1
                rate = rate && !isNaN(rate) ? rate: 1
                const voiceURI = new VoiceURI(URI, pitch, rate);
                const voice = new Voice(deviceKey, voiceURI);
                languages.add(langKey, voice);
            });
        });
        return languages.languages;
    } catch(error){
        throw new InternalServerErrorException(`couldn't parse languages`);
    }
}
// not mine but gets the job done, flemme de renommer variable !
export const stringifyMap = (myMap) => {
    function selfIterator(map) {
        return Array.from(map).reduce((acc, [key, value]) => {
            if (value instanceof Map) {
                acc[key] = selfIterator(value);
            } else {
                acc[key] = value;
            }

            return acc;
        }, {})
    }

    const res = selfIterator(myMap)
    return JSON.stringify(res);
}

export const defaultSettings = JSON.stringify({pronounceClick: true, securityMode: true, returnWithoutRemove: false, travelMode: false});

export function generateAvatar(text, foregroundColor, backgroundColor) {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(200, 200);
    const context = canvas.getContext("2d");

    canvas.width = 200;
    canvas.height = 200;

    // Draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.font = "bold 100px Assistant";
    context.fillStyle = foregroundColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toBuffer('image/png');
}

export function generateRandomColor(){
    let maxVal: any = 0xFFFFFF; // 16777215
    let randomNumber: any = Math.random() * maxVal; 
    randomNumber = Math.floor(randomNumber);
    randomNumber = randomNumber.toString(16);
    let randColor = randomNumber.padStart(6, 0);   
    return `#${randColor.toUpperCase()}`
}
