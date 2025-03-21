

class LoginFormHandler {
    private loginFormRoot = document.getElementById("loginForm") as HTMLFormElement;
    private usernameInp = document.getElementById("username-inp") as HTMLInputElement;
    private passwordInp = document.getElementById("password-inp") as HTMLInputElement;
    constructor() {
        this.setup();
    }

    private setup() {
        this.loginFormRoot.addEventListener("submit", this.handleSubmitEvent)
    }

    private handleSubmitEvent(ev: SubmitEvent) {
        ev.preventDefault();

        let username = this.usernameInp.value;
        let password = this.passwordInp.value;

        if (username.length === 0 || password.length === 0) {
            console.error("Benutzername und Passwort müssen angegeben sein!");
            return;
        }

    };
    
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
    }
}