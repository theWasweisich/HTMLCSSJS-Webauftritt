
import * as dataHandling from './dataHandling';
import express from 'express';
import morgan from 'morgan';
import { v4 as uuidV4 } from "uuid";
import session from "express-session";

declare module 'express-session' {
    interface SessionData {
        token: string
    }
}


const app = express();

var port = 3000;

var customPort = process.argv[2];

if (customPort !== undefined) {
    port = Number(customPort);
}

const userAccounts: Array<{ username: string, password: string, type?: "ADMIN" | "USER" }> = [
    {
        username: "admin",
        password: "password",
        type: "ADMIN"
    }
]


var valid_auth_tokens: Array<string> = [];

function generateAuthToken(): string {
    let token = uuidV4();
    valid_auth_tokens.push(token);
    return token;
}

function isAuthTokenValid(token: string): boolean {
    return valid_auth_tokens.includes(token);
}

function checkAuthCredentials(username: string, password: string) {
    for (const user of userAccounts) {
        if (user.username === username) {
            return user.password === password;
        }
    }
    return false;
}


dataHandling.getFeatureFlags().then(value => {

})


app.use(morgan("dev"));
app.use(express.json());
app.use(session({
    secret: "dies ist sehr geheim",
    cookie: { maxAge: 60000 },
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
    res.redirect("/index/");
});

app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);

    dataHandling.setData(body);

    res.status(200).send("Hi");
})

app.get('/api/admin/contact/get', async (req: express.Request, res: express.Response) => {
    let data = await dataHandling.getData();
    res.send(JSON.stringify(data));
})

app.post("/api/login", (req, res) => {
    const body = req.body;

    if (checkAuthCredentials(body.username, body.password)) {
        req.session.token = generateAuthToken();
        res.redirect(303, "/admin/");
    } else {
        res.status(401).send("Ne, das passt nicht!");
    };
})

app.use(express.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
