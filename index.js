#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */

console.log("=====================================================");
console.log("================BOT DISCORD PAR ONION================");
console.log("================     S.I.G.N.A.L     ================");
console.log("=====================================================");

//lib
const Discord = require('discord.js');
const mysql = require('mysql');
const fs = require("fs");
const request = require(`request`);
const cron_validator = require('cron-validator');

const { AudioEventsManager } = require('./lib/event_audio.js');

const { crypter, decrypter } = require('./lib/crypt.js');

const { brouilleCouleurHex, alea_couleur, hexcolor_validator } = require('./lib/couleur.js');
const { cleanup } = require('./lib/cleanup.js');
const { maj, stopmaj, stopmaj_f, mise_en_route } = require('./lib/event.js');
const { dif_log, get_corres_listeID_nom, get_usernames, random, randomTF, validator } = require('./lib/util.js');

const config = require("./data/conf_bot.json");
const string_message = require("./data/string_message.json");


console.log("VERSION " + config.version);

const client = new Discord.Client();

let configuration = {};

const appel = "$";

//var msg_count=0;

let Channel_log;
let Channel_radio;
let nom_serveur;
let admin;

let audioEventsMan;

//sql
const db = mysql.createPool({
    host: config.Serveur_SQL.host,
    user: config.Serveur_SQL.user,
    password: config.Serveur_SQL.password,
    database: config.Serveur_SQL.database
});

//const CLEF_PROG = "clefdeprog";

//creation du client
client.login(config.TOKEN);
//debug
client.on('debug', data_debug => {
    if (config.debug) console.log(new Date() + "  " + data_debug);
});
//erreur
client.on('error', err => dif_log_simple("⚠️ Erreur !", "ERREUR client" + err[0], "#FF300F"));

//init du bot
client.on('ready', () => {

    console.log(`Connecté !\nNom:${client.user.tag}`);
    client.user.setActivity(`capter (${appel.toString()}aide / ${appel.toString()}aidefreq )`);
    console.log("=> Le bot Signal vient d'être lancé");
    console.log(`Connecté !\nNom:${client.user.tag} client:${client.users.cache.size} channels:${client.channels.cache.size} serveur:${client.guilds.cache.size}`);

    admin = client.users.cache.get(config.ID_admin); //erreur si trouve pas ??? A FAIRE
    //acq chan log & radio
    Channel_log = client.channels.cache.get(config.ID_log);
    if (!Channel_log) { //si cnnal log innaccessible
        console.error("Channel " + config.ID_log + " non existant !\nIl n'y aura donc pas de log et d'acces aux commandes ADMIN");
        console.log("Passage en mode debug admin");
        config.MP_admin = true; //forçage MP ADMIN
        dif_log("⚠️ MODE DEBUG ADMIN ⚠️", "Canal de log innaccessible !", undefined, client.user.avatarURL(), "#0000FF", admin);
    }

    dif_log("⚠️ DEMARRAGE SIGNAL ⚠️", "Le bot vient de redemarrer.\nSi ce n'était pas prévu, contactez l'administrateur du bot !", Channel_log, client.user.avatarURL(), "#FF0000", admin);

    //application de la configuration
    dif_log("⚠️ ETAT", "Reconfiguration de signal...", Channel_log, client.user.avatarURL(), "#0000FF", admin);
    try {
        configuration = JSON.parse(fs.readFileSync('./data/conf_signal.json', 'utf8'));
        dif_log("⚠️ ETAT", "Configuration précedente trouvée !", Channel_log, client.user.avatarURL(), "#00FF00", admin);

    } catch (e) {
        dif_log("⚠️ ETAT", "__PARAMETRES INACCESSIBLE__ (voir terminal)\n Contactez Onion ! @everyone\nLe bot se termine sur une erreur...", Channel_log, client.user.avatarURL(), "#FF0000", admin);
        console.error(e);
        process.exit(0);
    }

    //demarrage audioevents
    audioEventsMan = new AudioEventsManager('./data/event_audio.json', client, Channel_log);


    nom_serveur = client.guilds.cache.get(config.ID_serveur).name;


    //connexion SQL
    db.getConnection(function(err) {
        if (err) {
            dif_log("⚠️ ETAT", "⚠️⚠️ Connection au server MySQL " + config.Serveur_SQL.host + " impossible !!⚠️⚠️", Channel_log, client.user.avatarURL(), "#FF0000", admin);
            console.log(err);
        } else dif_log("⚠️ ETAT", "Connection au server MySQL " + config.Serveur_SQL.host + " réussie", Channel_log, client.user.avatarURL(), "#00FF00", admin);
    });


    //recuperation chan radio
    Channel_radio = client.channels.cache.get(config.ID_radio);
    if (!Channel_radio) { //si pas de chan radio
        console.error("Channel " + config.ID_radio + " non existant !\nIl n'y a pas de channel radio, signal va donc se terminer...");
        dif_log("⚠️ ETAT", "⚠️⚠️ Channel radio inaccessible, signal va donc se terminer ⚠️⚠️", Channel_log, client.user.avatarURL(), "#FF0000", admin);
        process.exit(0);
    }

    //en cas de crash nettoyer les messages
    cleanup(Channel_radio, parseInt(configuration.duree_messsage));

    //Simulation d'écriture relancer toutes les heures sinon beug
    try {
        Channel_radio.startTyping();
    } catch (error) {
        Error(81, error);
    }

    //typing toutes les heures
    setInterval(function() {
        try {
            Channel_radio.startTyping();
        } catch (error) {
            Error(80, error);
        }
    }, 360000);

});


function dif_log_simple(titre, texte, couleur) {
    if (!config.MP_admin) dif_log(titre, texte, Channel_log, client.user.avatarURL(), couleur);
    else dif_log(titre, texte, Channel_log, client.user.avatarURL(), couleur, admin);
}




