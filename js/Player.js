import React from 'react';
import Weapon from './Weapon';
import Model from './Model';
import Direction from './Direction';
import Physics from './Physics';
import lfsr from './utils'
import Settings from './Settings'

export default class Player {
    controls = {};
    name = "Charles Cheevler";
    hp = 0;
    weapon = Weapon.rocket;

    rotateAngle = 0;
    moveDistance = 0;
    // TBD: Make array of these with constants for lookup
    run1Chunk;
    run2Chunk;
    run1RocketChunk;
    run2RocketChunk;
    run1ShotgunChunk;
    run2ShotgunChunk;
    jumpChunk;
    jumpRocketChunk;
    jumpShotgunChunk;
    standChunk;
    standRocketChunk;
    standShotgunChunk;
    fallChunk;
    fallRocketChunk;
    fallShotgunChunk;
    shootChunk;
    shootRocketChunk;
    shootShotgunChunk;

    mesh;
    chunk;
    currentModel = Model.stand;
    runTime = 0;
    jumpTime = 0;
    cameraAttached = false;
    // camera = new THREE.Object3D();
    mass = 4;
    area = 1;
    vy = 1;
    avg_ay = 1;
    gravity = 9.82;
    airDensity = 1.2;
    jumping = false;
    sampleObjectsTime = 0;
    shooting = false;

    // Camera
    attachedCamera = false;
    cameraObj;

    // CD props
    canWalkLeft = true;
    canWalkRight = true;
    canWalkForward = true;
    canWalkBackward = true;
    canJump = true;
    canFall = true;


    constructor(phys, camera, world) {
        this.world = world;
        this.phys = phys;
        this.camera = camera;
    }

    init = (name) => {
        this.addTouchListeners();
        this.name = name;
        this.hp = Settings.max_hp;

        let chunks = [
            // this.run1Chunk,
            // this.run2Chunk,
            // this.run1RocketChunk,
            // this.run2RocketChunk,
            // this.run1ShotgunChunk,
            // this.run2ShotgunChunk,
            // this.jumpChunk,
            // this.jumpRocketChunk,
            // this.jumpShotgunChunk,
            this.standChunk,
            // this.standRocketChunk,
            // this.standShotgunChunk,
            // this.fallChunk,
            // this.fallRocketChunk,
            // this.fallShotgunChunk,
            // this.shootChunk,
            // this.shootRocketChunk,
            // this.shootShotgunChunk
        ];
        if (chunks) {
            for (let i = 0; i < chunks.length; i++) {
                let mesh = chunks[i].mesh;
                mesh.position.set(0, 0, 0);
                mesh.rotation.set(0, 0, 0);
                mesh.geometry.center();
                mesh.geometry.verticesNeedUpdate = true;
            }
        }
        
        this.switchModel(Model.stand);
        this.mesh.position.set(153, 21, 55);

        this.cameraObj = new THREE.Object3D();
        this.cameraObj.add(this.camera);

        this.attachedCamera = true;
        this.camera.position.set(0, 400, 0);
        this.camera.lookAt(this.cameraObj);
        this.camera.rotation.set(-1.57, 0, 0),
        this.camera.quaternion.set(-0.7, 0, 0, 0.7);
        this.cameraObj.rotation.set(Math.PI / 1.5, 0, -Math.PI);
        this.weapon = Weapon.shotgun;
    }

