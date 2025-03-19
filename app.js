"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
var port = 3000;
var customPort = process.argv[2];
if (customPort !== undefined) {
    port = Number(customPort);
}
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
    });
}
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield promises_1.default.readFile('./data/data.json', { encoding: 'utf-8' }));
    });
}
function setData(data) {
    let currentDate = new Date().toISOString();
    getData().then((currentData) => {
        currentData[currentDate] = data;
        let newData = JSON.stringify(currentData);
        promises_1.default.writeFile(`./data/data.json`, newData, { encoding: 'utf-8' }).then(() => {
            console.log("saved");
        });
    });
}
getFeatureFlags().then((value) => {
});
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.redirect(302, "/index/");
});
app.post('/api/contact/new', (req, res) => {
    const body = req.body;
    console.log(body, typeof body);
    setData(body);
    res.status(200).send("Hi");
});
app.use(express_1.default.static("src/"));
app.listen(port, () => {
    console.log(`Listening on Port ${port}`);
});
