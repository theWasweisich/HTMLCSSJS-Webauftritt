
class KundenStimmenHandler {
    static kundenstimmen = document.querySelectorAll('#kundenstimmen .kundenstimme');
    static observer: IntersectionObserver;

    public static setup(margin?: string, threshold?: number) {
        if (margin === undefined) { margin = "0px"; }
        if (threshold === undefined) { threshold = 0.5 }

        const observerOptions: IntersectionObserverInit = {
            root: null,
            rootMargin: margin,
            threshold: threshold
        }
        KundenStimmenHandler.observer = new IntersectionObserver(KundenStimmenHandler.intersectionCallback, observerOptions);

        this.kundenstimmen.forEach(elem => {
            KundenStimmenHandler.observer.observe(elem);
        });
    };


    static intersectionCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            let intersecting = entry.isIntersecting;
            entry.target.classList.toggle('visible', intersecting);
        });
    };
}

/**
 * Function checks if an element is close to the viewport (only vertical)
 * @param elem The element
 * @param buffer The +- amount of pixel around the viewport that is still considered viewport
 * @returns True if the element is close to the viewport
 */
function isCloseToViewport(elem: HTMLElement, buffer?: number) {
    const rect = elem.getBoundingClientRect();
    if (buffer === undefined) {
        buffer = 50; // in px
    }
    const isNearViewport = rect.top >= -buffer && rect.bottom <= window.innerHeight + buffer;
    return isNearViewport;
}

class RatingHandler {
    public static section = document.getElementById('rating');
    private ratingStars: HTMLDivElement[] = [];
    private ratingContainer: HTMLDivElement = document.getElementsByClassName('rating-wrapper')[0] as HTMLDivElement;
    public observerIn?: IntersectionObserver;
    public observerOut?: IntersectionObserver;

    private constructor() {
        let stars = RatingHandler.section?.querySelectorAll(".rating-star");
        if (stars === undefined) { throw new Error("Stars???") };
        stars.forEach((star) => {
            this.ratingStars.push(star as HTMLDivElement);
        });
    };

    public static create(rootMargin: number) {
        let handler = new RatingHandler();
        handler.setupObserver('-' + rootMargin + 'px');
        return handler;
    }

    private setupObserver(rootMargin: string) {
        const observerOptionsIn: IntersectionObserverInit = {
            threshold: 1,
            rootMargin: rootMargin
        };

        this.observerIn = new IntersectionObserver(this.observerCallback, observerOptionsIn);
        if (this.observerIn === undefined) { return }
        this.observerIn.observe(this.ratingContainer);
    };

    private observerCallback: IntersectionObserverCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        
        if (entries[0].isIntersecting && this.ratingStars[0].classList.contains('hidden')) {
            this.showAllStars(110);
        } else if (!entries[0].isIntersecting && !this.ratingStars[0].classList.contains("hidden")) {
            this.ratingStars.forEach(star => {
                star.classList.add('hidden');
            })
        }
    };

    private showAllStars(delayMS: number) {
        for (let i = 0; i < this.ratingStars.length; i++) {
            const star = this.ratingStars[i];

            setTimeout(() => {
                star.classList.remove('hidden');
                this.observerOut?.observe(star);
            }, delayMS * i);
        }
    }
}

KundenStimmenHandler.setup("10px", .75);
RatingHandler.create(100);