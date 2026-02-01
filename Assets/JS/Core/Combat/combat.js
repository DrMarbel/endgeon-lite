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

