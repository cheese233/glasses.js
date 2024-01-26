import { Glasses } from "./glasses.js";
window.toggle = async () => {
    if (document.body.style.background == "black") {
        await new Glasses(
            {
                modelFile: "./银狼.pmx",
                reverse: true,
            },
            (e) => {
                document.body.style.background = "white";
            }
        ).start();
    } else {
        await new Glasses(
            {
                modelFile: "./银狼.pmx",
            },
            () => {
                document.body.style.background = "black";
            }
        ).start();
    }
    console.log("finished");
};
document.body.innerHTML += `<a href='#' onclick='toggle()'>toggle</a>`;
