/** * GAME CONSTANTS */
const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 15;

const TILE = { FLOOR: 0, WALL: 1, STAIRS: 2, GATE: 3, PORTAL: 4 };
const COLOR = {
    BG: "#000", WALL: "#444", FLOOR: "#222",
    PLAYER: "#0F0", ENEMY: "#F00", DUMMY: "#F80",
    NPC: "#D0F", FOUNTAIN: "#00F", PORTAL: "#90F",
    TEXT: "#FFF", GOLD: "#FFD700", HEAL: "#0F0",
    LABEL: "rgba(255,255,255,0.5)"
};

// Global State
let canvas, ctx;
let map = [];
let entities = [];
let particles = [];
let shakeAmount = 0;
let isPaused = false;
let currentMerchant = null; // For shop tracking
let enemyImg = new Image();
let playerImg = new Image();

let globalState = {
    player: { 
        x: 10, y: 10, hp: 100, maxHp: 100, gold: 250, level: 1, 
        floor: 0, healsLeft: 5,
        inv: {
            general: [null, null, null, null, null],
            books: [null, null],
            treasure: [null, null, null]
        },
        equipment: {
            head: null, torso: null, arms: null, hands: null, 
            legs: null, feet: null, neck: null, ring1: null, ring2: null, weapon: null, bag: null
        },
        stats: { atk: 0, def: 0 }
    },
    dungeonPortal: null
};

/** * INITIALIZATION */
// We use DOMContentLoaded to ensure the HTML exists before we try to draw on it
document.addEventListener("DOMContentLoaded", function() {
    initGame();
});

function initGame() {
    canvas = document.getElementById('gameCanvas');
    enemyImg.src = 'Assets/IMG/goo-v2.png';
    playerImg.src = 'Assets/IMG/char.png';
    
    // SAFETY CHECK: If canvas is missing, stop here to prevent crash
    if (!canvas) {
        console.error("CRITICAL ERROR: <canvas id='gameCanvas'> not found in HTML.");
        return;
    }

    ctx = canvas.getContext('2d');
    
    // Resize handling for mobile to keep it crisp
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if(localStorage.getItem('dungeonSave')) {
        loadGame();
    } else {
        // Give starter scroll
        addToInventory(createItem('scroll_return'));
        enterTown();
    }

    updateStats();
    renderUI();
    requestAnimationFrame(renderLoop);
    window.addEventListener('keydown', handleInput);
    
    // Init Audio on first click/touch
    window.addEventListener('click', () => AudioSys.init(), {once:true});
    window.addEventListener('touchstart', () => AudioSys.init(), {once:true});
}

function resizeCanvas() {
    // Optional: Helps mobile scaling if CSS fails
    if(window.innerWidth < 900) {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
    }
}

function enterTown() {
    globalState.player.floor = 0;
    globalState.player.healsLeft = MAX_RESTS_PER_FLOOR;
    generateTownMap();
    saveGame();
}

function enterNextFloor() {
    globalState.player.floor++;
    globalState.player.healsLeft = MAX_RESTS_PER_FLOOR;
    entities = [];
    generateProceduralMap();
    let spawn = findEmptyTile();
    if (globalState.dungeonPortal && globalState.dungeonPortal.floor === globalState.player.floor) {
        map[globalState.dungeonPortal.y][globalState.dungeonPortal.x] = TILE.PORTAL;
    }
    globalState.player.x = spawn.x;
    globalState.player.y = spawn.y;
    spawnEntities();
    saveGame();
}

/** * ITEM & INVENTORY SYSTEM MOVED TO Assets/JS/Player/Inventory/inventory.js */

function saveGame() { localStorage.setItem('dungeonSave', JSON.stringify(globalState)); }

function loadGame() {
    try {
        const savedData = JSON.parse(localStorage.getItem('dungeonSave'));
        globalState = { ...globalState, ...savedData };
        globalState.player = { ...globalState.player, ...savedData.player };
        
        if (!globalState.player.equipment) globalState.player.equipment = { head:null, torso:null, arms:null, hands:null, legs:null, feet:null, neck:null, ring1:null, ring2:null, weapon: null, bag:null };
        // Migration: Ensure all slots exist
        else {
            const keys = ['head','torso','arms','hands','legs','feet','neck','ring1','ring2','weapon','bag'];
            keys.forEach(k => { if(globalState.player.equipment[k] === undefined) globalState.player.equipment[k] = null; });
        }
        if (!globalState.player.stats) globalState.player.stats = { atk:0, def:0 };
        
        // Fix stacks on old saves and undefined slots
        ['general','books','treasure'].forEach(c => {
             if(globalState.player.inv[c]) {
                 for(let i=0; i<globalState.player.inv[c].length; i++) {
                     if(globalState.player.inv[c][i] === undefined) globalState.player.inv[c][i] = null;
                     let item = globalState.player.inv[c][i];
                     if(item && item.stackable && !item.count) item.count = 1;
                 }
             }
        });

        map = globalState.map || []; 
        entities = globalState.entities || [];

        // Migration: Rename 'goblin' to 'goo'
        entities.forEach(e => {
            if (e.type === 'goblin') e.type = 'goo';
        });
    } catch (e) {
        console.error("Save Corrupt", e);
        enterTown();
    }
}

