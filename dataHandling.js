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
exports.DataBaseHandling = void 0;
exports.getFeatureFlags = getFeatureFlags;
exports.getData = getData;
exports.setData = setData;
exports.isAuthTokenValid = isAuthTokenValid;
const promises_1 = __importDefault(require("node:fs/promises"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
    });
}
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield promises_1.default.readFile('data/data.json', { encoding: 'utf-8' }));
        return data;
    });
}
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
;
function isAuthTokenValid(token) {
    return true;
}
const db = new sqlite3_1.default.Database(":memory:", err => {
    if (err) {
        console.error("Database connection failed!");
        console.warn(err.name);
        console.warn(err.message);
    }
    else {
        console.log("Database connected successfully!");
    }
});
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
            const hashedPassword = bcrypt_1.default.hash(password, DataBaseHandling.saltRounds);
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
            });
        });
    }
    retrieveUserId(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const selectStmt = "SELECT id FROM users WHERE username=?";
            return new Promise((resolve, reject) => {
                const stmt = db.prepare(selectStmt);
                stmt.get((err, row) => {
                });
            });
        });
    }
    ;
    isUserValid(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const selectStmt = "SELECT username, hash FROM users WHERE username = ?";
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    db.get(selectStmt, [username], (err, row) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            reject(err);
                        }
                        if (!row) {
                            resolve(false);
                        }
                        ;
                        if (yield bcrypt_1.default.compare(password, row.hash)) {
                            resolve(true);
                            return;
                        }
                        resolve(false);
                    }));
                });
            });
        });
    }
    ;
    isAuthTokenKnown(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const db = this.openDB();
                resolve(true);
            });
        });
    }
    ;
    generateNewAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const db = this.openDB();
                const insertStmt = "INSERT INTO ";
                resolve((0, uuid_1.v4)());
            });
        });
    }
}
exports.DataBaseHandling = DataBaseHandling;
DataBaseHandling.filename = ":memory:";
DataBaseHandling.saltRounds = 10;
