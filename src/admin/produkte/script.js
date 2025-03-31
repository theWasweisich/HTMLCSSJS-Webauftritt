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
class StatWithElem {
}
class UnitSelectionElement {
    constructor() {
        this.element = document.createElement("select");
    }
    addOption(value, text) {
        let optionElem = document.createElement("option");
        optionElem.textContent = text;
        optionElem.value = value;
        let elem = this.element.appendChild(optionElem);
        return elem;
    }
}
class ProductDisplay {
    get selectedProductImage() {
        return this._selectedProductImage;
    }
    set selectedProductImage(image) {
        this._selectedProductImage = image;
    }
    set originalImage(image) {
        this._originalImage = image;
    }
    get originalImage() {
        return this._originalImage;
    }
    constructor(id, title, description, price, image) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.image = image;
        this.inputElems = {};
        this.setupDone = false;
        this.needToSave = false;
        this.originalId = this.id;
        this.originalTitle = this.title;
        this.originalDescription = this.description;
        this.originalPrice = this.price;
        this._originalImage = this.image;
        this._selectedProductImage = this._originalImage;
        this.selectedProductImage = this.originalImage;
        this.setup();
    }
    ;
    static new(id, title, description, price, image, toAppendTo) {
        return __awaiter(this, void 0, void 0, function* () {
            let product = new ProductDisplay(id, title, description, price, image);
            product.createElement(toAppendTo);
            return product;
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadProductStats();
            this.setupDone = true;
        });
    }
    ;
    createElement(toAppendTo) {
        if (!this.setupDone) {
            setTimeout(() => { this.createElement(toAppendTo); });
            return;
        }
        ;
        const clone = ProductManager.productTemplate.content.firstElementChild.cloneNode(true);
        this.populateTemplate(clone);
        this.rootElement = toAppendTo.appendChild(clone);
        let newStatBtn = this.rootElement.querySelector(".stat .addButton");
        if (newStatBtn === null) {
            throw new Error("New Stat Button not found!");
        }
        ;
        newStatBtn.addEventListener("click", () => {
            console.log("Adding new Stat");
            this.statAddBtnListener();
        });
        this.generateStatElems();
    }
    ;
    populateTemplate(clone) {
        this.inputElems.title = this.setDataField(clone, "title", this.title);
        this.inputElems.description = this.setDataField(clone, "description", this.description);
        this.inputElems.price = this.setDataField(clone, "price", this.price.toString());
        this.inputElems.image = this.setDataField(clone, "image");
        this.inputElems.image.src = this.image.path;
        this.inputElems.image.alt = this.image.alt;
        this.inputElems.image.id = `image-${this.id}`;
        this.inputElems.imageInput = this.setDataField(clone, "image-input");
        let imageChangeButton = clone.querySelector(".file-picker-label .change-image-btn");
        imageChangeButton === null || imageChangeButton === void 0 ? void 0 : imageChangeButton.addEventListener('click', (ev) => { var _a; (_a = this.inputElems.imageInput) === null || _a === void 0 ? void 0 : _a.click(); });
        this.inputElems.imageInput.addEventListener("change", (ev) => { this.imageInputHandler(ev); });
        let imgLabelElem = clone.querySelector(".file-picker-label");
        imgLabelElem.htmlFor = this.inputElems.imageInput.id;
        this.inputElems.saveBtn = clone.querySelector("button.save-btn");
        this.inputElems.saveBtn.addEventListener('click', (ev) => { this.saveBtnHandler(ev); });
        this.setInputDefaults();
    }
    generateStatElems() {
        if (!this.productStats) {
            console.error("Stats need to be loaded first!");
            return;
        }
        ;
        if (!this.rootElement) {
            console.error("Please set the root element");
            return;
        }
        ;
        this.inputElems.statsList = this.rootElement.querySelector(".stats-list");
        if (!(this.inputElems.statsList instanceof HTMLElement)) {
            console.error("Please set the stats root element");
            return;
        }
        ;
        this.productStats.forEach(stat => {
            let statRoot = this.generateSingleStatElem(stat);
            this.inputElems.statsList.appendChild(statRoot);
        });
    }
    generateSingleStatElem(stat) {
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
        }
        else if (stat.unit === "kg") {
            kgOption.selected = true;
        }
        else {
            voidOption.selected = true;
        }
        nameInput.value = stat.name.toString();
        nameInput.classList.add("nameInput");
        nameInput.id = `stat-name-${stat.id}`;
        valueInput.value = stat.value.toString();
        valueInput.classList.add("valueInput");
        valueInput.id = `stat-value-${stat.id}`;
        let removeBtn = document.createElement("button");
        removeBtn.classList.add("removeBtn");
        removeBtn.textContent = "-";
        removeBtn.addEventListener('click', () => {
            if (!this.productStats) {
                return;
            }
            ;
            if (!this.inputElems.statsList) {
                return;
            }
            ;
            for (let i = 0; i < this.productStats.length; i++) {
                const currentStat = this.productStats[i];
                if (currentStat.id === stat.id) {
                    this.productStats.splice(i, 1);
                }
            }
            let currentStatElement = this.inputElems.statsList.querySelector(`[data-id="${stat.id}"]`);
            console.log(currentStatElement);
            currentStatElement === null || currentStatElement === void 0 ? void 0 : currentStatElement.remove();
        });
        statRoot.appendChild(nameInput);
        statRoot.appendChild(valueInput);
        statRoot.appendChild(unitSelectionElem.element);
        statRoot.appendChild(removeBtn);
        statRoot.dataset.id = stat.id.toString();
        nameInput.disabled = true;
        valueInput.disabled = true;
        unitSelectionElem.element.disabled = true;
        return statRoot;
    }
    statAddBtnListener() {
        let root = this.inputElems.statsList;
        if (!root) {
            console.error("Root not given!");
            return;
        }
        if (!this.productStats) {
            console.error("ProductStats not given!");
            return;
        }
        let nameInp = document.getElementById("stat-template-name");
        let valueInp = document.getElementById("stat-template-value");
        let unitInp = document.getElementById("stat-template-unit");
        if (!nameInp) {
            throw new Error("nameInp fehlt!");
        }
        ;
        if (!valueInp) {
            throw new Error("ValueInp fehlt!");
        }
        ;
        if (!unitInp) {
            throw new Error("UnitInp fehlt!");
        }
        ;
        let name = nameInp.value;
        let value = valueInp.value;
        let unit = unitInp.selectedOptions[0].value;
        let statElem = this.generateSingleStatElem({ id: -1, name: name, value: value, unit: unit });
        this.productStats.push({
            id: -1,
            name: name,
            unit: unit,
            value: value
        });
        root.appendChild(statElem);
    }
    loadProductStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `/api/product/stats/${this.id}`;
            const fetchRes = yield fetch(endpoint);
            if (!fetchRes.ok) {
                throw new Error("Something went wrong!");
            }
            ;
            let jsonResp = yield fetchRes.json();
            this.productStats = jsonResp;
            this.originalStats = this.productStats;
        });
    }
    setInputDefaults() {
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
        if (!files) {
            return;
        }
        let image = files[0];
        if (!this.selectedProductImage) {
            console.error("Seleected Product Image not set!");
        }
        if (!this.selectedProductImage) {
            this.selectedProductImage = { filename: image.name, alt: image.name, image: image, path: "" };
        }
        ;
        this.selectedProductImage.image = image;
        this.selectedProductImage.filename = image.name;
        this.selectedProductImage.alt = image.name;
        this.selectedProductImage.path = URL.createObjectURL(image);
        this.updateImage();
    }
    saveBtnHandler(ev) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateProduct();
        });
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
    addImageToFormData(image) {
        const isImageAvailable = image !== undefined;
        if (!isImageAvailable) {
            if (this.originalImage !== undefined && this.originalImage.image !== undefined) {
                image = this.originalImage;
            }
            else {
                throw new Error("If image and alt are not given, this.originalImage has to be set!");
            }
        }
        else {
            image = image;
        }
        let formData;
        formData = new FormData();
        formData.append("image", image.image);
        formData.append("filename", image.filename);
        formData.append("alt", image.alt);
        return formData;
    }
    prepareProductFormData() {
        let titleElem = this.inputElems.title;
        let descriptionElem = this.inputElems.description;
        let priceElem = this.inputElems.price;
        let title = titleElem.value;
        let description = descriptionElem.value;
        let price = priceElem.value;
        let formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("stats", "");
        console.groupCollapsed(`Prepared FormData1:`);
        for (const singleData of formData.entries()) {
            console.log(singleData);
        }
        console.groupEnd();
        return formData;
    }
    updateProduct() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `/api/admin/product/${this.id}/update`;
            let formData = this.prepareProductFormData();
            yield this.updateStats();
            let resp = yield fetch(endpoint, {
                method: "PUT",
                body: formData
            });
            if (resp.ok) {
                console.log("Success");
            }
            else {
                let txt = yield resp.text();
                console.error("Error!");
                console.error(txt);
            }
        });
    }
    updateStats() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.productStats) {
                throw new Error("Stats need to be set!");
            }
            ;
            this.productStats.forEach(stat => {
                stat;
            });
            let statsJson = JSON.stringify(this.productStats);
            console.log(statsJson);
            const formData = new FormData();
            formData.append("stats", statsJson);
            const endpoint = `/api/admin/product/${this.id}/stats`;
            let fetchRes = yield fetch(endpoint, {
                method: "PUT",
                body: formData
            });
            if (!fetchRes.ok) {
                let resText = yield fetchRes.text();
                console.error(resText);
                return false;
            }
            return true;
        });
    }
    sendImageToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `/api/admin/product/${this.id}/image`;
            let formData;
            if (this.selectedProductImage !== undefined) {
                formData = this.addImageToFormData(this.selectedProductImage);
            }
            else {
                formData = this.addImageToFormData();
            }
            ;
            console.groupCollapsed("Sending Image");
            console.info("Formdata:");
            let entries = formData.entries();
            for (const entry of entries) {
                console.log(entry);
            }
            console.groupEnd();
            let fetchRes = yield fetch(endpoint, {
                method: "PUT",
                body: formData
            });
            if (fetchRes.ok) {
                return true;
            }
            let text = yield fetchRes.text();
            console.error(text);
            return false;
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
        });
    }
    ;
    loadProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "/api/admin/products/get";
            let resp = yield fetch(endpoint);
            let jsonResp = yield resp.json();
            for (const resp of jsonResp) {
                let img_path = `/api/product/${resp.id}/image/get`;
                let image = yield ((yield fetch(img_path)).blob());
                let product = yield ProductDisplay.new(resp.id, resp.title, resp.description, resp.price, {
                    filename: resp.image_filename,
                    path: img_path,
                    alt: resp.image_alt,
                    image: image
                }, this.productSection);
                this.displays.push(product);
            }
        });
    }
}
ProductManager.productTemplate = document.getElementById("product-template");
var manager;
manager = new ProductManager(document.getElementById("products-output"));
