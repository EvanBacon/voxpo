import lfsr from './utils'
import React from 'react';
import Physics from '../enums/Physics';

export default class PhysicsBlock {
    life = 0;
    mesh;
    color = '0xFFFFFF';
    active = 0;
    gravity = 9.82;
    e = -0.3; // restitution
    mass = 0.1; // kg
    airDensity = 1.2;
    drag = -5.95;
    area = 1 / 1000;
    vy = 0;
    avg_ay = 0;

    vx = 0;
    vz = 0;
    avg_ax = 0;
    avg_az = 0;

    bounces = 0;
    bounces_orig = 0;
    fx_ = 0;
    fz_ = 0;
    type = Physics.regular;
    ray;


    constructor(scene, world, player, phys) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.phys = phys;
        
    }



    init = () => {
        let geo = new THREE.BoxGeometry(
            this.world.blockSize,
            this.world.blockSize,
            this.world.blockSize
        );

        let mat = new THREE.MeshLambertMaterial();
        this.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.mesh);
        this.mesh.visible = false;
        this.mesh.castShadow = true;
        this.bounces_orig = (1 + lfsr.rand() + 2) | 0;
        //this.fx_ = lfsr.rand()-0.5;
        //this.fz_ = lfsr.rand()-0.5;

        this.fx_ = Math.random() - 0.5;
        this.fz_ = Math.random() - 0.5;
    }

    create = (x, y, z, r, g, b, power, life, type, bounces, mass) => {
        this.type = type ? type : Physics.regular;
        if (this.type != Physics.missile && this.type != Physics.snow && this.type != Physics.grenade && this.type != Physics.shot) {
            this.life = life ? lfsr.rand() * life : lfsr.rand() * 3;
        } else {
            this.life = life;
        }
        this.mass = mass ? mass : 0.1; // TBD: orig
        this.bounces = bounces ? bounces : this.bounces_orig;
        this.avg_ay = 0;
        this.avg_ax = 0;
        this.avg_az = 0;

        if (this.type == Physics.missile || this.type == Physics.grenade || this.type == Physics.shot) {
            // Extract direction vector
            let pos = new THREE.Vector3(0, 2, 50);
            let gpos = pos.applyMatrix4(this.player.mesh.matrix);
            let dir = pos.sub(this.player.mesh.position);
            this.ray = new THREE.Raycaster(gpos, dir.clone().normalize());
            this.vx = power + this.ray.ray.direction.x;
            this.vy = power;
            this.vz = power + this.ray.ray.direction.z;
        } else {
            this.vx = power;
            this.vy = power;
            this.vz = power;
        }

        let col = this.world.rgbToHex(r, g, b);
        this.mesh.material.color.setHex(col);
        this.mesh.material.needsUpdate = true;
        this.mesh.position.set(x, y, z);
        this.mesh.visible = true;
        this.mesh.scale.set(1, 1, 1);
    }

    draw = (time, delta) => {
        this.life -= delta;
        if (this.life <= 0 || this.bounces == 0 || this.mesh.position.y < -5) {
            if (this.type == Physics.missile) {
                let x = this.mesh.position.x + this.world.blockSize * 8 | 0;
                let y = this.mesh.position.y | 0;
                let z = this.mesh.position.z + this.world.blockSize * 8 | 0;
                //if(this.world.isWithinWorld(x,y,z)) {
                this.world.explode(x, y, z, 8, 0);
                //}
            } else if (this.type == Physics.grenade) {
                let x = this.mesh.position.x + this.world.blockSize * 8 | 0;
                let y = this.mesh.position.y | 0;
                let z = this.mesh.position.z + this.world.blockSize * 8 | 0;
                if (this.world.isWithinWorld(x, y, z)) {
                    this.world.explode(x, y, z, 15, 0);
                }
            } else if (this.type == Physics.shot) {
                let x = this.mesh.position.x + this.world.blockSize * 8 | 0;
                let y = this.mesh.position.y | 0;
                let z = this.mesh.position.z + this.world.blockSize * 8 | 0;
                if (this.world.isWithinWorld(x, y, z)) {
                    this.world.explode(x, y, z, 2, 0);
                }
            } else if (this.type == Physics.snow) {
                let x = this.mesh.position.x + this.world.blockSize * 8 | 0;
                let y = this.mesh.position.y - 3 | 0;
                let z = this.mesh.position.z + this.world.blockSize * 8 | 0;
                if (this.world.isWithinWorld(x, y, z)) {
                    this.world.blocks[x][y][z] = 255 << 24 | 255 << 16 | 255 << 8;
                    this.world.getChunk(x, z).dirty = true;
                    this.world.rebuildDirtyChunks();
                }
            }
            this.mesh.visible = false;
            this.active = 0;
            this.life = 0;
            return;
        }

        let x = this.mesh.position.x + this.world.blockSize * 8 | 0;
        let y = this.mesh.position.y | 0;
        let z = this.mesh.position.z + this.world.blockSize * 8 | 0;

        let fy = this.mass * this.gravity;
        let fx, fz;
        if (this.type == Physics.missile) {
            fx = this.mass * this.gravity; //*this.ray.ray.direction.x;
            fz = this.mass * this.gravity; //*this.ray.ray.direction.z;
        } else {
            fx = this.mass * this.gravity * lfsr.rand() - 0.5;
            fz = this.mass * this.gravity * lfsr.rand() - 0.5;
        }

        fy += -1 * 0.5 * this.airDensity * this.area * this.vy * this.vy;
        fx += -1 * 0.5 * this.airDensity * this.area * this.vx * this.vx;
        fz += -1 * 0.5 * this.airDensity * this.area * this.vz * this.vz;

        let dy = this.vy * delta + (0.5 * this.avg_ay * delta * delta);
        let dx = this.vx * delta + (0.5 * this.avg_ax * delta * delta);
        let dz = this.vz * delta + (0.5 * this.avg_az * delta * delta);

        if (this.type == Physics.regular || this.type == Physics.die) {
            this.mesh.position.x += dx * 10 * this.fx_;
            this.mesh.position.z += dz * 10 * this.fz_;
            this.mesh.position.y += dy * 10;
        } else if (this.type == Physics.smoke) {
            this.mesh.position.y += dy * 10;
            this.mesh.position.x += Math.sin(dx) * this.fx_;
            this.mesh.position.z += Math.sin(dz) * this.fz_;
        } else if (this.type == Physics.snow) {
            this.mesh.position.y += dy * 10;
            this.mesh.position.x += Math.sin(dx) * this.fx_;
            this.mesh.position.z += Math.sin(dz) * this.fz_;
        } else if (this.type == Physics.shot) {
            this.mesh.position.x += dx * 10 * this.ray.ray.direction.x;
            this.mesh.position.z += dz * 10 * this.ray.ray.direction.z;
        } else if (this.type == Physics.missile) {
            this.mesh.position.x += dx * 10 * this.ray.ray.direction.x;
            this.mesh.position.z += dz * 10 * this.ray.ray.direction.z;
            let smoke = this.phys.get();
            if (smoke != undefined) {
                // Random colors
                smoke.gravity = -2;
                smoke.create(this.mesh.position.x,
                    this.mesh.position.y,
                    this.mesh.position.z,
                    230,
                    230,
                    230,
                    lfsr.rand() * 1, 1, Physics.smoke);

            }
        } else if (this.type == Physics.grenade) {
            this.mesh.position.x += dx * 10 * this.ray.ray.direction.x;
            this.mesh.position.z += dz * 10 * this.ray.ray.direction.z;
            this.mesh.position.y += dy * 20;
            if (lfsr.rand() > 0.7) {
                let smoke = this.phys.get();
                if (smoke != undefined) {
                    // Random colors
                    smoke.gravity = -2;
                    let r = 200;
                    let g = (100 + lfsr.rand() * 155) | 0;
                    let b = 0;
                    smoke.create(this.mesh.position.x,
                        this.mesh.position.y,
                        this.mesh.position.z,
                        r,
                        g,
                        b,
                        lfsr.rand() * 1, 0.5, Physics.smoke);

                }
            }
        }


        let new_ay = fy / this.mass;
        this.avg_ay = 0.5 * (new_ay + this.avg_ay);
        this.vy -= this.avg_ay * delta;

        let new_ax = fx / this.mass;
        this.avg_ax = 0.5 * (new_ax + this.avg_ax);
        this.vx -= this.avg_ax * delta;

        let new_az = fz / this.mass;
        this.avg_az = 0.5 * (new_az + this.avg_az);
        this.vz -= this.avg_az * delta;

        this.mesh.rotation.set(this.vx, this.vy, this.vz);

        if (this.type == Physics.missile || this.type == Physics.shot) {
            if (this.world.isWithinWorld(x, y, z)) {
                for (let x1 = -1; x1 < 2; x1++) {
                    for (let z1 = -1; z1 < 2; z1++) {
                        if (this.world.isWithinWorld(x + x1, y, z + z1)) {
                            if ((this.world.blocks[x + x1][y][z + z1] >> 8) != 0) {
                                this.life = 0;
                                return;
                            }
                        }
                    }
                }
            }
        } else if (this.type == Physics.grenade) {
            let x = this.mesh.position.x | 0;
            let y = this.mesh.position.y | 0;
            let z = this.mesh.position.z | 0;
            if (this.world.isWithinWorld(x, y, z)) {
                for (let x1 = 0; x1 < 2; x1++) {
                    for (let z1 = 0; z1 < 2; z1++) {
                        for (let y1 = 0; y1 < 2; y1++) {
                            if (this.world.isWithinWorld(x + x1, y + y1, z + z1)) {
                                if (this.mesh.position.y <= 0 && this.vy < 0) {
                                    this.bounces--;
                                    this.vy *= this.e * 1.5;
                                    return;
                                }
                                if ((this.world.blocks[x + x1][y + y1][z + z1] >> 8) != 0) {
                                    if (this.vy < 0) {
                                        this.bounces--;
                                        this.vy *= this.e * 1.5;
                                    }
                                    if (this.vx < 0) {
                                        this.bounces--;
                                        this.vx *= this.e * 2;
                                        this.ray.ray.direction.x *= -1;
                                    } else {
                                        this.bounces--;
                                        this.ray.ray.direction.x *= -1;
                                        this.vx *= -this.e * 2;
                                    }

                                    if (this.vz < 0) {
                                        this.bounces--;
                                        this.vz *= this.e * 2;
                                        this.ray.ray.direction.z *= -1;
                                    } else {
                                        this.bounces--;
                                        this.ray.ray.direction.z *= -1;
                                        this.vz *= -this.e * 2;
                                    }

                                }
                            }
                        }
                    }
                }
            }
        } else if (this.type == Physics.die) {
            if (this.world.isWithinWorld(x, y, z)) {
                if ((this.world.blocks[x][y][z] >> 8) != 0 && this.vy < 0) {
                    this.mesh.position.y += this.world.blockSize * 4;
                    this.mesh.rotation.set(0, 0, 0);
                    this.vy *= this.e;
                    this.bounces--;
                }
            }

        } else {
            if (this.world.isWithinWorld(x, y, z)) {
                if ((this.world.blocks[x][y][z] >> 8) != 0 && this.world.isBlockHidden(x, y, z)) {
                    this.mesh.visible = false;
                    this.active = 0;
                    this.life = 0;
                    this.bounces--;
                } else if ((this.world.blocks[x][y][z] >> 8) != 0 && this.vx < 0) {
                    //this.mesh.position.x -= this.world.blockSize; 
                    this.mesh.rotation.set(0, 0, 0);
                    this.vx *= this.e;
                    this.bounces--;
                } else if ((this.world.blocks[x][y][z] >> 8) != 0 && this.vz < 0) {
                    //this.mesh.position.z -= this.world.blockSize*8; 
                    this.mesh.rotation.set(0, 0, 0);
                    this.vz *= this.e;
                    this.bounces--;
                } else if ((this.world.blocks[x][y][z] >> 8) != 0 && this.vy < 0) {
                    this.mesh.position.y = y + this.world.blockSize * 4;
                    this.mesh.rotation.set(0, 0, 0);
                    this.vy *= this.e;
                    this.bounces--;
                }
            }
        }
    }
}
