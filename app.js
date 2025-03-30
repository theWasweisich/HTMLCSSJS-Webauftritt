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
exports.checkAuthMiddleware = checkAuthMiddleware;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const apiEndpoints_1 = __importDefault(require("./apiEndpoints"));
const node_fs_1 = __importDefault(require("node:fs"));
const dataHandling_1 = require("./dataHandling");
const utils_1 = require("./utils");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
var port = 3000;
var customPort = process.argv[2];
if (customPort !== undefined) {
    port = Number(customPort);
}
;
var feature__flags;
(0, dataHandling_1.getFeatureFlags)().then((flags) => {
    feature__flags = flags;
    console.log(feature__flags);
});
app.use((0, morgan_1.default)("common", {
    stream: node_fs_1.default.createWriteStream("./access.log", { encoding: "utf-8", flags: 'a' })
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
const twoDaysInMS = 48 * 60 * 60 * 1000;
app.use((0, express_session_1.default)({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: twoDaysInMS },
    resave: false,
    saveUninitialized: false
}));
app.use((0, cookie_parser_1.default)());
function checkAuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new dataHandling_1.DataBaseHandling();
        var result;
        if (!req.cookies.authToken) {
            let error = new utils_1.HTTPError(401, "No session token available! Aborting...");
            next(error);
        }
        else {
            try {
                result = yield db.isAuthTokenValid(req.cookies.authToken);
            }
            catch (e) {
                next(e);
            }
            if (result) {
                next();
            }
        }
        ;
    });
}
;
app.use((req, res, next) => {
    if (!feature__flags) {
        res.status(500).end("Initialization not finished!");
        return;
    }
    next();
});
app.get('/', (_req, res) => {
    console.log(_req.cookies);
    res.redirect("/index/");
});
app.get("/favicon.ico", (req, res) => {
    return res.redirect(308, "/assets/icons/favicon-dark.svg");
});
app.use("/api/", apiEndpoints_1.default);
app.use(express_1.default.static("src/"));
app.use((err, req, res, next) => {
    if (err instanceof utils_1.HTTPError && err.status === 401) {
        return res.redirect('/login');
    }
    ;
    const status = err instanceof utils_1.HTTPError ? err.status : 500;
    const message = err instanceof utils_1.HTTPError ? err.message : "Server error";
    res.status(status).send(message);
});
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
