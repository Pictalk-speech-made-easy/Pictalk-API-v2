import { languagesRegex } from "./supported.languages";

export const verifySameLength = (meaning: any, speech : any) => {
    if(meaning.length == undefined && speech.length == undefined){
        return true;
    } else if(meaning.length === speech.length){
        return true;
    } else {
        return false;
    }
};

export const verifyText = (meaning: any, speech : any) => {
    if(speech.length!= undefined){
        for(var i=0; i<speech.length; i++){
            if(validate(speech[i])===false){
                return false;
            }
        }
    } else {
        if(!validate(speech)){
            return false;
        }
    }
    if(meaning.length!= undefined){
        for(i=0; i<meaning.length; i++){
            if(validate(meaning[i])===false){
                return false;
            }
        }
    } else {
        if(!validate(meaning)){
            return false;
        }
    }
    return true;
}

const validate = (object : any) => {
    if(object.language==undefined || object.text == undefined){
        return false;
    } else if(!languagesRegex.test(object.language )){
    }
    return true;
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