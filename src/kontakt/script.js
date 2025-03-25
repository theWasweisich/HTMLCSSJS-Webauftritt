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
class FormMaster {
    static get lastSubmitted() {
        return Number(localStorage.getItem('lastSubmit'));
    }
    static set lastSubmitted(value) {
        localStorage.setItem('lastSubmit', value.toString());
    }
    constructor(formRoot) {
        this.formRoot = formRoot;
        const prenameInp = this.formRoot.querySelector("#prename-inp");
        const nameInp = this.formRoot.querySelector("#name-inp");
        const emailInp = this.formRoot.querySelector("#email-inp");
        const topicSel = this.formRoot.querySelector("#topic-sel");
        const shortInp = this.formRoot.querySelector("#short-inp");
        const longInp = this.formRoot.querySelector("#long-inp");
        this.formRoot = document.querySelector("form");
        this.elements = {
            emailInp: emailInp,
            prenameInp: prenameInp,
            nameInp: nameInp,
            topicSel: topicSel,
            shortInp: shortInp,
            longInp: longInp
        };
        this.formRoot.addEventListener('submit', e => {
            e.preventDefault();
            let lastSubmit = localStorage.getItem("lastSubmit");
            if (lastSubmit !== null) {
                if ((Date.now() - Number(lastSubmit)) < 5000) {
                    return;
                }
            }
            this.validator();
            let isValid = this.formRoot.checkValidity();
            if (isValid) {
                this.sendData().then((res) => {
                    FormMaster.triggerResponse(res.ok);
                    FormMaster.lastSubmitted = Date.now();
                    this.formRoot.reset();
                });
            }
            ;
        });
        this.formRoot.addEventListener('input', e => {
            e.target;
            this.validator(e.target);
            this.formRoot.reportValidity();
        });
    }
    static triggerResponse(success) {
        if (success) {
            let dialog = document.getElementById('success-msg');
            dialog.showModal();
        }
        else {
            let dialog = document.getElementById('failed-msg');
            dialog.showModal();
        }
    }
    /**
     * @returns True if valid, false if invalid
     */
    validator(inputToCheck) {
        var isValid = true;
        const validateNameInputs = () => {
            // Required
            if (this.elements.nameInp.value.replace(" ", "") === "") {
                this.elements.nameInp.setCustomValidity("Bitte angeben");
                isValid = false;
            }
            else {
                this.elements.nameInp.setCustomValidity("");
            }
            if (this.elements.prenameInp.value === "") {
                this.elements.prenameInp.setCustomValidity("Bitte angeben");
                isValid = false;
            }
            else {
                this.elements.nameInp.setCustomValidity("");
            }
        };
        const checkForBadWords = () => {
            for (const word of FormMaster.badWords) {
                if (this.elements.longInp.value.includes(word)) {
                    isValid = false;
                }
                ;
                if (this.elements.shortInp.value.includes(word)) {
                    isValid = false;
                }
                ;
            }
            ;
        };
        const checkEmailValidity = () => {
            if (!FormMaster.emailRegex.test(this.elements.emailInp.value.toLowerCase())) {
                this.elements.emailInp.setCustomValidity("Die Email sieht aber nicht gut aus!");
                isValid = false;
            }
            else {
                this.elements.emailInp.setCustomValidity("");
            }
        };
        const checkSelectionValidity = () => {
            var _a;
            let selected = (_a = this.elements.topicSel.selectedOptions.item(0)) === null || _a === void 0 ? void 0 : _a.value;
            this.elements.topicSel.setCustomValidity("");
            if (selected === "garantie") {
                this.elements.topicSel.setCustomValidity("Bei uns gibt es keine Garantie!");
                isValid = false;
            }
            else if (selected === "allgemein") {
                this.elements.topicSel.setCustomValidity("Bitte seien sie etwas genauer");
                isValid = false;
            }
            else {
                this.elements.topicSel.setCustomValidity("");
            }
        };
        if (inputToCheck === undefined) {
            validateNameInputs();
            checkForBadWords();
            checkEmailValidity();
            checkSelectionValidity();
            return isValid;
        }
        switch (inputToCheck.id) {
            case "prename-inp":
            case "name-inp":
                validateNameInputs();
                break;
            case "email-inp":
                checkEmailValidity();
                break;
            case "topic-sel":
                checkSelectionValidity();
                break;
            default:
                break;
        }
        return isValid;
    }
    sendData() {
        return __awaiter(this, void 0, void 0, function* () {
            var data = {
                "name": this.elements.nameInp.value,
                "prename": this.elements.prenameInp.value,
                "email": this.elements.emailInp.value,
                "topic": this.elements.topicSel.value,
                "shortMsg": this.elements.shortInp.value,
                "longMsg": this.elements.longInp.value
            };
            let response = yield fetch("/api/contact/new", {
                "method": "POST",
                "headers": [
                    ["Content-Type", "application/json"]
                ],
                "body": JSON.stringify(data)
            });
            return response;
        });
    }
}
FormMaster.badWords = [
    "kaputt", "garantie", "betrug", "schlecht"
];
FormMaster.emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formmaster = new FormMaster(document.querySelector("form"));
