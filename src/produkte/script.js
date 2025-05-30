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
var cycles = [];
var currentCart;
class Bicycle {
    constructor(id, name, description, price, image, stats) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
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
        let buyButton = clone.querySelector("button.buybtn");
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
        buyButton.addEventListener("click", () => {
            currentCart.addToCart(this.id);
        });
    }
}
Bicycle.cardsGrid = document.getElementById('cards-grid');
//@ts-ignore
class CartOrganizer {
    constructor(cartId) {
        this.cartId = -1;
        this.productIds = [];
        this.products = [];
        this.cartTotal = 0;
        if (cartId) {
            this.cartId = cartId;
        }
        if (cartId !== -1) {
            this.getCartProducts();
        }
    }
    addToCart(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "/api/cart/add";
            const form = new FormData();
            form.append("cart", String(this.cartId));
            form.append("product", String(productId));
            let result = yield fetch(endpoint, {
                body: form,
                method: "POST"
            });
            if (!result.ok) {
                console.error("Not ok!");
                return;
            }
            let cartId = (yield result.json())["cartId"];
            if (isNaN(parseInt(cartId))) {
                return;
            }
            if (this.cartId !== Number(cartId)) {
                this.cartId = Number(cartId);
                console.log("New CartId:", this.cartId);
                localStorage.setItem("cartId", cartId);
            }
            ;
            console.log(result);
            this.getCartProducts();
        });
    }
    ;
    getCartProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `/api/cart/get?cart=${this.cartId}`;
            const res = yield fetch(endpoint);
            if (!res.ok) {
                console.error("Fetching problems...");
                return;
            }
            ;
            const productIds = (yield res.json());
            this.productIds = productIds;
            let totalStr = res.headers.get("x-cart-total");
            this.cartTotal = Number(totalStr);
            this.dataGetter();
        });
    }
    ;
    dataGetter() {
        this.products.length = 0;
        const counts = {};
        const products = [];
        for (const bike of this.productIds) {
            counts[bike] = counts[bike] ? counts[bike] + 1 : 1;
        }
        ;
        for (const cycle of cycles) {
            if (cycle.id in counts) {
                products.push({
                    product: cycle,
                    amount: counts[cycle.id],
                    total: cycle.price * counts[cycle.id]
                });
            }
        }
        ;
        this.products = products;
        this.populateDisplay();
    }
    ;
    populateDisplay() {
        const tableBody = document.querySelector(".cart-info table tbody");
        tableBody.innerHTML = "";
        for (const product of this.products) {
            const name = product.product.name;
            const amount = product.amount;
            const total = product.total;
            const rowElem = document.createElement("tr");
            const nameElem = document.createElement("td");
            const amountElem = document.createElement("td");
            const totalElem = document.createElement("td");
            nameElem.innerText = name;
            amountElem.innerText = `${amount}x`;
            totalElem.innerText = `${total} €`;
            rowElem.appendChild(nameElem);
            rowElem.appendChild(amountElem);
            rowElem.appendChild(totalElem);
            tableBody.appendChild(rowElem);
        }
    }
}
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
            cycles.push(new Bicycle(data.id, data.title, data.description, data.price, {
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
    let price = data["price"];
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
    let cycle = new Bicycle(id, name, description, price, image, stats);
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
function saveCardId(cardId) {
    localStorage.setItem("cartId", String(cardId));
}
function loadCardId() {
    let storedValue = localStorage.getItem("cartId");
    if (storedValue === null) {
        return -1;
    }
    if (isNaN(parseInt(storedValue))) {
        return -1;
    }
    return Number(storedValue);
}
// @ts-ignore
function main() {
    loadBicycles();
    currentCart = new CartOrganizer(loadCardId());
}
main();
// let tickerBar = new NewsTicker(document.getElementById("newsticker") as HTMLElement);
