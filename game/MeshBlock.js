import React from 'react';

export default class MeshBlock {
    mesh;
    helper;
    gravity = 19.82;
    mass = 1;
    airDensity = 1.2;
    e = -0.2;
    area = 0.1;
    active = 1;
    chunk;

    bounces_orig = 2;
    avg_ay = -2;
    vy = 0;
    remove = 0;

    constructor(world) {
        this.world = world;
        this.bounces = this.bounces_orig;
    }

    draw = (time, delta) => {
        this.mesh.updateMatrixWorld();
        for (let i = 0; i < this.chunk.blockList.length; i += this.off) {
            let b = this.chunk.blockList[i];
            let vector = new THREE.Vector3(b.x, b.y, b.z);
            vector.applyMatrix4(this.mesh.matrixWorld);
            let xi = vector.x + this.world.blockSize * 8 | 0;
            let yi = vector.y | 0;
            let zi = vector.z + this.world.blockSize * 8 | 0;

            if (this.world.isWithinWorld(xi, yi, zi)) {
                if ((this.world.blocks[xi][yi][zi] >> 8) != 0) {
                    this.world.placeObject(xi, yi, zi, this.chunk);
                    this.active = 0;
                    this.remove = 1;
                    return;
                }
            }
            if (yi <= 0) {
                this.world.placeObject(xi, 0, zi, this.chunk);
                this.remove = 1;
                this.active = 0;
                return;
            }
        }

        let fy = this.mass * this.gravity;
        fy += -1 * 0.5 * this.airDensity * this.area * this.vy * this.vy;
        let dy = this.vy * delta + (0.5 * this.avg_ay * delta * delta);

        this.mesh.position.y += dy * 10;
        let new_ay = fy / this.mass;
        this.avg_ay = 0.5 * (new_ay + this.avg_ay);
        this.vy -= this.avg_ay * delta;
    }

    create = (chunk) => {

        this.mesh = chunk.mesh;
        this.mesh.chunk = chunk;
        this.chunk = chunk;
        this.active = 1;
        this.off = 1;

        if (this.chunk.blockList.length > 100) {
            this.off = this.chunk.blockList.length / 500 | 0;
            if (this.off < 1) {
                this.off = 1;
            }
        }
    }
}

