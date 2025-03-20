
interface contactMessage {
    name: string,
    prename: string,
    email: string,
    topic: string,
    shortMsg: string,
    longMsg: string
}

class MessagesViewer {
    constructor (
        public messages: Array<contactMessage>,
        public displayContainer: HTMLElement
    ) {  }

    private setup() {

    }
}

async function getContactMessages() {
    let resp = await fetch("/api/admin/contact/get");
    return resp;
}

function parseResponse(json_: object): Array<contactMessage> {
    let msgs = new Array<contactMessage>;
    return msgs
}

let contactsSection = document.getElementById("request-contacts") as HTMLElement;
let requestButton = contactsSection.querySelector("button") as HTMLButtonElement;


requestButton.addEventListener('click', async ev => {
    let msgs = await getContactMessages();
    console.log(msgs);

    let output = document.createElement("p");
    output.innerText = JSON.stringify((await msgs.json()))
    contactsSection.appendChild(output);
});