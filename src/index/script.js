"use strict";
class KundenStimmenHandler {
    static setup(margin, threshold) {
        if (margin === undefined) {
            margin = "0px";
        }
        if (threshold === undefined) {
            threshold = 0.5;
        }
        const observerOptions = {
            root: null,
            rootMargin: margin,
            threshold: threshold
        };
        KundenStimmenHandler.observer = new IntersectionObserver(KundenStimmenHandler.intersectionCallback, observerOptions);
        this.kundenstimmen.forEach(elem => {
            KundenStimmenHandler.observer.observe(elem);
        });
    }
    ;
}
KundenStimmenHandler.kundenstimmen = document.querySelectorAll('#kundenstimmen .kundenstimme');
KundenStimmenHandler.intersectionCallback = (entries, observer) => {
    entries.forEach(entry => {
        let intersecting = entry.isIntersecting;
        entry.target.classList.toggle('visible', intersecting);
    });
};
/**
 * Function checks if an element is close to the viewport (only vertical)
 * @param elem The element
 * @param buffer The +- amount of pixel around the viewport that is still considered viewport
 * @returns True if the element is close to the viewport
 */
function isCloseToViewport(elem, buffer) {
    const rect = elem.getBoundingClientRect();
    if (buffer === undefined) {
        buffer = 50; // in px
    }
    const isNearViewport = rect.top >= -buffer && rect.bottom <= window.innerHeight + buffer;
    return isNearViewport;
}
class RatingHandler {
    constructor() {
        var _a;
        this.ratingStars = [];
        this.ratingContainer = document.getElementsByClassName('rating-wrapper')[0];
        this.observerCallback = (entries, observer) => {
            if (entries[0].isIntersecting && this.ratingStars[0].classList.contains('hidden')) {
                this.showAllStars(110);
            }
            else if (!entries[0].isIntersecting && !this.ratingStars[0].classList.contains("hidden")) {
                this.ratingStars.forEach(star => {
                    star.classList.add('hidden');
                });
            }
        };
        let stars = (_a = RatingHandler.section) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".rating-star");
        if (stars === undefined) {
            throw new Error("Stars???");
        }
        ;
        stars.forEach((star) => {
            this.ratingStars.push(star);
        });
    }
    ;
    static create(rootMargin) {
        let handler = new RatingHandler();
        handler.setupObserver('-' + rootMargin + 'px');
        return handler;
    }
    setupObserver(rootMargin) {
        const observerOptionsIn = {
            threshold: 1,
            rootMargin: rootMargin
        };
        this.observerIn = new IntersectionObserver(this.observerCallback, observerOptionsIn);
        if (this.observerIn === undefined) {
            return;
        }
        this.observerIn.observe(this.ratingContainer);
    }
    ;
    showAllStars(delayMS) {
        for (let i = 0; i < this.ratingStars.length; i++) {
            const star = this.ratingStars[i];
            setTimeout(() => {
                var _a;
                star.classList.remove('hidden');
                (_a = this.observerOut) === null || _a === void 0 ? void 0 : _a.observe(star);
            }, delayMS * i);
        }
    }
}
RatingHandler.section = document.getElementById('rating');
KundenStimmenHandler.setup("10px", .75);
RatingHandler.create(100);
