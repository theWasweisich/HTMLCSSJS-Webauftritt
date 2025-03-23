
import express from 'express';
import morgan from 'morgan';
import session from "express-session";
import { FeatureFlags, getFeatureFlags, DataBaseHandling } from "./dataHandling";
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
    // TODO: Implement Auth
    // if (
    //     req.path.startsWith("/admin/") ||
    //     req.path.startsWith("/api/admin/")
    // ) {
    //     
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
    
    try {
        if (await handler.isUserValid(body["username"], body["password"])) {
            req.session.token = handler.generateNewAuthToken();
            res.redirect("/admin/");
            return;
        }
    } catch (error) {
        res.status(401).send("Invalid :(");
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

app.get("/api/admin/contact/get", async (req: express.Request, res: express.Response) => {
    console.log("Requested Messages!")
    const handler = new DataBaseHandling();

    let result = await handler.getContactMessages();

    res.status(200).json(result);
});

app.post("/api/admin/products/new", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
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
    } else {
        res.status(201).end("Success");
    };
});

app.delete("/api/admin/contact/delete", (req: express.Request, res: express.Response) => {
    const handler = new DataBaseHandling();
    const body = req.body;

    console.log(body);
    let success = handler.deleteContactMessage(body["id"]);

    if (success) {
        res.status(200).end("Success");
    } else {
        res.status(500).end(":(");
    }
})

app.use(express.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
