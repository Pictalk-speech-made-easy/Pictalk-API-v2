export const verifySameLength = (language, meaning, speech) => {
    if(language.length === meaning.length && language.length === speech.length){
        return 1;
    }
    else {
        return 0;
    }
};