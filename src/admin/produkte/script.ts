
interface productResponse {
    id: number,
    title: string,
    description: string,
    price: number,
    image_filename: string,
    image_alt: string
}

type ProductImage = {
    path: string,
    filename: string,
    alt: string,
    image: File
}

type ProductStat = {
    id: number,
    name: string,
    unit: string | null,
    value: string | number
}

interface newProductValues {
    title?: string,
    description?: string,
    price?: number,
    image?: File,
    imageAlt?: string
};

abstract class StatWithElem {
    public static elem: HTMLElement;
    public static stat: ProductStat;
}

class NewProductDialog {
    public static dialogElem: HTMLDialogElement = document.getElementById("newProduct") as HTMLDialogElement;

    public static formElems = {
        openBtn: document.getElementById("openNewProductBtn") as HTMLButtonElement,
        submitBtn: document.getElementById("addProductConfirmBtn") as HTMLButtonElement,
        abortBtn: document.getElementById("addProductAbortBtn") as HTMLButtonElement,

        titleInp: document.getElementById("new-title-inp") as HTMLInputElement,
        descriptionInp: document.getElementById("new-description-inp") as HTMLTextAreaElement,
        priceInp: document.getElementById("new-price-inp") as HTMLInputElement,

        imageInp: document.getElementById("new-image-inp") as HTMLInputElement,
        imageAltInp: document.getElementById("new-image-alt-inp") as HTMLInputElement
    }

    public newValues: newProductValues = {};

    constructor() {

    }

    public setup() {
        const openBtn = NewProductDialog.formElems.openBtn;
        const submitBtn = NewProductDialog.formElems.submitBtn;
        const abortBtn = NewProductDialog.formElems.abortBtn;
        const dialogElem = NewProductDialog.dialogElem;
        const form = dialogElem.querySelector("form") as HTMLFormElement;
        
        submitBtn.addEventListener("click", (ev: Event) => {
            ev.preventDefault();
            this.submitHandler().then((value) => {
                NewProductDialog.dialogElem.close(`Value: ${value}`);
            })
        });
        
        abortBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            NewProductDialog.dialogElem.close("abort");
        })
        
        openBtn.addEventListener("click", () => {
            document.body.classList.add("modalOpen");
            NewProductDialog.dialogElem.showModal();
        });
        
        dialogElem.addEventListener("close", (ev: Event) => {
            let value = NewProductDialog.dialogElem.returnValue;
            document.body.classList.remove("modalOpen");
        });

        NewProductDialog.formElems.imageInp.addEventListener("input", (ev) => { this.imageInputHandler(); });
        
        return true;
    };

    public imageInputHandler() {
            const inp = NewProductDialog.formElems.imageInp;
            const altInp = NewProductDialog.formElems.imageAltInp;
            const previewImgElem = NewProductDialog.dialogElem.querySelector(".img-input-wrapper img") as HTMLImageElement;

            let files = inp.files;
            if (files === null) { return };
            if (files?.length > 0) {
                let image = (files as FileList).item(0);
                if (image === null) { return; };
                this.newValues.image = image as File;
                if (altInp.value === "") { altInp.placeholder = image.name };
                let localUrl = URL.createObjectURL(image);
                previewImgElem.src = localUrl;
                previewImgElem.alt = image.name;
                previewImgElem.classList.add("show");
            };
    }

    private async submitHandler(): Promise<boolean> {
        const titleInp = NewProductDialog.formElems.titleInp;
        const descriptionInp = NewProductDialog.formElems.descriptionInp;
        const priceInp = NewProductDialog.formElems.priceInp;
        const altInp = NewProductDialog.formElems.imageAltInp;

        
        this.newValues.title = titleInp.value;
        this.newValues.description = descriptionInp.value;
        this.newValues.price = Number(priceInp.value);
        this.newValues.imageAlt = altInp.value;

        if (this.newValues.title.length <= 0 ||
            this.newValues.description.length <= 0 ||
            Number.isNaN(this.newValues.price) ||
            this.newValues.imageAlt.length <= 0
        ) {
            return false;
        };
        if (!this.newValues.image) {
            console.error("Image not given!");
        };

        let res = await this.uploadAll();

        return res;
    };

    private async uploadAll(): Promise<boolean> {
        const formdata = new FormData();

        if (!this.newValues.title) { console.error("Titel!"); return false }
        if (!this.newValues.description) { console.error("Beschreibung!"); return false }
        if (!this.newValues.price) { console.error("Preis!"); return false }
        if (!this.newValues.image) { console.error("Bild!"); return false }
        if (!this.newValues.imageAlt) { console.error("Alt!"); return false }

        formdata.append("title", this.newValues.title);
        formdata.append("description", this.newValues.description);
        formdata.append("price", this.newValues.price.toString());
        formdata.append("image", this.newValues.image);
        formdata.append("alt", this.newValues.imageAlt);

        const reqRes = await fetch("/api/admin/products/new", {
            body: formdata,
            method: 'POST'
        });

        return reqRes.ok;
    }
}

