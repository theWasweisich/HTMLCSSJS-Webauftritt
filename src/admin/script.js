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
class MessagesViewer {
    constructor(messages, displayContainer) {
        this.messages = messages;
        this.displayContainer = displayContainer;
    }
    setup() {
    }
}
function getContactMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        let resp = yield fetch("/api/admin/contact/get");
        return resp;
    });
}
function parseResponse(json_) {
    let msgs = new Array;
    return msgs;
}
let contactsSection = document.getElementById("request-contacts");
let requestButton = contactsSection.querySelector("button");
requestButton.addEventListener('click', (ev) => __awaiter(void 0, void 0, void 0, function* () {
    let msgs = yield getContactMessages();
    console.log(msgs);
    let output = document.createElement("p");
    output.innerText = JSON.stringify((yield msgs.json()));
    contactsSection.appendChild(output);
}));
