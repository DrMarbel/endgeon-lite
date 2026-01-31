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

function isBlocked(x, y) { return map[y][x] === TILE.WALL || getEntityAt(x, y); }
function getEntityAt(x, y) { return entities.find(e => e.x === x && e.y === y); }
