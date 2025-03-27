
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
    };

    private _selectedProductImage: ProductImage | undefined;

    public get selectedProductImage() {
        return this._selectedProductImage;
    }

    public set selectedProductImage(image: ProductImage | undefined) {
        this._selectedProductImage = image;
    }

    public originalId: number;
    public originalTitle: string;
    public originalDescription: string;
    public originalPrice: number;
    public originalImage: ProductImage;

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
        if (!this.selectedProductImage) { throw new Error("AAAAAAAAAAAAAAAAAAA") };
        this.selectedProductImage.image = image;
        this.selectedProductImage.filename = image.name;
        this.selectedProductImage.alt = image.name;
        this.selectedProductImage.path = URL.createObjectURL(image);

        this.updateImage();
    }

    private updateImage() {
        if (this.selectedProductImage === undefined) { return; }
        let img = this.inputElems.image as HTMLImageElement;
        img.src = this.selectedProductImage.path;
        img.alt = this.selectedProductImage.alt;
    };

    private async sendNewImageToServer(image: Blob) {
        console.log("Sending new image to server");
        let formData = new FormData();
        formData.append("image", image);

        const endpoint = "/api/admin/images/new";
        let resp = await fetch(endpoint, {
            method: "POST",
            body: formData
        })

        if (resp.ok) {
            console.log("Success");
            let json = await resp.json();
            let filepath = json["path"];
            if (filepath) {
                return filepath;
            }
        } else {
            console.error("Error");
        };
        return new Error("Error during file upload");
    }

    protected prepareProductFormData() {
        let titleElem = this.inputElems.title as HTMLInputElement;
        let descriptionElem = this.inputElems.description as HTMLTextAreaElement;
        let priceElem = this.inputElems.price as HTMLInputElement

        let formData = new FormData();
        formData.append("id", this.id.toString());
        formData.append("title", titleElem.value);
        formData.append("description", descriptionElem.value);
        formData.append("price", priceElem.value);

        if (this.selectedProductImage?.image) {
            console.log("Image is set! adding it to form data")
            formData.append("image", this.selectedProductImage.image as Blob);
            formData.append("image-alt", this.selectedProductImage.alt);
        }

        return formData;
    }

    public async updateProduct() {
        const endpoint = "/api/admin/products/update";

        console.log("Selected Image:");
        console.log(this.selectedProductImage);
        if (this.selectedProductImage !== undefined) {
            console.warn("Skippinng seperate Image send");
            // await this.sendNewImageToServer(this.selectedImage);
        }

        let formData = this.prepareProductFormData();

        console.log("Formdata:");
        console.log(formData);

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
        })
    }

    public async loadProducts() {
        const endpoint = "/api/admin/products/get";
        let resp = await fetch(endpoint);
        let jsonResp = await resp.json() as productResponse[];

        for (const resp of jsonResp) {
            let img_path: string = "/assets/images/products/" + resp.image_filename;
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