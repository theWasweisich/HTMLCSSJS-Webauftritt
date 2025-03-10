"use strict";
class Hoverer {
    static setEventListener() {
        Hoverer.cardwrapper = document.getElementsByClassName("strength-cards")[0];
        Hoverer.cards = Hoverer.cardwrapper.querySelectorAll(".card");
        Hoverer.cardwrapper.addEventListener('mouseenter', () => {
            onmouseenter();
        });
        Hoverer.cardwrapper.addEventListener('focusin', () => {
            onmouseenter();
        });
        Hoverer.cardwrapper.addEventListener('mouseleave', () => {
            onmouseleave();
        });
        Hoverer.cardwrapper.addEventListener('focusout', () => {
            onmouseleave();
        });
        Hoverer.cardwrapper.addEventListener('animationstart', () => {
            Hoverer.cardwrapper.classList.add("animating");
        });
        Hoverer.cardwrapper.addEventListener('animationend', () => {
            Hoverer.cardwrapper.classList.remove("animating");
        });
        function onmouseenter() {
            if (Hoverer.isHovering) {
                return;
            }
            Hoverer.lastMoved = Date.now();
            Hoverer.isHovering = true;
            Hoverer.setHover(Hoverer.isHovering);
        }
        function onmouseleave() {
            if (!Hoverer.isHovering) {
                return;
            }
            Hoverer.lastMoved = Date.now();
            Hoverer.isHovering = false;
            Hoverer.setHover(Hoverer.isHovering);
        }
    }
    static setHover(hovering) {
        if (hovering === undefined) {
            hovering = true;
        }
        let computedStyle = window.getComputedStyle(Hoverer.cardwrapper);
        if (computedStyle.display != "flex") {
            // console.error("No hover animation!")
            return;
        }
        for (let index = 0; index < Hoverer.cards.length; index++) {
            const card = Hoverer.cards[index];
            if (hovering) {
                card.animate([
                    {
                        "translate": Hoverer.originalMove[index],
                        "rotate": Hoverer.originalRotate[index]
                    },
                    {
                        "translate": Hoverer.move[index],
                        "rotate": Hoverer.rotate[index]
                    }
                ], {
                    duration: 200,
                    fill: "forwards"
                });
            }
            else {
                card.animate([
                    {
                        "translate": Hoverer.move[index],
                        "rotate": Hoverer.rotate[index]
                    },
                    {
                        "translate": Hoverer.originalMove[index],
                        "rotate": Hoverer.originalRotate[index]
                    }
                ], {
                    duration: 200,
                    fill: "forwards"
                });
            }
        }
    }
}
Hoverer.isHovering = false;
Hoverer.lastMoved = 0;
Hoverer.originalMove = [
    "50px 0px",
    "0px 0px",
    "-50px 0px",
    "-200px 50px",
];
Hoverer.originalRotate = [
    "-5deg",
    "-.5deg",
    "4deg",
    "10deg"
];
Hoverer.move = [
    "-15px 5px",
    "0px 20px",
    "15px -10px",
    "-150px 100px"
];
Hoverer.rotate = [
    "-10deg",
    "5deg",
    "10deg",
    "5deg"
];
Hoverer.setEventListener();
