import React from 'react';
import Vox from './Vox';
import Physics from './Physics';
import Type from './Type';

import World from './World';
import Phys from './Phys';
import Player from './Player';
import Proc from './Proc';
import Expo from 'expo';
import ExpoTHREE from 'expo-three';
import lfsr from './utils'
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
    isShiftDown = 0;
    isADown = 0;
    raycaster = 0;
    

    // Object arrays
    objects = [];
    world;
    phys;

    // Modes
    mode = "edit"; // play / edit

    // Should be in player later...
    player;
    keyboard = 0;
    box = 0;
    inputTime = 0;

    constructor(gl) {
        this.gl = gl;

        // Scene settings
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.aspect = this.screenWidth / this.screenHeight;

    }

    //==========================================================
    // initScene
    //==========================================================
    initScene = () => {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(20, this.aspect, this.near, this.far);
        this.scene.add(this.camera);
    }

    //==========================================================
    // init other stuff
    //==========================================================
    init = async () => {
        // this.clock = new THREE.Clock();
        // this.stats = new Stats();
        // this.stats = new Stats();
        // this.stats.domElement.style.position = 'absolute';
        // this.stats.domElement.style.bottom = '0px';
        // this.stats.domElement.style.zIndex = 100;
        // $('#container').append(this.stats.domElement);


        const objs = [
            require("../objects/player_stand.vox"),
            // require("../objects/player_jump.vox"),
            // require("../objects/player_run1.vox"),
            // require("../objects/player_run2.vox"),
            // require("../objects/player_fall.vox"),
            // require("../objects/player_stand_rocket.vox"),
            // require("../objects/player_jump_rocket.vox"),
            // require("../objects/player_run1_rocket.vox"),
            // require("../objects/player_run2_rocket.vox"),
            // require("../objects/player_shoot_rocket.vox"),
            // require("../objects/player_fall_rocket.vox"),
            // require("../objects/player_stand_shotgun.vox"),
            // require("../objects/player_jump_shotgun.vox"),
            // require("../objects/player_run1_shotgun.vox"),
            // require("../objects/player_run2_shotgun.vox"),
            // require("../objects/player_shoot_shotgun.vox"),
            // require("../objects/player_fall_shotgun.vox"),
            require("../maps/monu9_test2.vox"),
        ].map(filename => {
            const asset = Expo.Asset.fromModule(filename);
            return asset.downloadAsync();
        });
        await Promise.all(objs);

        this.initScene();

        const { innerWidth: width, innerHeight: height, devicePixelRatio: scale } = window;

        this.renderer = ExpoTHREE.createRenderer({ gl: this.gl, antialias: true });
        this.renderer.setPixelRatio(scale);
        this.renderer.setSize(width, height);
        // this.renderer.shadow.map.enabled = true;
        // this.renderer.shadow.map.type = THREE.PCFSoftShadowMap;
        // this.container = document.getElementById('container');
        // this.container.appendChild(this.renderer.domElement);

        this.scene.fog = new THREE.Fog(0x339ce2, 100, 3000);
        this.renderer.setClearColor(0x339ce2, 1);

        var ambientLight = new THREE.AmbientLight(0xEEB1C6);
        this.scene.add(ambientLight);


        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 500, 0);
        this.scene.add(hemiLight);

        var dirLight = new THREE.DirectionalLight(0x999999, 0.4);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(23, 23, 10);
        dirLight.position.multiplyScalar(10);
        this.scene.add(dirLight);

        //dirLight.castShadow = false;
        dirLight.castShadow = true;

        // dirLight.shadow.map.width = 512;
        // dirLight.shadow.map.height = 512; // 2048

        var d = 150;

        // dirLight.shadow.camera.left = -d;
        // dirLight.shadow.camera.right = d;
        // dirLight.shadow.camera.top = d;
        // dirLight.shadow.camera.bottom = -d;

        // dirLight.shadow.camera.far = 3500;
        // dirLight.shadow.bias = -0.0001;
        // dirLight.shadow.darkness = 0.45;

        // Voxel paint
        var rollOverGeo = new THREE.BoxGeometry(1, 1, 1);
        var rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
        this.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
        this.scene.add(this.rollOverMesh);

        this.phys;
        this.world = new World(this.scene, this.player, this.phys);
        console.log("World init...");

        this.phys = new Phys(this.scene, this.world, this.player);
        this.world.phys = this.phys;

        this.player = new Player(this.phys, this.camera, this.world);


        this.world.player = this.player;
        this.proc = new Proc(this.world);
        this.phys.player = this.player;


        // Load world
        const vox = new Vox(this.scene, this.world);

        const items = [
            {
                res: require("../objects/player_stand.vox"),
                name: "Player",
                type: Type.object,
                retVal: (t, chunk) => {
                    this.player.standChunk = chunk;
                    this.player.shootChunk = chunk;
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
                res: require("../maps/monu9_test2.vox"),
                name: "Map1",
                type: Type.map,
                retVal: (t, chunk) => {
                    this.player.init("test");
                }
            }
        ]


        items.map(async item => {
            const { vox: _vox, chunk } = await vox.loadModel(item.res, item.type);
            item.retVal(_vox, chunk);
        });

        this.world.init();
        this.phys.init();

        this.raycaster = new THREE.Raycaster();
        // this.controls = new THREE.OrbitControls(this.camera);
        // $('#editor').append("<br><span id='key1'>1: None</span> | <span id='key2'>2: Block</span> | <span id='key3'>3: Eraser</span> | <span id='key4'>4: Free draw </span> | <span id='key5'>5: Explode</span><br><br>");
    }

    onWindowResize = () => {

        const { innerWidth: width, innerHeight: height, devicePixelRatio: scale } = window;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(scale);
        this.renderer.setSize(width, height);
    }

    getDistance(v1, v2) {
        var dx = v1.x - v2.x;
        var dy = v1.y - v2.y;
        var dz = v1.z - v2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    render = () => {
        this.renderer.render(this.scene, this.camera);
    }

    animate = (delta) => {
        this.render();
        this.update(delta);
    }

    update = (delta) => {
        let time = Date.now() * 10;
        this.frameDelta += delta;
        while (this.frameDelta >= this.invMaxFps) {
            this.player.draw(time, this.invMaxFps);
            this.phys.draw(time, this.invMaxFps);
            this.frameDelta -= this.invMaxFps;
            this.world.draw(time, delta);

            // Test waterfall
            if ((this.world.blocks[98][67][83] >> 8) != 0) {
                if (Math.random() > 0.5) {
                    var block = this.phys.get();
                    if (block != undefined) {
                        block.gravity = 1;
                        var r = 15;
                        var g = 169;
                        var b = 189;
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
                    var block = this.phys.get();
                    if (block != undefined) {
                        block.gravity = 1;
                        var r = 15;
                        var g = 169;
                        var b = 189;
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
    }

    rand(min, max, n) {
        var r, n = n || 0;
        if (min < 0) r = min + Math.random() * (Math.abs(min) + max);
        else r = min + Math.random() * max;
        return r.toFixed(n) * 1;
    }
}