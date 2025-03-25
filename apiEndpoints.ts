import express from "express";
import { DataBaseHandling, FeatureFlags, getFeatureFlags } from "./dataHandling";
import multer from "multer";
import formidable from "formidable";
const router = express.Router();

export default router;

let feature__flags: FeatureFlags | undefined; 

getFeatureFlags().then((flags) => {
    feature__flags = flags;
});

const upload = multer({ dest: 'uploads/' });

router.post('/contact/new', async (req, res) => {
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

router.post('/login', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();
    
    try {
        if (await handler.isUserValid(body["username"], body["password"])) {
            req.session.token = handler.generateNewAuthToken();
            res.redirect("/admin/");
            return;
        }
    } catch (error) {
        res.status(401).send("Invalid :(");
    }

    req.session.token = undefined;
    res.status(401).send("Invalid");
});

router.get("/cookies", (req, res) => {
    if (!feature__flags) {
        res.status(500).end("?");
        return;
    };
    if (!feature__flags.cookieBanner) {
        res.set('x-cookies-disabled', "yes");
    }
    res.end("ok");
});

router.get("/products/get", function (req, res) {
    const handler = new DataBaseHandling();
    const allProducts = handler.getAllProducts();
    let toReturn: object[] = allProducts.map(value => {
        return {
            title: value.title,
            description: value.description,
            price: value.price,
            img__filename: value.image_filename,
            img__alt: value.image_alt,
        };
    });
    res.json(toReturn);
});

router.post('/users/new', async (req, res) => {
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

router.get("/admin/contact/get", async (req: express.Request, res: express.Response) => {
    console.log("Requested Messages!")
    const handler = new DataBaseHandling();

    let result = await handler.getContactMessages();

    res.status(200).json(result);
});

router.post("/admin/products/new", (req: express.Request, res: express.Response) => {
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

router.delete("/admin/contact/delete", (req: express.Request, res: express.Response) => {
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

router.get("/admin/products/get", (req: express.Request, res: express.Response) => {
    let handler = new DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});

router.post("/admin/products/update", async function (req: express.Request, res: express.Response) {
    const handler = new DataBaseHandling();
    const body = req.body;

    let id = body.id;
    let title = body.title;
    let description = body.description;
    let price = body.price;
    let image = body.image;

    let success = await handler.updateProduct(id, title, description, price, image);

    if (success) {
        res.status(200).end("Success");
    } else {
        res.status(500).end("Something went wrong :(");
    }
})

router.post("/admin/images/new", upload.single("image"), async (req: express.Request, res: express.Response) => {

    const form = formidable({ });
    console.log("New Image received!");

    form.parse(req, async (err, fields, files) => { console.log("Jetzadle"); parseImageForm(err, fields, files); });

    res.status(500).end("Not implemented yet");
});

async function parseImageForm(err: Error, fields: formidable.Fields, files: formidable.Files) {
    console.log("Parsing Image Form");
    if (err) {
        throw new Error("Error during image upload");
    }
    console.log(files);
    console.log(fields);
    return new Promise((resolve, reject) => {
        resolve(true);
    });
}