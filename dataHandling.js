"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.DataBaseHandling = exports.isAuthTokenValid = exports.getFeatureFlags = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const fsSync = __importStar(require("node:fs"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const utils_1 = require("./utils");
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        const feature__flags = JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
        return feature__flags;
    });
}
exports.getFeatureFlags = getFeatureFlags;
function isAuthTokenValid(token) {
    return true;
}
exports.isAuthTokenValid = isAuthTokenValid;
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
    isAuthTokenValid(token) {
        const selectStmt = this.db.prepare("SELECT id, insertDate FROM authTokens WHERE token=?");
        const answ = selectStmt.get(token);
        let inserted = new Date(answ.insertDate);
        let authTokenValid = answ.id !== undefined && !this.isTokenExpired(inserted);
        this.purgeAuthTokens();
        console.debug(`Is auth valid? ${authTokenValid}`);
        return authTokenValid;
    }
    ;
    isTokenExpired(insertDate) {
        let insertedSince = Date.now() - insertDate.getTime();
        let isMoreThanADayOld = insertedSince > 86400000;
        return isMoreThanADayOld;
    }
    purgeAuthTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const selectStmt = this.db.prepare("SELECT id, insertDate FROM authTokens;");
            const deleteStmt = this.db.prepare("DELETE FROM authTokens WHERE id=?");
            let rowIdsToDelete = [];
            selectStmt.all().forEach((resVal) => {
                let tokenDate = new Date(resVal.insertDate);
                if (this.isTokenExpired(tokenDate)) {
                    rowIdsToDelete.push(resVal.id);
                }
            });
            let numOfRowsToDelete = rowIdsToDelete.length;
            if (numOfRowsToDelete < 1) {
                return;
            }
            console.warn(`Deleting ${numOfRowsToDelete} authTokens, because they are more than a day old!`);
            rowIdsToDelete.forEach((rowId) => {
                deleteStmt.run(rowId.toFixed());
            });
        });
    }
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
            this.newStat(stat.name, stat.type, stat.value, Number(productId));
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
            console.log(row);
            if (typeof row.image === "number") {
                let imgRes = imgAltStmt.get(row.image);
            }
            let stats = this.getStatsOfProduct(row.id);
            products.push({
                id: row.id,
                title: row.name,
                description: row.description,
                price: row.price,
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
        try {
            let imgId = getImgIdStmt.get(id.toFixed(0)).image;
            console.log(`The image id is ${imgId}`);
            let imgFileNameRow = getImgPathStmt.get(imgId.toFixed(0));
            console.log(imgFileNameRow);
            let imgFileName = imgFileNameRow.filename;
            return imgFileName;
        }
        catch (e) {
            return null;
        }
    }
    getProductStats(id) {
        console.log("Trying to get stats for product id: " + String(id));
        const getStatsStmt = this.db.prepare("SELECT id, name, unit, value FROM stats WHERE product=?");
        let stats = [];
        getStatsStmt.all(id).forEach((row) => {
            stats.push(row);
        });
        return stats;
    }
    newStat(name, type, value, productId) {
        const statInsertStmt = this.db.prepare("INSERT INTO stats (name, unit, value, product) VALUES (?, ?, ?, ?)");
        statInsertStmt.run(name, type, value, productId);
    }
    replaceStats(statsList, productId) {
        const removeStmt = this.db.prepare("DELETE FROM stats WHERE product=?");
        removeStmt.run(productId);
        statsList.forEach(stat => {
            this.newStat(stat.name, stat.unit, stat.value, productId);
        });
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
    insertNewImage(filenamee, alt) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertStmt = this.db.prepare("INSERT INTO images (filename, alt) VALUES (?, ?)");
            let runres = insertStmt.run(filenamee, alt);
            let id = runres.lastInsertRowid;
            return id;
        });
    }
    updateProduct(id, title, description, price) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Id: ${id}`);
            console.log(`Title: ${title}`);
            console.log(`Description: ${description}`);
            console.log(`Price: ${price}`);
            const updateStmt = this.db.prepare("UPDATE products SET name=?, description=?, price=? WHERE id=?");
            const selectStmt = this.db.prepare("SELECT name, description, price, image FROM products WHERE id = ?");
            let originalData = selectStmt.get(id);
            console.log(originalData);
            let newRow = {
                name: title,
                description: description,
                price: price,
            };
            try {
                let res = updateStmt.run(newRow.name, newRow.description, newRow.price, id);
                console.log(`Changes: ${res.changes}`);
                let success = res.changes > 0;
                return success;
            }
            catch (error) {
                if (error instanceof better_sqlite3_1.default.SqliteError) {
                    console.error(utils_1.COLORS.FgRed + utils_1.COLORS.Bold + error.code + utils_1.COLORS.Reset);
                }
                return false;
            }
        });
    }
    updateProductImage(image_path, image_alt, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Image name: ${image_path}`);
            let imgId = yield this.insertNewImage(image_path, image_alt);
            const imageToProductStmt = this.db.prepare("UPDATE products SET image = ? WHERE id = ?");
            imageToProductStmt.run(imgId, productId);
            return imgId;
        });
    }
    cleanImageLeftovers() {
        return __awaiter(this, void 0, void 0, function* () {
            const filesInUploadDir = [];
            const stmts = {
                deleteImage: this.db.prepare("DELETE FROM images WHERE id=?"),
                selectProductImageIds: this.db.prepare("SELECT image FROM products;"),
                selectImgs: this.db.prepare("SELECT id, filename FROM images;"),
            };
            fsSync.readdirSync("./uploads/").forEach((file) => {
                filesInUploadDir.push(file);
            });
            const productImgs = stmts.selectProductImageIds.all();
            const imgs = {};
            stmts.selectImgs.all().forEach((img => {
                imgs[img.id] = img.filename;
            }));
            const filesThatShouldNotBeDeleted = [];
            productImgs.forEach((row) => {
                let filename = imgs[row.image];
                filename = filename.substring(10);
                filesThatShouldNotBeDeleted.push(filename);
            });
            console.log("Files that should not be deleted:");
            console.log(filesThatShouldNotBeDeleted);
            console.log("⛔");
            console.log("Files that are in the uploads directory:");
            console.log(filesInUploadDir);
            console.log("📂");
            const filesThatShouldAbsolutelyBeDeleted = [];
            filesInUploadDir.forEach(file => {
                if (!filesThatShouldNotBeDeleted.includes(file)) {
                    filesThatShouldAbsolutelyBeDeleted.push(file);
                }
                ;
            });
            console.log("These files should absolutely be deleted:");
            console.log(filesThatShouldAbsolutelyBeDeleted);
            console.log("✅");
            filesThatShouldAbsolutelyBeDeleted.forEach((file) => {
                fsSync.rmSync(`./uploads/${file}`);
            });
            var cleanUpSuccessfull = true;
            return cleanUpSuccessfull;
        });
    }
}
exports.DataBaseHandling = DataBaseHandling;
DataBaseHandling.filename = "database.db";
DataBaseHandling.saltRounds = 10;
