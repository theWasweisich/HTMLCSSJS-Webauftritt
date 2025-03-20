export interface FeatureFlags {
    accept_kontakt_msgs: {
        /**
         * Ob der Server eingehende Kontaktformulare annimt
         */
        serverAccept: boolean
        /**
         * Ob der Server eingehende Kontaktformulare auch abspeichert
         */
        serverSave: boolean
    }
}

import fs from "node:fs/promises";

export async function getFeatureFlags(): Promise<FeatureFlags> {
    return JSON.parse(await fs.readFile('./feature__flags.json', { encoding: 'utf-8' }));
}

export async function getData() {
    let data = JSON.parse(await fs.readFile('data/data.json', { encoding: 'utf-8' })) 
    return data;
}

export function setData(data: object) {
    let currentDate = new Date().toISOString();
    getData().then((currentData) => {

        currentData[currentDate] = data;

        let newData = JSON.stringify(currentData);
        fs.writeFile(`./data/data.json`, newData, { encoding: 'utf-8' }).then(() => {
            console.log("saved");
        });
    });
}