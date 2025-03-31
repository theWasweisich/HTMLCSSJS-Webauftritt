type FormElements = {
    prenameInp: HTMLInputElement;
    nameInp: HTMLInputElement;
    emailInp: HTMLInputElement;
    topicSel: HTMLSelectElement;
    shortInp: HTMLInputElement;
    longInp: HTMLTextAreaElement;
}

enum validationResult {
    OK,
    NOT_OK,
    SILENT_FAIL
}

enum responseType {
    SEND_SUCCESS,
    SEND_FAILED,
    NEED_TO_WAIT
}

class FormMaster {
    static badWords: string[] = [
        "kaputt", "garantie", "betrug", "schlecht"
    ];

    formRoot: HTMLFormElement;
    elements: FormElements;

    static emailRegex: RegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    static get lastSubmitted() {
        return Number(localStorage.getItem('lastSubmit'));
    }
    static set lastSubmitted(value: number) {
        localStorage.setItem('lastSubmit', value.toString());
    }

    constructor(formRoot: HTMLFormElement) {
        this.formRoot = formRoot;
        const prenameInp = this.formRoot.querySelector("#prename-inp") as HTMLInputElement;
        const nameInp = this.formRoot.querySelector("#name-inp") as HTMLInputElement;
        const emailInp = this.formRoot.querySelector("#email-inp") as HTMLInputElement;
        const topicSel = this.formRoot.querySelector("#topic-sel") as HTMLSelectElement;
        const shortInp = this.formRoot.querySelector("#short-inp") as HTMLInputElement;
        const longInp = this.formRoot.querySelector("#long-inp") as HTMLTextAreaElement;
        this.formRoot = document.querySelector("form") as HTMLFormElement;

        this.elements = {
            emailInp: emailInp,
            prenameInp: prenameInp,
            nameInp: nameInp,
            topicSel: topicSel,
            shortInp: shortInp,
            longInp: longInp
        };

        this.formRoot.addEventListener('submit', e => {
            e.preventDefault();

            let lastSubmit = localStorage.getItem("lastSubmit");
            if (lastSubmit !== null) {
                const secondsPassed = (Date.now() - Number(lastSubmit)) / 1000;
                const minutesPassed = secondsPassed / 60;
                if (minutesPassed < 15) {
                    FormMaster.triggerResponse(responseType.NEED_TO_WAIT);
                    return;
                };
            };

            let validity = this.validator();
            let isValid = this.formRoot.reportValidity();

            if (isValid && validity === validationResult.OK) {
                this.sendData().then((res) => {
                    if (res.ok) {
                        FormMaster.triggerResponse(responseType.SEND_SUCCESS);
                    } else {
                        FormMaster.triggerResponse(responseType.SEND_FAILED);
                    }
                    FormMaster.lastSubmitted = Date.now();
                    this.formRoot.reset();
                });
            } else if (isValid && validity === validationResult.SILENT_FAIL) {
                // Rückerstattungen machen wir nicht, aber wir tun so, als ob alles bestens wäre :)
                console.log("🤫 Das ignorieren wir heimlich");
                this.formRoot.reset();
                FormMaster.triggerResponse(responseType.SEND_SUCCESS);
            };
        });

        this.formRoot.addEventListener('input', e => {
            e.target
            this.validator(e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
            this.formRoot.reportValidity();
        });
    }

    static triggerResponse(type: responseType) {
        let dialog: HTMLDialogElement;
        if (type === responseType.SEND_SUCCESS) {
            dialog = document.getElementById('success-msg') as HTMLDialogElement;
        } else if (type === responseType.SEND_FAILED) {
            dialog = document.getElementById('failed-msg') as HTMLDialogElement;
        } else if (type === responseType.NEED_TO_WAIT) {
            dialog = document.getElementById("wait-msg") as HTMLDialogElement;
        } else {
            throw new Error("Hmmmmmmmmmmmmmm");
        }
        dialog.showModal();
    }

    /**
     * @returns True if valid, false if invalid
     */
    validator(inputToCheck?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): validationResult {
        var isValid: validationResult = validationResult.OK;

        const validateNameInputs = () => {
            // Required
            if (this.elements.nameInp.value.replace(" ", "") === "") {
                this.elements.nameInp.setCustomValidity("Bitte angeben"); isValid = validationResult.NOT_OK
            } else {
                this.elements.nameInp.setCustomValidity("")
            }
            if (this.elements.prenameInp.value === "") {
                this.elements.prenameInp.setCustomValidity("Bitte angeben"); isValid = validationResult.NOT_OK
            } else {
                this.elements.nameInp.setCustomValidity("")
            }
        }

        const checkForBadWords = () => {
            for (const word of FormMaster.badWords) {
                const toCheck = word.toLowerCase()
                if (this.elements.longInp.value.includes(word)) { isValid = validationResult.NOT_OK };
                if (this.elements.shortInp.value.includes(word)) { isValid = validationResult.NOT_OK };
            };
        }

        const checkEmailValidity = () => {
            if (!FormMaster.emailRegex.test(this.elements.emailInp.value.toLowerCase())) {
                this.elements.emailInp.setCustomValidity("Die Email sieht aber nicht gut aus!");
                isValid = validationResult.NOT_OK;
            } else {
                this.elements.emailInp.setCustomValidity("");
            }
        }

        const checkSelectionValidity = () => {
            let selected = this.elements.topicSel.selectedOptions.item(0)?.value;
            this.elements.topicSel.setCustomValidity("");
            if (selected === "garantie") {
                this.elements.topicSel.setCustomValidity("Bei uns gibt es keine Garantie!");
                isValid = validationResult.NOT_OK;
            } else if (selected === "allgemein") {
                this.elements.topicSel.setCustomValidity("Bitte seien sie etwas genauer");
                isValid = validationResult.NOT_OK;
            } else if (selected === "erstattung") {
                isValid = validationResult.SILENT_FAIL;
            } else {
                this.elements.topicSel.setCustomValidity("");
            }
        }

        if (inputToCheck === undefined) {
            validateNameInputs();
            checkForBadWords();
            checkEmailValidity();
            checkSelectionValidity();
            return isValid;
        }

        switch (inputToCheck.id) {
            case "prename-inp":
            case "name-inp":
                validateNameInputs();
                break;
            case "email-inp":
                checkEmailValidity();
                break;
            case "topic-sel":
                checkSelectionValidity();
                break;
            default:
                break;
        }

        return isValid;
    }

    private async sendData() {
        var data = {
            "name": this.elements.nameInp.value,
            "prename": this.elements.prenameInp.value,
            "email": this.elements.emailInp.value,
            "topic": this.elements.topicSel.value,
            "shortMsg": this.elements.shortInp.value,
            "longMsg": this.elements.longInp.value
        };

        let response = await fetch("/api/contact/new", {
            "method": "POST",
            "headers": [
                ["Content-Type", "application/json"]
            ],
            "body": JSON.stringify(data)
        });

        return response;
    }
}

const formmaster = new FormMaster(document.querySelector("form") as HTMLFormElement);