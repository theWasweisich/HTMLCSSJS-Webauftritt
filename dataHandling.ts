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
    },
    checkAuth: boolean,
    cookieBanner: boolean
}

import fs from "node:fs/promises";
import * as fsSync from "node:fs";
import Database from "better-sqlite3";
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";
import fileUpload, { UploadedFile } from "express-fileupload";
import { COLORS } from "./utils";
import path from "node:path";
import formidable from "formidable";


export async function getFeatureFlags(): Promise<FeatureFlags> {
    const feature__flags = JSON.parse(await fs.readFile('./feature__flags.json', { encoding: 'utf-8' }))
    return feature__flags;
}

export function isAuthTokenValid(token: string) {
    return true;
}

type ContactMessageData = {
    id?: number,
    timestamp: Date,
    name: string,
    prename: string,
    email: string,
    topic: string,
    shortMsg: string,
    longMsg: string
}

type productRow = {
    id: number,
    name: string,
    description: string,
    price: number,
    image: number
}

type productResponse = {
    id: number,
    title: string,
    description: string,
    price: number,
    stats: statsRow[],
}

type statsRow = { name: string, unit: string | null, value: string | number };


/**
 * The Class for all Data handling activities
 */
export class DataBaseHandling {


    static filename: string = "database.db"
    static saltRounds: number = 10;
    protected db: Database.Database;

    constructor() {
        this.db = this.openDB();
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
        const insertSTMT = "INSERT INTO users (username, hash) VALUES (?, ?)";
        const hashedPassword = await bcrypt.hash(password, DataBaseHandling.saltRounds);
        const stmt = this.db.prepare(insertSTMT);

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
        const selectStmt = this.db.prepare("SELECT username, hash FROM users WHERE username = ?");
        const user = selectStmt.get(username) as {username: string, hash: string} | undefined;
        if (!user) return false;
        try {
            if (await bcrypt.compare(password, user.hash)) {
                return true;
            }
        } catch (e) {
            console.error(e);
            return false
        }
        return false;
    };

    public isAuthTokenValid(token: string): boolean {
        const selectStmt = this.db.prepare("SELECT id, insertDate FROM authTokens WHERE token=?");

        const answ = selectStmt.get(token) as {id: number, insertDate: string};

        let inserted = new Date(answ.insertDate);

        let authTokenValid = answ.id !== undefined && !this.isTokenExpired(inserted);

        this.purgeAuthTokens();

        console.debug(`Is auth valid? ${authTokenValid}`);

        return authTokenValid;
    };

    private isTokenExpired(insertDate: Date) {
        let insertedSince = Date.now() - insertDate.getTime();
        let isMoreThanADayOld = insertedSince > 86400000;
        return isMoreThanADayOld;
    }

    private async purgeAuthTokens() {

        const selectStmt = this.db.prepare("SELECT id, insertDate FROM authTokens;");
        const deleteStmt = this.db.prepare("DELETE FROM authTokens WHERE id=?");
        type resultRow = { id: number, insertDate: string | number };

        let rowIdsToDelete: number[] = [];

        (selectStmt.all() as resultRow[]).forEach((resVal) => {
            let tokenDate = new Date(resVal.insertDate);
            if (this.isTokenExpired(tokenDate)) {
                rowIdsToDelete.push(resVal.id);
            }
        });

        let numOfRowsToDelete = rowIdsToDelete.length;

        if (numOfRowsToDelete < 1) { return }

        console.warn(`Deleting ${numOfRowsToDelete} authTokens, because they are more than a day old!`);

        rowIdsToDelete.forEach((rowId: number) => {
            deleteStmt.run(rowId.toFixed());
        });
    }

    public generateNewAuthToken(): string {
        const newToken = encodeURIComponent(uuidV4());
        console.log("Generating new Token...")
        const insertStmt = this.db.prepare("INSERT INTO authTokens (token, insertDate) VALUES (?, ?)");
        insertStmt.run(newToken, new Date().toISOString());

        return newToken;
    }

    public async getContactMessages(): Promise<ContactMessageData[]> {
        const stmt = this.db.prepare("SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages");

        let data = stmt.all() as ContactMessageData[];

        return data;
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
        const stmt = this.db.prepare("INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)");
        const timestamp = new Date().toISOString();

        const dbResult = stmt.run(timestamp, name, prename, email, topic, shortMsg, longMsg);
        if (dbResult.changes === 1) { return true; }
        return false;
    }

    public deleteContactMessage(ids: number[]) {
        const deleteStmt = this.db.prepare("DELETE FROM contactMessages WHERE id=?");

        for (const id of ids as number[]) {
            deleteStmt.run(id);
        }
        return true;
    }

    public newProduct(
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
        const imgId = this.insertNewImage(image_url, image_alt);
        const productInsertStmt = this.db.prepare("INSERT INTO products (name, description, image) VALUES (?, ?, ?)");
        
        let productres = productInsertStmt.run(name, description, imgId);

        if (productres.changes < 1) { throw new Error("Error during product insertion") };
        let productId = productres.lastInsertRowid;

        if (!stats) { return productId }

        stats.forEach((stat) => {
            this.newStat(stat.name, stat.type, stat.value, Number(productId));
        });
        return productId;
    }

