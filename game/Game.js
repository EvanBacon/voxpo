import React from 'react';
import Vox from './Vox';
import Physics from '../enums/Physics';
import Type from '../enums/Type';
import World from './World';
import Phys from './Phys';
import Player from './Player';
import Procedural from './Procedural';
import Expo from 'expo';
import ExpoTHREE from 'expo-three';
import lfsr from './utils'
import Models from '../Models';
import Maps from '../Maps';
import Settings from '../Settings';


export default class Game {

    scene;
    camera;
    renderer;

    controls;
    viewAngle = 10;

    near = 10;
    far = 3000;
    invMaxFps = 1 / 60;
    frameDelta = 0;


    // Procedurally generated stuff
    proc;
    rollOverMesh;

    // Object arrays
    objects = [];
    world;
    phys;

    // Should be in player later...
    player;

    constructor(gl) {
        this.gl = gl;

        // Scene settings
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.aspect = this.screenWidth / this.screenHeight;

    }

    setupScene = () => {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(20, this.aspect, this.near, this.far);
        this.scene.add(this.camera);
    }

    setupRenderer = () => {
        const { innerWidth: width, innerHeight: height, devicePixelRatio: scale } = window;

        this.renderer = ExpoTHREE.createRenderer({ gl: this.gl, antialias: Settings.antialias });
        this.renderer.setPixelRatio(scale);
        this.renderer.setSize(width, height);
        if (Settings.shadows) {
            this.renderer.gammaInput = true;
            this.renderer.gammaOutput = true;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }


        this.scene.fog = new THREE.Fog(Settings.fog, 100, 3000);
        this.renderer.setClearColor(Settings.fog, 1);

    }

    setupLights = () => {
        const ambientLight = new THREE.AmbientLight(0xEEB1C6);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 500, 0);
        this.scene.add(hemiLight);
        const d = 150;

        const dirLight = new THREE.DirectionalLight(0x999999, 0.4);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(23, 23, 10);
        dirLight.position.multiplyScalar(10);
        if (Settings.shadows) {
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 512;
            dirLight.shadow.mapSize.height = 512; // 2048
            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;

            dirLight.shadow.camera.far = 3500;
            dirLight.shadow.bias = -0.0001;
            dirLight.shadow.darkness = 0.45;
        }