class UnitSelectionElement {
    public element: HTMLSelectElement;
    constructor() {
        this.element = document.createElement("select");
    }

    public addOption(value: string, text: string) {
        let optionElem = document.createElement("option");
        optionElem.textContent = text;
        optionElem.value = value;
        let elem = this.element.appendChild(optionElem);
        return elem;
    }
}

class ProductDisplay {

    public inputElems: {
        title?: HTMLInputElement,
        description?: HTMLTextAreaElement,
        price?: HTMLInputElement,
        image?: HTMLImageElement,
        imageInput?: HTMLInputElement,
        imageAltInput?: HTMLInputElement,
        statsList?: HTMLElement,
        saveBtn?: HTMLButtonElement,
        deleteBtn?: HTMLButtonElement,
    } = {};

    private _selectedProductImage: ProductImage;

    public get selectedProductImage() {
        return this._selectedProductImage;
    }

    public set selectedProductImage(image: ProductImage) {
        this._selectedProductImage = image;
    }

    public set originalImage(image: ProductImage) {
        this._originalImage = image;
    }

    public get originalImage() {
        return this._originalImage;
    }

    public originalId: number;
    public originalTitle: string;
    public originalDescription: string;
    public originalPrice: number;
    public originalStats: ProductStat[] | undefined;
    private _originalImage: ProductImage;
    public setupDone: boolean = false;

    public needToSave: boolean = false;
    public productStats: ProductStat[] | undefined;
    public rootElement: HTMLDivElement | undefined;

    private constructor(
        public id: number,
        public title: string,
        public description: string,
        public price: number,
        public image: ProductImage,
    ) {
        this.originalId = this.id;
        this.originalTitle = this.title;
        this.originalDescription = this.description;
        this.originalPrice = this.price;

        this._originalImage = this.image;
        this._selectedProductImage = this._originalImage;
        this.selectedProductImage = this.originalImage;

        this.setup()
    };

    private checkProductEdited() {
        let somethingHasBeenEdited = false;

        if (this.inputElems.title?.value !== this.originalTitle) {
            somethingHasBeenEdited = true;
        } else if (this.inputElems.description?.value !== this.originalDescription) {
            somethingHasBeenEdited = true;
        } else if (Number(this.inputElems.price?.value) !== this.originalPrice) {
            somethingHasBeenEdited = true;
        }

        this.rootElement?.classList.toggle("edited", somethingHasBeenEdited);
    }

    public static async create(id: number, title: string, description: string, price: number, image: ProductImage, toAppendTo: HTMLElement) {
        let product = new ProductDisplay(id, title, description, price, image);
        product.createElement(toAppendTo);
        return product;
    }

    private async setup() {
        await this.loadProductStats();
        this.setupDone = true;
    };

    public createElement(toAppendTo: HTMLElement) {
        if (!this.setupDone) { setTimeout(() => { this.createElement(toAppendTo); }); return; };
        const clone = (ProductManager.productTemplate.content.firstElementChild as HTMLDivElement).cloneNode(true);
        this.populateTemplate(clone as HTMLDivElement);
        this.rootElement = toAppendTo.appendChild(clone as HTMLDivElement);
        
        let newStatBtn = this.rootElement.querySelector(".stat .addButton");
        if (newStatBtn === null) { throw new Error("New Stat Button not found!") };

        newStatBtn.addEventListener("click", () => {
            this.statAddBtnListener();
        });

        this.generateStatElems();
    };

