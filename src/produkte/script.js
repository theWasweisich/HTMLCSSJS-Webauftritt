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
class Bicycle {
    constructor(name, description, image, stats) {
        this.name = name;
        this.description = description;
        this.image = image;
        this.stats = stats;
    }
    ;
    createElement() {
        function getMathElement(value, type) {
            let math = document.createElement('math');
            let mtext1 = document.createElement('mtext');
            let mvalue = document.createElement('mtext');
            mvalue.innerText = value;
            math.appendChild(mvalue);
            if (type == "kmh") {
                let frac = document.createElement('mfrac');
                let mtext2 = document.createElement('mtext');
                mtext1.innerText = "km";
                mtext2.innerText = "h";
                frac.appendChild(mtext1);
                frac.appendChild(mtext2);
                math.appendChild(frac);
            }
            else if (type === "kg") {
                mtext1.innerText = "kg";
                math.appendChild(mtext1);
            }
            else if (type === "plain") {
                // Nothing to do
            }
            return math;
        }
        const template = document.querySelector('.card-template');
        if (template === null) {
            throw Error("No template has been found to create a card");
        }
        const clone = template.content.cloneNode(true);
        let imageElem = clone.querySelector('.card img');
        imageElem.src = this.image.url;
        imageElem.alt = this.image.alt;
        let sectiontext = clone.querySelector(".section-text");
        sectiontext.querySelector('h2').textContent = this.name;
        sectiontext.querySelector('.product-descr').textContent = this.description;
        let statsWrapper = clone.querySelector('div.stats');
        this.stats.forEach(stat => {
            let keyElem = document.createElement("span");
            let valueElem = document.createElement("math");
            keyElem.textContent = stat.name + ": ";
            if (stat.type === "plain") {
                valueElem = getMathElement(stat.value.toString(), "plain");
            }
            else if (stat.type === "mass") {
                valueElem = getMathElement(stat.value.toString(), "kg");
            }
            else if (stat.type === "speed") {
                valueElem = getMathElement(stat.value.toString(), "kmh");
            }
            valueElem.classList.add("value");
            statsWrapper.append(keyElem);
            statsWrapper.append(valueElem);
        });
        Bicycle.cardsGrid.appendChild(clone);
    }
}
Bicycle.cardsGrid = document.getElementById('cards-grid');
function craftImagePath(imageName) {
    const imagesRoot = "/assets/images/products/";
    return imagesRoot.concat(imageName);
}
function parseJson(data) {
    let name = data["name"];
    let description = data["description"];
    let image_filename = data["image"]["file"];
    let image = { url: craftImagePath(image_filename), alt: data["image"]["alt"] };
    let stats = [];
    for (const statData of data["stats"]) {
        let stat = {
            name: statData["name"],
            value: statData["value"],
            type: statData["type"]
        };
        stats.push(stat);
    }
    ;
    let cycle = new Bicycle(name, description, image, stats);
    console.groupCollapsed("Neues Radl");
    console.log(cycle);
    console.groupEnd();
    cycles.push(cycle);
}
function loadBicycles() {
    return __awaiter(this, arguments, void 0, function* (endpoint = "bicyles.json") {
        const abortSignal = new AbortController();
        let resp = yield fetch(endpoint, {
            signal: abortSignal.signal
        });
        if (!resp.ok) {
            throw resp.status;
        }
        let data = (yield resp.json());
        for (const bicycle of data) {
            parseJson(bicycle);
        }
        cycles.forEach(cycle => {
            cycle.createElement();
        });
    });
}
var cycles = [];
function main() {
    loadBicycles();
}
main();
