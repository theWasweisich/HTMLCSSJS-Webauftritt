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
exports.isAuthTokenValid = isAuthTokenValid;
const promises_1 = __importDefault(require("node:fs/promises"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
sqlite3_1.default.verbose();
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        const feature__flags = JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
        return feature__flags;
    });
}
function isAuthTokenValid(token) {
    return true;
}
class DataBaseHandling {
    constructor() {
    }
    ;
    openDB() {
        let better_db = new better_sqlite3_1.default(DataBaseHandling.filename, { verbose: console.debug });
        better_db.pragma('journal_mode = WAL');
        return better_db;
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
            const stmt = db.prepare(insertSTMT);
            let info = stmt.run(username, hashedPassword);
            if (info.changes !== 1) {
                return false;
            }
            ;
            return true;
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
            const selectStmt = db.prepare("SELECT username, hash FROM users WHERE username = ?");
            const user = selectStmt.get(username);
            if (!user)
                return false;
            try {
                if (yield bcrypt_1.default.compare(password, user.hash)) {
                    return true;
                }
            }
            catch (e) {
                console.error(e);
                return false;
            }
            return false;
        });
    }
    ;
    isAuthTokenKnown(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const selectStmt = db.prepare("SELECT id FROM authTokens WHERE token=?");
            const answ = selectStmt.get(token);
            return answ !== undefined;
        });
    }
    ;
    generateNewAuthToken() {
        const newToken = encodeURIComponent((0, uuid_1.v4)());
        console.log("Generating new Token...");
        const db = this.openDB();
        const insertStmt = db.prepare("INSERT INTO authTokens (token, insertDate) VALUES (?, ?)");
        insertStmt.run(newToken, new Date().toISOString());
        return newToken;
    }
    getContactMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.openDB();
            const stmt = db.prepare("SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages");
            let data = stmt.all();
            return data;
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
            const stmt = db.prepare("INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)");
            const timestamp = new Date().toISOString();
            const dbResult = stmt.run(timestamp, name, prename, email, topic, shortMsg, longMsg);
            if (dbResult.changes === 1) {
                return true;
            }
            return false;
        });
    }
    deleteContactMessage(ids) {
        const db = this.openDB();
        const deleteStmt = db.prepare("DELETE FROM contactMessages WHERE id=?");
        for (const id of ids) {
            deleteStmt.run(id);
        }
        return true;
    }
    newProduct(name, description, image_url, image_alt, stats) {
        const db = this.openDB();
        const imgId = this.newImage(image_url, image_alt);
        const productInsertStmt = db.prepare("INSERT INTO products (name, description, image) VALUES (?, ?, ?)");
        let productres = productInsertStmt.run(name, description, imgId);
        if (productres.changes < 1) {
            throw new Error("Error during product insertion");
        }
        ;
        let productId = productres.lastInsertRowid;
        if (!stats) {
            return productId;
        }
        stats.forEach((stat) => {
            this.newStat(db, stat.name, stat.type, stat.value);
        });
        return productId;
    }
    getAllProducts() {
        const db = this.openDB();
        const productStmt = db.prepare("SELECT id, name, description, price, image FROM products;");
        const imageStmt = db.prepare("SELECT filename, alt FROM images WHERE id=?;");
        let products = [];
        let dbRes = productStmt.all();
        dbRes.forEach(function (value, index, array) {
            let row = value;
            let imgRes = imageStmt.get(row.image);
            products.push({
                id: row.id,
                title: row.name,
                description: row.description,
                price: row.price,
                image_filename: imgRes.filename,
                image_alt: imgRes.alt
            });
        });
        return products;
    }
    newStat(db, name, type, value) {
        const statInsertStmt = db.prepare("INSERT INTO stats (name, unit, value, product) VALUES (?, ?, ?, ?)");
        statInsertStmt.run(name, type, value);
    }
    newImage(filename, alt) {
        return __awaiter(this, void 0, void 0, function* () {
            // throw Error("Not implemented yet");
        });
    }
    uploadImage(image, filename, alt) {
        return __awaiter(this, void 0, void 0, function* () {
            // throw Error("Not implemented yet");
        });
    }
    updateProduct(id, title, description, price, image) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
            // throw Error("Not implemented yet");
        });
    }
}
exports.DataBaseHandling = DataBaseHandling;
DataBaseHandling.filename = "database.db";
DataBaseHandling.saltRounds = 10;
