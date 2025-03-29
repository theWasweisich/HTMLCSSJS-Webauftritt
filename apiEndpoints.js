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
const express_1 = __importDefault(require("express"));
const dataHandling_1 = require("./dataHandling");
const formidable_1 = __importDefault(require("formidable"));
const node_path_1 = __importDefault(require("node:path"));
const apiRouter = express_1.default.Router();
exports.default = apiRouter;
let feature__flags;
(0, dataHandling_1.getFeatureFlags)().then((flags) => {
    feature__flags = flags;
});
apiRouter.post('/contact/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    // console.log(body, typeof body);
    console.log("New Contact Message received!");
    const handler = new dataHandling_1.DataBaseHandling();
    let result = yield handler.newContactMessage(body["name"], body["prename"], body["email"], body["topic"], body["shortMsg"], body["longMsg"]);
    if (result) {
        res.status(201).end("Done");
    }
    else {
        res.status(500).end("Something went wrong");
    }
    ;
}));
apiRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const handler = new dataHandling_1.DataBaseHandling();
    try {
        if (yield handler.isUserValid(body["username"], body["password"])) {
            req.session.token = handler.generateNewAuthToken();
            res.redirect("/admin/");
            return;
        }
    }
    catch (error) {
        res.status(401).send("Invalid :(");
    }
    req.session.token = undefined;
    res.status(401).send("Invalid");
}));
apiRouter.get("/cookies", (req, res) => {
    if (!feature__flags) {
        res.status(500).end("?");
        return;
    }
    ;
    if (!feature__flags.cookieBanner) {
        res.set('x-cookies-disabled', "yes");
    }
    res.end("ok");
});
apiRouter.get("/products/get", function (req, res) {
    const handler = new dataHandling_1.DataBaseHandling();
    const allProducts = handler.getAllProducts();
    let toReturn = allProducts.map(value => {
        return {
            id: value.id,
            title: value.title,
            description: value.description,
            price: value.price,
            stats: value.stats,
        };
    });
    res.json(toReturn);
});
apiRouter.get("/product/:id/image/get/", function (req, res) {
    const productId = req.params.id;
    const handler = new dataHandling_1.DataBaseHandling();
    try {
        var imagePath = handler.getProductImagePath(Number(productId));
        console.log(`The path for the image of product with id ${productId} is ${imagePath}`);
        if (imagePath !== null) {
            imagePath = node_path_1.default.join(__dirname, imagePath);
            res.sendFile(imagePath);
            return;
        }
        ;
    }
    finally {
        res.status(404).end("The requested image could not be found");
    }
});
apiRouter.get("/product/stats/:id", function (req, res) {
    const id = Number(req.params.id);
    const handler = new dataHandling_1.DataBaseHandling();
    if (Number.isNaN(id)) {
        res.status(400).end("Provide a valid product ID");
        return;
    }
    let stats = handler.getProductStats(id);
    res.json(stats);
});
apiRouter.route("/admin/product/:id/stats")
    .delete(function (req, res) {
    res.sendStatus(501);
})
    .put(function (req, res) {
    const handling = new dataHandling_1.DataBaseHandling();
    const stats = JSON.parse(req.body.stats);
    console.log(stats);
    handling.replaceStats(stats, Number(req.params.id));
    res.sendStatus(501);
});
apiRouter.post('/users/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const handler = new dataHandling_1.DataBaseHandling();
    let usrname = body["username"];
    let psswd = body["password"];
    if (!(usrname && psswd)) {
        res.status(400).end("Username and Password need to be provided!");
        return;
    }
    ;
    let result = yield handler.createUser(usrname, psswd);
    if (result) {
        res.status(201).end("User created");
    }
    else {
        res.status(500).end("Something went wrong :(");
    }
}));
apiRouter.get("/admin/contact/get", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Requested Messages!");
    const handler = new dataHandling_1.DataBaseHandling();
    let result = yield handler.getContactMessages();
    res.status(200).json(result);
}));
apiRouter.post("/admin/products/new", (req, res) => {
    const handler = new dataHandling_1.DataBaseHandling();
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
    }
    else {
        res.status(201).end("Success");
    }
    ;
});
apiRouter.delete("/admin/contact/delete", (req, res) => {
    const handler = new dataHandling_1.DataBaseHandling();
    const body = req.body;
    console.log(body);
    let id;
    if (body["multiple"]) {
        id = body["ids"];
    }
    else {
        id = [body["id"]];
    }
    let success = handler.deleteContactMessage(id);
    if (success) {
        res.status(200).end("Success");
    }
    else {
        res.status(500).end(":(");
    }
});
apiRouter.get("/admin/products/get", (req, res) => {
    let handler = new dataHandling_1.DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});
apiRouter.put("/admin/product/:id/update", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = new dataHandling_1.DataBaseHandling();
        const body = req.body;
        console.log(`Body: ${body}`);
        let id;
        let title;
        let description;
        let price;
        id = Number(req.params.id);
        title = body.title;
        description = body.description;
        price = body.price;
        let success = yield handler.updateProduct(id, title, description, price);
        if (success) {
            res.status(200).end("Success");
        }
        else {
            res.status(500).end("Something went wrong :(");
        }
    });
});
apiRouter.put("/admin/product/:id/image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const form = new formidable_1.default.IncomingForm({
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
    form.parse(req, (err, fields, files) => {
        let alt = fields["alt"];
        let filename = fields["filename"];
        console.log(fields);
        console.log(files);
    });
}));
