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
var _a;
class NavCommander {
    static set navbarState(value) {
        this._navState = value;
        if (!value) {
            document.activeElement.blur();
        }
        ;
        // this.navbar.classList.toggle('show', this._navState);
        if (this._navState) {
            this.navtoggle.setAttribute("aria-expanded", "true");
            this.navbar.classList.add("open");
            this.navbar.addEventListener('animationend', (ev) => {
                this.navbar.classList.add("opened");
                this.navbar.classList.remove("open");
            }, { once: true });
        }
        else {
            this.navtoggle.setAttribute("aria-expanded", "false");
            this.navbar.classList.add('close');
            this.navbar.classList.remove("open", "opened");
            this.navbar.addEventListener('animationend', (ev) => {
                this.navbar.classList.remove('close');
            }, { once: true });
        }
        ;
    }
    ;
    static get navbarState() {
        return this._navState;
    }
    static setup() {
        NavCommander.navtoggle = document.getElementById('navtoggle');
        NavCommander.navbar = document.querySelector('#primary-nav-bar');
        NavCommander.navList = this.navbar.querySelector("ul");
        NavCommander.navtoggle.addEventListener('click', () => {
            NavCommander.navbarState = this.navbarState ? false : true;
        });
        window.addEventListener('mousedown', this.mouseDownHandler);
        window.addEventListener('keydown', this.keyDownHandler);
    }
    ;
    static mouseDownHandler(event) {
        const navWidth = NavCommander.navbar.clientWidth;
        const btnRect = NavCommander.navtoggle.getBoundingClientRect();
        const isOnNavBar = navWidth > event.clientX;
        const isOnBtn = ((btnRect.x < event.clientX && event.clientX < btnRect.x + btnRect.width) &&
            (btnRect.y < event.clientY && event.clientY < btnRect.y + btnRect.height));
        if (NavCommander.navbarState && !isOnNavBar) {
            NavCommander.navbarState = false;
        }
        ;
    }
    ;
    static keyDownHandler(event) {
        var _b;
        const target = event.target;
        const exceptType = [
            HTMLInputElement,
            HTMLTextAreaElement,
            HTMLSelectElement
        ];
        for (const type of exceptType) {
            if (target instanceof type) {
                return;
            }
            ;
            if (target.matches("[contenteditable=true]")) {
                return;
            }
            ;
        }
        ;
        // Wenn m (für "menü") gedrückt wird, toggle navbar
        if (event.key === "m") {
            NavCommander.navbarState = !NavCommander.navbarState;
            if (NavCommander.navbarState) {
                (_b = NavCommander.navbar.querySelector("a[href]")) === null || _b === void 0 ? void 0 : _b.focus();
            }
        }
        ;
    }
    ;
}
class PartialsLoader {
    static loadPartial(url, toreplace) {
        return __awaiter(this, void 0, void 0, function* () {
            let resp = yield (yield fetch(url)).text();
            if (!(toreplace instanceof HTMLElement)) {
                toreplace = document.querySelector(toreplace);
            }
            if (toreplace)
                toreplace.outerHTML = resp;
        });
    }
    static loadPartials() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadPartial(this.partialUrls["footer"], "footer[data-load='true']");
            yield this.loadPartial(this.partialUrls["nav"], "nav[data-load='true']");
            let bannerRes = yield fetch("/api/cookies");
            if (bannerRes.headers.has("x-cookies-disabled")) {
                consentMgr.cookieBannerblocked = true;
            }
            PartialsLoader.setStaticNav();
        });
    }
    static setStaticNav() {
        const navbar = document.querySelector('nav');
        navbar.querySelectorAll('a').forEach(elem => {
            if (elem.pathname == location.pathname && !elem.classList.contains("closebtn")) {
                elem.classList.add("active");
            }
        });
    }
}
PartialsLoader.partialUrls = {
    "footer": "/templates/footer.html",
    "nav": "/templates/navbar.html",
    "consent": "/templates/cookieBanner.html"
};
class consentMgr {
    static get consent() {
        return Number(localStorage.getItem(_a.storageName.expiry));
    }
    static set consent(value) {
        localStorage.setItem(this.storageName.expiry, value.toString());
    }
    /**
     * The Milliseconds after which consent will be lost
     */
    static get consentRemaining() {
        return Number((_a.consent + this.consentValidForMS) - Date.now());
    }
    /**
     * @returns True if consent has been given, and false if not
     */
    static checkConsent() { return _a.consentRemaining > 0; }
    static ensureConsent(...args) {
        if (!_a.checkConsent()) {
            _a.promptConsent();
        }
        return;
    }
    static ensureConsentRepeat(...args) {
        if (!_a.checkConsent()) {
            _a.promptConsent();
        }
        else {
            setTimeout(_a.promptConsent, _a.consentRemaining);
        }
    }
    static revokeConsent() {
        localStorage.removeItem(this.storageName.expiry);
        this.ensureConsent();
    }
    static promptConsent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cookieBannerblocked) {
                return;
            }
            let replacer = document.querySelector('#cookieBanner');
            // console.assert(replacer instanceof HTMLElement, `Consent-Prompt noch nicht geladen`);
            if (!replacer) {
                replacer = document.body.appendChild(document.createElement('dialog'));
                yield PartialsLoader.loadPartial(PartialsLoader.partialUrls.consent, replacer);
            }
            replacer = document.getElementById("cookieBanner");
            if (!(replacer instanceof HTMLDialogElement)) {
                throw "Nanananana";
            }
            ;
            document.body.style.overflow = "hidden";
            _a.setListeners(replacer);
            replacer.showModal();
        });
    }
    static setListeners(modal) {
        let acceptbtn = modal.querySelector('button[data-btn]');
        acceptbtn === null || acceptbtn === void 0 ? void 0 : acceptbtn.addEventListener('click', () => {
            document.body.style.removeProperty('overflow');
            modal.close();
            this.consent = Date.now();
        });
        modal.addEventListener('close', onClose);
        function onClose() {
            _a.ensureConsent();
            modal.removeEventListener('close', onClose);
        }
    }
}
_a = consentMgr;
consentMgr.cookieBannerblocked = false;
consentMgr.storageName = {
    expiry: "lastConsentMS"
};
consentMgr.validForHrs = 2;
consentMgr.consentValidForMS = _a.validForHrs * 60 * 60 * 1000;
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    document.body.querySelectorAll("& > [hidden]").forEach(elem => { elem.removeAttribute("hidden"); });
    yield PartialsLoader.loadPartials();
    NavCommander.setup();
    consentMgr.ensureConsent();
}));