    protected populateTemplate(clone: HTMLElement) {

        this.inputElems.title = this.setDataField(clone, "title", this.title) as HTMLInputElement;
        this.inputElems.description = this.setDataField(clone, "description", this.description) as HTMLTextAreaElement;
        this.inputElems.price = this.setDataField(clone, "price", this.price.toString()) as HTMLInputElement;

        this.inputElems.image = (this.setDataField(clone, "image") as HTMLImageElement);
        this.inputElems.image.src = this.image.path;
        this.inputElems.image.alt = this.image.alt;
        this.inputElems.image.id = `image-${this.id}`;

        this.inputElems.imageInput = (this.setDataField(clone, "image-input") as HTMLInputElement);
        let imageChangeButton = clone.querySelector(".file-picker-label .change-image-btn");
        imageChangeButton?.addEventListener('click', (ev) => { this.inputElems.imageInput?.click(); })
        this.inputElems.imageInput.addEventListener("change", (ev) => { this.imageInputHandler(ev); });

        let imgLabelElem = clone.querySelector(".file-picker-label") as HTMLLabelElement;
        imgLabelElem.htmlFor = this.inputElems.imageInput.id;

        let imgAltElem = clone.querySelector('.file-picker-label input') as HTMLInputElement;
        imgAltElem.id = `image-alt-${this.id}`;
        imgAltElem.name = `image-alt-${this.id}`;
        this.inputElems.imageAltInput = imgAltElem;

        this.inputElems.saveBtn = clone.querySelector("button.save-btn") as HTMLButtonElement;
        this.inputElems.saveBtn.addEventListener('click', (ev) => { this.saveBtnHandler(ev); })

        this.inputElems.deleteBtn = clone.querySelector("button.delete-btn") as HTMLButtonElement;
        this.inputElems.deleteBtn.addEventListener('click', async (ev) => { this.deleteBtnHandler(ev); })

        
        this.setInputDefaults();
    }

    protected generateStatElems() {
        if (!this.productStats) { console.error("Stats need to be loaded first!"); return; };
        if (!this.rootElement) { console.error("Please set the root element"); return; };
        this.inputElems.statsList = this.rootElement.querySelector(".stats-list") as HTMLElement;
        if (!(this.inputElems.statsList instanceof HTMLElement)) { console.error("Please set the stats root element"); return; };
        
        this.inputElems.statsList!.querySelector(".stat .nameInput")!.id += String(this.id);
        this.inputElems.statsList!.querySelector(".stat .valueInput")!.id += String(this.id);
        this.inputElems.statsList!.querySelector(".stat .unitInput")!.id += String(this.id);
        this.productStats.forEach(stat => {
            let statRoot = this.generateSingleStatElem(stat);

            (this.inputElems.statsList as HTMLElement).appendChild(statRoot);
        })
    }

    private generateSingleStatElem(stat: ProductStat): HTMLDivElement {

        let statRoot = document.createElement('div');
        statRoot.classList.add("stat");

        let nameInput = document.createElement("input");
        let valueInput = document.createElement("input");
        let unitSelectionElem = new UnitSelectionElement();
        unitSelectionElem.element.id = `stat-unit-${stat.id}`;
        unitSelectionElem.element.classList.add("unitInput");

        let voidOption = unitSelectionElem.addOption("", "");
        let kmhOption = unitSelectionElem.addOption("kmh", "km/h");
        let kgOption = unitSelectionElem.addOption("kg", "kg");

        if (stat.unit === "kmh") {
            kmhOption.selected = true;
        } else if (stat.unit === "kg") {
            kgOption.selected = true;
        } else {
            voidOption.selected = true;
        }

        // console.log(`Statname: ${stat.name}`);
        nameInput.value = stat.name;
        nameInput.classList.add("nameInput");
        nameInput.id = `stat-name-${stat.id}`
        
        // console.log(`Statvalue: ${stat.value}`);
        valueInput.value = String(stat.value);
        valueInput.classList.add("valueInput");
        valueInput.id = `stat-value-${stat.id}`

        let removeBtn = document.createElement("button");
        removeBtn.classList.add("removeBtn");
        removeBtn.textContent = "-"

        removeBtn.addEventListener('click', () => {
            if (!this.productStats) { return; };
            if (!this.inputElems.statsList) { return };

            for (let i = 0; i < this.productStats.length; i++) {
                const currentStat = this.productStats[i];
                if (currentStat.id === stat.id) {
                    this.productStats.splice(i, 1);
                }
            }

            let currentStatElement = this.inputElems.statsList.querySelector(`[data-id="${stat.id}"]`);
            currentStatElement?.remove();
        });

        nameInput.disabled = true;
        valueInput.disabled = true;
        unitSelectionElem.element.disabled = true;

        let appendedNameInput = statRoot.appendChild(nameInput);
        let appendedValueInput = statRoot.appendChild(valueInput);
        statRoot.appendChild(unitSelectionElem.element);
        statRoot.appendChild(removeBtn);

        statRoot.dataset.id = stat.id.toString();


        return statRoot;
    }

