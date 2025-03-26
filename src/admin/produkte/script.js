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
class ProductDisplay {
    get selectedImage() {
        return this._selectedImage;
    }
    set selectedImage(image) {
        if (!image) {
            return;
        }
        let newImage = {
            filename: image.name,
            alt: image.name,
            path: URL.createObjectURL(image)
        };
        this._selectedImage = image;
        this.selectedProductImage = newImage;
        this.updateImage();
    }
    get selectedProductImage() {
        return this._selectedProductImage;
    }
    set selectedProductImage(image) {
        this._selectedProductImage = image;
    }
    constructor(id, title, description, price, image) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.image = image;
        this.originalId = this.id;
        this.originalTitle = this.title;
        this.originalDescription = this.description;
        this.originalPrice = this.price;
        this.originalImage = this.image;
        this.inputElems = {};
        this.setup();
    }
    setup() {
    }
    ;
    createElement(toAppendTo) {
        const clone = ProductManager.productTemplate.content.cloneNode(true);
        this.populateTemplate(clone);
        toAppendTo.appendChild(clone);
    }
    populateTemplate(clone) {
        this.inputElems.title = this.setDataField(clone, "title", this.title);
        this.inputElems.description = this.setDataField(clone, "description", this.description);
        this.inputElems.price = this.setDataField(clone, "price", this.price.toString());
        this.inputElems.image = this.setDataField(clone, "image");
        this.inputElems.image.src = this.image.path;
        this.inputElems.image.alt = this.image.alt;
        this.inputElems.image.id = `image-${this.id}`;
        this.inputElems.imageInput = this.setDataField(clone, "image-input");
        this.inputElems.imageInput.addEventListener("change", (ev) => {
            this.imageInputHandler(ev);
        });
        let imgLabelElem = this.inputElems.imageInput.parentElement;
        imgLabelElem.htmlFor = this.inputElems.imageInput.id;
    }
    setDataField(root, field, data) {
        let fieldelem = root.querySelector(`[data-field="${field}"]`);
        fieldelem.id = `${field}-inp-${this.id}`;
        fieldelem.name = `${field}-inp-${this.id}`;
        if (!(fieldelem instanceof HTMLImageElement) && data) {
            fieldelem.value = data;
        }
        ;
        return fieldelem;
    }
    imageInputHandler(ev) {
        let imgInp = this.inputElems.imageInput;
        let files = imgInp.files;
        console.debug("Files:");
        console.debug(files);
        if (!files) {
            return;
        }
        let image = files[0];
        this.selectedImage = image;
    }
    updateImage() {
        if (this.selectedProductImage === undefined) {
            return;
        }
        let img = this.inputElems.image;
        img.src = this.selectedProductImage.path;
        img.alt = this.selectedProductImage.alt;
    }
    ;
    sendNewImageToServer(image) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Sending new image to server");
            let formData = new FormData();
            formData.append("image", image);
            const endpoint = "/api/admin/images/new";
            let resp = yield fetch(endpoint, {
                method: "POST",
                body: formData
            });
            if (resp.ok) {
                console.log("Success");
                let json = yield resp.json();
                let filepath = json["path"];
                if (filepath) {
                    return filepath;
                }
            }
            else {
                console.error("Error");
            }
            ;
            return new Error("Error during file upload");
        });
    }
    prepareProductFormData() {
        let titleElem = this.inputElems.title;
        let descriptionElem = this.inputElems.description;
        let priceElem = this.inputElems.price;
        let formData = new FormData();
        formData.append("id", this.id.toString());
        formData.append("title", titleElem.value);
        formData.append("description", descriptionElem.value);
        formData.append("price", priceElem.value);
        return formData;
    }
    updateProduct() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "/api/admin/products/update";
            console.log("Selected Image:");
            console.log(this.selectedImage);
            if (this.selectedImage !== undefined) {
                yield this.sendNewImageToServer(this.selectedImage);
            }
            let formData = this.prepareProductFormData();
            console.log("Formdata:");
            console.log(formData);
            let resp = yield fetch(endpoint, {
                method: "POST",
                body: formData
            });
            if (resp.ok) {
                console.log("Success");
            }
            else {
                console.error("Error");
            }
        });
    }
}
class ProductManager {
    constructor(productSection) {
        this.productSection = productSection;
        this.displays = [];
        this.setup();
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadProducts();
            this.displays.forEach((display) => {
                display.createElement(this.productSection);
            });
        });
    }
    loadProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "/api/admin/products/get";
            let resp = yield fetch(endpoint);
            let jsonResp = yield resp.json();
            for (const resp of jsonResp) {
                let img_path = "/assets/images/products/" + resp.image_filename;
                let product = new ProductDisplay(resp.id, resp.title, resp.description, resp.price, {
                    filename: resp.image_filename,
                    path: img_path,
                    alt: resp.image_alt
                });
                this.displays.push(product);
            }
        });
    }
}
ProductManager.productTemplate = document.getElementById("product-template");
var manager;
manager = new ProductManager(document.getElementById("products-output"));
