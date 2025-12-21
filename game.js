/** * AUDIO SYSTEM (Web Audio API) */
const AudioSys = {
    ctx: null,
    isPlaying: false,
    nextNoteTime: 0,
    init: function() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    toggle: function() {
        if (!this.ctx) this.init();
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.scheduleMusic();
            document.getElementById('btn-audio').innerText = "Disable Audio";
        } else {
            document.getElementById('btn-audio').innerText = "Enable Audio";
        }
    },
    beep: function(freq, type='square', dur=0.1) {
        if (!this.isPlaying || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    },
    // Procedural Dark Ambient Loop
    scheduleMusic: function() {
        if (!this.isPlaying) return;
        const scale = [110, 130.81, 146.83, 164.81, 196, 220]; // Minor Pentatonic A2
        while (this.nextNoteTime < this.ctx.currentTime + 1.0) {
            let freq = scale[Math.floor(Math.random() * scale.length)];
            let dur = 0.5 + Math.random();
            this.playTone(freq, this.nextNoteTime, dur);
            this.nextNoteTime += dur;
        }
        setTimeout(() => this.scheduleMusic(), 500);
    },
    playTone: function(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.03, time + 0.1);
        gain.gain.linearRampToValueAtTime(0, time + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
    }
};

/** * DATABASE */
const ITEM_TYPES = {
    WEAPON: 'weapon', ARMOR: 'armor', ACCESSORY: 'accessory', 
    POTION: 'potion', SCROLL: 'scroll', BAG: 'bag'
};

const SLOTS = {
    HEAD: 'head', TORSO: 'torso', ARMS: 'arms', HANDS: 'hands', 
    LEGS: 'legs', FEET: 'feet', NECK: 'neck', RING1: 'ring1', RING2: 'ring2', BAG: 'bag'
};

const ITEMS_DB = {
    // SCROLLS & POTIONS (Stackable)
    'scroll_return': { name: "Scroll of Return", type: ITEM_TYPES.SCROLL, icon: "📜", desc: "Teleport to Town. (3 Uses)", price: 50, charges: 3, stackable: true },
    'potion_small': { name: "Small Potion", type: ITEM_TYPES.POTION, icon: "🍷", desc: "Heal 20 HP", price: 10, heal: 20, stackable: true },
    
    // WEAPONS
    'dagger_iron': { name: "Iron Dagger", type: ITEM_TYPES.WEAPON, icon: "🗡️", desc: "Basic sidearm.", price: 30, atk: 2 },
    'sword_steel': { name: "Steel Sword", type: ITEM_TYPES.WEAPON, icon: "⚔️", desc: "Reliable damage.", price: 100, atk: 5 },
    'axe_battle': { name: "Battle Axe", type: ITEM_TYPES.WEAPON, icon: "🪓", desc: "Heavy hitter.", price: 250, atk: 8 },
    
    // ARMOR
    'helm_leather': { name: "Leather Cap", type: ITEM_TYPES.ARMOR, slot: SLOTS.HEAD, icon: "🧢", desc: "Light protection.", price: 20, def: 1 },
    'helm_iron': { name: "Iron Helm", type: ITEM_TYPES.ARMOR, slot: SLOTS.HEAD, icon: "🪖", desc: "Solid defense.", price: 80, def: 3 },
    'tunic_cloth': { name: "Cloth Tunic", type: ITEM_TYPES.ARMOR, slot: SLOTS.TORSO, icon: "👕", desc: "Better than nothing.", price: 15, def: 1 },
    'chainmail': { name: "Chainmail", type: ITEM_TYPES.ARMOR, slot: SLOTS.TORSO, icon: "⛓️", desc: "Flexible steel.", price: 150, def: 5 },
    'boots_leather': { name: "Leather Boots", type: ITEM_TYPES.ARMOR, slot: SLOTS.FEET, icon: "👢", desc: "Sturdy soles.", price: 25, def: 1 },
    'gloves_leather': { name: "Leather Gloves", type: ITEM_TYPES.ARMOR, slot: SLOTS.HANDS, icon: "🧤", desc: "Good grip.", price: 20, def: 1 },
    
    // ACCESSORIES
    'ring_vitality': { name: "Ring of Vitality", type: ITEM_TYPES.ACCESSORY, slot: SLOTS.RING1, icon: "💍", desc: "+10 Max HP", price: 200, hpBonus: 10 },
    'amulet_power': { name: "Amulet of Power", type: ITEM_TYPES.ACCESSORY, slot: SLOTS.NECK, icon: "📿", desc: "+2 ATK", price: 300, atk: 2 },
    
    // SPECIAL
    'void_pack': { name: "Void Pack", type: ITEM_TYPES.BAG, slot: SLOTS.BAG, icon: "🎒", desc: "Doubles Inventory Space.", price: 500, bagBonus: true },
    'mystery_box': { name: "Mystery Box", type: 'mystery', icon: "🎁", desc: "What's inside?", price: 50 }
};

