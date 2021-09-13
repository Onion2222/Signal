#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */
/*jshint esversion: 8 */
/* jshint strict: false */
//'use strict';

const { CronJob } = require('../node_modules/cron');
const fs = require("fs");
const { dif_log, get_corres_listeID_nom } = require('./util.js');



class AudioEventsManager {
    constructor(path_to_json, client, channel_log) {
        this.channel_log = channel_log;
        this.client = client;

        dif_log("AudioEventsManager", "Démarrage...", this.channel_log, this.client.user.avatarURL(), "#8630F3");

        if (path_to_json) {
            this.audioEvents = [];
            this.path_to_json = path_to_json;
            //ajouter ceux present dans JSON
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8'));
            liste_audioEvents.Audio_events.forEach(event => {
                this.add(event, false);
            });
        }

        play_file_attente();
    }

    /*format event
    
     {
            "nom": "test_entier",
            "nbChan": -1,
            "actif": false,
            "CronPeriodText": "50 * * * * *", 
            "IDChans": [
                "822181704386871326",
                "822182676261634118",
                "822182706715951164"
            ],
            "filename": "somebody_once.mp3",
            "nb_event": -1 //optionnel (pas implemanté)
    }
    
    */
    add(event, write_to_json = false) {
        //console.log("AUDIOEVENTMANAGER =>> ajout de " + JSON.stringify(event));
        dif_log("AudioEventsManager", `Ajout de ${event.nom}`, this.channel_log, this.client.user.avatarURL(), "#8630F3");
        //VALIDATEUR A METTRE EN PLACE A FAIRE
        let new_audioEvents = { nom: event.nom };

        if (event.CronPeriodText) { //si cron A FAIRE VALIDER CRON
            new_audioEvents.cron = new CronJob(event.CronPeriodText, () => {
                //console.log(event);
                play_audio(this.client, this.channel_log, event.filename, event.volume, event.nbChan, event.IDChans);
            }, null, event.actif);
        }
        //console.log(event.IDChans);
        this.audioEvents.push(new_audioEvents);
        //ecrire dans json pour save
        if (write_to_json) {
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
            liste_audioEvents.Audio_events.push(event); //ajoute a l'array
            fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
        }
        return 0;
    }
    stop(nom) { //a faire gestion erreur
        //Condition si pas deja actif !!! A FAIRE
        let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
        current_audioEvent.cron.stop();


        let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
        liste_audioEvents.Audio_events[liste_audioEvents.Audio_events.findIndex(el => el.nom === nom)].actif = false;
        fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
        return 0;
    }
    start(nom) { //a faire gestion erreur
        try {
            //Condition si pas deja actif !!! A FAIRE
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            current_audioEvent.cron.start();

            //mettre start dans json
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
            liste_audioEvents.Audio_events[liste_audioEvents.Audio_events.findIndex(el => el.nom === nom)].actif = true;
            fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
            return 0;

        } catch (error) {
            return error;
        }
    }
    delete(nom) {
        try {
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            current_audioEvent.cron.stop();
            this.audioEvents = this.audioEvents.filter(e => e.nom !== nom);

            //enlever du json
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
            liste_audioEvents.Audio_events = liste_audioEvents.Audio_events.filter(e => e.nom !== nom); //supprime de l'array
            fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
            return 0;
        } catch (error) {
            return error;
        }
    }
    list() {
        return this.audioEvents;
    }
    info(nom) { //redonne [0] l'objet audioevent & [1] la donnée enregistrée
        try {
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8'));
            let info_delai = this.audioEvents.find(event => event.nom == nom);
            let info_param = liste_audioEvents.Audio_events.find(event => event.nom == nom);
            if (!info_delai) return 1; //si ne trouve pas
            if (!info_param) return 2; //si ne trouve pas
            return [info_delai, info_param];
        } catch (error) {
            return undefined;
        }

    }
    running(nom) {
        try {
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            return current_audioEvent.cron.running;
        } catch (error) {
            return undefined;
        }
    }

    isNomDejaPris(nom) {
        let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
        if (current_audioEvent) return 1;
        else return 0;
    }
    getNext(nom, nb = 1) {
        try {
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            return current_audioEvent.cron.nextDates(nb);
        } catch (error) {
            return undefined;
        }
    }
    getLast(nom) {
        try {
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            return current_audioEvent.cron.lastExecution;
        } catch (error) {
            return undefined;
        }
    }
    getStateEmoji(nom) {
        try {
            let current_audioEvent = this.audioEvents.find(event => event.nom == nom);
            switch (current_audioEvent.cron.running) {
                case undefined: //pas demarré
                case false: //stoppé
                    return `🔴`;
                case true: //actif
                    return `🟢`;
                default: //erreur
                    return `⚠️`;
            }
        } catch (error) {
            return `?`;
        }
    }



}


//pour exporter
module.exports.AudioEventsManager = AudioEventsManager;

//La suite est plutot complexe:
/*
 * Une fonction de production (play_audio(...)) etablie une liste des chan et des fichiers qu'il faut jouer et l'ajoute dans une liste (file_attente_audio)
 * La fonction play_file_attente() consomme les données de file_attente_audio element par element.
 *
 * play_audio() {channel, fichier} => file_attente[] => {channel, fichier} play_file_attent() -> channel, fichier play()
 *
 * Ainsi quand plusieurs fichier doivent être joué en meme temps, la file d'attente les fait jouer l'un apres l'autre.
 *
 */


