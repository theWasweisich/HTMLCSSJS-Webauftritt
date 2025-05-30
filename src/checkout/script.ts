
var bikes: { id: number, name: string, price: number }[] = []

// @ts-ignore
class checkoutManager {
    public cartTotal: number = 0;
    protected productIds: number[] = [];
    protected products: { product: {name: string, price: number}, amount: number, total: number }[] = [];

    constructor(
        public cartId: number
    ) {
        this.loadProducts();
    }

    public async loadProducts() {
        const endpoint = `/api/cart/get?cart=${this.cartId}`;
        const res = await fetch(endpoint);
        if (!res.ok) { console.error("Fetching problems..."); return; };
        const productIds = (await res.json()) as number[];
        this.productIds = productIds;

        let totalStr = res.headers.get("x-cart-total");
        this.cartTotal = Number(totalStr);

        this.dataGetter();
    }

    protected dataGetter() {
        this.products.length = 0;
        const counts: { [bikeId: number]: number } = {};
        const products: { product: {name: string, price: number}, amount: number, total: number }[] = [];

        for (const bike of this.productIds) {
            counts[bike] = counts[bike] ? counts[bike] + 1 : 1;
        };


        for (const cycle of bikes) {
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

    private populateDisplay() {
        const tableBody = document.querySelector(".checkout-card table tbody");
        this.products.forEach((product, index, array) => {
            const nameElem = document.createElement("td");
            const amountElem = document.createElement("td");
            const itemizedPriceElem = document.createElement("td");
            const totalElem = document.createElement("td");

            nameElem.innerText = product.product.name;
            amountElem.innerText = `${product.amount}x`;
            itemizedPriceElem.innerText = `${product.product.price} €`;
            totalElem.innerText = `${product.product.price * product.amount} €`;

            const rowElem = document.createElement("tr");
            rowElem.appendChild(nameElem);
            rowElem.appendChild(amountElem);
            rowElem.appendChild(itemizedPriceElem);
            rowElem.appendChild(totalElem);

            tableBody?.appendChild(rowElem);
        });

        const checkoutButton =document.getElementById("checkout-pay-btn");

        document.getElementById("checkout-total")!.innerText = `${this.cartTotal}€`
        checkoutButton?.addEventListener('click', (ev) => {
            (document.getElementById("confirmation-dialog") as HTMLDialogElement).showModal();
            document.body.style.overflow = "hidden";
            this.resetCart();
        });

        const resetBtn = document.getElementById("reset-cart-btn") as HTMLButtonElement;

        resetBtn.addEventListener("click", async (ev) => {
            const res = await this.resetCart();
            if (res) {
                localStorage.removeItem("cartId");
                window.location.reload();
                return;
            };
            console.error("Resetting doesn't work?");
        })

    }

    private async resetCart() {
        const endpoint = `/api/cart/delete?cart=${this.cartId}`;
        const res = await fetch(endpoint);
        return res.ok;
    }
}

var cart: checkoutManager;

async function loadAllBikes() {
    type returnedData = {
        id: number,
        title: string,
        description: string,
        price: number,
        imgAlt: string,
        stats: { name: string, unit: string, value: string }[]
    }

    const fetchRes = await fetch("/api/products/get");
    const dataList = await fetchRes.json() as returnedData[];

    dataList.forEach((bike, index, array) => {
        bikes.push({
            id: bike.id,
            name: bike.title,
            price: bike.price
        })
    })
}

// @ts-ignore
function main() {
    let cardId = localStorage.getItem("cartId");
    if (cardId === null || cardId === "-1") {
        window.location.href = "/produkte";
    };
    loadAllBikes();
    cart = new checkoutManager(Number(cardId));
};

document.addEventListener('DOMContentLoaded', () => {
    main();
})