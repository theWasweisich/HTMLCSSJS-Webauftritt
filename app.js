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
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const dataHandling_1 = require("./dataHandling");
const app = (0, express_1.default)();
var port = 3000;
var customPort = process.argv[2];
if (customPort !== undefined) {
    port = Number(customPort);
}
const feature__flags = await (0, dataHandling_1.getFeatureFlags)();
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: 172800 },
    resave: false,
    saveUninitialized: false
}));
function checkAuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const isAuthNeeded = req.path.startsWith("/admin/") || req.path.startsWith("/api/admin/");
        if (isAuthNeeded) {
            console.log("Auth is needed");
            if (!req.session.token) {
                res.redirect(307, "/login/");
                return;
            }
            if (req.session.token) {
                try {
                    const db = new dataHandling_1.DataBaseHandling();
                    let res = yield db.isAuthTokenKnown(req.session.token);
                    console.log("DB res: " + res);
                    if (res) {
                        next();
                        return;
                    }
                }
                catch (e) {
                }
            }
            ;
            res.redirect(307, "/login/");
            return;
        }
        next();
    });
}
;
app.use((req, res, next) => {
    if (feature__flags.deactivateAuth)
        [];
    checkAuthMiddleware(req, res, next);
});
app.get('/', (_req, res) => {
    res.redirect("/index/");
});
app.post('/api/contact/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post('/api/users/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.get("/api/admin/contact/get", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Requested Messages!");
    const handler = new dataHandling_1.DataBaseHandling();
    let result = yield handler.getContactMessages();
    res.status(200).json(result);
}));
app.post("/api/admin/products/new", (req, res) => {
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
app.delete("/api/admin/contact/delete", (req, res) => {
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
app.use(express_1.default.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
