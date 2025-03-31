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
    constructor(id, timestamp, name, prename, email, topic, shortMsg, longMsg) {
        this.id = id;
        this.timestamp = timestamp;
        this.name = name;
        this.prename = prename;
        this.email = email;
        this.topic = topic;
        this.shortMsg = shortMsg;
        this.longMsg = longMsg;
        this.elem = undefined;
    }
    static newContactMessage(id, timestamp, name, prename, email, topic, shortMsg, longMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = new singleContactMessage(id, timestamp, name, prename, email, topic, shortMsg, longMsg);
            msg.setup(viewer);
            return msg;
        });
    }
    setup(viewManager) {
        this.createElement();
        if (!this.elem) {
            return;
        }
        const selectId = `checkbox-${this.id}`;
        if (!this.selectElems) {
            throw new Error("selectElems not set!");
        }
        ;
        this.selectElems.input.id = selectId;
        this.selectElems.input.name = selectId;
        this.selectElems.label.htmlFor = selectId;
        if (this.selectElems !== undefined) {
            this.selectElems.input.addEventListener('change', ev => { viewManager.selectChangeHandler(this, this.selectElems); });
        }
        else {
            throw new Error("this.selectElems are undefined!");
        }
    }
    ;
    createElement() {
        this.elem = this.setTemplateFields();
        this.selectElems = {
            label: this.elem.querySelector("label"),
            input: this.elem.querySelector("input")
        };
        MessagesViewer.displayContainer.appendChild(this.elem);
    }
    setOpenState(isOpen) {
        var _a;
        (_a = this.elem) === null || _a === void 0 ? void 0 : _a.classList.toggle("open", isOpen);
    }
    setSelectState(isSelected) {
        if (!this.selectElems) {
            throw new Error("Need Select Elements");
        }
        ;
        this.selectElems.input.checked = isSelected;
    }
    setTemplateFields() {
        const template = document.getElementById("message-template");
        const clone = template.content.cloneNode(true);
        const toappend = clone.querySelector(".message");
        let insertableElements = clone.querySelectorAll("[data-field]");
        insertableElements.forEach(elem => {
            let timeYear = this.timestamp.getFullYear();
            let timeMonth = this.timestamp.getMonth();
            let timeDay = this.timestamp.getDate();
            let timeHour = this.timestamp.getHours();
            let timeMinute = this.timestamp.getMinutes();
            function timePadding(value) {
                return value < 10 ? `0${value}` : String(value);
            }
            let timeString = `${timePadding(timeDay)}.${timePadding(timeMonth)}.${timePadding(timeYear)} um ${timePadding(timeHour)}:${timePadding(timeMinute)}`;
            if (elem.dataset.field === "name") {
                elem.innerText = `${this.name}, ${this.prename}`;
            }
            else if (elem.dataset.field === "email") {
                elem.innerText = this.email;
                elem.href = `mailto:${this.email}`;
            }
            else if (elem.dataset.field === "topic") {
                elem.innerText = this.topic;
            }
            else if (elem.dataset.field === "short") {
                elem.innerText = this.shortMsg;
            }
            else if (elem.dataset.field === "message") {
                elem.innerText = this.longMsg;
            }
            else if (elem.dataset.field === "timestamp") {
                elem.innerText = timeString;
            }
        });
        return toappend;
    }
    ;
}
class MessagesViewer {
    constructor() {
        this.messagesElems = [];
        this.messages = [];
        this.selectedMessages = [];
        this.visibleMessage = undefined;
        this.bulkDeleteElem = document.getElementById("bulkdelete-btn");
        this.bulkCheckbox = document.getElementById("bulk-select-inp");
        this.setup();
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield this.getContactMessages();
            let json = yield resp.json();
            let messages = this.parseMessagesResponse(json);
            MessagesViewer.displayContainer.innerHTML = "";
            let counterElem = document.querySelector(".messages-container h2 .counter");
            if (counterElem) {
                counterElem.textContent = "(" + String(messages.length) + ")";
            }
            for (const message of messages) {
                let singleMessage = yield singleContactMessage.newContactMessage(message.id, message.timestamp, message.name, message.prename, message.email, message.topic, message.shortMsg, message.longMsg);
                this.messages.push(singleMessage);
            }
            ;
            this.createListeners();
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
        }
        return msgs;
    }
    getContactMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield fetch("/api/admin/contact/get");
            return resp;
        });
    }
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
    createListeners(delayed) {
        // HACK: Naja, immerhin funktionierts :)
        if (!delayed) {
            setTimeout(() => { this.createListeners(true); }, 250);
            return;
        }
        for (const msg of this.messages) {
            if (!msg.elem) {
                throw new Error("aaaaaaaaaaaaaaaahhhhhhhhhhhhhhhhhhhhh");
            }
            let titleElem = msg.elem.querySelector(".message-header h3");
            titleElem.addEventListener('click', (ev) => { this.clickListener(ev, msg); });
        }
        this.bulkCheckbox.addEventListener('change', () => { this.bulkSelectChangeHandler(); });
        this.bulkDeleteElem.addEventListener('click', () => { this.bulkDeleteHandler(); });
    }
    ;
    selectChangeHandler(msg, selectElems) {
        if (selectElems.input.checked) {
            this.selectedMessages.push(msg);
        }
        else {
            const id = this.selectedMessages.indexOf(msg);
            if (id > -1) {
                this.selectedMessages.splice(id, 1);
            }
        }
        ;
        this.setBulkDeleteElems();
    }
    ;
    setBulkDeleteElems() {
        const amountOfSelectedMessages = this.selectedMessages.length;
        const bulkdeleteDefaultText = this.bulkDeleteElem.dataset.default;
        const bulkdeleteActiveText = this.bulkDeleteElem.dataset.active;
        if (amountOfSelectedMessages === 0) {
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
        else {
            this.bulkCheckbox.checked = false;
        }
        if (amountOfSelectedMessages === 1) {
            this.bulkDeleteElem.textContent = bulkdeleteDefaultText + ` (${amountOfSelectedMessages})`;
        }
        else {
            this.bulkDeleteElem.textContent = bulkdeleteActiveText + ` (${amountOfSelectedMessages})`;
        }
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
        let bulkSelectAll = this.bulkCheckbox.checked;
        if (bulkSelectAll) {
            this.selectedMessages = this.messages;
            for (const msg of this.messages) {
                msg.setSelectState(true);
            }
        }
        else {
            this.selectedMessages = [];
            for (const msg of this.messages) {
                msg.setSelectState(false);
            }
        }
        ;
        this.setBulkDeleteElems();
    }
}
MessagesViewer.displayContainer = document.getElementById("contactMsg-output");
var viewer;
viewer = new MessagesViewer();
