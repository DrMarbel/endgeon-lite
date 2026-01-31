function spawnEntities() {
    for(let i=0; i<MOBS_PER_LEVEL; i++) {
        let empty = findEmptyTile();
        if (Math.abs(empty.x - globalState.player.x) + Math.abs(empty.y - globalState.player.y) < 5) { i--; continue; }
        entities.push({x: empty.x, y: empty.y, hp: 20 + (globalState.player.floor * 2), maxHp: 20, type: 'goo'});
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
