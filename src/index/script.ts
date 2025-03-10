
class KundenStimmenHandler {
    static kundenstimmen = document.querySelectorAll('#kundenstimmen>.kundenstimme');
    static observer: IntersectionObserver;

    public static setup(margin?: string, threshold?: number) {
        if (margin === undefined) { margin = "0px"; }
        if (threshold === undefined) { threshold = .5 }

        const observerOptions = {
            root: null,
            rootMargin: margin,
            threshold: threshold
        }
        KundenStimmenHandler.observer = new IntersectionObserver(KundenStimmenHandler.intersectionCallback, observerOptions);

        this.kundenstimmen.forEach(elem => {
            KundenStimmenHandler.observer.observe(elem);
        });
    };

    /**
     * Function checks if an element is close to the viewport (only vertical)
     * @param elem The element
     * @param buffer The +- amount of pixel around the viewport that is still considered viewport
     * @returns True if the element is close to the viewport
     */
    static isCloseToViewport(elem: HTMLElement, buffer?: number) {
        const rect = elem.getBoundingClientRect();
        if (buffer === undefined) {
            buffer = 50; // in px
        }
        const isNearViewport = rect.top >= -buffer && rect.bottom <= window.innerHeight + buffer;
        return isNearViewport;
    }

    static intersectionCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            let intersecting = entry.isIntersecting;
            entry.target.classList.toggle('visible', intersecting);
        });
    };
}

KundenStimmenHandler.setup()