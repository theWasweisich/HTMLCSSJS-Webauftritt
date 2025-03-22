
import express from 'express';
import morgan from 'morgan';
import session from "express-session";
import { FeatureFlags, getData, getFeatureFlags, setData, DataBaseHandling } from "./dataHandling";
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
    // if (
    //     req.path.startsWith("/admin/") ||
    //     req.path.startsWith("/api/admin/")
    // ) {
    //     // TODO: Implement Auth
    //     if (!req.session.token) { res.redirect(307, "/login/"); return; }
    //     if (req.session.token) {
    //         next();
    //         return;
    //     };
    //     res.redirect(307, "/login/");
    //     return
    // }
    next();
})


app.get('/', (_req, res) => {
    res.redirect("/index/");
});

app.post('/api/contact/new', async (req, res) => {
    const body = req.body;
    // console.log(body, typeof body);
    console.log("New Contact Message received!");

    const handler = new DataBaseHandling();
    let result = await handler.newContactMessage(body["name"], body["prename"], body["email"], body["topic"], body["shortMsg"], body["longMsg"]);

    if (result) {
        res.status(201).end("Done");
    } else {
        res.status(500).end("Something went wrong")
    };
});

app.post('/api/login', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();
    
    if (await handler.isUserValid(body["username"], body["password"])) {
        req.session.token = await handler.generateNewAuthToken();
        res.redirect("/admin/");
        return;
    }

    req.session.token = undefined;
    res.status(401).send("Invalid");
});

app.post('/api/users/new', async (req, res) => {
    const body = req.body;
    const handler = new DataBaseHandling();

    let usrname = body["username"];
    let psswd = body["password"];

    if (!(usrname && psswd)) { res.status(400).end("Username and Password need to be provided!"); return; };

    let result = await handler.createUser(usrname, psswd);
    if (result) {
        res.status(201).end("User created");
    } else {
        res.status(500).end("Something went wrong :(");
    }
});

app.get("/api/admin/contact/get", async (req, res) => {
    console.log("Requested Messages!")
    const handler = new DataBaseHandling();

    let result = await handler.getContactMessages();

    res.status(200).json(result);
})

app.use(express.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
