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
var validationResult;
(function (validationResult) {
    validationResult[validationResult["OK"] = 0] = "OK";
    validationResult[validationResult["NOT_OK"] = 1] = "NOT_OK";
    validationResult[validationResult["SILENT_FAIL"] = 2] = "SILENT_FAIL";
})(validationResult || (validationResult = {}));
var responseType;
(function (responseType) {
    responseType[responseType["SEND_SUCCESS"] = 0] = "SEND_SUCCESS";
    responseType[responseType["SEND_FAILED"] = 1] = "SEND_FAILED";
    responseType[responseType["NEED_TO_WAIT"] = 2] = "NEED_TO_WAIT";
})(responseType || (responseType = {}));
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
                const secondsPassed = (Date.now() - Number(lastSubmit)) / 1000;
                const minutesPassed = secondsPassed / 60;
                if (minutesPassed < 15) {
                    FormMaster.triggerResponse(responseType.NEED_TO_WAIT);
                    return;
                }
                ;
            }
            ;
            let validity = this.validator();
            let isValid = this.formRoot.reportValidity();
            if (isValid && validity === validationResult.OK) {
                this.sendData().then((res) => {
                    if (res.ok) {
                        FormMaster.triggerResponse(responseType.SEND_SUCCESS);
                    }
                    else {
                        FormMaster.triggerResponse(responseType.SEND_FAILED);
                    }
                    FormMaster.lastSubmitted = Date.now();
                    this.formRoot.reset();
                });
            }
            else if (isValid && validity === validationResult.SILENT_FAIL) {
                // Rückerstattungen machen wir nicht, aber wir tun so, als ob alles bestens wäre :)
                console.log("🤫 Das ignorieren wir heimlich");
                this.formRoot.reset();
                FormMaster.triggerResponse(responseType.SEND_SUCCESS);
            }
            ;
        });
        this.formRoot.addEventListener('input', e => {
            e.target;
            this.validator(e.target);
            this.formRoot.reportValidity();
        });
    }
    static triggerResponse(type) {
        let dialog;
        if (type === responseType.SEND_SUCCESS) {
            dialog = document.getElementById('success-msg');
        }
        else if (type === responseType.SEND_FAILED) {
            dialog = document.getElementById('failed-msg');
        }
        else if (type === responseType.NEED_TO_WAIT) {
            dialog = document.getElementById("wait-msg");
        }
        else {
            throw new Error("Hmmmmmmmmmmmmmm");
        }
        dialog.showModal();
    }
    /**
     * @returns True if valid, false if invalid
     */
    validator(inputToCheck) {
        var isValid = validationResult.OK;
        const validateNameInputs = () => {
            // Required
            if (this.elements.nameInp.value.replace(" ", "") === "") {
                this.elements.nameInp.setCustomValidity("Bitte angeben");
                isValid = validationResult.NOT_OK;
            }
            else {
                this.elements.nameInp.setCustomValidity("");
            }
            if (this.elements.prenameInp.value === "") {
                this.elements.prenameInp.setCustomValidity("Bitte angeben");
                isValid = validationResult.NOT_OK;
            }
            else {
                this.elements.nameInp.setCustomValidity("");
            }
        };
        const checkForBadWords = () => {
            for (const word of FormMaster.badWords) {
                const toCheck = word.toLowerCase();
                if (this.elements.longInp.value.includes(word)) {
                    isValid = validationResult.NOT_OK;
                }
                ;
                if (this.elements.shortInp.value.includes(word)) {
                    isValid = validationResult.NOT_OK;
                }
                ;
            }
            ;
        };
        const checkEmailValidity = () => {
            if (!FormMaster.emailRegex.test(this.elements.emailInp.value.toLowerCase())) {
                this.elements.emailInp.setCustomValidity("Die Email sieht aber nicht gut aus!");
                isValid = validationResult.NOT_OK;
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
                isValid = validationResult.NOT_OK;
            }
            else if (selected === "allgemein") {
                this.elements.topicSel.setCustomValidity("Bitte seien sie etwas genauer");
                isValid = validationResult.NOT_OK;
            }
            else if (selected === "erstattung") {
                isValid = validationResult.SILENT_FAIL;
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