const MERCHANTS = {
    'alchemist': { name: "Alchemist", inventory: ['potion_small', 'scroll_return'] },
    'blacksmith': { name: "Blacksmith", inventory: ['dagger_iron', 'sword_steel', 'helm_leather', 'helm_iron', 'tunic_cloth', 'chainmail', 'boots_leather', 'gloves_leather'] },
    'jeweler': { name: "Jeweler", inventory: ['ring_vitality', 'amulet_power', 'void_pack'] },
    'gambler': { name: "Gambler", inventory: ['mystery_box'] }
};

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
            legs: null, feet: null, neck: null, ring1: null, ring2: null, bag: null
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

/** * CORE LOGIC */
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

// UNIFIED INPUT HANDLER (Keyboard + Touch)
function sendAction(action) {
    if (globalState.player.hp <= 0 || isPaused) return;
    AudioSys.init(); // Ensure audio context is ready on touch

    let dx = 0; let dy = 0;

    if (action === 'up') dy = -1;
    if (action === 'down') dy = 1;
    if (action === 'left') dx = -1;
    if (action === 'right') dx = 1;
    
    if (action === 'wait') {
        handleRest();
        return;
    }

    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
        AudioSys.beep(200, 'triangle', 0.05); 
    }
}

function handleInput(e) {
    // Keyboard support
    let action = null;
    if (e.key === 'ArrowUp' || e.key === 'w') action = 'up';
    if (e.key === 'ArrowDown' || e.key === 's') action = 'down';
    if (e.key === 'ArrowLeft' || e.key === 'a') action = 'left';
    if (e.key === 'ArrowRight' || e.key === 'd') action = 'right';
    if (e.key === ' ') action = 'wait';
    
    if (action) {
        e.preventDefault(); 
        sendAction(action);
    }
}

