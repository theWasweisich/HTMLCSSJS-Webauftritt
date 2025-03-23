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
class singleContactMessage {
    constructor(id, timestamp, name, prename, email, topic, shortMsg, longMsg, elem) {
        this.id = id;
        this.timestamp = timestamp;
        this.name = name;
        this.prename = prename;
        this.email = email;
        this.topic = topic;
        this.shortMsg = shortMsg;
        this.longMsg = longMsg;
        this.elem = elem;
        this.selectElems = {
            label: elem.querySelector("label"),
            input: elem.querySelector("input")
        };
    }
    setup(viewManager, selectChangeHandler) {
        if (!this.elem) {
            return;
        }
        const selectId = `checkbox-${this.id}`;
        this.selectElems.input.id = selectId;
        this.selectElems.input.name = selectId;
        this.selectElems.label.htmlFor = selectId;
        console.log("This:");
        console.log(this);
        console.log(typeof this);
        this.selectElems.input.addEventListener('change', ev => { selectChangeHandler(viewManager, this, this.selectElems); });
    }
    ;
    setOpenState(isOpen) {
        var _a;
        (_a = this.elem) === null || _a === void 0 ? void 0 : _a.classList.toggle("open", isOpen);
    }
    setSelectState(isSelected) {
        this.selectElems.input.checked = isSelected;
    }
}
class MessagesViewer {
    constructor(displayContainer) {
        this.displayContainer = displayContainer;
        this.messagesElems = [];
        this.messages = [];
        this.selectedMessages = [];
        this.setup();
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Setup");
            let resp = yield this.getContactMessages();
            let json = yield resp.json();
            let messages = this.parseMessagesResponse(json);
            this.displayContainer.innerHTML = "";
            for (const message of messages) {
                let toappend = this.setTemplateFields(message);
                let done = this.displayContainer.appendChild(toappend);
                console.log(done);
                message.elem = done;
                this.messages.push(new singleContactMessage(message.id, message.timestamp, message.name, message.prename, message.email, message.topic, message.shortMsg, message.longMsg, done));
                this.messagesElems.push(done);
            }
            ;
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
            msgs.push({
                id: msg.id,
                timestamp: msg.timestamp,
                name: msg.name,
                prename: msg.prename,
                email: msg.email,
                topic: msg.topic,
                shortMsg: msg.shortMsg,
                longMsg: msg.longMsg
            });
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
    ;
    static deleteMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmationMessage = `Soll die Nachricht vom ${message.timestamp.toDateString()} wirklich gelöscht werden?`;
            if (!confirm(confirmationMessage)) {
                return;
            }
            ;
        });
    }
    ;
    static performDeletion(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let body;
            if (message instanceof singleContactMessage) {
                body = JSON.stringify({
                    id: message.id,
                    multiple: false
                });
            }
            else {
                let ids = [];
                message.forEach((msg) => { ids.push(msg.id); });
                body = JSON.stringify({
                    ids: ids,
                    multiple: true
                });
            }
            let response = yield fetch("/api/admin/contact/delete", {
                body: body,
                method: "delete",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                console.error("An expected error occured during deletion!");
                return;
            }
            ;
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }
            ;
            window.location.reload();
        });
    }
}
class ViewerManager extends MessagesViewer {
    constructor(displayContainer) {
        super(displayContainer);
        this.visibleMessage = undefined;
        this.bulkDeleteElem = document.getElementById("bulkdelete-btn");
        this.bulkCheckbox = document.getElementById("bulk-select-inp");
        this.createListeners();
    }
    createListeners(delayed) {
        // HACK: Naja, immerhin funktionierts :)
        if (!delayed) {
            setTimeout(() => { this.createListeners(true); }, 250);
            return;
        }
        for (const msg of this.messages) {
            console.log("Foreach run!");
            if (!msg.elem) {
                throw new Error("aaaaaaaaaaaaaaaahhhhhhhhhhhhhhhhhhhhh");
            }
            let titleElem = msg.elem.querySelector(".message-header h3");
            titleElem.addEventListener('click', (ev) => { this.clickListener(ev, msg); });
            console.log("Listener has been set");
            msg.setup(this, this.selectChangeHandler);
        }
        this.bulkDeleteElem.addEventListener('click', () => { this.bulkDeleteHandler(); });
    }
    ;
    selectChangeHandler(manager, msg, selectElems) {
        if (selectElems.input.checked) {
            manager.selectedMessages.push(msg);
        }
        else {
            const id = manager.selectedMessages.indexOf(msg);
            if (id > -1) {
                manager.selectedMessages.splice(id, 1);
            }
        }
        ;
        manager.setBulkDeleteElems();
    }
    ;
    setBulkDeleteElems() {
        const amountOfSelectedMessages = this.selectedMessages.length;
        const bulkdeleteDefaultText = this.bulkDeleteElem.dataset.default;
        if (0 === amountOfSelectedMessages) {
            this.bulkDeleteElem.disabled = true;
            this.bulkDeleteElem.textContent = bulkdeleteDefaultText;
            this.bulkCheckbox.checked = false;
            return;
        }
        else {
            this.bulkDeleteElem.disabled = false;
        }
        if (amountOfSelectedMessages === this.messages.length) {
            this.bulkCheckbox.checked = true;
        }
        ;
        this.bulkDeleteElem.textContent = bulkdeleteDefaultText + ` (${amountOfSelectedMessages})`;
    }
    bulkDeleteHandler() {
        const msgsToDelete = this.selectedMessages;
        if (!confirm(`Möchten Sie wirklich ${msgsToDelete.length} Nachrichten löschen?`)) {
            return;
        }
        ;
        MessagesViewer.performDeletion(msgsToDelete);
    }
    clickListener(ev, msg) {
        var _a;
        const msgOpen = (_a = msg.elem) === null || _a === void 0 ? void 0 : _a.classList.contains("open");
        if (this.visibleMessage) {
            let elemPrevious = this.visibleMessage.elem;
            if (elemPrevious && elemPrevious !== msg.elem) {
                elemPrevious.classList.remove("open");
            }
        }
        msg.setOpenState(!msgOpen);
        this.visibleMessage = msgOpen ? undefined : msg;
    }
    ;
    bulkSelectChangeHandler() {
        throw new Error("Not implemented");
    }
}
class ProductManager {
    constructor(productSection) {
        this.productSection = productSection;
    }
}
const msgsOutputSection = document.getElementById("contactMsg-output");
var viewer;
viewer = new ViewerManager(msgsOutputSection);
