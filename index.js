import { Glasses } from "./glasses.js";
window.toggle = () => {
    if (document.body.style.background == "black") {
        new Glasses(
            {
                modelFile: "./银狼.pmx",
                reverse: true,
            },
            (e) => {
                document.body.style.background = "white";
            }
        ).start();
    } else {
        new Glasses(
            {
                modelFile: "./银狼.pmx",
            },
            () => {
                document.body.style.background = "black";
            }
        ).start();
    }
};
document.body.innerHTML += `<a href='#' onclick='toggle()'>toggle</a>`;
