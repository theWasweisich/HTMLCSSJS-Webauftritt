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
exports.getFeatureFlags = getFeatureFlags;
exports.getData = getData;
exports.setData = setData;
const promises_1 = __importDefault(require("node:fs/promises"));
function getFeatureFlags() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield promises_1.default.readFile('./feature__flags.json', { encoding: 'utf-8' }));
    });
}
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(yield promises_1.default.readFile('data/data.json', { encoding: 'utf-8' }));
        return data;
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
