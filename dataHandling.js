"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseHandling = exports.isAuthTokenValid = exports.setData = exports.getData = exports.getFeatureFlags = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
sqlite3_1.default.verbose();
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
    });
}
exports.getFeatureFlags = getFeatureFlags;
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield promises_1.default.readFile('data/data.json', { encoding: 'utf-8' }));
        return data;
    });
}
exports.getData = getData;
function setData(data) {
    let currentDate = new Date().toISOString();
    getData().then((currentData) => {
        currentData[currentDate] = data;
        let newData = JSON.stringify(currentData);
        promises_1.default.writeFile(`./data/data.json`, newData, { encoding: 'utf-8' }).then(() => {
            console.log("saved");
        });
    });
}
exports.setData = setData;
;
function isAuthTokenValid(token) {
    return true;
}
exports.isAuthTokenValid = isAuthTokenValid;
class DataBaseHandling {
    constructor() {
    }
    ;
    openDB() {
        let db = new sqlite3_1.default.Database(DataBaseHandling.filename, err => {
            if (err) {
                console.error("Database connection failed!");
                console.warn(err.name);
                console.warn(err.message);
            }
            else {
                console.log("Database connected successfully!");
            }
            ;
        });
        return db;
    }
    ;
    /**
     * Creates a new User in the database
     * @param username The Username
     * @param password The Password
     * @returns A promise, resolving to true if the insertion was successfull
     */
    createUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const insertSTMT = "INSERT INTO users (username, hash) VALUES (?, ?)";
            const hashedPassword = yield bcrypt_1.default.hash(password, DataBaseHandling.saltRounds);
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    const stmt = db.prepare(insertSTMT);
                    stmt.run(username, hashedPassword);
                    db.run(insertSTMT, [username, password]);
                    stmt.finalize((err) => {
                        db.close();
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
                db.close();
            });
        });
    }
    /**
     *
     * @param username The user provided username
     * @param password The user provided password
     * @returns A Promise resolving true, if the User is valid or false if not. Rejects with an error, if something went wrong
     */
    isUserValid(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const selectStmt = "SELECT username, hash FROM users WHERE username = ?";
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.get(selectStmt, [username], (err, row) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            reject(err);
                            db.close();
                            return;
                        }
                        if (!row) {
                            resolve(false);
                            db.close();
                            return;
                        }
                        ;
                        if (yield bcrypt_1.default.compare(password, row.hash)) {
                            resolve(true);
                            db.close();
                            return;
                        }
                        else {
                            resolve(false);
                            db.close();
                            return;
                        }
                    }));
                });
            });
        });
    }
    ;
    isAuthTokenKnown(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const selectStmt = "SELECT id FROM authTokens WHERE token=?";
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.get(selectStmt, [token], (err, row) => {
                        if (err) {
                            reject(err);
                            db.close();
                            return;
                        }
                        if (!row) {
                            resolve(false);
                            db.close();
                            return;
                        }
                        resolve(true);
                        db.close();
                    });
                });
            });
        });
    }
    ;
    generateNewAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const newToken = encodeURIComponent((0, uuid_1.v4)());
            console.log("Generating new Token...");
            return new Promise((resolve, reject) => {
                const db = this.openDB();
                const insertStmt = "INSERT INTO authTokens (token, insertDate) VALUES (?, ?)";
                db.serialize(() => {
                    db.run(insertStmt, [newToken, Date.now()], function (err) {
                        console.log("Token has been inserted into the database");
                        if (err) {
                            reject(err);
                            return;
                        }
                        ;
                        resolve(newToken);
                    });
                });
            });
        });
    }
    getContactMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const stmt = "SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages";
            let result = [];
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.each(stmt, (err, row) => {
                        if (err) {
                            console.error(err);
                        }
                        ;
                        if (row) {
                            result.push(row);
                        }
                        ;
                    }, (err, count) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        ;
                        resolve(result);
                    });
                });
            });
        });
    }
    ;
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
    newContactMessage(name, prename, email, topic, shortMsg, longMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(name, prename, email, topic, shortMsg, longMsg);
            const db = this.openDB();
            const stmt = "INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)";
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.run(stmt, [new Date().toISOString(), name, prename, email, topic, shortMsg, longMsg], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        ;
                        resolve(true);
                    });
                });
            });
        });
    }
}
exports.DataBaseHandling = DataBaseHandling;
DataBaseHandling.filename = "database.db";
DataBaseHandling.saltRounds = 10;
