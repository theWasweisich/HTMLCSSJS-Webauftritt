import express from "express";
import { DataBaseHandling } from "../dataHandling";
import path from "path";
import formidable from "formidable";
import { logger } from "../utils";

const productsApiRouter = express.Router()

export default productsApiRouter;

productsApiRouter.get("products/get", function (req, res) {
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


productsApiRouter.get("/product/:id/image/get/", function (req, res) {
    const productId = req.params.id;
    const handler = new DataBaseHandling();

    try {
        var imagePath = handler.getProductImagePath(Number(productId));
    
        logger.info(`${productId} -> ${imagePath}`);

        if (imagePath !== null) {
            imagePath = path.join(__dirname, "../", imagePath);
            logger.info(`Path: ${imagePath}`);
            res.status(200).sendFile(imagePath);
            return;
        };
    } catch (e) {
        res.status(404).end("The requested image could not be found");
    }
});

productsApiRouter.get("/product/stats/:id", function(req: express.Request, res: express.Response) {

    const id = Number(req.params.id);
    const handler = new DataBaseHandling();

    if (Number.isNaN(id)) {
        res.status(400).end("Provide a valid product ID");
        return;
    }

    let stats = handler.getProductStats(id);

    res.json(stats);
})

productsApiRouter.route("/admin/product/:id/stats")
    .all((req, res, next) => {
        next();
    })
    .delete(function(req: express.Request, res: express.Response) {
        res.sendStatus(501);
    })
    .put(function(req: express.Request, res: express.Response) {
        const handling = new DataBaseHandling();
        const stats = JSON.parse(req.body.stats) as {id: number, name: string, unit: string | null, value: string | number}[];
        console.log(stats);
        handling.replaceStats(stats, Number(req.params.id));
        res.sendStatus(501);
    })
;

productsApiRouter.post("/admin/products/new", (req: express.Request, res: express.Response) => {
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

productsApiRouter.get("/admin/products/get", (req: express.Request, res: express.Response) => {
    let handler = new DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});

productsApiRouter.put("/admin/product/:id/update", async function(req: express.Request, res: express.Response) {

    type uploadBody = {
        title: string,
        description: string,
        price: number,
    };

    const handler = new DataBaseHandling();
    const body = req.body as uploadBody;

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


productsApiRouter.put("/admin/product/:id/image", async (req: express.Request, res: express.Response) => {
    const form = new formidable.IncomingForm({
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

    form.parse(req, (err: any, fields: formidable.Fields<string>, files: formidable.Files<string>) => {
        let alt = fields["alt"];
        let filename = fields["filename"];

    })
})
