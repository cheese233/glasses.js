import { Glasses } from "./glasses.js";
window.debug = false;
window.toggle = async () => {
    if (document.body.style.background == "black") {
        await new Glasses(
            {
                modelFile: "./银狼.pmx",
                reverse: true,
                debug: window.debug,
            },
            (e) => {
                document.body.style.background = "white";
            }
        ).start();
    } else {
        await new Glasses(
            {
                modelFile: "./银狼.pmx",
                debug: window.debug,
            },
            () => {
                document.body.style.background = "black";
            }
        ).start();
    }
    console.log("finished");
};
window.toggleDebug = (t) => {
    window.debug = t.checked;
};
document.body.innerHTML += `<a href='#' onclick='toggle()'>toggle</a> <div>
    <label for="debug">Debug</label><input type="checkbox" id="debug" name="debug" onchange='toggleDebug(this)' />
  </div>`;