    protected statAddBtnListener() {
        let root = this.inputElems.statsList;

        if (!root) {
            console.error("Root not given!");
            return
        }
        if (!this.productStats) {
            console.error("ProductStats not given!");
            return
        }

        let nameInp = document.getElementById(`stat-template-name-${this.id}`) as HTMLInputElement | undefined;
        let valueInp = document.getElementById(`stat-template-value-${this.id}`) as HTMLInputElement | undefined;
        let unitInp = document.getElementById(`stat-template-unit-${this.id}`) as HTMLSelectElement | undefined;

        if (!nameInp) { throw new Error("nameInp fehlt!") };
        if (!valueInp) { throw new Error("ValueInp fehlt!") };
        if (!unitInp) { throw new Error("UnitInp fehlt!") };

        let name = nameInp.value;
        let value = valueInp.value;
        let unit = unitInp.selectedOptions[0].value;

        let statElem = this.generateSingleStatElem({id: -1, name: name, value: value, unit: unit});

        this.productStats.push({
            id: -1,
            name: name,
            unit: unit,
            value: value
        })

        root.appendChild(statElem);
    }

    protected async loadProductStats() {
        const endpoint = `/api/product/stats/${this.id}`;
        const fetchRes = await fetch(endpoint);
        if (!fetchRes.ok) {
            throw new Error("Something went wrong!");
        };
        let jsonResp = await fetchRes.json() as ProductStat[];
        this.productStats = jsonResp;
        this.originalStats = this.productStats;
    }

    protected setInputDefaults() {
        if (this.inputElems.title) {
            this.inputElems.title.placeholder = this.originalTitle;
            this.inputElems.title.addEventListener('input', () => {
            })
        }
        if (this.inputElems.description) {
            this.inputElems.description.placeholder = this.originalDescription;
        }
        if (this.inputElems.price) {
            this.inputElems.price.placeholder = this.originalPrice.toString();
        };
    }

