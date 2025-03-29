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
const apiEndpoints_1 = __importDefault(require("./apiEndpoints"));
const node_fs_1 = __importDefault(require("node:fs"));
const dataHandling_1 = require("./dataHandling");
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
});
app.use((0, morgan_1.default)("common", {
    stream: node_fs_1.default.createWriteStream("./access.log", { encoding: "utf-8", flags: 'a' })
}));
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
    if (!feature__flags) {
        res.status(500).end("Initialization not finished!");
        return;
    }
    if (feature__flags === null || feature__flags === void 0 ? void 0 : feature__flags.checkAuth) {
        checkAuthMiddleware(req, res, next);
    }
    next();
});
app.get('/', (_req, res) => {
    res.redirect("/index/");
});
app.get("/favicon.ico", (req, res) => {
    return res.redirect(308, "/assets/icons/favicon-dark.svg");
});
app.use("/api/", apiEndpoints_1.default);
app.use(express_1.default.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
