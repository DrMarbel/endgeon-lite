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
    let emptyIdx = inv.findIndex(slot => slot === null || slot === undefined);
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
            let oldItem = p.equipment[slot] || null;
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
    let emptyIdx = inv.findIndex(slot => slot === null || slot === undefined);
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
