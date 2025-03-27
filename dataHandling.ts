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
import sqlite3 from "sqlite3";
import Database from "better-sqlite3";
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";
import fileUpload from "express-fileupload";

sqlite3.verbose();


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
    image_filename: string,
    image_alt: string
}

export class DataBaseHandling {


    static filename: string = "database.db"
    static saltRounds: number = 10;

    constructor() {
        // this.cleanImageLeftovers();
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

    public async getContactMessages(): Promise<ContactMessageData[]> {
        const db = this.openDB();
        const stmt = db.prepare("SELECT id, timestamp, name, prename, email, topic, shortMsg, longMsg FROM contactMessages");

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
        const db = this.openDB();
        const stmt = db.prepare("INSERT INTO contactMessages (timestamp, name, prename, email, topic, shortMsg, longMsg) VALUES (?, ?, ?, ?, ?, ?, ?)");
        const timestamp = new Date().toISOString();

        const dbResult = stmt.run(timestamp, name, prename, email, topic, shortMsg, longMsg);
        if (dbResult.changes === 1) { return true; }
        return false;
    }

    public deleteContactMessage(ids: number[]) {
        const db = this.openDB();
        const deleteStmt = db.prepare("DELETE FROM contactMessages WHERE id=?");

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
        const db = this.openDB();
        const imgId = this.insertNewImage(image_url, image_alt);
        const productInsertStmt = db.prepare("INSERT INTO products (name, description, image) VALUES (?, ?, ?)");
        
        let productres = productInsertStmt.run(name, description, imgId);

        if (productres.changes < 1) { throw new Error("Error during product insertion") };
        let productId = productres.lastInsertRowid;

        if (!stats) { return productId }

        stats.forEach((stat) => {
            this.newStat(db, stat.name, stat.type, stat.value);
        });
        return productId;
    }

    public getAllProducts(): productResponse[] {
        const db = this.openDB();
        const productStmt = db.prepare("SELECT id, name, description, price, image FROM products;");
        const imageStmt = db.prepare("SELECT filename, alt FROM images WHERE id=?;");
        let products: productResponse[] = [];

        let dbRes = productStmt.all();
        dbRes.forEach(function (value, index, array) {
            let row = value as productRow;
            let imgRes = imageStmt.get(row.image) as { filename: string, alt: string };
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
    };

    public getProductImagePath(id: number) {
        console.log("Trying to get image for id " + String(id));
        const db = this.openDB();
        const getImgIdStmt = db.prepare("SELECT image FROM products WHERE id=?");
        const getImgPathStmt = db.prepare("SELECT filename FROM images WHERE id=?");
        let imgId = (getImgIdStmt.get(id.toFixed(0)) as { image: number }).image;
        
        console.log(`The image id is ${imgId}`);
        let imgFileNameRow = getImgPathStmt.get(imgId.toFixed(0)) as { filename: string };
        let imgFileName = imgFileNameRow.filename;

        return imgFileName;
    }
    
    private newStat(db: Database.Database, name: string, type: string, value: string | number) {
        const statInsertStmt = db.prepare("INSERT INTO stats (name, unit, value, product) VALUES (?, ?, ?, ?)");
        statInsertStmt.run(name, type, value);
    }

    private async insertNewImage(filename: string, alt: string): Promise<number | bigint> {
        const db = this.openDB();
        const insertStmt = db.prepare("INSERT INTO images (filename, alt) VALUES (?, ?)");
        let runres = insertStmt.run(filename, alt);
        let id = runres.lastInsertRowid;

        return id;
    }

    public async updateProduct(
        id: number | undefined,
        title: string | undefined,
        description: string | undefined,
        price: number | undefined,
        image: fileUpload.UploadedFile | undefined,
        image_alt: string | undefined,
    ): Promise<boolean> {

        console.log(id, title, description, price, image, image_alt);

        type productsRow = { name: string, description: string, price: number, image: number };

        const db = this.openDB();

        let imgId;

        if (image && image_alt) {
            const constructedPath = `./uploads/${image.name}`;
            image.mv(constructedPath, (err) => {
                if (err) { console.error("Something went wrong with moving the image"); return }
                console.log("Image moved successfully to " + constructedPath);
            })
            imgId = await this.insertNewImage(constructedPath, image_alt) as number;
        } else {
            imgId = undefined;
        }


        let dataToInsert: string[] = [];
        let propertiesToInsert: any[] = [];
        let filepath;
        const updateStmt = db.prepare("UPDATE products SET name=?, description=?, price=?, image=? WHERE id=?");
        const selectStmt = db.prepare("SELECT name, description, price, image FROM products WHERE id = ?");



        let originalData = selectStmt.get(id) as productsRow;
        let newRow: productsRow = {
            name: title ? title : originalData.name,
            description: description ? description : originalData.description,
            price: price ? price : originalData.price,
            image: imgId ? imgId : originalData.image
        }

        let res = updateStmt.run(newRow.name, newRow.description, newRow.price, newRow.image, id);
        let success = res.changes > 0;

        return success
    }

    protected async handleImageUpdate(newImg: fileUpload.UploadedFile): Promise<boolean | string> {
        let generatedFileName;
        let tmp;
        let fileExtension;
        let generatedFileNameWithExtension;
        let uploadPath;
        let generatedPath;

        generatedFileName = uuidV4();
        tmp = newImg.name.split('.').pop();
        if (!tmp) { return false; }
        fileExtension = tmp;
        generatedFileNameWithExtension = generatedFileName + "." + fileExtension;
        uploadPath = __dirname + '/uploads/' + newImg.name;

        generatedPath = __dirname + "/uploads/" + generatedFileNameWithExtension;

        let toReturn: string | boolean = false;

        newImg.mv(generatedPath, function(err: any) {
            if (err) {
                console.warn(err);
            }
            toReturn = generatedPath;
        });

        return toReturn;
    }

    protected cleanImageLeftovers(): boolean {
        const db = this.openDB();
        const selectImgsStmt = db.prepare("SELECT id FROM images;");
        const selectProductImageIdsStmt = db.prepare("SELECT image FROM products;");
        const imageDeleteStmt = db.prepare("DELETE FROM images WHERE id=?");

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