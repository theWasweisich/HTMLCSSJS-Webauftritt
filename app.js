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
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const dataHandling_1 = require("./dataHandling");
const app = (0, express_1.default)();
var port = 3000;
var customPort = process.argv[2];
if (customPort !== undefined) {
    port = Number(customPort);
}
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: 172800 },
    resave: false,
    saveUninitialized: false
}));
app.use(function (req, res, next) {
    if (req.path.startsWith("/admin/") ||
        req.path.startsWith("/api/admin/")) {
        // TODO: Implement Auth
        if (!req.session.token) {
            res.redirect(307, "/login/");
            return;
        }
        if (req.session.token) {
            next();
            return;
        }
        ;
        res.redirect(307, "/login/");
        return;
    }
    next();
});
app.get('/', (_req, res) => {
    res.redirect("/index/");
});
app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);
    (0, dataHandling_1.setData)(body);
    res.status(200).send("Hi");
});
app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const handler = new dataHandling_1.DataBaseHandling();
    if (yield handler.isUserValid(body["username"], body["password"])) {
        req.session.token = yield handler.generateNewAuthToken();
        res.redirect("/admin/");
        return;
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
app.use(express_1.default.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
