
import fs from "node:fs/promises";
import express from 'express';
import morgan from 'morgan';
import session from "express-session";
import { FeatureFlags, getData, getFeatureFlags, setData, isAuthTokenValid } from "./dataHandling";
const app = express();

declare module 'express-session' {
    interface SessionData {
        token: string
    }
}


var port = 3000;

var customPort = process.argv[2];

if (customPort !== undefined) {
    port = Number(customPort);
}



app.use(morgan("dev"));
app.use(express.json());
app.use(session({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: 172_800 }, // Das sind 2 Tage
    resave: false,
    saveUninitialized: false
}));

app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
    if (
        req.path.startsWith("/admin/") ||
        req.path.startsWith("/api/admin/")
    ) {
        if (!req.session.token) { res.redirect(307, "/login/"); return; }
        if (req.session.token && isAuthTokenValid(req.session.token)) {
            next();
            return;
        };
        res.redirect(307, "/login/");
        return
    }
    next();
})


app.get('/', (_req, res) => {
    res.redirect(302, "/index/");
})

app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);

    setData(body);

    res.status(200).send("Hi");
})

app.use(express.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
