import express from "express";
import { DataBaseHandling, FeatureFlags, getFeatureFlags } from "./dataHandling";
import * as formidable from "formidable";
import { checkAuthMiddleware } from "./app";
import path from "node:path";
import { HTTPError, StatusCodes } from "./utils";

const apiRouter = express.Router();

apiRouter.use(checkAuthMiddleware);

const formidableConfig: formidable.Options = {
    multiples: false,
    uploadDir: './uploads',
    maxFiles: 1,
    maxFileSize: 500 * 1024 * 1024,
    keepExtensions: true,
    filter: (part) => {
        return true;
    },
    allowEmptyFiles: false,
}

export default apiRouter;

let feature__flags: FeatureFlags | undefined; 

getFeatureFlags().then((flags) => {
    feature__flags = flags;
});


apiRouter.post('/contact/new', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();
    const form = formidable.formidable({
        maxFiles: 0,
    });

    let [fields, files] = await form.parse(req);

    let name: string;
    let prename: string;
    let email: string;
    let topic: string;
    let shortMsg: string;
    let longMsg: string;

    try {
        name = fields["name"]![0];
        prename = fields["prename"]![0];
        email = fields["email"]![0];
        topic = fields["topic"]![0];
        shortMsg = fields["shortMsg"]![0];
        longMsg = fields["longMsg"]![0];
    } catch (error) {
        if (error instanceof TypeError) {
            res.status(StatusCodes.internalServerError).end("");
        } else {
            console.error(error);
            console.trace();
            res.sendStatus(StatusCodes.internalServerError);
        };
        return;
    };

    let result = await handler.newContactMessage(
        name, prename, email, topic, shortMsg, longMsg
    );

    if (result) {
        res.status(201).end("Done");
    } else {
        res.status(StatusCodes.internalServerError).end("Something went wrong");
    };
});

apiRouter.post('/login', async (req, res, next) => {
    const body = req.body;
    const handler = new DataBaseHandling();
    let err: HTTPError;
    let username = body["username"]
    let password = body["password"]

    let isUserAuthenticated = false;

    try {
        isUserAuthenticated = await handler.isUserValid(username, password);
    } catch (error) {
        console.error(error);
        err = new HTTPError(StatusCodes.internalServerError, "Irgendwas hat nicht so funktioniert wie es soll!");
        next(err);
    }

    if (isUserAuthenticated) {
        let token = handler.generateNewAuthToken();

        res.cookie("authToken", token, { httpOnly: true });

        res.redirect("/admin/");
        return;
    }

    req.session.token = undefined;
    res.status(401).end("Jetzt probieren wir das aber nochmal, was?");
});

