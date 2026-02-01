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

