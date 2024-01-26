import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { MMDLoader } from "three/addons/loaders/MMDLoader.js";
import { MMDAnimationHelper } from "three/addons/animation/MMDAnimationHelper.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as AmmoJS from "./Libs/ammo.js/ammo.wasm.js";
let stats;
let mesh,
    camera,
    scene,
    renderer,
    smaaPass,
    composer,
    container,
    outlinePass,
    controls,
    animation,
    animationAction,
    animateID,
    vmdFile;
let helper, ikHelper, physicsHelper, clock;
let config = {};
let Ammo, gui;
export class Glasses {
    constructor(configs = {}, callback) {
        config = configs;
        if (config.vmdFile) {
            vmdFile = config.vmdFile;
        } else {
            if (config.reverse) {
                vmdFile = "./motion_reverse.vmd";
            } else {
                vmdFile = "./motion.vmd";
            }
        }

        this._callback = callback;
    }
    async start() {
        let destroy = this._destroy,
            callback = this._callback;
        await new Promise((resolve1) =>
            AmmoJS().then(async function (AmmoLib) {
                Ammo = AmmoLib;

                await init();
                clock = new THREE.Clock(false);

                await new Promise((resolve) =>
                    requestAnimationFrame(() => {
                        animate();
                        clock.start();
                        let helperMesh = helper.objects.get(mesh);
                        animationAction =
                            helperMesh.mixer.existingAction(animation);
                        animationAction.setLoop(THREE.LoopOnce);

                        helperMesh.mixer.addEventListener(
                            "finished",
                            async function (e) {
                                await callback();
                                destroy();
                            }
                        );
                        resolve();
                    })
                );
                resolve1();
            })
        );
    }
    _destroy() {
        cancelAnimationFrame(animateID);
        scene.clear();
        scene = new THREE.Scene();
        renderer.dispose();
        window.removeEventListener("resize", onWindowResize);
        container.outerHTML = "";
        if (gui) gui.domElement.outerHTML = "";
    }
    static get available() {
        return checkAvailable();
    }
}
function checkAvailable() {
    return WebGL.isWebGLAvailable();
}
async function init() {
    if (!checkAvailable()) {
        throw new Error();
    }
    container = document.createElement("div");
    container.style.cssText =
        "position:fixed;top:0;bottom:0;left:0;right:0;z-index:10000;";
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(
        35,
        container.offsetWidth / container.offsetHeight,
        1,
        3000
    );

    // scene

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff);
    scene.background = false;
    // const gridHelper = new THREE.PolarGridHelper(30, 0);
    // gridHelper.position.y = -10;
    // scene.add(gridHelper);

    // const ambient = new THREE.AmbientLight(0xaaaaaa, 3);
    // scene.add(ambient);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    //SMAA
    const outputPass = new OutputPass();
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    const pixelRatio = renderer.getPixelRatio();

    smaaPass = new SMAAPass(
        container.offsetWidth * pixelRatio,
        container.offsetHeight * pixelRatio
    );
    //Outline
    outlinePass = new OutlinePass(
        new THREE.Vector2(
            container.offsetWidth * pixelRatio,
            container.offsetHeight * pixelRatio
        ),
        scene,
        camera
    );
    outlinePass.visibleEdgeColor.set(0x000000);
    outlinePass.edgeThickness = 0.01;
    outlinePass.edgeStrength = 2;
    //passes

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(outputPass);
    composer.addPass(outlinePass);
    composer.addPass(smaaPass);

    // STATS
    if (config.debug) {
        stats = new Stats();
        container.appendChild(stats.dom);
    } else {
        stats = { begin: () => { }, end: () => { } };
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    if (config.debug) {
        const axesHelper = new THREE.AxesHelper(150);
        scene.add(axesHelper);
    }

    // model

    function onProgress(xhr) {
        if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log(Math.round(percentComplete, 2) + "% downloaded");
        }
    }

    const modelFile = config.modelFile;
    const vmdFiles = [vmdFile];

    helper = new MMDAnimationHelper({
        afterglow: 2.0,
    });
    // helper.enable("animation", false);
    const loader = new MMDLoader();
    const setPosition = () => {
        let l = -0.55,
            h = 7.68,
            f = 0.5;
        camera.position.set(l, h, f);
        camera.lookAt(l, h, 10);
    };

    window.addEventListener("resize", onWindowResize);
    function initGui() {
        const api = {
            animation: true,
            ik: true,
            physics: true,
            "show IK bones": false,
            "show rigid bodies": false,
            SMAA: true,
            outline: true,
            "free camera": false,
        };

        gui = new GUI();
        gui.add(api, "animation").onChange(function () {
            helper.enable("animation", api["animation"]);
        });

        gui.add(api, "ik").onChange(function () {
            helper.enable("ik", api["ik"]);
        });
        gui.add(api, "physics").onChange(function () {
            helper.enable("physics", api["physics"]);
        });

        gui.add(api, "show IK bones").onChange(function () {
            ikHelper.visible = api["show IK bones"];
        });

        gui.add(api, "show rigid bodies").onChange(function () {
            if (physicsHelper !== undefined)
                physicsHelper.visible = api["show rigid bodies"];
        });
        gui.add(api, "SMAA").onChange(function () {
            smaaPass.enabled = api["SMAA"];
        });
        gui.add(api, "outline").onChange(function () {
            outlinePass.enabled = api["outline"];
        });
        gui.add(api, "free camera").onChange(function () {
            controls.enabled = api["free camera"];
            if (!api["free camera"]) {
                setPosition();
            }
        });
    }
    await new Promise((resolve, reject) => {
        loader.loadWithAnimation(
            modelFile,
            vmdFiles,
            function (mmd) {
                mesh = mmd.mesh;
                animation = mmd.animation;
                mesh.position.y = -10;
                scene.add(mesh);
                helper.add(mesh, {
                    animation: mmd.animation,
                    physics: true,
                    animationWarmup: true,
                });

                ikHelper = helper.objects.get(mesh).ikSolver.createHelper();
                ikHelper.visible = false;
                scene.add(ikHelper);

                physicsHelper = helper.objects.get(mesh).physics.createHelper();
                physicsHelper.visible = false;
                scene.add(physicsHelper);
                outlinePass.selectedObjects = [mesh];
                if (config.debug) {
                    initGui();
                }
                setPosition();
                resolve();
            },
            onProgress,
            () => reject()
        );
    });
}

function onWindowResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();

    const pixelRatio = renderer.getPixelRatio();
    smaaPass.setSize(
        container.offsetWidth * pixelRatio,
        container.offsetHeight * pixelRatio
    );
    outlinePass.setSize(
        container.offsetWidth * pixelRatio,
        container.offsetHeight * pixelRatio
    );
    composer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}
function animate() {
    animateID = requestAnimationFrame(animate);

    stats.begin();
    render();
    stats.end();
}
function render() {
    helper.update(clock.getDelta());
    composer.render();
}
globalThis.Glasses = Glasses;
