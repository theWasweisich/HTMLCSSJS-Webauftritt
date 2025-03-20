

class LoginFormHandling {
    public formRoot: HTMLFormElement;

    constructor(formRoot: HTMLFormElement, endpoint: string) {
        this.formRoot = formRoot;

        this.setup();
    }


    setup() {
        this.formRoot.addEventListener('submit', this.submitHandler);
    };

    private async submitHandler(ev: SubmitEvent) {
        ev.preventDefault();
        const usernameInp = document.getElementById("username-inp") as HTMLInputElement;
        const passwordInp = document.getElementById("password-inp") as HTMLInputElement;

        const formData = JSON.stringify(
            {username: usernameInp.value,
                password: passwordInp.value
            }
        );

        const defaultEndpoint: string = "/api/login";

        console.log(`Sending: "${formData}"`);

        let response = await fetch(defaultEndpoint, {
            body: formData,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.redirected) {
            window.location.href = response.url;
        }
    }
}

const loginForm = document.getElementById('loginForm') as HTMLFormElement;

const handlr = new LoginFormHandling(loginForm, "/api/admin/login");