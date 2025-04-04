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
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        const feature__flags = JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
        return feature__flags;
    });
}
function isAuthTokenValid(token) {
    return true;
}
/**
 * The Class for all Data handling activities
 */
class DataBaseHandling {
    constructor() {
        this.db = this.openDB();
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
            const insertSTMT = "INSERT INTO users (username, hash) VALUES (?, ?)";
            const hashedPassword = yield bcrypt_1.default.hash(password, DataBaseHandling.saltRounds);
            const stmt = this.db.prepare(insertSTMT);
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
            const selectStmt = this.db.prepare("SELECT username, hash FROM users WHERE username = ?");
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
            const selectStmt = this.db.prepare("SELECT id FROM authTokens WHERE token=?");
            const answ = selectStmt.get(token);
            return answ !== undefined;
        });
    }
    ;
    generateNewAuthToken() {
        const newToken = encodeURIComponent((0, uuid_1.v4)());
        console.log("Generating new Token...");
        const insertStmt = this.db.prepare("INSERT INTO authTokens (token, insertDate) VALUES (?, ?)");
        insertStmt.run(newToken, new Date().toISOString());
        return newToken;
    }
    getContactMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const stmt = this.db.prepare("SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages");
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
            const stmt = this.db.prepare("INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)");
            const timestamp = new Date().toISOString();
            const dbResult = stmt.run(timestamp, name, prename, email, topic, shortMsg, longMsg);
            if (dbResult.changes === 1) {
                return true;
            }
            return false;
        });
    }
    deleteContactMessage(ids) {
        const deleteStmt = this.db.prepare("DELETE FROM contactMessages WHERE id=?");
        for (const id of ids) {
            deleteStmt.run(id);
        }
        return true;
    }
    newProduct(name, description, image_url, image_alt, stats) {
        const imgId = this.insertNewImage(image_url, image_alt);
        const productInsertStmt = this.db.prepare("INSERT INTO products (name, description, image) VALUES (?, ?, ?)");
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
            this.newStat(stat.name, stat.type, stat.value);
        });
        return productId;
    }
    getAllProducts() {
        const productStmt = this.db.prepare("SELECT id, name, description, price, image FROM products;");
        const imgAltStmt = this.db.prepare("SELECT alt FROM images WHERE id=?");
        let products = [];
        let dbRes = productStmt.all();
        dbRes.forEach((value, index, array) => {
            let row = value;
            let imgRes = imgAltStmt.get(row.image);
            let stats = this.getStatsOfProduct(row.id);
            products.push({
                id: row.id,
                title: row.name,
                description: row.description,
                price: row.price,
                img_alt: imgRes.alt,
                stats: stats
            });
        });
        return products;
    }
    ;
    getProductImagePath(id) {
        console.log("Trying to get image for id " + String(id));
        const getImgIdStmt = this.db.prepare("SELECT image FROM products WHERE id=?");
        const getImgPathStmt = this.db.prepare("SELECT filename FROM images WHERE id=?");
        let imgId = getImgIdStmt.get(id.toFixed(0)).image;
        console.log(`The image id is ${imgId}`);
        let imgFileNameRow = getImgPathStmt.get(imgId.toFixed(0));
        let imgFileName = imgFileNameRow.filename;
        return imgFileName;
    }
    newStat(name, type, value) {
        const statInsertStmt = this.db.prepare("INSERT INTO stats (name, unit, value, product) VALUES (?, ?, ?, ?)");
        statInsertStmt.run(name, type, value);
    }
    getStatsOfProduct(productId) {
        const getStatsStmt = this.db.prepare("SELECT name, unit, value FROM stats WHERE product=?");
        var statsOfProduct = [];
        const resultRows = getStatsStmt.all(productId);
        resultRows.forEach((value, index, array) => {
            statsOfProduct.push({
                name: value.name,
                unit: value.unit,
                value: value.value
            });
        });
        return statsOfProduct;
    }
    ;
    insertNewImage(filename, alt) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertStmt = this.db.prepare("INSERT INTO images (filename, alt) VALUES (?, ?)");
            let runres = insertStmt.run(filename, alt);
            let id = runres.lastInsertRowid;
            return id;
        });
    }
    updateProduct(id, title, description, price, image, image_alt) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Id: ${id}`);
            console.log(`Title: ${title}`);
            console.log(`Description: ${description}`);
            console.log(`Price: ${price}`);
            console.log(`Image: ${image}`);
            console.log(`Image Alt: ${image_alt}`);
            let imgId;
            const constructedPath = `./uploads/${image.name}`;
            image.mv(constructedPath, (err) => {
                if (err) {
                    console.error("Something went wrong with moving the image");
                    return;
                }
                console.log("Image moved successfully to " + constructedPath);
            });
            imgId = (yield this.insertNewImage(constructedPath, image_alt));
            let dataToInsert = [];
            let propertiesToInsert = [];
            let filepath;
            const updateStmt = this.db.prepare("UPDATE products SET name=?, description=?, price=?, image=? WHERE id=?");
            const selectStmt = this.db.prepare("SELECT name, description, price, image FROM products WHERE id = ?");
            let originalData = selectStmt.get(id);
            console.log(originalData);
            let newRow = {
                name: title,
                description: description,
                price: price,
                image: imgId
            };
            let res = updateStmt.run(newRow.name, newRow.description, newRow.price, newRow.image, id);
            console.log(`Changes: ${res.changes}`);
            let success = res.changes > 0;
            return success;
        });
    }
    handleImageUpdate(newImg) {
        return __awaiter(this, void 0, void 0, function* () {
            let generatedFileName;
            let tmp;
            let fileExtension;
            let generatedFileNameWithExtension;
            let uploadPath;
            let generatedPath;
            generatedFileName = (0, uuid_1.v4)();
            tmp = newImg.name.split('.').pop();
            if (!tmp) {
                return false;
            }
            fileExtension = tmp;
            generatedFileNameWithExtension = generatedFileName + "." + fileExtension;
            uploadPath = __dirname + '/uploads/' + newImg.name;
            generatedPath = __dirname + "/uploads/" + generatedFileNameWithExtension;
            let toReturn = false;
            newImg.mv(generatedPath, function (err) {
                if (err) {
                    console.warn(err);
                }
                toReturn = generatedPath;
            });
            return toReturn;
        });
    }
    cleanImageLeftovers() {
        const selectImgsStmt = this.db.prepare("SELECT id FROM images;");
        const selectProductImageIdsStmt = this.db.prepare("SELECT image FROM products;");
        const imageDeleteStmt = this.db.prepare("DELETE FROM images WHERE id=?");
        const imgsids = selectImgsStmt.all();
        const productImgsIds = selectProductImageIdsStmt.all();
        var cleanUpSuccessfull = true;
        let usedIds = [];
        let IdsToDelete = [];
        productImgsIds.forEach((row => {
            usedIds.push(row.id);
        }));
        imgsids.forEach(row => {
            if (!usedIds.includes(row.id)) {
                IdsToDelete.push(row.id);
            }
            ;
        });
        IdsToDelete.forEach(toDeleteId => {
            try {
                if (imageDeleteStmt.run(toDeleteId.toFixed(0)).changes < 0) {
                    cleanUpSuccessfull = false;
                }
            }
            catch (error) {
                cleanUpSuccessfull = false;
                console.error(error);
            }
        });
        return cleanUpSuccessfull;
    }
}
exports.DataBaseHandling = DataBaseHandling;
DataBaseHandling.filename = "database.db";
DataBaseHandling.saltRounds = 10;
