//by onion²

//CC BY-NC-ND

/* jshint node: true */
/*jshint esversion: 6 */



console.log("=====================================================");
console.log("================BOT DISCORD PAR ONION================");
console.log("================     S.I.G.N.A.L     ================");
console.log("=====================================================");

const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require("fs");

const config = require("./conf_bot.json");
console.log("VERSION " + config.version);


var configuration = {};



//pour effet de scene
var stopmaj = false;


const appel = "$";

//var msg_count=0;



var Channel_log;
var Channel_radio;
var nom_serveur;




//const CLEF_PROG = "clefdeprog";



//creation du client
client.login(config.TOKEN);
//debug
client.on('debug', data_debug => {
    if(config.debug) console.log(dateToStringReduit(new Date()) + data_debug);
});
//erreur
client.on('error', err => dif_log("ERREUR client" + err[0]));


//init du bot
client.on('ready', () => {
    
    console.log(`Connecté !\nNom:${client.user.tag} client:${client.users.size} channels:${client.channels.size} serveur:${client.guilds.size}`);
    client.user.setActivity("capter (" + appel.toString() + "help)");
    dif_log("=> Le bot Signal vient d'être lancé");
    dif_log(`Connecté !\nNom:${client.user.tag} client:${client.users.size} channels:${client.channels.size} serveur:${client.guilds.size}`);

    

    //application de la configuration
    dif_log("Reconfiguration de signal...");
    try {
        configuration = JSON.parse(fs.readFileSync('conf_signal.json', 'utf8'));
        dif_log("Configuration précedente trouvée...");
        
    } catch (e) {
        dif_log("PARAMETRES INACCESSIBLE (voir terminal)\n Contactez Onion ! @everyone");
        console.error(e);
        process.exit(0);
    }
    
    
    
    nom_serveur=client.guilds.get(config.ID_serveur).name;

    //acq chan log & radio
    Channel_log = client.channels.get(config.ID_log);
    if (!Channel_log) console.error("Channel " + config.ID_log + " non existant !\n Il n'y aura donc pas de log et d'acces aux commandes ADMIN");


    // A FAIRE
    /*
    dif_log("Configuration:" +
        "\nNiveau brouillage: " + configuration.brouillage_caractere.toString() +
        "\nNiveau brouillage espace: " + configuration.brouillage_espace +
        "\nColoration: " + configuration.coloration.toString() +
        "\nAnonymisation: " + configuration.anonyme.toString() +
        "\nCryptage: " + configuration.cryptage.toString() +
        "\nActif: " + configuration.actif.toString() +
        "\nTaille maximum des messages: " + configuration.taille_max_msg.toString() +
        "\nID serveur: " + config.ID_serveur +
        "\nID channel:" +
        "\nLog: " + config.ID_log +
        "\nRadio: " + config.ID_radio
    );*/


    Channel_radio = client.channels.get(config.ID_radio);
    if (!Channel_radio) {
        console.error("Channel " + config.ID_radio + " non existant !\n Il n'y a pas de channel radio, signal va donc se terminer...");
        process.exit(0);
    }

    //en cas de crash
    cleanup(Channel_radio);




    //Simulation d'écriture relancer toutes les heures sinon beug
    try {
        Channel_radio.startTyping();
    } catch (error) {
        console.error(error);
    }
    setInterval(function() {
        try {
            Channel_radio.startTyping();
        } catch (error) {
            console.error(error);
        }
    }, 360000);




});









