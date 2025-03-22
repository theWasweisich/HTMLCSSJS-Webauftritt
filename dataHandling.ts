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
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";

sqlite3.verbose();


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

export class DataBaseHandling {
    static filename: string = "database.db"
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
        const hashedPassword = await bcrypt.hash(password, DataBaseHandling.saltRounds);

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
            db.close();
        })
    }

    /**
     * 
     * @param username The user provided username
     * @param password The user provided password
     * @returns A Promise resolving true, if the User is valid or false if not. Rejects with an error, if something went wrong
     */
    public async isUserValid(username: string, password: string): Promise<boolean> {
        const db = this.openDB();
        const selectStmt = "SELECT username, hash FROM users WHERE username = ?";
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(selectStmt, [username], async (err, row: dbUsersRow) => {
                    if (err) { reject(err); db.close(); return; }
                    if (!row) { resolve(false); db.close(); return; };

                    if (await bcrypt.compare(password, row.hash)) {
                        resolve(true);
                        db.close();
                        return;
                    } else {
                        resolve(false);
                        db.close();
                        return;
                    }
                })
            })
        })
    };

    public async isAuthTokenKnown(token: string): Promise<boolean> {
        const db = this.openDB();
        const selectStmt = "SELECT id FROM authTokens WHERE token=?";
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(selectStmt, [token], (err, row) => {
                    if (err) { reject(err); db.close(); return }
                    if (!row) { resolve(false); db.close(); return }
                    resolve(true);
                    db.close();
                })
            })
        })
    };

    public async generateNewAuthToken(): Promise<string> {
        const newToken = encodeURIComponent(uuidV4());
        console.log("Generating new Token...")

        return new Promise((resolve, reject) => {
            const db = this.openDB();
            const insertStmt = "INSERT INTO authTokens (token, insertDate) VALUES (?, ?)";
            db.serialize(() => {
                db.run(insertStmt, [newToken, Date.now()], function (err) {
                    console.log("Token has been inserted into the database");
                    if (err) { reject(err); return };
                    resolve(newToken);
                })
            });
        })
    }
}