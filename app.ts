
import express from 'express';
import morgan from 'morgan';
import session from "express-session";
import apiRouter from './apiEndpoints';
import fs from 'node:fs';
import { FeatureFlags, getFeatureFlags, DataBaseHandling } from "./dataHandling";
import { HTTPError, getCookies } from './utils';
import cookieParser from 'cookie-parser';

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
};

var feature__flags: FeatureFlags | undefined;

getFeatureFlags().then((flags) => {
    feature__flags = flags;
    console.log(feature__flags);
});

app.use(morgan("common", {
    stream: fs.createWriteStream("./access.log", { encoding: "utf-8", flags: 'a' })
}));
app.use(morgan("dev"));

app.use(express.json());
const twoDaysInMS = 48 * 60 * 60 * 1000;
app.use(session({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: twoDaysInMS },
    resave: false,
    saveUninitialized: false
}));
app.use(cookieParser());

export async function checkAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const db = new DataBaseHandling();

    var result;
    if (!req.cookies.authToken) {
        let error = new HTTPError(401, "No session token available! Aborting...");
        next(error);
    } else {
        try {
            result = db.isAuthTokenValid(req.cookies.authToken);
        } catch (e) {
            next(e);
        }
        if (result) {
            console.info("AuthToken is valid, continuing with request");
            next();
        }
    };
};

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
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

app.get("/favicon.ico", (req: express.Request, res: express.Response) => {
    return res.redirect(308, "/assets/icons/favicon-dark.svg");
})

app.use("/api/", apiRouter);

app.use(express.static("src/"));

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof HTTPError && err.status === 401) {
        return res.redirect('/login');
    };

    const status = err instanceof HTTPError ? err.status : 500;
    const message = err instanceof HTTPError ? err.message : "Server error";

    res.status(status).send(message);
})

app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