        this.scene.add(dirLight);

    }

    setupRollover = () => {

        // Voxel paint
        const rollOverGeo = new THREE.BoxGeometry(1, 1, 1);
        const rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
        this.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
        this.scene.add(this.rollOverMesh);
    }

    init = async () => {
        this.setupScene();
        this.setupRenderer();
        this.setupLights();
        // this.setupRollover();

        this.world = new World(this.scene);

        this.phys = new Phys(this.scene, this.world);

        this.player = new Player(this.phys, this.camera, this.world);

        this.world.phys = this.phys;
        this.world.player = this.player;

        this.phys.player = this.player;

        // this.procedural = new Procedural(this.world);

        this.world.init();
        this.phys.init();

        await this.setupVox();

        // this.controls = new THREE.OrbitControls(this.camera);
    }

    setupVox = async () => {
        // Load world
        const vox = new Vox(this.scene, this.world);

        const items = [
            {
                res: Models.player_stand,
                name: "Player",
                type: Type.object,
                retVal: (t, chunk, player) => {
                    player.standChunk = chunk;
                    player.shootChunk = chunk;
                }
            },
            // {
            //     res: require("../objects/player_jump.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.jumpChunk = chunk
            // },
            // {
            //     res: require("../objects/player_run1.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run1Chunk = chunk
            // },
            // {
            //     res: require("../objects/player_run2.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run2Chunk = chunk
            // },
            // {
            //     res: require("../objects/player_fall.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.fallChunk = chunk                
            // },
            // {
            //     res: require("../objects/player_stand_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.standRocketChunk = chunk
            // },
            // {
            //     res: require("../objects/player_jump_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.jumpRocketChunk = chunk
            // },
            // {
            //     res: require("../objects/player_run1_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run1RocketChunk = chunk
            // },
            // {
            //     res: require("../objects/player_run2_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run2RocketChunk = chunk
            // },
            // {
            //     res: require("../objects/player_shoot_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.shootRocketChunk = chunk
            // },
            // {
            //     res: require("../objects/player_fall_rocket.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.fallRocketChunk = chunk

            // },
            // {
            //     res: require("../objects/player_stand_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.standShotgunChunk = chunk

            // },
            // {
            //     res: require("../objects/player_jump_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.jumpShotgunChunk = chunk

            // },
            // {
            //     res: require("../objects/player_run1_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run1ShotgunChunk = chunk

            // },
            // {
            //     res: require("../objects/player_run2_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.run2ShotgunChunk = chunk

            // },
            // {
            //     res: require("../objects/player_shoot_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.shootShotgunChunk = chunk

            // },
            // {
            //     res: require("../objects/player_fall_shotgun.vox"),
            //     name: "Player",
            //     type: Type.object,
            //     retVal: (t, chunk) => this.player.fallShotgunChunk = chunk
            // },
            {
                res: Maps['monu10'],
                name: "Map1",
                type: Type.map,
                retVal: (t, chunk, player) => {
                    player.init("test");
                }
            }
        ]

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                const { vox: _vox, chunk } = await vox.loadModel(item.res, item.type);
                item.retVal(_vox, chunk, this.player);
            } catch (error) {
                console.warn("Model Failed To Load")
                console.warn({ error });
            }
        }
    }

    onWindowResize = () => {
        const { innerWidth: width, innerHeight: height, devicePixelRatio: scale } = window;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(scale);
        this.renderer.setSize(width, height);
    }

    render = () => this.renderer.render(this.scene, this.camera);

    animate = (delta) => {
        this.render();
        this.update(delta);
    }

    renderWaterfall = (delta) => {
        // Test waterfall
        if ((this.world.blocks[98][67][83] >> 8) != 0) {
            if (Math.random() > 0.5) {
                var block = this.phys.get();
                if (block != undefined) {
                    block.gravity = 1;
                    let r = 15;
                    let g = 169;
                    let b = 189;
                    if (lfsr.rand() > 0.5) {
                        r = 36;
                        g = 152;
                        b = 229;
                    }
                    block.create(86 + lfsr.rand() * 5,
                        65,
                        92,
                        r,
                        g,
                        b,
                        -1, 10, Physics.smoke, 1);
                }
            }
            // Test fountain
            if (Math.random() > 0.7) {
                const block = this.phys.get();
                if (block != undefined) {
                    block.gravity = 1;
                    let r = 15;
                    let g = 169;
                    let b = 189;
                    if (lfsr.rand() > 0.5) {
                        r = 255;
                        g = 255;
                        b = 255;
                    }
                    block.create(85 + lfsr.rand() * 7,
                        36,
                        90 + lfsr.rand() * 5,
                        r,
                        g,
                        b,
                        0.5, 5, Physics.smoke, 1);
                }
            }
        }
    }
    renderElements = (delta, time) => {
        this.player.draw(time, this.invMaxFps);
        this.phys.draw(time, this.invMaxFps);
        this.frameDelta -= this.invMaxFps;
        this.world.draw(time, delta);

        // this.renderWaterfall(delta);
    }

    update = (delta) => {
        let time = Date.now() * 10;
        this.frameDelta += delta;
        while (this.frameDelta >= this.invMaxFps) {
            this.renderElements(delta, time)
        }
    }

    rand(min, max, n) {
        var r, n = n || 0;
        if (min < 0) r = min + Math.random() * (Math.abs(min) + max);
        else r = min + Math.random() * max;
        return r.toFixed(n) * 1;
    }
}