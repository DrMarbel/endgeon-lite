<!--
    Project: Endgeon Lite
    Developer: Martin Belt
    Date Created: 01.13.2026
    Date Modified: 01.29.2026
-->

# Endgeon Lite

Endgeon Lite is a compact, offline roguelike demo built with HTML5 canvas and vanilla JavaScript.

## Features (current)

- Procedural dungeon generation and simple AI enemies.
- Inventory and equipment system with stackable items.
- Merchant/shop interactions (buy/sell UI).
- Small terminal-like UI and floating combat text.
- Web Audio procedural ambient loop and short sfx beeps.
- Save/load via `localStorage`.
- Lightweight, single-file playable demo (now modularized into JS files).

## In-progress / Next updates

- Replace remaining inline DOM event handlers with unobtrusive listeners.
- Break UI into smaller modules and add unit-style tests for core logic.
- Add optional service-worker for full offline caching (PWA offline support).
- Add scalable assets and icons; provide packaged desktop/mobile builds.

## How to run

Open `index.html` in a modern browser. No build step required.
