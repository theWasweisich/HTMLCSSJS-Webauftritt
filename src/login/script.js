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
    get inErrorState() {
        return this._inErrorState;
    }
    set inErrorState(value) {
        this._inErrorState = value;
        if (this._inErrorState) {
            this.outputElem.textContent = 'Benutzername oder Passwort oder beides sind falsch!';
            this.angryElem.hidden = false;
        }
        else {
            this.outputElem.textContent = '';
            this.angryElem.hidden = true;
        }
    }
    constructor() {
        this.loginFormRoot = document.getElementById("loginForm");
        this.usernameInp = document.getElementById("username-inp");
        this.passwordInp = document.getElementById("password-inp");
        this.outputElem = document.getElementById("loginFormOutput");
        this.angryElem = document.getElementById('angry');
        this._inErrorState = false;
        this.setup();
    }
    setup() {
        this.loginFormRoot.addEventListener("submit", ev => { this.handleSubmitEvent(ev); });
        this.usernameInp.addEventListener('input', (ev) => { this.keyDownEventHandler(ev); });
        this.passwordInp.addEventListener('input', (ev) => { this.keyDownEventHandler(ev); });
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
    keyDownEventHandler(ev) {
        if (this.inErrorState) {
            this.inErrorState = false;
        }
    }
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
                this.loginFormRoot.reset();
                this.inErrorState = true;
                this.usernameInp.focus();
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
