
interface productResponse {
    id: number,
    title: string,
    description: string,
    price: number,
    image_filename: string,
    image_alt: string
}

class ProductDisplay {

    public inputElems: {
        title?: HTMLInputElement,
        description?: HTMLTextAreaElement,
        price?: HTMLInputElement,
        image?: HTMLImageElement,
        imageInput?: HTMLInputElement,
    };

    private _selectedImage: File | undefined;
    private _selectedProductImage: ProductImage | undefined;

    public get selectedImage() {
        return this._selectedImage;
    }

    public set selectedImage(image: File | undefined) {
        if (!image) { return; }
        let newImage: ProductImage = {
            filename: image.name,
            alt: image.name,
            path: URL.createObjectURL(image)
        }
        this._selectedImage = image;
        this.selectedProductImage = newImage;
        this.updateImage();
    }

    public get selectedProductImage() {
        return this._selectedProductImage;
    }

    public set selectedProductImage(image: ProductImage | undefined) {
        this._selectedProductImage = image;
    }

    constructor(
        public id: number,
        public title: string,
        public description: string,
        public price: number,
        public image: ProductImage,
    ) {

        this.inputElems = {};
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
        this.inputElems.imageInput.addEventListener("change", (ev) => {
            this.imageInputHandler(ev);
        });

        let imgLabelElem = this.inputElems.imageInput.parentElement as HTMLLabelElement;
        imgLabelElem.htmlFor = this.inputElems.imageInput.id;
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
        console.debug("Files:");
        console.debug(files);
        if (!files) { return; }
        let image = files[0];
        this.selectedImage = image;
    }

    public updateImage() {
        if (this.selectedProductImage === undefined) { return; }
        let img = this.inputElems.image as HTMLImageElement;
        img.src = this.selectedProductImage.path;
        img.alt = this.selectedProductImage.alt;
    }

    public prepareProduct() {
        let titleElem = this.inputElems.title as HTMLInputElement;
        let descriptionElem = this.inputElems.description as HTMLTextAreaElement;
        let priceElem = this.inputElems.price as HTMLInputElement
        let img = this.selectedImage;
    
        let formData = new FormData();
        formData.append("id", this.id.toString());
        formData.append("title", titleElem.value);
        formData.append("description", descriptionElem.value);
        formData.append("price", priceElem.value);
        formData.append("image", img as Blob);

        return formData;
    }

    public async updateProduct() {
        const endpoint = "/api/admin/products/update";

        let formData = this.prepareProduct();

        console.log("Formdata:");
        console.log(formData);

        let resp = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (resp.ok) {
            console.log("Success");
        } else {
            console.error("Error");
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
                    alt: resp.image_alt
                }
            );
            this.displays.push(product);
        }
    }
}

var manager: ProductManager;

manager = new ProductManager(document.getElementById("products-output") as HTMLElement);