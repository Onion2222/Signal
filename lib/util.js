#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */
const Discord = require('../node_modules/discord.js');



module.exports = {



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


    dif_log: async(titre, log_txt, channel, avatar, couleur = "#000000", MP = false, fichier = false) => {
        //log sur console

        let now = new Date();
        let embed_signal = new Discord.MessageEmbed()
            .setTimestamp()
            .setColor(couleur)
            .setAuthor(titre, avatar); //client.user.avatarURL()


        embed_signal.setDescription(log_txt);
        /*if(!url) embed_signal.setDescription(log_txt);
        else embed_signal.setDescription(log_txt+"[Lien]("+url+")");*/

        embed_signal.setFooter("LOG");

        log_txt = dateToStringReduit(now) + titre + "\\" + log_txt;

        console.log(log_txt);

        //log dans fichier (fonction pour suppr ?)

        if (fichier) {
            fs.appendFile(fichier, log_txt, function(err) {
                if (err) return console.log(err);
                //console.log("*"); //Log enregistre*\n");
            });
        }

        //if (config.MP_admin) client.users.cache.get(config.ID_admin).send(embed_signal);
        if (MP) MP.send(embed_signal);
        //log dans chan
        //if (Channel_log != undefined) Channel_log.send(embed_signal);
        if (channel) channel.send(embed_signal);

    },
    get_usernames: (member, tag = false, nickname = true, mention = false) => {
        let usernames = "**";
        if (tag) usernames += member.user.tag;
        if (nickname) {
            if (member.nickname) {
                if (tag) usernames += "|";
                usernames += member.nickname;
            }
        }
        if (mention) usernames += " [<@" + member.user.id + ">]";
        return usernames + "**";
    },
    get_corres_listeID_nom: (listeID, guild = false) => {
        let configuration = require("../data/conf_signal.json");
        let liste_nom = [];

        for (let index = 0; index < listeID.length; index++) {
            liste_nom.push(get_corres_ID_nom(listeID[index], configuration, guild));
        }
        return liste_nom;
    }

};

function get_corres_ID_nom(ID, configuration, guild = undefined) {
    let result = "";
    //a faire si ne trouve pas =>
    result = configuration.frequence.freq.find(frequence => frequence.ID == ID).nom;
    if (guild) {
        if (result) result += "|";
        result += guild.channels.cache.find(voice_chan => voice_chan.id === ID).name;
    } else {
        if (!result)
            return ID;
    }
    return result;
}




function dateToStringReduit(date) {
    return "[" + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + ";" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]:";
}