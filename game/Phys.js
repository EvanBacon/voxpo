import React from 'react';

import Physics from '../enums/Physics';
import lfsr from './utils'
import PhysicsBlock from './PhysicsBlock';
import MeshBlock from './MeshBlock';

export default class Phys {

    blocks = new Array();
    meshes = new Array(); // TBD: Change name, actually chunks.
    size = 1500; // pool size for blocks.
    pos = 0;
    neg = 0;

    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
    }

    init = () => {
        for (let i = 0; i < this.size; i++) {
            const b = new PhysicsBlock(this.scene, this.world, this.player, this);
            b.init();
            this.blocks.push(b);
        }
    }

    draw = (time, delta) => {
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].active == 1) {
                this.blocks[i].draw(time, delta);
            }
        }

        for (let i = 0; i < this.meshes.length; i++) {
            if (this.meshes[i].remove == 1) {
                this.scene.remove(this.meshes[i].mesh);
                this.meshes.splice(i, 1);
            } else {
                if (this.meshes[i].active == 1) {
                    this.meshes[i].draw(time, delta);
                } else {
                    //this.scene.remove(this.meshes[i].mesh);
                    this.meshes.splice(i, 1);
                }
            }
        }
    }

    createMeshBlock = (chunk) => {
        const mb = new MeshBlock(this.world);
        mb.create(chunk);
        this.meshes.push(mb);
    }

    get = () => {
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].active == 0) {
                this.blocks[i].active = 1;
                this.blocks[i].gravity = 9.82; // Reset gravity
                return this.blocks[i];
            }
        }
    }

    stats = () => {
        let free = 0;
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].active == 0) {
                free++;
            }
        }
        return {
            free,
            total: this.size
        };
    }


}