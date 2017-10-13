import React from 'react';
import Weapon from '../enums/Weapon';
import Settings from '../Settings'
export default class Objects {
    constructor(world, phys) {
        this.world = world;
        this.phys = phys;
        this.type = 0;
        this.hp = 0;
        this.weapon = Weapon.shotgun;
        this.chunk = undefined;
    }

    init = (name, position, chunk) => {
        this.name = name;
        this.hp = Settings.max_hp;

        chunk.dirty = true;
        chunk.fromX = 1000; // just some large value 
        chunk.fromZ = 1000;
        chunk.fromY = 1000;
        chunk.type = 1; // 0 = world, 1 = object;
        chunk.blockList = new Array();

        for (var q = 0; q < chunk.blockList.length; q++) {
            var b = chunk.blockList[q];
            if (b.x < chunk.fromX) {
                chunk.fromX = b.x;
            }
            if (b.x > chunk.toX) {
                chunk.toX = b.x;
            }
            if (b.y > chunk.toY) {
                chunk.toY = b.y;
            }
            if (b.y < chunk.fromY) {
                chunk.fromY = b.y;
            }
            if (b.z < chunk.fromZ) {
                chunk.fromZ = b.z;
            }
            if (b.z > chunk.toZ) {
                chunk.toZ = b.z;
            }
        }
        // Increase area to view all voxels for mesh creation
        chunk.fromX--;
        chunk.fromY--;
        chunk.fromZ--;
        chunk.toX++;
        chunk.toY++;
        chunk.toZ++;
        this.world.rebuildChunk(chunk);
        this.phys.createMeshBlock(chunk);
        this.chunk = chunk;
    }

    draw = (time, delta) => {
        this.CheckKeyPress();

    }

    hit = (x, y, z, dmg) => {
        this.hp -= dmg;
    }
}