// Good Witch: an original game and story by Amy.
// A thunderstorm broke the witch's wand and broom. She fell onto a monster island and hit the ground
// so hard that she forgot all her spells except Fire. Ten masters live on the islands nearby.
// Help each master with a mission (often helping villagers in trouble) and they teach you a spell.
// Then buy a new broom and fly home!
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  // ---------- Settings ----------
  const WORLD_W = 2400;
  const WORLD_H = 1800;
  const CX = WORLD_W / 2, CY = WORLD_H / 2;
  const START_HEARTS = 5;
  const MAX_HEARTS = 10;
  const WITCH_SPEED = 230;
  const HURT_TIME = 1.2;
  const FULL_CHARGE = 0.9;
  const JUMP_TIME = 1.0;
  const GUARD_SIGHT = 260;      // island monsters attack when you come this close
  const GUARD_LEASH = 650;      // and go back home if you get this far away
  const DAY_LEN = 150;
  const NIGHT_LEN = 80;
  const SLEEP_FROM = DAY_LEN - 25;
  const HOUSE_SHIELD_R = 200;
  const VILLAGE_R = 230;
  const MASTER_SAFE_R = 100;
  const WATER_TIME = 1.2;       // seconds to water a flower
  const TRAVEL_HOLD = 3;        // hold a spell this many seconds to fly to another island
  const MAX_AMMO = 30;         // magic shots before you need to recharge with a password
  // How the witch travels depends on the spell you hold
  const TRAVEL_STYLE = { fire: "rocket", meteor: "rocket", star: "rocket", lightning: "zap", tornado: "spin" };
  const TRAVEL_WORDS = { rocket: "🚀 Blast off!", zap: "⚡ ZAP!", spin: "🌪️ Whoosh!", float: "✨ Floating away..." };

  const MONSTERS = {
    slime:  { hearts: 1,  speed: 40, radius: 22, coins: 2,  dodge: 0,    emoji: null },
    bat:    { hearts: 1,  speed: 75, radius: 18, coins: 3,  dodge: 0.5,  emoji: "🦇", flying: true },
    ghost:  { hearts: 2,  speed: 55, radius: 22, coins: 5,  dodge: 0.35, emoji: "👻", flying: true },
    wolf:   { hearts: 2,  speed: 85, radius: 22, coins: 4,  dodge: 0.2,  emoji: "🐺" },
    ogre:   { hearts: 3,  speed: 32, radius: 30, coins: 6,  dodge: 0,    emoji: "👹" },
    dragon: { hearts: 10, speed: 30, radius: 44, coins: 40, dodge: 0,    emoji: "🐉", boss: true },
  };

  // All the spells, in the order you learn them. kind: shot = you aim it, self = on yourself, area = lands where you aim
  const SPELLS = {
    fire:      { icon: "🔥", name: "Fire",         kind: "shot", color: "#ffb347", core: "#fff6c2", dmg: 1, speed: 1,    knock: 260, desc: "A trusty fireball. The one spell you remembered!" },
    ice:       { icon: "❄️", name: "Ice",          kind: "shot", color: "#8fe3ff", core: "#ffffff", dmg: 1, speed: 0.9,  knock: 120, freeze: 3, desc: "Freezes monsters so they move very slowly." },
    wind:      { icon: "💨", name: "Wind",         kind: "shot", color: "#d8ffe6", core: "#ffffff", dmg: 1, speed: 1.1,  knock: 650, spread: 3, short: true, desc: "Three gusts that blow monsters far away." },
    vine:      { icon: "🌿", name: "Vine",         kind: "shot", color: "#7ee07e", core: "#e9ffe0", dmg: 1, speed: 0.9,  knock: 0,   root: 4, desc: "Vines grab monsters and hold them still." },
    heal:      { icon: "💚", name: "Heal",         kind: "self", cooldown: 30, desc: "Heals 2 of your hearts. Needs 30 seconds to recharge." },
    wave:      { icon: "🌊", name: "Wave",         kind: "shot", color: "#5ab8ff", core: "#e6f6ff", dmg: 1, speed: 0.8,  knock: 520, pierce: true, big: 2.2, desc: "A huge wave that washes through monsters." },
    shield:    { icon: "🛡️", name: "Magic Shield", kind: "self", cooldown: 18, desc: "A bubble protects you for 5 seconds. Monsters bounce off!" },
    lightning: { icon: "⚡", name: "Lightning",    kind: "shot", color: "#fff36b", core: "#ffffff", dmg: 2, speed: 1.6,  knock: 150, pierce: true, desc: "Super fast. Zaps through monsters and takes 2 hearts." },
    tornado:   { icon: "🌪️", name: "Tornado",      kind: "shot", color: "#c7d3dd", core: "#ffffff", dmg: 1, speed: 0.4,  knock: 160, pierce: true, multi: true, big: 1.8, life: 2.4, desc: "A slow spinning tornado that keeps hitting monsters." },
    meteor:    { icon: "☄️", name: "Meteor",       kind: "area", color: "#ff7043", dmg: 3, cooldown: 3, desc: "A meteor crashes down where you aim. Hits every monster nearby!" },
    star:      { icon: "⭐", name: "Star",         kind: "shot", color: "#ffe066", core: "#ffffff", dmg: 3, speed: 0.9,  knock: 220, homing: true, desc: "Magic stars that chase monsters and take 3 hearts." },
  };
  const SPELL_ORDER = ["fire", "ice", "wind", "vine", "heal", "wave", "shield", "lightning", "tornado", "meteor", "star"];
  const SPELL_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"];
  const keyFor = (spell) => SPELL_KEYS[SPELL_ORDER.indexOf(spell)];

  // Secret spell passwords, made of magic runes. Stronger spells have longer passwords.
  const RUNES = ["🌙", "⭐", "💧", "🍃", "🔥", "💎"];
  const PASSWORDS = {
    fire:      [4, 1, 4],
    ice:       [2, 0, 2],
    wind:      [3, 3, 1],
    vine:      [3, 2, 3, 5],
    heal:      [2, 3, 1, 2],
    wave:      [2, 2, 0, 2],
    shield:    [5, 0, 5, 1],
    lightning: [1, 4, 1, 0, 4],
    tornado:   [3, 0, 3, 5, 3],
    meteor:    [4, 1, 4, 5, 0],
    star:      [1, 0, 1, 5, 1],
  };
  let lessonToken = 0; // makes old timers stop when a new lesson step starts

  // The ten masters. Each teaches one spell after you help with their mission.
  // kind: clear = help villagers by beating the monsters on a mission island
  //       collect = find things on the master's island, flowers = water flowers, lamps = light lamps with Fire
  //       boss = get something back from a big monster
  const MASTERS = [
    { id: "snowman", island: "snow", emoji: "⛄", name: "Snowman Master", spell: "ice", kind: "clear", where: "farm",
      ask: "Oh no! The farmers on 🌾 Farm Island need help. Slimes are eating all their vegetables! Please fly there and chase the monsters away.",
      thanks: "The farmers sent me a letter. They're safe and happy! Thank you! Now let me teach you my spell.",
      done: "Stay cool, little witch!" },
    { id: "penguin", island: "iceberg", emoji: "🐧", name: "Penguin Master", spell: "wind", kind: "collect", item: "chick", need: 4,
      ask: "My 4 baby penguins wandered off across the snow, and there are monsters everywhere! Can you find them for me?",
      thanks: "My babies! All four of them! Thank you so much. Let me teach you my spell.",
      done: "Waddle on, little witch!" },
    { id: "elf", island: "jungle", emoji: "🧝‍♀️", name: "Elf Master", spell: "vine", kind: "flowers", need: 6,
      ask: "Monsters stomped all over my garden! Could you water my 6 wilted flowers 🥀? Just stand next to each one for a moment.",
      thanks: "Look how happy my flowers are! Thank you! Let me teach you my spell.",
      done: "May the forest keep you safe!" },
    { id: "panda", island: "bamboo", emoji: "🐼", name: "Panda Master", spell: "heal", kind: "clear", where: "fishing",
      ask: "The fishermen at 🎣 Fishing Village can't go fishing anymore. Wolves chase them every day! Will you help them?",
      thanks: "The fishermen sent me a big fish to say thank you! You're very kind. Let me teach you my spell.",
      done: "Take care of yourself, little witch!" },
    { id: "mermaid", island: "coral", emoji: "🧜‍♀️", name: "Mermaid Master", spell: "wave", kind: "collect", item: "pearl", need: 5,
      ask: "A big wave scattered my 5 pearls all over the island. Could you find them for me?",
      thanks: "My pearls! All five! Thank you so much. Let me teach you my spell.",
      done: "Swim safe, little witch!" },
    { id: "turtle", island: "turtle", emoji: "🐢", name: "Turtle Master", spell: "shield", kind: "clear", where: "mushroom",
      ask: "Ghosts are scaring the children on 🍄 Mushroom Island every night. Nobody can sleep! Please chase the ghosts away.",
      thanks: "The children are sleeping happily again. Thank you! Let me teach you my spell. Slowly... carefully...",
      done: "Slow and steady, little witch!" },
    { id: "wizard", island: "storm", emoji: "🧙‍♂️", name: "Thunder Wizard", spell: "lightning", kind: "lamps", need: 4,
      ask: "The storm blew out my 4 magic lamps 🏮. Could you light them again with your 🔥 Fire spell? Only fire works!",
      thanks: "My lamps are glowing again! Thank you! Let me teach you my spell.",
      done: "Crackle and boom, good luck!" },
    { id: "genie", island: "desert", emoji: "🧞", name: "Genie Master", spell: "tornado", kind: "clear", where: "castle",
      ask: "Ogres took over 🏰 Castle Island and locked the king and queen outside! Please help them get their castle back.",
      thanks: "The king and queen are home again! Your wish is my command: let me teach you my spell.",
      done: "Whoosh! Good luck, little witch!" },
    { id: "owl", island: "moon", emoji: "🦉", name: "Owl Master", spell: "meteor", kind: "collect", item: "book", need: 3,
      ask: "Hoo-hoo! Bats stole my 3 magic books 📕 and dropped them all over this island. Could you find them?",
      thanks: "My books! Now I can read again. Hoo-hoo, thank you! Let me teach you my spell.",
      done: "Hoo-hoo! Be wise, little witch!" },
    { id: "fairy", island: "star", emoji: "🧚‍♀️", name: "Star Fairy", spell: "star", kind: "boss", where: "dragon",
      ask: "A big dragon 🐉 on 🌋 Dragon Island stole the star from my wand, and it scares the villagers there too! Please get my star back. Be very careful!",
      thanks: "My wand star! You got it back from the dragon! Thank you! Let me teach you my strongest spell.",
      done: "Shine bright, good witch!" },
  ];
  const masterById = (id) => MASTERS.find((m) => m.id === id);

  // The islands
  const ISLANDS = [
    { id: "home", name: "Home Island", icon: "🏠", rx: 1050, ry: 780, seed: 2026, trees: 34,
      pal: { sea: "#2a78c2", sand: "#e9d6a0", grass: "#4f9a4a", leaf: "#2f7a3a", leaf2: "#3d9147", dots: ["#ffd6f0", "#fff3a6", "#c9d8ff", "#ffffff"] },
      residents: ["slime", "slime", "slime", "slime", "slime", "slime", "bat", "bat", "bat", "wolf", "wolf", "ogre"] },
    // Master islands (each one is harder than the last)
    { id: "snow", name: "Snow Island", icon: "❄️", tier: 1, rx: 740, ry: 550, seed: 11, trees: 14, masters: true,
      pal: { sea: "#4a8cc9", sand: "#d9e4ee", grass: "#eef5fb", leaf: "#2f6a55", leaf2: "#ffffff", dots: ["#cfe6ff", "#ffffff"] },
      residents: ["slime", "slime", "slime", "slime", "bat", "bat", "bat", "wolf"] },
    { id: "iceberg", name: "Iceberg Island", icon: "🧊", tier: 2, rx: 700, ry: 520, seed: 12, trees: 8, masters: true,
      pal: { sea: "#3f86c4", sand: "#cfe3f2", grass: "#e3f1fb", leaf: "#3a7a6a", leaf2: "#e9f6ff", dots: ["#bfe0ff", "#ffffff"] },
      residents: ["slime", "slime", "slime", "slime", "bat", "bat", "bat", "wolf", "wolf"] },
    { id: "jungle", name: "Jungle Island", icon: "🌳", tier: 3, rx: 760, ry: 560, seed: 22, trees: 26, masters: true,
      pal: { sea: "#2b7f9e", sand: "#d8c58f", grass: "#2f8a3a", leaf: "#1f6b2a", leaf2: "#2e8f3a", dots: ["#ff7aa8", "#ffd257", "#ffffff"] },
      residents: ["slime", "slime", "slime", "wolf", "wolf", "wolf", "ogre", "ogre", "bat", "bat"] },
    { id: "bamboo", name: "Bamboo Island", icon: "🎋", tier: 4, rx: 760, ry: 560, seed: 24, trees: 24, masters: true,
      pal: { sea: "#2b8a8a", sand: "#d9cf9a", grass: "#6fae4a", leaf: "#3f8f3a", leaf2: "#8fd16a", dots: ["#ffffff", "#ffd257"] },
      residents: ["wolf", "wolf", "wolf", "ogre", "ogre", "bat", "bat", "bat", "slime", "slime", "ghost"] },
    { id: "coral", name: "Coral Island", icon: "🐚", tier: 5, rx: 760, ry: 560, seed: 33, trees: 8, masters: true,
      pal: { sea: "#1f9bb0", sand: "#f6d7c3", grass: "#efc7a8", leaf: "#e07a8a", leaf2: "#f4a3b0", dots: ["#ffffff", "#ff9aa8", "#ffd1dc"] },
      residents: ["ghost", "ghost", "ghost", "bat", "bat", "bat", "ogre", "ogre", "wolf", "slime", "slime"] },
    { id: "turtle", name: "Turtle Beach", icon: "🏖️", tier: 6, rx: 760, ry: 560, seed: 36, trees: 8, masters: true,
      pal: { sea: "#1fa3c4", sand: "#f3dfae", grass: "#cfe0a0", leaf: "#4caf50", leaf2: "#7ccf6a", dots: ["#ffffff", "#ffb3c1"] },
      residents: ["ghost", "ghost", "ghost", "wolf", "wolf", "wolf", "ogre", "ogre", "ogre", "bat", "bat"] },
    { id: "storm", name: "Storm Island", icon: "⛈️", tier: 7, rx: 780, ry: 580, seed: 44, trees: 18, masters: true,
      pal: { sea: "#36506b", sand: "#9aa1a8", grass: "#5b6b63", leaf: "#3d4a44", leaf2: "#55635b", dots: ["#d0d7de", "#fff36b"] },
      residents: ["wolf", "wolf", "wolf", "wolf", "ghost", "ghost", "ghost", "ogre", "ogre", "ogre", "bat", "bat"] },
    { id: "desert", name: "Desert Island", icon: "🏜️", tier: 8, rx: 780, ry: 580, seed: 48, trees: 6, masters: true,
      pal: { sea: "#2f86b5", sand: "#e8c98a", grass: "#e2bb73", leaf: "#6a8a3a", leaf2: "#8aa84a", dots: ["#d9a55b", "#c48a40"] },
      residents: ["ogre", "ogre", "ogre", "ogre", "wolf", "wolf", "wolf", "wolf", "ghost", "ghost", "bat", "bat"] },
    { id: "moon", name: "Moon Island", icon: "🌙", tier: 9, rx: 780, ry: 580, seed: 52, trees: 14, masters: true,
      pal: { sea: "#1a2247", sand: "#5a5f8a", grass: "#2f3561", leaf: "#3d4a8a", leaf2: "#6a78c9", dots: ["#ffffff", "#c9d8ff"] },
      residents: ["ghost", "ghost", "ghost", "ghost", "ghost", "ogre", "ogre", "ogre", "wolf", "wolf", "wolf", "bat", "bat"] },
    { id: "star", name: "Star Island", icon: "✨", tier: 10, rx: 800, ry: 600, seed: 55, trees: 16, masters: true,
      pal: { sea: "#241a45", sand: "#6d5c9a", grass: "#3b2f5a", leaf: "#5b3f8f", leaf2: "#8a6bd1", dots: ["#ffe066", "#ffffff", "#c9b9ff"] },
      residents: ["ogre", "ogre", "ogre", "ogre", "ghost", "ghost", "ghost", "ghost", "wolf", "wolf", "wolf", "wolf", "bat", "bat"] },
    // Mission islands: villagers in trouble! They show up on your island map once a master asks you to go.
    { id: "farm", name: "Farm Island", icon: "🌾", tier: 1, rx: 700, ry: 520, seed: 61, trees: 8, mission: "snowman",
      pal: { sea: "#2f7fbf", sand: "#e6d29a", grass: "#7fb24a", leaf: "#4c8a2f", leaf2: "#6aa83f", dots: ["#f2d06b", "#ff9a52", "#ffffff"] },
      residents: ["slime", "slime", "slime", "slime", "slime", "slime", "slime", "slime", "bat", "bat"],
      villagers: ["👨‍🌾", "👩‍🌾", "🧒"], huts: "🏡",
      help: "Help! Slimes are eating all our vegetables!", saved: "Our vegetables are safe! Thank you, good witch!" },
    { id: "fishing", name: "Fishing Village", icon: "🎣", tier: 4, rx: 720, ry: 540, seed: 62, trees: 10, mission: "panda",
      pal: { sea: "#2b6f9e", sand: "#e3d3a8", grass: "#5c9a58", leaf: "#3b7a3f", leaf2: "#4f9150", dots: ["#ffffff", "#9fd3ff"] },
      residents: ["wolf", "wolf", "wolf", "wolf", "wolf", "bat", "bat", "bat", "slime", "slime"],
      villagers: ["👴", "👩", "👦"], huts: "🏡",
      help: "The wolves won't let us go fishing! Please help!", saved: "We can go fishing again! Thank you, good witch!" },
    { id: "mushroom", name: "Mushroom Island", icon: "🍄", tier: 6, rx: 720, ry: 540, seed: 63, trees: 12, mission: "turtle",
      pal: { sea: "#2d5f8f", sand: "#d9c7a8", grass: "#4a6b45", leaf: "#6b3f8f", leaf2: "#8a5bb0", dots: ["#e74c3c", "#ffffff", "#ffd257"] },
      residents: ["ghost", "ghost", "ghost", "ghost", "ghost", "ghost", "bat", "bat", "bat"],
      villagers: ["👧", "👦", "👩"], huts: "🍄",
      help: "The ghosts go BOO all night! We're so scared!", saved: "The ghosts are gone! Now we can sleep. Thank you!" },
    { id: "castle", name: "Castle Island", icon: "🏰", tier: 8, rx: 760, ry: 560, seed: 64, trees: 14, mission: "genie",
      pal: { sea: "#2a6a9a", sand: "#cfc6ab", grass: "#6f8a5a", leaf: "#456b38", leaf2: "#5a8448", dots: ["#ffffff", "#ffd257", "#c9d8ff"] },
      residents: ["ogre", "ogre", "ogre", "ogre", "ogre", "ogre", "wolf", "wolf", "ghost", "ghost"],
      villagers: ["🤴", "👸", "💂"], huts: "🏰",
      help: "Ogres took our castle! Please help us get it back!", saved: "Our castle is ours again! Thank you, brave witch!" },
    { id: "dragon", name: "Dragon Island", icon: "🌋", tier: 10, rx: 780, ry: 580, seed: 65, trees: 8, mission: "fairy",
      pal: { sea: "#3a2a2a", sand: "#5a4636", grass: "#6b3a2e", leaf: "#3d2a22", leaf2: "#5a3a2a", dots: ["#ff7043", "#ffb347"] },
      residents: ["dragon", "ogre", "ogre", "wolf", "wolf", "ghost", "ghost", "bat", "bat"],
      villagers: ["👴", "👵", "🧒"], huts: "🏡",
      help: "A huge dragon lives on our island! It's so scary!", saved: "The dragon is gone! Thank you, good witch!" },
  ];
  const MASTER_ISLANDS = ISLANDS.filter((i) => i.masters);
  const islandById = (id) => ISLANDS.find((i) => i.id === id);
  const mastersOn = (islandId) => MASTERS.filter((m) => m.island === islandId);

  // Home island places
  const HOUSE = { x: 1150, y: 860 };
  const VILLAGE = { x: 1880, y: 860 };
  const SHOPKEEPER = { x: 1840, y: 900 };
  const VILLAGERS = [
    { x: 1960, y: 900, emoji: "👵", lines: ["Monsters can't come into our village. You're safe here, dear.", "At night the wolves come out. Hurry home before dark!"] },
    { x: 1790, y: 990, emoji: "🧒", lines: ["Hold your 🔥 Fire spell for 3 seconds and you'll fly like a rocket!", "I heard a dragon lives on Dragon Island. Scary!"] },
    { x: 1950, y: 760, emoji: "👨‍🍳", lines: ["Monsters drop coins. Bigger monsters, more coins!", "A new wand makes every spell stronger."] },
  ];
  const SHOP = [
    { id: "potion", icon: "🧪", name: "Healing potion", desc: "Heals 2 hearts. Drink with H or the 🧪 button.", price: 15 },
    { id: "shield", icon: "🛡️", name: "House shield crystal", desc: "Keeps monsters away from your house so you sleep well.", price: 60, once: true },
    { id: "wand",   icon: "🔮", name: "New wand", desc: "Every spell does 1 more damage!", price: 150, once: true },
    { id: "broom",  icon: "🧹", name: "New broom", desc: "Fly off the island and go home!", price: 300, once: true },
  ];

  const STORY = [
    { art: "🧙‍♀️🔥❄️⚡🌊⭐", text: "Once upon a time, a good witch flew across the sky on her broom. She knew lots and lots of spells." },
    { art: "⛈️🌩️🧹", text: "One night a huge thunderstorm came. CRACK! Lightning struck, and her wand and her broom both broke!" },
    { art: "💫🧙‍♀️💫", text: "She fell down onto an island and hit the ground so hard... BONK! She forgot all her spells. All except one: 🔥 Fire." },
    { art: "🏝️👹🏘️", text: "The island is full of monsters, but friendly villagers live here too, and there's an empty little house." },
    { art: "⛄🐧🧝‍♀️🐼🧜‍♀️🐢🧙‍♂️🧞🦉🧚‍♀️", text: "Ten masters of magic live on the islands nearby. Each one needs some help. Help them, and each master will teach you a spell." },
    { art: "🔥🚀🏝️", text: "Her broom is broken, but her magic still works! Hold a spell for 3 seconds and it carries her to another island. Fire launches her like a rocket!" },
    { art: "💰🏠🧹", text: "Earn coins, sleep safely at night, learn all the spells, buy a new broom, and fly home!" },
  ];

  // When the witch runs out of hearts: was it all a dream? Then it happens all over again!
  function dreamStory(times) {
    const again = times > 1;
    return [
      { art: "🛏️💤🧙‍♀️", text: again
        ? `The witch wakes up in her own bed AGAIN. "Wait... this feels familiar! Was it all a dream... again?" (That's ${times} times now!)`
        : `The witch wakes up in her own cozy bed at home. "Huh? Monsters? Islands? Was it all... a dream?"` },
      { art: "🧙‍♀️🧹☀️", text: "\"Phew! Just a silly dream.\" She grabs her wand, hops on her broom and flies off into the sunny sky." },
      { art: "⛈️⚡🧹", text: "But then the clouds turn dark... CRACK! Lightning strikes again! Her wand and her broom both break!" },
      { art: "💥🏝️💫", text: "She crashes down onto an island full of monsters. BONK! Oh no... here we go again!" },
    ];
  }

  const SAVE_KEY = "amygames.goodWitch.save4";

  // ---------- State ----------
  let W = 0, H = 0, scale = 1;
  let state = "start"; // start | story | play | paused | menu | over | won
  let witch, shots, monsters, particles, pickups, meteors, nodes;
  let day = 1, clock = 0, coins = 0, potions = 0, hasWand = false, hasShield = false;
  let current = "fire", learned = new Set(["fire"]), done = new Set(), cool = {};
  let missions = {};
  let ammo = MAX_AMMO;
  let lesson = null, talkingTo = null;
  let travel = null;   // holding a spell to fly: { spell, t, source }
  let trip = null;     // flying to another island: { spell, style, dest, phase, t }
  let mapSpell = "fire";
  let skyPointer = null; // in the sky, the witch follows the mouse (or your finger)
  let isl = null, map = null;
  let wanderTimer = 0, banner = null, storyPage = 0, chatCool = 0, duskWarned = false, lampHintCool = 0;
  const latch = { house: false, shop: false, master: null };
  const cam = { x: 0, y: 0 };
  let lastTime = 0;
  let nextShotId = 1;

  const keys = new Set();
  const aim = { active: false, id: null, sx: 0, sy: 0, held: 0 };
  const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

  function freshMissions() {
    const m = {};
    for (const ms of MASTERS) m[ms.id] = { accepted: false, items: new Array(ms.need || 1).fill(false) };
    return m;
  }
  function loadSave() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 4 ? s : null; } catch (e) { return null; }
  }
  function writeSave() {
    const data = { v: 4, day, coins, potions, hasWand, hasShield, maxHearts: witch.maxHearts, learned: [...learned], done: [...done], missions, ammo };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage blocked */ }
  }

  function needOf(ms) { return ms.need || 1; }
  function missionProgress(id) {
    return missions[id] ? missions[id].items.filter(Boolean).length : 0;
  }
  function missionReady(id) { return missionProgress(id) >= needOf(masterById(id)); }
  function islandSaved(islandId) {
    const isle = islandById(islandId);
    return !!(isle && isle.mission && missions[isle.mission].items[0]);
  }

  // ---------- Island shapes ----------
  function edgeK(a) { return 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.sin(5 * a + 1.3); }
  function islandD(x, y) {
    const nx = (x - CX) / isl.rx, ny = (y - CY) / isl.ry;
    return Math.hypot(nx, ny) / edgeK(Math.atan2(ny, nx));
  }
  function clampIsland(e, limit) {
    const d = islandD(e.x, e.y);
    if (d > limit) {
      const f = limit / d;
      e.x = CX + (e.x - CX) * f;
      e.y = CY + (e.y - CY) * f;
    }
  }
  function islandPath(s) {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      const k = edgeK(a) * s;
      const x = CX + Math.cos(a) * isl.rx * k, y = CY + Math.sin(a) * isl.ry * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  const GRASS = 0.86;

  function seeded(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build the trees, flowers, dock, mission spots etc. for an island (same every time)
  const builtMaps = {};
  function buildMap(def) {
    if (builtMaps[def.id]) return builtMaps[def.id];
    const prev = isl;
    isl = def; // islandD uses the current island
    const rnd = seeded(def.seed);
    const m = { trees: [], flowers: [], rocks: [], palms: [], shells: [], ponds: [], huts: [], people: [], blockers: [], spots: [], tasks: [], masters: [] };
    m.dock = { x: CX, y: CY + def.ry * edgeK(Math.PI / 2) * 0.9 }; // where you land when you fly in
    const clear = [{ x: m.dock.x, y: m.dock.y, r: 220 }];
    if (def.id === "home") {
      m.ponds.push({ x: 1000, y: 1300, rx: 140, ry: 80 }, { x: 1440, y: 700, rx: 100, ry: 65 });
      m.huts.push({ x: 1800, y: 780, e: "🏡" }, { x: 1965, y: 830, e: "🏡" }, { x: 1900, y: 990, e: "🏡" });
      clear.push({ x: HOUSE.x, y: HOUSE.y, r: 280 }, { x: VILLAGE.x, y: VILLAGE.y, r: 320 }, { x: CX, y: 1250, r: 140 });
    }
    if (def.masters) {
      mastersOn(def.id).forEach((ms, i) => {
        const many = mastersOn(def.id).length > 1;
        const p = { x: CX + (many ? (i === 0 ? -1 : 1) * def.rx * 0.3 : 0), y: CY - def.ry * 0.42, ms };
        m.masters.push(p);
        clear.push({ x: p.x, y: p.y, r: 200 });
      });
      clear.push({ x: CX, y: CY, r: 150 });
      if (["jungle", "bamboo", "storm", "moon", "star"].includes(def.id)) m.ponds.push({ x: CX + (rnd() < 0.5 ? -1 : 1) * def.rx * 0.45, y: CY + def.ry * 0.2, rx: 90, ry: 55 });
    }
    if (def.mission) {
      // A little village of people in trouble
      const hx = CX, hy = CY - def.ry * 0.38;
      m.hamlet = { x: hx, y: hy };
      if (def.huts === "🏰") m.huts.push({ x: hx, y: hy - 70, e: "🏰", big: true });
      else m.huts.push({ x: hx - 110, y: hy - 40, e: def.huts }, { x: hx + 110, y: hy - 40, e: def.huts });
      def.villagers.forEach((e, i) => m.people.push({ x: hx + (i - 1) * 70, y: hy + 50, emoji: e }));
      clear.push({ x: hx, y: hy, r: 260 });
      if (def.id === "dragon") m.lair = { x: CX + def.rx * 0.3, y: CY + def.ry * 0.1 };
    }
    const okSpot = (s, minD, maxD, gap, list) =>
      islandD(s.x, s.y) < maxD && islandD(s.x, s.y) > minD &&
      Math.hypot(s.x - m.dock.x, s.y - m.dock.y) > 280 &&
      !m.masters.some((p) => Math.hypot(s.x - p.x, s.y - p.y) < 180) &&
      !(m.hamlet && Math.hypot(s.x - m.hamlet.x, s.y - m.hamlet.y) < 240) &&
      !(def.id === "home" && (Math.hypot(s.x - HOUSE.x, s.y - HOUSE.y) < 380 || Math.hypot(s.x - VILLAGE.x, s.y - VILLAGE.y) < 400)) &&
      !list.some((o) => Math.hypot(o.x - s.x, o.y - s.y) < gap) &&
      !m.ponds.some((p) => Math.hypot((s.x - p.x) / (p.rx + 40), (s.y - p.y) / (p.ry + 40)) < 1);
    // Mission spots on master islands: baby penguins, flowers, pearls, lamps, books
    const taskCount = { iceberg: 4, jungle: 6, coral: 5, storm: 4, moon: 3 }[def.id] || 0;
    let tries = 0;
    while (m.tasks.length < taskCount && tries++ < 8000) {
      const s = { x: rnd() * WORLD_W, y: rnd() * WORLD_H };
      const beach = def.id === "coral";
      const gap = tries < 3000 ? 280 : tries < 5000 ? 180 : 90; // squeeze closer together if they don't fit
      if (okSpot(s, beach ? 0.45 : 0.2, beach ? 0.92 : 0.76, gap, m.tasks)) m.tasks.push(s);
    }
    for (const s of m.tasks) clear.push({ x: s.x, y: s.y, r: 90 });
    tries = 0;
    while (m.trees.length < def.trees && tries++ < 5000) {
      const t = { x: rnd() * WORLD_W, y: rnd() * WORLD_H, r: 26 + rnd() * 16 };
      if (islandD(t.x, t.y) > 0.78) continue;
      if (clear.some((c) => Math.hypot(t.x - c.x, t.y - c.y) < c.r)) continue;
      if (m.trees.some((o) => Math.hypot(o.x - t.x, o.y - t.y) < o.r + t.r + 90)) continue;
      if (m.ponds.some((p) => Math.hypot((t.x - p.x) / (p.rx + 50), (t.y - p.y) / (p.ry + 50)) < 1)) continue;
      m.trees.push(t);
    }
    const area = (def.rx * def.ry) / (1050 * 780);
    while (m.flowers.length < 220 * area) {
      const f = { x: rnd() * WORLD_W, y: rnd() * WORLD_H, c: def.pal.dots[Math.floor(rnd() * def.pal.dots.length)] };
      if (islandD(f.x, f.y) < GRASS - 0.02) m.flowers.push(f);
    }
    while (m.rocks.length < 24 * area) {
      const r = { x: rnd() * WORLD_W, y: rnd() * WORLD_H, r: 6 + rnd() * 8 };
      if (islandD(r.x, r.y) < GRASS) m.rocks.push(r);
    }
    for (let i = 0; i < 22 * Math.sqrt(area); i++) {
      const a = rnd() * Math.PI * 2, k = edgeK(a) * (0.9 + rnd() * 0.05);
      const p = { x: CX + Math.cos(a) * def.rx * k, y: CY + Math.sin(a) * def.ry * k };
      if (Math.hypot(p.x - m.dock.x, p.y - m.dock.y) > 120) m.palms.push(p);
    }
    for (let i = 0; i < 40 * Math.sqrt(area); i++) {
      const a = rnd() * Math.PI * 2, k = edgeK(a) * (0.89 + rnd() * 0.09);
      m.shells.push({ x: CX + Math.cos(a) * def.rx * k, y: CY + Math.sin(a) * def.ry * k, c: rnd() < 0.5 ? "#ffd1dc" : "#fff2d6" });
    }
    // Where the island's monsters live
    const res = def.residents || [];
    tries = 0;
    while (m.spots.length < res.length && tries++ < 6000) {
      const s = { x: rnd() * WORLD_W, y: rnd() * WORLD_H };
      if (!okSpot(s, 0.1, 0.78, 120, m.spots)) continue;
      if (Math.hypot(s.x - m.dock.x, s.y - m.dock.y) < 360) continue;
      if (m.trees.some((t) => Math.hypot(t.x - s.x, t.y - s.y) < t.r + 40)) continue;
      m.spots.push(s);
    }
    const bossIdx = res.indexOf("dragon");
    if (bossIdx >= 0 && m.lair) m.spots[bossIdx] = m.lair;
    for (const t of m.trees) m.blockers.push({ x: t.x, y: t.y, r: t.r });
    if (def.id === "home") m.blockers.push({ x: HOUSE.x, y: HOUSE.y - 20, r: 62 });
    for (const h of m.huts) m.blockers.push({ x: h.x, y: h.y - 10, r: h.big ? 80 : 50 });
    isl = prev;
    builtMaps[def.id] = m;
    return m;
  }

  function pushOut(e, cx, cy, min) {
    const dx = e.x - cx, dy = e.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    if (d < min) { e.x = cx + (dx / d) * min; e.y = cy + (dy / d) * min; }
  }
  function solveCollisions(e, flying) {
    if (!flying) {
      for (const b of map.blockers) pushOut(e, b.x, b.y, e.r * 0.7 + b.r * 0.55);
      for (const n of nodes) if (n.kind === "lamp") pushOut(e, n.x, n.y, e.r * 0.7 + 14);
    }
    clampIsland(e, 0.97);
  }
  function isHome() { return isl.id === "home"; }
  // Monsters can't go into the village, near a shielded house, or right next to a master
  function keepOutOfSafeZones(m) {
    if (isHome()) {
      pushOut(m, VILLAGE.x, VILLAGE.y, VILLAGE_R + m.r);
      if (hasShield) pushOut(m, HOUSE.x, HOUSE.y, HOUSE_SHIELD_R + m.r);
    }
    for (const p of map.masters) pushOut(m, p.x, p.y, MASTER_SAFE_R + m.r);
  }
  function inSafeZone(x, y) {
    if (isHome()) return Math.hypot(x - VILLAGE.x, y - VILLAGE.y) < VILLAGE_R || (hasShield && Math.hypot(x - HOUSE.x, y - HOUSE.y) < HOUSE_SHIELD_R);
    return map.masters.some((p) => Math.hypot(x - p.x, y - p.y) < MASTER_SAFE_R);
  }

  // ---------- Setup ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.max(0.75, Math.min(1.1, Math.min(W, H) / 700));
  }

  function makeMonster(type, x, y, bonusHearts = 0) {
    const def = MONSTERS[type];
    const hearts = def.hearts + bonusHearts;
    return {
      type, r: def.radius, x, y,
      hearts, maxHearts: hearts,
      speed: def.speed * (0.9 + Math.random() * 0.2),
      dodgeChance: def.dodge,
      dodgeCool: 0, dodgeT: 0, dvx: 0, dvy: 0,
      seen: new Set(),
      flash: 0, knock: 0, kvx: 0, kvy: 0, frozen: 0, rooted: 0,
      wobble: Math.random() * Math.PI * 2,
      jump: null, home: null, resident: false, target: false, angry: false,
    };
  }

  function newGame(save) {
    const maxHearts = save ? save.maxHearts : START_HEARTS;
    witch = { x: 0, y: 0, r: 26, hearts: maxHearts, maxHearts, hurt: 0, facing: 1, walk: 0, shieldT: 0 };
    day = save ? save.day : 1;
    clock = 0;
    coins = save ? save.coins : 0;
    potions = save ? save.potions : 1;
    hasWand = save ? save.hasWand : false;
    hasShield = save ? save.hasShield : false;
    learned = new Set(save ? save.learned : ["fire"]);
    done = new Set(save ? save.done : []);
    ammo = save && typeof save.ammo === "number" ? save.ammo : MAX_AMMO;
    missions = freshMissions();
    if (save && save.missions) for (const id in missions) if (save.missions[id]) missions[id] = save.missions[id];
    cool = {};
    current = "fire";
    chatCool = 0;
    duskWarned = false;
    lesson = null;
    stopInput();
    goToIsland("home", true);
    witch.x = HOUSE.x; witch.y = HOUSE.y + 80;
    latch.house = true;
    trip = null;
    witch.lift = 0;
    banner = { text: save ? `☀️ Good morning! Day ${day}` : "Hold 1 (🔥 Fire) for 3 seconds to blast off to another island!", t: 5 };
    buildSpellButtons();
    updateCamera();
    updateHud();
  }

  // Arrive on an island (or start on one)
  function goToIsland(id, quiet) {
    isl = islandById(id);
    map = buildMap(isl);
    shots = [];
    monsters = [];
    particles = [];
    pickups = [];
    meteors = [];
    nodes = [];
    wanderTimer = isHome() ? 12 : 25;
    witch.x = map.dock.x; witch.y = map.dock.y - 60;
    latch.house = latch.shop = false;
    latch.master = null;
    // Monsters living here. On a mission island they are the trouble, until you save the villagers.
    const saved = islandSaved(id);
    if (!saved) {
      (isl.residents || []).forEach((type, i) => {
        const s = map.spots[i];
        if (!s) return;
        // Stronger islands have tougher monsters: +1 heart every 2 levels
        const m = makeMonster(type, s.x, s.y, Math.floor(((isl.tier || 1) - 1) / 2));
        m.home = { x: s.x, y: s.y };
        m.resident = true;
        m.target = !!isl.mission && isl.mission !== "fairy";
        monsters.push(m);
      });
    }
    // Mission things on master islands
    for (const ms of mastersOn(id)) {
      const st = missions[ms.id];
      if (ms.kind === "flowers") map.tasks.forEach((s, i) => nodes.push({ kind: "flower", owner: ms.id, i, x: s.x, y: s.y, water: 0 }));
      if (ms.kind === "lamps") map.tasks.forEach((s, i) => nodes.push({ kind: "lamp", owner: ms.id, i, x: s.x, y: s.y }));
      if (ms.kind === "collect" && st.accepted) spawnCollectables(ms);
    }
    if (!quiet) {
      let text = "🏠 Home sweet home!";
      if (isl.masters) text = `Welcome to ${isl.name}! ${mastersOn(id).map((m) => `${m.emoji} The ${m.name}`).join(" and ")} lives up north.`;
      else if (isl.mission) text = saved ? `${isl.icon} ${isl.name}. The villagers wave hello! 👋` : `${isl.icon} ${isl.name}! The villagers need your help!`;
      banner = { text, t: 4 };
    }
    updateCamera();
  }
  function spawnCollectables(ms) {
    const st = missions[ms.id];
    map.tasks.forEach((s, i) => { if (!st.items[i]) pickups.push({ kind: ms.item, owner: ms.id, i, x: s.x, y: s.y, t: Infinity }); });
  }

  function updateCamera() {
    cam.x = Math.max(0, Math.min(WORLD_W - W, witch.x - W / 2));
    cam.y = Math.max(0, Math.min(WORLD_H - H, witch.y - H / 2));
    if (W > WORLD_W) cam.x = (WORLD_W - W) / 2;
    if (H > WORLD_H) cam.y = (WORLD_H - H) / 2;
  }

  // ---------- Day and night ----------
  function isNight() { return clock >= DAY_LEN; }
  function darkness() {
    if (clock < DAY_LEN - 15) return 0;
    if (clock < DAY_LEN + 10) return ((clock - (DAY_LEN - 15)) / 25) * 0.62;
    const end = DAY_LEN + NIGHT_LEN;
    if (clock > end - 12) return ((end - clock) / 12) * 0.62;
    return 0.62;
  }
  function morning(text) {
    day++;
    clock = 0;
    duskWarned = false;
    for (const m of monsters) if (!m.resident) { m.dead = true; puff(m.x, m.y, "#fff3a6", 10); }
    monsters = monsters.filter((m) => !m.dead);
    banner = { text: text || `☀️ The sun is up! Day ${day}`, t: 3.5 };
  }

  // ---------- Wandering monsters (they leap in from the top of the screen) ----------
  function maxWanderers() {
    const base = isNight() ? Math.min(7, 2 + day) : Math.min(4, day);
    return isHome() ? base : Math.max(1, Math.floor(base / 2));
  }
  function wanderGap() { return isNight() ? 9 : Math.max(14, 28 - day * 2); }
  function pickWanderer() {
    let bag;
    if (isNight()) {
      bag = ["wolf", "wolf", "bat", "ghost", "slime"];
      if (day >= 2) bag.push("ogre");
    } else {
      bag = ["slime", "slime", "slime"];
      if (day >= 2) bag.push("bat", "bat");
      if (day >= 3) bag.push("ogre", "ghost");
    }
    return bag[Math.floor(Math.random() * bag.length)];
  }
  function spawnWanderer() {
    const type = pickWanderer();
    const a = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * 160;
    const land = { x: witch.x + Math.cos(a) * dist, y: witch.y + Math.sin(a) * dist, r: MONSTERS[type].radius };
    solveCollisions(land, false);
    clampIsland(land, 0.9);
    keepOutOfSafeZones(land);
    clampIsland(land, 0.9);
    const m = makeMonster(type, land.x, land.y);
    m.jump = { sx: land.x + (Math.random() - 0.5) * 200, sy: cam.y - 80, tx: land.x, ty: land.y, t: 0 };
    monsters.push(m);
  }
  function jumpLift(m) {
    if (!m.jump) return 0;
    return Math.sin((m.jump.t / JUMP_TIME) * Math.PI) * 140;
  }

  function tryDodge(m) {
    if (m.dodgeChance <= 0 || m.dodgeCool > 0 || m.dodgeT > 0 || m.frozen > 0 || m.rooted > 0) return;
    for (const f of shots) {
      if (m.seen.has(f.id)) continue;
      const rx = m.x - f.x, ry = m.y - f.y;
      const v2 = f.vx * f.vx + f.vy * f.vy;
      const t = (rx * f.vx + ry * f.vy) / v2;
      if (t < 0 || t > 0.4) continue;
      const cx = f.x + f.vx * t - m.x, cy = f.y + f.vy * t - m.y;
      if (Math.hypot(cx, cy) > m.r + f.r + 12) continue;
      m.seen.add(f.id);
      if (Math.random() > m.dodgeChance) continue;
      const sp = Math.sqrt(v2);
      let px = -f.vy / sp, py = f.vx / sp;
      if (px * -cx + py * -cy < 0) { px = -px; py = -py; }
      m.dvx = px * 400; m.dvy = py * 400;
      m.dodgeT = 0.22;
      m.dodgeCool = 1.4;
      puff(m.x, m.y, "rgba(255,255,255,0.8)", 6);
      return;
    }
  }

  // ---------- Casting spells ----------
  function aimWorld() { return { x: aim.sx + cam.x, y: aim.sy + cam.y }; }
  function charge() { return Math.min(1, aim.held / FULL_CHARGE); }
  function power(dmg) { return dmg + (hasWand ? 1 : 0); }

  function release() {
    if (!aim.active) return;
    aim.active = false;
    aim.id = null;
    if (state !== "play") return;
    const p = SPELLS[current];
    const c = charge();
    aim.held = 0;
    if ((cool[current] || 0) > 0) {
      banner = { text: `${p.icon} ${p.name} is recharging... ${Math.ceil(cool[current])}s`, t: 1.5 };
      return;
    }
    if (ammo <= 0) {
      banner = { text: "💫 Out of magic! Click the witch (or press R) to recharge.", t: 2.5 };
      puff(witch.x, witch.y, "#888", 6, 0.4);
      return;
    }
    if (p.kind === "self") {
      if (current === "heal") {
        if (witch.hearts >= witch.maxHearts) { banner = { text: "💚 Your hearts are already full!", t: 1.5 }; return; }
        witch.hearts = Math.min(witch.maxHearts, witch.hearts + 2);
        puff(witch.x, witch.y, "#7ee07e", 24);
      } else if (current === "shield") {
        witch.shieldT = 5;
        puff(witch.x, witch.y, "#9fd8ff", 24);
      }
      ammo--;
      cool[current] = p.cooldown;
      return;
    }
    const target = aimWorld();
    if (p.kind === "area") {
      let dx = target.x - witch.x, dy = target.y - witch.y;
      const d = Math.hypot(dx, dy) || 1;
      const maxD = 480;
      if (d > maxD) { dx = (dx / d) * maxD; dy = (dy / d) * maxD; }
      meteors.push({ x: witch.x + dx, y: witch.y + dy, t: 0.7, r: 70 + 50 * c });
      ammo--;
      cool[current] = p.cooldown;
      return;
    }
    ammo--;
    if (ammo === 0) banner = { text: "💫 That was your last shot! Click the witch to recharge.", t: 2.5 };
    const base = Math.atan2(target.y - witch.y, target.x - witch.x);
    const speed = (300 + 520 * c) * p.speed;
    const count = p.spread || 1;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * 0.22;
      shots.push({
        id: nextShotId++, spell: current,
        x: witch.x + Math.cos(a) * witch.r, y: witch.y + Math.sin(a) * witch.r,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        r: (7 + 4 * c) * (p.big || 1),
        life: p.life || (p.short ? 0.35 + 0.5 * c : 0.5 + 0.9 * c),
        full: c >= 1,
        hitSet: new Set(), reset: 0, spin: 0,
      });
    }
  }

  function puff(x, y, color, count, pw = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (40 + Math.random() * 160) * pw;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, max: 0.9, color, r: 2 + Math.random() * 4 });
    }
  }

  function selectSpell(key) {
    if (!learned.has(key)) return;
    current = key;
    buildSpellButtons();
  }
  function cycleSpell(dir) {
    const list = SPELL_ORDER.filter((k) => learned.has(k));
    const i = list.indexOf(current);
    selectSpell(list[(i + dir + list.length) % list.length]);
  }

  function drinkPotion() {
    if (potions <= 0 || witch.hearts >= witch.maxHearts) return false;
    potions--;
    witch.hearts = Math.min(witch.maxHearts, witch.hearts + 2);
    puff(witch.x, witch.y, "#ff7aa8", 16);
    updateHud();
    return true;
  }

  // ---------- Update ----------
  function moveInput() {
    let mx = 0, my = 0;
    if (keys.has("arrowleft") || keys.has("a")) mx -= 1;
    if (keys.has("arrowright") || keys.has("d")) mx += 1;
    if (keys.has("arrowup") || keys.has("w")) my -= 1;
    if (keys.has("arrowdown") || keys.has("s")) my += 1;
    if (stick.active) {
      const dx = stick.x - stick.ox, dy = stick.y - stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > 8) { const k = Math.min(1, d / 55); mx = (dx / d) * k; my = (dy / d) * k; }
    }
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    return { mx, my };
  }

  function damage(m, dmg, color, x, y) {
    m.hearts -= dmg;
    m.flash = 0.15;
    m.angry = true;
    puff(x, y, color, 8);
  }
  function hitMonster(m, f) {
    const p = SPELLS[f.spell];
    damage(m, power(p.dmg), p.color, f.x, f.y);
    if (p.freeze) m.frozen = p.freeze;
    if (p.root) m.rooted = p.root;
    if (p.knock > 0 && !MONSTERS[m.type].boss) {
      const fl = Math.hypot(f.vx, f.vy) || 1;
      m.kvx = (f.vx / fl) * p.knock; m.kvy = (f.vy / fl) * p.knock;
      m.knock = p.knock > 400 ? 0.25 : 0.12;
    }
  }

  function defeat(m) {
    m.dead = true;
    puff(m.x, m.y, monsterColor(m.type), 20);
    let value = MONSTERS[m.type].coins;
    while (value > 0) {
      const v = Math.min(value, value >= 10 ? 5 : 1);
      value -= v;
      pickups.push({ kind: "coin", value: v, x: m.x + (Math.random() - 0.5) * 40, y: m.y + (Math.random() - 0.5) * 30, t: 40 });
    }
    if (Math.random() < 0.15) pickups.push({ kind: "heart", x: m.x, y: m.y + 10, t: 20 });
    if (m.type === "dragon" && isl.id === "dragon" && !missions.fairy.items[0]) {
      pickups.push({ kind: "fairystar", x: m.x, y: m.y, t: Infinity });
      banner = { text: "The dragon dropped the Star Fairy's 🌟 wand star! Grab it!", t: 4 };
    }
    // Saving villagers on a mission island
    if (m.target) {
      const left = monsters.filter((o) => o.target && !o.dead).length;
      const owner = masterById(isl.mission);
      if (left > 0) {
        banner = { text: `${left} monster${left > 1 ? "s" : ""} left! The villagers are cheering you on!`, t: 2.5 };
      } else {
        missions[owner.id].items[0] = true;
        banner = { text: `🎉 You saved ${isl.name}! Go tell the ${owner.emoji} ${owner.name}.`, t: 5 };
        for (const p of map.people) puff(p.x, p.y - 20, "#ffe066", 20);
      }
    }
  }

  // Shots can light lamps
  function hitNodes(f) {
    for (const n of nodes) {
      if (n.kind !== "lamp") continue;
      if (Math.hypot(f.x - n.x, f.y - (n.y - 16)) > 24 + f.r) continue;
      const st = missions[n.owner];
      if (st.items[n.i]) continue; // already lit, shots fly past
      if (!st.accepted) {
        if (lampHintCool <= 0) { banner = { text: "These lamps belong to the 🧙‍♂️ Thunder Wizard. Go talk to him first!", t: 3 }; lampHintCool = 3; }
        return true;
      }
      if (f.spell === "fire") {
        st.items[n.i] = true;
        puff(n.x, n.y - 16, "#ffb347", 24);
        const left = 4 - missionProgress(n.owner);
        banner = { text: left > 0 ? `🏮 Lamp lit! ${left} more to go.` : "🏮 All lamps lit! Go tell the Thunder Wizard!", t: 3 };
      } else if (lampHintCool <= 0) {
        banner = { text: "Only 🔥 Fire can light the lamps! Press 1.", t: 2.5 };
        lampHintCool = 3;
      }
      return true;
    }
    return false;
  }

  const ITEM_WORDS = { chick: ["🐧", "baby penguin", "baby penguins"], pearl: ["⚪", "pearl", "pearls"], book: ["📕", "magic book", "magic books"] };

  function update(dt) {
    if (banner && banner.t > 0) banner.t -= dt;
    if (chatCool > 0) chatCool -= dt;
    if (lampHintCool > 0) lampHintCool -= dt;
    for (const k in cool) if (cool[k] > 0) cool[k] -= dt;
    if (witch.shieldT > 0) witch.shieldT -= dt;

    // Day and night
    clock += dt;
    if (!duskWarned && clock > DAY_LEN - 20) {
      duskWarned = true;
      banner = { text: isHome() ? "🌙 Night is coming! Go home to sleep." : "🌙 Night is coming! Fly home to sleep.", t: 4 };
    }
    if (clock >= DAY_LEN + NIGHT_LEN) morning();

    // Wandering monsters
    const wanderers = monsters.filter((m) => !m.resident).length;
    wanderTimer -= dt;
    if (wanderTimer <= 0) {
      if (wanderers < maxWanderers() && !inSafeZone(witch.x, witch.y)) spawnWanderer();
      wanderTimer = wanderGap() * (0.8 + Math.random() * 0.4);
    }

    // Witch moves (a bit slower while aiming)
    const { mx, my } = moveInput();
    const sp = WITCH_SPEED * (aim.active ? 0.6 : 1);
    witch.x += mx * sp * dt;
    witch.y += my * sp * dt;
    solveCollisions(witch, false);
    if (mx || my) witch.walk += dt * 10;
    if (mx) witch.facing = mx > 0 ? 1 : -1;
    if (witch.hurt > 0) witch.hurt -= dt;
    updateCamera();
    if (aim.active) {
      aim.held += dt;
      witch.facing = aimWorld().x > witch.x ? 1 : -1;
    }

    // Holding a spell to fly away
    if (travel) {
      travel.t += dt;
      const col = SPELLS[travel.spell].color || "#ffe066";
      const n = 1 + Math.floor(travel.t / 2.5);
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.5) {
          const a = Math.random() * Math.PI * 2;
          particles.push({ x: witch.x + Math.cos(a) * 46, y: witch.y + Math.sin(a) * 46, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: 0.6, max: 0.6, color: col, r: 3 });
        }
      }
      if (travel.t >= TRAVEL_HOLD) { const sp = travel.spell; travel = null; openBoat(sp); return; }
    }

    // Places you can walk into: house, shop, masters
    if (isHome()) {
      const dDoor = Math.hypot(witch.x - HOUSE.x, witch.y - (HOUSE.y + 48));
      if (dDoor > 75) latch.house = false;
      if (dDoor < 38 && !latch.house) { latch.house = true; openHouse(); return; }
      const dShop = Math.hypot(witch.x - SHOPKEEPER.x, witch.y - SHOPKEEPER.y);
      if (dShop > 85) latch.shop = false;
      if (dShop < 48 && !latch.shop) { latch.shop = true; openShop(); return; }
      if (chatCool <= 0) {
        for (const v of VILLAGERS) {
          if (Math.hypot(witch.x - v.x, witch.y - v.y) < 70) {
            banner = { text: `${v.emoji} "${v.lines[Math.floor(Math.random() * v.lines.length)]}"`, t: 4 };
            chatCool = 6;
            break;
          }
        }
      }
    }
    for (const p of map.masters) {
      const d = Math.hypot(witch.x - p.x, witch.y - p.y);
      if (latch.master === p.ms.id && d > 110) latch.master = null;
      if (d < 60 && latch.master !== p.ms.id) { latch.master = p.ms.id; openMaster(p.ms); return; }
    }
    if (isl.mission && chatCool <= 0) {
      for (const p of map.people) {
        if (Math.hypot(witch.x - p.x, witch.y - p.y) < 80) {
          banner = { text: `${p.emoji} "${islandSaved(isl.id) ? isl.saved : isl.help}"`, t: 3.5 };
          chatCool = 6;
          break;
        }
      }
    }

    // Watering flowers: stand next to a wilted flower
    for (const n of nodes) {
      if (n.kind !== "flower") continue;
      const st = missions[n.owner];
      if (st.items[n.i]) continue;
      const near = Math.hypot(witch.x - n.x, witch.y - n.y) < 55;
      if (near && !st.accepted) {
        if (chatCool <= 0) { banner = { text: "A sad wilted flower 🥀. Maybe the 🧝‍♀️ Elf Master knows about it.", t: 3 }; chatCool = 4; }
        continue;
      }
      if (near) {
        n.water += dt;
        if (Math.random() < 0.5) particles.push({ x: n.x + (Math.random() - 0.5) * 30, y: n.y - 40, vx: 0, vy: 120, life: 0.35, max: 0.35, color: "#5ab8ff", r: 3 });
        if (n.water >= WATER_TIME) {
          st.items[n.i] = true;
          puff(n.x, n.y, "#ff9ad5", 20);
          const left = 6 - missionProgress(n.owner);
          banner = { text: left > 0 ? `🌷 The flower is happy! ${left} more to go.` : "🌷 All flowers watered! Go tell the Elf Master!", t: 3 };
        }
      } else {
        n.water = Math.max(0, n.water - dt);
      }
    }

    // Pickups: coins fly to you when you are close
    for (const p of pickups) {
      p.t -= dt;
      const dx = witch.x - p.x, dy = witch.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (p.kind === "coin" && d < 130) { p.x += (dx / d) * 380 * dt; p.y += (dy / d) * 380 * dt; }
      if (d < witch.r + 22) {
        p.t = 0;
        if (p.kind === "coin") {
          coins += p.value;
          puff(p.x, p.y, "#ffd257", 4, 0.5);
        } else if (ITEM_WORDS[p.kind]) {
          const ms = masterById(p.owner);
          missions[ms.id].items[p.i] = true;
          puff(p.x, p.y, "#ffffff", 16);
          const [icon, one, many] = ITEM_WORDS[p.kind];
          const left = ms.need - missionProgress(ms.id);
          banner = { text: left > 0 ? `${icon} You found a ${one}! ${left} more to go.` : `${icon} You found all the ${many}! Go tell the ${ms.emoji} ${ms.name}!`, t: 3 };
        } else if (p.kind === "fairystar") {
          missions.fairy.items[0] = true;
          puff(p.x, p.y, "#ffe066", 30);
          banner = { text: "🌟 You got the wand star back! Bring it to the 🧚‍♀️ Star Fairy on Star Island!", t: 4.5 };
        } else if (witch.hearts < witch.maxHearts) {
          witch.hearts++;
          puff(p.x, p.y, "#ff7aa8", 12);
          banner = { text: "💖 +1 heart!", t: 1.5 };
        } else {
          coins += 5;
          puff(p.x, p.y, "#ffd257", 12);
          banner = { text: "💖 Hearts already full, so you get 💰 +5 instead!", t: 2.5 };
        }
      }
    }
    pickups = pickups.filter((p) => p.t > 0);

    // Shots
    for (const f of shots) {
      const p = SPELLS[f.spell];
      f.spin += dt * 10;
      if (p.multi) { f.reset -= dt; if (f.reset <= 0) { f.hitSet.clear(); f.reset = 0.5; } }
      if (p.homing) {
        let best = null, bd = 420;
        for (const m of monsters) {
          if (m.jump || f.hitSet.has(m)) continue;
          const d = Math.hypot(m.x - f.x, m.y - f.y);
          if (d < bd) { bd = d; best = m; }
        }
        if (best) {
          const sp2 = Math.hypot(f.vx, f.vy);
          const cur = Math.atan2(f.vy, f.vx);
          let diff = Math.atan2(best.y - f.y, best.x - f.x) - cur;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = Math.max(-5 * dt, Math.min(5 * dt, diff));
          f.vx = Math.cos(cur + turn) * sp2;
          f.vy = Math.sin(cur + turn) * sp2;
        }
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      if (Math.random() < 0.7) {
        particles.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.25, max: 0.25, color: p.color, r: 3 });
      }
      if (f.life <= 0) { f.hit = true; puff(f.x, f.y, p.color, 5, 0.4); continue; }
      if (hitNodes(f)) { f.hit = true; continue; }
      if (!p.big) {
        for (const b of map.blockers) {
          if (Math.hypot(f.x - b.x, f.y - b.y) < b.r * 0.55 + f.r) { f.hit = true; puff(f.x, f.y, p.color, 8, 0.6); break; }
        }
      }
    }

    // Meteors land
    for (const me of meteors) {
      me.t -= dt;
      if (me.t <= 0 && !me.done) {
        me.done = true;
        puff(me.x, me.y, "#ff7043", 40, 1.6);
        puff(me.x, me.y, "#ffd257", 20, 1.2);
        for (const m of monsters) {
          if (m.jump) continue;
          const d = Math.hypot(m.x - me.x, m.y - me.y);
          if (d < me.r + m.r) {
            damage(m, power(SPELLS.meteor.dmg), "#ff7043", m.x, m.y);
            if (!MONSTERS[m.type].boss) { const k = d || 1; m.kvx = ((m.x - me.x) / k) * 420; m.kvy = ((m.y - me.y) / k) * 420; m.knock = 0.2; }
          }
        }
      }
    }
    meteors = meteors.filter((me) => me.t > -0.4);

    // Monsters
    for (const m of monsters) {
      const def = MONSTERS[m.type];
      m.wobble += dt * (m.type === "bat" ? 12 : 5);
      if (m.flash > 0) m.flash -= dt;
      if (m.frozen > 0) m.frozen -= dt;
      if (m.rooted > 0) m.rooted -= dt;

      if (m.jump) {
        m.jump.t += dt;
        const p = Math.min(1, m.jump.t / JUMP_TIME);
        m.x = m.jump.sx + (m.jump.tx - m.jump.sx) * p;
        m.y = m.jump.sy + (m.jump.ty - m.jump.sy) * p;
        if (p >= 1) { m.jump = null; puff(m.x, m.y + m.r * 0.6, "#e6d3a3", 12, 0.7); }
        continue;
      }

      if (m.dodgeCool > 0) m.dodgeCool -= dt;
      tryDodge(m);

      const dx = witch.x - m.x, dy = witch.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const slow = m.frozen > 0 ? 0.25 : 1;

      // Island monsters stay near home until you come close
      let chasing = true;
      if (m.home) {
        if (d < (def.boss ? 340 : GUARD_SIGHT)) m.angry = true;
        if (Math.hypot(witch.x - m.home.x, witch.y - m.home.y) > GUARD_LEASH) m.angry = false;
        chasing = m.angry;
      }

      if (m.dodgeT > 0) {
        m.dodgeT -= dt;
        m.x += m.dvx * dt;
        m.y += m.dvy * dt;
      } else if (m.knock > 0) {
        m.knock -= dt;
        m.x += m.kvx * dt;
        m.y += m.kvy * dt;
      } else if (m.rooted > 0) {
        // held by vines
      } else if (chasing) {
        let sx = (dx / d) * m.speed, sy = (dy / d) * m.speed;
        if (m.type === "bat") { sx += (-dy / d) * Math.sin(m.wobble) * 60; sy += (dx / d) * Math.sin(m.wobble) * 60; }
        if (m.type === "slime") { const hop = 0.5 + Math.max(0, Math.sin(m.wobble)); sx *= hop; sy *= hop; }
        m.x += sx * slow * dt;
        m.y += sy * slow * dt;
      } else {
        const tx = m.home.x + Math.cos(m.wobble * 0.2) * 40, ty = m.home.y + Math.sin(m.wobble * 0.2) * 40;
        const hx = tx - m.x, hy = ty - m.y, hd = Math.hypot(hx, hy);
        if (hd > 4) { m.x += (hx / hd) * m.speed * 0.6 * slow * dt; m.y += (hy / hd) * m.speed * 0.6 * slow * dt; }
      }
      solveCollisions(m, def.flying);
      keepOutOfSafeZones(m);

      for (const f of shots) {
        if (f.hit || f.hitSet.has(m)) continue;
        if (Math.hypot(f.x - m.x, f.y - m.y) < m.r + f.r) {
          f.hitSet.add(m);
          if (!SPELLS[f.spell].pierce) f.hit = true;
          hitMonster(m, f);
          if (m.hearts <= 0) break;
        }
      }
      if (m.hearts <= 0) { defeat(m); continue; }

      if (d < m.r + witch.r * 0.8) {
        if (witch.shieldT > 0) {
          m.kvx = (-dx / d) * 450; m.kvy = (-dy / d) * 450; m.knock = 0.25;
          puff(m.x, m.y, "#9fd8ff", 6);
        } else if (witch.hurt <= 0) {
          witch.hearts -= def.boss ? 2 : 1;
          witch.hurt = HURT_TIME;
          if (travel) { travel = null; banner = { text: "Ouch! Your flight spell got interrupted. Find a safe spot and try again!", t: 3 }; }
          m.kvx = (-dx / d) * 380; m.kvy = (-dy / d) * 380; m.knock = 0.3;
          puff(witch.x, witch.y, "#ff5a7a", 14);
          if (witch.hearts <= 0) { witch.hearts = 0; updateHud(); gameOver(); return; }
          if (witch.hearts <= 2 && potions > 0) banner = { text: "Ouch! Press H to drink a 🧪 potion.", t: 3 };
        }
      }
    }
    shots = shots.filter((f) => !f.hit);
    monsters = monsters.filter((m) => !m.dead);

    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    particles = particles.filter((p) => p.life > 0);

    updateHud();
  }

  // ---------- Drawing ----------
  function monsterColor(type) {
    return { slime: "#58d66b", bat: "#8b6bd9", ogre: "#d9534f", ghost: "#e8e8ff", wolf: "#9aa3ad", dragon: "#6fbf5a" }[type];
  }
  function inView(x, y, pad) {
    return x > cam.x - pad && x < cam.x + W + pad && y > cam.y - pad && y < cam.y + H + pad;
  }
  function drawEmoji(ch, x, y, size) {
    ctx.font = `${Math.round(size)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000"; // some browsers tint emoji with the fill color, so keep it solid
    ctx.fillText(ch, x, y);
  }
  function drawLabel(text, x, y, size) {
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x, y);
  }

  function drawGround(t) {
    const pal = isl.pal;
    ctx.fillStyle = pal.sea;
    ctx.fillRect(cam.x - 2, cam.y - 2, W + 4, H + 4);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { islandPath(1.05 + i * 0.07 + Math.sin(t * 0.8 + i) * 0.01); ctx.stroke(); }
    ctx.fillStyle = pal.sand;
    islandPath(1); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 4;
    islandPath(1.005 + Math.sin(t * 1.5) * 0.004); ctx.stroke();
    ctx.fillStyle = pal.grass;
    islandPath(GRASS); ctx.fill();
    for (const s of map.shells) {
      if (!inView(s.x, s.y, 10)) continue;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    const path = "rgba(201,178,122,0.85)";
    if (isHome()) {
      ctx.fillStyle = "#c9b27a";
      ctx.beginPath(); ctx.ellipse(VILLAGE.x, VILLAGE.y + 20, 190, 140, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c9b27a";
      ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(HOUSE.x, HOUSE.y + 60); ctx.quadraticCurveTo(1500, 980, VILLAGE.x - 150, VILLAGE.y + 40); ctx.stroke();
    }
    if (map.hamlet) {
      ctx.fillStyle = path;
      ctx.beginPath(); ctx.ellipse(map.hamlet.x, map.hamlet.y + 20, 200, 110, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of map.masters) {
      const ms = p.ms;
      ctx.strokeStyle = done.has(ms.id) ? "rgba(255,224,102,0.9)" : "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 62 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const p of map.ponds) {
      if (!inView(p.x, p.y, p.rx + 20)) continue;
      ctx.fillStyle = "#3b7fc4";
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.35, p.ry * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of map.flowers) {
      if (!inView(f.x, f.y, 10)) continue;
      ctx.fillStyle = f.c;
      ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const r of map.rocks) {
      if (!inView(r.x, r.y, 20)) continue;
      ctx.fillStyle = "#8d9196";
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (isHome()) {
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 220, 120, 0.7)";
      ctx.beginPath(); ctx.arc(VILLAGE.x, VILLAGE.y, VILLAGE_R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (hasShield) {
        const g = ctx.createRadialGradient(HOUSE.x, HOUSE.y, HOUSE_SHIELD_R * 0.6, HOUSE.x, HOUSE.y, HOUSE_SHIELD_R);
        g.addColorStop(0, "rgba(140,200,255,0)");
        g.addColorStop(1, `rgba(140,200,255,${0.28 + 0.08 * Math.sin(t * 2)})`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(HOUSE.x, HOUSE.y, HOUSE_SHIELD_R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(170,220,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  function drawTree(tr) {
    const pal = isl.pal;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(tr.x, tr.y + tr.r * 0.5, tr.r * 0.9, tr.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6b4426";
    ctx.fillRect(tr.x - tr.r * 0.18, tr.y - tr.r * 0.1, tr.r * 0.36, tr.r * 0.6);
    ctx.fillStyle = pal.leaf;
    ctx.beginPath(); ctx.arc(tr.x, tr.y - tr.r * 0.55, tr.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.leaf2;
    ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.3, tr.y - tr.r * 0.8, tr.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
  function drawShadow(x, y, r, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawHouse(t) {
    drawShadow(HOUSE.x, HOUSE.y + 40, 70, 0.25);
    drawEmoji("🏠", HOUSE.x, HOUSE.y - 15, 130);
    if (darkness() > 0.2) {
      ctx.fillStyle = `rgba(255,220,120,${0.25 + 0.1 * Math.sin(t * 3)})`;
      ctx.beginPath(); ctx.arc(HOUSE.x, HOUSE.y + 10, 40, 0, Math.PI * 2); ctx.fill();
    }
    drawLabel("Home", HOUSE.x, HOUSE.y + 72, 14);
  }
  function drawPerson(emoji, x, y, t, label, size = 40) {
    drawShadow(x, y + size * 0.55, size * 0.45, 0.25);
    drawEmoji(emoji, x, y + Math.sin(t * 2 + x) * 2, size);
    if (label) drawLabel(label, x, y - size * 0.85, 13);
  }
  function masterMark(ms) {
    if (done.has(ms.id)) return " ✓";
    const st = missions[ms.id];
    if (!st.accepted) return " ❗";
    return missionReady(ms.id) ? " ✅" : "";
  }

  function drawNode(n, t) {
    if (n.kind === "flower") {
      const st = missions[n.owner];
      const happy = st.items[n.i];
      drawEmoji(happy ? "🌷" : "🥀", n.x, n.y, 40);
      if (!happy && n.water > 0) {
        ctx.strokeStyle = "#5ab8ff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(n.x, n.y, 30, -Math.PI / 2, -Math.PI / 2 + (n.water / WATER_TIME) * Math.PI * 2); ctx.stroke();
      }
      if (!happy && st.accepted) drawLabel("💧", n.x, n.y - 34, 14);
    } else if (n.kind === "lamp") {
      const st = missions[n.owner];
      const lit = st.items[n.i];
      drawShadow(n.x, n.y + 24, 18, 0.25);
      ctx.fillStyle = "#3a3330";
      ctx.fillRect(n.x - 3, n.y - 6, 6, 32);
      if (lit) {
        const g = ctx.createRadialGradient(n.x, n.y - 16, 0, n.x, n.y - 16, 70);
        g.addColorStop(0, `rgba(255,200,90,${0.55 + 0.1 * Math.sin(t * 4 + n.i)})`);
        g.addColorStop(1, "rgba(255,200,90,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y - 16, 70, 0, Math.PI * 2); ctx.fill();
        drawEmoji("🏮", n.x, n.y - 18, 38);
      } else {
        ctx.globalAlpha = 0.4;
        drawEmoji("🏮", n.x, n.y - 18, 38);
        ctx.globalAlpha = 1;
        if (st.accepted) drawLabel("🔥?", n.x, n.y - 46, 12);
      }
    }
  }

  function drawWitch(t) {
    const lift = witch.lift || 0;
    drawShadow(witch.x, witch.y + witch.r * 0.9, witch.r * 0.9 * Math.max(0.3, 1 - lift / 900), 0.3);
    // Charging up a flight: a ring fills around the witch
    if (travel) {
      const sp = SPELLS[travel.spell];
      const k = Math.min(1, travel.t / TRAVEL_HOLD);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(witch.x, witch.y, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = sp.color || "#ffe066";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(witch.x, witch.y, 46, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
      drawLabel(`${sp.icon} ${Math.ceil(TRAVEL_HOLD - travel.t)}`, witch.x, witch.y - 62, 15);
    }
    // Out of magic: a little bubble says to click her
    if (ammo <= 0 && !travel && !lift) drawLabel("💫 Click me to recharge!", witch.x, witch.y - 56 + Math.sin(t * 5) * 3, 13);
    if (witch.hurt > 0 && Math.floor(witch.hurt * 16) % 2 === 0) ctx.globalAlpha = 0.35;
    const bob = Math.abs(Math.sin(witch.walk)) * 4;
    ctx.save();
    ctx.translate(witch.x, witch.y - bob - lift);
    if (trip && trip.style === "spin") ctx.rotate(t * 14);
    if (witch.facing > 0) ctx.scale(-1, 1);
    drawEmoji("🧙‍♀️", 0, 0, witch.r * 2.2);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (witch.shieldT > 0) {
      const fade = witch.shieldT < 1 && Math.floor(witch.shieldT * 10) % 2 === 0 ? 0.3 : 1;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(150,210,255,0.22)";
      ctx.strokeStyle = "rgba(190,230,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(witch.x, witch.y, witch.r * 1.7 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawAim() {
    if (!aim.active) return;
    const p = SPELLS[current];
    const c = charge();
    if (p.kind === "self") {
      drawLabel(`${p.icon} let go to cast`, witch.x, witch.y + witch.r + 22, 13);
      return;
    }
    const target = aimWorld();
    if (p.kind === "area") {
      let dx = target.x - witch.x, dy = target.y - witch.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 480) { dx = (dx / d) * 480; dy = (dy / d) * 480; }
      ctx.strokeStyle = "rgba(255,112,67,0.9)";
      ctx.fillStyle = "rgba(255,112,67,0.15)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(witch.x + dx, witch.y + dy, 70 + 50 * c, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const dx = target.x - witch.x, dy = target.y - witch.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const L = 50 + 150 * c;
    const sx = witch.x + ux * witch.r, sy = witch.y + uy * witch.r;
    const ex = sx + ux * L, ey = sy + uy * L;
    const col = c >= 1 ? "#ff3b1f" : p.color;
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ex + ux * 14, ey + uy * 14);
    ctx.lineTo(ex - uy * 8, ey + ux * 8);
    ctx.lineTo(ex + uy * 8, ey - ux * 8);
    ctx.closePath(); ctx.fill();
    const bw = 50, bh = 7, bx = witch.x - bw / 2, by = witch.y + witch.r + 12;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = col; ctx.fillRect(bx, by, bw * c, bh);
  }

  function drawSlime(m, y) {
    const squish = 1 + Math.sin(m.wobble) * 0.1;
    ctx.save();
    ctx.translate(m.x, y);
    ctx.scale(squish, 1 / squish);
    ctx.fillStyle = m.flash > 0 ? "#ffffff" : "#58d66b";
    ctx.beginPath(); ctx.ellipse(0, 0, m.r, m.r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.ellipse(-m.r * 0.35, -m.r * 0.35, m.r * 0.25, m.r * 0.15, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1b1030";
    ctx.beginPath();
    ctx.arc(-m.r * 0.3, 0, m.r * 0.13, 0, Math.PI * 2);
    ctx.arc(m.r * 0.3, 0, m.r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMonster(m, t) {
    const def = MONSTERS[m.type];
    const lift = jumpLift(m);
    if (m.jump) {
      const p = m.jump.t / JUMP_TIME;
      drawShadow(m.jump.tx, m.jump.ty + m.r * 0.7, m.r * (0.4 + 0.6 * p), 0.15 + 0.25 * p);
    } else {
      drawShadow(m.x, m.y + m.r * 0.7, m.r * 0.8, def.flying ? 0.12 : 0.25);
    }
    const y = m.y - lift;
    if (m.type === "slime") {
      drawSlime(m, y);
    } else {
      if (m.flash > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.arc(m.x, y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      if (m.type === "ghost") ctx.globalAlpha = 0.85;
      drawEmoji(def.emoji, m.x, y, m.r * 2);
      ctx.globalAlpha = 1;
    }
    if (m.frozen > 0) {
      ctx.fillStyle = "rgba(150,225,255,0.45)";
      ctx.strokeStyle = "rgba(230,250,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, y, m.r * 1.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (m.rooted > 0) {
      ctx.strokeStyle = "#3f9b3f";
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(m.x, y + m.r * 0.5 - i * m.r * 0.4, m.r * 1.05, m.r * 0.35, Math.sin(t * 2 + i) * 0.15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (m.resident && !m.angry) drawLabel("💤", m.x + m.r * 0.8, y - m.r * 0.8, 12);
    if (m.maxHearts > 5) {
      drawLabel(`❤ ${Math.max(0, m.hearts)}`, m.x, y - m.r - 12, 14);
    } else {
      const gap = 13;
      const startX = m.x - ((m.maxHearts - 1) * gap) / 2;
      for (let i = 0; i < m.maxHearts; i++) drawEmoji(i < m.hearts ? "❤️" : "🖤", startX + i * gap, y - m.r - 10, 12);
    }
  }

  function drawShot(f) {
    const p = SPELLS[f.spell];
    if (f.spell === "star") { drawEmoji("⭐", f.x, f.y, f.r * 3); return; }
    if (f.spell === "tornado") {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.sin(f.spin) * 0.2);
      drawEmoji("🌪️", 0, 0, f.r * 2.4);
      ctx.restore();
      return;
    }
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2);
    g.addColorStop(0, p.core);
    g.addColorStop(0.4, f.full && f.spell === "fire" ? "#ff5a1f" : p.color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 2, 0, Math.PI * 2); ctx.fill();
    if (f.spell === "lightning") {
      const sp = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / sp, uy = f.vy / sp;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      for (let i = 1; i <= 4; i++) {
        const side = (i % 2 ? 1 : -1) * 6;
        ctx.lineTo(f.x - ux * i * 9 - uy * side, f.y - uy * i * 9 + ux * side);
      }
      ctx.stroke();
    }
  }

  function drawMeteor(me) {
    if (me.t > 0) {
      ctx.strokeStyle = "rgba(255,112,67,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(me.x, me.y, me.r * (0.4 + 0.6 * (1 - me.t / 0.7)), 0, Math.PI * 2); ctx.stroke();
      const k = me.t / 0.7;
      drawEmoji("☄️", me.x + 160 * k, me.y - 380 * k, 56);
    } else {
      const k = 1 + me.t / 0.4;
      ctx.fillStyle = `rgba(255,150,60,${0.5 * k})`;
      ctx.beginPath(); ctx.arc(me.x, me.y, me.r * (1.2 - 0.2 * k), 0, Math.PI * 2); ctx.fill();
    }
  }

  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function drawPickup(p, t) {
    const bob = Math.sin(t * 4 + p.x) * 3;
    if (p.kind === "coin") {
      const y = p.y + Math.sin(t * 5 + p.x) * 2;
      const squeeze = 0.35 + 0.65 * Math.abs(Math.cos(t * 3 + p.x));
      ctx.fillStyle = "#e0a91f";
      ctx.beginPath(); ctx.ellipse(p.x, y, 9 * squeeze, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd257";
      ctx.beginPath(); ctx.ellipse(p.x, y, 6.5 * squeeze, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === "pearl") {
      glow(p.x, p.y + bob, 40, "rgba(255,255,255,0.6)");
      ctx.fillStyle = "#fbf7f0";
      ctx.beginPath(); ctx.arc(p.x, p.y + bob, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(p.x - 4, p.y + bob - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === "chick") {
      glow(p.x, p.y + bob, 40, "rgba(160,210,255,0.6)");
      drawEmoji("🐧", p.x, p.y + Math.abs(Math.sin(t * 5 + p.x)) * -6, 30);
    } else if (p.kind === "book") {
      glow(p.x, p.y + bob, 40, "rgba(255,120,120,0.55)");
      drawEmoji("📕", p.x, p.y + bob, 30);
    } else if (p.kind === "fairystar") {
      glow(p.x, p.y + bob, 60, "rgba(255,230,100,0.7)");
      drawEmoji("🌟", p.x, p.y + bob, 40);
    } else {
      drawEmoji("💖", p.x, p.y + bob, 24);
    }
  }

  function drawNight() {
    const a = darkness();
    if (a <= 0) return;
    const wx = witch.x - cam.x, wy = witch.y - cam.y;
    const g = ctx.createRadialGradient(wx, wy, 40, wx, wy, 260);
    g.addColorStop(0, `rgba(10,12,45,${a * 0.25})`);
    g.addColorStop(1, `rgba(10,12,45,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMinimap() {
    const mw = Math.min(160, W * 0.3), mh = mw * (WORLD_H / WORLD_W);
    const x = W - mw - 12, y = 56;
    const k = mw / WORLD_W;
    ctx.save();
    ctx.fillStyle = isl.pal.sea;
    ctx.fillRect(x, y, mw, mh);
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.fillStyle = isl.pal.sand; islandPath(1); ctx.fill();
    ctx.fillStyle = isl.pal.grass; islandPath(GRASS); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, mw, mh);
    if (isHome()) {
      drawEmoji("🏠", x + HOUSE.x * k, y + HOUSE.y * k, 12);
      drawEmoji("🏘️", x + VILLAGE.x * k, y + VILLAGE.y * k, 12);
    }
    for (const p of map.masters) drawEmoji(p.ms.emoji, x + p.x * k, y + p.y * k, 13);
    if (map.hamlet) drawEmoji("🏘️", x + map.hamlet.x * k, y + map.hamlet.y * k, 12);
    // Mission things you still need
    for (const n of nodes) {
      const st = missions[n.owner];
      if (!st.accepted || st.items[n.i]) continue;
      ctx.fillStyle = n.kind === "flower" ? "#ff9ad5" : "#ffb347";
      ctx.beginPath(); ctx.arc(x + n.x * k, y + n.y * k, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of pickups) {
      if (p.kind === "coin" || p.kind === "heart") continue;
      ctx.fillStyle = p.kind === "fairystar" ? "#ffe066" : "#ffffff";
      ctx.beginPath(); ctx.arc(x + p.x * k, y + p.y * k, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ff3b3b";
    for (const m of monsters) if (!m.jump) ctx.fillRect(x + m.x * k - 1.5, y + m.y * k - 1.5, 3, 3);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.strokeRect(x + cam.x * k, y + cam.y * k, W * k, H * k);
    ctx.fillStyle = "#ffe066";
    ctx.beginPath(); ctx.arc(x + witch.x * k, y + witch.y * k, 3.5, 0, Math.PI * 2); ctx.fill();
    drawLabel(isl.name, x + mw / 2, y + mh + 10, 11);
  }

  function drawStick() {
    if (!stick.active) return;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 55, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy;
    const d = Math.hypot(dx, dy), k = d > 55 ? 55 / d : 1;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.arc(stick.ox + dx * k, stick.oy + dy * k, 24, 0, Math.PI * 2); ctx.fill();
  }

  function draw() {
    const t = performance.now() / 1000;
    if (trip && trip.phase === "sky") { drawSky(t); drawBanner(); return; }
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawGround(t);
    const things = [];
    for (const tr of map.trees) if (inView(tr.x, tr.y, 80)) things.push({ y: tr.y, draw: () => drawTree(tr) });
    if (isl.id !== "snow" && isl.id !== "iceberg") for (const p of map.palms) if (inView(p.x, p.y, 60)) things.push({ y: p.y, draw: () => drawEmoji("🌴", p.x, p.y - 22, 54) });
    if (isHome() && inView(HOUSE.x, HOUSE.y, 120)) things.push({ y: HOUSE.y + 20, draw: () => drawHouse(t) });
    for (const h of map.huts) if (inView(h.x, h.y, 140)) things.push({ y: h.y + 20, draw: () => { drawShadow(h.x, h.y + 30, h.big ? 90 : 50, 0.25); drawEmoji(h.e, h.x, h.y - 10, h.big ? 170 : 96); } });
    if (isHome()) {
      if (inView(SHOPKEEPER.x, SHOPKEEPER.y, 80)) {
        things.push({ y: SHOPKEEPER.y, draw: () => { drawEmoji("🛒", SHOPKEEPER.x + 34, SHOPKEEPER.y + 8, 30); drawPerson("👩‍🌾", SHOPKEEPER.x, SHOPKEEPER.y, t, "Shop"); } });
      }
      for (const v of VILLAGERS) if (inView(v.x, v.y, 60)) things.push({ y: v.y, draw: () => drawPerson(v.emoji, v.x, v.y, t) });
    }
    for (const p of map.people) {
      const saved = islandSaved(isl.id);
      things.push({ y: p.y, draw: () => { drawPerson(p.emoji, p.x, p.y, t); drawLabel(saved ? "😊" : "😨", p.x + 18, p.y - 26, 16); } });
    }
    for (const p of map.masters) things.push({ y: p.y, draw: () => drawPerson(p.ms.emoji, p.x, p.y, t, p.ms.name + masterMark(p.ms), 58) });
    for (const n of nodes) if (inView(n.x, n.y, 60)) things.push({ y: n.y, draw: () => drawNode(n, t) });
    if (witch) {
      for (const m of monsters) things.push({ y: m.jump ? m.jump.ty : m.y, draw: () => drawMonster(m, t) });
      for (const p of pickups) things.push({ y: p.y, draw: () => drawPickup(p, t) });
      things.push({ y: witch.y, draw: () => drawWitch(t) });
    }
    things.sort((a, b) => a.y - b.y);
    for (const th of things) th.draw();
    if (witch) {
      for (const f of shots) drawShot(f);
      for (const me of meteors) drawMeteor(me);
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawAim();
    }
    ctx.restore();

    if (witch) {
      drawNight();
      drawMinimap();
      drawStick();
      // A bright flash when you zap away with lightning
      if (trip && trip.style === "zap" && trip.phase !== "sky") {
        ctx.fillStyle = `rgba(255,255,220,${trip.phase === "up" ? Math.min(1, trip.t / 0.4) : Math.max(0, 1 - trip.t / 0.3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (state === "play" || state === "travel") drawBanner();
    }
  }

  // ---------- HUD ----------
  let shownCool = "";
  function buildSpellButtons() {
    const box = $("powers");
    box.innerHTML = "";
    SPELL_ORDER.forEach((key, i) => {
      const b = document.createElement("button");
      b.type = "button";
      const has = learned.has(key);
      b.className = "power-btn" + (has ? "" : " locked") + (key === current ? " active" : "");
      b.title = has ? `${SPELLS[key].name}: ${SPELLS[key].desc}` : "A spell you forgot. A master can teach it to you.";
      b.innerHTML = `<span class="key">${SPELL_KEYS[i]}</span>${has ? SPELLS[key].icon : "❔"}`;
      const c = cool[key] || 0;
      if (has && c > 0) b.innerHTML += `<span class="cool">${Math.ceil(c)}</span>`;
      // Tap to pick a spell, or press and hold for 3 seconds to fly away
      b.addEventListener("pointerdown", (e) => {
        if (!has) return;
        e.preventDefault();
        selectSpell(key);
        startTravelHold(key, "button");
      });
      b.addEventListener("contextmenu", (e) => e.preventDefault());
      box.appendChild(b);
    });
  }

  // What should you do next? Show the first master you haven't finished.
  function questText() {
    const ms = MASTERS.find((m) => !done.has(m.id) && islandUnlocked(islandById(m.island)) && missions[m.id].accepted)
      || MASTERS.find((m) => !done.has(m.id) && islandUnlocked(islandById(m.island)));
    if (!ms) return learned.size === SPELL_ORDER.length ? "📜 You know all 11 spells! Buy the 🧹 broom in the village." : "";
    const home = islandById(ms.island);
    const st = missions[ms.id];
    if (!st.accepted) {
      return isl.id === home.id
        ? `📜 Talk to the ${ms.emoji} ${ms.name} (up north)`
        : `📜 Fly to ${home.icon} ${home.name} (hold a spell 3 seconds) and talk to the ${ms.emoji} ${ms.name}`;
    }
    if (missionReady(ms.id)) return `📜 Done! Go back to the ${ms.emoji} ${ms.name} on ${home.name}`;
    if (ms.kind === "clear") {
      const where = islandById(ms.where);
      const left = isl.id === ms.where ? monsters.filter((m) => m.target).length : null;
      return `📜 ${ms.emoji} Help the villagers on ${where.icon} ${where.name}` + (left !== null ? ` (${left} monsters left)` : "");
    }
    if (ms.kind === "boss") return "📜 🧚‍♀️ Get the 🌟 wand star back from the 🐉 on 🌋 Dragon Island";
    const label = { chick: "🐧 baby penguins", pearl: "⚪ pearls", book: "📕 magic books", flowers: "🌷 flowers watered", lamps: "🏮 lamps lit" }[ms.item || ms.kind];
    return `📜 ${ms.emoji} ${label}: ${missionProgress(ms.id)}/${ms.need} on ${home.name}`;
  }

  function updateHud() {
    if (!witch) return;
    const h = Math.max(0, witch.hearts);
    $("hearts").textContent = "❤️".repeat(h) + "🖤".repeat(Math.max(0, witch.maxHearts - h));
    $("coins").textContent = coins;
    $("ammo").textContent = `💫 ${ammo}/${MAX_AMMO}`;
    $("ammo").className = ammo <= 0 ? "empty" : ammo <= 5 ? "low" : "";
    $("potions").textContent = potions;
    $("potionBtn").disabled = potions <= 0;
    $("found").textContent = learned.size;
    $("dayLabel").textContent = `${isNight() ? "🌙 Night" : "☀️ Day"} ${day}`;
    const q = questText();
    const ql = $("questLine");
    if (ql.textContent !== q) ql.textContent = q;
    ql.hidden = !q || state !== "play";
    const sig = SPELL_ORDER.map((k) => Math.ceil(Math.max(0, cool[k] || 0))).join(",");
    if (sig !== shownCool) { shownCool = sig; buildSpellButtons(); }
  }

  // ---------- Screens ----------
  const SCREENS = ["startScreen", "storyScreen", "houseScreen", "shopScreen", "boatScreen", "masterScreen", "notebookScreen", "pauseScreen", "winScreen"];

  // The spell notebook: passwords of the spells you have learned
  function openNotebook() {
    if (state !== "play") return;
    openMenu("notebookScreen");
    const rows = $("notebookRows");
    rows.innerHTML = "";
    for (const key of SPELL_ORDER) {
      if (!learned.has(key)) continue;
      const sp = SPELLS[key];
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div class="ico">${sp.icon}</div><div class="info"><div class="name">${sp.name} <span class="desc">(key ${keyFor(key)})</span></div><div class="desc">${sp.desc}</div></div><div class="pw">${PASSWORDS[key].map((r) => RUNES[r]).join("")}</div>`;
      rows.appendChild(row);
    }
    const left = SPELL_ORDER.length - learned.size;
    if (left > 0) {
      const more = document.createElement("p");
      more.textContent = `${left} more spell${left > 1 ? "s" : ""} to learn from the masters...`;
      rows.appendChild(more);
    }
  }
  function closeNotebook() { closeMenu(); }
  function show(id, on) { $(id).hidden = !on; }
  function hideAll() { SCREENS.forEach((id) => show(id, false)); $("questLine").hidden = true; }
  function stopInput() { aim.active = false; aim.id = null; stick.active = false; keys.clear(); travel = null; }
  function openMenu(id) { state = "menu"; stopInput(); hideAll(); show(id, true); }
  function closeMenu() { state = "play"; hideAll(); updateHud(); }

  function refreshStartScreen() {
    const s = loadSave();
    $("continueBtn").hidden = !s;
    $("saveInfo").textContent = s ? `Saved game: Day ${s.day}, 💰 ${s.coins}, ${s.learned.length}/11 spells, ❤️ ${s.maxHearts}` : "";
  }

  let storyList = STORY;
  let dreamCount = 0;
  function showStory(page) {
    storyPage = page;
    const s = storyList[page];
    $("storyArt").textContent = s.art;
    $("storyText").textContent = s.text;
    $("storyDots").textContent = storyList.map((_, i) => (i === page ? "●" : "○")).join("");
    const last = page === storyList.length - 1;
    $("storyNext").textContent = last ? (storyList === STORY ? "Start!" : "Here we go again! 🔁") : "Next";
  }
  function openStory(list = STORY) {
    storyList = list;
    state = "story";
    hideAll();
    show("powers", false);
    show("storyScreen", true);
    showStory(0);
  }

  function beginPlay(save) {
    if (!save) clearSave();
    newGame(save);
    state = "play";
    hideAll();
    show("powers", true);
    $("pauseBtn").textContent = "Pause";
    updateHud();
    if (!save) openSelfIntro(); // a brand-new game starts with the witch remembering Fire
  }

  // House
  function openHouse(note) {
    openMenu("houseScreen");
    renderHouse(note || "");
  }
  function renderHouse(note) {
    $("houseStatus").textContent = `❤️ ${witch.hearts} of ${witch.maxHearts} hearts · ${isNight() ? "🌙 It's night" : "☀️ It's day"} ${day}`;
    const canSleep = clock >= SLEEP_FROM;
    $("bedDesc").textContent = canSleep
      ? "Sleep until morning. Your hearts come back and your game is saved."
      : "You can sleep when it gets dark in the evening.";
    $("sleepBtn").disabled = !canSleep;
    $("shieldDesc").textContent = hasShield
      ? "ON. Monsters can't come near your house, so you sleep really well (+1 max heart each night, up to 10)."
      : "OFF. Buy a shield crystal at the village shop to keep monsters away.";
    $("shelfDesc").textContent = potions > 0 ? `You have ${potions} potion${potions > 1 ? "s" : ""}. Each heals 2 hearts.` : "Empty. Buy potions at the village shop.";
    $("housePotionBtn").disabled = potions <= 0 || witch.hearts >= witch.maxHearts;
    $("houseNote").textContent = note;
  }
  function sleep() {
    let note;
    if (hasShield && witch.maxHearts < MAX_HEARTS) {
      witch.maxHearts++;
      note = `You slept so well! ❤️ You now have ${witch.maxHearts} hearts. Game saved.`;
    } else if (hasShield) {
      note = "You slept so well! Your hearts are full. Game saved.";
    } else {
      note = "Monsters banged on the door all night... A shield crystal would help you sleep better. Game saved.";
    }
    witch.hearts = witch.maxHearts;
    for (const k in cool) cool[k] = 0;
    morning(`☀️ Good morning! Day ${day + 1}`);
    writeSave();
    renderHouse(note);
    updateHud();
  }
  function leaveHouse() {
    closeMenu();
    witch.x = HOUSE.x; witch.y = HOUSE.y + 60;
    latch.house = true;
  }

  // Shop
  const GREETINGS = ["Welcome, good witch! What would you like?", "Hello again! Got some coins for me?", "The monsters are busy today. Stay safe!"];
  function owns(id) { return (id === "wand" && hasWand) || (id === "shield" && hasShield); }
  function openShop() {
    openMenu("shopScreen");
    $("shopGreeting").textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    renderShop("");
  }
  function renderShop(note) {
    $("shopCoins").textContent = coins;
    const rows = $("shopRows");
    rows.innerHTML = "";
    for (const item of SHOP) {
      const row = document.createElement("div");
      row.className = "row";
      const have = owns(item.id);
      const extra = item.id === "potion" ? ` (you have ${potions})` : "";
      row.innerHTML = `<div class="ico">${item.icon}</div><div class="info"><div class="name">${item.name}</div><div class="desc">${item.desc}${extra}</div></div>`;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = have ? "Owned ✓" : `💰 ${item.price}`;
      b.disabled = have || coins < item.price;
      b.addEventListener("click", () => buy(item));
      row.appendChild(b);
      rows.appendChild(row);
    }
    $("shopNote").textContent = note;
  }
  function buy(item) {
    if (coins < item.price || owns(item.id)) return;
    coins -= item.price;
    let note = "";
    if (item.id === "potion") { potions++; note = "🧪 A healing potion! Drink it with H when you're hurt."; }
    if (item.id === "shield") { hasShield = true; note = "🛡️ Your house is protected now. Monsters can't come close!"; }
    if (item.id === "wand") { hasWand = true; note = "🔮 A new wand! Every spell does 1 more damage now."; }
    updateHud();
    if (item.id === "broom") { win(); return; }
    renderShop(note);
  }
  function leaveShop() { closeMenu(); latch.shop = true; }

  // Boat
  function islandUnlocked(i) {
    if (i.id === "home") return true;
    if (i.mission) return missions[i.mission].accepted; // shows up once a master asks you to go
    const idx = MASTER_ISLANDS.indexOf(i);
    return idx <= 0 || mastersOn(MASTER_ISLANDS[idx - 1].id).every((m) => done.has(m.id));
  }
  // The island map you see after holding a spell for 3 seconds
  function openBoat(spell) {
    mapSpell = spell;
    openMenu("boatScreen");
    $("flyArt").textContent = SPELLS[spell].icon + { rocket: "🚀", zap: "⚡", spin: "🌪️", float: "✨" }[TRAVEL_STYLE[spell] || "float"];
    const rows = $("boatRows");
    rows.innerHTML = "";
    for (const i of ISLANDS) {
      if (i.mission && !islandUnlocked(i)) continue; // mission islands appear when you need them
      const row = document.createElement("div");
      const here = i.id === isl.id;
      const open = islandUnlocked(i);
      row.className = "row" + (here ? " here" : "") + (open ? "" : " locked");
      let desc;
      if (i.id === "home") desc = "Your house, the village and the shop.";
      else if (i.mission) {
        const ms = masterById(i.mission);
        desc = islandSaved(i.id) || (ms.kind === "boss" && missions.fairy.items[0])
          ? "You helped the villagers here! 😊 ✓"
          : `Villagers in trouble! (Mission from the ${ms.emoji} ${ms.name})`;
      } else if (!open) desc = "🔒 Help the master on the island before this one first.";
      else desc = mastersOn(i.id).map((m) => `${m.emoji} ${m.name}: ${SPELLS[m.spell].icon}${done.has(m.id) ? " ✓" : ""}`).join(" · ");
      const stars = i.tier ? " " + "★".repeat(i.tier) : "";
      row.innerHTML = `<div class="ico">${i.icon}</div><div class="info"><div class="name">${i.name}${stars}</div><div class="desc">${desc}</div></div>`;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = here ? "You're here" : open ? "Go!" : "🔒";
      b.disabled = here || !open;
      b.addEventListener("click", () => startTrip(i.id));
      row.appendChild(b);
      rows.appendChild(row);
    }
  }
  function leaveBoat() { closeMenu(); }

  // ---------- Flying between islands ----------
  function startTravelHold(spell, source) {
    if (state !== "play" || !learned.has(spell) || travel) return;
    travel = { spell, t: 0, source };
  }
  function cancelTravel(msg) {
    if (!travel) return;
    if (msg && travel.t > 0.6) banner = { text: msg, t: 2.5 };
    travel = null;
  }
  function startTrip(dest) {
    closeMenu();
    const style = TRAVEL_STYLE[mapSpell] || "float";
    trip = { spell: mapSpell, style, dest, phase: "up", t: 0 };
    state = "travel";
    stopInput();
    banner = { text: TRAVEL_WORDS[style], t: 2 };
    $("questLine").hidden = true;
  }
  // Up in the sky: flying monsters come at you. Dodge them!
  const SKY_TIME = { rocket: 12, float: 16, spin: 12, zap: 7 };
  const SKY_SPEED = { rocket: 1.2, float: 0.75, spin: 1, zap: 1.7 };
  const SKY_FOES = {
    // aim = how fast it turns toward you (pixels per second)
    bat:    { e: "🦇", r: 18, sp: 260, wave: 60,  aim: 70 },
    bird:   { e: "🦅", r: 22, sp: 320, wave: 0,   aim: 120 },
    ghost:  { e: "👻", r: 22, sp: 200, wave: 110, aim: 50 },
    dragon: { e: "🐉", r: 32, sp: 230, wave: 40,  aim: 90 },
  };
  function startSky() {
    const dest = islandById(trip.dest);
    Object.assign(trip, {
      phase: "sky", t: 0, dur: SKY_TIME[trip.style], tier: dest.tier || 1,
      wx: W * 0.22, wy: H * 0.5, foes: [], spawn: 1.5,
      clouds: Array.from({ length: 9 }, () => ({ x: Math.random() * W, y: 60 + Math.random() * H * 0.75, s: 0.4 + Math.random() * 0.8, r: 30 + Math.random() * 50 })),
    });
    particles = [];
    skyPointer = null;
    banner = { text: `Move your mouse to dodge the flying monsters! ${dest.icon} ${dest.name} is coming up!`, t: 3.5 };
  }
  function spawnFoe() {
    const bag = ["bat", "bat", "bird"];
    if (trip.tier >= 3) bag.push("ghost");
    if (trip.tier >= 5) bag.push("bird", "ghost");
    if (trip.tier >= 7) bag.push("dragon");
    if (trip.tier >= 9) bag.push("dragon", "bird");
    const type = bag[Math.floor(Math.random() * bag.length)];
    const y = 90 + Math.random() * (H - 160);
    trip.foes.push({ ...SKY_FOES[type], x: W + 50, y, baseY: y, ph: Math.random() * 6 });
  }
  function updateTrip(dt) {
    clock += dt;
    if (banner && banner.t > 0) banner.t -= dt;
    if (witch.hurt > 0) witch.hurt -= dt;
    if (witch.shieldT > 0) witch.shieldT -= dt;
    for (const k in cool) if (cool[k] > 0) cool[k] -= dt;
    trip.t += dt;
    const col = SPELLS[trip.spell].color || "#ffe066";
    if (trip.phase === "up") {
      const dur = trip.style === "zap" ? 0.4 : 1.2;
      const k = Math.min(1, trip.t / dur);
      witch.lift = trip.style === "zap" ? 0 : k * k * 900;
      for (let i = 0; i < 3; i++) {
        const fx = witch.x + (Math.random() - 0.5) * 20, fy = witch.y - witch.lift + 26;
        particles.push({ x: fx, y: fy, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160, life: 0.5, max: 0.5, color: trip.style === "rocket" ? (Math.random() < 0.5 ? "#ff7a29" : "#ffd257") : col, r: 3 + Math.random() * 4 });
      }
      if (trip.t >= dur) { witch.lift = 0; startSky(); }
    } else if (trip.phase === "sky") {
      const { mx, my } = moveInput();
      if (mx || my) skyPointer = null; // keys take over from the mouse
      if (skyPointer) {
        // Glide toward the mouse (not instantly, so dodging takes skill)
        const dx = skyPointer.x - trip.wx, dy = skyPointer.y - trip.wy, d = Math.hypot(dx, dy);
        const step = Math.min(d, 480 * dt);
        if (d > 1) { trip.wx += (dx / d) * step; trip.wy += (dy / d) * step; }
      } else {
        trip.wx += mx * 260 * dt;
        trip.wy += my * 320 * dt;
      }
      trip.wx = Math.max(40, Math.min(W * 0.6, trip.wx));
      trip.wy = Math.max(80, Math.min(H - 50, trip.wy));
      const speed = SKY_SPEED[trip.style] * (1 + trip.tier * 0.05);
      trip.spawn -= dt;
      if (trip.spawn <= 0 && trip.t < trip.dur - 1.5) {
        spawnFoe();
        trip.spawn = Math.max(0.4, 1.4 - trip.tier * 0.1) / speed * (0.7 + Math.random() * 0.6);
      }
      for (const c of trip.clouds) { c.x -= c.s * 220 * speed * dt; if (c.x < -120) { c.x = W + 120; c.y = 60 + Math.random() * H * 0.75; } }
      for (const f of trip.foes) {
        f.x -= f.sp * speed * dt;
        // They try to attack: while still ahead of you, they turn toward where you are
        if (f.x > trip.wx + 40) {
          const pull = f.aim * (1 + trip.tier * 0.08) * dt;
          f.baseY += Math.max(-pull, Math.min(pull, trip.wy - f.baseY));
        }
        f.y = f.baseY + Math.sin(trip.t * 3 + f.ph) * f.wave;
        if (!f.hit && Math.hypot(f.x - trip.wx, f.y - trip.wy) < f.r + 20) {
          f.hit = true;
          if (witch.shieldT > 0) { puff(f.x, f.y, "#9fd8ff", 10); f.x = -999; continue; }
          if (witch.hurt <= 0) {
            witch.hearts--;
            witch.hurt = HURT_TIME;
            puff(trip.wx, trip.wy, "#ff5a7a", 14);
            banner = { text: "Ouch! Dodge them!", t: 1.2 };
            if (witch.hearts <= 0) { witch.hearts = 0; trip = null; updateHud(); gameOver(); return; }
          }
        }
      }
      trip.foes = trip.foes.filter((f) => f.x > -80);
      // Trail behind the witch
      particles.push({ x: trip.wx - 24, y: trip.wy + 8 + (Math.random() - 0.5) * 10, vx: -200 - Math.random() * 120, vy: (Math.random() - 0.5) * 40, life: 0.45, max: 0.45, color: trip.style === "rocket" ? (Math.random() < 0.5 ? "#ff7a29" : "#ffd257") : col, r: 3 + Math.random() * 3 });
      if (trip.t >= trip.dur) {
        // Coming down onto the new island
        const s = trip;
        goToIsland(s.dest);
        trip = s;
        if (isHome()) { witch.x = HOUSE.x; witch.y = HOUSE.y + 100; updateCamera(); }
        trip.phase = "down";
        trip.t = 0;
        witch.lift = trip.style === "zap" ? 0 : 800;
      }
    } else if (trip.phase === "down") {
      const dur = trip.style === "zap" ? 0.3 : 1.1;
      const k = Math.min(1, trip.t / dur);
      witch.lift = trip.style === "zap" ? 0 : (1 - k) * (1 - k) * 800;
      if (Math.random() < 0.6) particles.push({ x: witch.x + (Math.random() - 0.5) * 30, y: witch.y - witch.lift, vx: 0, vy: -80, life: 0.4, max: 0.4, color: col, r: 3 });
      if (trip.t >= dur) {
        witch.lift = 0;
        puff(witch.x, witch.y + 20, "#e6d3a3", 18, 0.8);
        trip = null;
        state = "play";
      }
    }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    particles = particles.filter((p) => p.life > 0);
    updateHud();
  }

  function drawSky(t) {
    const night = darkness() > 0.3;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, night ? "#141a45" : "#5bb6ff");
    g.addColorStop(1, night ? "#3a3f7a" : "#d4f0ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // The sea far below
    ctx.fillStyle = night ? "#1c3557" : "#2a78c2";
    ctx.fillRect(0, H - 26, W, 26);
    for (const c of trip.clouds) {
      ctx.fillStyle = night ? "rgba(200,210,255,0.25)" : "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.r * 1.6, c.r * 0.6, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.r * 0.6, c.y - c.r * 0.3, c.r * 0.8, c.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const f of trip.foes) drawEmoji(f.e, f.x, f.y, f.r * 2.2);
    // The witch
    if (witch.hurt > 0 && Math.floor(witch.hurt * 16) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.save();
    ctx.translate(trip.wx, trip.wy + (trip.style === "float" ? Math.sin(t * 3) * 5 : 0));
    if (trip.style === "spin") ctx.rotate(Math.sin(t * 10) * 0.35);
    ctx.scale(-1, 1);
    drawEmoji("🧙‍♀️", 0, 0, 52);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (witch.shieldT > 0) {
      ctx.strokeStyle = "rgba(190,230,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(trip.wx, trip.wy, 40, 0, Math.PI * 2); ctx.stroke();
    }
    // How far to go
    const dest = islandById(trip.dest);
    const bw = Math.min(320, W - 60), bx = (W - bw) / 2, by = 62;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(bx, by, bw * Math.min(1, trip.t / trip.dur), 10);
    drawEmoji("🧙‍♀️", bx + bw * Math.min(1, trip.t / trip.dur), by + 5, 18);
    drawEmoji(dest.icon, bx + bw + 16, by + 5, 20);
  }

  function drawBanner() {
    if (!banner || banner.t <= 0) return;
    ctx.globalAlpha = Math.min(1, banner.t);
    const size = Math.round(Math.max(15, Math.min(24, W / 32)));
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const words = banner.text.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > Math.min(W - 40, 640) && line) { lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
    const y0 = Math.max(110, H * 0.22);
    lines.forEach((l, i) => {
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.strokeText(l, W / 2, y0 + i * size * 1.3);
      ctx.fillStyle = "#fff";
      ctx.fillText(l, W / 2, y0 + i * size * 1.3);
    });
    ctx.globalAlpha = 1;
  }

  // Masters: a mission, then a little lesson where you press the spell's key
  function spellRow(ms) {
    const sp = SPELLS[ms.spell];
    $("masterRows").innerHTML = `<div class="row"><div class="ico">${sp.icon}</div><div class="info"><div class="name">${sp.name} <span style="color:var(--muted)">(key ${keyFor(ms.spell)})</span>${learned.has(ms.spell) ? " ✓" : ""}</div><div class="desc">${sp.desc}</div></div></div>`;
  }
  function openMaster(ms) {
    talkingTo = ms;
    const st = missions[ms.id];
    openMenu("masterScreen");
    lesson = null;
    $("lessonBox").hidden = true;
    $("masterArt").textContent = ms.emoji;
    $("masterName").textContent = ms.name;
    $("masterNote").textContent = "";
    $("leaveMasterBtn").hidden = false;
    $("leaveMasterBtn").textContent = "Okay";
    spellRow(ms);
    const btn = $("learnBtn");
    if (done.has(ms.id)) {
      $("masterText").textContent = ms.done;
      btn.hidden = true;
    } else if (!st.accepted) {
      $("masterText").textContent = ms.ask;
      btn.textContent = "I'll help! 💪";
      btn.hidden = false;
      btn.onclick = acceptMission;
      $("leaveMasterBtn").textContent = "Maybe later";
    } else if (!missionReady(ms.id)) {
      let text;
      if (ms.kind === "clear") text = `Please help the villagers on ${islandById(ms.where).icon} ${islandById(ms.where).name}! Hold a spell for 3 seconds to fly there.`;
      else if (ms.kind === "boss") text = "Please get my wand star back from the dragon on 🌋 Dragon Island! Hold a spell for 3 seconds to fly there.";
      else text = `Thank you for helping! So far: ${missionProgress(ms.id)} of ${ms.need}.`;
      $("masterText").textContent = text;
      btn.hidden = true;
    } else {
      $("masterText").textContent = ms.thanks;
      btn.textContent = "Start the lesson ✨";
      btn.hidden = false;
      btn.onclick = startLesson;
    }
  }
  function acceptMission() {
    const ms = talkingTo;
    missions[ms.id].accepted = true;
    if (ms.kind === "collect" && isl.id === ms.island) spawnCollectables(ms);
    closeMenu();
    latch.master = ms.id;
    const where = ms.where ? islandById(ms.where) : null;
    banner = { text: where ? `📜 New mission! Hold a spell for 3 seconds to fly to ${where.icon} ${where.name}.` : "📜 New mission! Check the top-left corner.", t: 4.5 };
  }
  // ----- Spell lessons: every spell has a secret password made of magic runes -----
  // The master shows the password one rune at a time, then you click it back.
  function buildPad() {
    const pad = $("lessonPad");
    pad.innerHTML = "";
    RUNES.forEach((r, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<span class="k">${i + 1}</span>${r}`;
      b.addEventListener("click", () => padPress(i));
      pad.appendChild(b);
    });
  }
  function setPadEnabled(on) { for (const b of $("lessonPad").children) b.disabled = !on; }
  function flashRune(i) {
    const b = $("lessonPad").children[i];
    b.classList.add("lit");
    setTimeout(() => b.classList.remove("lit"), 450);
  }
  function renderSeq() {
    const pw = PASSWORDS[lesson.spell];
    $("lessonSeq").textContent = pw.map((_, i) => (i < lesson.input.length ? RUNES[lesson.input[i]] : "◯")).join(" ");
  }
  function beginWatch() {
    const pw = PASSWORDS[lesson.spell];
    const token = ++lessonToken;
    lesson.phase = "watch";
    lesson.input = [];
    $("lessonBox").hidden = false;
    $("lessonText").textContent = "Watch carefully! 👀";
    renderSeq();
    setPadEnabled(false);
    pw.forEach((r, i) => setTimeout(() => { if (token === lessonToken) flashRune(r); }, 700 + i * 800));
    setTimeout(() => {
      if (token !== lessonToken) return;
      lesson.phase = "input";
      $("lessonText").textContent = "Your turn! Click the runes in the same order.";
      setPadEnabled(true);
    }, 700 + pw.length * 800 + 150);
  }
  function padPress(i) {
    if (!lesson || lesson.phase !== "input") return;
    flashRune(i);
    const pw = PASSWORDS[lesson.spell];
    if (pw[lesson.input.length] !== i && lesson.recharge) {
      // Recharging: nobody shows you the password, you have to remember it!
      lesson.input = [];
      renderSeq();
      $("masterNote").textContent = "Oops! That's not the password. Try again! (Forgot? Peek in your 📓 notebook.)";
      return;
    }
    if (pw[lesson.input.length] !== i) {
      lesson.phase = "watch";
      setPadEnabled(false);
      $("masterNote").textContent = "Oops! That's not the password. Watch again!";
      const token = ++lessonToken;
      setTimeout(() => { if (token === lessonToken) { $("masterNote").textContent = ""; beginWatch(); } }, 1200);
      return;
    }
    lesson.input.push(i);
    renderSeq();
    if (lesson.input.length === pw.length) {
      if (lesson.recharge) finishRecharge(); else finishLesson();
    }
  }

  // ----- Recharging your magic shots: pick a spell, then enter its password from memory -----
  const RECHARGE = { id: "recharge", emoji: "🧙‍♀️", name: "Recharge your magic" };
  function openRecharge() {
    if (state !== "play" || ammo >= MAX_AMMO) return;
    talkingTo = RECHARGE;
    openMenu("masterScreen");
    lesson = null;
    ++lessonToken;
    $("lessonBox").hidden = true;
    $("masterArt").textContent = "🧙‍♀️💫";
    $("masterName").textContent = RECHARGE.name;
    $("masterText").textContent = ammo <= 0
      ? `"Out of magic! What spell do you want to do?"`
      : `"I have ${ammo} magic shots left. What spell do you want to recharge with?"`;
    $("masterNote").textContent = "";
    $("learnBtn").hidden = true;
    $("leaveMasterBtn").hidden = false;
    $("leaveMasterBtn").textContent = "Not now";
    const rows = $("masterRows");
    rows.innerHTML = "";
    for (const key of SPELL_ORDER) {
      if (!learned.has(key)) continue;
      const sp = SPELLS[key];
      const row = document.createElement("div");
      row.className = "row pick";
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      row.innerHTML = `<div class="ico">${sp.icon}</div><div class="info"><div class="name">${sp.name}</div><div class="desc">${sp.desc}</div></div>`;
      row.addEventListener("click", () => chooseRecharge(key));
      rows.appendChild(row);
    }
  }
  function chooseRecharge(spell) {
    const sp = SPELLS[spell];
    lesson = { spell, phase: "input", input: [], recharge: true };
    ++lessonToken;
    $("masterRows").innerHTML = `<div class="row"><div class="ico">${sp.icon}</div><div class="info"><div class="name">${sp.name}</div><div class="desc">${sp.desc}</div></div></div>`;
    $("masterText").textContent = `"${sp.icon} ${sp.name}! Now... what was the password again?"`;
    $("lessonBox").hidden = false;
    $("lessonText").textContent = "Enter the password!";
    renderSeq();
    setPadEnabled(true);
    $("masterNote").textContent = "";
    const peek = $("learnBtn");
    peek.hidden = false;
    peek.textContent = "Peek in notebook 📓";
    peek.onclick = () => { $("masterNote").textContent = `📓 ${sp.name}: ${PASSWORDS[spell].map((r) => RUNES[r]).join(" ")}`; };
  }
  function finishRecharge() {
    const spell = lesson.spell;
    const sp = SPELLS[spell];
    lesson = null;
    ++lessonToken;
    ammo = MAX_AMMO;
    current = spell;
    buildSpellButtons();
    $("lessonBox").hidden = true;
    $("learnBtn").hidden = true;
    $("masterText").textContent = `"${sp.icon} ${sp.name}! I remember!" Magic recharged: 💫 ${MAX_AMMO} shots ready!`;
    $("masterNote").textContent = "";
    $("leaveMasterBtn").hidden = false;
    $("leaveMasterBtn").textContent = "Fire away! ✨";
    puff(witch.x, witch.y, "#c9b9ff", 30);
    updateHud();
  }
  function startLesson() {
    const ms = talkingTo;
    const sp = SPELLS[ms.spell];
    $("learnBtn").hidden = true;
    $("leaveMasterBtn").hidden = true;
    lesson = { spell: ms.spell, phase: "pick", input: [] };
    $("masterText").textContent = `${ms.emoji} "Which power do you want to learn? Click it!"`;
    // The spell card becomes a big button to click
    const rows = $("masterRows");
    rows.innerHTML = `<div class="row pick" role="button" tabindex="0"><div class="ico">${sp.icon}</div><div class="info"><div class="name">${sp.name} 👆</div><div class="desc">${sp.desc}</div></div></div>`;
    const card = rows.firstChild;
    const pick = () => {
      if (!lesson || lesson.phase !== "pick") return;
      card.classList.remove("pick");
      $("masterText").textContent = `${ms.emoji} "Here is the secret password for ${sp.icon} ${sp.name}. Watch, then do it back!"`;
      beginWatch();
    };
    card.addEventListener("click", pick);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") pick(); });
  }
  function finishLesson() {
    const who = talkingTo;
    const spell = lesson.spell;
    const sp = SPELLS[spell];
    lesson = null;
    ++lessonToken;
    $("lessonBox").hidden = true;
    learned.add(spell);
    current = spell;
    if (who.id === "self") {
      $("masterText").textContent = `"Yes! ${sp.icon} ${sp.name}! I remember now!" The masters on the other islands can help me remember the rest of my spells.`;
      $("masterNote").textContent = "🔥 You remembered Fire!";
      $("leaveMasterBtn").textContent = "Let's go! 🔥";
    } else {
      done.add(who.id);
      writeSave();
      $("masterText").textContent = `Wonderful! You learned ${sp.icon} ${sp.name}! ${who.done}`;
      $("masterNote").textContent = "✨ New spell! Game saved ✓";
      $("leaveMasterBtn").textContent = "Thank you!";
      spellRow(who);
    }
    // The witch writes the password in her notebook, then it flies up to the 📓 button
    $("leaveMasterBtn").hidden = true;
    const note = $("masterNote").textContent;
    $("masterNote").textContent = "✏️ Writing it in the notebook...";
    buildSpellButtons();
    puff(witch.x, witch.y, "#ffe066", 40);
    writeInNotebook(spell, () => {
      $("masterNote").textContent = note + " 📓 Saved in your notebook!";
      $("leaveMasterBtn").hidden = false;
    });
  }

  function writeInNotebook(spell, then) {
    const sp = SPELLS[spell];
    const pw = PASSWORDS[spell];
    const box = document.createElement("div");
    box.className = "write-book";
    box.innerHTML = `<div class="wb-art">🧙‍♀️📓</div><div class="wb-title">Writing in my Spell Notebook...</div><div class="wb-name">${sp.icon} ${sp.name}</div><div class="runes"><span class="pencil">✏️</span></div>`;
    document.body.appendChild(box);
    const hud = document.querySelector(".hud");
    hud.style.zIndex = "60"; // so you can see the notebook land on the 📓 button
    const runes = box.querySelector(".runes");
    const pencil = runes.querySelector(".pencil");
    let i = 0;
    const writeNext = () => {
      if (i < pw.length) {
        const s = document.createElement("span");
        s.className = "rune-in";
        s.textContent = RUNES[pw[i]];
        runes.insertBefore(s, pencil);
        i++;
        setTimeout(writeNext, 550);
        return;
      }
      pencil.textContent = "✔️";
      pencil.className = "rune-in";
      box.querySelector(".wb-title").textContent = "Got it! I won't forget!";
      setTimeout(flyUp, 700);
    };
    const flyUp = () => {
      const target = $("bookBtn").getBoundingClientRect();
      const r = box.getBoundingClientRect();
      const dx = target.left + target.width / 2 - (r.left + r.width / 2);
      const dy = target.top + target.height / 2 - (r.top + r.height / 2);
      box.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.08) rotate(20deg)`;
      box.style.opacity = "0.3";
      setTimeout(() => {
        box.remove();
        const btn = $("bookBtn");
        btn.classList.add("bump");
        setTimeout(() => { btn.classList.remove("bump"); hud.style.zIndex = ""; }, 1600);
        then();
      }, 870);
    };
    setTimeout(writeNext, 500);
  }
  // At the very start, the witch tries to remember her spells
  const SELF = { id: "self", emoji: "🧙‍♀️", name: "The Good Witch", spell: "fire" };
  function openSelfIntro() {
    talkingTo = SELF;
    openMenu("masterScreen");
    lesson = null;
    $("lessonBox").hidden = true;
    $("masterArt").textContent = "🧙‍♀️💫";
    $("masterName").textContent = "The Good Witch";
    $("masterRows").innerHTML = "";
    $("masterNote").textContent = "";
    $("masterText").textContent = `"Ouch, my head! What are my spells again? Hmm... I can't remember ANY of them!"`;
    $("leaveMasterBtn").hidden = true;
    const btn = $("learnBtn");
    btn.hidden = false;
    btn.textContent = "Try to remember 🤔";
    btn.onclick = () => {
      btn.hidden = true;
      lesson = { spell: "fire", phase: "watch", input: [] };
      $("masterText").textContent = `"Wait... Oh! I remember 🔥 Fire! It's a warm, flaming fireball. Its password goes like this..."`;
      beginWatch();
    };
  }
  function leaveMaster() {
    if (lesson && !lesson.recharge) return; // finish the lesson first
    lesson = null;
    ++lessonToken;
    closeMenu();
    if (talkingTo && talkingTo.id === "recharge") return;
    if (talkingTo && talkingTo.id === "self") {
      banner = { text: "Hold 1 (🔥 Fire) for 3 seconds to blast off to another island!", t: 5 };
      return;
    }
    latch.master = talkingTo ? talkingTo.id : null;
    if (learned.size === SPELL_ORDER.length) banner = { text: "You know all 11 spells! Buy the 🧹 broom in the village to fly home.", t: 5 };
  }

  // Out of hearts: she wakes up at home... it was all a dream! Then the whole adventure starts again.
  function gameOver() {
    stopInput();
    trip = null;
    clearSave(); // it's a brand-new loop
    dreamCount++;
    openStory(dreamStory(dreamCount));
  }

  function win() {
    state = "won";
    stopInput();
    const n = learned.size;
    $("winText").textContent = n === SPELL_ORDER.length
      ? "With all eleven spells remembered and a new broom, the good witch waved goodbye to the villagers and the ten masters, and flew home through the sunny sky."
      : "The good witch jumped on her new broom, waved goodbye to the villagers, and flew home. Maybe one day she'll come back to learn the rest of her spells!";
    $("winInfo").textContent = `You got home on Day ${day} knowing ${n} of 11 spells.${n < 11 ? " Can you learn all 11 next time?" : " 🏆 You learned them all!"}`;
    clearSave();
    show("powers", false);
    hideAll();
    show("winScreen", true);
  }

  function togglePause() {
    if (state === "play") {
      state = "paused";
      stopInput();
      show("pauseScreen", true);
      $("pauseBtn").textContent = "Resume";
    } else if (state === "paused") {
      state = "play";
      show("pauseScreen", false);
      $("pauseBtn").textContent = "Pause";
    }
  }

  // ---------- Input ----------
  canvas.addEventListener("pointerdown", (e) => {
    if (state === "travel") { e.preventDefault(); skyPointer = { x: e.clientX, y: e.clientY }; return; }
    if (state !== "play") return;
    e.preventDefault();
    // Clicking the witch herself opens the recharge screen
    if (ammo < MAX_AMMO && Math.hypot(e.clientX + cam.x - witch.x, e.clientY + cam.y - (witch.y - 6)) < 36) { openRecharge(); return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (e.pointerType === "touch" && e.clientX < W / 2 && !stick.active) {
      Object.assign(stick, { active: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
      return;
    }
    if (!aim.active) Object.assign(aim, { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, held: 0 });
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state === "travel") { skyPointer = { x: e.clientX, y: e.clientY }; return; }
    if (stick.active && e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; }
    if (aim.active && e.pointerId === aim.id) { aim.sx = e.clientX; aim.sy = e.clientY; }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (stick.active && e.pointerId === stick.id) stick.active = false;
    if (aim.active && e.pointerId === aim.id) release();
  });
  canvas.addEventListener("pointercancel", (e) => {
    if (stick.active && e.pointerId === stick.id) stick.active = false;
    if (aim.active && e.pointerId === aim.id) { aim.active = false; aim.id = null; }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("wheel", (e) => { if (state === "play") { e.preventDefault(); cycleSpell(e.deltaY > 0 ? 1 : -1); } }, { passive: false });
  window.addEventListener("blur", () => { if (state === "play") togglePause(); });

  const MENU_CLOSE = { houseScreen: leaveHouse, shopScreen: leaveShop, boatScreen: leaveBoat, masterScreen: leaveMaster, notebookScreen: closeNotebook };
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (lesson && state === "menu") {
      // Number keys can press the runes too
      e.preventDefault();
      const n = Number(k);
      if (n >= 1 && n <= RUNES.length) padPress(n - 1);
      return;
    }
    if (k === "p" || k === "escape") {
      if (state === "menu") { for (const id in MENU_CLOSE) if (!$(id).hidden) MENU_CLOSE[id](); return; }
      togglePause();
      return;
    }
    if (state === "story" && (k === "enter" || k === " ")) { e.preventDefault(); $("storyNext").click(); return; }
    const moveKey = ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(k);
    if (state === "travel" && moveKey) { e.preventDefault(); keys.add(k); return; }
    if (state !== "play") return;
    const idx = SPELL_KEYS.indexOf(k);
    if (idx >= 0) {
      selectSpell(SPELL_ORDER[idx]);
      if (!e.repeat) startTravelHold(SPELL_ORDER[idx], "key:" + k); // keep holding to fly away
      return;
    }
    if (k === "q") { cycleSpell(-1); return; }
    if (k === "e") { cycleSpell(1); return; }
    if (k === "h") { drinkPotion(); return; }
    if (k === "r") { openRecharge(); return; }
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(k)) {
      e.preventDefault();
      keys.add(k);
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    keys.delete(k);
    if (travel && travel.source === "key:" + k) cancelTravel("Keep holding for 3 seconds to fly away!");
  });
  window.addEventListener("pointerup", () => { if (travel && travel.source === "button") cancelTravel("Keep holding for 3 seconds to fly away!"); });
  window.addEventListener("pointercancel", () => { if (travel && travel.source === "button") cancelTravel(); });

  $("startBtn").addEventListener("click", () => openStory());
  $("continueBtn").addEventListener("click", () => beginPlay(loadSave()));
  $("storyNext").addEventListener("click", () => {
    if (storyPage < storyList.length - 1) showStory(storyPage + 1); else beginPlay(null);
  });
  $("storySkip").addEventListener("click", () => beginPlay(null));
  $("sleepBtn").addEventListener("click", sleep);
  $("housePotionBtn").addEventListener("click", () => { drinkPotion(); renderHouse("🧪 Glug glug! You feel better."); });
  $("leaveHouseBtn").addEventListener("click", leaveHouse);
  $("leaveShopBtn").addEventListener("click", leaveShop);
  $("leaveBoatBtn").addEventListener("click", leaveBoat);
  $("leaveMasterBtn").addEventListener("click", leaveMaster);
  $("bookBtn").addEventListener("click", openNotebook);
  $("closeBookBtn").addEventListener("click", closeNotebook);
  $("potionBtn").addEventListener("click", () => { if (state === "play") drinkPotion(); });
  $("winAgainBtn").addEventListener("click", () => { refreshStartScreen(); hideAll(); state = "start"; show("startScreen", true); });
  $("resumeBtn").addEventListener("click", togglePause);
  $("pauseBtn").addEventListener("click", togglePause);
  window.addEventListener("resize", () => { resize(); if (witch) updateCamera(); });

  // ---------- Main loop ----------
  function loop(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, t - lastTime || 0);
    lastTime = t;
    if (state === "play") update(dt);
    else if (state === "travel" && trip) updateTrip(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  buildPad();
  isl = ISLANDS[0];
  map = buildMap(isl);
  nodes = [];
  cam.x = Math.max(0, HOUSE.x - W / 2);
  cam.y = Math.max(0, HOUSE.y - H / 2);
  refreshStartScreen();
  requestAnimationFrame(loop);
})();
