
var cycles: Array<Bicycle> = [];
var currentCart: CartOrganizer;

type BicycleImage = {
    url: string,
    alt: string
}

type BicycleStat = {
    name: string,
    value: string | number | boolean,
    type: string
};

class Bicycle {
    static cardsGrid = document.getElementById('cards-grid') as HTMLDivElement;

    constructor(
        public id: number,
        public name: string,
        public description: string,
        public price: number,
        public image: BicycleImage,
        public stats: Array<BicycleStat>,
    ) { };

    public createElement() {
        function getMathElement(value: string, type: string) {
            let math = document.createElement('math');
            let mtext1 = document.createElement('mtext');
            let mvalue = document.createElement('mtext');
            mvalue.innerText = value;

            math.appendChild(mvalue);

            switch (type) {
                case "kmh":
                    let frac = document.createElement('mfrac');
                    let mtext2 = document.createElement('mtext');
                    mtext1.innerText = "km"
                    mtext2.innerText = "h"
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

            return math
        }

        const template = Bicycle.cardsGrid.querySelector('.card-template') as HTMLTemplateElement | null;
        if (template === null) { throw Error("No template has been found to create a card"); }
        var clone: DocumentFragment;
        clone = template.content.cloneNode(true) as DocumentFragment;

        let sectiontext = clone.querySelector(".section-text") as HTMLDivElement;
        let imageElem = clone.querySelector('.card img') as HTMLImageElement;
        let sectionheading = sectiontext.querySelector('h2') as HTMLHeadingElement;
        let description = sectiontext.querySelector('.product-descr') as HTMLParagraphElement;
        let buyButton = clone.querySelector("button.buybtn") as HTMLButtonElement;

        imageElem.src = this.image.url;
        imageElem.alt = this.image.alt;


        sectionheading.textContent = this.name;
        let broken = this.description.split("\n");
        broken.forEach((str) => {
            let para = document.createElement("p");
            para.textContent = str;
            description.appendChild(para);
        })

        let statsWrapper = clone.querySelector('div.stats') as HTMLDivElement;

        this.stats.forEach(stat => {
            let keyElem = document.createElement("span");
            let valueElem = document.createElement("math");
            
            
            keyElem.textContent = stat.name + ": ";
            
            if (stat.type === "kg") {
                valueElem = getMathElement(stat.value.toString(), "kg");
            } else if (stat.type === "kmh") {
                valueElem = getMathElement(stat.value.toString(), "kmh");
            } else {
                valueElem = getMathElement(stat.value.toString(), "");
            }
            
            valueElem.classList.add("value");

            statsWrapper.append(keyElem);
            statsWrapper.append(valueElem);

        });
        Bicycle.cardsGrid.appendChild(clone);

        buyButton.addEventListener("click", () => {
            currentCart.addToCart(this.id);
        })
    }
}

//@ts-ignore
class CartOrganizer {
    public cartId: number = -1;
    public productIds: number[] = [];
    public products: {product: Bicycle, amount: number, total: number}[] = [];
    public cartTotal: number = 0;

    constructor(cartId?: number) {
        if (cartId) {
            this.cartId = cartId;
        }

        if (cartId !== -1) {
            this.getCartProducts();
        }
    }

    public async addToCart(productId: number) {
        const endpoint = "/api/cart/add";
        const form = new FormData();

        form.append("cart", String(this.cartId));
        form.append("product", String(productId));

        let result = await fetch(endpoint, {
            body: form,
            method: "POST"
        });

        if (!result.ok) { console.error("Not ok!"); return; }

        let cartId = (await result.json())["cartId"];

        if (isNaN(parseInt(cartId))) {
            return
        }

        if (this.cartId !== Number(cartId)) {
            this.cartId = Number(cartId);
            console.log("New CartId:", this.cartId);
            localStorage.setItem("cartId", cartId);
        };

        console.log(result);
        this.getCartProducts();
    };

    public async getCartProducts() {
        const endpoint = `/api/cart/get?cart=${this.cartId}`;
        const res = await fetch(endpoint);
        if (!res.ok) { console.error("Fetching problems..."); return; };
        const productIds = (await res.json()) as number[];
        this.productIds = productIds;

        let totalStr = res.headers.get("x-cart-total");
        this.cartTotal = Number(totalStr);

        this.dataGetter();
    };

    protected dataGetter() {
        this.products.length = 0;
        const counts: {[bikeId: number]: number} = {};
        const products: {product: Bicycle, amount: number, total: number}[] = [];

        for (const bike of this.productIds) {
            counts[bike] = counts[bike] ? counts[bike] + 1 : 1;
        };


        for (const cycle of cycles) {
            if (cycle.id in counts) {
                products.push({
                    product: cycle,
                    amount: counts[cycle.id],
                    total: cycle.price * counts[cycle.id]
                });
            }
        };

        this.products = products;
        this.populateDisplay();
    };

