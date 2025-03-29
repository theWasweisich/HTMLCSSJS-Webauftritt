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
const dataHandling_1 = require("../dataHandling");
const path_1 = __importDefault(require("path"));
const formidable_1 = __importDefault(require("formidable"));
const utils_1 = require("../utils");
const productsApiRouter = express_1.default.Router();
exports.default = productsApiRouter;
productsApiRouter.get("products/get", function (req, res) {
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
productsApiRouter.get("/product/:id/image/get/", function (req, res) {
    const productId = req.params.id;
    const handler = new dataHandling_1.DataBaseHandling();
    try {
        var imagePath = handler.getProductImagePath(Number(productId));
        utils_1.logger.info(`${productId} -> ${imagePath}`);
        if (imagePath !== null) {
            imagePath = path_1.default.join(__dirname, "../", imagePath);
            utils_1.logger.info(`Path: ${imagePath}`);
            res.status(200).sendFile(imagePath);
            return;
        }
        ;
    }
    catch (e) {
        res.status(404).end("The requested image could not be found");
    }
});
productsApiRouter.get("/product/stats/:id", function (req, res) {
    const id = Number(req.params.id);
    const handler = new dataHandling_1.DataBaseHandling();
    if (Number.isNaN(id)) {
        res.status(400).end("Provide a valid product ID");
        return;
    }
    let stats = handler.getProductStats(id);
    res.json(stats);
});
productsApiRouter.route("/admin/product/:id/stats")
    .all((req, res, next) => {
    next();
})
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
productsApiRouter.post("/admin/products/new", (req, res) => {
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
productsApiRouter.get("/admin/products/get", (req, res) => {
    let handler = new dataHandling_1.DataBaseHandling();
    let response = handler.getAllProducts();
    res.json(response);
});
productsApiRouter.put("/admin/product/:id/update", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = new dataHandling_1.DataBaseHandling();
        const body = req.body;
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
productsApiRouter.put("/admin/product/:id/image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    });
}));
