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
        let broken = this.description.split("\n");
        broken.forEach((str) => {
            let para = document.createElement("p");
            para.textContent = str;
            description.appendChild(para);
        });
        let statsWrapper = clone.querySelector('div.stats');
        this.stats.forEach(stat => {
            let keyElem = document.createElement("span");
            let valueElem = document.createElement("math");
            keyElem.textContent = stat.name + ": ";
            if (stat.type === "kg") {
                valueElem = getMathElement(stat.value.toString(), "kg");
            }
            else if (stat.type === "kmh") {
                valueElem = getMathElement(stat.value.toString(), "kmh");
            }
            else {
                valueElem = getMathElement(stat.value.toString(), "");
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
                url: `/api/product/${data.id}/image/get`,
                alt: data.imgAlt
            }, stats));
        });
    });
}
class SingularTicker {
    set x(value) {
        this.element.style.left = String(value) + "px";
    }
    get x() { return this.elementBoundingBox.left; }
    ;
    set y(value) {
        this.element.style.top = String(value) + "px";
    }
    get y() { return this.elementBoundingBox.top; }
    ;
    constructor(element, index) {
        this.element = element;
        this.index = index;
        this.elementBoundingBox = element.getBoundingClientRect();
        this.x = this.elementBoundingBox.left;
        this.y = 0;
    }
    ;
    positionNextTo(element) {
        let box = element.getBoundingClientRect();
        this.x = box.x + box.width;
    }
}
;
class NewsTicker {
    constructor(tickerBar) {
        this.singleTickers = [];
        this.boundingWidth = 0;
        this.biggestTickerWidth = 0;
        this.tickerBar = tickerBar;
        this.setup();
        this.boundingWidth = tickerBar.getBoundingClientRect().width;
    }
    ;
    setup() {
        let tickerList = this.tickerBar.querySelectorAll("span.ticker");
        tickerList.forEach((ticker) => {
            if (ticker.getBoundingClientRect().width > this.biggestTickerWidth) {
                this.biggestTickerWidth = ticker.getBoundingClientRect().width;
            }
            this.singleTickers.push(new SingularTicker(ticker, this.singleTickers.length));
        });
        this.tickerBar.style.height = String(this.singleTickers[0].elementBoundingBox.height) + "px";
    }
    ;
    startMove() {
        this.singleTickers.forEach((ticker) => {
            ticker.element.animate({});
        });
    }
    spaceOutTickers(spacing) {
        console.log("Spacing out...");
        console.log(this.singleTickers);
        for (let index = 0; index < this.singleTickers.length; index++) {
            if (index === 0) {
                continue;
            }
            ;
            const thisElement = this.singleTickers[index];
            const prevElement = this.singleTickers[index - 1];
            thisElement.positionNextTo(prevElement.element);
        }
    }
    ;
}
NewsTicker.settings = {
    tickerSpeed: 50,
};
;
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
// let tickerBar = new NewsTicker(document.getElementById("newsticker") as HTMLElement);