    protected setDataField(root: HTMLElement, field: string, data?: string) {
        let fieldelem = root.querySelector(`[data-field="${field}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLImageElement;
        fieldelem.id = `${field}-inp-${this.id}`;
        fieldelem.name = `${field}-inp-${this.id}`;
        if (!(fieldelem instanceof HTMLImageElement) && data) { fieldelem.value = data };
        return fieldelem;
    }

    protected imageInputHandler(ev: Event) {
        let imgInp = this.inputElems.imageInput as HTMLInputElement;
        let files = imgInp.files;
        if (!files) { return; }
        let image = files[0];
        if (!this.selectedProductImage) {
            console.error("Seleected Product Image not set!");
        }
        if (!this.selectedProductImage) { this.selectedProductImage = { filename: image.name, alt: image.name, image: image, path: "" } };
        this.selectedProductImage.image = image;
        this.selectedProductImage.filename = image.name;
        this.selectedProductImage.alt = image.name;
        this.selectedProductImage.path = URL.createObjectURL(image);

        this.updateImage();
    }

    protected async saveBtnHandler(ev: Event) {
        await this.updateProduct();
    }

    protected async deleteBtnHandler(ev: Event) {
        const confirmMsg = `Möchhten Sie das Produkt "${this.title}" wirklich löschen?`;
        if (!confirm(confirmMsg)) { return; };
        
        const deleteEndpoint = `/api/admin/product/${this.id}/delete`;

        const deleteRes = await fetch(deleteEndpoint, {
            method: 'DELETE',
        });

        if (deleteRes.ok) {
            window.location.reload();
            return true;
        } else {
            return false;
        }
    }

    private updateImage() {
        if (this.selectedProductImage === undefined) { return; }
        let img = this.inputElems.image as HTMLImageElement;
        let imgAlt = this.inputElems.imageAltInput as HTMLInputElement;
        img.src = this.selectedProductImage.path;
        img.alt = this.selectedProductImage.alt;
        imgAlt.value = this.selectedProductImage.alt;
    };

    /**
     * @param image The image to use
     * @param image_alt The alt text
     */
    private addImageToFormData(): FormData;
    private addImageToFormData(image: ProductImage): FormData;
    private addImageToFormData(image?: ProductImage): FormData {

        const isImageAvailable = image !== undefined;

        if (!isImageAvailable) {
            if (this.originalImage !== undefined && this.originalImage.image !== undefined) {
                image = this.originalImage;
            } else {
                throw new Error("If image and alt are not given, this.originalImage has to be set!");
            }
        } else {
            image = image as ProductImage;
        }

        let formData;

        formData = new FormData();
        formData.append("image", image.image);
        formData.append("filename", image.filename);
        formData.append("alt", image.alt as string);

        return formData;
    }

    protected prepareProductFormData() {
        let titleElem = this.inputElems.title as HTMLInputElement;
        let descriptionElem = this.inputElems.description as HTMLTextAreaElement;
        let priceElem = this.inputElems.price as HTMLInputElement

        let title = titleElem.value;
        let description = descriptionElem.value;
        let price = priceElem.value;


        let formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("stats", "");

        return formData;
    }

    public async updateProduct() {
        const endpoint = `/api/admin/product/${this.id}/update`;

        let formData = this.prepareProductFormData();

        await this.updateStats();
        await this.sendImageToServer();

        let resp = await fetch(endpoint, {
            method: "PUT",
            body: formData
        });

        if (resp.ok) {
            window.location.reload();
            return;
        } else {
            let txt = await resp.text();
            console.error("Error!");
            console.error(txt);
        }
    }

    private async updateStats() {
        if (!this.productStats) { throw new Error("Stats need to be set!"); };

        this.productStats.forEach(stat => {
            stat as ProductStat;
        });

        let statsJson: string = JSON.stringify(this.productStats);

        const formData = new FormData();
        formData.append("stats", statsJson);

        const endpoint = `/api/admin/product/${this.id}/stats`;

        let fetchRes = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!fetchRes.ok) {
            let resText = await fetchRes.text();
            console.error(resText);
            return false;
        }
        return true;
    }

    public async sendImageToServer() {
        const endpoint = `/api/admin/product/${this.id}/image`;
        let formData: FormData;

        if (this.selectedProductImage !== undefined) {
            formData = this.addImageToFormData(this.selectedProductImage);
        } else {
            formData = this.addImageToFormData();
        };

        let fetchRes = await fetch(endpoint, {
            method: "PUT",
            body: formData
        });

        if (fetchRes.ok) {
            return true;
        }
        let text = await fetchRes.text();
        console.error(text);
        return false;
    }
}

class ProductManager {
    public static productTemplate: HTMLTemplateElement = document.getElementById("product-template") as HTMLTemplateElement;
    public displays: ProductDisplay[];

    constructor(
        public productSection: HTMLElement,
    ) {
        this.displays = [];
        this.setup();
    }

    public async setup() {
        await this.loadProducts();
    };

    public async loadProducts() {
        const endpoint = "/api/admin/products/get";
        let resp = await fetch(endpoint);
        let jsonResp = await resp.json() as productResponse[];

        for (const resp of jsonResp) {
            let img_path: string = `/api/product/${resp.id}/image/get`;
            let image = await ((await fetch(img_path)).blob()) as File;
            let product = await ProductDisplay.create(
                resp.id,
                resp.title,
                resp.description,
                resp.price,
                {
                    filename: resp.image_filename,
                    path: img_path,
                    alt: resp.image_alt,
                    image: image
                },
                this.productSection
            );
            this.displays.push(product);
        }
    }
}

var manager: ProductManager;
var newDialog: NewProductDialog;

manager = new ProductManager(document.getElementById("products-output") as HTMLElement);
newDialog = new NewProductDialog();
console.log(newDialog.setup());