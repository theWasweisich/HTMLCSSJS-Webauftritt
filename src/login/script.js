"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LoginFormHandler {
    constructor() {
        this.loginFormRoot = document.getElementById("loginForm");
        this.usernameInp = document.getElementById("username-inp");
        this.passwordInp = document.getElementById("password-inp");
        this.setup();
    }
    setup() {
        this.loginFormRoot.addEventListener("submit", ev => { this.handleSubmitEvent(ev); });
    }
    handleSubmitEvent(ev) {
        ev.preventDefault();
        let username = this.usernameInp.value;
        let password = this.passwordInp.value;
        if (username.length === 0 || password.length === 0) {
            console.error("Benutzername und Passwort müssen angegeben sein!");
            return;
        }
        this.sendToServer(username, password);
    }
    ;
    sendToServer(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let reqbody = JSON.stringify({
                username: username,
                password: password
            });
            let res = yield fetch("/api/login", {
                body: reqbody,
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!res.ok) {
                console.error(yield res.text());
                return;
            }
            ;
            if (res.redirected) {
                window.location.href = res.url;
            }
        });
    }
}
const loginHandler = new LoginFormHandler();
