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
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
exports.default = router;
let feature__flags;
(0, dataHandling_1.getFeatureFlags)().then((flags) => {
    feature__flags = flags;
});
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post('/contact/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/cookies", (req, res) => {
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
router.get("/products/get", function (req, res) {
    const handler = new dataHandling_1.DataBaseHandling();
    const allProducts = handler.getAllProducts();
    let toReturn = allProducts.map(value => {
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
router.post('/users/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.get("/admin/contact/get", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Requested Messages!");
    const handler = new dataHandling_1.DataBaseHandling();
    let result = yield handler.getContactMessages();
    res.status(200).json(result);
}));
router.post("/admin/products/new", (req, res) => {
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
router.delete("/admin/contact/delete", (req, res) => {
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
router.get("/admin/products/get", (req, res) => {
    let handler = new dataHandling_1.DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});
router.post("/admin/products/update", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = new dataHandling_1.DataBaseHandling();
        const body = req.body;
        let id = body.id;
        let title = body.title;
        let description = body.description;
        let price = body.price;
        let image = body.image;
        let success = yield handler.updateProduct(id, title, description, price, image);
        if (success) {
            res.status(200).end("Success");
        }
        else {
            res.status(500).end("Something went wrong :(");
        }
    });
});
router.post("/admin/images/new", upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const handler = new dataHandling_1.DataBaseHandling();
    const body = req.body;
    const file = req.file;
    if (!file) {
        res.status(400).end("No file provided");
        return;
    }
    const image = file.buffer;
    let filename = file.originalname;
    let alt = body.alt;
    console.log("New Image received!");
    console.log("Filename: " + filename);
    console.log("Alt: " + alt);
    let success = yield handler.uploadImage(image, filename, alt);
    if (success) {
        res.status(201).end("Success");
    }
    else {
        res.status(500).end("Something went wrong :(");
    }
}));