    protected populateDisplay() {
        const tableBody = document.querySelector(".cart-info table tbody") as HTMLTableSectionElement;
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
            amountElem.innerText = `${amount}x`
            totalElem.innerText = `${total} €`;

            rowElem.appendChild(nameElem);
            rowElem.appendChild(amountElem);
            rowElem.appendChild(totalElem);

            tableBody.appendChild(rowElem);
        }
    }
}

function craftImagePath(imageName: string) {
    const imagesRoot = "/assets/images/products/";
    return imagesRoot.concat(imageName);
}

type returnedData = {
    id: number,
    title: string,
    description: string,
    price: number,
    imgAlt: string
}

async function getNewData() {
    type returnedData = {
        id: number,
        title: string,
        description: string,
        price: number,
        imgAlt: string,
        stats: {name: string, unit: string, value: string}[]
    }

    const fetchRes = await fetch("/api/products/get");
    const dataList = (await fetchRes.json()) as returnedData[];

    dataList.forEach((data) => {
        let stats: BicycleStat[] = []
;
        data.stats.forEach((stat) => {
            stats.push({
                name: stat.name,
                type: stat.unit,
                value: stat.value
            })
        });
        cycles.push(new Bicycle(
            data.id,
            data.title,
            data.description,
            data.price,
            {
                url: `/api/product/${data.id}/image/get`,
                alt: data.imgAlt
            },
            stats
        ))
    })
}

class SingularTicker {
    public elementBoundingBox: DOMRect;

    public set x(value: number) {
        this.element.style.left = String(value) + "px";
    }
    public get x() { return this.elementBoundingBox.left; };

    public set y(value: number) {
        this.element.style.top = String(value) + "px";
    }
    public get y() { return this.elementBoundingBox.top; };

    constructor(
        public element: HTMLElement,
        public index: number,
    ) {
        this.elementBoundingBox = element.getBoundingClientRect();
        this.x = this.elementBoundingBox.left;
        this.y = 0;
    };

    public positionNextTo(element: HTMLElement) {
        let box = element.getBoundingClientRect();
        this.x = box.x + box.width;
    }
};

class NewsTicker {
    public static settings = {
        tickerSpeed: 50,
    };

    public tickerBar: HTMLElement;
    private singleTickers: SingularTicker[] = [];
    private boundingWidth: number = 0;
    private biggestTickerWidth: number = 0;

    constructor(tickerBar: HTMLElement) {
        this.tickerBar = tickerBar;
        this.setup();
        this.boundingWidth = tickerBar.getBoundingClientRect().width;
    };

    private setup() {
        let tickerList = this.tickerBar.querySelectorAll("span.ticker") as NodeListOf<HTMLSpanElement>;
        tickerList.forEach((ticker) => {
            if (ticker.getBoundingClientRect().width > this.biggestTickerWidth) {
                this.biggestTickerWidth = ticker.getBoundingClientRect().width;
            }
            this.singleTickers.push(new SingularTicker(ticker, this.singleTickers.length));
        });
        this.tickerBar.style.height = String(this.singleTickers[0].elementBoundingBox.height) + "px";
    };

    private startMove() {
        this.singleTickers.forEach((ticker) => {
            ticker.element.animate({});
        })
    }

    private spaceOutTickers(spacing: number) {
        console.log("Spacing out...");
        console.log(this.singleTickers);

        for (let index = 0; index < this.singleTickers.length; index++) {
            if (index === 0) { continue };
            const thisElement = this.singleTickers[index];
            const prevElement = this.singleTickers[index - 1];

            thisElement.positionNextTo(prevElement.element);
        }
    };
};

function parseJson(data: any) {
    let id = data["id"];
    let name = data["name"];
    let description = data["description"];
    let price = data["price"];
    let image_filename = data["image"]["file"];


    let image: BicycleImage = {
        url: craftImagePath(id),
        alt: data["image"]["alt"]
    };
    let stats: BicycleStat[] = [];

    for (const statData of data["stats"]) {
        let stat: BicycleStat = {
            name: statData["name"],
            value: statData["value"],
            type: statData["type"]
        };
        stats.push(stat);
    };

    let cycle = new Bicycle(id, name, description, price, image, stats);
    console.groupCollapsed("Neues Radl");
    console.log(cycle);
    console.groupEnd();
    cycles.push(cycle);
}

async function loadBicycles() {
    await getNewData();

    cycles.forEach(cycle => {
        cycle.createElement();
    });
}

function saveCardId(cardId: number) {
    localStorage.setItem("cartId", String(cardId));
}

function loadCardId(): number {
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