    switchModel = (model) => {
        if (this.shooting) {
            return;
        }
        if (this.currentModel == model && this.mesh != undefined) {
            return;
        }

        let pos, rot;
        if (this.mesh != undefined) {
            this.mesh.remove(this.cameraObj);
            this.mesh.visible = false;
            pos = this.mesh.position;
            rot = this.mesh.rotation;
        } else {
            pos = new THREE.Vector3(0, 0, 0);
            rot = new THREE.Vector3(0, 0, 0);
        }

        // switch (model) {
        //     case Model.jump:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.jumpShotgunChunk.mesh;
        //                 // this.chunk = this.jumpShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.jumpRocketChunk.mesh;
        //                 // this.chunk = this.jumpRocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 // this.mesh = this.jumpChunk.mesh;
        //                 // this.chunk = this.jumpChunk;
        //                 break;
        //         }
        //         break;
        //     case Model.stand:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.standShotgunChunk.mesh;
        //                 // this.chunk = this.standShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.standRocketChunk.mesh;
        //                 // this.chunk = this.standRocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 this.mesh = this.standChunk.mesh;
        //                 this.chunk = this.standChunk;
        //                 break;
        //         }
        //         break;
        //     case Model.run1:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.run1ShotgunChunk.mesh;
        //                 // this.chunk = this.run1ShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.run1RocketChunk.mesh;
        //                 // this.chunk = this.run1RocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 // this.mesh = this.run1Chunk.mesh;
        //                 // this.chunk = this.run1Chunk;
        //                 break;
        //         }
        //         break;
        //     case Model.run2:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.run2ShotgunChunk.mesh;
        //                 // this.chunk = this.run2ShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.run2RocketChunk.mesh;
        //                 // this.chunk = this.run2RocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 // this.mesh = this.run2Chunk.mesh;
        //                 // this.chunk = this.run2Chunk;
        //                 break;
        //         }
        //         break;
        //     case Model.shoot:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.shootShotgunChunk.mesh;
        //                 // this.chunk = this.shootShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.shootRocketChunk.mesh;
        //                 // this.chunk = this.shootRocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 // this.mesh = this.shootChunk.mesh;
        //                 // this.chunk = this.shootChunk;
        //                 break;
        //         }
        //         break;
        //     case Model.fall:
        //         switch (this.weapon) {
        //             case Weapon.shotgun:
        //                 // this.mesh = this.fallShotgunChunk.mesh;
        //                 // this.chunk = this.fallShotgunChunk;
        //                 break;
        //             case Weapon.rocket:
        //                 // this.mesh = this.fallRocketChunk.mesh;
        //                 // this.chunk = this.fallRocketChunk;
        //                 break;
        //             case Weapon.none:
        //                 // this.mesh = this.fallChunk.mesh;
        //                 // this.chunk = this.fallChunk;
        //                 break;
        //         }
        //         break;
        //     default:
        //         this.mesh = this.standChunk.mesh;
        //         this.chunk = this.standChunk;
        // }
        this.mesh = this.standChunk.mesh;
        this.chunk = this.standChunk;
        this.mesh.position.set(pos.x, pos.y, pos.z);
        this.mesh.rotation.set(rot.x, rot.y, rot.z);
        this.currentModel = model;
        this.mesh.updateMatrixWorld();
        this.mesh.add(this.cameraObj);
        this.mesh.visible = true;
    }

    addTouchListeners = () => {
        window.document.addEventListener('touchstart',this.touchStart);
        window.document.addEventListener('touchmove',this.touchMove);
        window.document.addEventListener('touchend',this.touchEnd);
    }

    touchStart = (event) => {
        if (this.dead) {
            return;
        }
    }

    touchMove = (event) => {
        // let event = jevent.originalEvent;
        let movementX = event.dx;
        let movementZ = event.dy;
        let x = movementX * 0.1;
        let z = movementZ * 0.1;

        if (this.mesh != undefined) {
            let axis = new THREE.Vector3(0, 1, 0);
            let rotObjectMatrix = new THREE.Matrix4();
            rotObjectMatrix.makeRotationAxis(axis.normalize(), -(Math.PI / 2) * x);
            this.mesh.matrix.multiply(rotObjectMatrix);
            this.mesh.rotation.setFromRotationMatrix(this.mesh.matrix);
        }
    }

    touchEnd = (event) => {
        if (this.dead) {
            return;
        }
    }

    createGrenade = () => {
        let block = this.phys.get();

        let pos = new THREE.Vector3(3, 2, 5);
        let gpos = pos.applyMatrix4(this.mesh.matrix);

        if (block != undefined) {
            block.create(gpos.x,
                gpos.y,
                gpos.z,
                0, // R 
                66, // G
                0, // B
                5, // force 
                4, // life,
                Physics.grenade,
                1000, // bounces
                0.1 // mass
            );
            block.mesh.scale.set(1.5, 1.5, 1.5);
        }
    }

