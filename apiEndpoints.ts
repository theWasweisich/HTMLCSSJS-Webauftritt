import express from "express";
import { DataBaseHandling, FeatureFlags, getFeatureFlags } from "./dataHandling";
import * as formidable from "formidable";
import { checkAuthMiddleware } from "./app";
import path from "node:path";
import { HTTPError } from "./utils";

const apiRouter = express.Router();

export default apiRouter;

let feature__flags: FeatureFlags | undefined; 

getFeatureFlags().then((flags) => {
    feature__flags = flags;
});


apiRouter.post('/contact/new', async (req, res) => {
    const body = req.body;
    // console.log(body, typeof body);
    console.log("New Contact Message received!");

    const handler = new DataBaseHandling();
    let result = await handler.newContactMessage(body["name"], body["prename"], body["email"], body["topic"], body["shortMsg"], body["longMsg"]);

    if (result) {
        res.status(201).end("Done");
    } else {
        res.status(500).end("Something went wrong")
    };
});

apiRouter.post('/login', async (req, res, next) => {
    const body = req.body;
    const handler = new DataBaseHandling();
    let err: HTTPError;

    try {
        if (await handler.isUserValid(body["username"], body["password"])) {
            let token = handler.generateNewAuthToken();

            res.cookie("authToken", token, { httpOnly: true });

            res.redirect("/admin/");
            return;
        }
    } catch (error) {
        err = new HTTPError(500, "Irgendwas hat nicht so funktioniert wie es soll!");
        next(err);
    }

    req.session.token = undefined;
    err = new HTTPError(401, "Invalid");
    next(err);
});

apiRouter.get("/cookies", (req, res) => {
    if (!feature__flags) {
        res.status(500).end("?");
        return;
    };
    if (!feature__flags.cookieBanner) {
        res.set('x-cookies-disabled', "yes");
    }
    res.end("ok");
});

apiRouter.get("/products/get", function (req, res) {
    const handler = new DataBaseHandling();
    const allProducts = handler.getAllProducts();

    type returnedData = {
        id: number,
        title: string,
        description: string,
        price: number,
        imgAlt: string,
        stats: {name: string, unit: string, value: string}[]
    }

    let toReturn: returnedData[] = allProducts.map(value => {
        return {
            id: value.id,
            title: value.title,
            description: value.description,
            price: value.price,
            stats: value.stats,
        } as returnedData;
    });
    res.json(toReturn as returnedData[]);
});

apiRouter.get("/product/:id/image/get/", function (req, res, next) {
    const productId = req.params.id;
    const handler = new DataBaseHandling();

    try {
        var imagePath = handler.getProductImagePath(Number(productId));
    
        console.log(`The path for the image of product with id ${productId} is ${imagePath}`);

        if (imagePath !== null) {
            imagePath = path.join(__dirname, imagePath);
            console.log(`Sending file ${imagePath}`);
            res.sendFile(imagePath);
        } else {
            res.sendStatus(404);
        }
    } catch (e) {
        res.status(404).end("The requested image could not be found");
    }
});

apiRouter.get("/product/stats/:id", function(req: express.Request, res: express.Response) {

    const id = Number(req.params.id);
    const handler = new DataBaseHandling();

    if (Number.isNaN(id)) {
        res.status(400).end("Provide a valid product ID");
        return;
    }

    let stats = handler.getProductStats(id);

    res.json(stats);
})

apiRouter.route("/admin/product/:id/stats")
    .delete(function(req: express.Request, res: express.Response) {
        res.sendStatus(501);
    })
    .put(function(req: express.Request, res: express.Response) {
        const handling = new DataBaseHandling();
        const stats = JSON.parse(req.body.stats) as {id: number, name: string, unit: string | null, value: string | number}[];
        console.log(stats);
        handling.replaceStats(stats, Number(req.params.id));
        res.sendStatus(501);
    });

apiRouter.post('/users/new', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();

    let usrname = body["username"];
    let psswd = body["password"];

    if (!(usrname && psswd)) { res.status(400).end("Username and Password need to be provided!"); return; };

    let result = await handler.createUser(usrname, psswd);
    if (result) {
        res.status(201).end("User created");
    } else {
        res.status(500).end("Something went wrong :(");
    }
});

apiRouter.get("/admin/contact/get", async (req: express.Request, res: express.Response) => {
    console.log("Requested Messages!")
    const handler = new DataBaseHandling();

    let result = await handler.getContactMessages();

    res.status(200).json(result);
});

apiRouter.post("/admin/products/new", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
    const body = req.body;

    const newProduct = {
        name: body.name,
        description: body.description,
        filename: body.filename,
        alt: body.alt
    };

    let productId = handler.newProduct(newProduct.name, newProduct.description, newProduct.filename, newProduct.alt);

    if (Number.isNaN(productId)) {
        res.status(500).end("Something went wrong :(");
    } else {
        res.status(201).end("Success");
    };
});

apiRouter.delete("/admin/contact/delete", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
    const body = req.body;

    console.log(body);
    let id: number[];
    if (body["multiple"]) {
        id = body["ids"];
    } else {
        id = [body["id"]];
    }

    let success = handler.deleteContactMessage(id);

    if (success) {
        res.status(200).end("Success");
    } else {
        res.status(500).end(":(");
    }
})

apiRouter.get("/admin/products/get", (req: express.Request, res: express.Response) => {
    let handler = new DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});

apiRouter.put("/admin/product/:id/update", async function(req: express.Request, res: express.Response) {

    type uploadBody = {
        title: string,
        description: string,
        price: number,
    };

    const handler = new DataBaseHandling();
    const body = req.body as uploadBody;

    console.log(`Body: ${body}`);

    let id: number;
    let title: string;
    let description: string;
    let price: number;

    
    id = Number(req.params.id);
    title = body.title;
    description = body.description;
    price = body.price;

    let success = await handler.updateProduct(id, title, description, price);

    if (success) {
        res.status(200).end("Success");
    } else {
        res.status(500).end("Something went wrong :(");
    }
})

apiRouter.put("/admin/product/:id/image", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const form = new formidable.Formidable({
        multiples: false,
        uploadDir: './uploads',
        maxFiles: 1,
        maxFileSize: 500 * 1024 * 1024,
        keepExtensions: true,
        filter: (part) => {
            return true;
        },
        allowEmptyFiles: true,
    });

    const handler = new DataBaseHandling();
    const productId = req.params.id;

    form.parse(req, async (err: any, fields: formidable.Fields<string>, files: formidable.Files<string>) => {
        if (err) {
            next(err);
        }

        let alt = fields["alt"] ? fields["alt"][0] : "";
        let filename = fields["filename"];
        let file = files["image"];
        if (file === undefined) {
            throw new Error();
        }
        let singlefile = file[0];

        console.log(`File: ${singlefile}`);
        console.log(`Filename: ${filename}`);
        console.log(`Filepath: ${singlefile.filepath}`);
        console.log(`Alt: ${alt}`);

        let filenameOfFile = `./uploads/${singlefile.newFilename}`;

        await handler.updateProductImage(
            filenameOfFile,
            alt as unknown as string,
            Number(productId)
        );


        
        
        if (file instanceof formidable.File) {
            (file as unknown as formidable.File).filepath
        }
        
        
       
        handler.cleanImageLeftovers();
        res.sendStatus(201);
    })
})
