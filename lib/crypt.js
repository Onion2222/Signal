#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */

module.exports = {


    //FONCTION DE CRYPTAGE
    //CODE VIGENERE => ALPHABET ASCII de 32 à 125 (93 lettres) => ` remplacé par ~
    crypter: (text, clef) => { //ascii 33-126 (on evacue les * qui peuvent faire beugué le truc-> 35 mais osef)
        text = "\\CRYPTAGE VIGENERE\\:" + text;
        let new_text = "";
        let charCode = "";
        for (i = 0; i < text.length; i++) {
            //console.log((text.charCodeAt(i)-65+clef.charCodeAt(i%clef.length)-65)%26+65)
            charCode = String.fromCharCode((text.charCodeAt(i) - 32 + clef.charCodeAt(i % clef.length) - 32) % 93 + 32);
            if (charCode == "`") { //beug du ` => remplacer ` par ESPACE => diminuer alphabet
                charCode = "~";
            }
            new_text += charCode;
        }


        return new_text;
    },


    decrypter: (text, key) => {
        let new_text = "";
        let decodeChar = 0;

        let Lettre_code = "";
        let Lettre_clef = "";

        for (i = 0; i < text.length; i++) {

            //new_text+=String.fromCharCode((text.charCodeAt(i)-33+clef.charCodeAt(i%clef.length)-33)%93+33);
            Lettre_code = text.charCodeAt(i);
            Lettre_clef = key.charCodeAt(i % key.length);

            if (Lettre_code == 126) Lettre_code = 96; //beug du ' grecque ===>"~" vers "'"
            if (Lettre_clef == 126) Lettre_clef = 96; //beug du '

            decodeChar = (Lettre_code - 32) - (Lettre_clef - 32);

            if (decodeChar < 0) decodeChar += 93;

            new_text += String.fromCharCode(decodeChar + 32);

        }
        return new_text;
    }


};