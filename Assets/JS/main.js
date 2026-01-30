/** * GAME CONSTANTS */
const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 15;
const MOBS_PER_LEVEL = 6;
const ENEMY_VISION_RANGE = 7;
const MAX_RESTS_PER_FLOOR = 5;
const MAX_STACK = 16;

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

/** * ITEM & INVENTORY SYSTEM */
function createItem(id) {
    if (!ITEMS_DB[id]) return null;
    let item = { ...ITEMS_DB[id], id: id };
    if (item.charges !== undefined) item.uses = item.charges;
    if (item.stackable) item.count = 1; 
    return item;
}

function addToInventory(item) {
    let p = globalState.player;
    let cat = getCategory(item);
    let inv = p.inv[cat];

    // 1. Try to Stack
    if (item.stackable) {
        for (let i = 0; i < inv.length; i++) {
            if (inv[i] && inv[i].id === item.id && inv[i].count < MAX_STACK) {
                inv[i].count++;
                return true;
            }
        }
    }

    // 2. Try to find empty slot
    let emptyIdx = inv.indexOf(null);
    if (emptyIdx !== -1) {
        inv[emptyIdx] = item;
        return true;
    }

    return false; // Full
}

function getCategory(item) {
    if (item.type === ITEM_TYPES.SCROLL) return 'books';
    if (item.type === ITEM_TYPES.POTION) return 'general'; 
    return 'general'; 
}

function updateStats() {
    let p = globalState.player;
    let atk = 0; let def = 0; let bonusHp = 0; let bagSpace = 1;

    for (let key in p.equipment) {
        let item = p.equipment[key];
        if (item) {
            if (item.atk) atk += item.atk;
            if (item.def) def += item.def;
            if (item.hpBonus) bonusHp += item.hpBonus;
            if (item.bagBonus) bagSpace = 2;
        }
    }
    
    let currentBagSize = p.inv.general.length;
    let targetBagSize = 5 * bagSpace;
    
    if (currentBagSize !== targetBagSize) {
        resizeInv(p.inv.general, 5 * bagSpace);
        resizeInv(p.inv.books, 2 * bagSpace);
        resizeInv(p.inv.treasure, 3 * bagSpace);
        renderUI();
    }

    p.stats.atk = atk; p.stats.def = def;
    p.maxHp = 100 + bonusHp;
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    
    document.getElementById('atk-display').innerText = atk;
    document.getElementById('def-display').innerText = def;
    document.getElementById('hp-display').innerText = p.hp + "/" + p.maxHp;
}

function useItem(cat, idx) {
    if(isPaused) return;
    let p = globalState.player;
    let item = p.inv[cat][idx];
    if (!item) return;

    // Equip
    if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.ARMOR || item.type === ITEM_TYPES.ACCESSORY || item.type === ITEM_TYPES.BAG) {
        let slot = item.slot || (item.type === ITEM_TYPES.WEAPON ? 'weapon' : null);
        if (slot) {
            let oldItem = p.equipment[slot];
            p.equipment[slot] = item;
            p.inv[cat][idx] = oldItem;
            addFloatingText("Equipped", p.x, p.y, "#FFF");
            AudioSys.beep(400, 'square', 0.1);
            updateStats(); renderUI(); saveGame();
        }
        return;
    }

    // Scroll
    if (item.type === ITEM_TYPES.SCROLL && item.id === 'scroll_return') {
        if(castPortal()) {
            item.uses--;
            if(item.uses <= 0) consumeStack(cat, idx);
            renderUI(); saveGame();
        }
        return;
    }

    // Potion
    if (item.type === ITEM_TYPES.POTION) {
        if (p.hp >= p.maxHp) { addFloatingText("Full HP", p.x, p.y, "#888"); return; }
        p.hp = Math.min(p.hp + item.heal, p.maxHp);
        addFloatingText("+" + item.heal, p.x, p.y, COLOR.HEAL);
        AudioSys.beep(600, 'sine', 0.2);
        consumeStack(cat, idx);
        renderUI(); saveGame();
        return;
    }
}

