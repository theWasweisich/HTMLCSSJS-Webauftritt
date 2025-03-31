
interface contactMessage {
    id: number,
    timestamp: Date,
    name: string,
    prename: string,
    email: string,
    topic: string,
    shortMsg: string,
    longMsg: string,
    elem?: HTMLElement,
}


class singleContactMessage {
    public elem: HTMLElement | undefined = undefined;
    private selectElems: {label: HTMLLabelElement, input: HTMLInputElement} | undefined;

    private constructor(
        public id: number,
        public timestamp: Date,
        public name: string,
        public prename: string,
        public email: string,
        public topic: string,
        public shortMsg: string,
        public longMsg: string,
    ) {

    }

    public static async newContactMessage(
        id: number, timestamp: Date, name: string, prename: string,
        email: string, topic: string, shortMsg: string, longMsg: string
    ): Promise<singleContactMessage> {
        let msg = new singleContactMessage(id, timestamp, name, prename, email, topic, shortMsg, longMsg);
        msg.setup(viewer);
        return msg;
    }
    
    public setup(viewManager: MessagesViewer) {
        this.createElement();
        if (!this.elem) { return }

        const selectId = `checkbox-${this.id}`;

        if (!this.selectElems) { throw new Error("selectElems not set!") };

        this.selectElems.input.id = selectId;
        this.selectElems.input.name = selectId;
        this.selectElems.label.htmlFor = selectId;

        if (this.selectElems !== undefined) {
            this.selectElems.input.addEventListener('change', ev => { viewManager.selectChangeHandler(this, this.selectElems!) })
        } else {
            throw new Error("this.selectElems are undefined!");
        }
    };

    public createElement() {
        this.elem = this.setTemplateFields();
        this.selectElems = {
            label: this.elem.querySelector("label") as HTMLLabelElement,
            input: this.elem.querySelector("input") as HTMLInputElement
        }

        MessagesViewer.displayContainer.appendChild(this.elem);
    }
    
    public setOpenState(isOpen: boolean) {
        this.elem?.classList.toggle("open", isOpen);
    }

    public setSelectState(isSelected: boolean) {
        if (!this.selectElems) { throw new Error("Need Select Elements") };
        this.selectElems.input.checked = isSelected;
    }
    
    private setTemplateFields(): HTMLElement {
        const template = document.getElementById("message-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as HTMLElement;
        const toappend = clone.querySelector(".message") as HTMLElement;


        let insertableElements = clone.querySelectorAll("[data-field]") as NodeListOf<HTMLElement>;
        insertableElements.forEach(elem => {

            let timeYear = this.timestamp.getFullYear();
            let timeMonth = this.timestamp.getMonth();
            let timeDay = this.timestamp.getDate();
            let timeHour = this.timestamp.getHours();
            let timeMinute = this.timestamp.getMinutes();

            function timePadding(value: number): string {
                return value < 10 ? `0${value}` : String(value);
            }

            let timeString = `${timePadding(timeDay)}.${timePadding(timeMonth)}.${timePadding(timeYear)} um ${timePadding(timeHour)}:${timePadding(timeMinute)}`;

            if (elem.dataset.field === "name") {
                elem.innerText = `${this.name}, ${this.prename}`
            } else if (elem.dataset.field === "email") {
                elem.innerText = this.email;
                (elem as HTMLAnchorElement).href = `mailto:${this.email}`;
            } else if (elem.dataset.field === "topic") {
                elem.innerText = this.topic;
            } else if (elem.dataset.field === "short") {
                elem.innerText = this.shortMsg;
            } else if (elem.dataset.field === "message") {
                elem.innerText = this.longMsg;
            } else if (elem.dataset.field === "timestamp") {
                elem.innerText = timeString;
            }
        });

        return toappend;
    };
}

interface contactMessages {
    [timestamp: string]: contactMessage
}

class MessagesViewer {
    public static displayContainer: HTMLElement = document.getElementById("contactMsg-output") as HTMLElement;
    public messagesElems: Array<HTMLElement> = [];
    public messages: Array<singleContactMessage> = [];
    public selectedMessages: Array<singleContactMessage> = [];
    public visibleMessage: singleContactMessage | undefined = undefined;

    public bulkDeleteElem = document.getElementById("bulkdelete-btn") as HTMLButtonElement;
    public bulkCheckbox = document.getElementById("bulk-select-inp") as HTMLInputElement;

    constructor(
    ) {
        this.setup();
    }
    
    public async setup() {
        let resp = await this.getContactMessages();
        let json = await resp.json();
        let messages = this.parseMessagesResponse(json);

        MessagesViewer.displayContainer.innerHTML = "";

        let counterElem = document.querySelector(".messages-container h2 .counter");
        if (counterElem) {
            counterElem.textContent = "(" + String(messages.length) + ")"
        }


        for (const message of messages) {
            let singleMessage = await singleContactMessage.newContactMessage(
                message.id,
                message.timestamp,
                message.name,
                message.prename,
                message.email,
                message.topic,
                message.shortMsg,
                message.longMsg);
            this.messages.push(singleMessage);
        };
        this.createListeners();
    }

