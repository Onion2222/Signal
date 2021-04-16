#!/usr/local/bin/node

//by onion²

//CC BY-NC-ND

/* jshint node: true */
module.exports = {
    stopmaj: false,

    maj: async(duree, chan) => {
        if (duree > 214748364700) {
            duree = 214748364700;
        }

        stopmaj = false;

        let message = await chan.send("```______________________```");
        //console.log(message)
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Lancement de la mise à jour de signal```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Temps estimé...." + parseInt(duree / 60000) + " minutes```");
        await sleep(1000);
        //let m = await chan.send("``` ```");
        //await sleep(1000);
        let i = 1;
        let j;
        let temp = "";
        content_clean = message.content.slice(0, -3);
        while (i < 100 & !stopmaj) {

            temp = "";
            for (j = 0; j < 100; j = j + 4) {
                if (i > j) { temp += "#"; } else { temp += "-"; }
            }

            await message.edit(content_clean + "\n" + ">" + temp + " | " + i + "%```");

            await sleep(duree / 100);

            i++;
        }

        if (stopmaj) return;

        for (j = 0; j < 100; j = j + 4) {
            if (i > j) { temp += "#"; } else { temp += "-"; }
        }
        message = await message.edit(content_clean + "\n" + ">" + temp + " | 1000% !```");


        //m.edit("```>100%!```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "______________________```");
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Installation complète```");
    },


    stopmaj_f: async(chan) => {
        stopmaj = true;
        /*Channel = client.channels.get(config.ID_radio); //test: 597466263144366140
        if (!Channel) return console.error("Channel " + ID + " non existant !");*/
        let message = await chan.send("```______________________```");
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Mise à jour interompue```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Alerte ! Corruption du systeme```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Redemarrage en mode sans echec....```");
        await sleep(10000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + ">Signal redemarré avec succès !```");
    },

    mise_en_route: async(chan, version) => {


        let message = await chan.send("```Etablissement de la liaison... 0%```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -5) + "46%```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -6) + "76%```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -6) + "100%!```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Liaison établie !```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Intilialisation du cryptage.............OK!```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Intilialisation du décryptage...........OK!```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Mesure de la réception réseau........Bonne```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Intilialisation du décryptage...........OK!```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "\n\n========BIENVENUE SUR LE PROGRAMME=========```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "================S.I.G.N.A.L================```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "================Version " + version + "================```");
        await sleep(1000);
        message = await message.edit(message.content.slice(0, -3) + "\n" + "Entrez votre commande:\n>>```");
    },




    //delai

};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}