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
            switch (type) {
                case "kmh":
                    let frac = document.createElement('mfrac');
                    let mtext2 = document.createElement('mtext');
                    mtext1.innerText = "km";
                    mtext2.innerText = "h";
                    frac.appendChild(mtext1);
                    frac.appendChild(mtext2);
                    math.appendChild(frac);
                    break;
                case "kg":
                    mtext1.innerText = "kg";
                    math.appendChild(mtext1);
                    break;
                case "plain":
                    // nothing
                    break;
                default:
                    break;
            }
            return math;
        }
        const template = Bicycle.cardsGrid.querySelector('.card-template');
        if (template === null) {
            throw Error("No template has been found to create a card");
        }
        var clone;
        clone = template.content.cloneNode(true);
        let sectiontext = clone.querySelector(".section-text");
        let imageElem = clone.querySelector('.card img');
        let sectionheading = sectiontext.querySelector('h2');
        let description = sectiontext.querySelector('.product-descr');
        imageElem.src = this.image.url;
        imageElem.alt = this.image.alt;
        sectionheading.textContent = this.name;
        description.textContent = this.description;
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
function getNewData() {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchRes = yield fetch("/api/products/get");
        const dataList = (yield fetchRes.json());
        dataList.forEach((data) => {
            let stats = [];
            data.stats.forEach((stat) => {
                stats.push({
                    name: stat.name,
                    type: stat.unit,
                    value: stat.value
                });
            });
            cycles.push(new Bicycle(data.title, data.description, {
                url: `/api/product/image/get/${data.id}`,
                alt: data.imgAlt
            }, stats));
        });
    });
}
function parseJson(data) {
    let id = data["id"];
    let name = data["name"];
    let description = data["description"];
    let image_filename = data["image"]["file"];
    let image = {
        url: craftImagePath(id),
        alt: data["image"]["alt"]
    };
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
    return __awaiter(this, void 0, void 0, function* () {
        yield getNewData();
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
