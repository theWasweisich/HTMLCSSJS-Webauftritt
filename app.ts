
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
import { v4 as uuidV4 } from "uuid";
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

function checkAuthCredentials(username: string, password: string) {
    for (const user of userAccounts) {
        if (user.username === username) {
            return user.password === password;
        }
    }
    return false;
}

getFeatureFlags().then((value) => {

})


app.use(morgan("dev"));
app.use(express.json());

app.get('/', (_req, res) => {
    res.redirect(302, "/index/");
});

app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);

    setData(body);

    res.status(200).send("Hi");
})

app.post("/api/admin/login", (req, res) => {
    const body = req.body;

    if (checkAuthCredentials(body.username, body.password)) {
        let response = res.writeHead(200, {
            "Set-Cookie": `token=${generateAuthToken()}`,
            "Access-Control-Allow-Credentials": "true"
        });
        response.end("Alles bestens!!!");
    } else {
        res.status(401).send("Ne, das passt nicht!");
    };
})

app.use(express.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
