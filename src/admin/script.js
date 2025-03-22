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
    constructor(displayContainer, callback) {
        this.displayContainer = displayContainer;
        this.messages = [];
        this.messagesElems = [];
        this.setup(callback);
    }
    setup(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Setup");
            let resp = yield this.getContactMessages();
            let json = yield resp.json();
            this.messages = this.parseMessagesResponse(json);
            this.displayContainer.innerHTML = "";
            for (const message of this.messages) {
                let toappend = this.setTemplateFields(message);
                let done = this.displayContainer.appendChild(toappend);
                console.log(done);
                this.messagesElems.push(done);
            }
            ;
            if (callback) {
                callback();
            }
        });
    }
    /**
     * Parses the requested Messages
     * @param json_ The response taken from getContactMessages().json()
     * @returns Every received Message
     */
    parseMessagesResponse(json_) {
        let msgs = new Array;
        let timestamps = Object.keys(json_);
        console.groupCollapsed("Parsing");
        for (const timestamp of timestamps) {
            let msg = json_[timestamp];
            msg.timestamp = new Date(msg.timestamp);
            msgs.push(msg);
            console.debug(msg);
        }
        console.groupEnd();
        return msgs;
    }
    getContactMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield fetch("/api/admin/contact/get");
            return resp;
        });
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
            else if (elem.dataset.field === "timestamp") {
                elem.innerText = message.timestamp.toLocaleString();
            }
        });
        return toappend;
    }
}
class ViewerManager extends MessagesViewer {
    constructor(displayContainer) {
        super(displayContainer, () => { this.createListeners(); });
        this.visibleMessage = null;
        this.createListeners();
    }
    createListeners() {
        if (this.messagesElems.length !== this.messages.length) {
            throw new Error("Was ist denn hiiiiiiiieeeer los?");
        }
        ;
        console.log("Messages Elems:");
        console.log(this.messagesElems);
        this.messagesElems.forEach((elem) => {
            let headerElem = elem.querySelector(".message-header");
            headerElem.addEventListener('click', (ev) => { this.clickListener(ev, elem); });
        });
    }
    ;
    clickListener(ev, elem) {
        this.visibleMessage = elem.classList.toggle("open") ? elem : null;
    }
}
const msgsOutputSection = document.getElementById("contactMsg-output");
var viewer;
viewer = new ViewerManager(msgsOutputSection);
