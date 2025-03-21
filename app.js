"use strict";
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
    cookie: { maxAge: 172800 }, // Das sind 2 Tage
    resave: false,
    saveUninitialized: false
}));
app.use(function (req, res, next) {
    if (req.path.startsWith("/admin/") ||
        req.path.startsWith("/api/admin/")) {
        if (!req.session.token) {
            res.redirect(307, "/login/");
            return;
        }
        if (req.session.token && (0, dataHandling_1.isAuthTokenValid)(req.session.token)) {
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
    res.redirect(302, "/index/");
});
app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);
    (0, dataHandling_1.setData)(body);
    res.status(200).send("Hi");
});
app.use(express_1.default.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
