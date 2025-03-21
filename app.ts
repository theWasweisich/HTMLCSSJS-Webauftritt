
interface FeatureFlags {
    accept_kontakt_msgs: {
        /**
         * Ob der Server eingehende Kontaktformulare annimt
         */
        serverAccept: boolean
        /**
         * Ob der Server eingehende Kontaktformulare auch abspeichert
         */
        serverSave: boolean
    }
}


import fs from "node:fs/promises";
import express from 'express';
import morgan from 'morgan';
const app = express();


var port = 3000;

var customPort = process.argv[2];

if (customPort !== undefined) {
    port = Number(customPort);
}


async function getFeatureFlags(): Promise<FeatureFlags> {
    return JSON.parse(await fs.readFile('./feature__flags.json', { encoding: 'utf-8' }));
}

async function getData() {
    return JSON.parse(await fs.readFile('./data/data.json', { encoding: 'utf-8' }));
}

function setData(data: object) {
    let currentDate = new Date().toISOString();
    getData().then((currentData) => {

        currentData[currentDate] = data;

        let newData = JSON.stringify(currentData);
        fs.writeFile(`./data/data.json`, newData, { encoding: 'utf-8' }).then(() => {
            console.log("saved");
        });
    });
}

getFeatureFlags().then((value) => {
    
})


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