/** * RENDER */
let lastTime = 0;
function renderLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (shakeAmount > 0) shakeAmount -= 20 * dt;
    if (shakeAmount < 0) shakeAmount = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.life -= dt; p.y -= 20 * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
    draw();
    requestAnimationFrame(renderLoop);
}

function draw() {
    let sx = (Math.random() - 0.5) * shakeAmount;
    let sy = (Math.random() - 0.5) * shakeAmount;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Map
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tx = x*TILE_SIZE, ty = y*TILE_SIZE;
            let tile = map[y][x];
            if (tile === TILE.WALL) { ctx.fillStyle = COLOR.WALL; ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE); }
            else {
                ctx.fillStyle = COLOR.FLOOR; ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                if (tile === TILE.STAIRS || tile === TILE.GATE) {
                    ctx.fillStyle = COLOR.GOLD; ctx.fillRect(tx+4, ty+4, TILE_SIZE-8, TILE_SIZE-8);
                    if(tile === TILE.GATE) { ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2; ctx.strokeRect(tx+4, ty+4, TILE_SIZE-8, TILE_SIZE-8); }
                }
                else if (tile === TILE.PORTAL) {
                    ctx.fillStyle = COLOR.PORTAL; 
                    ctx.beginPath(); ctx.arc(tx+16, ty+16, 10, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = "#FFF"; ctx.stroke();
                }
            }
        }
    }
    
    // Labels in Town
    if (globalState.player.floor === 0) {
        ctx.fillStyle = COLOR.LABEL;
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("ALCHEMIST", 4*TILE_SIZE + 16, 4*TILE_SIZE - 5);
        ctx.fillText("BLACKSMITH", 4*TILE_SIZE + 16, 10*TILE_SIZE + 45);
        ctx.fillText("JEWELER", 16*TILE_SIZE + 16, 4*TILE_SIZE - 5);
        ctx.fillText("GAMBLER", 16*TILE_SIZE + 16, 10*TILE_SIZE + 45);
        ctx.fillText("GATE", 10*TILE_SIZE + 16, 1*TILE_SIZE - 5);
        ctx.fillText("FOUNTAIN", 10*TILE_SIZE + 16, 7*TILE_SIZE - 5);
        ctx.fillText("TRAINING", 16*TILE_SIZE + 16, 7*TILE_SIZE - 5);
    }
    
    // Entities
    entities.forEach(e => {
        if (e.type === 'goo') {
            if (enemyImg.complete && enemyImg.naturalHeight !== 0) {
                ctx.drawImage(enemyImg, e.x * TILE_SIZE, e.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                // Fallback while loading
                ctx.fillStyle = COLOR.ENEMY;
                ctx.fillRect(e.x*TILE_SIZE+4, e.y*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8);
            }
        } else {
            if(e.type === 'dummy') ctx.fillStyle = COLOR.DUMMY;
            else if(e.type === 'merchant') ctx.fillStyle = COLOR.NPC;
            else if(e.type === 'fountain') ctx.fillStyle = COLOR.FOUNTAIN;
            else ctx.fillStyle = "#FFF"; // Default fallback
            
            ctx.fillRect(e.x*TILE_SIZE+4, e.y*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8);
        }
    });
    
    // Player
    if (playerImg.complete && playerImg.naturalHeight !== 0) {
        ctx.drawImage(playerImg, globalState.player.x * TILE_SIZE, globalState.player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
        ctx.fillStyle = COLOR.PLAYER;
        ctx.fillRect(globalState.player.x*TILE_SIZE+4, globalState.player.y*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8);
    }
    
    // Particles
    ctx.textAlign = "left";
    particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.font = "bold 16px monospace"; ctx.fillText(p.text, p.x, p.y);
    });
    ctx.restore();
}

function addFloatingText(text, tx, ty, color) { particles.push({x: tx*TILE_SIZE+16, y: ty*TILE_SIZE, text: text, color: color, life: 1.0}); }
