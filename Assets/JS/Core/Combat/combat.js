/** * STANDARD RPG LOGIC */
function interact(entity) {
    if (entity.type === 'goo' || entity.type === 'dummy') {
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
