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
    },


    morse: (text) => {
        let morse = "";
        let ntext = text.toUpperCase();
        for (let i = 0; i < text.length; i++) {

            let convert = array_morse.find(element => element.lettre === ntext.charAt(i));
            if (convert) morse += convert.morse;

            morse += "   ";
        }
        return morse;
    },

    demorse: (morse) => {
        let result = "";
        let nmorse = morse.split(/\s\s\s/);
        let convert;
        for (let i = 0; i < nmorse.length; i++) {
            if (nmorse[i].length === 0) result += ' ';
            else {
                convert = array_morse.find(element => element.morse === nmorse[i].trim());
                if (convert) result += convert.lettre;
            }
        }
        return result;
    }


};



const array_morse = [
    { lettre: 'A', morse: "━ ━━━" },
    { lettre: 'B', morse: "━━━ ━ ━ ━" },
    { lettre: 'C', morse: "━━ ━ ━━ ━" },
    { lettre: 'D', morse: "━━━ ━ ━" },
    { lettre: 'E', morse: "━" },
    { lettre: 'F', morse: "━ ━ ━━━ ━" },
    { lettre: 'G', morse: "━━━ ━━━ ━" },
    { lettre: 'H', morse: "━ ━ ━ ━" },
    { lettre: 'I', morse: "━ ━" },
    { lettre: 'J', morse: "━ ━━━ ━━━ ━━━" },
    { lettre: 'K', morse: "━━━ ━ ━━━" },
    { lettre: 'L', morse: "━ ━━━ ━ ━" },
    { lettre: 'M', morse: "━━━ ━━━" },
    { lettre: 'N', morse: "━━━ ━" },
    { lettre: 'O', morse: "━━━ ━━━ ━━━" },
    { lettre: 'P', morse: "━ ━━━ ━━━ ━" },
    { lettre: 'Q', morse: "━━━ ━━━ ━ ━━━" },
    { lettre: 'R', morse: "━ ━━━ ━" },
    { lettre: 'S', morse: "━ ━ ━" },
    { lettre: 'T', morse: "━━━" },
    { lettre: 'U', morse: "━ ━ ━━━" },
    { lettre: 'V', morse: "━ ━ ━ ━━━" },
    { lettre: 'W', morse: "━ ━━━ ━━━" },
    { lettre: 'X', morse: "━━━ ━ ━ ━━━" },
    { lettre: 'Y', morse: "━━━ ━ ━━━ ━━━" },
    { lettre: 'Z', morse: "━━━ ━━━ ━ ━" },
    { lettre: '1', morse: "━ ━━━ ━━━ ━━━ ━━━" },
    { lettre: '2', morse: "━ ━ ━━━ ━━━ ━━━" },
    { lettre: '3', morse: "━ ━ ━ ━━━ ━━━" },
    { lettre: '4', morse: "━ ━ ━ ━ ━━━" },
    { lettre: '5', morse: "━ ━ ━ ━ ━" },
    { lettre: '6', morse: "━━━ ━ ━ ━ ━" },
    { lettre: '7', morse: "━━━ ━━━ ━ ━ ━" },
    { lettre: '8', morse: "━━━ ━━━ ━━━ ━ ━" },
    { lettre: '9', morse: "━━━ ━━━ ━━━ ━━━ ━" },
    { lettre: '0', morse: "━━━ ━━━ ━━━ ━━━ ━━━" },
    { lettre: ' ', morse: " " },

];

/* //test:
const { demorse, morse, crypter, decrypter } = require('./crypt.js');



function RandomString(length) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

function RandomMorse(length) {
    var result = [];
    var characters = '━ ';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}


string_test = "salut c'est onion";
console.log(string_test);
console.log(morse(string_test));
console.log(demorse(morse(string_test)));


//test
let morse_t;
let demorse_t;
let randomString_t;
let fail = 0;
let nb_test = 100;
for (j = 0; j < nb_test; j++) {

    randomString_t = RandomString(5 + Math.floor(Math.random() * 15)); //genere random string taille entre 0 et 1000
    morse_t = morse(randomString_t);
    demorse_t = demorse(morse_t);
    if (demorse_t.trim() != randomString_t.toUpperCase().trim()) {
        console.log("MORSE FAIL");
        console.log(randomString_t);
        console.log(demorse_t);
        console.log(morse_t);
        fail += 1;
    }
}
console.log("morse=>demorse: FAIL=" + fail + "/" + nb_test);
console.log("Test morse aléa: " + demorse(RandomMorse(5000)));


*/