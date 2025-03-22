interface dbUsersRow {
    id: number,
    username: string,
    hash: string
}

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
import Database from "better-sqlite3";
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";

sqlite3.verbose();


export async function getFeatureFlags(): Promise<FeatureFlags> {
    const feature__flags = JSON.parse(await fs.readFile('./feature__flags.json', { encoding: 'utf-8' }))
    return feature__flags;
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

export class DataBaseHandling {
    static filename: string = "database.db"
    static saltRounds: number = 10;

    constructor() {
    };

    private openDB(): Database.Database {
        let better_db = new Database(DataBaseHandling.filename, { verbose: console.debug });
        better_db.pragma('journal_mode = WAL');
        return better_db;
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
        const hashedPassword = await bcrypt.hash(password, DataBaseHandling.saltRounds);
        const stmt = db.prepare(insertSTMT);

        let info = stmt.run(username, hashedPassword);
        if (info.changes !== 1) { return false };
        return true;
    }

    /**
     * 
     * @param username The user provided username
     * @param password The user provided password
     * @returns A Promise resolving true, if the User is valid or false if not. Rejects with an error, if something went wrong
     */
    public async isUserValid(username: string, password: string): Promise<boolean> {
        const db = this.openDB();
        const selectStmt = db.prepare("SELECT username, hash FROM users WHERE username = ?");
        const user = selectStmt.get(username) as {username: string, hash: string};
        if (await bcrypt.compare(password, user.hash)) {
            return true;
        }
        return false;
    };

    public async isAuthTokenKnown(token: string): Promise<boolean> {
        const db = this.openDB();
        const selectStmt = db.prepare("SELECT id FROM authTokens WHERE token=?");

        const answ = selectStmt.get(token) as {id: number};

        return answ !== undefined;
    };

    public generateNewAuthToken(): string {
        const newToken = encodeURIComponent(uuidV4());
        console.log("Generating new Token...")
        const db = this.openDB();
        const insertStmt = db.prepare("INSERT INTO authTokens (token, insertDate) VALUES (?, ?)");
        insertStmt.run(newToken, new Date().toISOString());

        return newToken;
    }

    public async getContactMessages(): Promise<contactMessage[]> {
        const db = this.openDB();
        const stmt = "SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages";
        let result: Array<contactMessage> = [];

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.each(stmt, (err, row: contactMessage | undefined) => {
                    if (err) { console.error(err) };
                    if (row) { result.push(row) };
                }, (err, count) => {
                    if (err) { reject(err); return };
                    resolve(result);
                });
            });
        })
    };

    /**
     * 
     * @param name message data
     * @param prename message data
     * @param email message data
     * @param topic message data
     * @param shortMsg message data
     * @param longMsg message data
     * @returns Promise resolves to true when insertion was successfull, or rejects with the given error
     */
    public async newContactMessage(
        name: string,
        prename: string,
        email: string,
        topic: string,
        shortMsg: string,
        longMsg: string) {
        // console.log(name, prename, email, topic, shortMsg, longMsg);
        const db = this.openDB();
        const stmt = "INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)";

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(stmt, [new Date().toISOString(), name, prename, email, topic, shortMsg, longMsg], (err) => {
                    if (err) { reject(err); return; };
                    resolve(true);
                })
            })
        })
    }

    public async newProduct(
        name: string,
        description: string,
        image_url: string,
        image_alt: string,
        stats?: {
            name: string,
            type: string,
            value: string | number
        }[]
    ) {
    }

    private newImage(filename: string, alt: string) {
        const db = this.openDB();
    }
}