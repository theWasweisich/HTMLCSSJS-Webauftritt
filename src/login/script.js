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
class LoginFormHandling {
    constructor(formRoot, endpoint) {
        this.formRoot = formRoot;
        this.setup();
    }
    setup() {
        this.formRoot.addEventListener('submit', this.submitHandler);
    }
    ;
    submitHandler(ev) {
        return __awaiter(this, void 0, void 0, function* () {
            ev.preventDefault();
            const usernameInp = document.getElementById("username-inp");
            const passwordInp = document.getElementById("password-inp");
            const formData = JSON.stringify({ username: usernameInp.value,
                password: passwordInp.value
            });
            const defaultEndpoint = "/api/admin/login";
            console.log(`Sending: "${formData}"`);
            let response = fetch(defaultEndpoint, {
                body: formData,
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
        });
    }
}
const loginForm = document.getElementById('loginForm');
const handlr = new LoginFormHandling(loginForm, "/api/admin/login");
