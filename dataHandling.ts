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
import Database from "better-sqlite3";
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";
import fileUpload, { UploadedFile } from "express-fileupload";
import { COLORS, logger } from "./utils";


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

    public async isAuthTokenKnown(token: string): Promise<boolean> {
        const selectStmt = this.db.prepare("SELECT id FROM authTokens WHERE token=?");

        const answ = selectStmt.get(token) as {id: number};

        return answ !== undefined;
    };

    public generateNewAuthToken(): string {
        const newToken = encodeURIComponent(uuidV4());
        logger.info("Generating new Token...")
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
        const getImgIdStmt = this.db.prepare("SELECT image FROM products WHERE id=?");
        const getImgPathStmt = this.db.prepare("SELECT filename FROM images WHERE id=?");

        try {
            let imgId = (getImgIdStmt.get(id.toFixed(0)) as { image: number }).image;            
            logger.info(`The image id for Product ${id} is ${imgId}`);
            let imgFileNameRow = getImgPathStmt.get(imgId.toFixed(0)) as { filename: string };
            let imgFileName = imgFileNameRow.filename;
            return imgFileName;
        } catch (e) {
            return null;
        }
    }

    public getProductStats(id: number) {
        logger.info("Trying to get stats for product id: " + String(id));
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

    public removeStat(statId: number, productId: number) {
        const removeStatStmt = this.db.prepare("DELETE FROM stats WHERE product=? AND id=?");
        removeStatStmt.run(productId, statId);
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

    private async insertNewImage(filename: string, alt: string): Promise<number | bigint> {
        const insertStmt = this.db.prepare("INSERT INTO images (filename, alt) VALUES (?, ?)");
        let runres = insertStmt.run(filename, alt);
        let id = runres.lastInsertRowid;
        return id;
    }
    public async updateProduct(

        id: number,
        title: string,
        description: string,
        price: number,
    ): Promise<boolean> {


        type productsRow = { name: string, description: string, price: number, image: number };

        const updateStmt = this.db.prepare("UPDATE products SET name=?, description=?, price=? WHERE id=?");
        const selectStmt = this.db.prepare("SELECT name, description, price, image FROM products WHERE id = ?");

        let originalData = selectStmt.get(id) as productsRow;
        let newRow: Partial<productsRow> = {
            name: title,
            description: description,
            price: price,
        }

        try {
            let res = updateStmt.run(newRow.name, newRow.description, newRow.price, id);
            let success = res.changes > 0;
            return success
        } catch (error) {
            if (error instanceof Database.SqliteError) {
                console.error(COLORS.FgRed + COLORS.Bold + error.code + COLORS.Reset);
            }
            return false;
        }
    }

    public async updateProductImage(image: fileUpload.UploadedFile, image_alt: string, productId: number): Promise<number | Error> {

        if (image.name === "blob") {
            console.error("Image name is blob! Rejecting...");
            return new Error("Please do not provide a blob!");
        }

        const constructedPath = `./uploads/${image.name}`;
        try {
            console.info(`Copying file from "${image.tempFilePath}" to "${constructedPath}"...`);
            await fs.copyFile(image.tempFilePath, constructedPath);
        } catch (error) {
            let thisError = error as Error;
            console.error(thisError);
            return thisError;
        };

        let imgId = await this.insertNewImage(constructedPath, image_alt) as number;

        const imageToProductStmt = this.db.prepare("UPDATE products SET image = ? WHERE id = ?");

        imageToProductStmt.run(imgId, productId);

        return imgId;
    }

    protected cleanImageLeftovers(): boolean {
        const selectImgsStmt = this.db.prepare("SELECT id FROM images;");
        const selectProductImageIdsStmt = this.db.prepare("SELECT image FROM products;");
        const imageDeleteStmt = this.db.prepare("DELETE FROM images WHERE id=?");

        const imgsids = selectImgsStmt.all() as {id: number}[];
        const productImgsIds = selectProductImageIdsStmt.all() as {id: number}[];
        var cleanUpSuccessfull: boolean = true;

        let usedIds: number[] = [];
        let IdsToDelete: number[] = [];

        productImgsIds.forEach((row => {
            usedIds.push(row.id);
        }));

        imgsids.forEach(row => {
            if (!usedIds.includes(row.id)) {
                IdsToDelete.push(row.id);
            };
        });

        IdsToDelete.forEach(toDeleteId => {
            
            try {
                if (imageDeleteStmt.run(toDeleteId.toFixed(0)).changes < 0) {
                    cleanUpSuccessfull = false;
                }
            } catch (error) {
                cleanUpSuccessfull = false
                console.error(error);
            }
        });

        return cleanUpSuccessfull;
    }
}