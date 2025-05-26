
class CartManager {
    public bikeId: number;
    public bikeData: {title: string, description: string, price: number} | undefined

    constructor (bikeid: number) {
        this.bikeId = bikeid;

        this.builder();
    }

    public async builder() {
        const elemTitle = document.getElementById("product-name") as HTMLHeadingElement;
        const elemDescription = document.getElementById("product-description") as HTMLParagraphElement;
        const elemPrice = document.getElementById("product-price") as HTMLParagraphElement;
        const elemPriceTags = document.getElementsByClassName("pricetag") as HTMLCollectionOf<HTMLSpanElement>;
        const payButton = document.getElementById("buy-btn") as HTMLButtonElement;

        console.log("Building...");
        await this.fetchProductDetails();

        if (!this.bikeData?.description) {console.error("Description"); return false;}
        if (!this.bikeData?.price) {console.error("Price"); return false;}
        if (!this.bikeData?.title) {console.error("Title"); return false;}

        elemDescription.innerText = this.bikeData.description;
        elemPrice.innerText = `${this.bikeData.price} €`;
        elemTitle.innerText = this.bikeData.title;

        for (const element of elemPriceTags) {
            element.innerText = String(this.bikeData.price);
        };

        payButton.addEventListener("click", (ev) => {
            ev.preventDefault();
            document.querySelector("dialog")?.showModal();
            document.body.style.overflow = 'hidden';
        })
    }

    protected async fetchProductDetails() {
        const endpoint = `/api/products/getSingle?id=${this.bikeId}`;
        const response = await fetch(endpoint);
        if (!response.ok) { console.error("Something went wrong!"); return false; };
        const returnedData = await response.json();
        console.log(returnedData);

        this.bikeData = {
            description: returnedData.description,
            price: returnedData.price,
            title: returnedData.title
        };

        this.fetchProductImage();
    }

    protected async fetchProductImage() {
        const imgElem = document.getElementById("product-image") as HTMLImageElement;
        const endpoint = `/api/product/${this.bikeId}/image/get`;

        let response = await fetch(endpoint);
        if (!response.ok) {
            console.error("Fetching problems...");
            return false;
        };

        let blob = await response.blob();

        let imgUrl = URL.createObjectURL(blob);
        console.debug(imgUrl);

        let imgAlt = response.headers.get("x-image-alt");

        imgElem.src = imgUrl;
        imgElem.alt = imgAlt ? imgAlt : "";
    }
}

var cart: CartManager;

// @ts-ignore
function main() {
    const urlParams = new URLSearchParams(window.location.search);
    const bikeId = urlParams.get("id");

    cart = new CartManager(Number(bikeId));

    console.log(`BikeId: ${bikeId}`);
};

document.addEventListener('DOMContentLoaded', () => {
    main();
})