#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/*jshint node: true */
/*jshint esversion: 8 */
/* jshint strict: false */

module.exports = {

    //efface les messages trop vieux ou parasite
    //ne pas toucher, ça marche et c'est le principale...
    cleanup: (channel, age) => {
        channel.messages.fetch({ limit: 1 }) //premier message pour ref
            .then(async mesgs => {

                for (let [s, mesg] of mesgs) { //boule executer une seule fois
                    let idtemp = mesg.id; //dernier message envoyé sur le chan
                    let count_message = 100;
                    cleanupMessage(mesg, age); //suppr du premier message originel

                    while (idtemp != -1 & count_message >= 100) { //tant que pas le truc => ou plus de message ?
                        console.log("Cleanup !");

                        await channel.messages.fetch({ limit: 100, before: idtemp }).then(messages => { //100 par 100 max
                            count_message = 0;
                            for (let [s, message] of messages) {
                                count_message++;
                                idtemp = cleanupMessage(message, age);
                            }
                        }).catch(console.error);

                    }
                }

            }).catch(console.error);

    }

};

function cleanupMessage(message, age) {
    let now = new Date();

    if (!message.author.bot) { //suppr tout message non embed et provennant pas d'un bot (pour image) message.embeds.length == 0 | 
        message.delete();
    } else {
        if (age != 0) { //si la supression est activé
            //console.log(message);
            if (message.embeds.length != 0)
                if (message.embeds[0].title == "__**SIGNAL**__") return -1; //si ce n'est pas l'aide
            if (now.getTime() - message.createdTimestamp > age) {
                message.delete().catch(err => {});
            } else {
                message.delete({ timeout: (age - (now.getTime() - message.createdTimestamp)) }).catch(err => {});
            }
        }
    }
    return message.id;
}