apiRouter.get("/cookies", (req, res) => {
    if (!feature__flags) {
        res.status(StatusCodes.internalServerError).end("?");
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
        var image = handler.getProductImagePathAndAlt(Number(productId));

        if (image !== null) {
            image.filename = path.join(__dirname, image.filename);
            res.setHeader("x-image-alt", image.alt);
            res.sendFile(image.filename);
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

apiRouter.post("/admin/product/:id/stats", async function(req: express.Request, res: express.Response) {
    console.error("Product Stats!");
    const handling = new DataBaseHandling();
    const formidablee = formidable.formidable({
        maxFiles: 0
    });
    const form = await formidablee.parse(req);

    let formFields = form[0];

    let field = formFields["stats"]![0];

    const stats = JSON.parse(field as unknown as string) as {id: number, name: string, unit: string | null, value: string | number}[];
    const productId: number = Number(req.params.id);

    console.log(`Creating stats for Product ${productId}`)
    console.log(stats)
    let returnValue = handling.replaceStats(stats, productId);
    if (returnValue) {
        res.sendStatus(StatusCodes.ok);
    } else {
        res.sendStatus(StatusCodes.internalServerError);
    }
});

apiRouter.post('/users/new', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();

    let usrname = body["username"];
    let psswd = body["password"];

    if (!(usrname && psswd)) { res.status(StatusCodes.forbidden).end("Username and Password need to be provided!"); return; };

    let result = await handler.createUser(usrname, psswd);
    if (result) {
        res.status(StatusCodes.created).end("User created");
    } else {
        res.status(StatusCodes.internalServerError).end("Something went wrong :(");
    }
});

apiRouter.get("/admin/contact/get", async (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();

    let result = await handler.getContactMessages();

    res.status(200).json(result);
});

apiRouter.post("/admin/products/new", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();

    const incommingForm = formidable.formidable(formidableConfig);
    incommingForm.parse(req, async (err, fields: formidable.Fields<string>, files: formidable.Files) => {
        let productId: number = -1;
        let productTitle: string;
        let productDescription: string;
        let productPrice: number;
        let productImage: formidable.File;
        let productAlt: string;

        let tmpFile = files.image ? files.image[0] : undefined;
        if (tmpFile === undefined) { throw new Error("No Image provided!"); };

        productImage = tmpFile;

        let keys = Object.keys(fields);

        console.log("Fields: 📋");
        keys.forEach((value) => {
            console.log(value, fields[value]);
            const fieldValue = fields[value]![0];
            if (value === "title") {
                productTitle = fieldValue;
            } else if (value === "description") {
                productDescription = fieldValue;
            } else if (value === "price") {
                productPrice = Number(fieldValue);
            } else if (value === "alt") {
                productAlt = fieldValue;
            };
        });
        console.log("That's it!");

        let PathToImage = `./uploads/${productImage.newFilename}`

        productId = (await handler.newProduct(productTitle!, productDescription!, productPrice!, '', productAlt!)) as number;

        await handleImageUpload(productImage, productAlt!, productId);

        if (Number.isNaN(productId) || productId < 0) {
            res.status(StatusCodes.internalServerError).end("Something went wrong :(");
        } else {
            res.status(201).json({
                status: "success",
                productId: productId
            });
        };
    });

});

apiRouter.delete("/admin/product/:id/delete", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const productId = req.params.id;
    console.log("Deleting Product " + String(productId));
    if (productId.length <= 0) { res.sendStatus(400); return; };
    const id = Number(productId);
    if (Number.isNaN(id)) { res.sendStatus(400); return; };

    const handler = new DataBaseHandling();
    let dbRes = handler.deleteProduct(id);

    if (dbRes) {
        res.sendStatus(200);
    } else {
        res.sendStatus(StatusCodes.internalServerError);
    }
})

apiRouter.delete("/admin/contact/delete", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
    const body = req.body;

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
        res.status(StatusCodes.internalServerError).end(":(");
    }
})

apiRouter.get("/admin/products/get", (req: express.Request, res: express.Response) => {
    let handler = new DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});

apiRouter.put("/admin/product/:id/update", async function(req: express.Request, res: express.Response, next: express.NextFunction) {

    const handler = new DataBaseHandling();
    const form = new formidable.Formidable(formidableConfig);
    let id: number;
    let title: string;
    let description: string;
    let price: number;

    form.parse(req, async (err: any, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
            next(err);
            return;
        }
        let titleField = fields["title"];
        let descrField = fields["description"];
        let priceField = fields["price"];

        if (titleField && descrField && priceField) {
            title = titleField[0];
            description = descrField[0];
            price = Number(priceField[0]);
        } else {
            let err = new HTTPError(StatusCodes.internalServerError);
            next(err);
            return;
        }

        id = Number(req.params.id);
    
        let success = await handler.updateProduct(id, title, description, price);
    
        if (success) {
            res.status(200).end("Success");
        } else {
            res.status(StatusCodes.internalServerError).end("Something went wrong :(");
        }
    })


    
})

apiRouter.put("/admin/product/:id/image", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const form = new formidable.Formidable(formidableConfig);

    const handler = new DataBaseHandling();
    const productId = req.params.id;

    form.parse(req, async (err: any, fields: formidable.Fields<string>, files: formidable.Files<string>) => {
        if (err) {
            next(err);
        }

        let alt;
        if (!fields["alt"]) {
            alt = "";
        } else {
            alt = fields["alt"][0];
        }

        // let filename = fields["filename"];
        let file = files["image"];
        if (file === undefined) {
            throw new Error();
        }
        let singlefile = file[0];

        handleImageUpload(singlefile, alt, Number(productId)).then((returnValue) => {
            handler.cleanImageLeftovers();
        });

        res.sendStatus(201);
    })
});

apiRouter.get("/admin/images/purge", async (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
    if (await handler.cleanImageLeftovers()) {
        res.sendStatus(200);
    } else {
        res.sendStatus(StatusCodes.internalServerError);
    }
})


async function handleImageUpload(image: formidable.File, alt?: string, productId?: number): Promise<number | Error> {
    const handler = new DataBaseHandling();
    let filenameOfFile = `./uploads/${image.newFilename}`;

    if (!alt || alt.length <= 0) {
        alt = image.originalFilename ? image.originalFilename : '???';
    }

    let res = await handler.updateProductImage(
        filenameOfFile,
        alt,
        Number(productId)
    );
    return res;
}