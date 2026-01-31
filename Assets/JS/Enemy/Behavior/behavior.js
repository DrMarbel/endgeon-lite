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