    createShot = () => {

        let pos1 = new THREE.Vector3(3, 0, 3);
        let gpos1 = pos1.applyMatrix4(this.mesh.matrix);

        let pos2 = new THREE.Vector3(-3, 0, 3);
        let gpos2 = pos2.applyMatrix4(this.mesh.matrix);

        for (let i = 0; i < 10; i++) {
            let smoke = this.phys.get();
            let color = 150 + lfsr.rand() * 105 | 0;
            if (smoke != undefined) {
                smoke.gravity = -1;
                smoke.create(gpos1.x,
                    gpos1.y + 1,
                    gpos1.z,
                    color,
                    color,
                    color,
                    lfsr.rand() * 1, 1, Physics.smoke);

            }
            let smoke2 = this.phys.get();
            color = 150 + lfsr.rand() * 105 | 0;
            if (smoke2 != undefined) {
                smoke2.gravity = -1;
                smoke2.create(gpos2.x,
                    gpos2.y + 1,
                    gpos2.z,
                    color,
                    color,
                    color,
                    lfsr.rand() * 1, 1, Physics.smoke);

            }
        }
        for (let i = 0; i < 10; i++) {
            let block2 = this.phys.get();
            if (block2 != undefined) {
                block2.create(gpos1.x + (2 - lfsr.rand() * 4),
                    gpos1.y + (2 - lfsr.rand() * 4),
                    gpos1.z + (2 - lfsr.rand() * 4),
                    0, // R 
                    0, // G
                    0, // B
                    20, // force 
                    0.5, // life,
                    Physics.shot,
                    1 // bounces
                );
                block2.mesh.scale.set(0.5, 0.5, 0.5);
            }
            let block = this.phys.get();
            if (block != undefined) {
                block.create(gpos2.x + (2 - lfsr.rand() * 4),
                    gpos2.y + (2 - lfsr.rand() * 4),
                    gpos2.z + (2 - lfsr.rand() * 4),
                    0, // R 
                    0, // G
                    0, // B
                    20, // force 
                    0.5, // life,
                    Physics.shot,
                    1 // bounces
                );
                block.mesh.scale.set(0.5, 0.5, 0.5);
            }
        }
    }

    createMissile = () => {
        let block = this.phys.get();

        let pos = new THREE.Vector3(3, 2, 5);
        let gpos = pos.applyMatrix4(this.mesh.matrix);

        if (block != undefined) {
            for (let i = 0; i < 20; i++) {
                let smoke = this.phys.get();
                let color = 150 + lfsr.rand() * 105 | 0;
                if (smoke != undefined) {
                    smoke.gravity = -1;
                    smoke.create(gpos.x,
                        gpos.y + 1,
                        gpos.z,
                        color,
                        color,
                        color,
                        lfsr.rand() * 1, 1, Physics.smoke);

                }
            }
            block.create(gpos.x,
                gpos.y,
                gpos.z,
                0xff, // R 
                0x8c, // G
                0, // B
                20, // force 
                1, // life,
                Physics.missile,
                1 // bounces
            );
        }
    }

    // TBD: Might only have one weapon?
    changeWeapon = (weapon_id) => {
        this.weapon = weapon_id;
    }

