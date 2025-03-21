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
        this.messagesElems = [];
        this.setup();
    }
    setup() {
        console.groupCollapsed("Messages");
        console.log(this.messages);
        console.groupEnd();
        for (const message of this.messages) {
            console.count("Message");
            let toappend = this.setTemplateFields(message);
            let done = this.displayContainer.appendChild(toappend);
            console.log(done);
            this.messagesElems.push(done);
        }
    }
    setTemplateFields(message) {
        const template = document.getElementById("message-template");
        const clone = template.content.cloneNode(true);
        const toappend = clone.querySelector(".message");
        let insertableElements = clone.querySelectorAll("[data-field]");
        insertableElements.forEach(elem => {
            if (elem.dataset.field === "name") {
                elem.innerText = `${message.name}, ${message.prename}`;
            }
            else if (elem.dataset.field === "email") {
                elem.innerText = message.email;
                elem.href = `mailto:${message.email}`;
            }
            else if (elem.dataset.field === "topic") {
                elem.innerText = message.topic;
            }
            else if (elem.dataset.field === "short") {
                elem.innerText = message.shortMsg;
            }
            else if (elem.dataset.field === "message") {
                elem.innerText = message.longMsg;
            }
        });
        return toappend;
    }
}
function getContactMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        let resp = yield fetch("/api/admin/contact/get");
        return resp;
    });
}
/**
 * Parses the requested Messages
 * @param json_ The response taken from getContactMessages().json()
 * @returns Every received Message
 */
function parseMessagesResponse(json_) {
    let msgs = new Array;
    let timestamps = Object.keys(json_);
    for (const timestamp of timestamps) {
        let msg = json_[timestamp];
        msg.timestamp = new Date(timestamp);
        msgs.push(msg);
    }
    return msgs;
}
let contactsSection = document.getElementById("request-contacts");
let requestButton = contactsSection.querySelector("button");
const msgsOutputSection = document.getElementById("contactMsg-output");
var viewer;
requestButton.addEventListener('click', (ev) => __awaiter(void 0, void 0, void 0, function* () {
    let msgs = yield (yield getContactMessages()).json();
    let messages = parseMessagesResponse(msgs);
    viewer = new MessagesViewer(messages, msgsOutputSection);
}));
