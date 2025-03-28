
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
    image: File | undefined
}

class ProductDisplay {

    public inputElems: {
        title?: HTMLInputElement,
        description?: HTMLTextAreaElement,
        price?: HTMLInputElement,
        image?: HTMLImageElement,
        imageInput?: HTMLInputElement,
        saveBtn?: HTMLButtonElement,
    };

    private _selectedProductImage: ProductImage | undefined;

    public get selectedProductImage() {
        return this._selectedProductImage;
    }

    public set selectedProductImage(image: ProductImage | undefined) {
        this._selectedProductImage = image;
    }

    public set originalImage(image: ProductImage) {
        console.log("Setting original Image from:");
        console.log(this._originalImage);
        console.log("to:");
        console.log(image);
        this._originalImage = image;
    }

    public get originalImaage() {
        return this._originalImage;
    }

    public originalId: number;
    public originalTitle: string;
    public originalDescription: string;
    public originalPrice: number;
    public _originalImage: ProductImage | undefined;

    public needToSave: boolean = false;
    constructor(
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
        console.log("Setting image to:");
        console.log(this.image)
        this.originalImage = this.image;

        this.inputElems = {};

        this.selectedProductImage = this.originalImage;
        this.setup();
    }

    public setup() {
    };

    public createElement(toAppendTo: HTMLElement) {
        const clone = ProductManager.productTemplate.content.cloneNode(true) as HTMLDivElement;
        this.populateTemplate(clone);
        toAppendTo.appendChild(clone);
    }

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

        this.inputElems.saveBtn = clone.querySelector("button.save-btn") as HTMLButtonElement;
        this.inputElems.saveBtn.addEventListener('click', (ev) => { this.saveBtnHandler(ev); })

        this.setInputDefaults();
    }

    protected setInputDefaults() {
        if (this.inputElems.title) {
            this.inputElems.title.placeholder = this.originalTitle;
        }
        if (this.inputElems.description) {
            this.inputElems.description.placeholder = this.originalDescription;
        }
        if (this.inputElems.price) {
            this.inputElems.price.placeholder = this.originalPrice.toString();
        }
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
        if (!this.selectedProductImage) { this.selectedProductImage = { filename: "", alt: "", image: undefined, path: "" } };
        this.selectedProductImage.image = image;
        this.selectedProductImage.filename = image.name;
        this.selectedProductImage.alt = image.name;
        this.selectedProductImage.path = URL.createObjectURL(image);

        this.updateImage();
    }

    protected async saveBtnHandler(ev: Event) {
        await this.updateProduct();
    }

    private updateImage() {
        console.debug("Updating Image!");
        if (this.selectedProductImage === undefined) { return; }
        let img = this.inputElems.image as HTMLImageElement;
        img.src = this.selectedProductImage.path;
        img.alt = this.selectedProductImage.alt;
    };

    /**
     * @param image The image to use
     * @param image_alt The alt text
     */
    private addImageToFormData(): FormData;
    private addImageToFormData(image: Blob | File, image_alt: string, formData: FormData): FormData;
    private addImageToFormData(image?: Blob | File, image_alt?: string, formData?: FormData): FormData {

        if (image === undefined && image_alt === undefined) {
            if (this.originalImage?.image !== undefined && this.originalImage !== undefined) {
                image = this.originalImage.image;
                image_alt = this.originalImage.alt;
            } else {
                throw new Error("If image and alt are not given, this.originalImage has to be set!");
            }
        } else if (image !== undefined && image_alt !== undefined) {
            image = image as Blob;
            image_alt = image_alt as string;
        }

        formData = new FormData();
        formData.append("image", image as Blob);
        formData.append("image_alt", image_alt as string);

        return formData;
    }

    protected prepareProductFormData() {
        let titleElem = this.inputElems.title as HTMLInputElement;
        let descriptionElem = this.inputElems.description as HTMLTextAreaElement;
        let priceElem = this.inputElems.price as HTMLInputElement
        let image = this.selectedProductImage;

        let title = titleElem.value;
        let description = descriptionElem.value;
        let price = priceElem.value;
        console.info(`Title: ${title}`);
        console.info(`Description: ${description}`);
        console.info(`Price: ${price}`);

        console.groupCollapsed(`SelectedProductImage:`);
        console.log(this.selectedProductImage);
        console.groupEnd();

        let formData = new FormData();
        formData.append("id", this.id.toString());
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);

        console.groupCollapsed(`Prepared FormData1:`);
        for (const singleData of formData.entries()) {
            console.log(singleData);
        }
        console.groupEnd();

        let receivedFormData;
        if (image !== undefined && image.image !== undefined) {
            receivedFormData = this.addImageToFormData(image.image as Blob, image.alt, formData);
        } else {
            receivedFormData = this.addImageToFormData();
        }
        for (const data of receivedFormData.entries()) {
            formData.append(data[0], data[1]);
        }

        console.groupCollapsed(`Prepared FormData:`);
        for (const singleData of formData.entries()) {
            console.log(singleData);
        }
        console.groupEnd();
        return formData;
    }

    public async updateProduct() {
        const endpoint = "/api/admin/products/update";

        console.log("Selected Image:");
        console.log(this.selectedProductImage);

        let formData = this.prepareProductFormData();

        console.log("Formdata:");
        for (const data of formData) {
            console.log(data[0], data[1]);
        }

        let resp = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (resp.ok) {
            console.log("Success");
        } else {
            let txt = await resp.text();
            console.error("Error!");
            console.error(txt);
        }
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

        this.displays.forEach((display) => {
            display.createElement(this.productSection);
        });
    };

    public async loadProducts() {
        const endpoint = "/api/admin/products/get";
        let resp = await fetch(endpoint);
        let jsonResp = await resp.json() as productResponse[];

        for (const resp of jsonResp) {
            let img_path: string = `/api/product/image/get/${resp.id}`;
            let product = new ProductDisplay(
                resp.id,
                resp.title,
                resp.description,
                resp.price,
                {
                    filename: resp.image_filename,
                    path: img_path,
                    alt: resp.image_alt,
                    image: undefined
                }
            );
            this.displays.push(product);
        }
    }
}

var manager: ProductManager;

manager = new ProductManager(document.getElementById("products-output") as HTMLElement);