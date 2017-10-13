import React from 'react';
import Chunk from '../enums/Chunk';
import lfsr from './utils'
import Physics from '../enums/Physics'
import ChunkItem from './ChunkItem';
// Binary string to decimal conversion
String.prototype.bin = function () {
    return parseInt(this, 2);
};

// Decimal to binary string conversion
Number.prototype.bin = function () {
    let sign = (this < 0 ? "-" : "");
    let result = Math.abs(this).toString(2);
    while (result.length < 32) {
        result = "0" + result;
    }
    return sign + result;
}

export default class World {


    constructor(scene, player, phys) {
        this.scene = scene;
        this.player = player;
        this.phys = phys;

        this.worldSize = 192;
        this.chunkBase = 16;
        this.worldDivBase = this.worldSize / this.chunkBase;
        this.chunkHeight = 160;
        this.blocks = 0;
        this.blockSize = 1;
        this.material = 0;
        this.chunks = undefined;
        this.plane = 0; // bottom ground

        this.ffTime = 0;

        this.last = 0; // Used for flood fill

        this.floodFill = new Array();

        // Debug stuff
        this.wireframe = false;
        this.showChunks = false;
    }

    init = () => {

        // initiate blocks
        this.blocks = new Array();
        for (let x = 0; x < this.worldSize; x++) {
            this.blocks[x] = new Array();
            for (let y = 0; y < this.chunkHeight; y++) {
                this.blocks[x][y] = new Array();
                for (let z = 0; z < this.worldSize; z++) {
                    this.blocks[x][y][z] = 0;
                }
            }
        }

        this.chunks = new Array(this.worldDivBase);
        for (let x = 0; x < this.worldDivBase; x++) {
            this.chunks[x] = new Array(this.worldDivBase);
            for (let z = 0; z < this.worldDivBase; z++) {
                this.chunks[x][z] = new ChunkItem();
                this.chunks[x][z].type = 0; // world
                this.chunks[x][z].fromY = 0;
                this.chunks[x][z].toY = this.chunkHeight;
                this.chunks[x][z].fromX = x * this.blockSize * this.chunkBase;
                this.chunks[x][z].toX = x * this.blockSize * this.chunkBase + this.chunkBase;
                this.chunks[x][z].fromZ = z * this.blockSize * this.chunkBase;
                this.chunks[x][z].toZ = z * this.blockSize * this.chunkBase + this.chunkBase;
                this.chunks[x][z].x = x;
                this.chunks[x][z].z = z;
                if (this.showChunks) {
                    const mat = new THREE.MeshBasicMaterial({ color: 0xAA4444, wireframe: true });
                    const geo = new THREE.BoxGeometry(
                        this.chunkBase * this.blockSize,
                        this.chunkHeight * this.blockSize,
                        this.chunkBase * this.blockSize
                    );

                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.x = x * this.blockSize * this.chunkBase + this.chunkBase * this.blockSize / 2;
                    mesh.position.z = z * this.blockSize * this.chunkBase + this.chunkBase * this.blockSize / 2;
                    mesh.position.y = this.blockSize * this.chunkHeight / 2;
                    this.scene.add(mesh);
                }
            }
        }

        // Add ground plate
        // TOP
        let col = 0x444444;
        let geo = new THREE.BoxGeometry(this.blockSize * this.worldSize - 2, 1, this.blockSize * this.worldSize - 7);
        let mat = new THREE.MeshBasicMaterial({ color: col });
        let mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((this.worldSize / 2 - this.chunkBase / 2), -1 / 2 + 1, this.worldSize / 2 - this.chunkBase / 2 + 2);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        // base
        geo = new THREE.BoxGeometry(this.blockSize * this.worldSize - 2, 1000, this.blockSize * this.worldSize - 7);
        mat = new THREE.MeshBasicMaterial({ color: col });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((this.worldSize / 2 - this.chunkBase / 2), -1000 / 2, this.worldSize / 2 - this.chunkBase / 2 + 2);
        this.scene.add(mesh);

        this.rebuildMaterial(false);
    }

