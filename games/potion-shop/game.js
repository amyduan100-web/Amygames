// Potion Shop: an original game by Amy.
// You live in a tiny house and decide to open a potion shop in the village. Customers walk in,
// ask for help, and you make the right potion, food or magic food. They sit at a table to eat
// and drink. Supplies run out, so you shop in town. Hire helpers and become the big boss, grow
// your shop, buy a Play House, and one day sell your little house and move into a mansion!
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // ---------- Ingredients (price = coins for a pack of 5) ----------
  const PACK = 5;
  const INGREDIENTS = {
    water:    { icon: "💧", name: "Water",     color: "#5ab8ff", group: "food",  price: 3 },
    milk:     { icon: "🥛", name: "Milk",      color: "#f4f4f4", group: "food",  price: 5 },
    apple:    { icon: "🍎", name: "Apple",     color: "#e8443a", group: "food",  price: 5 },
    bread:    { icon: "🍞", name: "Bread",     color: "#d9a45b", group: "food",  price: 6 },
    cookie:   { icon: "🍪", name: "Cookie",    color: "#b8814a", group: "food",  price: 6 },
    honey:    { icon: "🍯", name: "Honey",     color: "#f2b632", group: "food",  price: 8 },
    flower:   { icon: "🌸", name: "Flower",    color: "#ff9ad5", group: "magic", price: 8 },
    leaf:     { icon: "🍃", name: "Leaf",      color: "#5fd068", group: "magic", price: 6 },
    mushroom: { icon: "🍄", name: "Mushroom",  color: "#c0392b", group: "magic", price: 8 },
    fire:     { icon: "🔥", name: "Fire salt", color: "#ff6a2a", group: "magic", price: 10 },
    snow:     { icon: "❄️", name: "Snow",      color: "#e6f6ff", group: "magic", price: 9 },
    moon:     { icon: "🌙", name: "Moon dew",  color: "#8f7bff", group: "magic", price: 12 },
    star:     { icon: "⭐", name: "Stardust",  color: "#ffe066", group: "magic", price: 14 },
    shell:    { icon: "🐚", name: "Sea shell", color: "#ffc9b0", group: "magic", price: 12 },
    crystal:  { icon: "💎", name: "Crystal",   color: "#7fe0ff", group: "magic", price: 18 },
  };
  const startStock = () => Object.fromEntries(Object.entries(INGREDIENTS).map(([id, i]) => [id, i.group === "food" ? 8 : 5]));

  // ---------- Things you can make ----------
  // kind: food = plain food or drink (easy), magic = magic food, potion = potion
  // cost = coins to learn the recipe at the Library (0 = you know it from the start)
  const ITEMS = [
    { id: "w",  kind: "food", icon: "💧", name: "Glass of water", does: "Just a nice cold glass of water.", recipe: ["water"], cost: 0,
      asks: ["I walked all the way from the farm and I'm so thirsty. Could I have a glass of water, please?", "Could I have some water? It's very hot outside today."] },
    { id: "m",  kind: "food", icon: "🥛", name: "Glass of milk", does: "A glass of fresh milk.", recipe: ["milk"], cost: 0,
      asks: ["Could I have a glass of milk, please? I'm growing big and strong!", "May I have some milk to go with my lunch?"] },
    { id: "a",  kind: "food", icon: "🍎", name: "Apple", does: "A crunchy red apple.", recipe: ["apple"], cost: 0,
      asks: ["I'm a little hungry. Could I have an apple, please?", "My mom says I need a healthy snack. Do you have an apple?"] },
    { id: "b",  kind: "food", icon: "🍞", name: "Bread", does: "A warm loaf of bread.", recipe: ["bread"], cost: 0,
      asks: ["Could I buy some bread for dinner tonight?", "I forgot to buy bread at the bakery. Do you have some?"] },
    { id: "c",  kind: "food", icon: "🍪", name: "Cookie", does: "A yummy cookie.", recipe: ["cookie"], cost: 0,
      asks: ["I was really good today! Could I have a cookie, please?", "May I have a cookie? Just one... okay, maybe one!"] },
    { id: "hm", kind: "food", icon: "🍯", name: "Honey bread", does: "Bread with sweet honey on top.", recipe: ["bread", "honey"], cost: 0,
      asks: ["Could I have some bread with honey on it? It's my favorite!", "I'd like a slice of honey bread, please!"] },

    { id: "starcookie", kind: "magic", icon: "🌟", name: "Star Cookie", does: "A cookie that makes you sparkle and shine.", recipe: ["cookie", "star"], cost: 0,
      asks: ["I'm going to a party tonight and I want to sparkle! Can you help?", "I want to shine like a star at the school show tomorrow!"] },
    { id: "gigglemilk", kind: "magic", icon: "😂", name: "Giggle Milk", does: "Milk that makes you laugh and giggle.", recipe: ["milk", "flower"], cost: 30,
      asks: ["My grandpa hasn't laughed in a long time. Can you help him giggle again?", "I want to make my little brother laugh. Can you help?"] },
    { id: "frostapple", kind: "magic", icon: "🧊", name: "Frost Apple", does: "An icy apple that keeps you cool all day.", recipe: ["apple", "snow"], cost: 35,
      asks: ["It was so hot last night that I couldn't sleep. Can you help?", "Our summer picnic is today and it's boiling hot! Can you help?"] },
    { id: "bouncybread", kind: "magic", icon: "🦘", name: "Bouncy Bread", does: "Bread that makes you jump super high.", recipe: ["bread", "leaf", "star"], cost: 45,
      asks: ["My ball got stuck on the roof last night. Can you help me jump really high?", "I want to win the jumping contest tomorrow! Can you help?"] },
    { id: "moonpie", kind: "magic", icon: "🥧", name: "Moon Pie", does: "A sweet pie that gives you beautiful dreams.", recipe: ["bread", "honey", "moon"], cost: 60,
      asks: ["I had a scary dream last night. Can you help me have nice dreams?", "I want to dream about flying dragons tonight! Can you help?"] },

    { id: "heal",   kind: "potion", icon: "💗", name: "Healing Potion", does: "Makes owies and tummy aches go away.", recipe: ["water", "flower", "honey"], cost: 0,
      asks: ["I fell off my bike yesterday and scraped my knee. Can you help me?", "My tummy has hurt since breakfast. Can you help?", "I bumped my head on a tree last night. Ouch! Can you help?"] },
    { id: "warm",   kind: "potion", icon: "🔥", name: "Warm Potion", does: "Warms you up from your toes to your nose.", recipe: ["water", "fire", "mushroom"], cost: 0,
      asks: ["I fell into the icy pond this morning and I'm still cold! Can you help?", "My house was freezing last night. Brrr! Can you help me warm up?"] },
    { id: "sleep",  kind: "potion", icon: "💤", name: "Sleepy Potion", does: "Helps you fall fast asleep.", recipe: ["moon", "water", "flower"], cost: 0,
      asks: ["I couldn't sleep at all last night. Can you help me?", "The owls were hooting all night and I stayed awake. Can you help?"] },
    { id: "cool",   kind: "potion", icon: "❄️", name: "Cool Potion", does: "Cools you down on a hot day.", recipe: ["snow", "water", "leaf"], cost: 40,
      asks: ["I've been working in the sun all day and I'm so hot. Can you help?", "I think I'm melting like ice cream! Can you help me cool down?"] },
    { id: "fly",    kind: "potion", icon: "🕊️", name: "Flying Potion", does: "Lets you float up and fly like a bird.", recipe: ["leaf", "star", "water", "leaf"], cost: 60,
      asks: ["My kite got stuck in the tallest tree yesterday. Can you help me fly up there?", "I've always wanted to touch the clouds. Can you help me?"] },
    { id: "strong", kind: "potion", icon: "💪", name: "Strong Potion", does: "Makes you super strong for a little while.", recipe: ["mushroom", "fire", "mushroom", "crystal"], cost: 80,
      asks: ["My cart got stuck in the mud this morning. Can you help me push it out?", "I have to carry ALL these pumpkins to the market. Can you help?"] },
    { id: "happy",  kind: "potion", icon: "🌈", name: "Happy Potion", does: "Turns a sad day into a happy one.", recipe: ["flower", "star", "honey", "flower"], cost: 100,
      asks: ["My best friend moved away yesterday and I feel sad. Can you help?", "It rained on my birthday and I feel grumpy. Can you help me feel happy?"] },
    { id: "hide",   kind: "potion", icon: "👻", name: "Invisible Potion", does: "Makes you invisible. Nobody can see you!", recipe: ["moon", "water", "moon", "star"], cost: 120,
      asks: ["My brother always finds me in hide-and-seek. Can you help me win?", "I want to sneak past the grumpy ogre on the bridge. Can you help?"] },
    { id: "swim",   kind: "potion", icon: "🐟", name: "Swim Potion", does: "Lets you breathe underwater like a fish.", recipe: ["shell", "water", "snow", "water"], cost: 150,
      asks: ["I dropped my ring in the deep lake yesterday. Can you help me find it?", "I want to visit the mermaids under the sea! Can you help?"] },
    { id: "wish",   kind: "potion", icon: "✨", name: "Wish Potion", does: "Makes one little wish come true.", recipe: ["star", "crystal", "moon", "star", "crystal"], cost: 250,
      asks: ["I've wished for a pet unicorn every night. Can you help my wish come true?", "I made a wish on a shooting star last night. Can you help it come true?"] },
  ];
  const HELLOS = ["Hello!", "Hi there!", "Excuse me, potion maker...", "Good morning!", "Hello, nice witch!", "Oh, hello!"];

  const DECOR = [
    { id: "plant",   icon: "🌻", name: "Sunflower pot",   tip: 1, cost: 30 },
    { id: "candles", icon: "🕯️", name: "Cozy candles",    tip: 2, cost: 50 },
    { id: "cat",     icon: "🐈", name: "Shop cat",        tip: 2, cost: 70 },
    { id: "picture", icon: "🖼️", name: "Pretty painting", tip: 3, cost: 90 },
    { id: "crystal", icon: "🔮", name: "Crystal ball",    tip: 3, cost: 120 },
    { id: "owl",     icon: "🦉", name: "Wise owl",        tip: 4, cost: 160 },
  ];
  const SHOP_LEVELS = [
    { name: "Little Potion Shop",  icon: "🏪", extra: 0, bonus: 0, cost: 0 },
    { name: "Village Potion Shop", icon: "🏬", extra: 2, bonus: 4, cost: 250 },
    { name: "Grand Potion Store",  icon: "✨", extra: 4, bonus: 8, cost: 700 },
  ];
  // Helpers serve their own customers. You're the boss!
  const STAFF = [
    { id: "mia", emoji: "👩‍🍳", name: "Mia", cost: 150, wage: 60, spot: { x: 36, y: 34 } },
    { id: "leo", emoji: "👨‍🍳", name: "Leo", cost: 350, wage: 100, spot: { x: 64, y: 34 } },
  ];
  const PLAYHOUSE = { name: "Play House", icon: "🎪", rooms: 8, cost: 500 };
  // Where you live: first a tiny bedroom in your shop, then a little house, then a big mansion!
  const LITTLE_HOUSE = { name: "Little House", icon: "🏠", cost: 300 };
  const MANSION = { name: "Big Mansion", icon: "🏰", rooms: 12, cost: 2000, sellLittle: 150 };
  // The rooms and things in each home (x, y, w, h in % of the home map). Click things to play!
  const HOME_MAPS = {
    store: {
      title: "Your Bedroom in the Shop", art: "🛏️",
      intro: "A tiny bedroom in the back of your potion shop. Save up to buy your own little house!",
      rooms: [{ name: "My little bedroom", x: 0, y: 0, w: 100, h: 100, floor: "repeating-linear-gradient(45deg, #d9c3ea 0 14px, #cfb7e3 14px 28px)" }],
      things: [
        { icon: "🛏️", x: 28, y: 62, s: 60, bed: true },
        { icon: "🕯️", x: 12, y: 26, s: 30, say: "The candle makes your little room cozy. 🕯️" },
        { icon: "📦", x: 72, y: 32, s: 44, say: "Your things are still in boxes. Save up for a real house!" },
        { icon: "📦", x: 86, y: 48, s: 36, say: "More boxes... One day you'll unpack them in your own house!" },
        { icon: "🧪", x: 62, y: 78, s: 30, say: "Extra potion bottles from the shop. Shh, they're for customers!" },
      ],
    },
    house: {
      title: "Your Little House", art: "🏠",
      intro: "Your very own little house! Click things to play. Click the bed when you're ready to sleep.",
      rooms: [
        { name: "Kitchen", x: 0, y: 0, w: 50, h: 52, floor: "repeating-conic-gradient(#f4ecdc 0 25%, #e3d6bd 0 50%) 0 0 / 28px 28px" },
        { name: "Living room", x: 50, y: 0, w: 50, h: 52, floor: "#d7b98e" },
        { name: "Bedroom", x: 0, y: 52, w: 62, h: 48, floor: "#cbb6e4" },
        { name: "Bathroom", x: 62, y: 52, w: 38, h: 48, floor: "repeating-linear-gradient(90deg, #d8eef5 0 14px, #c7e4ee 14px 28px)" },
      ],
      things: [
        { icon: "🍳", x: 12, y: 24, s: 38, say: "You cook yummy pancakes! 🥞" },
        { icon: "🍽️", x: 32, y: 34, s: 38, say: "You eat dinner at your little table. Mmm!" },
        { icon: "🍎", x: 40, y: 16, s: 28, say: "Crunch! A healthy snack. 🍎" },
        { icon: "📺", x: 88, y: 16, s: 40, say: "You watch your favorite cartoon! 📺✨" },
        { icon: "🛋️", x: 70, y: 34, s: 46, say: "You flop onto the comfy sofa. Ahhh!" },
        { icon: "🌵", x: 56, y: 14, s: 30, say: "You water your cactus. 💧" },
        { icon: "📚", x: 93, y: 42, s: 28, say: "You read a bedtime story about a brave witch. 📖" },
        { icon: "🛏️", x: 20, y: 76, s: 56, bed: true },
        { icon: "💡", x: 44, y: 64, s: 28, say: "Click! The lamp turns on. 💡" },
        { icon: "🛁", x: 76, y: 78, s: 44, say: "Splish splash! Bubble bath time! 🛁" },
        { icon: "🚽", x: 92, y: 66, s: 32, say: "Flush! Don't forget to wash your hands! 🧼" },
      ],
    },
    mansion: {
      title: "Your Big Mansion", art: "🏰",
      intro: "WOW, your huge mansion! A kitchen, a pool, a garden and so much more. Click the bed when you're ready to sleep.",
      rooms: [
        { name: "Kitchen", x: 0, y: 0, w: 34, h: 50, floor: "repeating-conic-gradient(#f4ecdc 0 25%, #e3d6bd 0 50%) 0 0 / 28px 28px" },
        { name: "Living room", x: 34, y: 0, w: 33, h: 50, floor: "#e0c49a" },
        { name: "Garden", x: 67, y: 0, w: 33, h: 50, floor: "#9fd88a" },
        { name: "Bedroom", x: 0, y: 50, w: 34, h: 50, floor: "#d4bdf0" },
        { name: "Bathroom", x: 34, y: 50, w: 26, h: 50, floor: "repeating-linear-gradient(90deg, #d8eef5 0 14px, #c7e4ee 14px 28px)" },
        { name: "Pool", x: 60, y: 50, w: 40, h: 50, floor: "linear-gradient(#7fd0ff, #3fa0e0)" },
      ],
      things: [
        { icon: "🍳", x: 9, y: 22, s: 34, say: "You cook a giant stack of pancakes! 🥞🥞🥞" },
        { icon: "🍰", x: 22, y: 36, s: 32, say: "You eat a slice of strawberry cake. Yum! 🍓" },
        { icon: "🍽️", x: 26, y: 18, s: 30, say: "Dinner at your big fancy table!" },
        { icon: "📺", x: 60, y: 14, s: 42, say: "You watch cartoons on your GIANT TV! 📺✨" },
        { icon: "🛋️", x: 46, y: 32, s: 44, say: "You sink into your super comfy sofa. Ahhh!" },
        { icon: "🎹", x: 44, y: 14, s: 34, say: "You play a fancy song on your piano. 🎵🎶" },
        { icon: "⛲", x: 84, y: 26, s: 42, say: "You make a wish in your fountain. ✨" },
        { icon: "🌷", x: 72, y: 40, s: 28, say: "You smell the tulips. Lovely! 🌷" },
        { icon: "🌳", x: 94, y: 12, s: 34, say: "You climb your big tree. What a view! 🌳" },
        { icon: "🛏️", x: 16, y: 76, s: 56, bed: true },
        { icon: "👑", x: 28, y: 60, s: 28, say: "You try on your crown. Queen of potions! 👑" },
        { icon: "🛁", x: 46, y: 78, s: 40, say: "A bubble bath in your fancy tub! 🛁" },
        { icon: "🚽", x: 56, y: 62, s: 28, say: "Flush! Even mansions have toilets! 🧼" },
        { icon: "🏊", x: 76, y: 76, s: 44, say: "You jump in the pool. SPLASH! 🌊" },
        { icon: "🦆", x: 90, y: 64, s: 28, say: "Quack! Your rubber duck says hi. 🦆" },
      ],
    },
  };
  const FURNITURE = [
    { id: "teddy",   icon: "🧸", name: "Teddy bear",   cost: 15,  play: "You give your teddy a big hug. So soft! 💕" },
    { id: "ball",    icon: "⚽", name: "Ball",         cost: 15,  play: "You kick the ball. GOAL! ⚽" },
    { id: "books",   icon: "📚", name: "Bookshelf",    cost: 40,  play: "You read a story about a brave little witch. 📖" },
    { id: "paint",   icon: "🎨", name: "Paint set",    cost: 50,  play: "You paint a picture of your shop. Beautiful! 🖌️" },
    { id: "fish",    icon: "🐠", name: "Fish tank",    cost: 60,  play: "The fish blow bubbles at you. Blub blub! 💧" },
    { id: "sofa",    icon: "🛋️", name: "Sofa",         cost: 80,  play: "You flop onto the sofa. Ahhh, cozy." },
    { id: "piano",   icon: "🎹", name: "Piano",        cost: 120, play: "You play a happy song. 🎵 La la la! 🎶" },
    { id: "puppy",   icon: "🐶", name: "Puppy",        cost: 150, play: "Your puppy licks your face and wags its tail! 🐾" },
    { id: "kitty",   icon: "🐱", name: "Kitty",        cost: 150, play: "Your kitty purrs and curls up on your lap. Purrr... 💤" },
    { id: "game",    icon: "🎮", name: "Game console", cost: 200, play: "You play a video game. You win! 🏆" },
    { id: "unicorn", icon: "🦄", name: "Toy unicorn",  cost: 300, play: "You ride your rocking unicorn. Neigh! 🌈" },
  ];
  // Places in town (x, y in % of the town map)
  const PLACES = [
    { id: "shop",    icon: "🏪", name: "My Potion Shop",  sub: "", x: 17, y: 18 },
    { id: "grocery", icon: "🛒", name: "Grocery",         sub: "food & drinks", x: 50, y: 18 },
    { id: "herbs",   icon: "🌿", name: "Magic Herb Shop", sub: "magic ingredients", x: 83, y: 18 },
    { id: "library", icon: "📚", name: "Recipe Library",  sub: "new recipes", x: 17, y: 50 },
    { id: "decor",   icon: "🎀", name: "Decor Store",     sub: "decorations", x: 83, y: 50 },
    { id: "builder", icon: "🔨", name: "Builder",         sub: "bigger shop", x: 17, y: 82 },
    { id: "jobs",    icon: "💼", name: "Job Center",      sub: "hire helpers", x: 50, y: 82 },
    { id: "home",    icon: "🏠", name: "My Home",         sub: "sleep & play", x: 83, y: 82 },
  ];

  const CUSTOMERS = ["👵", "🧒", "👨‍🍳", "👩‍🌾", "👴", "👧", "👦", "👩", "🧓", "🐧", "🧜‍♀️", "🧝‍♀️", "🐼", "🤴", "👸", "💂", "🐢"];
  const MAX_IN_POT = 5;
  const WAIT_TIME = 120;   // customers wait 2 whole minutes, no rush!
  const HINT_AFTER = 25;   // seconds before they give you a hint
  const SAVE_KEY = "amygames.potionShop.save";

  // Places on the store map (in % of the map)
  const DOOR = { x: 10, y: 92 };
  const COUNTER = { x: 50, y: 34 };
  const TABLES = [{ x: 20, y: 67 }, { x: 47, y: 77 }, { x: 73, y: 63 }];
  const WASHROOM = { x: 90, y: 20 };

  // ---------- State ----------
  const START_KNOWN = ITEMS.filter((i) => i.cost === 0).map((i) => i.id);
  let day = 1, coins = 0;
  let known = new Set(START_KNOWN);
  let decor = new Set();
  let shopLevel = 0;
  let hasPlayhouse = false;
  let home = "store";        // "store" (bedroom in the shop), "house", or "mansion"
  let potty = 0;             // 0..100: how badly you need the washroom
  let energy = 100;          // 100..0: how awake you are
  let homeMode = "evening";  // "day" = just peeking at your bedroom during work
  let stuff = new Set();
  let hired = new Set();
  // For each helper: days worked, pay owed, and the recipes you've taught her
  let staff = {};
  const PAY_EVERY = 3; // pay your helpers every 3 days
  const startKnows = () => ITEMS.filter((i) => i.kind === "food").map((i) => i.id);
  function staffFor(id) { if (!staff[id]) staff[id] = { days: 0, owed: 0, knows: startKnows() }; return staff[id]; }
  let stock = startStock();
  let pot = [];
  let cust = null;           // the customer at your part of the counter
  let left = 0, served = 0, happy = 0, earnedToday = 0;
  let busy = false;
  let dayOpen = false;
  let dayToken = 0;          // stops old walking customers when a new day starts
  let townMode = "work";     // "work" = popped out during the day, "evening" = after closing
  let townClosed = null;     // resolves when you leave town (used by helpers waiting for supplies)
  const tableUsed = [false, false, false];

  function loadSave() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; }
  }
  function writeSave() {
    const data = { v: 1, day, coins, known: [...known], decor: [...decor], shopLevel, hasPlayhouse, home, stuff: [...stuff], hired: [...hired], staff, stock };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
  }
  function paused() {
    return ["bookScreen", "townScreen", "bossScreen", "homeScreen", "dayScreen", "startScreen", "washScreen", "teachScreen", "lunchScreen", "pottyScreen"].some((id) => !$(id).hidden);
  }

  // ---------- Drawing the screen ----------
  function renderHud() {
    $("dayLabel").textContent = `🗓️ Day ${day}`;
    $("shopName").textContent = `${SHOP_LEVELS[shopLevel].icon} ${SHOP_LEVELS[shopLevel].name}`;
    $("coins").textContent = coins;
    $("happy").textContent = happy;
    $("total").textContent = served;
    const low = Object.values(stock).some((n) => n <= 1);
    $("townBtn").classList.toggle("bump", low && dayOpen);
  }
  function renderShelf() {
    const bottles = ITEMS.filter((i) => i.kind !== "food" && known.has(i.id)).map((i) => `<span title="${i.name}">${i.icon}</span>`).join("");
    const deco = [...decor].map((id) => DECOR.find((d) => d.id === id).icon).join("");
    $("shelf").innerHTML = bottles;
    $("decorRow").innerHTML = deco;
    $("cvShelf").innerHTML = bottles + deco;
    renderCounterTop();
  }
  // The counter on the map: shows a ❗ only when someone needs YOU
  // (a customer at your counter, or a helper asking the boss for help)
  let helperNeedsYou = null;
  function renderCounterTop() {
    const mia = hired.has("mia") ? "<span title='Mia'>👩‍🍳</span>" : "";
    const leo = hired.has("leo") ? "<span title='Leo'>👨‍🍳</span>" : "";
    const waiting = !!cust || !!helperNeedsYou;
    $("counterTop").innerHTML = `${mia}${leo}<span>🧪</span><small>Counter</small>${waiting ? '<span class="alert">❗</span>' : ""}`;
    $("counterTop").classList.toggle("waiting", waiting);
    $("mapHint").textContent = storeNight
      ? (home === "store"
        ? "🌙 Nighttime. The shop is closed. Walk to your 🛏️ bedroom to sleep, or out the 🚪 door to town."
        : "🌙 Nighttime. The shop is closed. Walk out the 🚪 door and go home to sleep.")
      : cust
      ? "❗ A customer is waiting! Walk to the counter (W A S D) or click it."
      : helperNeedsYou
      ? `❗ ${helperNeedsYou.emoji} ${helperNeedsYou.name} needs your help, boss!`
      : "🚶 Walk with W A S D (or click a place): counter, 🚻 washroom, 🛏️ bedroom, 🚪 door to town.";
    // The back room is your bedroom until you buy a house, then it's storage
    const br = $("storeBedroom");
    br.innerHTML = home === "store" ? `<div><span class="ico">🛏️</span>My bedroom</div>` : `<div><span class="ico">📦</span>Storage</div>`;
    br.classList.toggle("storage", home !== "store");
  }
  // Switch between the store map and the counter
  function showCounter() {
    $("mapView").hidden = true;
    $("counterView").hidden = false;
  }
  function showStoreMap() {
    $("counterView").hidden = true;
    $("mapView").hidden = false;
  }
  function renderCounterCustomer() {
    $("cvCustomer").textContent = cust ? cust.emoji : "";
    $("cvEmpty").hidden = !!cust;
  }
  function renderIngredients() {
    const box = $("ingredients");
    box.innerHTML = "";
    for (const [group, title] of [["food", "🍎 Food & drinks"], ["magic", "✨ Magic ingredients"]]) {
      const h = document.createElement("div");
      h.className = "ing-group";
      h.textContent = title;
      box.appendChild(h);
      for (const id of Object.keys(INGREDIENTS)) {
        const ing = INGREDIENTS[id];
        if (ing.group !== group) continue;
        const n = stock[id];
        const b = document.createElement("button");
        b.className = "ing" + (n <= 0 ? " out" : "");
        b.type = "button";
        b.innerHTML = `<span class="i">${ing.icon}</span><span class="n">${ing.name}</span><span class="stock${n <= 1 ? " low" : ""}">${n <= 0 ? "None left!" : "× " + n}</span>`;
        b.addEventListener("click", () => addIngredient(id));
        box.appendChild(b);
      }
    }
    renderHud();
  }
  function mixColor() {
    if (!pot.length) return "#3d5a80";
    let r = 0, g = 0, b = 0;
    for (const id of pot) {
      const c = INGREDIENTS[id].color;
      r += parseInt(c.slice(1, 3), 16); g += parseInt(c.slice(3, 5), 16); b += parseInt(c.slice(5, 7), 16);
    }
    const n = pot.length;
    return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  }
  function renderPot() {
    $("inPot").innerHTML = pot.map((id) => `<span>${INGREDIENTS[id].icon}</span>`).join("");
    $("liquid").style.background = mixColor();
  }
  function say(text) { $("msg").textContent = text; }
  function fx(emoji) {
    const s = document.createElement("div");
    s.className = "fx";
    s.textContent = emoji;
    $("cauldron").appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }

  // ---------- People walking around the store ----------
  function makeGuest(emoji) {
    const g = document.createElement("div");
    g.className = "guest";
    g.textContent = emoji;
    g.style.left = DOOR.x + "%";
    g.style.top = (DOOR.y + 8) + "%";
    $("store").appendChild(g);
    return g;
  }
  async function walk(g, spot, token) {
    if (token !== dayToken) return false;
    g.style.left = spot.x + "%";
    g.style.top = spot.y + "%";
    await wait(1150);
    return token === dayToken;
  }
  function floatText(text, spot) {
    const f = document.createElement("div");
    f.className = "float-coin";
    f.textContent = text;
    f.style.left = spot.x + "%";
    f.style.top = spot.y + "%";
    $("store").appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }
  function clearStore() {
    document.querySelectorAll("#store .guest, #store .tip-coin").forEach((e) => e.remove());
    tableUsed.fill(false);
  }
  // After being served, a happy customer sits down to eat or drink, maybe visits the washroom, then leaves
  async function enjoy(g, item, token) {
    const t = tableUsed.findIndex((u) => !u);
    if (t >= 0) {
      tableUsed[t] = true;
      const seat = { x: TABLES[t].x - 6, y: TABLES[t].y - 2 };
      const holding = document.createElement("span");
      holding.className = "holding";
      holding.textContent = item.icon;
      g.appendChild(holding);
      if (!(await walk(g, seat, token))) return;
      await wait(4500 + Math.random() * 3000);
      if (token !== dayToken) return;
      holding.remove();
      if (Math.random() < 0.5) leaveTip(TABLES[t], token);
      tableUsed[t] = false;
      if (Math.random() < 0.35) {
        if (!(await walk(g, { x: 80, y: 48 }, token))) return;
        if (!(await walk(g, WASHROOM, token))) return;
        g.style.opacity = "0"; // inside the washroom
        await wait(2500);
        if (token !== dayToken) return;
        g.style.opacity = "1";
        if (!(await walk(g, { x: 80, y: 48 }, token))) return;
      }
    }
    if (!(await walk(g, DOOR, token))) return;
    g.style.opacity = "0";
    await wait(400);
    g.remove();
  }
  async function leaveSad(g, token) {
    if (!(await walk(g, DOOR, token))) return;
    g.remove();
  }
  function leaveTip(table, token) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tip-coin";
    b.title = "A tip! Click to collect it.";
    b.textContent = "💰";
    b.style.left = table.x + 4 + "%";
    b.style.top = table.y - 4 + "%";
    b.addEventListener("click", () => {
      if (token !== dayToken) return;
      const amount = 2 + Math.floor(Math.random() * 5);
      coins += amount;
      earnedToday += amount;
      renderHud();
      floatText(`+💰${amount}`, table);
      b.remove();
    });
    $("store").appendChild(b);
  }

  // ---------- Orders and pay ----------
  function pickOrder(fromAll) {
    const have = (kind) => ITEMS.filter((i) => i.kind === kind && (fromAll || known.has(i.id)));
    const r = Math.random();
    let list;
    if (r < 0.3) list = have("food");
    else if (r < 0.5 && have("magic").length) list = have("magic");
    else list = have("potion");
    const bag = [];
    list.forEach((it, i) => { for (let k = 0; k < 1 + Math.floor(i / 3); k++) bag.push(it); });
    return pick(bag);
  }
  function payFor(item, speedShare) {
    const base = item.kind === "food" ? 4 + item.recipe.length * 2 : 8 + item.recipe.length * 4;
    const tipFromSpeed = Math.round(speedShare * (item.kind === "food" ? 3 : 10));
    const tipFromDecor = [...decor].reduce((s, id) => s + DECOR.find((d) => d.id === id).tip, 0);
    return base + tipFromSpeed + tipFromDecor + SHOP_LEVELS[shopLevel].bonus;
  }
  function missingFor(item) {
    const need = {};
    for (const id of item.recipe) need[id] = (need[id] || 0) + 1;
    return Object.keys(need).find((id) => stock[id] < need[id]);
  }

  // ---------- Your customers at the counter ----------
  async function nextCustomer() {
    if (left <= 0) {
      // Your customers are done. The day ends when your helpers are done too.
      youAreDone = true;
      if (helpersWorking > 0) say("Your customers are all done! Waiting for your helpers to finish... 👩‍🍳");
      checkDayEnd();
      return;
    }
    left--;
    const token = dayToken;
    const item = pickOrder(false);
    const emoji = pick(CUSTOMERS);
    const g = makeGuest(emoji);
    await wait(50);
    if (!(await walk(g, { x: DOOR.x, y: 60 }, token))) return;
    if (!(await walk(g, COUNTER, token))) return;
    cust = { emoji, item, guest: g, ask: pick(item.asks), hello: pick(HELLOS), patience: WAIT_TIME, max: WAIT_TIME, hinted: false };
    $("who").textContent = emoji;
    $("ask").textContent = `"${cust.hello} ${cust.ask}"`;
    $("hint").textContent = "";
    $("bubble").hidden = false;
    renderCounterCustomer();
    renderCounterTop();
    busy = false;
    const first = day === 1 && served === 0;
    say(first ? "Tip: open the 📖 recipe book to find the right potion!" : "What do they need?");
    if (first) $("bookBtn").classList.add("bump");
  }
  function tick() {
    if (!cust || busy || paused()) return; // time stops while you read, shop in town, or talk to helpers
    cust.patience -= 0.1;
    const k = Math.max(0, cust.patience / cust.max);
    const bar = $("patience");
    bar.style.width = `${k * 100}%`;
    bar.style.background = k > 0.5 ? "var(--good)" : k > 0.25 ? "var(--gold)" : "var(--bad)";
    if (!cust.hinted && cust.max - cust.patience >= HINT_AFTER && cust.item.kind !== "food") {
      cust.hinted = true;
      $("hint").textContent = `💡 Hint: maybe a ${cust.item.icon} ${cust.item.name}?`;
    }
    if (cust.patience <= 0) customerDone(false);
  }
  function customerDone(wasHappy, pay) {
    busy = true;
    served++;
    const c = cust;
    cust = null;
    if (wasHappy) { happy++; coins += pay; earnedToday += pay; }
    $("ask").textContent = wasHappy ? `"Thank you so much! Here's 💰 ${pay}."` : `"I waited too long... I'll come back another day." 😢`;
    $("hint").textContent = "";
    renderHud();
    const token = dayToken;
    if (wasHappy) { c.guest.classList.add("hop"); floatText(`+💰${pay}`, COUNTER); $("cvCustomer").classList.add("hop"); }
    renderCounterTop();
    setTimeout(() => {
      if (token !== dayToken) return;
      $("bubble").hidden = true;
      $("cvCustomer").classList.remove("hop");
      renderCounterCustomer();
      c.guest.classList.remove("hop");
      if (wasHappy) enjoy(c.guest, c.item, token); else leaveSad(c.guest, token);
      setTimeout(() => { if (token === dayToken) nextCustomer(); }, 900);
    }, 1400);
  }

  // ---------- Making things ----------
  function addIngredient(id) {
    if (busy) return;
    if (tooUrgent()) return;
    if (stock[id] <= 0) { say(`Out of ${INGREDIENTS[id].icon} ${INGREDIENTS[id].name}! Go to 🗺️ town to buy more.`); return; }
    if (pot.length >= MAX_IN_POT) { say("The cauldron is full! Make it or empty it."); return; }
    stock[id]--;
    pot.push(id);
    renderPot();
    renderIngredients();
    say(`Added ${INGREDIENTS[id].icon} ${INGREDIENTS[id].name}.`);
  }
  function emptyPot() {
    if (busy || !pot.length) return;
    for (const id of pot) stock[id]++; // put them back on the shelf
    pot = [];
    renderPot();
    renderIngredients();
    say("🗑️ You put the ingredients back on the shelf.");
  }
  function sameRecipe(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
  function brew() {
    if (busy) return;
    if (tooUrgent()) return;
    if (!pot.length) { say("Put some ingredients in first!"); return; }
    if (!cust) { say("Wait for a customer to come to the counter."); return; }
    const made = ITEMS.find((p) => known.has(p.id) && sameRecipe(p.recipe, pot)) || ITEMS.find((p) => sameRecipe(p.recipe, pot));
    pot = [];
    renderPot();
    if (made && made.id === cust.item.id) {
      fx(made.icon);
      const pay = payFor(made, cust.patience / cust.max);
      say(`✨ You made ${made.icon} ${made.name}! Perfect!`);
      customerDone(true, pay);
      return;
    }
    $("cauldron").classList.remove("boom");
    void $("cauldron").offsetWidth;
    $("cauldron").classList.add("boom");
    if (made) {
      fx(made.icon);
      say(`You made ${made.icon} ${made.name}... but that's not what they need!`);
      $("ask").textContent = `"Hmm, ${made.name}? That's not what I asked for! ${cust.ask}"`;
      cust.patience -= 5;
    } else {
      fx("💥");
      say("💥 Blub! That made yucky green goo. Check the recipe order!");
      cust.patience -= 3;
    }
  }

  // ---------- Helpers: they serve their own customers, and ask the boss when they need help ----------
  let bossQueue = Promise.resolve();
  let bossAnswer = null;
  function askBoss(helper, text, options) {
    const ask = () => new Promise((resolve) => {
      if (!dayOpen) { resolve(false); return; }
      if (staffOpen) closeStaff(); // so you can see her question
      helperNeedsYou = helper;
      renderCounterTop();
      bossAnswer = (v) => { helperNeedsYou = null; renderCounterTop(); resolve(v); };
      $("bossArt").textContent = helper.emoji;
      $("bossText").textContent = `${helper.name}: "${text}"`;
      const box = $("bossBtns");
      box.innerHTML = "";
      for (const o of options) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "big-btn" + (o.quiet ? " quiet" : "");
        b.textContent = o.label;
        b.disabled = o.enabled === false;
        b.addEventListener("click", async () => {
          $("bossScreen").hidden = true;
          bossAnswer = null;
          const v = await o.act(); // ❗ stays until she's got what she needed (like a recipe or supplies)
          helperNeedsYou = null;
          renderCounterTop();
          resolve(v);
        });
        box.appendChild(b);
      }
      $("bossScreen").hidden = false;
    });
    const p = bossQueue.then(ask);
    bossQueue = p.catch(() => {});
    return p;
  }
  // What each helper is doing right now (shown at the top of the shop)
  const helperStatus = {};
  function setStatus(helper, text) { helperStatus[helper.id] = text; renderStaffLine(); }
  // Little tabs at the top, one per helper. Click a tab to see what she's doing and boss her around!
  let staffOpen = null;
  function statusIcon(h) {
    const st = staffFor(h.id), s = helperStatus[h.id] || "";
    if (st.offToday) return "🏖️";
    if (st.resting) return "☕";
    if (s.includes("lunch")) return "🍽️";
    if (s.includes("making")) return "🥄";
    if (s.includes("payday")) return "💰";
    if (s.includes("all done")) return "✅";
    return "😊";
  }
  function renderStaffLine() {
    const line = $("staffLine");
    const team = STAFF.filter((h) => hired.has(h.id));
    line.hidden = !team.length || !dayOpen;
    line.innerHTML = "";
    for (const h of team) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "staff-tab" + (staffOpen === h ? " open" : "");
      tab.textContent = `${h.emoji} ${h.name} ${statusIcon(h)}`;
      tab.title = `${h.name}: ${helperStatus[h.id] || "getting ready..."}`;
      tab.addEventListener("click", () => openStaff(h));
      line.appendChild(tab);
    }
    if (staffOpen) renderStaffPopup();
  }
  function openStaff(h) {
    staffOpen = h;
    $("staffScreen").hidden = false;
    renderStaffLine();
  }
  function closeStaff() {
    staffOpen = null;
    $("staffScreen").hidden = true;
    renderStaffLine();
  }
  function renderStaffPopup() {
    const h = staffOpen;
    if (!hired.has(h.id)) { closeStaff(); return; }
    {
      const st = staffFor(h.id);
      $("staffArt").textContent = h.emoji;
      $("staffName").textContent = h.name;
      $("staffStatus").textContent = helperStatus[h.id] || "getting ready...";
      const btns = $("staffBtns");
      btns.innerHTML = "";
      const addBtn = (label, fn, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "big-btn" + (disabled ? " quiet" : "");
        b.textContent = label;
        b.disabled = !!disabled;
        b.addEventListener("click", fn);
        btns.appendChild(b);
      };
      addBtn(`📖 Teach`, () => openTeach(h));
      if (st.resting) {
        // Let her come back: she takes back the customers you haven't served yet
        addBtn(`👋 Let ${h.name} come back`, () => {
          const back = Math.min(st.given || 0, left);
          left -= back;
          st.given = 0;
          st.resting = false;
          if (back > 0) helperLoop(h, dayToken, back);
          else setStatus(h, "came back, but you already served all her customers! 😊");
        });
      } else {
        addBtn(st.takeOver ? "⏳ Finishing her customer..." : st.offToday ? "🏖️ PA day" : "🙋 I'll take over", () => {
          st.takeOver = true;
          setStatus(h, "☕ finishing this customer... then you take over!");
        }, st.takeOver || st.offToday);
      }
      addBtn(st.offTomorrow ? "🏖️ PA day tomorrow ✓" : "🏖️ PA day tomorrow", () => {
        st.offTomorrow = !st.offTomorrow;
        writeSave();
        renderStaffLine();
      });
    }
  }
  function helperKnows(helper, item) { return staffFor(helper.id).knows.includes(item.id); }
  function teach(helper, item) {
    if (!helperKnows(helper, item)) staffFor(helper.id).knows.push(item.id);
    writeSave();
  }
  // The helper takes out her notebook and writes the recipe down, one ingredient at a time
  let writing = false;
  function helperWrites(helper, item, then) {
    writing = true;
    const box = document.createElement("div");
    box.className = "write-book";
    box.innerHTML = `<div class="wb-art">${helper.emoji}📓</div><div class="wb-title">${helper.name} is writing it down...</div><div class="wb-name">${item.icon} ${item.name}</div><div class="runes"><span class="pencil">✏️</span></div>`;
    document.body.appendChild(box);
    const runes = box.querySelector(".runes");
    const pencil = runes.querySelector(".pencil");
    let i = 0;
    const next = () => {
      if (i < item.recipe.length) {
        const s = document.createElement("span");
        s.className = "rune-in";
        s.textContent = INGREDIENTS[item.recipe[i]].icon;
        runes.insertBefore(s, pencil);
        i++;
        setTimeout(next, 550);
        return;
      }
      pencil.textContent = "✔️";
      pencil.className = "rune-in";
      box.querySelector(".wb-title").textContent = `${helper.emoji} "Got it, boss!"`;
      setTimeout(() => {
        box.style.transform = "translate(-50%, -140%) scale(0.2)";
        box.style.opacity = "0";
        setTimeout(() => { box.remove(); writing = false; then(); }, 720);
      }, 1100);
    };
    setTimeout(next, 450);
  }

  // Teach a helper your recipes, any time you want
  let teaching = null;
  function openTeach(helper) {
    teaching = helper;
    renderTeach("");
    $("teachScreen").hidden = false;
  }
  function renderTeach(note) {
    const h = teaching;
    $("teachArt").textContent = `${h.emoji}📖`;
    $("teachTitle").textContent = `Teach ${h.name}`;
    const rows = $("teachRows");
    rows.innerHTML = "";
    for (const kind of ["potion", "magic", "food"]) {
      const list = ITEMS.filter((i) => i.kind === kind && known.has(i.id));
      if (!list.length) continue;
      const t = document.createElement("div");
      t.className = "section-title";
      t.textContent = { potion: "🧪 Potions", magic: "🌟 Magic foods", food: "🍎 Food & drinks" }[kind];
      rows.appendChild(t);
      for (const it of list) {
        const knows = helperKnows(h, it);
        buyRow(rows, it.icon, it.name, `${it.recipe.map((i) => INGREDIENTS[i].icon).join("")} ${knows ? `· ${h.name} knows this ✓` : ""}`,
          knows ? "Knows ✓" : "📖 Teach", !knows, () => {
            if (writing) return;
            helperWrites(h, it, () => {
              teach(h, it);
              renderTeach(`${h.emoji} "${it.icon} ${it.name}... got it, boss! Thanks!"`);
            });
          });
      }
    }
    const n = staffFor(h.id).knows.length;
    $("teachNote").textContent = note || `${h.name} knows ${n} recipe${n === 1 ? "" : "s"}. You can only teach recipes you know yourself.`;
  }
  // A helper who didn't get paid leaves the job
  function quitJob(h) {
    hired.delete(h.id);
    delete staff[h.id];
    delete helperStatus[h.id];
    floatText(`${h.emoji} 👋`, h.spot);
    say(`👋 ${h.name} quit because she didn't get paid. You can hire someone again at the 💼 Job Center.`);
    writeSave();
    renderShelf();
    renderStaffLine();
  }
  // Payday: helpers get paid every 3 days
  function payHelper(h) {
    const st = staffFor(h.id);
    if (coins < st.owed || st.owed <= 0) return false;
    coins -= st.owed;
    st.owed = 0;
    writeSave();
    renderHud();
    return true;
  }
  // Each helper serves her own customers every day
  const HELPER_CUSTOMERS = 3;
  const atLunch = new Set(); // helpers eating lunch right now
  let helpersWorking = 0;
  let youAreDone = false;
  function checkDayEnd() {
    if (youAreDone && helpersWorking === 0 && dayOpen) {
      // Night is coming: the witch gets sleepy
      say("🌙 The sun is going down... 🥱 Yawn! I'm getting so sleepy. Time for bed soon!");
      setTimeout(endDay, 3000);
    }
  }
  // resumeTodo: when she comes back after you took over, she only serves the customers you hand back
  // extra: your counter customers she serves for you today
  async function helperLoop(helper, token, resumeTodo, extra = 0) {
    const st = staffFor(helper.id);
    const resuming = typeof resumeTodo === "number";
    // PA day (day off): she rests, and her customers come to your counter instead
    if (st.offToday && !resuming) {
      setStatus(helper, "🏖️ has a PA day today (no pay for this day). You're taking over her customers.");
      giveYouCustomers(HELPER_CUSTOMERS);
      return;
    }
    st.takeOver = false;
    st.resting = false;
    if (!resuming) st.lunched = false;
    helpersWorking++;
    // Payday! She comes to ask you for her money. If you can't pay, she leaves the job.
    if (st.owed > 0 && !resuming) {
      setStatus(helper, "it's payday! 💰");
      await wait(1200);
      const paid = await askBoss(helper, `Boss, it's payday! I worked ${PAY_EVERY} days for you. Can I have my 💰${st.owed}, please?`, [
        { label: `💰 Pay ${helper.name} ${st.owed} coins`, enabled: coins >= st.owed, act: () => payHelper(helper) },
        { label: coins >= st.owed ? "No, I won't pay 🙅" : "Sorry, I don't have enough money 😔", quiet: true, act: () => false },
      ]);
      if (token !== dayToken) return;
      if (!paid) {
        quitJob(helper);
        if (extra > 0) giveYouCustomers(extra); // your customers come back to your counter
        helpersWorking--;
        checkDayEnd();
        return;
      }
      setStatus(helper, "got paid! Thank you, boss! 😊");
    }
    let todo = resuming ? resumeTodo : HELPER_CUSTOMERS + extra;
    setStatus(helper, resuming ? "I'm back! Thanks for the rest, boss! 😊" : "ready to work! 😊");
    await wait(1500 + Math.random() * 1500);
    while (token === dayToken && dayOpen && todo > 0) {
      // You said "I'll take over": she rests and you get her customers (until you let her come back)
      if (st.takeOver) {
        giveYouCustomers(todo);
        st.given = todo;
        st.resting = true;
        todo = 0;
        setStatus(helper, "☕ resting. You took over her customers!");
        break;
      }
      todo--;
      // Sometimes customers ask for things nobody in the shop knows how to make yet
      const item = Math.random() < 0.3 ? pickOrder(true) : pickOrder(false);
      const who = pick(CUSTOMERS);
      const g = makeGuest(who);
      setStatus(helper, `a customer ${who} is coming in...`);
      await wait(50);
      if (!(await walk(g, { x: DOOR.x, y: 60 }, token))) break;
      if (!(await walk(g, helper.spot, token))) break;
      setStatus(helper, `${who} wants ${item.icon} ${item.name}`);
      let ok = true;
      if (!known.has(item.id)) {
        ok = await askBoss(helper, `Boss! This customer wants ${item.icon} ${item.name}, but we don't have that recipe!`, [
          { label: `📖 Buy the recipe and give it to ${helper.name} (💰${item.cost})`, enabled: coins >= item.cost, act: () => {
            coins -= item.cost; known.add(item.id); renderHud(); renderShelf();
            return new Promise((res) => helperWrites(helper, item, () => { teach(helper, item); res(true); }));
          } },
          { label: "Say sorry 😔", quiet: true, act: () => false },
        ]);
      } else if (!helperKnows(helper, item)) {
        // You know it, but she doesn't yet: give her the recipe!
        ok = await askBoss(helper, `Boss, I don't know how to make ${item.icon} ${item.name} yet! Can you give me the recipe?`, [
          { label: `📖 Give ${helper.name} the recipe`, act: () => new Promise((res) => helperWrites(helper, item, () => { teach(helper, item); res(true); })) },
          { label: "Say sorry 😔", quiet: true, act: () => false },
        ]);
      }
      if (ok && missingFor(item)) {
        const m = INGREDIENTS[missingFor(item)];
        const need = item.recipe.length > 1 ? ` We need it to make ${item.icon} ${item.name}.` : " A customer wants some!";
        ok = await askBoss(helper, `Boss! We ran out of ${m.icon} ${m.name}!${need}`, [
          { label: "🗺️ Go to town and buy some", act: async () => { await openTownAndWait(); return !missingFor(item); } },
          { label: "Say sorry 😔", quiet: true, act: () => false },
        ]);
      }
      if (token !== dayToken) break;
      if (ok && !missingFor(item)) {
        for (const id of item.recipe) stock[id]--;
        renderIngredients();
        setStatus(helper, `making ${item.icon} ${item.name} for ${who}... 🥄✨`);
        floatText("🥄✨", helper.spot);
        await wait(3500);
        if (token !== dayToken) break;
        const pay = payFor(item, 0.5);
        coins += pay; earnedToday += pay; served++; happy++;
        renderHud();
        setStatus(helper, `served ${who} a ${item.icon} ${item.name} and gave you the 💰${pay}! 🎉`);
        floatText(`${helper.emoji} +💰${pay}`, helper.spot);
        enjoy(g, item, token);
      } else {
        served++;
        renderHud();
        setStatus(helper, `couldn't help ${who} 😢`);
        floatText("😢", helper.spot);
        leaveSad(g, token);
      }
      // Lunch break once a day. Helpers take turns so someone is always serving customers:
      // Mia goes after her 1st customer, Leo after his 2nd, and nobody goes while someone else is at lunch.
      const lunchAfter = STAFF.indexOf(helper) + 1;
      if (todo > 0 && !st.lunched && !st.takeOver && HELPER_CUSTOMERS + extra - todo >= lunchAfter) {
        while (atLunch.size > 0 && token === dayToken && !st.takeOver) {
          setStatus(helper, "hungry, but waiting for a turn to eat lunch... 🙂");
          await wait(500);
        }
        if (token === dayToken && !st.takeOver) {
          st.lunched = true;
          atLunch.add(helper.id);
          setStatus(helper, "🍽️ eating lunch... back soon! 🥪");
          for (let i = 0; i < 40 && token === dayToken && !st.takeOver; i++) await wait(500); // about 20 seconds
          atLunch.delete(helper.id);
          if (token === dayToken && !st.takeOver) setStatus(helper, "back from lunch! Yum! 😋");
        }
      }
      if (todo > 0) await wait(4000 + Math.random() * 4000);
    }
    if (token === dayToken) {
      if (!st.resting) setStatus(helper, "all done for today! 😊");
      helpersWorking--;
      checkDayEnd();
    }
  }
  // Send extra customers to your own counter (when you take over for a helper)
  function giveYouCustomers(n) {
    left += n;
    if (youAreDone) { youAreDone = false; setTimeout(nextCustomer, 600); }
  }

  // ---------- Days ----------
  function startDay() {
    dayToken++;
    clearStore();
    left = Math.min(5, 3 + Math.floor((day - 1) / 2)) + SHOP_LEVELS[shopLevel].extra;
    served = 0; happy = 0; earnedToday = 0;
    pot = [];
    cust = null;
    busy = true;
    dayOpen = true;
    bossQueue = Promise.resolve();
    helperNeedsYou = null;
    youAreDone = false;
    helpersWorking = 0;
    atLunch.clear();
    $("bubble").hidden = true;
    leaveStoreAtNight();
    potty = 0;
    pottyAsked = 0;
    energy = 100;
    openTime = 0;
    hadLunch = false;
    lunchSnooze = 0;
    lunchAsked = 0;
    renderNeeds();
    renderCounterCustomer();
    showStoreMap(); // each day starts looking at the store map
    placeMe({ x: 50, y: 45 });
    renderPot(); renderIngredients(); renderShelf();
    // Helpers at work today take your counter customers too, so you only get called when they need you
    const workers = STAFF.filter((h) => hired.has(h.id) && !staffFor(h.id).offToday);
    const extra = {};
    if (workers.length) {
      workers.forEach((h, i) => { extra[h.id] = Math.floor(left / workers.length) + (i < left % workers.length ? 1 : 0); });
      left = 0;
      youAreDone = true;
      const names = workers.map((h) => `${h.emoji} ${h.name}`).join(" and ");
      say(`☀️ Day ${day}: the shop is open! ${names} will serve the customers. You only need to help when you see a ❗`);
    } else {
      say(day === 1 ? "🎉 Your very first day! Your potion shop is open!" : `☀️ Day ${day}: the shop is open!`);
      setTimeout(nextCustomer, 900);
    }
    for (const h of STAFF) if (hired.has(h.id)) helperLoop(h, dayToken, undefined, extra[h.id] || 0);
  }
  function endDay(note) {
    if (!dayOpen) return;
    dayOpen = false;
    $("washScreen").hidden = true;
    $("pottyScreen").hidden = true;
    $("homeScreen").hidden = true;
    $("bookScreen").hidden = true;
    if (staffOpen) closeStaff();
    // Tips still on the tables get collected for you
    const tips = document.querySelectorAll("#store .tip-coin").length;
    if (tips) { const bonus = tips * 3; coins += bonus; earnedToday += bonus; }
    if (bossAnswer) { $("bossScreen").hidden = true; bossAnswer(false); bossAnswer = null; }
    $("townScreen").hidden = true;
    if (townClosed) { const r = townClosed; townClosed = null; r(); }
    dayToken++;
    busy = true;
    const stars = happy === served ? 3 : happy >= served * 0.6 ? 2 : happy > 0 ? 1 : 0;
    $("dayTitle").textContent = `Day ${day} is over!`;
    $("dayStars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    // Helpers count their work days. Every 3 days, it's payday.
    let payNote = "";
    for (const h of STAFF) {
      if (!hired.has(h.id)) continue;
      const st = staffFor(h.id);
      if (!st.offToday) {
        st.days++; // PA days don't count as work days
        if (st.days % PAY_EVERY === 0) { st.owed += h.wage; payNote += ` 💰 Tomorrow is ${h.name}'s payday: she'll ask you for 💰${h.wage}.`; }
      }
      // Tomorrow's PA day starts in the morning
      st.offToday = !!st.offTomorrow;
      st.offTomorrow = false;
      st.takeOver = false;
      st.resting = false;
      st.given = 0;
      if (st.offToday) payNote += ` 🏖️ Tomorrow is ${h.name}'s PA day. You'll serve her customers, and you don't pay her for it.`;
    }
    $("dayInfo").textContent = `${typeof note === "string" ? note + " " : ""}${happy} of ${served} customers were happy. You earned 💰 ${earnedToday} today.${payNote}`;
    day++;
    writeSave();
    renderHud();
    $("dayScreen").hidden = false;
  }

  // ---------- Walking the witch around (W A S D, arrow keys, or click a place) ----------
  const walkKeys = new Set();
  const walker = {
    store: { x: 50, y: 45, el: null, target: null, zone: null },
    town: { x: 17, y: 33, el: null, target: null, zone: null },
  };
  // Places on the store map: walk into them to go there
  const STORE_SPOTS = {
    counter:  { target: { x: 50, y: 25 }, back: { x: 50, y: 42 }, hit: (x, y) => y < 28 && x > 31 && x < 69, enter: () => {
      if (storeNight) { $("mapHint").textContent = "🌙 The shop is closed for tonight. You can work again tomorrow!"; return; }
      showCounter();
    } },
    washroom: { target: { x: 91, y: 20 }, back: { x: 74, y: 30 }, hit: (x, y) => x > 81 && y < 40, enter: () => openWashroom() },
    bedroom:  { target: { x: 91, y: 87 }, back: { x: 74, y: 84 }, hit: (x, y) => x > 81 && y > 72, enter: () => enterBedroom() },
    door:     { target: { x: 10, y: 96 }, back: { x: 15, y: 82 }, hit: (x, y) => x < 17 && y > 91, enter: () => {
      if (storeNight) { leaveStoreAtNight(); openTown("evening"); return; }
      openTown("work");
    } },
  };
  // At night your shop is closed, but you're the owner, so you can still go inside
  let storeNight = false;
  function openStoreAtNight() {
    $("townScreen").hidden = true;
    storeNight = true;
    clearStore();
    cust = null;
    $("bubble").hidden = true;
    renderCounterCustomer();
    showStoreMap();
    $("store").classList.add("night");
    placeMe(STORE_SPOTS.door.back);
    renderCounterTop();
  }
  function leaveStoreAtNight() {
    storeNight = false;
    $("store").classList.remove("night");
  }
  function placeMe(spot) {
    const w = walker.store;
    w.x = spot.x; w.y = spot.y; w.target = null; w.zone = null;
    drawWalker(w);
  }
  function placeMeInTown(spot) {
    const w = walker.town;
    w.x = spot.x; w.y = spot.y; w.target = null; w.zone = null;
    drawWalker(w);
  }
  function drawWalker(w) {
    if (!w.el) return;
    w.el.style.left = w.x + "%";
    w.el.style.top = w.y + "%";
  }
  function townBack(p) { return { x: p.x, y: p.y > 70 ? p.y - 16 : p.y + 16 }; }
  function townSpots() {
    return PLACES.map((p) => ({ id: p.id, hit: (x, y) => Math.abs(x - p.x) < 6 && Math.abs(y - p.y) < 8, enter: () => visit(p.id) }));
  }
  function stepWalker(w, dt, spots) {
    let dx = 0, dy = 0;
    if (walkKeys.has("a") || walkKeys.has("arrowleft")) dx -= 1;
    if (walkKeys.has("d") || walkKeys.has("arrowright")) dx += 1;
    if (walkKeys.has("w") || walkKeys.has("arrowup")) dy -= 1;
    if (walkKeys.has("s") || walkKeys.has("arrowdown")) dy += 1;
    if (dx || dy) w.target = null;
    else if (w.target) {
      const vx = w.target.x - w.x, vy = w.target.y - w.y, d = Math.hypot(vx, vy);
      if (d < 1.2) w.target = null; else { dx = vx / d; dy = vy / d; }
    }
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy);
    w.x = Math.max(3, Math.min(97, w.x + (dx / len) * 30 * dt));
    w.y = Math.max(5, Math.min(97, w.y + (dy / len) * 42 * dt));
    if (w.el) w.el.style.transform = `translate(-50%, -60%) scaleX(${dx > 0 ? -1 : 1})`;
    drawWalker(w);
    const z = spots.find((s) => s.hit(w.x, w.y));
    if (z && z.id !== w.zone) {
      w.zone = z.id;
      w.target = null;
      walkKeys.clear();
      z.enter();
    } else if (!z) w.zone = null;
  }
  let lastFrame = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - lastFrame) / 1000 || 0);
    lastFrame = t;
    if ((dayOpen || storeNight) && !$("mapView").hidden && !paused()) {
      stepWalker(walker.store, dt, Object.entries(STORE_SPOTS).map(([id, s]) => ({ id, ...s })));
    } else if (!$("townScreen").hidden && $("placeView").hidden && $("bossScreen").hidden) {
      stepWalker(walker.town, dt, townSpots());
    }
    requestAnimationFrame(frame);
  }
  function enterBedroom() {
    if (home === "store") { openHome(storeNight ? "evening" : "day"); return; }
    $("mapHint").textContent = "📦 That's just storage now. Your bed is in your new home!";
  }

  // ---------- The washroom ----------
  // You need to go about every 50 seconds of work, and a "Quick!" pop-up tells you when
  const POTTY_FULL_SECS = 75;  // seconds until you MUST GO
  const POTTY_ASK = 66;        // the "Quick!" pop-up comes at this point (about 50 seconds)
  let pottyAsked = 0;          // 0 = not asked yet, 1 = asked once, 2 = asked again at MUST GO
  function openWashroom() {
    const needed = potty > 40;
    $("washText").textContent = needed
      ? "Ahhh, much better! 🚽 Flush! 💦 Then you wash your hands with bubbly soap. 🧼"
      : `You don't need to go yet, so you just wash your hands. 🧼✨ You'll need to go in about ${Math.max(5, Math.round((POTTY_ASK - potty) / 100 * POTTY_FULL_SECS / 5) * 5)} seconds. A "Quick!" sign will pop up to tell you!`;
    if (needed) { potty = 0; pottyAsked = 0; }
    $("pottyScreen").hidden = true;
    $("washScreen").hidden = false;
    renderNeeds();
  }
  function closeWashroom() {
    $("washScreen").hidden = true;
    placeMe(STORE_SPOTS.washroom.back);
  }

  // ---------- The witch's needs: washroom and sleep ----------
  // Lunch: about 1 minute after opening, it's lunch time!
  const LUNCH_AT = 60;
  const LUNCH_STARVING_AFTER = 40; // seconds after "I'm hungry" until "I'm STARVING"
  let openTime = 0, hadLunch = false, lunchSnooze = 0, lunchAsked = 0;
  function needsTick() {
    if (!dayOpen || paused()) return;
    openTime += 0.1;
    potty = Math.min(100, potty + 100 / POTTY_FULL_SECS * 0.1);
    energy = Math.max(0, energy - 100 / 480 * 0.1);   // empty after about 8 minutes
    renderNeeds();
    if (energy <= 0) { fallAsleep(); return; }
    if ((pottyAsked === 0 && potty >= POTTY_ASK) || (pottyAsked === 1 && potty >= 100)) { openPotty(); return; }
    if (!hadLunch && openTime >= Math.max(LUNCH_AT, lunchSnooze)) openLunch();
  }
  function openPotty() {
    pottyAsked++;
    $("pottyText").textContent = potty >= 100
      ? "I REALLY need to go to the washroom! I can't make anything until I go! 😖"
      : "Uh oh... I want to go to the washroom. Quick! 🚽";
    $("pottyWaitBtn").hidden = potty >= 100;
    $("pottyScreen").hidden = false;
  }
  function pottyGo() {
    $("pottyScreen").hidden = true;
    showStoreMap();
    openWashroom();
  }
  function openLunch() {
    const fromShelf = stock.bread > 0 && stock.apple > 0;
    const helpers = STAFF.filter((h) => hired.has(h.id) && !staffFor(h.id).offToday).map((h) => h.name);
    const who = helpers.length ? ` Don't worry, ${helpers.join(" and ")} will keep serving customers while you eat!` : " Your customers will wait for you.";
    // First "I'm hungry!" (you can wait), then a little later "I'm STARVING!" (you have to eat now)
    const starving = lunchAsked >= 1;
    $("lunchArt").textContent = starving ? "😫🍽️" : "😋🍽️";
    $("lunchTitle").textContent = starving ? "I'm STARVING!" : "I'm hungry!";
    const food = fromShelf
      ? "You'll eat 🍞 bread and an 🍎 apple from your shelf."
      : "Your shelf is out of bread or apples, so you'll eat the 🥪 sandwich you brought from home.";
    $("lunchText").textContent = (starving
      ? `My tummy is SO empty! I have to go eat right now! ${food}`
      : `My tummy is rumbling... Time for a lunch break? ${food}`) + who;
    $("lunchLaterBtn").hidden = starving;
    $("lunchLaterBtn").textContent = "I can wait a little bit";
    $("lunchScreen").hidden = false;
  }
  function eatLunch() {
    if (stock.bread > 0 && stock.apple > 0) { stock.bread--; stock.apple--; renderIngredients(); }
    hadLunch = true;
    energy = Math.min(100, energy + 30);
    renderNeeds();
    $("lunchText").textContent = "Munch munch... 😋 Yummy! You feel full and less sleepy. Back to work!";
    $("lunchTitle").textContent = "Yum!";
    $("lunchArt").textContent = "😋🥪🍎";
    $("eatLunchBtn").hidden = true;
    $("lunchLaterBtn").hidden = false;
    $("lunchLaterBtn").textContent = "Back to work 💪";
  }
  function closeLunch() {
    if (!hadLunch) { lunchSnooze = openTime + LUNCH_STARVING_AFTER; lunchAsked++; } // then you'll be STARVING
    $("lunchScreen").hidden = true;
    $("eatLunchBtn").hidden = false;
  }
  function renderNeeds() {
    const p = potty >= 100 ? "🚽 😖 MUST GO!" : potty >= 75 ? "🚽 😣 need to go!" : potty >= 45 ? "🚽 😐" : "🚽 🙂";
    const e = energy <= 15 ? "😴 so sleepy!" : energy <= 40 ? "🥱 tired" : "😊 awake";
    $("needs").textContent = `${p}  ${e}`;
    $("needs").className = potty >= 75 || energy <= 15 ? "urgent" : "";
  }
  function fallAsleep() {
    if (!dayOpen) return;
    say("😴 You were so tired that you fell asleep at work!");
    endDay("😴 You got so sleepy that you fell asleep in the shop! Remember to go to bed every night.");
  }
  function tooUrgent() {
    if (potty < 100) return false;
    say("😖 You REALLY need the washroom! Go to the 🗺️ store map and walk to the 🚻.");
    return true;
  }

  // ---------- The town map ----------
  let lastPlace = "shop";
  function openTown(mode) {
    townMode = mode;
    $("dayScreen").hidden = true;
    $("homeScreen").hidden = true;
    $("townIntro").textContent = mode === "work"
      ? "You popped out of your shop. Customers will wait for you! Walk with W A S D (or click a place)."
      : home === "store"
        ? "The shop is closed for today. Go shopping, then walk back into your shop to sleep in your bedroom! (W A S D or click)"
        : "The shop is closed for today. Go shopping, then go home to sleep! Walk with W A S D (or click a place).";
    placeMeInTown(townBack(PLACES[0]));
    showMap();
    $("townScreen").hidden = false;
  }
  function openTownAndWait() {
    return new Promise((resolve) => { townClosed = resolve; openTown("work"); });
  }
  function closeTown() {
    $("townScreen").hidden = true;
    placeMe(STORE_SPOTS.door.back);
    if (townClosed) { const r = townClosed; townClosed = null; r(); }
  }
  function homePlaceLabel() {
    if (home === "mansion") return { icon: "🏰", name: "My Mansion" };
    if (home === "house") return { icon: "🏠", name: "My Little House" };
    return { icon: "🛏️", name: "My Bedroom" };
  }
  function showMap() {
    $("townCoins").textContent = coins;
    $("townMap").hidden = false;
    $("placeView").hidden = true;
    const map = $("townMap");
    map.innerHTML = `<div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:40px">⛲</div>`;
    const lowFood = Object.keys(INGREDIENTS).some((id) => INGREDIENTS[id].group === "food" && stock[id] <= 1);
    const lowMagic = Object.keys(INGREDIENTS).some((id) => INGREDIENTS[id].group === "magic" && stock[id] <= 1);
    for (const p of PLACES) {
      if (p.id === "home" && home === "store") continue; // you live in your shop, so your bed is in there
      const b = document.createElement("button");
      b.type = "button";
      b.className = "place" + ((p.id === "grocery" && lowFood) || (p.id === "herbs" && lowMagic) ? " alert" : "");
      b.style.left = p.x + "%";
      b.style.top = p.y + "%";
      let sub = p.sub;
      let icon = p.icon, name = p.name;
      if (p.id === "shop") sub = townMode === "work" ? "back to work" : home === "store" ? "go home to bed" : "closed (you can go in)";
      if (p.id === "home") {
        ({ icon, name } = homePlaceLabel());
        sub = townMode === "work" ? "after work" : home === "store" ? "in the shop" : "sleep & play";
      }
      b.innerHTML = `<span class="pi">${icon}</span>${name}<span class="ps">${sub}</span>`;
      if (p.id === "home" && townMode === "work") b.classList.add("closed");
      b.addEventListener("click", () => { walker.town.target = { x: p.x, y: p.y }; });
      map.appendChild(b);
    }
    // You, walking around town
    const me = document.createElement("div");
    me.className = "me";
    me.textContent = "🧙‍♀️";
    map.appendChild(me);
    walker.town.el = me;
    drawWalker(walker.town);
  }
  function buyRow(box, icon, name, desc, label, enabled, onBuy, locked) {
    const row = document.createElement("div");
    row.className = "row" + (locked ? " locked" : "");
    row.innerHTML = `<div class="ico">${icon}</div><div class="info"><div class="name">${name}</div><div class="desc">${desc}</div></div>`;
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.disabled = !enabled;
    b.addEventListener("click", onBuy);
    row.appendChild(b);
    box.appendChild(row);
  }
  function visit(id) {
    const p = PLACES.find((x) => x.id === id);
    lastPlace = id;
    if (id === "shop") {
      if (townMode !== "work") { openStoreAtNight(); return; } // you're the owner: you can always go in
      closeTown();
      return;
    }
    if (id === "home") {
      if (townMode === "work") { $("townIntro").textContent = "🏠 You can go home after work! Customers are waiting."; return; }
      $("townScreen").hidden = true;
      openHome("evening");
      return;
    }
    $("townMap").hidden = true;
    $("placeView").hidden = false;
    $("placeArt").textContent = p.icon;
    $("placeName").textContent = p.name;
    $("placeNote").textContent = "";
    renderPlace(id);
  }
  function renderPlace(id) {
    $("townCoins").textContent = coins;
    const rows = $("placeRows");
    rows.innerHTML = "";
    const again = () => { writeSave(); renderHud(); renderShelf(); renderIngredients(); renderPlace(id); };
    if (id === "grocery" || id === "herbs") {
      $("placeDesc").textContent = id === "grocery"
        ? "Fresh food and drinks for your customers. Each pack has 5."
        : "Magic ingredients for potions and magic foods. Each pack has 5.";
      for (const [ing, info] of Object.entries(INGREDIENTS)) {
        if (info.group !== (id === "grocery" ? "food" : "magic")) continue;
        buyRow(rows, info.icon, info.name, `You have ${stock[ing]}${stock[ing] <= 1 ? " ⚠️ almost gone!" : ""}`,
          `Buy 5 · 💰${info.price}`, coins >= info.price, () => {
            coins -= info.price; stock[ing] += PACK; again();
            $("placeNote").textContent = `${info.icon} You bought 5 ${info.name}!`;
          });
      }
    } else if (id === "library") {
      $("placeDesc").textContent = "Learn new recipes for potions and magic foods.";
      for (const p of ITEMS) {
        if (p.cost === 0) continue;
        const have = known.has(p.id);
        buyRow(rows, p.icon, `${p.name} <small>(${p.kind === "magic" ? "magic food" : "potion"})</small>`, p.does,
          have ? "Known ✓" : `💰 ${p.cost}`, !have && coins >= p.cost, () => {
            coins -= p.cost; known.add(p.id); again();
            $("placeNote").textContent = `📖 ${p.icon} ${p.name} was added to your recipe book!`;
          });
      }
    } else if (id === "decor") {
      $("placeDesc").textContent = "Pretty things for your shop. Customers give bigger tips!";
      for (const d of DECOR) {
        const have = decor.has(d.id);
        buyRow(rows, d.icon, d.name, `+${d.tip} tip from every happy customer`, have ? "In your shop ✓" : `💰 ${d.cost}`, !have && coins >= d.cost, () => {
          coins -= d.cost; decor.add(d.id); again();
          $("placeNote").textContent = `${d.icon} The ${d.name} looks lovely in your shop!`;
        });
      }
    } else if (id === "builder") {
      $("placeDesc").textContent = "Make your shop bigger. More customers come, and they pay more!";
      SHOP_LEVELS.forEach((s, i) => {
        if (i === 0) return;
        buyRow(rows, s.icon, s.name, `+${s.extra} customers every day, +${s.bonus} coins from each one`,
          i <= shopLevel ? "Yours ✓" : `💰 ${s.cost}`, i === shopLevel + 1 && coins >= s.cost, () => {
            coins -= s.cost; shopLevel = i; again();
            $("placeNote").textContent = `${s.icon} Your shop is now the ${s.name}! More customers will come.`;
          }, i > shopLevel + 1);
      });
    } else if (id === "jobs") {
      $("placeDesc").textContent = `Hire helpers! They serve their own customers, and come to you, the boss, when they need help. Teach them your recipes, and pay them every ${PAY_EVERY} days, or they'll quit!`;
      for (const h of STAFF) {
        const have = hired.has(h.id);
        if (have) {
          const st = staffFor(h.id);
          const nextPay = PAY_EVERY - (st.days % PAY_EVERY);
          buyRow(rows, h.emoji, h.name,
            `Works for you ✓ · knows ${st.knows.length} recipes · ${st.owed > 0 ? `payday tomorrow: 💰${st.owed}` : `payday in ${nextPay} day${nextPay > 1 ? "s" : ""} (💰${h.wage})`}`,
            `📖 Teach ${h.name}`, true, () => openTeach(h));
        } else {
          buyRow(rows, h.emoji, h.name, `A friendly helper for your counter. Hire for 💰${h.cost}, then pay 💰${h.wage} every ${PAY_EVERY} days.`,
            `💰 ${h.cost}`, coins >= h.cost, () => {
              coins -= h.cost; hired.add(h.id); staff[h.id] = { days: 0, owed: 0, knows: startKnows() }; again();
              $("placeNote").textContent = `${h.emoji} ${h.name} works for you now! You're the big boss! 😎 Teach her some recipes so she can make more things!`;
              if (dayOpen) helperLoop(h, dayToken);
            });
        }
      }
    }
  }

  // ---------- Home: sleep, Play House, mansion ----------
  // mode "day" = you walked into your shop bedroom during work (no sleeping yet)
  function openHome(mode = "evening") {
    homeMode = mode;
    $("homeNote").textContent = mode === "day" ? "It's still daytime. You can sleep after the shop closes!" : "";
    renderHome();
    $("homeScreen").hidden = false;
  }
  function toySpots() { return (hasPlayhouse ? PLAYHOUSE.rooms : 0) + (home === "mansion" ? MANSION.rooms : 0); }
  function renderHomeMap() {
    const hm = HOME_MAPS[home];
    const map = $("homeMap");
    map.innerHTML = "";
    for (const r of hm.rooms) {
      const d = document.createElement("div");
      d.className = "hroom";
      Object.assign(d.style, { left: r.x + "%", top: r.y + "%", width: r.w + "%", height: r.h + "%", background: r.floor });
      d.innerHTML = `<small>${r.name}</small>`;
      map.appendChild(d);
    }
    for (const t of hm.things) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thing";
      b.textContent = t.icon;
      Object.assign(b.style, { left: t.x + "%", top: t.y + "%", fontSize: t.s + "px" });
      b.title = t.bed ? "Your bed: click to go to sleep" : "Click to play!";
      b.addEventListener("click", () => {
        if (t.bed) {
          if (homeMode === "day") { $("homeNote").textContent = "🛏️ Not bedtime yet! Finish your work first."; return; }
          goToSleep();
          return;
        }
        b.classList.remove("playing");
        void b.offsetWidth;
        b.classList.add("playing");
        const pop = document.createElement("span");
        pop.className = "pop";
        pop.textContent = pick(["💕", "✨", "🎵", "⭐", "😄"]);
        b.appendChild(pop);
        setTimeout(() => pop.remove(), 1300);
        $("homeNote").textContent = t.say;
      });
      map.appendChild(b);
    }
  }
  function renderHome() {
    const hm = HOME_MAPS[home];
    $("houseName").textContent = `${hm.art} ${hm.title}`;
    $("homeIntro").textContent = hm.intro;
    $("homePanel").style.background = home === "mansion" ? "linear-gradient(#e6e0ff, var(--panel))" : home === "house" ? "linear-gradient(#f3e0c0, var(--panel))" : "linear-gradient(#e9def5, var(--panel))";
    renderHomeMap();
    $("sleepBtn").disabled = homeMode === "day";
    $("sleepBtn").textContent = homeMode === "day" ? "💤 Sleep after work" : "💤 Go to sleep";
    $("homeToTownBtn").textContent = homeMode === "day" || home === "store" ? "← Back to the shop" : "← Back to town";
    const spots = toySpots();
    $("playTitle").textContent = spots > 0
      ? `🎪 ${home === "mansion" && hasPlayhouse ? "Play House + Mansion playroom" : home === "mansion" ? "Your Mansion playroom" : "Your Play House"} (${stuff.size}/${spots} spots)`
      : "🎪 Play House";
    const room = $("room");
    room.hidden = spots === 0;
    room.innerHTML = "";
    for (const f of FURNITURE) {
      if (!stuff.has(f.id)) continue;
      const b = document.createElement("button");
      b.type = "button";
      b.title = f.name;
      b.textContent = f.icon;
      b.addEventListener("click", () => playWith(f, b));
      room.appendChild(b);
    }
    for (let i = stuff.size; i < spots; i++) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "empty spot";
      room.appendChild(e);
    }
    const fs = $("furnShop");
    fs.innerHTML = "";
    if (!hasPlayhouse) {
      const ready = shopLevel === SHOP_LEVELS.length - 1;
      buyRow(fs, PLAYHOUSE.icon, PLAYHOUSE.name,
        ready ? "A second house just for playing, with room for 8 toys!" : "First make your shop the ✨ Grand Potion Store (at the 🔨 Builder). Then you can buy a house just for playing!",
        `💰 ${PLAYHOUSE.cost}`, ready && coins >= PLAYHOUSE.cost, () => {
          coins -= PLAYHOUSE.cost; hasPlayhouse = true; writeSave(); renderHud(); renderHome();
          $("homeNote").textContent = "🎪 You bought a Play House! Now buy some toys to play with.";
        }, !ready);
    }
    if (spots > 0) {
      const full = stuff.size >= spots;
      for (const f of FURNITURE) {
        const have = stuff.has(f.id);
        buyRow(fs, f.icon, f.name,
          have ? "Yours ✓ Click it above to play!" : full ? (home === "mansion" ? "No more room for toys!" : "No more room! Get the mansion for more space.") : "A fun toy to play with.",
          have ? "Yours ✓" : `💰 ${f.cost}`, !have && !full && coins >= f.cost, () => {
            coins -= f.cost; stuff.add(f.id); writeSave(); renderHud(); renderHome();
            $("homeNote").textContent = `${f.icon} The ${f.name} is here now. Click it to play!`;
          });
      }
    }
    // Moving: shop bedroom → little house → big mansion
    const hs = $("houseShop");
    hs.innerHTML = "";
    buyRow(hs, LITTLE_HOUSE.icon, LITTLE_HOUSE.name,
      home === "store" ? "Move out of the shop into your own little house, with a kitchen, a living room with a sofa and TV, a bedroom and a bathroom!"
        : home === "house" ? "You live here now! 🏠" : "You sold it when you moved to the mansion.",
      home === "store" ? `💰 ${LITTLE_HOUSE.cost}` : home === "house" ? "Home ✓" : "Sold ✓",
      home === "store" && coins >= LITTLE_HOUSE.cost, () => {
        coins -= LITTLE_HOUSE.cost; home = "house"; writeSave(); renderHud(); renderShelf(); renderHome();
        $("homeNote").textContent = "🎉 You moved into your very own Little House! Look around and click things!";
      });
    const price = MANSION.cost - MANSION.sellLittle;
    buyRow(hs, MANSION.icon, MANSION.name,
      home === "mansion" ? "You live here now. The biggest home of all! 🎉"
        : home === "house" ? `Sell your little house (you get 💰 ${MANSION.sellLittle} back) and move into a HUGE mansion with a pool and a garden!`
        : "Get a little house first. Then, with lots and lots of money, you can move into a mansion!",
      home === "mansion" ? "Home ✓" : `💰 ${price}`, home === "house" && coins >= price, () => {
        coins -= price; home = "mansion"; writeSave(); renderHud(); renderHome();
        $("homeNote").textContent = `🎉 You sold your little house for 💰 ${MANSION.sellLittle} and moved into the BIG MANSION! You did it!`;
      }, home === "store");
  }
  function playWith(f, btn) {
    btn.classList.remove("playing");
    void btn.offsetWidth;
    btn.classList.add("playing");
    const pop = document.createElement("span");
    pop.className = "pop";
    pop.textContent = pick(["💕", "✨", "🎵", "⭐", "😄"]);
    btn.appendChild(pop);
    setTimeout(() => pop.remove(), 1300);
    $("homeNote").textContent = f.play;
  }
  function goToSleep() {
    if (homeMode === "day") return;
    $("homeNote").innerHTML = `<span class="zzz">💤</span> Zzz... Good night!`;
    $("sleepBtn").disabled = true;
    setTimeout(() => {
      $("sleepBtn").disabled = false;
      $("homeScreen").hidden = true;
      startDay();
    }, 1400);
  }

  // ---------- Recipe book ----------
  function openBook() {
    $("bookBtn").classList.remove("bump");
    const rows = $("bookRows");
    rows.innerHTML = "";
    for (const kind of ["potion", "magic", "food"]) {
      const h = document.createElement("div");
      h.className = "section-title";
      h.textContent = { potion: "🧪 Potions", magic: "🌟 Magic foods", food: "🍎 Food & drinks" }[kind];
      rows.appendChild(h);
      for (const p of ITEMS) {
        if (p.kind !== kind) continue;
        const have = known.has(p.id);
        const row = document.createElement("div");
        row.className = "row" + (have ? "" : " locked");
        row.innerHTML = have
          ? `<div class="ico">${p.icon}</div><div class="info"><div class="name">${p.name}</div><div class="desc">${p.does}</div></div><div class="recipe">${p.recipe.map((i) => INGREDIENTS[i].icon).join("")}</div>`
          : `<div class="ico">❔</div><div class="info"><div class="name">${p.name}</div><div class="desc">Buy this recipe at the 📚 Recipe Library in town.</div></div>`;
        rows.appendChild(row);
      }
    }
    $("bookScreen").hidden = false;
  }

  // ---------- Start ----------
  function begin(save) {
    day = save ? save.day : 1;
    coins = save ? save.coins : 0;
    known = new Set([...START_KNOWN, ...(save ? save.known : [])]);
    decor = new Set(save ? save.decor : []);
    shopLevel = save && save.shopLevel ? save.shopLevel : 0;
    hasPlayhouse = !!(save && save.hasPlayhouse);
    home = save && save.home ? save.home : save && save.hasMansion ? "mansion" : "store";
    stuff = new Set(save && save.stuff ? save.stuff : []);
    hired = new Set(save && save.hired ? save.hired : []);
    staff = save && save.staff ? save.staff : {};
    for (const id of hired) staffFor(id);
    stock = Object.assign(startStock(), save && save.stock ? save.stock : {});
    $("startScreen").hidden = true;
    startDay();
  }
  function refreshStart() {
    const s = loadSave();
    $("continueBtn").hidden = !s;
    $("saveInfo").textContent = s ? `Saved shop: Day ${s.day}, 💰 ${s.coins}` : "";
  }

  $("counterTop").addEventListener("click", () => { walker.store.target = STORE_SPOTS.counter.target; });
  $("toMapBtn").addEventListener("click", () => { showStoreMap(); placeMe(STORE_SPOTS.counter.back); });
  $("brewBtn").addEventListener("click", brew);
  $("emptyBtn").addEventListener("click", emptyPot);
  $("bookBtn").addEventListener("click", openBook);
  $("closeBookBtn").addEventListener("click", () => { $("bookScreen").hidden = true; });
  $("townBtn").addEventListener("click", () => { if (dayOpen) openTown("work"); });
  $("backToMapBtn").addEventListener("click", () => {
    placeMeInTown(townBack(PLACES.find((p) => p.id === lastPlace)));
    showMap();
  });
  $("washBackBtn").addEventListener("click", closeWashroom);
  $("pottyGoBtn").addEventListener("click", pottyGo);
  $("pottyWaitBtn").addEventListener("click", () => { $("pottyScreen").hidden = true; });
  $("eatLunchBtn").addEventListener("click", eatLunch);
  $("lunchLaterBtn").addEventListener("click", closeLunch);
  $("closeStaffBtn").addEventListener("click", closeStaff);
  $("closeTeachBtn").addEventListener("click", () => {
    $("teachScreen").hidden = true;
    if (!$("townScreen").hidden && !$("placeView").hidden) renderPlace("jobs");
  });
  $("washroomArea").addEventListener("click", () => { walker.store.target = STORE_SPOTS.washroom.target; });
  $("storeBedroom").addEventListener("click", () => { walker.store.target = STORE_SPOTS.bedroom.target; });
  $("doorArea").addEventListener("click", () => { walker.store.target = STORE_SPOTS.door.target; });
  // W A S D / arrow keys walk the witch on the maps
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) return;
    const onStore = (dayOpen || storeNight) && !$("mapView").hidden && !paused();
    const onTown = !$("townScreen").hidden && $("placeView").hidden && $("bossScreen").hidden;
    if (!onStore && !onTown) return;
    e.preventDefault();
    walkKeys.add(k);
  });
  window.addEventListener("keyup", (e) => walkKeys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => walkKeys.clear());
  $("newBtn").addEventListener("click", () => begin(null));
  $("continueBtn").addEventListener("click", () => begin(loadSave()));
  $("nextDayBtn").addEventListener("click", () => openTown("evening"));
  $("sleepBtn").addEventListener("click", goToSleep);
  $("homeToTownBtn").addEventListener("click", () => {
    $("homeScreen").hidden = true;
    // Your bedroom is in the shop: step back out onto the shop floor
    if (homeMode === "day" || home === "store") { placeMe(STORE_SPOTS.bedroom.back); return; }
    openTown("evening");
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("bookScreen").hidden) { $("bookScreen").hidden = true; return; }
    if (paused() || $("counterView").hidden) return;
    if (e.key === "Enter") { e.preventDefault(); brew(); }
    if (e.key === "Backspace") { e.preventDefault(); emptyPot(); }
  });

  // You, walking around your store
  walker.store.el = document.createElement("div");
  walker.store.el.className = "me";
  walker.store.el.textContent = "🧙‍♀️";
  $("store").appendChild(walker.store.el);
  drawWalker(walker.store);

  renderIngredients();
  renderPot();
  renderShelf();
  renderNeeds();
  refreshStart();
  setInterval(tick, 100);
  setInterval(needsTick, 100);
  requestAnimationFrame(frame);
})();
