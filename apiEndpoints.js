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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const formidable = __importStar(require("formidable"));
const node_path_1 = __importDefault(require("node:path"));
const utils_1 = require("./utils");
const apiRouter = express_1.default.Router();
const formidableConfig = {
    multiples: false,
    uploadDir: './uploads',
    maxFiles: 1,
    maxFileSize: 500 * 1024 * 1024,
    keepExtensions: true,
    filter: (part) => {
        return true;
    },
    allowEmptyFiles: false,
};
exports.default = apiRouter;
let feature__flags;
(0, dataHandling_1.getFeatureFlags)().then((flags) => {
    feature__flags = flags;
});
apiRouter.post('/contact/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const handler = new dataHandling_1.DataBaseHandling();
    const form = formidable.formidable({
        maxFiles: 0,
    });
    let [fields, files] = yield form.parse(req);
    let name;
    let prename;
    let email;
    let topic;
    let shortMsg;
    let longMsg;
    try {
        name = fields["name"][0];
        prename = fields["prename"][0];
        email = fields["email"][0];
        topic = fields["topic"][0];
        shortMsg = fields["shortMsg"][0];
        longMsg = fields["longMsg"][0];
    }
    catch (error) {
        if (error instanceof TypeError) {
            res.status(500).end("");
        }
        else {
            console.error(error);
            console.trace();
            res.sendStatus(500);
        }
        ;
        return;
    }
    ;
    let result = yield handler.newContactMessage(name, prename, email, topic, shortMsg, longMsg);
    if (result) {
        res.status(201).end("Done");
    }
    else {
        res.status(500).end("Something went wrong");
    }
    ;
}));
apiRouter.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const handler = new dataHandling_1.DataBaseHandling();
    let err;
    let username = body["username"];
    let password = body["password"];
    let isUserAuthenticated = false;
    try {
        isUserAuthenticated = yield handler.isUserValid(username, password);
    }
    catch (error) {
        console.error(error);
        err = new utils_1.HTTPError(500, "Irgendwas hat nicht so funktioniert wie es soll!");
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
apiRouter.get("/product/:id/image/get/", function (req, res, next) {
    const productId = req.params.id;
    const handler = new dataHandling_1.DataBaseHandling();
    try {
        var imagePath = handler.getProductImagePath(Number(productId));
        if (imagePath !== null) {
            imagePath = node_path_1.default.join(__dirname, imagePath);
            res.sendFile(imagePath);
        }
        else {
            res.sendStatus(404);
        }
    }
    catch (e) {
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
apiRouter.post("/admin/product/:id/stats", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.error("Product Stats!");
        const handling = new dataHandling_1.DataBaseHandling();
        const formidablee = formidable.formidable({
            maxFiles: 0
        });
        const form = yield formidablee.parse(req);
        let formFields = form[0];
        let field = formFields["stats"][0];
        const stats = JSON.parse(field);
        const productId = Number(req.params.id);
        console.log(`Creating stats for Product ${productId}`);
        console.log(stats);
        let returnValue = handling.replaceStats(stats, productId);
        if (returnValue) {
            res.sendStatus(200);
        }
        else {
            res.sendStatus(501);
        }
    });
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
    const handler = new dataHandling_1.DataBaseHandling();
    let result = yield handler.getContactMessages();
    res.status(200).json(result);
}));
apiRouter.post("/admin/products/new", (req, res) => {
    const handler = new dataHandling_1.DataBaseHandling();
    const incommingForm = formidable.formidable(formidableConfig);
    incommingForm.parse(req, (err, fields, files) => __awaiter(void 0, void 0, void 0, function* () {
        let productId = -1;
        let productTitle;
        let productDescription;
        let productPrice;
        let productImage;
        let productAlt;
        let tmpFile = files.image ? files.image[0] : undefined;
        if (tmpFile === undefined) {
            throw new Error("No Image provided!");
        }
        ;
        productImage = tmpFile;
        let keys = Object.keys(fields);
        console.log("Fields: 📋");
        keys.forEach((value) => {
            console.log(value, fields[value]);
            const fieldValue = fields[value][0];
            if (value === "title") {
                productTitle = fieldValue;
            }
            else if (value === "description") {
                productDescription = fieldValue;
            }
            else if (value === "price") {
                productPrice = Number(fieldValue);
            }
            else if (value === "alt") {
                productAlt = fieldValue;
            }
            ;
        });
        console.log("That's it!");
        let PathToImage = `./uploads/${productImage.newFilename}`;
        productId = (yield handler.newProduct(productTitle, productDescription, productPrice, '', productAlt));
        yield handleImageUpload(productImage, productAlt, productId);
        if (Number.isNaN(productId) || productId < 0) {
            res.status(500).end("Something went wrong :(");
        }
        else {
            res.status(201).json({
                status: "success",
                productId: productId
            });
        }
        ;
    }));
});
apiRouter.delete("/admin/product/:id/delete", (req, res, next) => {
    const productId = req.params.id;
    console.log("Deleting Product " + String(productId));
    if (productId.length <= 0) {
        res.sendStatus(400);
        return;
    }
    ;
    const id = Number(productId);
    if (Number.isNaN(id)) {
        res.sendStatus(400);
        return;
    }
    ;
    const handler = new dataHandling_1.DataBaseHandling();
    let dbRes = handler.deleteProduct(id);
    if (dbRes) {
        res.sendStatus(200);
    }
    else {
        res.sendStatus(500);
    }
});
apiRouter.delete("/admin/contact/delete", (req, res) => {
    const handler = new dataHandling_1.DataBaseHandling();
    const body = req.body;
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
apiRouter.put("/admin/product/:id/update", function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = new dataHandling_1.DataBaseHandling();
        const form = new formidable.Formidable(formidableConfig);
        let id;
        let title;
        let description;
        let price;
        form.parse(req, (err, fields, files) => __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                let err = new utils_1.HTTPError(500);
                next(err);
                return;
            }
            id = Number(req.params.id);
            let success = yield handler.updateProduct(id, title, description, price);
            if (success) {
                res.status(200).end("Success");
            }
            else {
                res.status(500).end("Something went wrong :(");
            }
        }));
    });
});
apiRouter.put("/admin/product/:id/image", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const form = new formidable.Formidable(formidableConfig);
    const handler = new dataHandling_1.DataBaseHandling();
    const productId = req.params.id;
    form.parse(req, (err, fields, files) => __awaiter(void 0, void 0, void 0, function* () {
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
        handleImageUpload(singlefile, alt, Number(productId)).then((returnValue) => {
            handler.cleanImageLeftovers();
        });
        res.sendStatus(201);
    }));
}));
function handleImageUpload(image, alt, productId) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = new dataHandling_1.DataBaseHandling();
        let filenameOfFile = `./uploads/${image.newFilename}`;
        if (!alt || alt.length <= 0) {
            alt = image.originalFilename ? image.originalFilename : '???';
        }
        let res = yield handler.updateProductImage(filenameOfFile, alt, Number(productId));
        return res;
    });
}
