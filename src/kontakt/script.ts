type FormElements = {
    prenameInp: HTMLInputElement;
    nameInp: HTMLInputElement;
    emailInp: HTMLInputElement;
    topicSel: HTMLSelectElement;
    shortInp: HTMLInputElement;
    longInp: HTMLTextAreaElement;
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
                if ((Date.now() - Number(lastSubmit)) < 5000) {
                    return;
                }
            }

            this.validator();
            let isValid = this.formRoot.checkValidity();
            if (isValid) {
                this.sendData().then((res) => {
                    FormMaster.triggerResponse(res.ok);
                    FormMaster.lastSubmitted = Date.now();
                    this.formRoot.reset();
                });
            };
        });

        this.formRoot.addEventListener('input', e => {
            e.target
            this.validator(e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
            this.formRoot.reportValidity();
        });
    }

    static triggerResponse(success: boolean) {
        if (success) {
            let dialog = document.getElementById('success-msg') as HTMLDialogElement;
            dialog.showModal()
        } else {
            let dialog = document.getElementById('failed-msg') as HTMLDialogElement;
            dialog.showModal();
        }
    }

    /**
     * @returns True if valid, false if invalid
     */
    validator(inputToCheck?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
        var isValid: boolean = true;

        const validateNameInputs = () => {
            // Required
            if (this.elements.nameInp.value.replace(" ", "") === "") {
                this.elements.nameInp.setCustomValidity("Bitte angeben"); isValid = false
            } else {
                this.elements.nameInp.setCustomValidity("")
            }
            if (this.elements.prenameInp.value === "") {
                this.elements.prenameInp.setCustomValidity("Bitte angeben"); isValid = false
            } else {
                this.elements.nameInp.setCustomValidity("")
            }
        }

        const checkForBadWords = () => {
            for (const word of FormMaster.badWords) {
                if (this.elements.longInp.value.includes(word)) { isValid = false };
                if (this.elements.shortInp.value.includes(word)) { isValid = false };
            };
        }

        const checkEmailValidity = () => {
            if (!FormMaster.emailRegex.test(this.elements.emailInp.value.toLowerCase())) {
                this.elements.emailInp.setCustomValidity("Die Email sieht aber nicht gut aus!");
                isValid = false;
            } else {
                this.elements.emailInp.setCustomValidity("");
            }
        }

        const checkSelectionValidity = () => {
            let selected = this.elements.topicSel.selectedOptions.item(0)?.value;
            this.elements.topicSel.setCustomValidity("");
            if (selected === "garantie") {
                this.elements.topicSel.setCustomValidity("Bei uns gibt es keine Garantie!");
                isValid = false;
            } else if (selected === "allgemein") {
                this.elements.topicSel.setCustomValidity("Bitte seien sie etwas genauer");
                isValid = false;
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