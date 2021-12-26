export const verifySameLength = (language: string[], meaning: string[], speech: string[]) => {
    try{
        if(language.length === meaning.length && language.length === speech.length){
            return 1;
        }
    }
    catch(error){
        if(language || meaning || speech){
            return 0;
        } else {
            return 1;
        }
        
    }
};

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