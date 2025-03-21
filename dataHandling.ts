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
import sqlite3 from "sqlite3";
import bcrypt from 'bcrypt';


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
};

export function isAuthTokenValid(token: string) {
    return true;
}

const db = new sqlite3.Database(":memory:", err => {
    if (err) {
        console.error("Database connection failed!");
        console.warn(err.name);
        console.warn(err.message);
    } else {
        console.log("Database connected successfully!");
    }
});

class DataBaseHandling {
    static filename: string = ":memory:"
    static saltRounds: number = 10;

    constructor() {
    };
    
    private openDB(): sqlite3.Database {
        let db = new sqlite3.Database(DataBaseHandling.filename, err => {
            if (err) {
                console.error("Database connection failed!");
                console.warn(err.name);
                console.warn(err.message);
            } else {
                console.log("Database connected successfully!");
            };
        });
        return db;
    };

    /**
     * Creates a new User in the database
     * @param username The Username
     * @param password The Password
     * @returns A promise, resolving to true if the insertion was successfull
     */
    public async createUser(username: string, password: string) {
        const db = this.openDB();
        const insertSTMT = "INSERT INTO users (username, hash) VALUES (?, ?)";
        const hashedPassword = bcrypt.hash(password, DataBaseHandling.saltRounds);

        return new Promise<boolean>((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare(insertSTMT);
                stmt.run(username, hashedPassword);
                db.run(insertSTMT, [username, password])

                stmt.finalize((err) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        })

    }

    public async retrieveUserId(username: string) {
        const db = this.openDB();
        const selectStmt = "SELECT id FROM users WHERE username=?";

        return new Promise<number>((resolve, reject) => {
            const stmt = db.prepare(selectStmt);

            stmt.get((err, row) => {
                
            })
        })
    }
}