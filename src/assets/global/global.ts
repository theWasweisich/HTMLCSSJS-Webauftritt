
class NavCommander {
    static navtoggle: HTMLButtonElement;
    static navbar: HTMLElement;
    static navList: HTMLUListElement;
    private static _navState: boolean;

    static set navbarState(value: boolean) {
        this._navState = value;
        if (!value) { (document.activeElement as HTMLElement).blur(); };
        // this.navbar.classList.toggle('show', this._navState);

        if (this._navState) {
            this.navtoggle.setAttribute("aria-expanded", "true");

            this.changeLinksFocusability(true);
            this.navbar.classList.add("open");
        } else {
            this.navtoggle.setAttribute("aria-expanded", "false");
            this.changeLinksFocusability(false);

            this.navbar.classList.remove("open", "opened");
        };
    };

    private static changeLinksFocusability(focusable: boolean) {
        let childs = this.navList.querySelectorAll("a");
        // console.log("🛠️ Changing focusability", childs);
        childs.forEach((elem) => {
            if (focusable) {
                elem.removeAttribute("tabindex");
            } else {
                elem.setAttribute("tabindex", "-1");
            }
        })
    }

    static get navbarState() {
        return this._navState;
    }

    static setup() {
        NavCommander.navtoggle = document.getElementById('navtoggle') as HTMLButtonElement;
        NavCommander.navbar = document.querySelector('#primary-nav-bar') as HTMLElement;
        NavCommander.navList = this.navbar.querySelector("ul") as HTMLUListElement;


        NavCommander.navtoggle.addEventListener('click', () => {
            NavCommander.navbarState = this.navbarState ? false : true;
        });

        window.addEventListener('mousedown', this.mouseDownHandler);
        window.addEventListener('keydown', this.keyDownHandler);
    };

    private static mouseDownHandler(this: Window, event: MouseEvent) {
        const navWidth = NavCommander.navbar.clientWidth;
        const btnRect = NavCommander.navtoggle.getBoundingClientRect()

        const isOnNavBar = navWidth > event.clientX;
        const isOnBtn = (
            (btnRect.x < event.clientX && event.clientX < btnRect.x + btnRect.width) &&
            (btnRect.y < event.clientY && event.clientY < btnRect.y + btnRect.height)
        );

        if (NavCommander.navbarState && !isOnNavBar) {
            NavCommander.navbarState = false;
        };
    };

    private static keyDownHandler(this: Window, event: KeyboardEvent) {
        const target: HTMLElement = event.target as HTMLElement;

        const exceptType = [
            HTMLInputElement,
            HTMLTextAreaElement,
            HTMLSelectElement
        ];

        for (const type of exceptType) {
            if (target instanceof type) { return; };
            if (target.matches("[contenteditable=true]")) { return; };
        };

        // Wenn m (für "menü") gedrückt wird, toggle navbar
        if (event.key === "m") {
            NavCommander.navbarState = !NavCommander.navbarState;
            if (NavCommander.navbarState) {
                (NavCommander.navbar.querySelector("a[href]") as HTMLAnchorElement | undefined)?.focus();
            }
        };
    };
}

class PartialsLoader {
    static partialUrls = {
        "footer": "/templates/footer.html",
        "nav": "/templates/navbar.html",
        "consent": "/templates/cookieBanner.html"
    }

    static async loadPartial(url: string, toreplace: string | HTMLElement) {
        let resp = await (await fetch(url)).text();
        if (!(toreplace instanceof HTMLElement)) {
            toreplace = (document.querySelector(toreplace) as HTMLElement);
        }
        if (toreplace) toreplace.outerHTML = resp;
    }

    static async loadPartials() {
        await this.loadPartial(this.partialUrls["footer"], "footer[data-load='true']");
        await this.loadPartial(this.partialUrls["nav"], "nav[data-load='true']");

        let bannerRes = await fetch("/api/cookies");
        if (bannerRes.headers.has("x-cookies-disabled")) {
            consentMgr.cookieBannerblocked = true;
        }

        PartialsLoader.setStaticNav();
    }

    static setStaticNav() {
        const navbar: HTMLElement = document.querySelector('nav') as HTMLElement;
        navbar.querySelectorAll('a').forEach(elem => {
            if (elem.pathname == location.pathname && !elem.classList.contains("closebtn")) {
                elem.classList.add("active");
            }
        })
    }
}

class consentMgr {
    static cookieBannerblocked: boolean = false;
    static storageName = {
        expiry: "lastConsentMS"
    };
    static validForHrs = 2;

    static consentValidForMS = this.validForHrs * 60 * 60 * 1000;

    public static get consent(): number {
        return Number(localStorage.getItem(consentMgr.storageName.expiry));
    }
    public static set consent(value: number) {
        localStorage.setItem(this.storageName.expiry, value.toString());
    }

    /**
     * The Milliseconds after which consent will be lost
     */
    public static get consentRemaining(): number {
        return Number((consentMgr.consent + this.consentValidForMS) - Date.now())
    }


    /**
     * @returns True if consent has been given, and false if not
     */
    static checkConsent(): boolean { return consentMgr.consentRemaining > 0 }

    static ensureConsent(...args: any[]) {
        if (!consentMgr.checkConsent()) {
            consentMgr.promptConsent();
        }
        return;
    }

    static ensureConsentRepeat(...args: any[]) {
        if (!consentMgr.checkConsent()) {
            consentMgr.promptConsent();
        } else {
            setTimeout(consentMgr.promptConsent, consentMgr.consentRemaining);
        }
    }

    static revokeConsent() {
        localStorage.removeItem(this.storageName.expiry);
        this.ensureConsent();
    }


    static async promptConsent() {

        if (this.cookieBannerblocked) {
            return;
        }

        let replacer = document.querySelector('#cookieBanner') as HTMLElement | null;
        // console.assert(replacer instanceof HTMLElement, `Consent-Prompt noch nicht geladen`);
        if (!replacer) {
            replacer = document.body.appendChild(document.createElement('dialog'));
            await PartialsLoader.loadPartial(PartialsLoader.partialUrls.consent, replacer);
        }

        replacer = document.getElementById("cookieBanner") as HTMLDialogElement;

        if (!(replacer instanceof HTMLDialogElement)) { throw "Nanananana" };

        document.body.style.overflow = "hidden";
        consentMgr.setListeners(replacer);
        replacer.showModal();
    }

    static setListeners(modal: HTMLDialogElement) {
        let acceptbtn = modal.querySelector('button[data-btn]');
        acceptbtn?.addEventListener('click', () => {
            document.body.style.removeProperty('overflow');
            modal.close();
            this.consent = Date.now();
        });
        modal.addEventListener('close', onClose);
        function onClose() {
            consentMgr.ensureConsent();
            modal.removeEventListener('close', onClose);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.body.querySelectorAll("& > [hidden]").forEach(elem => { elem.removeAttribute("hidden") });
    await PartialsLoader.loadPartials();
    NavCommander.setup();
    consentMgr.ensureConsent();
});