function movePlayer(dx, dy) {
    let p = globalState.player;
    let tx = p.x + dx, ty = p.y + dy;

    // Boundary Check (Critical for mobile)
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return;

    if (map[ty][tx] === TILE.WALL) return;

    let entity = getEntityAt(tx, ty);
    if (entity) {
        interact(entity);
    } else {
        p.x = tx; p.y = ty;
        let tile = map[ty][tx];
        if (tile === TILE.STAIRS || tile === TILE.GATE) { enterNextFloor(); return; }
        if (tile === TILE.PORTAL) { usePortal(); return; }
    }
    
    if (p.floor > 0) processEnemyTurns();
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

function resizeInv(arr, size) {
    while(arr.length < size) arr.push(null);
    while(arr.length > size) arr.pop();
}

function useItem(cat, idx) {
    if(isPaused) return;
    let p = globalState.player;
    let item = p.inv[cat][idx];
    if (!item) return;

    // Equip
    if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.ARMOR || item.type === ITEM_TYPES.ACCESSORY || item.type === ITEM_TYPES.BAG) {
        let slot = item.slot || (item.type === ITEM_TYPES.WEAPON ? 'hands' : null);
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

function resizeInv(arr, size) {
    while(arr.length < size) arr.push(null);
    while(arr.length > size) arr.pop();
}

function useItem(cat, idx) {
    if(isPaused) return;
    let p = globalState.player;
    let item = p.inv[cat][idx];
    if (!item) return;

    // Equip
    if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.ARMOR || item.type === ITEM_TYPES.ACCESSORY || item.type === ITEM_TYPES.BAG) {
        let slot = item.slot || (item.type === ITEM_TYPES.WEAPON ? 'hands' : null);
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
/** * SHOPS & GAMBLING */
function openShop(type) {
    currentMerchant = MERCHANTS[type];
    if (!currentMerchant) return;
    
    isPaused = true;
    document.getElementById('overlay-shop').style.display = 'flex';
    document.getElementById('shop-title').innerText = currentMerchant.name;
    setShopMode('buy');
}

function setShopMode(mode) {
    document.getElementById('tab-buy').className = mode === 'buy' ? 'tab active' : 'tab';
    document.getElementById('tab-sell').className = mode === 'sell' ? 'tab active' : 'tab';
    
    let list = document.getElementById('shop-list');
    list.innerHTML = '';

    if (mode === 'buy') {
        renderShopBuy(list);
    } else {
        renderShopSell(list);
    }
}

function renderShopBuy(list) {
    currentMerchant.inventory.forEach(itemId => {
        let itemDB = ITEMS_DB[itemId];
        let row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `
            <div class="shop-details">
                <div style="font-weight:bold; color:#FFF;">${itemDB.icon} ${itemDB.name}</div>
                <div style="color:#888;">${itemDB.desc}</div>
            </div>
            <div>
                <div class="shop-price">${itemDB.price}g</div>
                <button class="btn btn-buy" onclick="buyItem('${itemId}', ${itemDB.price})">Buy</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function renderShopSell(list) {
    let p = globalState.player;
    // Iterate all inventory categories
    ['general', 'books', 'treasure'].forEach(cat => {
        p.inv[cat].forEach((item, idx) => {
            if (item) {
                let sellPrice = Math.floor(item.price * 0.5);
                let row = document.createElement('div');
                row.className = 'shop-item';
                let name = item.name + (item.count > 1 ? ` (x${item.count})` : "");
                row.innerHTML = `
                    <div class="shop-details">
                        <div style="font-weight:bold; color:#FFF;">${item.icon} ${name}</div>
                        <div style="color:#888;">Sell Value: ${sellPrice}g</div>
                    </div>
                    <div>
                        <button class="btn btn-buy" onclick="sellItem('${cat}', ${idx}, ${sellPrice})">Sell</button>
                    </div>
                `;
                list.appendChild(row);
            }
        });
    });
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

function closeShop() {
    document.getElementById('overlay-shop').style.display = 'none';
    isPaused = false;
    currentMerchant = null;
}

/** * UI MANAGERS */
// Generic Message Modal
function showMessage(text) {
    document.getElementById('msg-text').innerText = text;
    document.getElementById('overlay-msg').style.display = 'flex';
}
function closeMsg() {
    document.getElementById('overlay-msg').style.display = 'none';
}

// Confirmation Modal (Custom replacement for window.confirm)
function showConfirm(text, callback) {
    document.getElementById('confirm-text').innerText = text;
    document.getElementById('overlay-confirm').style.display = 'flex';
    
    // Unbind previous events to prevent stacking
    let btnYes = document.getElementById('btn-confirm-yes');
    let newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);
    
    newBtn.onclick = function() {
        document.getElementById('overlay-confirm').style.display = 'none';
        callback();
    };
}
function closeConfirm() {
    document.getElementById('overlay-confirm').style.display = 'none';
}

// System Menu & Save Wiping
function toggleMenu() {
    isPaused = !isPaused;
    document.getElementById('overlay-menu').style.display = isPaused ? 'flex' : 'none';
}
function toggleAudio() { AudioSys.toggle(); }

function requestWipe() {
    document.getElementById('overlay-menu').style.display = 'none';
    showConfirm("Are you sure? This will delete all progress.", wipeSaveImmediate);
}

function wipeSaveConfirm() {
    requestWipe();
}

function wipeSaveImmediate() {
    localStorage.removeItem('dungeonSave');
    location.reload();
}
function saveGame() { localStorage.setItem('dungeonSave', JSON.stringify(globalState)); }

function loadGame() {
    try {
        const savedData = JSON.parse(localStorage.getItem('dungeonSave'));
        globalState = { ...globalState, ...savedData };
        globalState.player = { ...globalState.player, ...savedData.player };
        
        if (!globalState.player.equipment) globalState.player.equipment = { head:null, torso:null, arms:null, hands:null, legs:null, feet:null, neck:null, ring1:null, ring2:null, bag:null };
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

function renderUI() {
    renderInventory();
    renderEquipment();
    
    let p = globalState.player;
    document.getElementById('floor-display').innerText = (p.floor===0?"Town": "Floor "+p.floor);
    document.getElementById('level-display').innerText = p.level;
    document.getElementById('hp-display').innerText = p.hp + "/" + p.maxHp;
    document.getElementById('rest-display').innerText = p.healsLeft;
    document.getElementById('gold-display').innerText = p.gold;
}

function renderEquipment() {
    const grid = document.getElementById('equip-grid');
    grid.innerHTML = '';
    const slotOrder = ['head','torso','arms','hands','legs','feet','neck','ring1','ring2','bag'];
    
    slotOrder.forEach(key => {
        let item = globalState.player.equipment[key];
        let div = document.createElement('div');
        div.innerHTML = `<div class="equip-label">${key.toUpperCase()}</div>`;
        let slotBox = document.createElement('div');
        slotBox.className = 'equip-slot' + (item ? ' filled' : '');
        slotBox.innerText = item ? (item.icon + " " + item.name) : "Empty";
        if (item) {
            slotBox.onmouseenter = (e) => showTooltip(e, item);
            slotBox.onmouseleave = hideTooltip;
            slotBox.onclick = () => unequipItem(key);
        }
        div.appendChild(slotBox);
        grid.appendChild(div);
    });
}

function renderInventory() {
    const panel = document.getElementById('inventory-panel');
    panel.innerHTML = '';
    const categories = [
        { id: 'general', label: 'Bag', arr: globalState.player.inv.general },
        { id: 'books', label: 'Scrolls', arr: globalState.player.inv.books },
        { id: 'treasure', label: 'Treasure', arr: globalState.player.inv.treasure }
    ];

    categories.forEach(cat => {
        let section = document.createElement('div');
        section.className = 'inv-section';
        section.innerHTML = `<div class="inv-label">${cat.label}</div>`;
        let grid = document.createElement('div');
        grid.className = 'inv-grid';

        cat.arr.forEach((item, idx) => {
            let slot = document.createElement('div');
            slot.className = 'slot';
            if (item) {
                slot.innerHTML = `<span class="item-icon">${item.icon}</span>`;
                // Show Count (Stack) OR Charges (Uses)
                if (item.count > 1) slot.innerHTML += `<span class="item-stack">${item.count}</span>`;
                else if (item.uses !== undefined) slot.innerHTML += `<span class="item-count">${item.uses}</span>`;
                
                slot.onmouseenter = (e) => showTooltip(e, item);
                slot.onmouseleave = hideTooltip;
                slot.onclick = () => useItem(cat.id, idx);
            }
            grid.appendChild(slot);
        });
        section.appendChild(grid);
        panel.appendChild(section);
    });
}

function showTooltip(e, item) {
    const tt = document.getElementById('tooltip');
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = e.clientY + 'px';
    let stats = "";
    if (item.atk) stats += `<div class="tt-stat">ATK: +${item.atk}</div>`;
    if (item.def) stats += `<div class="tt-stat">DEF: +${item.def}</div>`;
    if (item.hpBonus) stats += `<div class="tt-stat">HP: +${item.hpBonus}</div>`;
    
    tt.innerHTML = `<div class="tt-title">${item.name}</div><div class="tt-desc">${item.desc}</div>${stats}`;
}
function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }
/** * STANDARD RPG LOGIC */
function interact(entity) {
    if (entity.type === 'goblin' || entity.type === 'dummy') {
        attack(globalState.player, entity);
        shakeAmount = 3;
        AudioSys.beep(100, 'sawtooth', 0.1);
    } 
    else if (entity.shopType) {
        openShop(entity.shopType);
    }
    else if (entity.type === 'fountain') {
        globalState.player.hp = globalState.player.maxHp;
        addFloatingText("Refreshed!", globalState.player.x, globalState.player.y, "#0FF");
        AudioSys.beep(400, 'sine', 0.5);
        renderUI();
    }
}

function attack(attacker, defender) {
    let baseDmg = Math.floor(Math.random() * 5) + 1;
    let atkPower = (attacker === globalState.player) ? attacker.stats.atk : 0; 
    let defPower = (defender === globalState.player) ? defender.stats.def : 0;
    
    let totalDmg = Math.max(1, (baseDmg + atkPower) - defPower);
    defender.hp -= totalDmg;
    
    let color = (defender === globalState.player) ? "#F00" : "#FFF";
    addFloatingText("-" + totalDmg, defender.x, defender.y, color);
    
    if (defender === globalState.player) shakeAmount = 5;
    renderUI();

    if (defender.hp <= 0) {
        if (defender === globalState.player) {
            document.getElementById('death-msg').innerText = "Slain on Floor " + globalState.player.floor;
            document.getElementById('overlay-death').style.display = 'flex';
            isPaused = true;
        } else {
            const index = entities.indexOf(defender);
            if (index > -1) {
                entities.splice(index, 1);
                if (!['dummy', 'fountain'].includes(defender.type)) {
                    let gold = Math.floor(Math.random() * 10) + 1;
                    globalState.player.gold += gold;
                    addFloatingText("+" + gold + "g", defender.x, defender.y, COLOR.GOLD);
                    renderUI();
                }
            }
        }
    }
}

function castPortal() {
    let p = globalState.player;
    if (p.floor === 0) { addFloatingText("Already in Town", p.x, p.y, "#888"); return false; }
    let dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
    let spawn = null;
    for (let d of dirs) {
        let tx = p.x + d.x, ty = p.y + d.y;
        if (map[ty][tx] === TILE.FLOOR && !getEntityAt(tx, ty)) { spawn = {x:tx, y:ty}; break; }
    }
    if (spawn) {
        map[spawn.y][spawn.x] = TILE.PORTAL;
        globalState.dungeonPortal = { floor: p.floor, x: spawn.x, y: spawn.y };
        addFloatingText("Portal Opened", spawn.x, spawn.y, "#D0F");
        shakeAmount = 2;
        AudioSys.beep(300, 'sine', 1.0);
        draw();
        return true;
    }
    addFloatingText("No space!", p.x, p.y, "#888");
    return false;
}

function usePortal() {
    let p = globalState.player;
    if (p.floor > 0) {
        enterTown();
        p.x = 10; p.y = 10; 
        map[10][9] = TILE.PORTAL; 
        addFloatingText("To Town", p.x, p.y, "#D0F");
    } else {
        if (globalState.dungeonPortal) {
            p.floor = globalState.dungeonPortal.floor;
            entities = []; generateProceduralMap(); spawnEntities();
            let dp = globalState.dungeonPortal;
            map[dp.y][dp.x] = TILE.PORTAL;
            p.x = dp.x; p.y = dp.y;
            globalState.dungeonPortal = null; 
            map[dp.y][dp.x] = TILE.FLOOR; 
            addFloatingText("Portal Closed", p.x, p.y, "#888");
        } else addFloatingText("Portal Closed", p.x, p.y, "#888");
    }
    saveGame();
}

function handleRest() {
    let p = globalState.player;
    if (p.hp >= p.maxHp) { addFloatingText("HP Full", p.x, p.y, "#888"); return; }
    if (p.healsLeft > 0) {
        let heal = Math.floor(Math.random() * 5) + 1;
        p.hp = Math.min(p.hp + heal, p.maxHp);
        p.healsLeft--;
        addFloatingText("+" + heal, p.x, p.y, COLOR.HEAL);
        renderUI();
        if (p.floor > 0) {
            let moves = Math.floor(Math.random() * 3) + 1;
            shakeAmount = 2; 
            for(let i=0; i<moves; i++) processEnemyTurns();
        }
    } else {
        addFloatingText("Exhausted!", p.x, p.y, "#888");
        if (p.floor > 0) processEnemyTurns();
    }
    saveGame();
}

function processEnemyTurns() {
    let p = globalState.player;
    entities.forEach(entity => {
        if (entity.hp <= 0) return;
        if (['dummy', 'merchant', 'fountain'].includes(entity.type)) return;

        let dist = Math.abs(p.x - entity.x) + Math.abs(p.y - entity.y);
        if (dist > ENEMY_VISION_RANGE) return;
        if (dist === 1) { attack(entity, p); return; }

        let dx = Math.sign(p.x - entity.x);
        let dy = Math.sign(p.y - entity.y);
        if (dx !== 0 && !isBlocked(entity.x + dx, entity.y)) entity.x += dx;
        else if (dy !== 0 && !isBlocked(entity.x, entity.y + dy)) entity.y += dy;
    });
}

/** * MAP GENERATION */
function generateTownMap() {
    entities = []; map = [];
    globalState.map = map; globalState.entities = entities;
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) row.push((x===0||x===COLS-1||y===0||y===ROWS-1)?TILE.WALL:TILE.FLOOR);
        map.push(row);
    }
    map[1][10] = TILE.GATE; 
    entities.push({x: 16, y: 7, hp: 9999, maxHp: 9999, type: 'dummy'});
    entities.push({x: 10, y: 7, hp: 1, maxHp: 1, type: 'fountain'});
    entities.push({x: 4, y: 4, type: 'merchant', shopType: 'alchemist'});
    entities.push({x: 4, y: 10, type: 'merchant', shopType: 'blacksmith'});
    entities.push({x: 16, y: 4, type: 'merchant', shopType: 'jeweler'});
    entities.push({x: 16, y: 10, type: 'merchant', shopType: 'gambler'});
    
    if (globalState.dungeonPortal) map[10][9] = TILE.PORTAL;
    globalState.player.x = 10; globalState.player.y = 12;
}

function generateProceduralMap() {
    map = []; globalState.map = map;
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) row.push(TILE.WALL);
        map.push(row);
    }
    let digger = {x: Math.floor(COLS/2), y: Math.floor(ROWS/2)};
    let floors = 0;
    while(floors < (ROWS * COLS) * 0.45) {
        if(map[digger.y][digger.x] === TILE.WALL) { map[digger.y][digger.x] = TILE.FLOOR; floors++; }
        let dir = Math.floor(Math.random() * 4);
        if (dir === 0 && digger.y > 1) digger.y--;
        if (dir === 1 && digger.y < ROWS - 2) digger.y++;
        if (dir === 2 && digger.x > 1) digger.x--;
        if (dir === 3 && digger.x < COLS - 2) digger.x++;
    }
    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            if (map[y][x] === TILE.WALL) {
                let n = 0;
                if (map[y-1][x]===TILE.FLOOR) n++; if (map[y+1][x]===TILE.FLOOR) n++;
                if (map[y][x-1]===TILE.FLOOR) n++; if (map[y][x+1]===TILE.FLOOR) n++;
                if (n >= 3) map[y][x] = TILE.FLOOR;
            }
        }
    }
    let exit = findEmptyTile(); map[exit.y][exit.x] = TILE.STAIRS;
}

function spawnEntities() {
    for(let i=0; i<MOBS_PER_LEVEL; i++) {
        let empty = findEmptyTile();
        if (Math.abs(empty.x - globalState.player.x) + Math.abs(empty.y - globalState.player.y) < 5) { i--; continue; }
        entities.push({x: empty.x, y: empty.y, hp: 20 + (globalState.player.floor * 2), maxHp: 20, type: 'goblin'});
    }
    globalState.entities = entities;
}

function findEmptyTile() {
    let attempts = 0;
    while(attempts < 1000) {
        let x = Math.floor(Math.random() * COLS);
        let y = Math.floor(Math.random() * ROWS);
        if (map[y][x] === TILE.FLOOR && !getEntityAt(x, y)) return {x, y};
        attempts++;
    }
    return {x: 1, y: 1};
}
function isBlocked(x, y) { return map[y][x] === TILE.WALL || getEntityAt(x, y); }
function getEntityAt(x, y) { return entities.find(e => e.x === x && e.y === y); }
function addFloatingText(text, tx, ty, color) { particles.push({x: tx*TILE_SIZE+16, y: ty*TILE_SIZE, text: text, color: color, life: 1.0}); }

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