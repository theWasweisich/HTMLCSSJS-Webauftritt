const fs = require("node:fs/promises");
const express = require('express');
const morgan = require('morgan');
const app = express();

const default_port = 3000;

var port = process.argv[2];

if (port === undefined) {
    port = default_port;
}


async function getFeatureFlags() {
    return JSON.parse(await fs.readFile('./feature__flags.json', { encoding: 'utf-8' }));
}

async function getData() {
    return JSON.parse(await fs.readFile('./data/data.json', { encoding: 'utf-8' }));
}
function setData(data) {
    let currentDate = new Date().toISOString();
    getData().then((currentData) => {

        currentData[currentDate] = data;

        let newData = JSON.stringify(currentData);
        fs.writeFile(`./data/data.json`, newData, { encoding: 'utf-8' }).then(() => {
            console.log("saved");
        });
    });
}


app.use(morgan("dev"));
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect("/index/");
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
