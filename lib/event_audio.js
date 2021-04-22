#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */

const { CronJob } = require('../node_modules/cron');
const fs = require("fs");


class AudioEventsManager {
    constructor(path_to_json) {
        if (path_to_json) {
            this.audioEvents = [];
            this.path_to_json = path_to_json;
            //ajouter ceux present dans JSON
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8'));
            liste_audioEvents.Audio_events.forEach(event => {
                this.add(event, false);
            });
        }
    }
    add(event, write_to_json = false) {
        console.log("AUDIOEVENTMANAGER =>> ajout de " + JSON.stringify(event));

        this.audioEvents.push({
            name: event.name,
            cron: new CronJob(event.CronPeriodText, () => {
                console.log(event);
                play_audio(event.filename, event.nbChan, event.IDChans);
            }, null, true)
        });
        //ecrire dans json pour save
        if (write_to_json) {
            let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
            liste_audioEvents.Audio_events.push(event); //ajoute a l'array
            fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
        }
    }
    stop(name) {
        this.audioEvents.find(event => event.name == name).stop();
    }
    delete(name) {
        this.audioEvents.find(event => event.name == name).stop();
        this.audioEvents = this.audioEvents.filter(e => e.name !== name);
        //enelver du json
        //=>>
        let liste_audioEvents = JSON.parse(fs.readFileSync(this.path_to_json, 'utf8')); //recup le json actuel
        liste_audioEvents.Audio_events.filter(e => e.name !== name); //ajoute a l'array
        fs.writeFileSync(this.path_to_json, JSON.stringify(liste_audioEvents, null, 2)); //reecrie par dessus
    }
    list() {
        return this.audioEvents;
    }
    running(name) {
        return this.audioEvents.find(event => event.name == name).cron.running;
    }
    lastDate(name) {
        return this.audioEvents.find(event => event.name == name).cron.lastDate();
    }
    nextDates(name) {
        return this.audioEvents.find(event => event.name == name).cron.nextDates();
    }
}



module.exports.AudioEventsManager = AudioEventsManager;




function play_audio(file, nb_chan, ID_chans = []) {
    console.log(`play_audio |${file}|${nb_chan}|${ID_chans}|`);

}