
import express from 'express';
import morgan from 'morgan';
import session from "express-session";
import apiRouter from './apiEndpoints';
import fs from 'node:fs';
import { FeatureFlags, getFeatureFlags, DataBaseHandling } from "./dataHandling";
import { logger } from './utils';

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
});

app.use(morgan("common", {
    stream: fs.createWriteStream("./access.log", { encoding: "utf-8", flags: 'a' })
}));
app.use(morgan("dev"));


app.use(express.json());
app.use(session({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: 172_800 }, // Das sind 2 Tage
    resave: false,
    saveUninitialized: false
}));

async function checkAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const isAuthNeeded = req.path.startsWith("/admin/") || req.path.startsWith("/api/admin/");
    
    if (isAuthNeeded) {
        logger.info("Auth is needed!");
        if (!req.session.token) { res.redirect(307, "/login/"); return; }
        if (req.session.token) {
            try {
                const db = new DataBaseHandling();
                let res = await db.isAuthTokenKnown(req.session.token);
                logger.info("DB res: " + res);
                if (res) {
                    next();
                    return;
                }
            } catch (e) {
            }
        };
        res.redirect(307, "/login/"); return;
    }
    next();
};

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!feature__flags) {
        res.status(500).end("Initialization not finished!");
        return;
    }
    if (feature__flags?.checkAuth) {
        checkAuthMiddleware(req, res, next);
    }
    next();
})


app.get('/', (_req, res) => {
    res.redirect("/index/");
});

app.get("/favicon.ico", (req: express.Request, res: express.Response) => {
    return res.redirect(308, "/assets/icons/favicon-dark.svg");
})

app.use("/api/", apiRouter);

app.use(express.static("src/"));
app.listen(port, () => {
    logger.info(`Listening on Port ${port}`);
});
