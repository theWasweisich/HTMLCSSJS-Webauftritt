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

    constructor (
        public messages: Array<contactMessage>,
        public displayContainer: HTMLElement
    ) {
        this.messagesElems = [];
        this.setup();
    }

    public setup() {
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
                (elem as HTMLTextAreaElement).value = message.longMsg;
            }
        });

        return toappend;
    }
}

async function getContactMessages() {
    let resp = await fetch("/api/admin/contact/get");
    return resp;
}

/**
 * Parses the requested Messages
 * @param json_ The response taken from getContactMessages().json()
 * @returns Every received Message
 */
function parseMessagesResponse(json_: Record<string, any>): Array<contactMessage> {
    let msgs = new Array<contactMessage>;

    let timestamps = Object.keys(json_);

    for (const timestamp of timestamps) {
        let msg = json_[timestamp] as contactMessage;
        msg.timestamp = new Date(timestamp);
        msgs.push(msg);
    }

    return msgs
}

let contactsSection = document.getElementById("request-contacts") as HTMLElement;
let requestButton = contactsSection.querySelector("button") as HTMLButtonElement;
const msgsOutputSection = document.getElementById("contactMsg-output") as HTMLElement;
var viewer: MessagesViewer;

requestButton.addEventListener('click', async ev => {
    let msgs = await (await getContactMessages()).json();

    let messages = parseMessagesResponse(msgs);
    viewer = new MessagesViewer(messages, msgsOutputSection);
});