//quand le bot voit message
client.on('message', msg => {


    if (msg.author.bot) return; //si bot 

    if (msg.type !== 'DEFAULT') return;

    if (msg.channel.id == config.ID_radio) msg.delete(); //suppr message directement si ecrit dans channel roleplay
    if (msg.channel.id != config.ID_radio & msg.channel.type != "dm" & msg.channel.id != config.ID_log & msg.content != "$help") return; //si pas RP/test et pas MP alors on s'en fout et pas help

    if (!configuration.actif & (msg.channel.id != config.ID_log & msg.author.id !== config.ID_admin)) { //commande $actif (desactivable depuis log ou Admin)
        msg.author.send("ERREUR!\nSignal est actuellement indisponible !");
        return;
    }

    //verifier si auteur est authentifié
    client.guilds.get(config.ID_serveur).fetchMember(msg.author).then(member => {
        //console.log(member.roles.size);

        //alerte intrusion

        if (member.roles.size <= 1 & msg.channel.id !== '560860521583214612' & msg.author.id !== config.ID_admin) { //permission @everyone ou nulle ET pas channel candidature et pas admin => alerte modo
            let log = "\nALERTE, intrusion du systeme signal par une personne non autorisée\n";
            log += "Auteur:" + msg.author.username + "\nChannel:" + msg.channel.name + "\nContenu:" + msg.cleanContent;
            dif_log(log);

            return;
        }



        //reach user
        let liste_utilisateur = JSON.parse(fs.readFileSync('utilisateur.json', 'utf8'));
        //resultat = inventaire.find( fruit => fruit.nom === 'cerises');
        let utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === msg.author.id); //trouver l'utilisateur qui à ce role

        //si l'utilisateur n'existe pas, le créé
        if (utilisateur == undefined) {
            //console.log("banane====================")
            utilisateur = {};
            utilisateur.ID = msg.author.id;
            utilisateur.COULEUR = alea_couleur();
            utilisateur.bloque = false;

            liste_utilisateur.Utilisateurs.push(utilisateur);
            //console.log(utilisateur);
            fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));

            //message premiere utilisation
            msg.author.send("Bonjour, il semble que ce soit votre premiere utilisation de __signal__, n'oubliez pas de consulter l'aide ($help) et de configurer votre couleur de message avec $aidecouleur");
        } else {

            if (utilisateur.bloque) {
                msg.author.send(":warning: Il semblerait que vous soyez bloqué par signal... Contactez un administrateur pour plus d'informations.");
                return;
            }

        }




        if (msg.content.indexOf(appel) !== 0) { //si ne commence pas par le caractere d'appel



            if (msg.channel.id == config.ID_radio | msg.channel.type !== "text") { //si poste dans channel roleplay ou en pm sans caractere d'appel

                if (configuration.taille_max_msg === 0) { //si sur serveru avec limitation caractere

                    if (msg.content.length > 1500) {
                        msg.author.send("Ton message est tres long (il fait plus de 1500 caracteres)\nDiscord limite la taille de mes message à 2000 caracteres, je vais donc l'envoyer en 2 partis pour eviter les problèmes avec le brouillage.");
                        Send_Message(msg, msg.content.slice(0, msg.content.length / 2) + "....", utilisateur, member,  false);
                        Send_Message(msg, "...." + msg.content.slice(msg.content.length / 2, msg.content.length), utilisateur, member,  false);
                    } else {
                        Send_Message(msg, msg.content, utilisateur, member, false);
                    }

                } else { //si limitation
                    if (msg.content.length > configuration.taille_max_msg) {
                        msg.author.send("Ton message est tres long (il fait plus de " + configuration.taille_max_msg.toString() + " caracteres), il ne sera donc pas envoyé.\nLe serveur qui heberge signal limite le nombre de caracteres");
                    } else {
                        Send_Message(msg, msg.content, utilisateur, member,  false);
                    }
                }

            }
            return;
        }


        //mise en ordre des arguments/commande
        const args = msg.content.slice(appel.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        //console.log("message de: "+msg.author.username);
        //ICI TAPER COMMANDE


        //si demande de brouillage volontaire
        /*
        if (command === "brouiller") {

            if (isNaN(args[0]) | isNaN(args[1])) {
                msg.author.send("Erreur d'utilisation de la commande `$brouiller`...");
                return;
            }

            let niveau_brouillage_espace_user = parseInt(args[0]);
            let niveau_brouillage_caractere_user = parseInt(args[1]);
            let text = msg.content.slice(msg.content.indexOf(args[2]));

            //console.log("brouillage: " + niveau_brouillage_espace_user + " " + niveau_brouillage_caractere_user);

            if (configuration.taille_max_msg === 0) { //si sur serveur avec limitation caractere

                if (msg.content.length > 1500) {
                    msg.author.send("Ton message est tres long (il fait plus de 1500 caracteres)\nDiscord limite la taille de mes message à 2000 caracteres, je vais donc l'envoyer en 2 partis pour eviter les problèmes avec le brouillage.");
                    Send_Message(msg, msg.content.slice(0, msg.content.length / 2) + "....", utilisateur, member, false);
                    Send_Message(msg, "...." + msg.content.slice(msg.content.length / 2, msg.content.length), utilisateur, member, false);
                } else {
                    Send_Message(msg, text, utilisateur, member,  false, undefined, niveau_brouillage_espace_user, niveau_brouillage_caractere_user);
                }

            } else { //si limitation
                if (msg.content.length > configuration.taille_max_msg) {
                    msg.author.send("Ton message est tres long (il fait plus de " + configuration.taille_max_msg.toString() + " caracteres), il ne sera donc pas envoyé.\nLe serveur qui heberge signal limite le nombre de caracteres");
                } else {
                    Send_Message(msg, text, utilisateur, member, false, undefined, niveau_brouillage_espace_user, niveau_brouillage_caractere_user);
                }
            }





        }
        */



        if (command === "ping") {
            msg.reply("Signal est activé");
            return;
        }


        if (command === "help" | command === "aide") {

            //https://paypal.me/pools/c/8mowOxex8i
            embed_aide(msg.author);

            if (msg.channel.type === "text") {
                msg.channel.send(new Discord.RichEmbed()
                    .setTitle("__Aide__")
                    .setDescription("Envoie de l'aide par message privé")
                    .setColor('#1cfc03')
                    .setTimestamp()
                    .setAuthor("Signal", client.user.avatarURL)
                ).then(m => m.delete(4000));
            }
            return;
        }


        if (command === "aidecouleur") {
            const embed = {
                "title": "__**SIGNAL**__",
                "description": "Bienvenue dans l'aide couleur du bot Signal\nPour modifier la couleur des messages, il faut taper ```$couleur``` suivit du code hexadecimal de la couleur de ton choix\nExemple:```$couleur #ff33da```coloriera votre message en **rose**",
                "color": 16312092,
                "timestamp": new Date(),
                "footer": {
                    "icon_url": client.user.avatarURL,
                    "text": "Par Onion² pour " + nom_serveur
                },
                "thumbnail": {
                    "url": client.user.avatarURL
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
            msg.author.send({ embed });
            if (msg.channel.type === "text") {
                msg.channel.send(new Discord.RichEmbed()
                    .setTitle("__Aide__")
                    .setDescription("Envoie de l'aide par message privé")
                    .setColor('#1cfc03')
                    .setTimestamp()
                    .setAuthor("Signal", client.user.avatarURL)
                ).then(m => m.delete(4000));
            }
            return;
        }




        if (command === "del") {
            if (utilisateur.DERMSG == undefined) {
                msg.author.send("Aucun message enregistré...");
                return;
            }
            //let Channel_radio = client.channels.get(config.ID_radio);
            Channel_radio.fetchMessage(utilisateur.DERMSG).then(message_sup => {
                message_sup.delete();

                dif_log("=>Suppression demandée du dernier message de " + msg.author.username);

                msg.author.send("Le message a été supprimé");
                if (msg.channel.type === "dm") {
                    msg.react("✅");
                    msg.react("♻️");
                }
            }).catch(err => {
                msg.author.send("Il semble y avoir un problème, le message ne peut pas être supprimé (message éxpiré ou déjà supprimé)");
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
                Send_Message(msg, content, utilisateur, member,  true, clef);
            } else {
                msg.author.send("Le cryptage est actuellement interdit sur le canal transmission. (voir avec les administrateurs de " + nom_serveur + ")\n```" + msg.cleanContent + "```");
            }
            return;
        }


        if (command === "decrypt") {
            if (msg.channel.type === "text") msg.delete(); //si dans chan textuel
            if (args.length > 1) {
                let key = args[0];
                let text = msg.content.slice(appel.length + "decrypt ".length + key.length + 1);
                new_text = decrypt(text, key);
                //console.log(new_text);
                //new_text = decrypt(new_text, CLEF_PROG);

                dif_log("Tentative de decryptage de " + msg.author.username + "\nMessage crypté: " + text + "\nClef: " + key + "\nResultat: " + new_text);

                msg.author.send("Message décodé 🔐 :\n" + "```" + new_text + "```");
                if (msg.channel.type !== "text") {
                    msg.react("🔐");
                } else {
                    //msg.author.send("🔐");
                    msg.author.send("Évite de taper ce genre de commande dans un channel textuel !\nLa prochaine fois, envoie la moi directement par mp...");
                }
            } else {
                if (msg.channel.type !== "text") { msg.react("🚫"); } else { msg.author.send("🚫"); }
                msg.author.send("Il y a une erreur, tapez $help pour plus d'informations");
                msg.author.send("```" + msg.content + "```");
            }
            return;
        }


        if (command === 'signal') {
            msg.author.send("La commande $signal est maintenant obsolète, veuillez vous référer à l'aide ($help)");
            msg.react("🚫");
            if (msg.channel.type === "text") msg.delete();
            return;
        }


        if (command === 'couleur') {
            //#a85a32
            if (args[0] == undefined) {
                msg.author.send("Pas d'argument, une couleur aléatoire vous est donc attribuée");
                args[0] = alea_couleur();
            } else {
                if (args[0].length !== 7) {
                    msg.author.send("Erreur, argument incorrect... Se référer à $help");
                    return;
                }
                if (args[0].slice(0, 1) != '#') {
                    msg.author.send("Erreur, argument incorrect... Se référer à $help");
                    return;
                }
            }

            try {
                let embed = new Discord.RichEmbed().setColor(args[0])
                    .setTitle('Couleur définie sur ' + args[0])
                    .addField("Couleur précedente " + utilisateur.COULEUR, "🎨");
                msg.author.send(embed);
            } catch (error) {
                msg.author.send("Erreur, argument incorrect... Se référer à $help");
                return;
            }
            //ecrire couleur dans utilisateur
            utilisateur.COULEUR = args[0];
            // indice = fruits.findIndex(fruit => fruit === "fraise");

            update_user(msg.author.id, utilisateur);


            return;
        }
        if (command === 'macouleur') {

            let embed = new Discord.RichEmbed().setColor(utilisateur.COULEUR)
                .setTitle('Votre couleur est ' + utilisateur.COULEUR);
            msg.author.send(embed);

            return;
        }





        if (command == "credit") {
            let embed_credit = new Discord.RichEmbed()
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
                let embed_signal = new Discord.RichEmbed()
                    .setColor(1)
                    .setTimestamp()
                    .setTitle("Aide admin")
                    .setDescription("Commande uniquement utilisable sur ce channel\n*Il vaut mieux demander à Onion avant de faire n'importe quoi*")
                    .addBlankField()
                    .addField("$log", "Envoie le fichier de log")
                    .addField("$etat", "Affiche l'état du réseau signal")
                    .addField("$actif", "Active ou desactive signal")
                    .addField("$anonyme", "Anonymise ou n'anonymise pas les messages")
                    .addField("$coloration", "Impose les Jaune ou laisse les couleurs personnalisées")
                    .addField("$fichier", "Active/desactive l'envoie de fichier (hors audio)")
                    .addField("$audio", "Active/desactive l'envoie de fichier audio")
                    .addField("$crash", "Fait crasher Signal NE PAS UTILISER")
                    .addField("$difhelp", "Diffuse l'aide sur le canal radio")
                    .addField("$cleanup", "Supprime ou re-ordonne la supression future des messages qui n'ont pas été supprimé dans les temps")
                    .addField("$admin", "Permet de diffuser un message d'administrateur")
                    .addField("$setbrouillage X >BLABLA image", "Modifie le brouillage\nX: X% de carracteres brouillés (defaut: 0, pas de brouillage)\n BLABLA: raison du brouillage (optionnel)\nimage: petite image (optionnel)\nDifferents niveaux: [;25[,[25;15[,[15;7[,[7;1]")
                    .addField("$setbrouillageespace X ", "Modifie la chance d'avoir des \"krssssh\"\nX: X% d'espaces transformés")
                    .addField("$setbrouillagecouleur X ", "Pour le brouillage des couleurs... Je sais pas expliquer, mais 80 donne +/-40 /255 de brouillage RGB (je sais c'est pas claire)")
                    .addField("$ban X ", "Ban quelqu'un de signal\nX: mention de l'utilisateur à bannir")
                    .addField("$unban X ", "Unban quelqu'un de signal\nX: mention de l'utilisateur à unbannir")
                    .addField("$listeban", "Envoie la liste des bannis")
                    .addField("$delaidel X", "Modifie la durée des message\nX: durée en ms")
                    .addField("$cryptage", "Active ou desactive la commande $crypt")
                    .addBlankField()
                    .addField("Commandes EVENT", "Laissez Onion faire, assez complexe:\n$maj | $stopmaj | $mise_en_route")
                    .setFooter("Par Onion² pour " + nom_serveur);
                msg.channel.send(embed_signal);
                return;

            }

            if (command == "etat") {
                let embed_signal = new Discord.RichEmbed()
                    .setColor(1)
                    .setTimestamp()
                    .setTitle("Etat du programme")
                    .setDescription("Voici les differents parametres de signal");

                if (configuration.brouillage_caractere == 0) embed_signal.addField("Brouillage (caractere)", "__désactivée__");
                else embed_signal.addField("Brouillage (caractere)", configuration.brouillage_caractere.toString() + "%");

                if (configuration.brouillage_espace == 0) embed_signal.addField("Brouillage (espace)", "__désactivée__");
                else embed_signal.addField("Brouillage (espace)", configuration.brouillage_espace.toString() + "%");

                if (configuration.brouillage_couleur == 0) embed_signal.addField("Brouillage (couleur)", "__désactivée__");
                else embed_signal.addField("Brouillage (couleur)", configuration.brouillage_couleur.toString()+"/255");

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


                embed_signal.addField("Nombre d'utilisateur avec profile couleur", liste_utilisateur.Utilisateurs.length);

                //embed_signal.addField("Nombre de message depuis la derniere mise en route:", msg_count.toString());

                embed_signal.addField("Ping moyen/actuel", client.ping.toFixed(0).toString() + "ms/" + client.pings[0].toString() + "ms");

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
                let embed_admin = new Discord.RichEmbed();
                embed_admin.setAuthor(member.user.username, msg.author.avatarURL)
                    .setColor("#ff0000")
                    .setDescription(msg.content.slice(appel.length + 6))
                    .setTimestamp();

                //let Channel_radio = client.channels.get(config.ID_radio); //test: 597466263144366140
                //if (!Channel_radio) return console.error("Channel " + ID + " non existant !");

                Channel_radio.send(embed_admin).then(sent => { // 'sent' est le message envoyé
                    sent.delete(configuration.duree_messsage);
                    msg.react("✅");
                });
                return;

            }





            if (command == "mise_en_route") {

                /*
                Channel_radio = client.channels.get(config.ID_radio); //test: 597466263144366140
                if (!Channel_radio) return console.error("Channel " + ID + " non existant !");*/

                Channel_radio.send("```Etablissement de la liaison... 0%```").then((msg) => {
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%```"); }, 1500);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...```"); }, 3000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%```"); }, 4500);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !```"); }, 5000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!```"); }, 7000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!```"); }, 10000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!```"); }, 15000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%```"); }, 16000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%\nInitialisation des liaisons numeriques..OK!```"); }, 18000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%\nInitialisation des liaisons numeriques..OK!\n\n\n```"); }, 18000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%\nInitialisation des liaisons numeriques..OK!\n\n\n\n====BIENVENUE SUR PROGRAMME====```"); }, 20000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%\nInitialisation des liaisons numeriques..OK!\n\n\n\n====BIENVENUE SUR PROGRAMME====\n==========S.I.G.N.A.L==========\n==========Version 2.3==========```"); }, 20000);
                    setTimeout(function() { msg.edit("```Etablissement de la liaison... 0%\n...46%\n76%...\n...100%\nLiaison établie !\nIntilialisation du cryptage.............OK!\nIntilialisation du décryptage...........OK!\nIntilialisation de la démodulation......FAIL!\n!Test->Integrité de la démodulation.....73%\nInitialisation des liaisons numeriques..OK!\n\n\n\n====BIENVENUE SUR PROGRAMME====\n==========S.I.G.N.A.L==========\n==========Version 2.3==========\nEntrez votre commande:\n>>```"); }, 22000);

                });
                return;

            }



            if (command == "log") {
                msg.react("📄");
                msg.channel.send("Voici les logs:", { files: ["signal.log"] });
                return;
            }

            //commande event
            if (command == "maj") {
                maj();
                return;

            }
            if (command == "stopmaj") {
                stopmaj_f();
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
                if (configuration.cryptage) {
                    msg.channel.send("Cryptage autorisé");
                    return;
                }
                msg.channel.send("Cryptage interdit");

            }

            if (command == "actif") {
                configuration.actif = !configuration.actif;
                if (configuration.actif) {
                    msg.channel.send("Signal est maintenant __actif__");
                    return;
                } else {
                    msg.channel.send("Signal n'est maintenant __plus actif__");
                }

            }

            if (command == "coloration") {
                configuration.coloration = !configuration.coloration;
                if (configuration.coloration) {
                    msg.channel.send("Les couleurs seront maintenant __personnalisable__");
                    return;
                }
                msg.channel.send("Tout sera maintenant en __Jaune__");

            }

            if (command == "fichier") {
                configuration.fichier = !configuration.fichier;
                if (configuration.fichier) {
                    msg.channel.send("Les utilisateurs peuvent maintenant envoyer des fichiers (hormis audio)");
                    return;
                }
                msg.channel.send("Les utilisateurs ne peuvent plus envoyer de fichiers (hormis audio)");
            }

            if (command == "audio") {
                configuration.audio = !configuration.audio;
                if (configuration.audio) {
                    msg.channel.send("Les utilisateurs peuvent maintenant envoyer des fichiers audios (.mp3 / .wav)");
                    return;
                }
                msg.channel.send("Les utilisateurs ne peuvent plus envoyer de fichiers audio (.mp3 / .wav)");
            }

            if (command == "difhelp") {

                //https://paypal.me/pools/c/8mowOxex8i

                /*Channel_radio = client.channels.get(config.ID_radio); //test: 597466263144366140
                if (!Channel)_radio return console.error("Channel " + ID + " non existant !");*/
                embed_aide(Channel_radio);
                msg.react("✅");
                return;
            }

            if (command == "cleanup") {
                cleanup(Channel_radio);
                msg.react("✅");
            }

            if (command == "crash") {
                process.exit(0);

            }

            if (command == "ban") {
                //console.log(msg.mentions.users);
                let utilisateur;
                for (let [, mention] of msg.mentions.users) {
                    //console.log(mention);
                    utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === mention.id); //trouver l'utilisateur qui à ce nom

                    if (utilisateur == undefined) {
                        msg.channel.send(mention.username + " n'a pas de profile sur la base de donnée, ECHEC.");
                    } else {
                        utilisateur.bloque = true;
                        msg.channel.send("Ban de " + mention.username + " | ID: " + mention.id);
                    }


                }

                fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));
                return;
            }

            if (command == "unban") {
                //console.log(msg.mentions.users);
                let utilisateur;
                for (let [, mention] of msg.mentions.users) {
                    //console.log(mention);
                    utilisateur = liste_utilisateur.Utilisateurs.find(user => user.ID === mention.id); //trouver l'utilisateur qui à ce nom

                    if (utilisateur == undefined) {
                        msg.channel.send(mention.username + " n'a pas de profile sur la base de donnée, ECHEC.");
                    } else {
                        utilisateur.bloque = false;
                        msg.channel.send("Unban de " + mention.username + " | ID: " + mention.id);
                    }


                }

                fs.writeFileSync('utilisateur.json', JSON.stringify(liste_utilisateur, null, 2));
                return;
            }



            if (command == "listeban") {
                let listeban = liste_utilisateur.Utilisateurs.filter(user => user.bloque === true);
                if (listeban.length == 0) {
                    msg.channel.send("Aucun utilisateur banni");
                } else {
                    msg.channel.send("Voici la liste:");
                    listeban.forEach(element => {
                        client.fetchUser(element.ID).then(
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



            if (command == "setbrouillageespace") { //$setbrouillageespace 25
                configuration.brouillage_espace = args[0];
                console.log("nouveau niveau de brouillage: " + configuration.brouillage_espace + "% des espaces seront brouillés");
                msg.react("✅");
            }

            if (command == "setbrouillagecouleur") { //$setbrouillageespace 25
                configuration.brouillage_couleur = args[0];
                console.log("nouveau niveau de brouillage pour la couleur: " + configuration.brouillage_couleur + "...");
                msg.react("✅");
            }


            if (command == "setbrouillage") { //$setbrouillage 0 >retablisssement de la ligne
                configuration.brouillage_caractere = args[0];
                console.log("nouveau niveau de brouillage: " + configuration.brouillage_caractere);


                if (args[1] != undefined) {
                    if (args[1].indexOf(">") == 0) { //si argument 2 commence par >, cad message
                        let embed_signal = new Discord.RichEmbed()
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


            fs.writeFileSync('conf_signal.json', JSON.stringify(configuration, null, 2)); //sauvegarde des modifications



        } //fin ID LOG


    }).catch(console.error); //fin fetch user


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


//FONCTION DE CRYPTAGE
//CODE VIGENERE => ALPHABET ASCII de 32 à 125 (93 lettres) => ` remplacé par ~
function crypter(text, clef) { //ascii 33-126 (on evacue les * qui peuvent faire beugué le truc-> 35 mais osef)
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
}


function decrypt(text, key) {
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


function dif_log(log_txt) {
    //log sur console

    let now = new Date();
    log_txt = "[" + now.getDate() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() + ";" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "]:" + log_txt;

    console.log(log_txt);

    //log dans fichier (fonction pour suppr ?)
    fs.appendFile("signal.log", log_txt, function(err) {
        if (err) return console.log(err);
        console.log("*"); //Log enregistre*\n");
    });

    if(config.MP_admin) client.users.get(config.ID_admin).send("```" + log_txt + "```");

    //log dans chan

    if (Channel_log != undefined) Channel_log.send("```" + log_txt + "```");



}


function randomTF(brouillage) {
    //console.log((Math.random() * 100) + " <= " + brouillage)
    return ((Math.random() * 100) <= brouillage);
}

function random(x) {
    return Math.floor(Math.random() * Math.floor(x));
}




async function Send_Message(msg, content, utilisateur, member, cryptage, clef){//, brouillage_utilisateur_espace, brouillage_utilisateur_caractere) {
    //msg_count++;

    let log = msg.author.username + ",";

    if (msg.channel.type == "text") log += msg.channel.name;
    else log += "MP";

    log = "ENV:" + log;
    log += "\n" + content + "\n";



    //envoie des fichiers:
    
    let listeFichier = [];
    if(configuration.fichier | configuration.audio){
        if (msg.attachments) { //si il y a des images attachés au message
            for (let [var1, var2] of msg.attachments) {
                //if(var2.filename.slice(-3))
                switch (var2.filename.slice(-4)) {
                    case ".mp3":
                    case ".wav":
                        if (configuration.audio) listeFichier.push(var2.url); //yes  recuperer les fichiers dans listeFichier
                        else msg.author.send("Vous ne pouvez pas envoyer le fichier audios "+var2.filename+" via le bot (reglage administrateur)");
                        break;
                
                    default:
                        if (configuration.fichier) listeFichier.push(var2.url); //yes  recuperer les fichiers dans listeFichier
                        else msg.author.send("Vous ne pouvez pas envoyer le fichier audios "+var2.filename+" via le bot (reglage administrateur)");
                        break;
                }  
            }
        }
    }

    /*
    let new_text;

    //si brouillage custom
    if (brouillage_utilisateur_espace != undefined) {
        //console.log("BLOP");
        //brouillage  calc
        let brouillage_espace_calc;
        if (configuration.brouillage_espace == 0) brouillage_espace_calc = brouillage_utilisateur_espace;
        else brouillage_espace_calc = Math.min(configuration.brouillage_espace, brouillage_utilisateur_espace);

        let brouillage_caractere_calc;
        if (configuration.brouillage_caractere == 0) brouillage_caractere_calc = brouillage_utilisateur_caractere;
        else brouillage_caractere_calc = Math.min(configuration.brouillage_caractere, brouillage_utilisateur_caractere);

        console.log("brouillage : " + brouillage_espace_calc + " " + brouillage_caractere_calc);

        new_text = brouiller(content, brouillage_espace_calc, brouillage_caractere_calc); //brouillage message


    } else { //sinon
        new_text = brouiller(content, configuration.brouillage_espace, configuration.brouillage_caractere); //brouillage message
    }*/




    let new_text = brouiller(content, configuration.brouillage_espace, configuration.brouillage_caracter); //brouillage message


    let embed_signal = new Discord.RichEmbed()
        .setTimestamp();
    
    if(listeFichier.length !=0) embed_signal.attachFiles(listeFichier);

    if (configuration.coloration) {
        //brouillage de le couleur
        embed_signal.setColor(brouilleCouleurHex(utilisateur.COULEUR,configuration.brouillage_couleur));

        //embed_signal.setColor(utilisateur.COULEUR);
    } else {
        embed_signal.setColor("#F8E71C");
    }


    if (!configuration.anonyme) { //event
        embed_signal.setAuthor(member.user.username, member.user.avatarURL);
    }


    //niveau de brouillage
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




    /*
    let Channel = client.channels.get(config.ID_radio); //test: 597466263144366140
    if (!Channel) return console.error("Channel " + ID + " non existant !");*/


    if (cryptage) {

        //new_text=crypter(new_text, CLEF_PROG);
        //console.log(new_text);

        new_text = crypter(new_text, clef); //affecter les cryptage à la modulation ?
        //console.log(new_text);
        //new_text = crypter(new_text, CLEF_PROG);


        log += "|cryptage(" + clef + ")|";

        embed_signal.setTitle("Message crypté reçu:")
            .setDescription("```" + new_text + "```")
            .setColor("#000000");

    } else {
        embed_signal.setDescription(new_text)
            .setTitle("Message reçu:");
    }



    Channel_radio.send(embed_signal).then(sent => { // 'sent' est le message envoyé
        if (msg.channel.type != "text") msg.react("📤").catch(err => dif_log("error 03 " + err));
        let id = sent.id;
        sent.delete(configuration.duree_messsage).catch(err => dif_log("error 02 " + err));
        //msg.author.send("Message envoyé !\n" + "```" + "Channel: " + sent.channel.name + "\nID: " + id + "\nContenu:\n" + new_text.replace("`", ".") + "```");
        utilisateur.DERMSG = id;
        update_user(msg.author.id, utilisateur);
    }).catch(err => dif_log("error 01 " + err));

    dif_log(log);

}



function update_user(id, utilisateur) {
    let data = JSON.parse(fs.readFileSync('utilisateur.json', 'utf8'));
    let i = data.Utilisateurs.findIndex(user => user.ID === id);
    data.Utilisateurs[i] = utilisateur;
    //et up !
    fs.writeFileSync('utilisateur.json', JSON.stringify(data, null, 2));
}

function alea_couleur() {
    //0 à 16777215
    let alea = random(16777215).toString(16);
    alea = '#' + alea;
    return alea;
}




//event

async function maj() {
    stopmaj = false;
    /*Channel = client.channels.get(config.ID_radio); //test: 597466263144366140
    if (!Channel) return console.error("Channel " + ID + " non existant !");*/
    Channel_radio.send("```...................```");
    Channel_radio.send("```>Lancement de la mise à jour de signal```");
    await sleep(1000);
    Channel_radio.send("```>Temps estimé....2Heures```");
    await sleep(1000);
    let m = await Channel_radio.send("```>0%...```");
    await sleep(1000);
    let i = 1;
    let j;
    let temp = "";
    while (i < 100 & !stopmaj) {

        temp = "";
        for (j = 0; j < 100; j = j + 4) {
            if (i > j) { temp += "#"; } else { temp += "-"; }
        }

        m.edit("```>" + i + "%...\n>" + temp + "```");
        await sleep(72000); //pour 2h

        i++;
    }


    if (stopmaj) return;
    m.edit("```>100%!```");
    await sleep(1000);
    Channel_radio.send("```...................```");
    Channel_radio.send("```>Installation compléte```");
}


async function stopmaj_f() {
    stopmaj = true;
    /*Channel = client.channels.get(config.ID_radio); //test: 597466263144366140
    if (!Channel) return console.error("Channel " + ID + " non existant !");*/
    Channel_radio.send("```...................```");
    Channel_radio.send("```>Mise à jour interompue```");
    await sleep(1000);
    Channel_radio.send("```>Alerte ! Corruption du systeme```");
    await sleep(1000);
    Channel_radio.send("```>Redemarrage en mode sans echec....```");
    await sleep(10000);
    Channel_radio.send("```>Signal redemarré avec succès !```");
}

//delai
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



function embed_aide(Channel) {
    let embed = {
        "title": "__**SIGNAL**__",
        "description": "Bienvenue dans l'aide du bot Signal\n\n",
        "color": 16312092,
        "timestamp": new Date(),
        "footer": {
            "icon_url": client.user.avatarURL,
            "text": "Par Onion² pour " + nom_serveur
        },
        "thumbnail": {
            "url": client.user.avatarURL
        },
        "fields": [{
                "name": "__Envoyer un message anonymement__",
                "value": "**Pour envoyer un message anonymement sur le channel Transmission, envoyez un message privé au BOT (MP)**"
            },
            {
                "name": "__Utiliser le cryptage__",
                "value": "Pour crypter un message avec un clef de chiffrement, tapez:\n```$crypt clef message```\nAvec **__clef__**: votre clef de chiffrement (mot de passe)\n:warning: Votre clef de cryptage ne doit pas contenir d'espace !\n:warning: Le code n'est pas incraquable, il s'agit d'un code vigenere adapté\nhttps://fr.wikipedia.org/wiki/Chiffre_de_Vigen%C3%A8re"
            },
            {
                "name": "__Utiliser le décryptage__",
                "value": "Pour utiliser l'outil de décryptage, tapez:\n```$decrypt clef message_crypté```\nAvec **__clef__**: votre clef de chiffrement du message (mot de passe)"
            },
            {
                "name": "__Modifier la couleur de son message__",
                "value": "Pour obtenir de l'aide sur la couleur des message, tapez:\n```$aidecouleur```\nPour simplement changer sa couleur, tapez:\n```$couleur```"
            },
            /*{
                "name": "__Brouiller son message__",
                "value": "Pour brouiller son message, tapez:\n```$brouiller X Y message```\nX% de caractères brouillés, Y% d'espace brouillés"
            },*/
            {
                "name": "Donation",
                "value": "Signal est entierement gratuit, mais vous pouvez faire un don sur ce lien\nhttps://paypal.me/pools/c/8mowOxex8i\nMerci énormément !"
            },
            {
                "name": "__Note__",
                //"value": ":paperclip: Vous pouvez envoyer n'importe quel fichier en l'attachant à votre commande\n:loudspeaker: Des suggestions ? Besoin d'aide ? Une version pour votre serveur ? Contactez onion#3562\n\n**$credit** pour plus d'informations"
                "value": ":loudspeaker: Des suggestions ? Besoin d'aide ? Une version pour votre serveur ? Contactez onion#3562\n\n**$credit** pour plus d'informations"
            }
        ]
    };
    Channel.send({ embed });
}



function dateToStringReduit(date){
    return "[" + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + ";" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]:";
}


//fonction couleur
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

function brouilleCouleurRGB(c,brouille){
    let new_c=c+ parseInt(brouille/2-random(brouille));
    if(new_c < 0) new_c=-new_c;
    if(new_c > 255) new_c=255-(new_c-255);
    return new_c;
}

function brouilleCouleurHex(couleur, brouille){
    let RGBCouleur=hexToRgb(couleur);
    RGBCouleur.r=brouilleCouleurRGB(RGBCouleur.r,brouille);
    RGBCouleur.g=brouilleCouleurRGB(RGBCouleur.g,brouille);
    RGBCouleur.b=brouilleCouleurRGB(RGBCouleur.b,brouille);
    return rgbToHex(RGBCouleur.r, RGBCouleur.g, RGBCouleur.b);
}



function cleanup(channel){
    let now = new Date();
    channel.fetchMessages()
    .then(messages =>{
        
        for (let [s, message] of messages) {


            if(message.embeds.length==0){
                message.delete();
            }else{


                if(message.embeds[0].title!=="__**SIGNAL**__"){ //si ce n'est pas l'aide

                    let date_mes=new Date(message.createDTimestamp);
                    if(now-date_mes > configuration.duree_messsage){
                        message.delete().catch(err => dif_log("error cleanup : Rien de grave !"));
                    }else{
                        message.delete(configuration.duree_messsage-(now-date_mes)).catch(err => dif_log("error cleanup : Rien de grave !"));
                    }
                }
            }

        }
        
    })
    .catch(console.error);
}


/*

Channel_radio.fetchMessage(utilisateur.DERMSG).then(message_sup => {
                message_sup.delete();



*/