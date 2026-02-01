/** * PLAYER ACTIONS & BEHAVIOR */

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