let file_attente_audio = [];
let consumerResolver = null;

async function play_audio(client, channel_log, file, volume, nb_chan, ID_chans = []) {

    //console.log(`play_audio |${file}|${nb_chan}|${ID_chans}|`); //log

    //recuperer liste des chan pour diffuser audio
    let chan_id_to_play = [...ID_chans]; //permet de cloner sinon modification sur clone = modif original
    if (nb_chan > 0) { //si nb de message audio limité
        while (chan_id_to_play.length > nb_chan) { //retirer aleatoirement des chan de la liste jusqu'a avoir suffisament de chan
            chan_id_to_play.splice(Math.floor(Math.random() * chan_id_to_play.length), 1);
        }
    }
    //console.log(ID_chans);
    //console.log(`-> Diffusion de ${file} sur les caneaux ${chan_id_to_play}`); //log
    dif_log("AudioEventsManager", `Diffusion de \`${file}\` sur le(s) canaux/canal \`${get_corres_listeID_nom(chan_id_to_play).toString()}\``, channel_log, client.user.avatarURL(), "#8630F3");

    let voiceChannel;
    //pour chaque chan ou il faut jouer l'audio
    for (let index = 0; index < chan_id_to_play.length; index++) {
        voiceChannel = client.channels.cache.get(chan_id_to_play[index]); //recuperer channel
        if (voiceChannel) { //si channel existe

            //let err = await play(voiceChannel, '../ressources/' + file); //jouer l'audio
            //await sleep(1000); //attendre (ne marche pas sinon)
            //console.log("FIN");
            file_attente_audio.push({ chan: voiceChannel, file: '../ressources/' + file, volume: volume });

            if (consumerResolver) {
                consumerResolver();
            }
        } else { //si n'existe pas
            console.log(`->erreur, pas de chan à cet ID: ${chan_id_to_play[index]}`); //log erreur
        }
    }

}

async function play_file_attente(channel_log) {
    while (true) {
        if (file_attente_audio.length === 0) {
            const producerPromise = new Promise((resolve) => {
                consumerResolver = resolve;
            });
            await producerPromise;
        }
        //console.log("file---" + file_attente_audio.length);
        if (file_attente_audio.length > 100) { //protection
            file_attente_audio.slice(0, 100);
            dif_log("AudioEventsManager", `File d'attente trop longue !`, channel_log, " ", "#8630F3");

        }
        consumerResolver = null;
        const data = file_attente_audio.shift();
        try {

            await play(data.chan, data.file, data.volume);
        } catch (error) {
            dif_log("AudioEventsManager", `ERREUR play !`, channel_log, " ", "#FF0000");
        }
        await sleep(1000); //attendre (ne marche pas sinon)
    }
}



async function play(voiceChannel, file, volume) {
    return new Promise(async(resolve, reject) => {

        const connection = await voiceChannel.join();
        const dispatcher = connection.play(require("path").join(__dirname, file), { volume: volume });


        dispatcher.on('start', () => {
            //console.log('audio start!');
        });

        dispatcher.on('finish', () => {
            connection.disconnect();
            //console.log('audio fini!');
            return resolve(1);
        });

        dispatcher.on('error', (err) => {
            connection.disconnect();
            console.log(file);
            console.log('erreur');
            return reject(err);
        });

    });


}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


/*
//mettre en class un jour A FAIRE
function IntervalTimer(callback, interval, run_at_start) {
    var timerId, startTime, remaining = 0;
    var state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed
    if (run_at_start) state = 1;
    this.stop = function() {
        if (state != 1) return;

        remaining = interval - (new Date() - startTime);
        clearInterval(timerId);
        state = 2;
    };

    this.start = function() {
        if (state != 2) return;

        state = 3;
        setTimeout(this.timeoutCallback, remaining); //permet de reprendre ou ça en etait
    };

    this.timeoutCallback = function() { //recrée e timer qui a ete restart
        if (state != 3) return;

        callback();

        startTime = new Date();
        timerId = setInterval(callback, interval);
        state = 1;
    };

    startTime = new Date();
    timerId = setInterval(callback, interval);
    state = 1;
} */





/*

class IntervalTimer {
    constructor(interval, callback, run_at_start = true) {
        this.remaining = 0;
        this.state = 1; //  0 = idle, 1 = running, 2 = paused, 3= resumed
        this.startTime = new Date();
        this.interval = interval;
        this.callback = callback;
        this.timerId = setInterval(this.callback, this.interval);

        if (!run_at_start) this.stop();

    }

    stop() {
        if (this.state != 1) return;

        this.remaining = this.interval - (new Date() - this.startTime);
        clearInterval(this.timerId);
        this.state = 2;
    }

    start() {
        if (this.state != 2) return;

        this.state = 3;
        setTimeout(this.timeoutCallback, this.remaining); //permet de reprendre ou ça en etait
    }
    timeoutCallback() { //recrée e timer qui a ete restart
        if (this.state != 3) return;

        callback();

        this.startTime = new Date();
        this.timerId = setInterval(this.callback, this.interval);
        this.state = 1;
    }

}

*/