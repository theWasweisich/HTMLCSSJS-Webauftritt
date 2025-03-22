interface contactMessage {
    timestamp: Date,
    name: string,
    prename: string,
    email: string,
    topic: string,
    shortMsg: string,
    longMsg: string
}

interface contactMessages {
    [timestamp: string]: contactMessage
}

class MessagesViewer {
    public messagesElems: Array<HTMLElement>;
    public messages: Array<contactMessage>;

    constructor(
        public displayContainer: HTMLElement,
        callback?: CallableFunction,
    ) {
        this.messages = [];
        this.messagesElems = [];
        this.setup(callback);
    }
    
    public async setup(callback?: CallableFunction) {
        console.log("Setup")
        let resp = await this.getContactMessages();
        let json = await resp.json();
        this.messages = this.parseMessagesResponse(json);

        this.displayContainer.innerHTML = "";

        for (const message of this.messages) {
            let toappend = this.setTemplateFields(message);
            let done = this.displayContainer.appendChild(toappend);
            console.log(done);
            this.messagesElems.push(done);
        };
        if (callback) {
            callback();
        }
    }

    /**
     * Parses the requested Messages
     * @param json_ The response taken from getContactMessages().json()
     * @returns Every received Message
     */
    private parseMessagesResponse(json_: Record<string, any>): Array<contactMessage> {
        let msgs = new Array<contactMessage>;

        let timestamps = Object.keys(json_);

        console.groupCollapsed("Parsing");
        for (const timestamp of timestamps) {
            let msg = json_[timestamp] as contactMessage;
            msg.timestamp = new Date(msg.timestamp);
            msgs.push(msg);
            console.debug(msg);
        }
        console.groupEnd();

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
    }
}

class ViewerManager extends MessagesViewer {
    public visibleMessage: HTMLElement | null = null;

    constructor(displayContainer: HTMLElement) {
        super(displayContainer, () => {this.createListeners()});
        this.createListeners();
    }

    protected createListeners() {
        if (this.messagesElems.length !== this.messages.length) {
            throw new Error("Was ist denn hiiiiiiiieeeer los?");
        };
        console.log("Messages Elems:");
        console.log(this.messagesElems);
 
        this.messagesElems.forEach((elem) => {
            let headerElem = elem.querySelector(".message-header") as HTMLElement;
            headerElem.addEventListener('click', (ev) => {this.clickListener(ev, elem);});
        });
    };

    protected clickListener(ev: MouseEvent, elem: HTMLElement) {
        this.visibleMessage = elem.classList.toggle("open") ? elem : null;
    }
}

const msgsOutputSection = document.getElementById("contactMsg-output") as HTMLElement;
var viewer: ViewerManager;

viewer = new ViewerManager(msgsOutputSection);