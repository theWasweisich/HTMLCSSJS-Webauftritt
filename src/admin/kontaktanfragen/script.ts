
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
    public elem: HTMLElement;
    private selectElems: {label: HTMLLabelElement, input: HTMLInputElement};

    constructor(
        public id: number,
        public timestamp: Date,
        public name: string,
        public prename: string,
        public email: string,
        public topic: string,
        public shortMsg: string,
        public longMsg: string,
        elem: HTMLElement
    ) {
        this.elem = elem;

        this.selectElems = {
            label: elem.querySelector("label") as HTMLLabelElement,
            input: elem.querySelector("input") as HTMLInputElement
        }
    }

    public setup(viewManager: ViewerManager, selectChangeHandler: CallableFunction) {
        if (!this.elem) { return }

        const selectId = `checkbox-${this.id}`;
        this.selectElems.input.id = selectId;
        this.selectElems.input.name = selectId;
        this.selectElems.label.htmlFor = selectId;


        this.selectElems.input.addEventListener('change', ev => { selectChangeHandler(viewManager, this, this.selectElems) })
    };

    public setOpenState(isOpen: boolean) {
        this.elem?.classList.toggle("open", isOpen);
    }

    public setSelectState(isSelected: boolean) {
        this.selectElems.input.checked = isSelected;
    }
}

interface contactMessages {
    [timestamp: string]: contactMessage
}

class MessagesViewer {
    public messagesElems: Array<HTMLElement> = [];
    public messages: Array<singleContactMessage> = [];
    public selectedMessages: Array<singleContactMessage> = [];

    constructor(
        public displayContainer: HTMLElement,
    ) {
        this.setup();
    }
    
    public async setup() {
        let resp = await this.getContactMessages();
        let json = await resp.json();
        let messages = this.parseMessagesResponse(json);

        this.displayContainer.innerHTML = "";

        for (const message of messages) {
            let toappend = this.setTemplateFields(message);
            let done = this.displayContainer.appendChild(toappend);
            message.elem = done;
            this.messages.push(new singleContactMessage(
                message.id,
                message.timestamp,
                message.name,
                message.prename,
                message.email,
                message.topic,
                message.shortMsg,
                message.longMsg,
                done)
            );
            this.messagesElems.push(done);
        };
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

    private setTemplateFields(message: contactMessage): HTMLElement {
        const template = document.getElementById("message-template") as HTMLTemplateElement;
        const clone = template.content.cloneNode(true) as HTMLElement;
        const toappend = clone.querySelector(".message") as HTMLElement;


        let insertableElements = clone.querySelectorAll("[data-field]") as NodeListOf<HTMLElement>;
        insertableElements.forEach(elem => {
            if (elem.dataset.field === "name") {
                elem.innerText = `${message.name}, ${message.prename}`
            } else if (elem.dataset.field === "email") {
                elem.innerText = message.email;
                (elem as HTMLAnchorElement).href = `mailto:${message.email}`;
            } else if (elem.dataset.field === "topic") {
                elem.innerText = message.topic;
            } else if (elem.dataset.field === "short") {
                elem.innerText = message.shortMsg;
            } else if (elem.dataset.field === "message") {
                elem.innerText = message.longMsg;
            } else if (elem.dataset.field === "timestamp") {
                elem.innerText = message.timestamp.toLocaleString();
            }
        });

        return toappend;
    };

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
}

class ViewerManager extends MessagesViewer {
    public visibleMessage: singleContactMessage | undefined = undefined;
    public bulkDeleteElem = document.getElementById("bulkdelete-btn") as HTMLButtonElement;
    public bulkCheckbox = document.getElementById("bulk-select-inp") as HTMLInputElement;
    
    constructor(displayContainer: HTMLElement) {
        super(displayContainer);
        this.createListeners();
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

            msg.setup(this, this.selectChangeHandler);            
        }
        
        this.bulkCheckbox.addEventListener('change', () => { this.bulkSelectChangeHandler(); })
        this.bulkDeleteElem.addEventListener('click', () => { this.bulkDeleteHandler(); })
    };

    protected selectChangeHandler(
        manager: ViewerManager,
        msg: singleContactMessage,
        selectElems: {input: HTMLInputElement, label: HTMLLabelElement}
    ) {
        if (selectElems.input.checked) {
            manager.selectedMessages.push(msg);
        } else {
            const id = manager.selectedMessages.indexOf(msg);
            if (id > -1) {
                manager.selectedMessages.splice(id, 1);
            }
        };

        manager.setBulkDeleteElems();
    };

    protected setBulkDeleteElems() {
        const amountOfSelectedMessages = this.selectedMessages.length;
        const bulkdeleteDefaultText = this.bulkDeleteElem.dataset.default as string;

        if (0 === amountOfSelectedMessages) {
            this.bulkDeleteElem.disabled = true;
            this.bulkDeleteElem.textContent = bulkdeleteDefaultText;
            this.bulkCheckbox.checked = false;
            return
        } else {
            this.bulkDeleteElem.disabled = false;
        }

        if (amountOfSelectedMessages === this.messages.length) {
            this.bulkCheckbox.checked = true;
        };

        this.bulkDeleteElem.textContent = bulkdeleteDefaultText + ` (${amountOfSelectedMessages})`;
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

var viewer: ViewerManager;

viewer = new ViewerManager(document.getElementById("contactMsg-output") as HTMLElement);