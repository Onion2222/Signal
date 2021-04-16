#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */
module.exports = {

    dateToStringReduit: (date) => {
        return "[" + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + ";" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]:";
    },

    random: (x) => {
        return Math.floor(Math.random() * Math.floor(x));
    },
    randomTF: (brouillage) => {
        //console.log((Math.random() * 100) + " <= " + brouillage)
        return ((Math.random() * 100) <= brouillage);
    },
    validator: (text, mots_interdits) => {
        let liste_mot_trouve = [];
        for (let mot of mots_interdits) {
            let regex = new RegExp(mot, "i");
            //console.log(text.search(regex));
            if (text.search(regex) != -1) liste_mot_trouve.push(mot);
        }
        return liste_mot_trouve;
    },


};