    canMove = (type) => {
        //this.mesh.updateMatrixWorld();
        for (let i = 0; i < this.chunk.blockList.length; i += 2) {
            let b = this.chunk.blockList[i];

            if (type == Direction.forward && b.z < 11) {
                continue;
            } else if (type == Direction.backward && b.z > 7) {
                continue;
            } else if (type == Direction.left && b.x < 10) {
                continue;
            } else if (type == Direction.right && b.x > 5) {
                continue;
            } else if (type == Direction.up && (b.x < 6 || b.x > 7 || b.z > 9)) {
                continue;
            } else if (type == Direction.down && b.y - 3 > 2) {
                continue;
            }
            let lvector = new THREE.Vector3(b.x - 7, b.y - 10, b.z - 10);
            let vector = lvector.applyMatrix4(this.mesh.matrix);
            let xi = vector.x | 0;
            let yi = vector.y | 0;
            let zi = vector.z | 0;
            xi += 7;
            zi += 10;

            // Keep head down
            if (type == Direction.up) {
                yi += 2;
            }

            if (this.world.isWithinWorld(xi, yi, zi)) {
                if ((this.world.blocks[xi][yi][zi] >> 8) != 0) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    keyDown = () => {
        if (this.controls.rocket) {
            this.weapon = Weapon.rocket;
        }
        if (this.controls.shotgun) {
            this.weapon = Weapon.shotgun;
        }
        if (this.controls.none) {
            this.weapon = Weapon.none;
        }
        if (this.controls.die) {
            this.die();
        }
        if (this.controls.fire) {
            this.switchModel(Model.shoot);
            this.shooting = true;
        }

        // if (this.keyboard.pressed("n")) {
        //     this.mesh.position.x += 5;
        // }
        // if (this.keyboard.pressed("m")) {
        //     this.mesh.position.x -= 5;
        // }
        // if (this.keyboard.pressed("p")) {
        //     console.log(this.mesh.position);
        // }

        if (this.controls.forward && this.canWalkForward) {
            this.mesh.translateZ(this.moveDistance);

            if (!this.canMove(Direction.forward)) {
                this.mesh.translateZ(-this.moveDistance);
            }

            this.run();
        }
        if (this.controls.backward && this.canWalkBackward) {
            this.mesh.translateZ(-this.moveDistance);

            if (!this.canMove(Direction.backward)) {
                this.mesh.translateZ(this.moveDistance);
            }
            this.run();
        }
        if (this.controls.left && this.canWalkLeft) {
            this.mesh.translateX(this.moveDistance);

            if (!this.canMove(Direction.left)) {
                this.mesh.translateX(-this.moveDistance);
            }
            this.run();
        }
        if (this.controls.right && this.canWalkRight) {
            this.mesh.translateX(-this.moveDistance);

            if (!this.canMove(Direction.right)) {
                this.mesh.translateX(this.moveDistance);
            }
            this.run();
        }
        if (this.controls.up) {
            this.jumpTime = 0;
            this.mesh.translateY(this.moveDistance);
            let x = Math.round(this.mesh.position.x + 6);
            let y = Math.round(this.mesh.position.y + 3);
            let z = Math.round(this.mesh.position.z + 6);
            if (!this.canMove(Direction.up)) {
                this.mesh.translateY(-this.moveDistance);
            }
            this.switchModel(Model.jump);
            this.jumping = true;
            this.canFall = true;
            let pos1 = new THREE.Vector3(-1, -3, -3);
            let gpos1 = pos1.applyMatrix4(this.mesh.matrix);
            let pos2 = new THREE.Vector3(1, -3, -3);
            let gpos2 = pos2.applyMatrix4(this.mesh.matrix);
            for (let i = 0; i < 5; i++) {
                let smoke1 = this.phys.get();
                let smoke2 = this.phys.get();
                if (smoke1 != undefined) {
                    smoke1.gravity = -1;
                    smoke1.create(gpos1.x,
                        gpos1.y + 1,
                        gpos1.z,
                        255,
                        255,
                        255,
                        -lfsr.rand() * 10, 0.2, Physics.smoke);
                }
                if (smoke2 != undefined) {
                    smoke2.gravity = -1;
                    smoke2.create(gpos2.x,
                        gpos2.y + 1,
                        gpos2.z,
                        255,
                        255,
                        255,
                        -lfsr.rand() * 10, 0.2, Physics.smoke);
                }
            }
        }
    }
    keyUp = () => {
        if (this.controls.jump) {
            this.jumping = false;
        }
        if (this.controls.fire) {
            switch (this.weapon) {
                case Weapon.rocket:
                    this.createMissile();
                    break;
                case Weapon.shotgun:
                    this.createShot();
                    break;
            }
            this.shooting = false;
        }
        if (this.controls.explosive) {
            this.createGrenade();
        }
    }

    run = () => {
        if (this.runTime > 0.2) {
            if (this.currentModel == Model.run2) {
                this.switchModel(Model.run1);
            } else {
                this.switchModel(Model.run2);
            }
            this.runTime = 0;
        }
    }

    draw = (time, delta) => {
        if (this.mesh == undefined) {
            return;
        }
        this.keyDown();
        this.keyUp();

        // Smoke when falling
        if (this.currentModel == Model.fall) {
            if (lfsr.rand() > 0.8) {
                let pos1 = new THREE.Vector3(-1, -2, -4);
                let gpos1 = pos1.applyMatrix4(this.mesh.matrix);
                let smoke1 = this.phys.get();
                if (smoke1 != undefined) {
                    smoke1.gravity = -1;
                    smoke1.create(gpos1.x,
                        gpos1.y + 1,
                        gpos1.z,
                        255,
                        255,
                        255,
                        -lfsr.rand() * 10, 0.2, Physics.smoke);
                }
            }

            if (lfsr.rand() > 0.8) {
                let smoke2 = this.phys.get();
                let pos2 = new THREE.Vector3(1, -2, -4);
                let gpos2 = pos2.applyMatrix4(this.mesh.matrix);
                if (smoke2 != undefined) {
                    smoke2.gravity = -1;
                    smoke2.create(gpos2.x,
                        gpos2.y + 1,
                        gpos2.z,
                        255,
                        255,
                        255,
                        -lfsr.rand() * 10, 0.2, Physics.smoke);
                }
            }
        }

        this.rotateAngle = (Math.PI / 1.5) * delta;
        this.moveDistance = 70 * delta;
        this.runTime += delta;
        this.jumpTime += delta;

        if (this.runTime > 0.25 && this.currentModel != Model.jump && this.currentModel != Model.fall) {
            this.switchModel(Model.stand);
        }
        if (this.jumpTime > 0.1) {
            this.jumping = false;
        }
        let x = Math.round(this.mesh.position.x + 6 + 2);
        let y = Math.round(this.mesh.position.y - 7);
        let z = Math.round(this.mesh.position.z + 6 + 2);

        for (let x1 = x; x1 < x + 4; x1++) {
            for (let z1 = z; z1 < z + 4; z1++) {
                if (this.world.isWithinWorld(x1, y, z1)) {
                    if (this.world.blocks[x1][y][z1] == 0) {
                        this.canFall = true;
                    }
                }
            }
        }


        if (this.mesh != undefined && this.jumping != true && this.canFall) {
            //this.switchModel(Model.fall);
            let fy = this.mass * this.gravity;
            fy += -1 * 0.5 * this.airDensity * this.area * this.vy * this.vy;
            let dy = this.vy * delta + (0.5 * this.avg_ay * delta * delta);

            //let wy = Math.floor(y+(dy));
            this.mesh.translateY(-dy * 100);
            let new_ay = fy / this.mass;
            this.avg_ay = 0.5 * (new_ay + this.avg_ay);
            for (let x1 = x; x1 < x + 4; x1++) {
                for (let z1 = z; z1 < z + 4; z1++) {
                    if (this.world.isWithinWorld(x1, y, z1)) {
                        if (this.world.blocks[x1][y][z1] != 0) {
                            if (this.currentModel == Model.fall) {
                                this.switchModel(Model.stand);
                            }
                            this.mesh.translateY(dy * 100);
                            this.canFall = false;
                            return;
                        }
                    } else {
                        this.canFall = false;
                        this.switchModel(Model.stand);
                        this.vy -= this.avg_ay * delta;
                        return;
                    }
                }
            }
            this.switchModel(Model.fall);
        } else {
            if (this.currentModel == Model.fall) {
                this.switchModel(Model.stand);
            }
        }

    }

    die = () => {
        // Explode player.
        console.log("Player died.");
        for (let i = 0; i < this.chunk.blockList.length; i += 3) {
            let bl = this.chunk.blockList[i];
            let lvector = new THREE.Vector3(bl.x - 7, bl.y - 10, bl.z - 10);
            let vector = lvector.applyMatrix4(this.mesh.matrix);
            let xi = vector.x | 0;
            let yi = vector.y | 0;
            let zi = vector.z | 0;
            xi += 7;
            zi += 10;
            let block = this.phys.get();
            if (block != undefined) {
                r = bl.color[0];
                g = bl.color[1];
                b = bl.color[2];
                block.create(vector.x,
                    vector.y,
                    vector.z,
                    r,
                    g,
                    b,
                    lfsr.rand() * 5, 3, Physics.die);
            }
        }
        this.mesh.visible = false;

    }

    spawn = (x, y, z) => {
        // Box of blocks -> remove all but the ones in mesh.
    }
}