    /**
     * Parses the requested Messages
     * @param json_ The response taken from getContactMessages().json()
     * @returns Every received Message
     */
    private parseMessagesResponse(json_: Record<string, any>): Array<contactMessage> {
        let msgs = new Array<contactMessage>;

        let timestamps = Object.keys(json_);

        for (const timestamp of timestamps) {
            let msg = json_[timestamp] as contactMessage;
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

        return msgs
    }
    
    private async getContactMessages() {
        let resp = await fetch("/api/admin/contact/get");
        return resp;
    }

    protected static async deleteMessage(message: singleContactMessage) {
        const confirmationMessage = `Soll die Nachricht vom ${message.timestamp.toDateString()} wirklich gelöscht werden?`

        if (!confirm(confirmationMessage)) { return };

    };
    
    protected static async performDeletion(message: singleContactMessage | singleContactMessage[]) {
        let body: string;
 
        if (message instanceof singleContactMessage) {
            body = JSON.stringify({
                id: message.id,
                multiple: false
            })
        } else {
            let ids: number[] = [];
            message.forEach((msg) => { ids.push(msg.id) });

            body = JSON.stringify({
                ids: ids,
                multiple: true
            })
        }

        let response = await fetch("/api/admin/contact/delete", {
            body: body,
            method: "delete",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            console.error("An expected error occured during deletion!");
            return;
        };
        if (response.redirected) {
            window.location.href = response.url;
            return;
        };
        window.location.reload();
    }
    
    protected createListeners(delayed?: boolean) {
    
        // HACK: Naja, immerhin funktionierts :)
        if (!delayed) {
            setTimeout(() => {this.createListeners(true); }, 250);
            return;
        }
        
    
        for (const msg of this.messages) {
            if (!msg.elem) {
                throw new Error("aaaaaaaaaaaaaaaahhhhhhhhhhhhhhhhhhhhh");
            }
    
            let titleElem = msg.elem.querySelector(".message-header h3") as HTMLElement;
    
            titleElem.addEventListener('click', (ev) => {this.clickListener(ev, msg);});
        }
        
        this.bulkCheckbox.addEventListener('change', () => { this.bulkSelectChangeHandler(); })
        this.bulkDeleteElem.addEventListener('click', () => { this.bulkDeleteHandler(); })
    };
    public selectChangeHandler(
        msg: singleContactMessage,
        selectElems: {input: HTMLInputElement, label: HTMLLabelElement}
    ) {
        if (selectElems.input.checked) {
            this.selectedMessages.push(msg);
        } else {
            const id = this.selectedMessages.indexOf(msg);
            if (id > -1) {
                this.selectedMessages.splice(id, 1);
            }
        };
    
        this.setBulkDeleteElems();
    };
    
    protected setBulkDeleteElems() {
        const amountOfSelectedMessages = this.selectedMessages.length;
        const bulkdeleteDefaultText = this.bulkDeleteElem.dataset.default as string;
        const bulkdeleteActiveText = this.bulkDeleteElem.dataset.active as string;
    
        if (amountOfSelectedMessages === 0) {
            this.bulkDeleteElem.disabled = true;
            this.bulkDeleteElem.textContent = bulkdeleteDefaultText;
            this.bulkCheckbox.checked = false;
            return
        } else {
            this.bulkDeleteElem.disabled = false;
        }
    
        if (amountOfSelectedMessages === this.messages.length) {
            this.bulkCheckbox.checked = true;
        } else {
            this.bulkCheckbox.checked = false;
        }

        if (amountOfSelectedMessages === 1) {
            this.bulkDeleteElem.textContent = bulkdeleteDefaultText + ` (${amountOfSelectedMessages})`;
        } else {
            this.bulkDeleteElem.textContent = bulkdeleteActiveText + ` (${amountOfSelectedMessages})`;
        }
    }
    
    protected bulkDeleteHandler() {
        const msgsToDelete = this.selectedMessages;
    
        if (!confirm(`Möchten Sie wirklich ${msgsToDelete.length} Nachrichten löschen?`)) {
            return
        };
    
        MessagesViewer.performDeletion(msgsToDelete);
    }
    
    protected clickListener(ev: MouseEvent, msg: singleContactMessage) {
        const msgOpen: boolean = msg.elem?.classList.contains("open") as boolean;
    
        if (this.visibleMessage) {
            let elemPrevious = this.visibleMessage.elem;
            if (elemPrevious && elemPrevious !== msg.elem) {
                elemPrevious.classList.remove("open");
            }
        }
        msg.setOpenState(!msgOpen);
        this.visibleMessage = msgOpen ? undefined : msg;
    };
    
    protected bulkSelectChangeHandler() {
        let bulkSelectAll = this.bulkCheckbox.checked;
        if (bulkSelectAll) {
            this.selectedMessages = this.messages;
            for (const msg of this.messages) {
                msg.setSelectState(true);
            }
        } else {
            this.selectedMessages = [];
            for (const msg of this.messages) {
                msg.setSelectState(false);
            }
        };
        this.setBulkDeleteElems();
    }
}


var viewer: MessagesViewer;

viewer = new MessagesViewer();