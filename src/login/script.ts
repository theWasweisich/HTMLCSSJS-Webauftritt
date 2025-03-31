

class LoginFormHandler {
    private loginFormRoot = document.getElementById("loginForm") as HTMLFormElement;
    private usernameInp = document.getElementById("username-inp") as HTMLInputElement;
    private passwordInp = document.getElementById("password-inp") as HTMLInputElement;
    private outputElem = document.getElementById("loginFormOutput") as HTMLOutputElement;
    private angryElem = document.getElementById('angry') as HTMLSpanElement;
    private _inErrorState = false;

    private get inErrorState() {
        return this._inErrorState;
    }

    private set inErrorState(value: boolean) {
        this._inErrorState = value;
        if (this._inErrorState) {
            this.outputElem.textContent = 'Benutzername oder Passwort oder beides sind falsch!';
            this.angryElem.hidden = false;
        } else {
            this.outputElem.textContent = '';
            this.angryElem.hidden = true
        }
    }

    constructor() {
        this.setup();
    }

    private setup() {
        this.loginFormRoot.addEventListener("submit", ev => { this.handleSubmitEvent(ev) });
        this.usernameInp.addEventListener('input', (ev) => { this.keyDownEventHandler(ev); });
        this.passwordInp.addEventListener('input', (ev) => { this.keyDownEventHandler(ev); });
    }

    private handleSubmitEvent(ev: SubmitEvent) {
        ev.preventDefault();

        let username = this.usernameInp.value;
        let password = this.passwordInp.value;

        if (username.length === 0 || password.length === 0) {
            console.error("Benutzername und Passwort müssen angegeben sein!");
            return;
        }

        this.sendToServer(username, password);
    };

    private keyDownEventHandler(ev: Event) {
        if (this.inErrorState) {
            this.inErrorState = false;
        }
    }
    
    private async sendToServer(username: string, password: string) {
        let reqbody: string = JSON.stringify({
            username: username,
            password: password
        });

        let res = await fetch("/api/login", {
            body: reqbody,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
            this.loginFormRoot.reset();
            this.inErrorState = true;
            this.usernameInp.focus();
            return;
        };

        if (res.redirected) {
            window.location.href = res.url;
        }
    }
}


const loginHandler = new LoginFormHandler();