function consumeStack(cat, idx) {
    let p = globalState.player;
    let item = p.inv[cat][idx];
    if (item.stackable && item.count > 1) {
        item.count--;
    } else {
        p.inv[cat][idx] = null;
    }
}

function unequipItem(slot) {
    if(isPaused) return;
    let p = globalState.player;
    let item = p.equipment[slot];
    if (!item) return;

    // Always goes to general bag
    let inv = p.inv.general;
    let emptyIdx = inv.indexOf(null);
    if (emptyIdx === -1) {
        showMessage("Bag Full!");
        return;
    }

    inv[emptyIdx] = item;
    p.equipment[slot] = null;
    updateStats(); renderUI(); saveGame();
}

function buyItem(itemId, price) {
    let p = globalState.player;
    if (p.gold < price) {
        showMessage("Not enough gold!");
        return;
    }
    
    let itemToAdd = null;
    if (itemId === 'mystery_box') {
        let keys = Object.keys(ITEMS_DB).filter(k => k !== 'mystery_box' && k !== 'void_pack');
        let randKey = keys[Math.floor(Math.random() * keys.length)];
        itemToAdd = createItem(randKey);
    } else {
        itemToAdd = createItem(itemId);
    }

    if (addToInventory(itemToAdd)) {
        p.gold -= price;
        AudioSys.beep(800, 'square', 0.1);
        showMessage(`Bought ${itemToAdd.name} for ${price}g`);
        renderUI(); saveGame();
    } else {
        showMessage("Inventory full!");
    }
}

function sellItem(cat, idx, price) {
    let p = globalState.player;
    let item = p.inv[cat][idx];
    if (!item) return;

    p.gold += price;
    consumeStack(cat, idx);
    AudioSys.beep(600, 'square', 0.1);
    showMessage(`Sold ${item.name} for ${price}g`);
    
    renderUI(); saveGame();
    setShopMode('sell'); // Re-render list
}

function saveGame() { localStorage.setItem('dungeonSave', JSON.stringify(globalState)); }

function loadGame() {
    try {
        const savedData = JSON.parse(localStorage.getItem('dungeonSave'));
        globalState = { ...globalState, ...savedData };
        globalState.player = { ...globalState.player, ...savedData.player };
        
        if (!globalState.player.equipment) globalState.player.equipment = { head:null, torso:null, arms:null, hands:null, legs:null, feet:null, neck:null, ring1:null, ring2:null, weapon: null, bag:null };
        if (!globalState.player.stats) globalState.player.stats = { atk:0, def:0 };
        
        // Fix stacks on old saves
        ['general','books','treasure'].forEach(c => {
             if(globalState.player.inv[c]) {
                 globalState.player.inv[c].forEach(i => {
                     if(i && i.stackable && !i.count) i.count = 1;
                 });
             }
        });

        map = globalState.map || []; 
        entities = globalState.entities || [];
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
        if(e.type === 'goblin') ctx.fillStyle = COLOR.ENEMY;
        else if(e.type === 'dummy') ctx.fillStyle = COLOR.DUMMY;
        else if(e.type === 'merchant') ctx.fillStyle = COLOR.NPC;
        else if(e.type === 'fountain') ctx.fillStyle = COLOR.FOUNTAIN;
        ctx.fillRect(e.x*TILE_SIZE+4, e.y*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8);
    });
    
    // Player
    ctx.fillStyle = COLOR.PLAYER;
    ctx.fillRect(globalState.player.x*TILE_SIZE+4, globalState.player.y*TILE_SIZE+4, TILE_SIZE-8, TILE_SIZE-8);
    
    // Particles
    ctx.textAlign = "left";
    particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.font = "bold 16px monospace"; ctx.fillText(p.text, p.x, p.y);
    });
    ctx.restore();
}

function addFloatingText(text, tx, ty, color) { particles.push({x: tx*TILE_SIZE+16, y: ty*TILE_SIZE, text: text, color: color, life: 1.0}); }
