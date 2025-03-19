
type BicycleImage = {
    url: string,
    alt: string
}

type BicycleStat = {
    name: string,
    value: string | number | boolean,
    type: "speed" | "plain" | "mass"
};

class Bicycle {
    static cardsGrid = document.getElementById('cards-grid') as HTMLDivElement;

    constructor(
        public name: string,
        public description: string,
        public image: BicycleImage,
        public stats: Array<BicycleStat>,
    ) { };

    public createElement() {
        function getMathElement(value: string, type: "kmh" | "kg" | "plain") {
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
                case "plain":
                    // nothing
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

        setImgProperties: {
            imageElem.src = this.image.url;
            imageElem.alt = this.image.alt;
        }


        sectionheading.textContent = this.name;
        description.textContent = this.description;

        let statsWrapper = clone.querySelector('div.stats') as HTMLDivElement;

        this.stats.forEach(stat => {
            let keyElem = document.createElement("span");
            let valueElem = document.createElement("math");
            
            
            keyElem.textContent = stat.name + ": ";
            
            if (stat.type === "plain") {
                valueElem = getMathElement(stat.value.toString(), "plain");
            } else if (stat.type === "mass") {
                valueElem = getMathElement(stat.value.toString(), "kg");
            } else if (stat.type === "speed") {
                valueElem = getMathElement(stat.value.toString(), "kmh");
            }
            
            valueElem.classList.add("value");

            statsWrapper.append(keyElem);
            statsWrapper.append(valueElem);

        });
        Bicycle.cardsGrid.appendChild(clone);
    }
}

function craftImagePath(imageName: string) {
    const imagesRoot = "/assets/images/products/";
    return imagesRoot.concat(imageName);
}

function parseJson(data: any) {
    let name = data["name"];
    let description = data["description"];
    let image_filename = data["image"]["file"];
    let image: BicycleImage = { url: craftImagePath(image_filename), alt: data["image"]["alt"] };
    let stats: BicycleStat[] = [];

    for (const statData of data["stats"]) {
        let stat: BicycleStat = {
            name: statData["name"],
            value: statData["value"],
            type: statData["type"]
        };
        stats.push(stat);
    };

    let cycle = new Bicycle(name, description, image, stats);
    console.groupCollapsed("Neues Radl");
    console.log(cycle);
    console.groupEnd();
    cycles.push(cycle);
}

async function loadBicycles(endpoint: string = "bicyles.json") {
    const abortSignal = new AbortController();
    let resp = await fetch(endpoint, {
        signal: abortSignal.signal
    });
    if (!resp.ok) { throw resp.status }
    let data = (await resp.json()) as any[];

    for (const bicycle of data) {
        parseJson(bicycle);
    }

    cycles.forEach(cycle => {
        cycle.createElement();
    })
}

var cycles: Array<Bicycle> = [];

function main() {
    loadBicycles();
}

main();