    rebuildMaterial = (wireframe) => {
        this.wireframe = wireframe;
        this.material = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors, wireframe: this.wireframe });
        //this.material = new THREE.MeshPhongMaterial( {
        //					color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        //			side: THREE.SingleSide, vertexColors: THREE.VertexColors
        //} );

    }

    placeObject = (x, y, z, chunk) => {
        for (let i = 0; i < chunk.blockList.length; i++) {
            chunk.mesh.updateMatrixWorld();
            let b = chunk.blockList[i];
            let vector = new THREE.Vector3(b.x, b.y, b.z);
            vector.applyMatrix4(chunk.mesh.matrixWorld);
            let xi = vector.x + this.blockSize * 8 | 0;
            let yi = vector.y | 0;
            let zi = vector.z + this.blockSize * 8 | 0;
            // TBD: Solves some issues with placement.
            if (yi <= 0) {
                yi = 1;
            }
            if (this.isWithinWorld(xi, yi, zi)) {
                this.blocks[xi][yi][zi] = b.val;
                // If player is hit by object, kill him (if the object is larger than 200 blocks)
                if (chunk.blockList.length > 200) {
                    let px = (this.player.mesh.position.x + this.blockSize * 8) | 0;
                    let py = (this.player.mesh.position.y + this.blockSize * 8) | 0;
                    let pz = (this.player.mesh.position.z + this.blockSize * 8) | 0;
                    if (px == xi && py == yi && pz == zi) {
                        this.player.die();
                    }
                }
                this.getChunk(xi, zi).dirty = true;
            }
        }
        this.rebuildDirtyChunks();
    }

    isWithinWorld = (x, y, z) => {
        if (x > 0 && x < this.worldSize - 1 &&
            y > 0 && y < this.chunkHeight - 1 &&
            z > 4 && z < this.worldSize - 1) {
            return true;
        }
        return false;
    }

    explode = (x, y, z, power, onlyExplode) => {
        // remove blocks.
        this.exploded = 1;
        let pow = power * power;
        let blockList = new Array();
        for (let rx = x + power; rx >= x - power; rx--) {
            for (let rz = z + power; rz >= z - power; rz--) {
                for (let ry = y + power; ry >= y - power; ry--) {
                    val = (rx - x) * (rx - x) + (ry - y) * (ry - y) + (rz - z) * (rz - z);
                    if (val <= pow) {
                        this.removeBlock(rx, ry, rz);

                        // TBD: Temp solution for player death...
                        let px = (this.player.mesh.position.x + this.blockSize * 8) | 0;
                        let py = (this.player.mesh.position.y - this.blockSize * 8) | 0;
                        let pz = (this.player.mesh.position.z + this.blockSize * 8) | 0;
                        if (px == rx && py == ry && pz == rz) {
                            this.player.die();
                        }
                    } else if (val > pow) {
                        if (this.isWithinWorld(rx, ry, rz)) {
                            if ((this.blocks[rx][ry][rz] >> 8) != 0) {
                                blockList.push(new THREE.Vector3(rx, ry, rz));
                                // this.blocks[rx][ry][rz] = (Math.round(Math.random()*225) & 0xFF) << 24 | (255 & 0xFF) << 16 | (255 & 0xFF) << 8;
                            }
                        }
                    }
                    if (val <= pow / 10) {
                        this.explosionBlock(rx, ry, rz);
                        if (lfsr.rand() > 0.8) {
                            this.smokeBlock(rx, ry, rz);
                        }
                    }
                }
            }
        }
        this.rebuildDirtyChunks();
        if (!onlyExplode) {
            this.floodFill.push(blockList);
            //            this.removeHangingBlocks(blockList);
        }
    }

    drawStats = () => {
        let vblocks = 0, blocks = 0;
        let vtriangles = 0, triangles = 0;
        let vchunks = 0, chunks = 0;
        for (let x = 0; x < this.chunks.length; x++) {
            for (let z = 0; z < this.chunks.length; z++) {
                if (this.chunks[x][z].mesh != undefined) {
                    if (this.chunks[x][z].mesh.visible) {
                        vblocks += this.chunks[x][z].blocks;
                        vtriangles += this.chunks[x][z].triangles;
                        vchunks++;
                    }
                    blocks += this.chunks[x][z].blocks;
                    triangles += this.chunks[x][z].triangles;
                    chunks++;
                }
            }
        }
        // TBD: This should not be here...
        // let phys_stat = this.phys.Stats();
        const totalBlocks = blocks;
        console.log("GLOBAL: total blocks", blocks);
        console.log("GLOBAL: triangles", triangles);
        console.log("GLOBAL: chunks", chunks);
        console.log("VISIBLE: blocks", vblocks);
        console.log("VISIBLE: triangles", vtriangles);
        console.log("VISIBLE: chunks", vchunks);
        console.log(`PARTICLES: free: ${phys_stat.free}/${phys_stat.total}` );
    }


    rebuildDirtyChunks = (buildAll) => {
        for (let x = 0; x < this.chunks.length; x++) {
            for (let z = 0; z < this.chunks.length; z++) {
                if (buildAll == 1 || this.chunks[x][z].dirty == true) {
                    this.rebuildChunk(this.chunks[x][z]);
                    //this.rebuildChunk(this.chunks[x][z].fromX, this.chunks[x][z].fromZ);
                }
            }
        }
    }

    draw = (time, delta) => {
        if ((this.ffTime += delta) > 0.1) {
            if (this.floodFill.length > 0 && this.exploded != 1) {
                this.removeHangingBlocks(this.floodFill.pop());
            }
            this.ffTime = 0;
        }
        // this.drawStats();
        this.exploded = 0;
    }

    componentToHex = (c) => {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    rgbToHex = (r, g, b) => {
        if (r < 0) r = 0;
        if (g < 0) g = 0;
        const hex = this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
        return parseInt('0x' + hex.substring(0, 6));
    }

    getChunk = (x, z) => {
        const posx = parseInt(x / (this.chunkBase));
        const posz = parseInt(z / (this.chunkBase));
        if (posx < 0 || posz < 0) {
            return undefined;
        }

        if (!this.chunks || !this.chunks[posx] || !this.chunks[posx][posz]) {
            console.warn("error: chunks failed to load");
            return undefined;
        }
        return this.chunks[posx][posz];
    }


    removeHangingBlocks = (blocks) => {
        let newChunks = new Array();
        let removeBlocks = new Array();
        let all = new Array();
        for (let i = 0; i < blocks.length; i++) {
            let p = blocks[i];
            //this.blocks[p.x][p.y][p.z] = (25 & 0xFF) << 24 | (255 & 0xFF) << 16 | (0 & 0xFF) << 8 | this.blocks[p.x][p.y][p.z] & 0xFF;
            let ff = this.doFloodFill(p);
            all.push(ff.all);
            if (ff.result != true) {
                if (ff.vals.length == 0) {
                    continue;
                }
                //if(ff.vals.length <= ) {
                //    removeBlocks.push(ff);
                //} else {
                newChunks.push(ff);
                //}
            }
        }

        for (let m = 0; m < newChunks.length; m++) {
            let ff = newChunks[m];
            // create chunk 
            const chunk = new ChunkItem();
            chunk.dirty = true;
            chunk.fromX = 5000; // just some large value > world.
            chunk.fromZ = 5000;
            chunk.fromY = 5000;
            chunk.type = Chunk.ff;
            chunk.blockList = new Array();

            for (let q = 0; q < ff.vals.length; q++) {
                let b = ff.vals[q];
                // we need to reset the values before we set the value in the blockList for the mesh.
                this.blocks[b.x][b.y][b.z] &= ~(1 << 5);
                this.blocks[b.x][b.y][b.z] &= ~(1 << 6);
                b.val = this.blocks[b.x][b.y][b.z];
                // Then set it back so that we can use it in rebuildChunk
                this.blocks[b.x][b.y][b.z] |= 0x20;
                chunk.blockList.push(b);

                this.getChunk(b.x, b.z).dirty = true;
                //this.blocks[b.x][b.y][b.z] = (5 & 0xFF) << 24 | (0 & 0xFF) << 16 | (255 & 0xFF) << 8 | this.blocks[b.x][b.y][b.z] & 0xFF;
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
            this.rebuildChunk(chunk);
            this.phys.createMeshBlock(chunk);
        }

        for (let m = 0; m < removeBlocks.length; m++) {
            let ff = removeBlocks[m];
            // remove parts that are very small.
            for (let q = 0; q < ff.vals.length; q++) {
                let b = ff.vals[q];
                //            this.blocks[b.x][b.y][b.z] = 0;
                this.removeBlock(b.x, b.y, b.z);
                //              this.blocks[b.x][b.y][b.z] = (5 & 0xFF) << 24 | (255 & 0xFF) << 16 | (2 & 0xFF) << 8 | this.blocks[b.x][b.y][b.z] & 0xFF;
                //                this.getChunk(b.x, b.z).dirty = true;
            }
        }

        // Clears AFTER we have built the chunks where 0x20/0x40 are used.
        for (let i = 0; i < all.length; i++) {
            for (let n = 0; n < all[i].length; n++) {
                let b = all[i][n];
                this.blocks[b.x][b.y][b.z] &= ~(1 << 5);
                this.blocks[b.x][b.y][b.z] &= ~(1 << 6);
            }
        }
        this.rebuildDirtyChunks();

    }

    isBlockHidden = (x, y, z) => {
        if ((this.blocks[x][y][z] >> 8) == 0) {
            return true;
        }

        let left = 0, right = 0, above = 0, front = 0, back = 0, below = 0;
        if (y > 0) {
            if ((this.blocks[x][y - 1][z] >> 8) != 0) {
                below = 1;
            }
        }
        if (z > 0) {
            if ((this.blocks[x][y][z - 1] >> 8) != 0) {
                back = 1;
            }
        }
        if (x > 0) {
            if ((this.blocks[x - 1][y][z] >> 8) != 0) {
                left = 1;
            }
        }
        if (x < this.worldSize - 1) {
            if ((this.blocks[x + 1][y][z] >> 8) != 0) {
                right = 1;
            }
        }
        if (y < this.chunkHeight - 1) {
            if ((this.blocks[x][y + 1][z] >> 8) != 0) {
                above = 1;
            }
        }
        if (z < this.worldSize - 1) {
            if ((this.blocks[x][y][z + 1] >> 8) != 0) {
                front = 1;
            }
        }

        if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1 && below == 1) {
            return true;
        }
        return false;
    }

    doFloodFill = (start) => {
        // let COLOR1 = lfsr.rand()*255;
        // let COLOR2 = lfsr.rand()*255;
        // let COLOR3 = lfsr.rand()*255;
        const curr = 0x20;
        let stack = new Array();
        let result = new Array();
        stack.push(start);
        let all = new Array();

        if ((start & curr) != 0) {
            return { "result": true, "vals": result, "all": all };
        }

        while (stack.length != 0) {
            let b = stack.pop();
            all.push(b);
            if (!this.isWithinWorld(b.x, b.y, b.z)) {
                continue;
            }
            if ((this.blocks[b.x][b.y][b.z] >> 8) == 0) {
                continue;
            }

            // If we reach a 0x40 block we know that it leads to ground already.
            // so we can skip searching since we know it leads to ground from here.
            if ((this.blocks[b.x][b.y][b.z] & 0x40) != 0) {
                return { "result": true, "vals": result, "all": all };
            }

            if ((this.blocks[b.x][b.y][b.z] & curr) != 0) {
                continue;
            }
            if (b.y <= 4) {
                this.blocks[b.x][b.y][b.z] |= curr;
                this.blocks[start.x][start.y][start.z] |= 0x40;
                return { "result": true, "vals": result, "all": all };
            }

            result.push(b);
            //this.blocks[b.x][b.y][b.z] = (COLOR1 & 0xFF) << 24 | (COLOR2 & 0xFF) << 16 | (COLOR3 & 0xFF) << 8 | this.blocks[b.x][b.y][b.z] & 0xFF;
            this.blocks[b.x][b.y][b.z] |= curr;

            stack.push(new THREE.Vector3(b.x, b.y + 1, b.z));
            stack.push(new THREE.Vector3(b.x, b.y, b.z + 1));
            stack.push(new THREE.Vector3(b.x + 1, b.y, b.z));
            stack.push(new THREE.Vector3(b.x, b.y, b.z - 1));
            stack.push(new THREE.Vector3(b.x - 1, b.y, b.z));
            stack.push(new THREE.Vector3(b.x, b.y - 1, b.z));
        }

        this.blocks[start.x][start.y][start.z] |= 0x40;
        return { "result": false, "vals": result, "all": all };
    }

    smokeBlock = (x, y, z) => {
        const block = this.phys.get();
        if (block != undefined) {
            // Random colors
            let color = lfsr.rand() * 155 | 0;
            const r = color;
            const g = color;
            const b = color;
            block.gravity = -2;
            block.create(x - this.blockSize * 8,
                y + this.blockSize,
                z - this.blockSize * 8,
                r,
                g,
                b,
                lfsr.rand() * 1, 2, Physics.smoke);

        }
    }

    explosionBlock = (x, y, z) => {
        const block = this.phys.get();
        if (block != undefined) {
            // Random colors
            const r = 255;
            const g = 100 + (lfsr.rand() * 155 | 0);
            const b = 0;
            block.create(x - this.blockSize * 8,
                y + this.blockSize,
                z - this.blockSize * 8,
                r,
                g,
                b,
                lfsr.rand() * 4, 0.3);
        }
    }

    removeBlock = (x, y, z) => {
        if (x < 0 || y < 0 || z < 0 || x > this.worldSize - 1 || y > this.chunkHeight - 1 || z > this.worldSize - 1) {
            return;
        }
        if (this.blocks[x][y][z] == 0) {
            return;
        }

        let chunk = this.getChunk(x, z);
        if (chunk != undefined) {
            chunk.blocks--;
            chunk.dirty = true;

            let block = this.phys.get();
            if (block != undefined) {
                if (lfsr.rand() < 0.25) {
                    let r = (this.blocks[x][y][z] >> 24) & 0xFF;
                    let g = (this.blocks[x][y][z] >> 16) & 0xFF;
                    let b = (this.blocks[x][y][z] >> 8) & 0xFF;
                    block.create(x - this.blockSize * 8,
                        y + this.blockSize,
                        z - this.blockSize * 8,
                        r,
                        g,
                        b,
                        3);
                }
            }
            this.blocks[x][y][z] = 0;
        }
    }

    addBlock = (x, y, z, color) => {
        let size = 1 / this.blockSize;

        if (x < 0 || y < 0 || z < 0 || x > this.worldSize - 1 || y > this.chunkHeight - 1 || z > this.worldSize - 1) {
            return;
        }

        let chunk = this.getChunk(x, z);
        if (this.blocks[x][y][z] == 0) {
            chunk.blocks += size;
            this.blocks[x][y][z] = (color[0] & 0xFF) << 24 | (color[1] & 0xFF) << 16 | (color[2] & 0xFF) << 8 | 0 & 0xFF;
            chunk.dirty = true;
        }
    }

    sameColor = (block1, block2) => (((block1 >> 8) & 0xFFFFFF) == ((block2 >> 8) & 0xFFFFFF) && block1 != 0 && block2 != 0);

    // Given world position
    rebuildChunk = (chunk) => {
        let sides = 0;

        let vertices = [];
        let colors = [];

        // Block structure
        // BLOCK: [R-color][G-color][B-color][0][00][back_left_right_above_front]
        //           8bit    8bit     8it    1bit(unused)  2bit(floodfill)     5bit(faces)

        // Reset faces
        for (let x = chunk.fromX; x < chunk.toX; x++) {
            for (let y = chunk.fromY; y < chunk.toY; y++) {
                for (let z = chunk.fromZ; z < chunk.toZ; z++) {
                    if (this.blocks[x][y][z] != 0) {
                        // TBD: Hmmm...should work with a AND op? Need some brain to this whine.
                        this.blocks[x][y][z] &= ~(1 << 0)
                        this.blocks[x][y][z] &= ~(1 << 1)
                        this.blocks[x][y][z] &= ~(1 << 2)
                        this.blocks[x][y][z] &= ~(1 << 3)
                        this.blocks[x][y][z] &= ~(1 << 4)
                        //this.blocks[x][y][z] = this.blocks[x][y][z] & 0xFFFFF8;
                    }
                }
            }
        }

        for (let x = chunk.fromX; x < chunk.toX; x++) {
            for (let y = chunk.fromY; y < chunk.toY; y++) {
                for (let z = chunk.fromZ; z < chunk.toZ; z++) {
                    if (chunk.type == Chunk.ff) {
                        // make sure we only use blocks that we should build as mesh. (floodfill only)
                        if ((this.blocks[x][y][z] & 0x20) == 0 && (this.blocks[x][y][z] & 0x40) == 0) {
                            continue;
                        }
                    }
                    if (this.blocks[x][y][z] == 0) {
                        continue; // Skip empty blocks
                    }
                    // Check if hidden
                    let left = 0, right = 0, above = 0, front = 0, back = 0;
                    if (z > 0) {
                        if (this.blocks[x][y][z - 1] != 0) {
                            back = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x10;
                        }
                    }
                    if (x > 0) {
                        if (this.blocks[x - 1][y][z] != 0) {
                            left = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x8;
                        }
                    }
                    if (x < this.worldSize - 1) {
                        if (this.blocks[x + 1][y][z] != 0) {
                            right = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x4;
                        }
                    }
                    if (y < chunk.toY - 1) {
                        if (this.blocks[x][y + 1][z] != 0) {
                            above = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x2;
                        }
                    }
                    if (z < this.worldSize - 1) {
                        if (this.blocks[x][y][z + 1] != 0) {
                            front = 1;
                            this.blocks[x][y][z] = this.blocks[x][y][z] | 0x1;
                        }
                    }

                    if (front == 1 && left == 1 && right == 1 && above == 1 && back == 1) {
                        // If we are building a standalone mesh, remove invisible 
                        if (chunk.type == Chunk.object || chunk.type == Chunk.ff) {
                            this.blocks[x][y][z] = 0;
                        }

                        continue; // block is hidden
                    }
                    // draw block
                    if (!above) {
                        // Get above (0010)
                        if ((this.blocks[x][y][z] & 0x2) == 0) {
                            let maxX = 0;
                            let maxZ = 0;
                            let end = 0;

                            for (let x_ = x; x_ < chunk.toX; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x2) == 0 && this.sameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                let tmpZ = 0;
                                for (let z_ = z; z_ < chunk.toZ; z_++) {
                                    if ((this.blocks[x_][y][z_] & 0x2) == 0 && this.sameColor(this.blocks[x_][y][z_], this.blocks[x][y][z])) {
                                        tmpZ++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpZ < maxZ || maxZ == 0) {
                                    maxZ = tmpZ;
                                }
                            }
                            for (let x_ = x; x_ < x + maxX; x_++) {
                                for (let z_ = z; z_ < z + maxZ; z_++) {
                                    this.blocks[x_][y][z_] = this.blocks[x_][y][z_] | 0x2;
                                }
                            }
                            maxX--;
                            maxZ--;

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize, z * this.blockSize - this.blockSize]);

                            sides += 6;
                            for (let n = 0; n < 6; n++) {
                                colors.push([((this.blocks[x][y][z] >> 24) & 0xFF),
                                ((this.blocks[x][y][z] >> 16) & 0xFF),
                                ((this.blocks[x][y][z] >> 8) & 0xFF)
                                ]);
                            }
                        }
                    }
                    if (!back) {
                        // back  10000
                        if ((this.blocks[x][y][z] & 0x10) == 0) {
                            let maxX = 0;
                            let maxY = 0;

                            for (let x_ = x; x_ < chunk.toX; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x10) == 0 && this.sameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                let tmpY = 0;
                                for (let y_ = y; y_ < chunk.toY; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x10) == 0 && this.sameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (let x_ = x; x_ < x + maxX; x_++) {
                                for (let y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x10;
                                }
                            }
                            maxX--;
                            maxY--;
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            sides += 6;
                            for (let n = 0; n < 6; n++) {
                                colors.push([((this.blocks[x][y][z] >> 24) & 0xFF),
                                ((this.blocks[x][y][z] >> 16) & 0xFF),
                                ((this.blocks[x][y][z] >> 8) & 0xFF)
                                ]);
                            }
                        }
                    }
                    if (!front) {
                        // front 0001
                        if ((this.blocks[x][y][z] & 0x1) == 0) {
                            let maxX = 0;
                            let maxY = 0;

                            for (let x_ = x; x_ < chunk.toX; x_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x_][y][z] & 0x1) == 0 && this.sameColor(this.blocks[x_][y][z], this.blocks[x][y][z])) {
                                    maxX++;
                                } else {
                                    break;
                                }
                                let tmpY = 0;
                                for (let y_ = y; y_ < chunk.toY; y_++) {
                                    if ((this.blocks[x_][y_][z] & 0x1) == 0 && this.sameColor(this.blocks[x_][y_][z], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (let x_ = x; x_ < x + maxX; x_++) {
                                for (let y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x_][y_][z] = this.blocks[x_][y_][z] | 0x1;
                                }
                            }
                            maxX--;
                            maxY--;

                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize]);
                            vertices.push([x * this.blockSize + (this.blockSize * maxX), y * this.blockSize - this.blockSize, z * this.blockSize]);
                            sides += 6;
                            for (let n = 0; n < 6; n++) {
                                colors.push([((this.blocks[x][y][z] >> 24) & 0xFF),
                                ((this.blocks[x][y][z] >> 16) & 0xFF),
                                ((this.blocks[x][y][z] >> 8) & 0xFF)
                                ]);
                            }
                        }
                    }
                    if (!left) {
                        if ((this.blocks[x][y][z] & 0x8) == 0) {
                            let maxZ = 0;
                            let maxY = 0;

                            for (let z_ = z; z_ < chunk.toZ; z_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x8) == 0 && this.sameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                let tmpY = 0;
                                for (let y_ = y; y_ < chunk.toY; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x8) == 0 && this.sameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (let z_ = z; z_ < z + maxZ; z_++) {
                                for (let y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x8;
                                }
                            }
                            maxZ--;
                            maxY--;

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize - this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            sides += 6;
                            for (let n = 0; n < 6; n++) {
                                colors.push([((this.blocks[x][y][z] >> 24) & 0xFF),
                                ((this.blocks[x][y][z] >> 16) & 0xFF),
                                ((this.blocks[x][y][z] >> 8) & 0xFF)
                                ]);
                            }
                        }
                    }
                    if (!right) {
                        if ((this.blocks[x][y][z] & 0x4) == 0) {
                            let maxZ = 0;
                            let maxY = 0;

                            for (let z_ = z; z_ < chunk.toZ; z_++) {
                                // Check not drawn + same color
                                if ((this.blocks[x][y][z_] & 0x4) == 0 && this.sameColor(this.blocks[x][y][z_], this.blocks[x][y][z])) {
                                    maxZ++;
                                } else {
                                    break;
                                }
                                let tmpY = 0;
                                for (let y_ = y; y_ < chunk.toY; y_++) {
                                    if ((this.blocks[x][y_][z_] & 0x4) == 0 && this.sameColor(this.blocks[x][y_][z_], this.blocks[x][y][z])) {
                                        tmpY++;
                                    } else {
                                        break;
                                    }
                                }
                                if (tmpY < maxY || maxY == 0) {
                                    maxY = tmpY;
                                }
                            }
                            for (let z_ = z; z_ < z + maxZ; z_++) {
                                for (let y_ = y; y_ < y + maxY; y_++) {
                                    this.blocks[x][y_][z_] = this.blocks[x][y_][z_] | 0x4;
                                }
                            }
                            maxZ--;
                            maxY--;

                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize + (this.blockSize * maxZ)]);

                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize + (this.blockSize * maxZ)]);
                            vertices.push([x * this.blockSize, y * this.blockSize - this.blockSize, z * this.blockSize - this.blockSize]);
                            vertices.push([x * this.blockSize, y * this.blockSize + (this.blockSize * maxY), z * this.blockSize - this.blockSize]);

                            sides += 6;
                            for (let n = 0; n < 6; n++) {
                                colors.push([((this.blocks[x][y][z] >> 24) & 0xFF),
                                ((this.blocks[x][y][z] >> 16) & 0xFF),
                                ((this.blocks[x][y][z] >> 8) & 0xFF)
                                ]);
                            }
                        }
                    }

                    if (chunk.type == Chunk.object || chunk.type == Chunk.ff) {
                        this.blocks[x][y][z] = 0;
                    }
                }
            }
        }
        chunk.triangles = vertices.length / 3;

        // draw chunk
        let geometry = new THREE.BufferGeometry();
        let v = new THREE.BufferAttribute(new Float32Array(vertices.length * 3), 3);
        for (let i = 0; i < vertices.length; i++) {
            v.setXYZ(i, vertices[i][0], vertices[i][1], vertices[i][2]);
        }
        geometry.addAttribute('position', v);

        let c = new THREE.BufferAttribute(new Float32Array(colors.length * 3), 3);
        for (let i = 0; i < colors.length; i++) {
            c.setXYZW(i, colors[i][0] / 255, colors[i][1] / 255, colors[i][2] / 255, 1);
        }
        geometry.addAttribute('color', c);

        geometry.computeVertexNormals();
        geometry.computeFaceNormals();

        geometry.computeBoundingBox();

        this.scene.remove(chunk.mesh);
        chunk.mesh = new THREE.Mesh(geometry, this.material);

        chunk.mesh.position.set(
            (chunk.fromX / this.chunkBase) - this.chunkBase / 2 - this.blockSize * (chunk.fromX / this.chunkBase),
            this.blockSize,
            (chunk.fromZ / this.chunkBase) - this.chunkBase / 2 - this.blockSize * (chunk.fromZ / this.chunkBase)
        );

        chunk.mesh.receiveShadow = true;
        chunk.mesh.castShadow = true;
        chunk.dirty = false;
        this.scene.add(chunk.mesh);
        chunk.mesh.visible = true;
    }
}