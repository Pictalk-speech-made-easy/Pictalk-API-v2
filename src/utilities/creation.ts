export const verifySameLength = (language, meaning, speech) => {
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