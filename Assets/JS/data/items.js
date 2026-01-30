/** * DATABASE */
const ITEM_TYPES = {
    WEAPON: 'weapon', ARMOR: 'armor', ACCESSORY: 'accessory', 
    POTION: 'potion', SCROLL: 'scroll', BAG: 'bag'
};

const SLOTS = {
    HEAD: 'head', TORSO: 'torso', ARMS: 'arms', HANDS: 'hands', 
    LEGS: 'legs', FEET: 'feet', NECK: 'neck', RING1: 'ring1', RING2: 'ring2', WEAPON: 'weapon', BAG: 'bag'
};

const ITEMS_DB = {
    // SCROLLS & POTIONS (Stackable)
    'scroll_return': { name: "Scroll of Return", type: ITEM_TYPES.SCROLL, icon: "📜", desc: "Teleport to Town. (3 Uses)", price: 50, charges: 3, stackable: true },
    'potion_small': { name: "Small Potion", type: ITEM_TYPES.POTION, icon: "🍷", desc: "Heal 20 HP", price: 10, heal: 20, stackable: true },
    
    // WEAPONS
    'dagger_iron': { name: "Iron Dagger", type: ITEM_TYPES.WEAPON, icon: "🗡️", desc: "Basic sidearm.", price: 30, atk: 2 },
    'sword_steel': { name: "Steel Sword", type: ITEM_TYPES.WEAPON, icon: "⚔️", desc: "Reliable damage.", price: 100, atk: 5 },
    'axe_battle': { name: "Battle Axe", type: ITEM_TYPES.WEAPON, icon: "🪓", desc: "Heavy hitter.", price: 250, atk: 8 },
    
    // ARMOR
    'helm_leather': { name: "Leather Cap", type: ITEM_TYPES.ARMOR, slot: SLOTS.HEAD, icon: "🧢", desc: "Light protection.", price: 20, def: 1 },
    'helm_iron': { name: "Iron Helm", type: ITEM_TYPES.ARMOR, slot: SLOTS.HEAD, icon: "🪖", desc: "Solid defense.", price: 80, def: 3 },
    'tunic_cloth': { name: "Cloth Tunic", type: ITEM_TYPES.ARMOR, slot: SLOTS.TORSO, icon: "👕", desc: "Better than nothing.", price: 15, def: 1 },
    'chainmail': { name: "Chainmail", type: ITEM_TYPES.ARMOR, slot: SLOTS.TORSO, icon: "⛓️", desc: "Flexible steel.", price: 150, def: 5 },
    'boots_leather': { name: "Leather Boots", type: ITEM_TYPES.ARMOR, slot: SLOTS.FEET, icon: "👢", desc: "Sturdy soles.", price: 25, def: 1 },
    'gloves_leather': { name: "Leather Gloves", type: ITEM_TYPES.ARMOR, slot: SLOTS.HANDS, icon: "🧤", desc: "Good grip.", price: 20, def: 1 },
    
    // ACCESSORIES
    'ring_vitality': { name: "Ring of Vitality", type: ITEM_TYPES.ACCESSORY, slot: SLOTS.RING1, icon: "💍", desc: "+10 Max HP", price: 200, hpBonus: 10 },
    'amulet_power': { name: "Amulet of Power", type: ITEM_TYPES.ACCESSORY, slot: SLOTS.NECK, icon: "📿", desc: "+2 ATK", price: 300, atk: 2 },
    
    // SPECIAL
    'void_pack': { name: "Void Pack", type: ITEM_TYPES.BAG, slot: SLOTS.BAG, icon: "🎒", desc: "Doubles Inventory Space.", price: 500, bagBonus: true },
    'mystery_box': { name: "Mystery Box", type: 'mystery', icon: "🎁", desc: "What's inside?", price: 50 }
};

const MERCHANTS = {
    'alchemist': { name: "Alchemist", inventory: ['potion_small', 'scroll_return'] },
    'blacksmith': { name: "Blacksmith", inventory: ['dagger_iron', 'sword_steel', 'helm_leather', 'helm_iron', 'tunic_cloth', 'chainmail', 'boots_leather', 'gloves_leather'] },
    'jeweler': { name: "Jeweler", inventory: ['ring_vitality', 'amulet_power', 'void_pack'] },
    'gambler': { name: "Gambler", inventory: ['mystery_box'] }
};
