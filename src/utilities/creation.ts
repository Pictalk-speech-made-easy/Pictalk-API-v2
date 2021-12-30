import { languagesRegex } from "./supported.languages";
import { getArrayIfNeeded } from "./tools";

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