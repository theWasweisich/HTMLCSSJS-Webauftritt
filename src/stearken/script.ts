

class Hoverer {
    isHovering: boolean = false

    lastMoved: number = 0;
    
    static originalMove = [
        "50px 0px",
        "0px 0px",
        "-50px 0px",
        "-200px 50px",
    ]

    static originalRotate = [
        "-5deg",
        "-.5deg",
        "4deg",
        "10deg"
    ]
    
    static move = [
        "-15px 5px",
        "0px 20px",
        "15px -10px",
        "-150px 100px"
    ]
    static rotate = [
        "-10deg",
        "5deg",
        "10deg",
        "5deg"
    ]

    constructor (
        public cardwrapper: HTMLElement,
        public cards: NodeListOf<HTMLElement>
    ) { this.setEventListener(); }

    setEventListener() {
        
        this.cardwrapper.addEventListener('mouseenter', () => {
            onmouseenter();
        })
        this.cardwrapper.addEventListener('focusin', () => {
            onmouseenter();
        })
        this.cardwrapper.addEventListener('mouseleave', () => {
            onmouseleave()
        });
        this.cardwrapper.addEventListener('focusout', () => {
            onmouseleave();
        })

        this.cardwrapper.addEventListener('animationstart', () => {
            this.cardwrapper.classList.add("animating")
        });
        this.cardwrapper.addEventListener('animationend', () => {
            this.cardwrapper.classList.remove("animating");
        })

        const onmouseenter = () => {
            if (this.isHovering) { return; }
            this.lastMoved = Date.now();
            this.isHovering = true;
            this.setHover(this.isHovering);
        }
    
        const onmouseleave = () => {
    
            if (!this.isHovering) { return; }
            this.lastMoved = Date.now();
            this.isHovering = false;
            this.setHover(this.isHovering);
        }
    }


    setHover(): void;
    setHover(hovering: boolean): void;
    setHover(hovering?: boolean): void {
        if (hovering === undefined) {
            hovering = true
        }
        let computedStyle = window.getComputedStyle(this.cardwrapper);
        if (computedStyle.display != "flex") {
            // console.error("No hover animation!")
            return;
        }
        for (let index = 0; index < this.cards.length; index++) {
            const card = this.cards[index];
            if (hovering) {
                card.style.translate = Hoverer.move[index];
                card.style.rotate = Hoverer.rotate[index];
            } else {
                card.style.translate = Hoverer.originalMove[index];
                card.style.rotate = Hoverer.originalRotate[index];
            }
        }
    }
}

(() => {
    let cardwrapper = document.getElementsByClassName("strength-cards")[0] as HTMLDivElement
        
    let cards = cardwrapper.querySelectorAll(".card") as NodeListOf<HTMLElement>;

    let hoverer = new Hoverer(cardwrapper, cards);
})()