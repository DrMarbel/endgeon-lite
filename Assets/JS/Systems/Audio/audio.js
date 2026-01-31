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