    public getAllProducts(): productResponse[] {
        const productStmt = this.db.prepare("SELECT id, name, description, price, image FROM products;");
        const imgAltStmt = this.db.prepare("SELECT alt FROM images WHERE id=?");
        let products: productResponse[] = [];

        let dbRes = productStmt.all();
        dbRes.forEach((value, index, array) => {
            let row = value as productRow;
            console.log(row);
            if (typeof row.image === "number") {
                let imgRes = imgAltStmt.get(row.image) as { alt: string };
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
    };

    public getProductImagePath(id: number): string | null {
        console.log("Trying to get image for id " + String(id));
        const getImgIdStmt = this.db.prepare("SELECT image FROM products WHERE id=?");
        const getImgPathStmt = this.db.prepare("SELECT filename FROM images WHERE id=?");

        try {
            let imgId = (getImgIdStmt.get(id.toFixed(0)) as { image: number }).image;            
            console.log(`The image id is ${imgId}`);
            let imgFileNameRow = getImgPathStmt.get(imgId.toFixed(0)) as { filename: string };
            console.log(imgFileNameRow);
            let imgFileName = imgFileNameRow.filename;
            return imgFileName;
        } catch (e) {
            return null;
        }
    }

    public getProductStats(id: number) {
        console.log("Trying to get stats for product id: " + String(id));
        const getStatsStmt = this.db.prepare("SELECT id, name, unit, value FROM stats WHERE product=?");
        let stats: statsRow[] = [];

        (getStatsStmt.all(id) as statsRow[]).forEach((row) => {
            stats.push(row);
        });

        return stats;
    }
    
    private newStat(name: string, type: string | null, value: string | number, productId: number) {
        const statInsertStmt = this.db.prepare("INSERT INTO stats (name, unit, value, product) VALUES (?, ?, ?, ?)");
        statInsertStmt.run(name, type, value, productId);
    }

    public replaceStats(statsList: {name: string, unit: string | null, value: string | number}[], productId: number) {
        const removeStmt = this.db.prepare("DELETE FROM stats WHERE product=?");
        removeStmt.run(productId);
        statsList.forEach(stat => {
            this.newStat(stat.name, stat.unit, stat.value, productId);
        })
    }

    private getStatsOfProduct(productId: number): statsRow[] {
        const getStatsStmt = this.db.prepare("SELECT name, unit, value FROM stats WHERE product=?");

        var statsOfProduct: statsRow[] = [];

        const resultRows = getStatsStmt.all(productId) as statsRow[];
        resultRows.forEach((value, index, array) => {
            statsOfProduct.push({
                name: value.name,
                unit: value.unit,
                value: value.value
            })
        });
        return statsOfProduct;
    };

    private async insertNewImage(filenamee: string, alt: string): Promise<number | bigint> {
        const insertStmt = this.db.prepare("INSERT INTO images (filename, alt) VALUES (?, ?)");
        let runres = insertStmt.run(filenamee, alt);
        let id = runres.lastInsertRowid;
        return id;
    }
    public async updateProduct(

        id: number,
        title: string,
        description: string,
        price: number,
    ): Promise<boolean> {

        console.log(`Id: ${id}`);
        console.log(`Title: ${title}`);
        console.log(`Description: ${description}`);
        console.log(`Price: ${price}`);

        type productsRow = { name: string, description: string, price: number, image: number };

        const updateStmt = this.db.prepare("UPDATE products SET name=?, description=?, price=? WHERE id=?");
        const selectStmt = this.db.prepare("SELECT name, description, price, image FROM products WHERE id = ?");

        let originalData = selectStmt.get(id) as productsRow;
        console.log(originalData);
        let newRow: Partial<productsRow> = {
            name: title,
            description: description,
            price: price,
        }

        try {
            let res = updateStmt.run(newRow.name, newRow.description, newRow.price, id);
            console.log(`Changes: ${res.changes}`);
            let success = res.changes > 0;
            return success
        } catch (error) {
            if (error instanceof Database.SqliteError) {
                console.error(COLORS.FgRed + COLORS.Bold + error.code + COLORS.Reset);
            }
            return false;
        }
    }

    public async updateProductImage(image_path: string, image_alt: string, productId: number): Promise<number | Error> {
        console.log(`Image name: ${image_path}`);


        let imgId = await this.insertNewImage(image_path as string, image_alt) as number;

        const imageToProductStmt = this.db.prepare("UPDATE products SET image = ? WHERE id = ?");

        imageToProductStmt.run(imgId, productId);

        return imgId;
    }

    public async cleanImageLeftovers(): Promise<boolean> {
        const filesInUploadDir: string[] = [];

        const stmts = {
            deleteImage: this.db.prepare("DELETE FROM images WHERE id=?"),
            selectProductImageIds: this.db.prepare("SELECT image FROM products;"),
            selectImgs: this.db.prepare("SELECT id, filename FROM images;"),
        }

        type productsRow = { image: number };
        type imagesRow = { id: number, filename: string };

        type filename = string;

        fsSync.readdirSync("./uploads/").forEach((file) => {
            filesInUploadDir.push(file);
        })

        const productImgs = stmts.selectProductImageIds.all() as productsRow[];

        const imgs: { [imageId: number]: filename } = {};

        (stmts.selectImgs.all() as imagesRow[]).forEach((img => {
            imgs[img.id] = img.filename
        }));

        const filesThatShouldNotBeDeleted: filename[] = [];

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

        const filesThatShouldAbsolutelyBeDeleted: filename[] = [];

        filesInUploadDir.forEach(file => {
            if (!filesThatShouldNotBeDeleted.includes(file)) {
                filesThatShouldAbsolutelyBeDeleted.push(file);
            };
        });

        console.log("These files should absolutely be deleted:");
        console.log(filesThatShouldAbsolutelyBeDeleted);
        console.log("✅");

        filesThatShouldAbsolutelyBeDeleted.forEach((file) => {
            fsSync.rmSync(`./uploads/${file}`);
        });

        var cleanUpSuccessfull: boolean = true;

        return cleanUpSuccessfull;
    }
}