//quand le bot voit un message
client.on('message', async msg => {


    if (msg.author.bot) return; //si bot 
    if (msg.type !== 'DEFAULT') return; // si pas message "normal"

    if (msg.channel.id == config.ID_radio) msg.delete(); //suppr message directement si ecrit dans channel roleplay
    if (msg.channel.id != config.ID_radio & msg.channel.type != "dm" & msg.channel.id != config.ID_log & msg.content != "$help" & msg.content != "$hrp") return; //si pas RP/test et pas MP alors on s'en fout et pas help

    if (!configuration.actif & (msg.channel.id != config.ID_log & msg.author.id !== config.ID_admin)) { //commande $actif (desactivable depuis log ou Admin)
        msg.author.send("ERREUR!\nSignal est actuellement indisponible !");
        return;
    }

    //verifier si auteur est authentifié
    let member = await client.guilds.cache.get(config.ID_serveur).members.fetch(msg.author).catch(error => Error(100, error));
    //console.log(member.roles.size);

    //alerte intrusion
    if (member.roles.size <= 1 & msg.author.id !== config.ID_admin) { //permission @everyone ou nulle ET pas channel candidature et pas admin => alerte modo
        let log = "\nIntrusion du systeme signal par une personne non autorisée\n";
        log += "Auteur:" + msg.author.username + "\nChannel:" + msg.channel.name + "\nContenu:" + msg.cleanContent;
        dif_log("⚠️ Intrusion !", log, Channel_log, member.user.avatarURL(), "#e000ff");
        return;
    }

    //reach user
    //json:
    //let liste_utilisateur = JSON.parse(fs.readFileSync('utilisateur.json', 'utf8'));
    //resultat = inventaire.find( fruit => fruit.nom === 'cerises');
    //let utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === msg.author.id); //trouver l'utilisateur qui à ce role
    //mysql
    let result_query = await query_db("SELECT * FROM users WHERE  ID=\"" + msg.author.id + "\"");

    let utilisateur = result_query[0];

    //si l'utilisateur n'existe pas, le créer
    if (utilisateur == undefined) {
        //dif_log_simple("Nouvel utilisateur", "Utilisateur : " + msg.author.username, "#00FF00");
        dif_log("Nouvel utilisateur", "Utilisateur : " + get_usernames(member, true, true, false), Channel_log, member.user.avatarURL(), "#00FF00");

        utilisateur = {};
        utilisateur.ID = msg.author.id;
        utilisateur.COULEUR = alea_couleur();
        utilisateur.bloque = false;

        //console.log(utilisateur);

        //fichier:
        //liste_utilisateur.Utilisateurs.push(utilisateur);
        //fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));
        //mysql
        query_db("INSERT INTO users (`ID`, `COULEUR`, `bloque`) VALUES (\'" + utilisateur.ID + "\',\'" + utilisateur.COULEUR + "\'," + utilisateur.bloque + ")");
        //message premiere utilisation
        msg.author.send(string_message.accueil); //message d'accueil
    } else {
        if (utilisateur.bloque & msg.author.id != config.ID_admin) {
            msg.author.send(string_message.bloque); //message bloqué
            dif_log("Utilisateur banni !", get_usernames(member, true, true, true) + " a tenté d'envoyer:\n`" + msg.content + "`", Channel_log, member.user.avatarURL(), "#9e0101");
            return;
        }
    }




    //envoie message RP
    if (msg.content.indexOf(appel) !== 0) { //si ne commence pas par le caractere d'appel

        if (msg.channel.id == config.ID_radio | msg.channel.type !== "text") { //si poste dans channel roleplay ou en pm sans caractere d'appel
            if (configuration.taille_max_msg === 0) { //si sur serveru avec limitation caractere
                if (msg.content.length > 1500) {
                    msg.author.send(string_message.troplong);
                    Send_Message(msg, msg.content.slice(0, msg.content.length / 2) + "....", utilisateur, member, false);
                    Send_Message(msg, "...." + msg.content.slice(msg.content.length / 2, msg.content.length), utilisateur, member, false);
                } else {
                    Send_Message(msg, msg.content, utilisateur, member, false);
                }
            } else { //si limitation
                if (msg.content.length > configuration.taille_max_msg) {
                    msg.author.send(string_message.troplong_limiteadmin.replace("%LIMITE%", configuration.taille_max_msg.toString()));
                } else {
                    Send_Message(msg, msg.content, utilisateur, member, false);
                }
            }
        }
        return;
    }




    //mise en ordre des arguments/commande
    const args = msg.content.slice(appel.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    //ICI TAPER COMMANDE
    //dif_log(member.nickname + " | " + msg.author.username, "```" + msg.cleanContent + "```");


    //commande chan vocal
    if (command == "freq" & msg.channel.type !== "text") {
        //console.log(member.voiceChannel);
        let freq_togo;
        if (!member.voice.channelID) {
            msg.react("📞");
            msg.react("❌");
            msg.author.send(string_message.freq.notconnected);
            return;
        } else if (args[0] == "off") {
            msg.react("🔇");
            member.setVoiceChannel(null);
            msg.react("✅");
            return;
        } else if (args[0] == "on") {
            msg.react("💡");
            freq_togo = configuration.frequence.freq[random(configuration.frequence.freq.length)];
        } else if (args[0] == "+" | args[0] == "-") {
            let index_chan = configuration.frequence.freq.findIndex(freq => freq.ID == member.voice.channelID);
            if (index_chan == -1) {
                msg.react("🛑");
                msg.react("❌");
                msg.author.send(string_message.freq.notpublic);
                return;
            }
            if (args[0] == "+") {
                index_chan = (index_chan + 1) % configuration.frequence.freq.length;
                msg.react("⏩");
            } else if (args[0] == "-") {
                if (index_chan == 0) index_chan = configuration.frequence.freq.length - 1;
                else index_chan = (index_chan - 1) % configuration.frequence.freq.length;
                msg.react("⏪");
            }
            freq_togo = configuration.frequence.freq[index_chan];
        } else {
            freq_togo = configuration.frequence.freq.find(chan => chan.nom === args[0]);
            if (!freq_togo) {
                freq_togo = configuration.frequence.TACSAT.find(chan => chan.nom === args[0]);
                if (!freq_togo) {
                    msg.react("❓");
                    msg.react("❌");
                    msg.author.send(string_message.freq.unknow);
                    return;
                }
                if (args[1] != freq_togo.mdp) {
                    msg.react("🔒");
                    msg.react("❌");
                    msg.author.send(string_message.freq.locked);
                    return;
                } else {
                    msg.react("🔓");
                    msg.author.send(string_message.freq.unlocked);

                }
            } else {
                msg.react("📡");
            }
        }
        msg.react("✅");
        member.edit({ channel: freq_togo.ID });
        //log
        dif_log("🔊 Acces Vocal", get_usernames(member, true, true, false) + " vient d'acceder au channel " + freq_togo.nom, Channel_log, member.user.avatarURL(), "00ecff");
        return;
    }


    if (command == "listefreq") {
        dif_log("Demande de la liste des fréquences", "Utilisateur : " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#00ff55");
        send_liste_freq(msg.author);
        return;
    }
    if (command == "aidefreq") {
        dif_log("Demande d'aide pour les fréquences", "Utilisateur : " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#00ff55");
        send_aide_freq(msg.author);
        send_liste_freq(msg.author);
        return;
    }

    /*
    if (command === "hrp") {
        dif_log("HRP", "Utilisateur : " + msg.author.username);
        msg.channel.send("Attention, ce que tu viens de demander/dire semble HRP !\nSi tu souhaites parler de manière RP, je t'invite à m'envoyer un message privé qui sera retransmis __directement__ et __anonymement__ sur le channel <#" + Channel_radio.id + ">\n(`$help` pour plus d'information)");
        msg.delete();
        return;
    }*/

    if (command === "ping") {
        dif_log("Ping", "Utilisateur : " + get_usernames(member, true, true, false), Channel_log, member.user.avatarURL(), "#000000");
        msg.reply(string_message.ping);
        return;
    }

    if (command === "help" | command === "aide") {
        dif_log("Demande d'aide", "Utilisateur : " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#00ff55");
        //https://paypal.me/pools/c/8mowOxex8i
        embed_aide(msg.author);

        if (msg.channel.type === "text") {
            msg.channel.send(new Discord.MessageEmbed()
                .setTitle(string_message.help.help)
                .setDescription(string_message.help.mp)
                .setColor('#1cfc03')
                .setTimestamp()
                .setAuthor("Signal", client.user.avatarURL())
            ).then(m => m.delete({ timeout: 4000 }));
        }
        return;
    }

    if (command === "aidecouleur") {
        dif_log("Demande d'aide couleur", "Utilisateur : " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#00ff55");

        let embed = new Discord.MessageEmbed();
        embed.setTitle("__**SIGNAL**__");
        embed.setColor(16312092);
        embed.setTimestamp();
        embed.setFooter(string_message.help.footer + nom_serveur);
        //embed.setThumbnail(client.user.avatarURL());
        embed.setDescription(string_message.help.color.description);
        embed.addField(string_message.help.color.getcode.name, string_message.help.color.getcode.value);
        embed.addField(string_message.help.color.knowcolor.name, string_message.help.color.knowcolor.value);
        embed.addField(string_message.help.color.random.name, string_message.help.color.random.value);
        embed.addField(string_message.help.note.name, string_message.help.note.value);

        /*
        const embed = {
            "title": "__**SIGNAL**__",
            "description": "Bienvenue dans l'aide couleur du bot Signal\nPour modifier la couleur des messages, il faut taper ```$couleur``` suivit du code hexadecimal de la couleur de ton choix\nExemple:```$couleur #ff33da```coloriera votre message en **rose**",
            "color": 16312092,
            "timestamp": new Date(),
            "footer": {
                "icon_url": client.user.avatarURL(),
                "text": "Par Onion² pour " + nom_serveur
            },
            "thumbnail": {
                "url": client.user.avatarURL()
            },
            "fields": [{
                "name": "Obtenir le code hexa d'une couleur",
                "value": "https://htmlcolorcodes.com/fr/ , copiez le 1er nombre à droite (ex: #33f3ff)"
            }, {
                "name": "Connaitre sa couleur",
                "value": "Pour connaitre sa couleur, tapez ```$macouleur```"
            }, {
                "name": "Couleur aléatoire",
                "value": "Vous pouvez obtenir une couleur aléatoire en tapant simplement ```$couleur```"
            }]
        };
        */



        msg.author.send({ embed });
        if (msg.channel.type === "text") {
            msg.channel.send(new Discord.MessageEmbed()
                .setTitle(string_message.help.help)
                .setDescription(string_message.help.mp)
                .setColor('#1cfc03')
                .setTimestamp()
                .setAuthor("Signal", client.user.avatarURL())
            ).then(m => m.delete({ timeout: 4000 }));
        }
        return;
    }

    if (command === "del") {
        if (utilisateur.DERMSG == undefined) {
            msg.author.send(string_message.delnomsg);
            return;
        }
        //let Channel_radio = client.channels.get(config.ID_radio);
        Channel_radio.messages.fetch(utilisateur.DERMSG).then(message_sup => {
            message_sup.delete();

            dif_log("Supression", "=>Suppression demandée du dernier message de " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#ff0061");

            msg.author.send(string_message.deleted);
            if (msg.channel.type === "dm") {
                msg.react("✅");
                msg.react("♻️");
            }
        }).catch(err => {
            msg.author.send(string_message.alreadydeleted);
            if (msg.channel.type === "dm") msg.react("🚫");
        });
        return;
    }

    //console.log(msg.channel.type); definie la type :> dm si message prive / text si channel textuel

    if (command === 'crypt') {

        if (msg.channel.type === "text") msg.delete(); //si dans chan textuel

        if (configuration.cryptage) {
            let clef = args[0];
            let content = msg.content.slice(appel.length + "crypt ".length + clef.length + 1);
            //console.log(content);
            Send_Message(msg, content, utilisateur, member, true, clef);
        } else {
            dif_log("Cryptage bloqué", "Utilisateur : " + get_usernames(member, true, true, false), Channel_log, member.user.avatarURL(), "#d1ff00");
            msg.author.send(string_message.blockcrypt.replace("%NAMESERV%", nom_serveur).replace("%MSG%", msg.cleanContent)); //"Le cryptage est actuellement interdit sur le canal transmission. (voir avec les administrateurs de " + nom_serveur + ")\n```" + msg.cleanContent + "```"
        }
        return;
    }

    if (command === "decrypt") {
        if (msg.channel.type === "text") msg.delete(); //si dans chan textuel
        if (args.length > 1) {
            let key = args[0];
            let text = msg.content.slice(appel.length + "decrypt ".length + key.length + 1);
            new_text = decrypter(text, key);
            //console.log(new_text);
            //new_text = decrypter(new_text, CLEF_PROG);

            dif_log("Décryptage", "Tentative de decryptage de " + get_usernames(member, true, true, false) + "\nMessage crypté: " + text + "\nClef: " + key + "\nResultat: " + new_text, Channel_log, member.user.avatarURL(), "#d1ff00");

            msg.author.send("Message décodé 🔐 :\n" + "```" + new_text + "```");
            if (msg.channel.type !== "text") {
                msg.react("🔐");
            } else {
                //msg.author.send("🔐");
                msg.author.send(string_message.keyshared);
            }
        } else {
            if (msg.channel.type !== "text") { msg.react("🚫"); } else { msg.author.send("🚫"); }
            msg.author.send(string_message.decrypt_error);
            msg.author.send("```" + msg.content + "```");
        }
        return;
    }

    if (command === 'couleur') {
        //#a85a32
        dif_log("Couleur", "Changement de couleur demandé par l'utilisateur " + get_usernames(member, true, true, true) + "\nMessage: `" + msg.content + "`", Channel_log, member.user.avatarURL(), "#4dff00");
        if (configuration.changement_couleur) {
            if (args[0] == undefined) {
                msg.author.send(string_message.color.noarg);
                args[0] = alea_couleur();
            } else {
                if (hexcolor_validator(args[0]) != 0) {
                    msg.author.send(string_message.color.wrongarg);
                    return;
                } else {
                    //bon
                    args[0] = args[0].replace("#", "");
                }
            }
            try {
                let embed = new Discord.MessageEmbed().setColor(args[0])
                    .setTitle(string_message.color.result + args[0])
                    .addField(string_message.color.previous + utilisateur.COULEUR, "🎨");
                msg.author.send(embed);
            } catch (error) {
                msg.author.send(string_message.color.wrongarg);
                return;
            }
            //ecrire couleur dans utilisateur
            utilisateur.COULEUR = args[0];
            //json:
            //update_user(msg.author.id, utilisateur);
            //mysql
            query_db("UPDATE users SET COULEUR = \"" + utilisateur.COULEUR + "\" WHERE ID=\"" + msg.author.id + "\"");
            return;
        } else {
            dif_log("Couleur", "Demande changement de " + get_usernames(member, true, true, true) + " couleur de bloqué !", Channel_log, member.user.avatarURL(), "#4dff00");
            msg.author.send(string_message.color.blocked);
            msg.author.send("```$demandechangementcouleur \nCouleur: [#000000 ou RANDOM]\nMotivation: [Pourquoi vous souhaitez changer de couleur]```");
            return;
        }
    }
    //demande de changement de couleur si activé
    if (msg.content.indexOf("demandechangementcouleur") == 1 & !configuration.changement_couleur) {


        let ligne = msg.content.split("\n");
        if (ligne.length == 1) {
            dif_log("Couleur", "Demande aide formulaire couleur par l'utilisateur " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#4dff00");
            msg.author.send(string_message.color.blocked);
            msg.author.send("```$demandechangementcouleur \nCouleur: [#000000 ou RANDOM]\nMotivation: [Pourquoi vous souhaitez changer de couleur]```");
            return;
        }

        dif_log_simple("DEBUG Couleur", "Demande changment de couleur" + get_usernames(member, true, true, true) + "\nFormulaire:\n" + msg.cleanContent, "#4dff00");
        //si nombre de ligne ok
        if (ligne.length < 3) {
            msg.react("❌");
            msg.author.send(string_message.color.askchgt.wrongformat);
            return;
        }

        //taille motivation ?
        if (ligne[2].indexOf("Motivation:") != 0) {
            msg.react("❌");
            msg.author.send(string_message.color.askchgt.wrongformat + "\n`\"Motivation:\" non trouvé`");
            return;
        }
        if (ligne[2].length < 11 + 20) { //11 offset
            msg.react("❌");
            msg.author.send(string_message.color.askchgt.toshort + "\n`taille motivation < 20`");
            return;
        }
        if (ligne[2].length > 1000) { //11 offset
            msg.react("❌");
            msg.author.send(string_message.color.askchgt.tolong + "\n`taille motivation >1000`");
            return;
        }

        //test couleur
        ligne[1] = ligne[1].replace('[', '').replace(']', '');
        let arg_couleur = ligne[1].split(" ").filter(function(i) { return i; }); //separer la ligne, couleur forcement à index 1 et le filtre enleve les elements vide dû aux ajouts d'espace apres
        //console.log(arg_couleur);
        if (arg_couleur.length != 2 | arg_couleur[0] != "Couleur:") {
            msg.author.send(string_message.color.askchgt.wrongformat + "\n`\"Couleur:\" non trouvé`");
            return;
        }
        if (arg_couleur[1] != "RANDOM" & hexcolor_validator(arg_couleur[1]) == -1) {
            msg.react("❌");
            msg.author.send(string_message.color.askchgt.wrongcolor);
            return;
        }


        let embed = new Discord.MessageEmbed().setColor("#86F67E").setTitle(`Demande de changement de couleur`);
        embed.setDescription(`L'utilisateur **${get_usernames(member, true, true, true)}** demande un changement de couleur`);
        embed.addField(`Motivation:`, `\`\`\`${ligne[2].slice(11).trim()}\`\`\``);
        embed.addField(`Couleur voulue:`, `\`\`\`${arg_couleur[1]}\`\`\``); //bien couper ou il y a la couleur
        embed.addField(`Commande pour valider ce changement:`, `\`\`\`$validechgtcouleur ${msg.author.id} ${arg_couleur[1]}\`\`\``);
        embed.setFooter(get_usernames(member, true, true, false), member.user.avatarURL());
        if (Channel_log) Channel_log.send({ content: "@here", embed: embed });
        else admin.send({ content: "@here", embed: embed });
        msg.react("✅");
        msg.author.send(string_message.color.askchgt.sent);
        return;
    }

    if (command === 'macouleur') {
        dif_log("Couleur", "Interrogation couleur par l'utilisateur " + get_usernames(member, true, true, false), Channel_log, member.user.avatarURL(), "#4dff00");
        let embed = new Discord.MessageEmbed().setColor(utilisateur.COULEUR)
            .setTitle(string_message.color.yourcolor + utilisateur.COULEUR);
        msg.author.send(embed);
        return;
    }

    if (command == "credit") {
        dif_log("Crédit", "Demande credit par l'utilisateur " + get_usernames(member, true, true, true), Channel_log, member.user.avatarURL(), "#3b2e2e");
        let embed_credit = new Discord.MessageEmbed()
            .setColor(16312092)
            .setTimestamp()
            .setTitle("Programme par Onion² (AP)")
            .setDescription("\nContacte: onion#3562\nProgrammé avec discord.js\nSignal est sous la license CC BY-NC-ND")
            .setImage("https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-nc-nd.eu.png");
        msg.channel.send(embed_credit);
        return;
    }

    //commande ADMIN = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
    if (msg.channel.id == config.ID_log | msg.author.id == config.ID_admin) {

        if (command == "helpadmin") {
            let embed_signal = new Discord.MessageEmbed()
                .setColor(1)
                .setTimestamp()
                .setTitle("Aide admin")
                .setDescription("Commande uniquement utilisable sur ce channel\n*Il vaut mieux demander à Onion avant de faire n'importe quoi*")
                .addField("$log", "Envoie le fichier de log")
                .addField("$etat", "Affiche l'état du réseau signal")
                .addField("$actif", "Active ou desactive signal")
                .addField("$anonyme", "Anonymise ou n'anonymise pas les messages")
                .addField("$coloration", "Impose les Jaune ou laisse les couleurs personnalisées")
                .addField("$fichier", "Active/desactive l'envoie de fichier (hors audio)")
                .addField("$audio", "Active/desactive l'envoie de fichier audio")
                .addField("$cleanup", "Supprime ou re-ordonne la supression future des messages qui n'ont pas été supprimé dans les temps")
                .addField("$admin", "Permet de diffuser un message d'administrateur")
                .addField("$setbrouillage X >BLABLA image", "Modifie le brouillage\nX: X% de carracteres brouillés (defaut: 0, pas de brouillage)\n BLABLA: raison du brouillage (optionnel)\nimage: petite image (optionnel)\nDifferents niveaux: [;25[,[25;15[,[15;7[,[7;1]")
                .addField("$setbrouillageespace X ", "Modifie la chance d'avoir des \"krssssh\"\nX: X% d'espaces transformés")
                .addField("$setbrouillagecouleur X ", "Pour le brouillage des couleurs... Je sais pas expliquer, mais 80 donne +/-40 /255 de brouillage RGB (je sais c'est pas claire)")
                .addField("$ban X / $deban X / $listeban", "Ban/Deban quelqu'un de signal\nX: mention ou ID de l'utilisateur à bannir")
                .addField("$delaidel X", "Modifie la durée des message\nX: durée en ms")
                .addField("$cryptage", "Active ou desactive la commande $crypt")
                .addField("$addmotinterdit MOT / $listemotinterdit", "Ajoute un regex interdit à la liste / Affiche la liste")
                .addField("$listefreqmdp", "Affiche la liste des fréquence avec leur ID et leur mdp")
                .addField("$addfreqprivée nom mdp ID", "Ajoute une frequence privé")
                .addField("$addfreq nom ID", "Ajoute une frequence publique")
                .addField("$delfreq nom (ou ID)", "Supprime la frequence")
                .addField("$changemdpfreq nom (ou ID) mdp", "Change le mdp de la frequence privée")
                .addField("$difhelp ID", "Envoie l'aide sur le channel correspondant à l'ID")
                .addField("$difhelpfreq ID", "Envoie l'aide de changement de freq sur le channel correspondant à l'ID")
                .addField("$evalSQL", "Evalue une commande SQL :warning: NE PAS UTILISER SI VOUS N'ETES PAS SUR !!!")
                .addField("$chgtcouleur", "Active ou désactive le changement de couleur libre")
                .addField("$audioevent", "Aide pour les evenements audio")
                .addField("Commandes EVENT", "Laissez Onion faire, assez complexe:\n$maj | $stopmaj | $mise_en_route")
                .setFooter("Par Onion² pour " + nom_serveur);
            msg.channel.send(embed_signal);
            return;
        }

        if (command == "etat") {
            let embed_signal = new Discord.MessageEmbed()
                .setColor(1)
                .setTimestamp()
                .setTitle("Etat du programme")
                .setDescription("Voici les differents parametres de signal");

            if (configuration.brouillage_caractere == 0) embed_signal.addField("Brouillage (caractere)", "__désactivée__");
            else embed_signal.addField("Brouillage (caractere)", configuration.brouillage_caractere.toString() + "%");

            if (configuration.brouillage_espace == 0) embed_signal.addField("Brouillage (espace)", "__désactivée__");
            else embed_signal.addField("Brouillage (espace)", configuration.brouillage_espace.toString() + "%");

            if (configuration.brouillage_couleur == 0) embed_signal.addField("Brouillage (couleur)", "__désactivée__");
            else embed_signal.addField("Brouillage (couleur)", configuration.brouillage_couleur.toString() + "/255");

            if (configuration.taille_max_msg == 0) embed_signal.addField("Taille maximum des messages", "(limitation discord)");
            else embed_signal.addField("Taille maximum des messages", configuration.taille_max_msg.toString());

            embed_signal.addField("Delai avant supression d'un message", configuration.duree_messsage.toString() + "ms");

            if (configuration.coloration) embed_signal.addField("Coloration personnalisable", "__activée__");
            else embed_signal.addField("Coloration personnalisable", "__désactivée__");

            if (configuration.anonyme) embed_signal.addField("Anonymisation", "__activée__");
            else embed_signal.addField("Anonymisation", "__désactivée__");

            if (configuration.cryptage) embed_signal.addField("Cryptage", "__activée__");
            else embed_signal.addField("Cryptage", "__désactivée__");

            if (configuration.actif) embed_signal.addField("Signal", "__activé__");
            else embed_signal.addField("Signal", "__désactivé__");

            if (configuration.fichier) embed_signal.addField("Fichier", "__activé__");
            else embed_signal.addField("Fichier", "__désactivé__");

            if (configuration.audio) embed_signal.addField("Fichier audio", "__activé__");
            else embed_signal.addField("Fichier audio", "__désactivé__");

            //json
            //embed_signal.addField("Nombre d'utilisateur avec profile couleur", liste_utilisateur.Utilisateurs.length);
            //mysql
            let nb_utilisateur = await query_db("SELECT table_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=\"" + config.Serveur_SQL.database + "\" and table_name=\"users\"");
            embed_signal.addField("Nombre d'utilisateur avec profile couleur", nb_utilisateur[0].table_rows);

            //embed_signal.addField("Nombre de message depuis la derniere mise en route:", msg_count.toString());

            embed_signal.addField("Ping moyen", client.ws.ping.toFixed(0).toString() + "ms");

            let TpsActif = new Date(client.readyTimestamp);
            let now = new Date();
            let ecart = ((now - TpsActif) / 3600000);
            if (ecart < 1) ecart = (((now - TpsActif) / 60000).toFixed(0).toString()) + " minute(s)";
            else ecart = (ecart.toFixed(0).toString()) + " heure(s)";

            embed_signal.addField("Activité", "Actif depuis le " + TpsActif.toLocaleDateString() + " à " + TpsActif.toLocaleTimeString() +
                    "\nsoit depuis environ " + ecart)
                .setFooter("Par Onion² pour " + nom_serveur);

            msg.channel.send(embed_signal);
            return;
        }

        if (command == "delaidel") {
            configuration.duree_messsage = args[0];
            msg.channel.send("Nouveau delai avant supression d'un message: " + configuration.duree_messsage + "ms");
            console.log("Nouveau delai avant supression message: " + configuration.duree_messsage + "ms");
            msg.react("✅");
        }

        if (command == "admin") {
            //commande pour parler en tant qu'admin sur radio
            let embed_admin = new Discord.MessageEmbed();
            embed_admin.setAuthor(member.user.username, msg.author.avatarURL())
                .setColor("#ff0000")
                .setDescription(msg.content.slice(appel.length + 6))
                .setTimestamp();

            //let Channel_radio = client.channels.get(config.ID_radio); //test: 597466263144366140
            //if (!Channel_radio) return console.error("Channel " + ID + " non existant !");
            Channel_radio.send(embed_admin).then(sent => { // 'sent' est le message envoyé
                sent.delete({ timeout: configuration.duree_messsage });
                msg.react("✅");
            });
            return;
        }

        /*
        if (command == "log") {
            msg.react("📄");
            msg.channel.send("Voici les logs:", { files: ["signal.log"] });
            return;
        }*/

        //commande event
        if (command == "mise_en_route") {
            mise_en_route(Channel_radio, config.version);
            return;
        }
        if (command == "maj") {
            maj(args[0], Channel_radio);
            return;
        }
        if (command == "stopmaj") {
            stopmaj_f(Channel_radio);
            return;
        }
        if (command == "anonyme") {
            configuration.anonyme = !configuration.anonyme;
            if (configuration.anonyme) {
                msg.channel.send("Anonymisation des messages");
                return;
            }
            msg.channel.send("Arrêt de l'anonymisation");
        }

        if (command == "cryptage") {
            configuration.cryptage = !configuration.cryptage;
            if (configuration.cryptage) msg.channel.send("Cryptage autorisé");
            else msg.channel.send("Cryptage interdit");
        }

        if (command == "actif") {
            configuration.actif = !configuration.actif;
            if (configuration.actif) {
                msg.channel.send("Signal est maintenant __actif__");

            } else {
                msg.channel.send("Signal n'est maintenant __plus actif__");
            }
        }

        if (command == "chgtcouleur") {
            configuration.changement_couleur = !configuration.changement_couleur;
            if (configuration.changement_couleur) msg.channel.send("Changement de couleur libre __actif__");
            else msg.channel.send("Changement de couleur libre __plus actif__");

        }


        if (command == "validechgtcouleur") {
            //$validechgtcouleur 328584955934277633  #0FF0F6
            try {
                let couleur;
                if (args[1] == "RANDOM") {
                    couleur = alea_couleur();
                } else {
                    couleur = args[1].replace("#", "");
                }
                query_db("UPDATE users SET COULEUR = \"" + couleur + "\" WHERE ID=\"" + args[0] + "\"");
                msg.react("✅");
                //message pour avertir utilisateur
                let user = await client.users.fetch(args[0]);
                user.send("Votre demande de changement de couleur a été validée :yum:\nConsultez votre nouvelle couleur avec la commande `$macouleur`");

            } catch (error) {
                msg.channel.send("Il semble y avoir une erreur dans la commande, contactez onion !");
                console.log(error);
            }
        }



        if (command == "coloration") {
            configuration.coloration = !configuration.coloration;
            if (configuration.coloration) msg.channel.send("Les couleurs seront maintenant __personnalisable__");
            else msg.channel.send("Tout sera maintenant en __Jaune__");
        }

        if (command == "fichier") {
            configuration.fichier = !configuration.fichier;
            if (configuration.fichier) msg.channel.send("Les utilisateurs peuvent maintenant envoyer des fichiers (hormis audio)");
            else msg.channel.send("Les utilisateurs ne peuvent plus envoyer de fichiers (hormis audio)");
        }

        if (command == "audio") {
            configuration.audio = !configuration.audio;
            if (configuration.audio) msg.channel.send("Les utilisateurs peuvent maintenant envoyer des fichiers audios (.mp3 / .wav)");
            else msg.channel.send("Les utilisateurs ne peuvent plus envoyer de fichiers audio (.mp3 / .wav)");
        }

        if (command == "difhelp") {
            /*Channel_radio = client.channels.get(config.ID_radio); //test: 597466263144366140
            if (!Channel)_radio return console.error("Channel " + ID + " non existant !");*/
            chann = client.channels.cache.get(args[0]); //test: 597466263144366140
            if (!chann) return console.error("Channel " + ID + " non existant !");
            embed_aide(chann);
            msg.react("✅");
            return;
        }

        if (command == "difhelpfreq") {
            chann = client.channels.cache.get(args[0]); //test: 597466263144366140
            if (!chann) return console.error("Channel " + ID + " non existant !");
            send_aide_freq(chann);
            send_liste_freq(chann);
            msg.react("✅");
            return;
        }

        if (command == "cleanup") {
            cleanup(Channel_radio, parseInt(configuration.duree_messsage));
            msg.react("✅").catch(err => Error(70, err));
            return;
        }

        if (command == "crash") {
            process.exit(0);
        }

        if (command == "evalsql") {
            let result = await query_db(msg.content.slice("evalSQL".length + 1));
            console.log(result);
            result = JSON.stringify(result);
            console.log(result);
            msg.channel.send(result);
        }


        if (command == "ban") {
            //console.log(msg.mentions.users);
            let utilisateur_cible;

            args.forEach(async ID => {
                ID = ID.replace(/\D/g, '');
                //console.log(ID);
                if (ID != '') {
                    //json
                    //utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === mention.id); //trouver l'utilisateur qui à ce nom
                    //mysql
                    let query = await query_db("SELECT * FROM users WHERE  ID=\"" + ID + "\"");
                    utilisateur_cible = query[0];

                    if (utilisateur_cible == undefined) {
                        msg.channel.send("ID: " + utilisateur_cible.ID + " n'a pas de profile sur la base de donnée, ECHEC.");
                    } else {
                        utilisateur_cible.bloque = true;
                        msg.channel.send("Ban de ID: " + utilisateur_cible.ID);
                        //json:
                        //fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));
                        //mysql
                        query_db("UPDATE users SET bloque = true WHERE ID=\"" + utilisateur_cible.ID + "\"");
                    }
                }

            });
            return;
        }

        if (command == "deban") {
            //console.log(msg.mentions.users);
            let utilisateur_cible;

            args.forEach(async ID => {
                ID = ID.replace(/\D/g, '');
                //console.log(ID);
                if (ID != '') {
                    //json
                    //utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === mention.id); //trouver l'utilisateur qui à ce nom
                    //mysql
                    let query = await query_db("SELECT * FROM users WHERE  ID=\"" + ID + "\"");
                    utilisateur_cible = query[0];

                    if (utilisateur_cible == undefined) {
                        msg.channel.send("ID: " + utilisateur_cible.ID + " n'a pas de profile sur la base de donnée, ECHEC.");
                    } else {
                        utilisateur_cible.bloque = true;
                        msg.channel.send("Deban de ID: " + utilisateur_cible.ID);
                        //json:
                        //fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));
                        //mysql
                        query_db("UPDATE users SET bloque = false WHERE ID=\"" + utilisateur_cible.ID + "\"");
                    }
                }

            });
            return;
        }

        if (command == "listeban") {
            //json
            //let listeban = liste_utilisateur.Utilisateurs.filter(user => user.bloque === true);
            //mysql
            let listeban = await query_db("SELECT * FROM users WHERE  bloque= true");
            if (listeban.length == 0) {
                msg.channel.send("Aucun utilisateur banni");
            } else {
                msg.channel.send("Voici la liste:");
                listeban.forEach(element => {
                    client.users.fetch(element.ID).then(
                        user => {
                            if (user != undefined) {
                                msg.channel.send("Nom: " + user.username + " | ID: " + element.ID);
                            } else {
                                msg.channel.send("ERREUR UTILISATEUR INCONNU ID: " + element.ID);
                            }
                        });

                });
            }
            return;
        }

        if (command == "addmotinterdit") { //$addmotinterdit couille
            configuration.mots_interdits.push(args[0]);
            console.log("Nouveau mot interdit: " + configuration.mots_interdits[configuration.mots_interdits.length - 1]);
            msg.react("✅");
        }

        if (command == "listemotinterdit") { //$addmotinterdit couille
            msg.channel.send("Mots interdits: \n" + configuration.mots_interdits.toString());
            return;
        }

        if (command == "addfreqprivée") { //$addfreqprive nom mdp ID

            try {
                let freq = {};
                freq.nom = args[0];
                freq.mdp = args[1];
                freq.ID = args[2];
                configuration.frequence.TACSAT.push(freq);
                msg.react("✅");
            } catch (error) {
                Error(51, error);
                return;
            }
        }

        if (command == "addfreq") { //$addfreq nom ID
            try {
                let freq = {};
                freq.nom = args[0];
                freq.ID = args[1];
                configuration.frequence.freq.push(freq);
                msg.react("✅");
            } catch (error) {
                Error(50, error);
                return;
            }
        }

        if (command == "changemdpfreq") { //$changemdpfreq nom ou ID mdp
            try {

                let index = configuration.frequence.TACSAT.findIndex(freq => (args[0] == freq.nom | args[0] == freq.ID));
                if (index != -1) {
                    let freq = configuration.frequence.TACSAT[index];
                    freq.mdp = args[1];
                    configuration.frequence.TACSAT[index] = freq;
                    msg.react("✅");
                } else {
                    msg.channel.send("Pas de frequence à ce nom...");
                    return;
                }
            } catch (error) {
                Error(52, error);
                return;
            }
        }

        if (command == "delfreq") { //$delfreq nom ou ID
            try {

                let freq_deleted;
                let index = configuration.frequence.TACSAT.findIndex(freq => (args[0] == freq.nom | args[0] == freq.ID));
                if (index == -1) {
                    index = configuration.frequence.freq.findIndex(freq => (args[0] == freq.nom | args[0] == freq.ID));
                    if (index != -1) {
                        freq_deleted = configuration.frequence.freq[index];
                        configuration.frequence.freq.splice(index, 1);
                        msg.channel.send("Supression de la frequence:\n`$addfreq " + freq_deleted.nom + " " + freq_deleted.ID + "`");
                    } else {
                        msg.channel.send("Pas de frequence à ce nom...");
                        return;
                    }

                } else {
                    freq_deleted = configuration.frequence.TACSAT[index];
                    configuration.frequence.TACSAT.splice(index, 1);
                    msg.channel.send("Supression de la frequence:\n`$addfreqprivée " + freq_deleted.nom + " " + freq_deleted.ID + " " + freq_deleted.mdp + "`");
                }


            } catch (error) {
                Error(53, error);
                return;
            }
        }

        if (command == "listefreqmdp") { //$changemdp nom ou ID mdp
            let embed = new Discord.MessageEmbed()
                .setTitle("__Liste des fréquences radios__")
                .setColor('#FFFFFF')
                .setTimestamp()
                .setAuthor("Signal", client.user.avatarURL());

            let description = "**Liste des frequences publiques:**";
            configuration.frequence.freq.forEach(frequence => {
                description += "\n`$freq " + frequence.nom + "` (ID:" + frequence.ID + ")";
            });
            description += "\n\n**Liste des frequences privées:**";
            configuration.frequence.TACSAT.forEach(tacsat => {
                description += "\n`$freq " + tacsat.nom + " " + tacsat.mdp + "` (ID:" + tacsat.ID + ")";
            });
            embed.setDescription(description);
            msg.channel.send(embed);
        }

        if (command == "setbrouillageespace") { //$setbrouillageespace 25
            configuration.brouillage_espace = args[0];
            console.log("Nouveau niveau de brouillage: " + configuration.brouillage_espace + "% des espaces seront brouillés");
            msg.react("✅");
        }

        if (command == "setbrouillagecouleur") { //$setbrouillageespace 25
            configuration.brouillage_couleur = args[0];
            console.log("Nouveau niveau de brouillage pour la couleur: " + configuration.brouillage_couleur + "...");
            msg.react("✅");
        }

        if (command == "setbrouillage") { //$setbrouillage 0 >retablisssement de la ligne
            configuration.brouillage_caractere = args[0];
            console.log("Nouveau niveau de brouillage: " + configuration.brouillage_caractere);

            if (args[1] != undefined) {
                if (args[1].indexOf(">") == 0) { //si argument 2 commence par >, cad message
                    let embed_signal = new Discord.MessageEmbed()
                        .setColor(1)
                        .setTimestamp()
                        .setTitle("Information état du réseau signal")
                        .setDescription(msg.content.slice(msg.content.indexOf(">") + 1))
                        .setThumbnail("https://support.lasers.leica-geosystems.com/lino/l2p5-l2p5g/fr/Content/Resources/Images/led_blinksred.gif");

                    if (msg.attachments) {
                        let listeFichier = [];
                        for (let [, var2] of msg.attachments) {
                            listeFichier.push(var2.url); //yes

                        }
                        embed_signal.attachFiles(listeFichier);
                    }

                    /*Channel = client.channels.get(config.ID_radio); //test: 597466263144366140
                    if (!Channel) return console.error("Channel " + ID + " non existant !");*/
                    Channel_radio.send(embed_signal).then(sent => { msg.react("👌"); });

                }
            }

            msg.react("✅");
            if (configuration.brouillage_caractere != 0) msg.channel.send("Désormais, " + configuration.brouillage_caractere + "% des caractères seront brouillés");
            else msg.channel.send("Le brouillage est désactivé");
            if (configuration.brouillage_caractere > 20) {
                msg.channel.send("Ce niveau de brouillage est très fort ! Les messages risquent d'être illisible (Plus d'1 caractere sur 5 sera brouillé)");
            }

        }



        if (command == "audioevent") {
            if (!args[0]) {
                let embed_Aide_eventAudio = new Discord.MessageEmbed()
                    .setColor("#8630F3")
                    .setTimestamp()
                    .setTitle("AIDE AUDIOEVENT")
                    .setDescription("`$audioevent` + commande\n**COMMANDES:**")
                    .addField("`add`", "Ajout d'un event audio, remplir ce formulaire en conservant les crochets et l'envoyer sur ce canal:" +
                        "```$audioevent add ->\n" +
                        "NOM:[nom] \n" +
                        "ACTIF[OUI/NON]\n" +
                        "IDCHAN:[nom/id des canaux à se connecter, séparés par une virgule ou ALL]\n" +
                        "NBCHAN:[nombre de chan (-1;1024 / ALL)]\n" +
                        "CRON:[voir https://crontab.guru/ et https://cronjob.xyz/]\n" +
                        "AUDIO:[vide si audio joint au message/nom du fichier]\n" +
                        "VOLUME:[entre 0 et 1 (par ex: 0.75)]\n" +
                        "```")
                    .addField("`list`", "Donne la liste des events audio et leur état")
                    .addField("`info`", "nom de l'event audio - Donne beaucoup plus d'infos sur l'event audio")
                    .addField("`start` + nom de l'event audio", "Demarre l'event audio")
                    .addField("`stop` + nom de l'event audio", "Arrete l'event audio")
                    .addField("`del` + nom de l'event audio", "Supprime l'event audio")
                    .addField("`plan` + nom de l'event audio", "Donne les 30 prochaines diffusions");
                msg.channel.send(embed_Aide_eventAudio);
                return;


            }

            //string.match(/\[(.*?)\]/)[1] //recupe entre parenthese

            //gestion event audio
            /*  format event
            {
                "nom": "premier_test",
                "filename": "piste1.mp3",
                "actif":false
                "CronPeriodText": "35 * * * * *",
                "nbChan": 2,
                "IDChans": ["822181704386871326", "822182706715951164"]
            }
            */

            if (args[0] == "add") {

                log = "LOG:\n";

                lines_param = msg.content.split('\n');
                let new_event = {};

                //NOM
                let nom = lines_param[1].match(/\[(.*?)\]/)[1].trim();
                if (!nom | nom.length <= 0) {
                    msg.channel.send("Erreur nom !");
                    return;
                }
                if (audioEventsMan.isNomDejaPris(nom)) { //si nom deja pris
                    msg.channel.send("Nom déjà pris !");
                    return;
                }
                log += "NOM:**" + nom + "** | ";
                new_event.nom = nom;
                //FIN NOM

                //ACTIF
                let actif_totest = lines_param[2].match(/\[(.*?)\]/)[1].trim();
                let audio_actif;
                if (actif_totest == "OUI") audio_actif = true;
                else if (actif_totest == "NON") audio_actif = false;
                else {
                    msg.channel.send("Erreur actif !");
                    return;
                }
                log += "ACTIF:**" + audio_actif + "** | ";
                new_event.actif = audio_actif;
                //FIN ACTIF

                //LISTE CHAN
                let array_chan = [];

                if (lines_param[3].match(/\[(.*?)\]/)[1].trim() == "ALL") {
                    configuration.frequence.freq.forEach((frequence) => {
                        array_chan.push(frequence.ID);
                    });
                } else {
                    let nomchans = lines_param[3].match(/\[(.*?)\]/)[1].split(',');
                    if (nomchans.length == 0) {
                        msg.channel.send("Erreur IDCHAN, liste non reconnue");
                        return;
                    }
                    let liste_chan = configuration.frequence.freq.filter(frequence =>
                        (nomchans.indexOf(frequence.nom) != -1 | nomchans.indexOf(frequence.ID) != -1) //filtrer => uniquement les freq avec un nom ou id dans l'argument
                    );
                    liste_chan.forEach((frequence) => {
                        array_chan.push(frequence.ID);
                    });
                }
                log += "IDCHANS:**" + array_chan.toString() + "** | ";
                new_event.IDChans = array_chan;
                //FIN LISTE CHAN


                //NBCHAN
                let nb_chan_st = lines_param[4].match(/\[(.*?)\]/)[1].trim();
                let nb_chan;
                if (nb_chan_st == "ALL") {
                    nb_chan = -1;
                } else {
                    nb_chan = parseInt(nb_chan_st);
                }
                if (nb_chan == 0) {
                    msg.channel.send("Erreur NBCHAN=0 !");
                    return;
                }
                log += "NBCHANS:**" + nb_chan.toString() + "** | ";
                new_event.nbChan = nb_chan;
                //FIN NBCHAN

                //PLANIFICATION
                let arg_plan = lines_param[5].match(/\[(.*?)\]/)[1].trim();
                if (!cron_validator.isValidCron(arg_plan, { seconds: false })) {
                    msg.channel.send("Erreur CRON INVALIDE !");
                    return;
                }
                log += "**CRON:" + arg_plan.toString() + "** | ";
                new_event.CronPeriodText = arg_plan;
                //FIN PLAN

                //AUDIO
                let fichier_audio = lines_param[6].match(/\[(.*?)\]/)[1].trim();
                if (fichier_audio.length == 0) { //si vide alors check fichier en attachement
                    //GESTION FICHIER 
                    //console.log(msg.attachments);
                    if (msg.attachments.first()) { //checks if an attachment is sent
                        let file = msg.attachments.first();
                        if (file.name.indexOf(`mp3`) == file.name.length - 3) { //Download only mp3 
                            download(file.url, './ressources/' + file.name); //Function I will show later
                            new_event.filename = file.name;
                            log += "FICHIER:**" + file.name + "** | ";
                        }
                    } else {
                        msg.channel.send("Erreur FICHIER INVALIDE !");
                        return;
                    }
                } else {

                    //check si fichier existe
                    if (fs.existsSync('./ressources/' + fichier_audio)) {
                        log += "FICHIER:**" + fichier_audio + "** | ";
                        new_event.filename = fichier_audio;
                    } else {
                        msg.channel.send("Erreur FICHIER N'EXISTE PAS ! " + fichier_audio);
                        return;
                    }
                }
                //FIN AUDIO



                //VOLUME
                let volume = lines_param[7].match(/\[(.*?)\]/)[1].toString();

                if (volume > 1 | volume < 0) {
                    msg.channel.send("Erreur volume incorrecte !");
                    return;
                }

                log += "VOLUME:**" + volume + "**";
                new_event.volume = volume;
                //FIN VOLUME

                //et on ajoute
                msg.channel.send(log);
                audioEventsMan.add(new_event, true);
                //check erreur
                //msg.channel.send("OK ! ");
                msg.react("✅");

                return;
            }


            if (args[0] == "list") {
                let liste = audioEventsMan.list();
                let info = "Liste des events audio:";
                for (let index = 0; index < liste.length; index++) {
                    //msg.channel.send(`Nom: **${liste[index].nom}** - actif: **${liste[index].cron.running}**`);
                    info += '\n';
                    if (liste[index].cron) {
                        info += audioEventsMan.getStateEmoji(liste[index].nom);
                    } else {
                        info += `>ERREUR<`;
                    }
                    info += ` \`${liste[index].nom}\``;

                }
                msg.channel.send(info);
                return;
            }

            //fusion avec liste ?
            if (args[0] == "info") { //a faire meilleur affichage
                let info = audioEventsMan.info(args[1]); //redonne [0] l'objet audioevent & [1] la donnée enregistrée | 1 si pas objet, 2 si pas enregistré

                if (info != 1 & info != 2) {
                    let info_st = "";

                    info_st += `**NOM**\t\`${info[0].nom}\`\t${audioEventsMan.getStateEmoji(info[0].nom)}\n` +
                        `**CHAN**\n\`${get_corres_listeID_nom(info[1].IDChans).toString().replace(/,/g,'\n').trim()}\`\n` +
                        `**NbChans**\t\`${info[1].nbChan}\`\n` +
                        `**CRON**\t\`${info[1].CronPeriodText}\`\n` +
                        `**FICHIER**\t\`${info[1].filename}\`\n` +
                        `**VOLUME**\t\`${info[1].volume}\`\n` +
                        `**INFO CRON**\n` +
                        `*Derniere execution*\t\`${audioEventsMan.getLast(info[0].nom)}\`\n` +
                        `*Prochaine execution*\t\`${audioEventsMan.getNext(info[0].nom)}\`\n`;

                    msg.channel.send(info_st);
                } else {
                    msg.react("❌");
                }
                return;
            }

            if (args[0] == "start") { //a faire gestion errreur
                let err = audioEventsMan.start(args[1]);
                if (err == 0) msg.react("✅");
                else {
                    msg.react("❌");
                    console.log(err);
                }
                return;
            }
            if (args[0] == "stop") { //a faire gestion errreur
                let err = audioEventsMan.stop(args[1]);
                if (err == 0) msg.react("✅");
                else {
                    msg.react("❌");
                    console.log(err);
                }
                return;
            }
            if (args[0] == "del") { //a faire gestion errreur
                let err = audioEventsMan.delete(args[1]);
                if (err == 0) msg.react("✅");
                else {
                    msg.react("❌");
                    console.log(err);
                }
                return;
            }

            if (args[0] == "plan") { //a faire gestion errreur
                let info = audioEventsMan.getNext(args[1], 30);
                if (info) {
                    msg.react("✅");
                    msg.channel.send(`**Prochaines diffusions**\n\`${info.toString().replace(/,/g,'\n').trim()}\`\n`);
                } else {
                    msg.react("❌");
                    console.log(err);
                }
                return;
            }

            msg.react("❔");

        }

        fs.writeFileSync('./data/conf_signal.json', JSON.stringify(configuration, null, 2)); //sauvegarde des modifications

    } //fin ID LOG

}); //fin rec message



function brouiller(text, niveau_espace, niveau_caractere) {

    let new_text = "";

    for (i = 0; i < text.length; i++) {

        if (text.charAt(i) === " " & ((new_text.length + (text.length - i)) < 1900)) { //si ESPACE   (bug car message discord limité à 2048 caract)
            //console.log((new_text.length + (text.length - i)));
            if (randomTF(niveau_espace) & niveau_espace != 0) { //si 3 => output 0 1 2

                switch (random(7)) {
                    case 0:
                        new_text += " krsssh..";
                        break;
                    case 1:
                        new_text += " ...krssssssh";
                        break;
                    case 2:
                        new_text += " clckrssh..";
                        break;
                    case 3:
                        new_text += "......";
                        break;
                    case 4:
                        new_text += "...";
                        break;
                    case 5:
                        new_text += ".........";
                        break;
                    case 6:
                        new_text += "...kshhhhk";
                        break;
                }
            }
            new_text += " ";
        } else {
            if (randomTF(niveau_caractere) & niveau_caractere != 0) {
                switch (random(7)) { //pk pas ascii ?
                    case 0:
                        new_text += "%";
                        break;
                    case 1:
                        new_text += "\"";
                        break;
                    case 2:
                        new_text += "^";
                        break;
                    case 3:
                        new_text += "#";
                        break;
                    case 4:
                        new_text += "$";
                        break;
                    case 5:
                        new_text += "@";
                        break;
                    case 6:
                        new_text += "§";
                        break;
                }
            } else {
                new_text += text.charAt(i);
            }
        }
    }

    return new_text;
}








async function Send_Message(msg, content, utilisateur, member, cryptage, clef) { //, brouillage_utilisateur_espace, brouillage_utilisateur_caractere) {
    //msg_count++;

    let log_titre = msg.author.tag;

    if (msg.channel.type == "text") log_titre += " (" + msg.channel.name + ")";
    else log_titre += " (MP)";

    let log = "Message de " + get_usernames(member, true) + ":\n`" + content + " `" + "\n";

    //envoie des fichiers:

    let listeFichier = [];
    if (configuration.fichier | configuration.audio) {
        if (msg.attachments) { //si il y a des images attachés au message
            for (let [var1, var2] of msg.attachments) {
                //if(var2.filename.slice(-3))
                log += "Fichier: " + var2.url + " : ";
                switch (var2.filename.slice(-4)) {
                    case ".mp3":
                    case ".m4a":
                    case ".wav":
                        if (configuration.audio) {
                            listeFichier.push(var2.url); //yes  recuperer les fichiers dans listeFichier
                            log += "OK";
                        } else {
                            msg.author.send(string_message.sending_msg.file.no_audio + var2.filename + string_message.sending_msg.file.end);
                            log += "NOK";
                        }
                        break;

                    default: //autre fichier
                        if (configuration.fichier) {
                            listeFichier.push(var2.url); //yes  recuperer les fichiers dans listeFichier
                            log += "OK";
                        } else {
                            msg.author.send(string_message.sending_msg.file.no_file + var2.filename + string_message.sending_msg.file.end);
                            log += "NOK";
                        }
                        break;
                }
                log += "\n";
            }
        }
    }

    let mot_interdits = validator(content, configuration.mots_interdits);

    if (mot_interdits.length != 0) {
        msg.author.send(string_message.sending_msg.word_banned + mot_interdits.toString());
        dif_log(log_titre, log + "UTILISATION DE MOTS INTERDITS ! :warning:\n```" + mot_interdits.toString() + "```", Channel_log, member.user.avatarURL(), "#e82020");
        return;
    }


    if (content.length !== 0) {

        let new_text = brouiller(content, configuration.brouillage_espace, configuration.brouillage_caractere); //brouillage message

        let embed_signal = new Discord.MessageEmbed()
            .setTimestamp();

        if (configuration.coloration) {
            //brouillage de le couleur
            embed_signal.setColor(brouilleCouleurHex(utilisateur.COULEUR, configuration.brouillage_couleur));
        } else {
            embed_signal.setColor("#F8E71C");
        }


        if (!configuration.anonyme) { //event
            embed_signal.setAuthor(member.user.username, member.user.avatarURL());
        }

        //niveau de brouillage
        /*
        if (configuration.brouillage_caractere < 3) {
            embed_signal.setFooter("3/3", "https://i.goopics.net/5ykGd.png");
        }
        if (configuration.brouillage_caractere >= 3 & configuration.brouillage_caractere < 5) {
            embed_signal.setFooter("2/3", "https://i.goopics.net/LKgGQ.png");
        }
        if (configuration.brouillage_caractere >= 5 & configuration.brouillage_caractere < 10) {
            embed_signal.setFooter("1/3", "https://i.goopics.net/ADPYq.png");
        }
        if (configuration.brouillage_caractere >= 10) {
            embed_signal.setFooter("0/3", "https://i.goopics.net/7DayJ.png");
        }
        */ //https://i.ibb.co/p4x90sz/wifi.gif
        if (configuration.brouillage_caractere < 3) {
            embed_signal.setFooter("3/3", "https://i.ibb.co/HDNdFg2/reseau4.png");
        }
        if (configuration.brouillage_caractere >= 3 & configuration.brouillage_caractere < 5) {
            embed_signal.setFooter("2/3", "https://i.ibb.co/Dgwrhy7/reseau3.png");
        }
        if (configuration.brouillage_caractere >= 5 & configuration.brouillage_caractere < 10) {
            embed_signal.setFooter("1/3", "https://i.ibb.co/1MP2tqp/reseau2.png");
        }
        if (configuration.brouillage_caractere >= 10) {
            embed_signal.setFooter("0/3", "https://i.ibb.co/MCBnRKD/reseau1.png");
        }




        if (cryptage) {

            new_text = crypter(new_text, clef); //affecter les cryptage à la modulation ?
            log += "clef crypto: `" + clef + "`\n";
            embed_signal.setTitle(string_message.sending_msg.rec_crypted)
                .setDescription("```" + new_text + "```")
                .setColor("#000000");

        } else {
            embed_signal.setDescription(new_text)
                .setTitle(string_message.sending_msg.rec);
        }
        Channel_radio.send(embed_signal, "", { files: listeFichier }).then(sent => CallBack_Message(sent, msg, utilisateur, member, log_titre, log)).catch(err => Error(1, err));
    } else {
        Channel_radio.send({ files: listeFichier }).then(sent => CallBack_Message(sent, msg, utilisateur, member, log_titre, log)).catch(err => Error(2, err));
    }
}

function CallBack_Message(sent, msg, utilisateur, member, log_titre, log) { // 'sent' est le message envoyé
    if (msg.channel.type != "text") msg.react("📤").catch(err => Error(3, err));
    let id = sent.id;
    sent.delete({ timeout: configuration.duree_messsage }).catch(err => Error(4, err));
    //msg.author.send("Message envoyé !\n" + "```" + "Channel: " + sent.channel.name + "\nID: " + id + "\nContenu:\n" + new_text.replace("`", ".") + "```");
    utilisateur.DERMSG = id;
    //json:
    //update_user(msg.author.id, utilisateur);
    //mysql:
    let isoDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    query_db("UPDATE users SET DERMSG = " + utilisateur.DERMSG + ", nb_msg = nb_msg+1, date_dermsg=\"" + isoDate + "\" WHERE ID=\"" + msg.author.id + "\"").then(() => {
        query_db("SELECT nb_msg FROM users WHERE ID=\"" + msg.author.id + "\"").then((result) => {
            let nb_msg = result[0].nb_msg;
            if (nb_msg % 50 == 0) { //si multiple de 50
                msg.author.send(`Wahou ! Tu as déjà écrit ${nb_msg} messages, tu as l'aire d'aimer le bot :partying_face:\nN'hésite pas à remercier son créateur et à contribuer à son développement en faisant un don ici:\nhttps://paypal.me/pools/c/8mowOxex8i\nMerci énormement :wink:`);
            }
        });
    });


    dif_log(log_titre, log + "[Lien du message](\n" + sent.url + ")\n`ID_utilisateur: " + utilisateur.ID + "`", Channel_log, member.user.avatarURL(), "#000000", config.MP_admin, false); //log
}

function Error(num, err) {
    dif_log_simple("⚠️ Erreur !", "Erreur n°" + num.toString() + "\n" + err, "#FF300F");
}

//json
/*
function update_user(id, utilisateur) {
    let data = JSON.parse(fs.readFileSync('utilisateur.json', 'utf8'));
    let i = data.Utilisateurs.findIndex(user => user.ID === id);
    data.Utilisateurs[i] = utilisateur;
    //et up !
    fs.writeFileSync('utilisateur.json', JSON.stringify(data, null, 2));
} */

function embed_aide(Channel) {

    let embed = new Discord.MessageEmbed()
        .setTitle("__**SIGNAL**__")
        .setDescription(string_message.help.general.description)
        .setColor(16312092)
        .setTimestamp()
        .setFooter(string_message.help.footer + nom_serveur, client.user.avatarURL());
    //.setThumbnail(client.user.avatarURL());
    //msg
    embed.addField(string_message.help.general.msg.name, string_message.help.general.msg.value.replace("%IDCHAN%", Channel_radio.id).replace("%IDCLIENT%", client.user.id));

    //embed.addField('\u200b', '\u200b');

    if (configuration.cryptage) {
        embed.addField(string_message.help.general.crypt.name, string_message.help.general.crypt.value);
    }
    //cryptage
    //chgt couleur
    if (configuration.changement_couleur) {
        embed.addField(string_message.help.general.chgtcouleur.name, string_message.help.general.chgtcouleur.value);
    } else {
        embed.addField(string_message.help.general.askchgtcouleur.name, string_message.help.general.askchgtcouleur.value);
    }
    //del
    embed.addField(string_message.help.general.del.name, string_message.help.general.del.value);

    //embed.addField('\u200b', '\u200b');

    //donate
    embed.addField(string_message.help.general.donate.name, string_message.help.general.donate.value);
    //note
    embed.addField(string_message.help.note.name, string_message.help.note.value);

    Channel.send({ embed });

}



function send_liste_freq(chan) {
    let embed = new Discord.MessageEmbed()
        .setTitle(string_message.help.freq.list.name)
        .setColor('#1cfc03')
        .setTimestamp()
        .setAuthor("Signal", client.user.avatarURL());
    let description = string_message.help.freq.list.public;
    configuration.frequence.freq.forEach(frequence => {
        description += "\n`$freq " + frequence.nom + "`";
    });
    description += "\n\n" + string_message.help.freq.list.private;
    configuration.frequence.TACSAT.forEach(tacsat => {
        description += "\n`$freq " + tacsat.nom + " ████████`";
    });
    embed.setDescription(description);
    chan.send(embed);
}

function send_aide_freq(chan) {
    let embed = new Discord.MessageEmbed()
        .setTitle(string_message.help.freq.help.title)
        .setDescription(string_message.help.freq.help.description)
        .setColor('#1cfc03')
        .setTimestamp()
        .setThumbnail(client.user.avatarURL())
        //.setAuthor("Signal", client.user.avatarURL())
        .addField(string_message.help.freq.help.gopublic.name, string_message.help.freq.help.gopublic.value)
        .addField(string_message.help.freq.help.goprivate.name, string_message.help.freq.help.goprivate.value)
        .addField(string_message.help.freq.help.list.name, string_message.help.freq.help.list.value)
        .addField(string_message.help.freq.help.on.name, string_message.help.freq.help.on.value)
        .addField(string_message.help.freq.help.off.name, string_message.help.freq.help.off.value)
        .addField(string_message.help.freq.help.next.name, string_message.help.freq.help.next.value)
        .addField(string_message.help.freq.help.previous.name, string_message.help.freq.help.previous.value)
        .addField(string_message.help.freq.help.exemple.name, string_message.help.freq.help.exemple.value)
        .addField('\u200b', '\u200b')
        .addField(string_message.help.note.name, string_message.help.note.value)
        .setFooter(string_message.help.footer + nom_serveur, client.user.avatarURL());
    chan.send(embed);
}

function query_db(query) {
    console.log(query);
    return new Promise((resolve, reject) => {

        db.query({ sql: query, timeout: 5000 }, (error, results) => {
            if (error) {
                console.log(error);
                dif_log_simple("Erreur SQL", "Requête: `" + query + "`\nErreur: `" + error + "`", "#FF100F");
                if (error.fatal) {

                }
                return reject(error);
            }
            return resolve(results);
        });
    });
}




function download(url, path) {
    request.get(url)
        .on('error', console.error)
        .pipe(fs.createWriteStream(path));
}