var usernameInp: HTMLInputElement;
var username: string | undefined = "";

// @ts-ignore
async function main() {
    usernameInp = document.getElementById("username-inp") as HTMLInputElement;
    let form = document.getElementById("username-form") as HTMLFormElement;
    username = form.querySelector("p")?.innerText.slice(9);
    usernameInp.placeholder = username ? username : "";
    if (username) {
        form.querySelector("p")?.remove();
    };
    await passwordResetBtnManagement();
};

async function passwordResetBtnManagement() {
    let btn = document.getElementById("btn-reset-passwd");
    btn?.addEventListener("click", async (ev) => {
        if (!username) { username = prompt("Geben Sie den Benutzernamen ein") as string; }
        const fetchPath = `/api/users/password?user=${username}`;
        let response = await fetch(fetchPath, {method: 'delete'});

        if (response.ok) {
            alert("Passwort wurde zurückgesetzt! Neues Passwort: password");
        } else {
            alert("Es gab einen Fehler!");
        }
    })
}

document.addEventListener("DOMContentLoaded", () => {
    main();
})