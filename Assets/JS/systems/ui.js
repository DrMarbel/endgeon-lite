/** * UI MANAGERS */
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
    const slotOrder = ['head','torso','arms','hands','legs','feet','neck','ring1','ring2', 'weapon', 'bag'];
    
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

function resizeInv(arr, size) {
    while(arr.length < size) arr.push(null);
    while(arr.length > size) arr.pop();
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

function closeShop() {
    document.getElementById('overlay-shop').style.display = 'none';
    isPaused = false;
    currentMerchant = null;
}

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
