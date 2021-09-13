#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */
/* jshint strict: false */
/*jshint esversion: 8 */
const { random } = require('./util.js');

module.exports = {

    brouilleCouleurHex: (couleur, brouille) => {
        let RGBCouleur = hexToRgb(couleur);
        RGBCouleur.r = brouilleCouleurRGB(RGBCouleur.r, brouille);
        RGBCouleur.g = brouilleCouleurRGB(RGBCouleur.g, brouille);
        RGBCouleur.b = brouilleCouleurRGB(RGBCouleur.b, brouille);
        return rgbToHex(RGBCouleur.r, RGBCouleur.g, RGBCouleur.b);
    },
    alea_couleur: () => {
        //0 à 16777215
        let alea = random(16777215).toString(16);
        alea = "0".repeat(6 - alea.length) + alea;
        return alea;
    },
    hexcolor_validator: (couleur_to_validate) => {
        return couleur_to_validate.search(regex);
    }

};

function IntToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + IntToHex(r) + IntToHex(g) + IntToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function brouilleCouleurRGB(c, brouille) {
    let new_c = c + parseInt(brouille / 2 - random(brouille));
    if (new_c < 0) new_c = -new_c;
    if (new_c > 255) new_c = 255 - (new_c - 255);
    return new_c;
}

const regex = new RegExp("#[0-9a-f]{6}", "i");