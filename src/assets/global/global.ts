
class NavCommander {
    static navtoggle: HTMLElement;
    static navbar: HTMLElement;
    private static _navState: boolean;

    static set navbarState(value: boolean) {
        this._navState = value;
        (NavCommander.navtoggle.querySelector('svg') as SVGElement).classList.toggle('open', this._navState);
        (NavCommander.navtoggle.classList.toggle("open", this._navState));
        (document.querySelector('nav') as HTMLElement).classList.toggle('show', this._navState);
    }

    static get navbarState() {
        return this._navState;
    }

    static setup() {
        NavCommander.navtoggle = document.getElementById('navtoggle') as HTMLElement;
        NavCommander.navbar = document.querySelector('#nav-wrap > nav') as HTMLElement;

        const navCloser: HTMLSpanElement = document.querySelector('nav .closebtn') as HTMLSpanElement;


        navCloser.addEventListener('click', (ev) => {
            ev.preventDefault();
            NavCommander.navbarState = false;
        })

        NavCommander.navtoggle.addEventListener('click', () => {
            NavCommander.navbarState = true;
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
    await PartialsLoader.loadPartials();
    NavCommander.setup();
    consentMgr.ensureConsent();
})