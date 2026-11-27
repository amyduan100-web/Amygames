// Richest: start with nothing on a park bench, get jobs, and become the richest person in town!
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "amygames.richest.save";
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffle = (list) => list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const money = (n) => (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));

  // ---------- Time ----------
  const GAME_MIN_PER_SEC = 1;   // 1 real second = 1 game minute, so a day (7am to 11pm) takes 16 real minutes
  const WAKE_UP = 7 * 60;
  const LATE = 21 * 60;         // "It's getting late" message
  const BEDTIME = 23 * 60;      // after this you get sleepy really fast
  const SHIFT_SECS = 30;        // a work shift is 30 real seconds...
  const SHIFT_MINUTES = 120;    // ...and 2 hours on the clock
  const CAN_PRICE = 0.5;        // Recycling pays 50 cents for each can

  // ---------- The city: 9 blocks, and each block has its own little streets ----------
  const PLACES = {
    park: { icon: "🌳", name: "Park" },
    foodbank: { icon: "🥫", name: "Food Bank" },
    jobs: { icon: "💼", name: "Job Center" },
    hall: { icon: "🏛️", name: "Town Hall" },
    school: { icon: "🏫", name: "School" },
    estate: { icon: "🏦", name: "Homes & Business" },
    recycle: { icon: "♻️", name: "Recycling" },
    bath: { icon: "🚿", name: "Bath House" },
    store: { icon: "🛒", name: "Grocery Store" },
    cafe: { icon: "☕", name: "Café" },
    restaurant: { icon: "🍝", name: "Restaurant" },
    hospital: { icon: "🏥", name: "Hospital" },
    carwash: { icon: "🚗", name: "Car Wash" },
    news: { icon: "📰", name: "News Office" },
    home: { icon: "🏚️", name: "Empty lot" },
    police: { icon: "🚓", name: "Police Station" },
    bakery: { icon: "🥐", name: "Bakery" },
    bus: { icon: "🚌", name: "Bus Station" },
    stage: { icon: "🎤", name: "Concert Hall" },
    petshop: { icon: "🐾", name: "Pet Shop" },
  };
  const COLS = [[2, 31], [37, 64], [70, 98]];
  const ROWS = [[3, 34], [43, 70], [79, 97]];
  const BLOCKS = [
    { name: "Park Street", places: ["park", "foodbank"], deco: ["🎠", "⛱️"] },
    { name: "Downtown", places: ["jobs", "hall", "police"], deco: ["🚏"] },
    { name: "School Hill", places: ["school", "estate"], deco: ["🚸", "🌳"] },
    { name: "Clean Street", places: ["recycle", "bath"], deco: ["🗑️", "🌳"] },
    { name: "Market Square", places: ["store", "cafe", "bakery"], deco: ["⛲"] },
    { name: "Health Avenue", places: ["restaurant", "hospital"], deco: ["🚑", "🌳"] },
    { name: "Car Wash Lane", places: ["carwash", "bus"], deco: ["🚙", "🌳"] },
    { name: "Newspaper Row", places: ["news", "stage"], deco: ["📮", "🌳"] },
    { name: "Home Lane", places: ["home", "petshop"], deco: ["🌻", "🌳"] },
  ];
  BLOCKS.forEach((b, i) => {
    const [x0, x1] = COLS[i % 3], [y0, y1] = ROWS[Math.floor(i / 3)];
    b.rect = { x0, x1, y0, y1 };
    b.center = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  });
  const blockOf = (placeId) => BLOCKS.findIndex((b) => b.places.includes(placeId));
  // Inside a block: buildings sit in the corners between the little streets
  const LOTS = [{ x: 22, y: 27 }, { x: 78, y: 27 }, { x: 22, y: 86 }, { x: 78, y: 86 }];
  // Street corners, where cans end up
  const CORNERS = [{ x: 41, y: 54 }, { x: 59, y: 54 }, { x: 41, y: 72 }, { x: 59, y: 72 }, { x: 6, y: 55 }, { x: 94, y: 71 }];
  function placePos(placeId) {
    const b = BLOCKS[blockOf(placeId)];
    return LOTS[b.places.indexOf(placeId)];
  }

  // ---------- Jobs ----------
  // kind "tap": click the things that pop up. kind "pick": choose the right answer.
  // home: what you earn working from your mansion's computer (only really good jobs!)
  const JOBS = [
    { id: "sweeper", icon: "🧹", name: "Street Sweeper", place: "hall", kind: "tap", target: "🍂", bg: "🛣️", pay: 2,
      help: "Click the leaves and trash to sweep the streets clean!", needs: {} },
    { id: "dogs", icon: "🐶", name: "Dog Walker", place: "park", kind: "tap", target: "🐕", bg: "🌳", pay: 2,
      help: "Click the dogs that want to go for a walk!", needs: {} },
    { id: "carwash", icon: "🧽", name: "Car Washer", place: "carwash", kind: "tap", target: "🟤", bg: "🚙", pay: 2,
      help: "Click the mud spots to wash the car!", needs: {} },
    { id: "paper", icon: "📰", name: "Newspaper Delivery", place: "news", kind: "tap", target: "📬", bg: "🏘️", pay: 3,
      help: "Ride your bike and click the mailboxes to deliver newspapers!", needs: { bike: true } },
    { id: "busdriver", icon: "🚌", name: "Bus Driver", place: "bus", kind: "tap", target: "🙋", bg: "🚏", pay: 4,
      help: "Click the people waving at the bus stop to pick them up!", needs: { school: 1 } },
    { id: "baker", icon: "🧁", name: "Baker", place: "bakery", kind: "pick", pay: 6,
      help: "Bake what each customer wants!", needs: { clean: true },
      answers: [["🍞", "a loaf of bread"], ["🥐", "a croissant"], ["🧁", "a cupcake"], ["🥧", "a pie"], ["🎂", "a birthday cake"], ["🍪", "cookies"], ["🥨", "a pretzel"], ["🍩", "a donut"]],
      ask: (a) => `"Can you bake me ${a[1]}, please?"` },
    { id: "police", icon: "👮", name: "Police Officer", place: "police", kind: "pick", pay: 10, labels: true,
      help: "Help people find what they lost!", needs: { school: 2 },
      answers: [["🐶", "dog", "I lost my dog!"], ["🎈", "balloon", "My balloon flew away!"], ["🔑", "keys", "I can't find my keys!"],
        ["👛", "purse", "Where is my purse?"], ["🧸", "teddy", "I lost my teddy bear!"], ["🚲", "bike", "Someone took my bike!"], ["🐱", "cat", "My cat ran away!"]],
      ask: (a) => `"${a[2]}"` },
    { id: "cafe", icon: "☕", name: "Café Helper", place: "cafe", kind: "pick", pay: 5,
      help: "Give each customer what they ordered!", needs: { clean: true },
      answers: [["☕", "coffee"], ["🧃", "juice box"], ["🥛", "glass of milk"], ["🍵", "cup of tea"], ["🍩", "donut"], ["🥐", "croissant"], ["🧁", "cupcake"], ["🍪", "cookie"]],
      ask: (a) => `"One ${a[1]}, please!"` },
    { id: "chef", icon: "👩‍🍳", name: "Chef", place: "restaurant", kind: "pick", pay: 12,
      help: "Cook what the table ordered!", needs: { clean: true, school: 1 },
      answers: [["🍝", "spaghetti"], ["🍕", "pizza"], ["🍔", "burger"], ["🍜", "noodle soup"], ["🥗", "salad"], ["🍣", "sushi"], ["🌮", "taco"], ["🥞", "pancakes"]],
      ask: (a) => `"Table 3 wants ${a[1]}!"` },
    { id: "teacher", icon: "👩‍🏫", name: "Teacher", place: "school", kind: "math", pay: 15,
      help: "Your students ask math questions. Click the right answer!", needs: { school: 3 } },
    { id: "rockstar", icon: "🎸", name: "Rock Star", place: "stage", kind: "tap", target: "🎵", bg: "🎤", pay: 20,
      help: "Click the music notes to play your song! The crowd goes wild! 🤘", needs: { school: 2 },
      home: 250, homeSay: "You recorded a new song in your mansion studio!" },
    { id: "banker", icon: "🏦", name: "Banker", place: "estate", kind: "tap", target: "💰", bg: "🏦", pay: 25,
      help: "Click the money bags to put them in the bank vault!", needs: { school: 3 },
      home: 300, homeSay: "You checked the bank's money on your computer!" },
    { id: "doctor", icon: "👩‍⚕️", name: "Doctor", place: "hospital", kind: "pick", pay: 30, labels: true,
      help: "Help each patient with the right thing!", needs: { clean: true, school: 3 },
      answers: [["💊", "medicine", "My tummy hurts!"], ["🩹", "bandage", "I scraped my knee!"], ["🧊", "ice pack", "I bumped my head!"],
        ["🌡️", "thermometer", "I feel so hot. Do I have a fever?"], ["🩺", "stethoscope", "My heart goes boom boom really fast!"], ["👓", "glasses", "I can't see the board at school!"]],
      ask: (a) => `"${a[2]}"`,
      home: 200, homeSay: "You helped patients on video calls from your comfy mansion." },
  ];
  const jobById = (id) => JOBS.find((j) => j.id === id);
  // You can have up to 3 jobs at the same time!
  const MAX_JOBS = 3;
  const myJobs = () => (s.jobs || []).map(jobById).filter(Boolean);
  const hasJob = (id) => (s.jobs || []).includes(id);
  const bestJob = () => myJobs().sort((a, b) => b.pay - a.pay)[0] || null;

  // Better food costs more, but keeps you full for longer (your tummy doesn't get hungry for a while)
  const FOODS = [
    { id: "apple", icon: "🍎", name: "Apple", cost: 2, fill: 15, hours: 1 },
    { id: "sandwich", icon: "🥪", name: "Sandwich", cost: 5, fill: 40, hours: 2 },
    { id: "lunch", icon: "🍱", name: "Big lunch box", cost: 12, fill: 80, hours: 4 },
    { id: "steak", icon: "🍖", name: "Fancy dinner", cost: 30, fill: 100, hours: 8 },
  ];
  // Pets! They need their own food, and they love to play
  const PETS = {
    dog: { icon: "🐶", name: "dog", food: "dogfood", sound: "Woof woof!", cost: 100 },
    cat: { icon: "🐱", name: "cat", food: "catfood", sound: "Meow!", cost: 80 },
  };
  const PET_ITEMS = [
    { id: "dogfood", icon: "🦴", name: "Dog food", cost: 3, pet: "dog" },
    { id: "catfood", icon: "🐟", name: "Cat food", cost: 3, pet: "cat" },
    { id: "toy", icon: "🎾", name: "Play toy", cost: 5 },
  ];
  const now = () => s.day * 1440 + s.time; // minutes since the game started
  const fullNow = () => (s.fullUntil || 0) > now();
  function eat(f) {
    if (!s.bag[f.id]) return false;
    s.bag[f.id]--;
    s.hunger = Math.min(100, s.hunger + f.fill);
    s.fullUntil = Math.max(s.fullUntil || 0, now() + f.hours * 60);
    renderHud(); save();
    return true;
  }
  // Your backpack can stay at home. Then you can't use it until you go home!
  const bagWithMe = () => !s.bagAtHome || view === "house";
  const bagFood = () => (bagWithMe() ? FOODS.filter((f) => s.bag[f.id] > 0) : []);
  const RIDES = [
    { id: "bike", icon: "🚲", name: "Bike", cost: 80, speed: 24, note: "Go faster, and get the Newspaper job!" },
    { id: "car", icon: "🚗", name: "Car", cost: 900, speed: 38, note: "Zoom around town super fast!" },
  ];
  const CLASSES = [
    { n: 1, name: "Class 1: Reading & Math", cost: 30 },
    { n: 2, name: "Class 2: Science", cost: 80 },
    { n: 3, name: "Class 3: Doctor School", cost: 150 },
  ];
  const HOMES = [
    { id: "apartment", icon: "🏢", name: "Tiny Apartment", cost: 200 },
    { id: "house", icon: "🏡", name: "House", cost: 1500 },
    { id: "mansion", icon: "🏰", name: "Mansion", cost: 8000 },
  ];
  const BUSINESSES = [
    { id: "lemonade", icon: "🍋", name: "Lemonade Stand", cost: 250, income: 25 },
    { id: "shop", icon: "🏪", name: "Corner Shop", cost: 1500, income: 120 },
    { id: "hotel", icon: "🏨", name: "Hotel", cost: 7000, income: 500 },
    { id: "tower", icon: "🏙️", name: "Big Tower", cost: 25000, income: 1500 },
  ];
  // When you're rich enough, you can become the Mayor, and then the Queen!
  const TITLES = {
    mayor: { icon: "🎩", name: "Mayor", worth: 50000, salary: 1000,
      cheer: "🎩🎉 You're the MAYOR of the town now! Everyone claps for you! You get 💰1000 every morning." },
    queen: { icon: "👑", name: "Queen", worth: 100000, salary: 3000,
      cheer: "👑🎉 You're the QUEEN! You get a crown and a royal cape! You get 💰3000 every morning." },
  };
  // The richest people in town (you start at the bottom!)
  const RICH_PEOPLE = [
    { icon: "👑", name: "Queen Ruby", worth: 100000 },
    { icon: "🎩", name: "Mayor Max", worth: 50000 },
    { icon: "🏦", name: "Banker Bea", worth: 25000 },
    { icon: "🎸", name: "Rock Star Rex", worth: 12000 },
    { icon: "👩‍🏫", name: "Teacher Tia", worth: 6000 },
    { icon: "👮", name: "Officer Olly", worth: 3000 },
    { icon: "🚌", name: "Bus Driver Ben", worth: 1500 },
    { icon: "🧁", name: "Baker Betty", worth: 600 },
    { icon: "🐶", name: "Dog Walker Dot", worth: 150 },
    { icon: "🧹", name: "Street Sweeper Sam", worth: 40 },
  ];
  const WALKERS = ["🚶", "🚶‍♀️", "🚶‍♂️", "🏃", "🏃‍♀️"];
  const TOSS_WORDS = ["*toss*", "Oops!", "*clink*", "Whatever!", "*plonk*"];

  // ---------- Game state ----------
  let s = null; // everything that gets saved
  function freshState() {
    return { v: 1, day: 1, time: WAKE_UP, coins: 0, cans: 0, bag: {}, hunger: 80, energy: 100, clean: 60,
      jobs: [], title: null, bagAtHome: false, pet: null, school: 0, bike: false, car: false, home: null, biz: {}, block: 0, x: 22, y: 42, wonAt: 0 };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* no saving */ } }
  function load() {
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.v === 1 ? d : null; } catch (e) { return null; }
  }

  let playing = false;
  let view = "street";     // "map" (the whole city) or "street" (inside one block)
  let walking = null;      // { x, y, then } where you're walking to
  let mapPos = { x: 0, y: 0 }; // where you are on the city map
  let asleep = false;
  let goingToFoodBank = false;
  let lateWarned = false;
  let cansAt = [];         // for each block: which corners have a can
  let npcs = [];           // people walking in the block you're in
  let npcTimer = 3;

  // ---------- Money and the Richest list ----------
  function worth() {
    let w = s.coins;
    if (s.bike) w += 40;
    if (s.car) w += 450;
    const h = HOMES.find((x) => x.id === s.home);
    if (h) w += h.cost;
    for (const b of BUSINESSES) w += (s.biz[b.id] || 0) * b.cost;
    return w;
  }
  function rank() { return 1 + RICH_PEOPLE.filter((p) => p.worth > worth()).length; }

  // ---------- The city map ----------
  const town = $("town");
  const street = $("street");
  const house = $("house");
  let mapMe, mapGoal, streetMe, streetGoal, houseMe, houseGoal;
  let homePos = { x: 50, y: 86 }; // where you are inside your home
  // Which screen you're looking at: the city map, a street, or inside your home
  const viewEl = () => (view === "map" ? town : view === "house" ? house : street);
  const meEl = () => (view === "map" ? mapMe : view === "house" ? houseMe : streetMe);
  const goalEl = () => (view === "map" ? mapGoal : view === "house" ? houseGoal : streetGoal);
  const posNow = () => (view === "map" ? mapPos : view === "house" ? homePos : s);
  function buildMap() {
    town.innerHTML = "";
    BLOCKS.forEach((b, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "block";
      el.id = `block-${i}`;
      el.dataset.block = i;
      el.style.left = `${b.rect.x0}%`;
      el.style.top = `${b.rect.y0}%`;
      el.style.width = `${b.rect.x1 - b.rect.x0}%`;
      el.style.height = `${b.rect.y1 - b.rect.y0}%`;
      town.appendChild(el);
    });
    for (const c of [{ e: "🚕", x: 34, y: 20 }, { e: "🚌", x: 80, y: 38.5 }, { e: "🚙", x: 67, y: 88 }]) {
      const d = document.createElement("div");
      d.className = "car-deco";
      d.textContent = c.e;
      d.style.left = `${c.x}%`;
      d.style.top = `${c.y}%`;
      d.style.transform = "translate(-50%, -50%)";
      town.appendChild(d);
    }
    mapGoal = makeGoal(town);
    mapMe = document.createElement("div");
    mapMe.className = "me";
    town.appendChild(mapMe);
    renderMap();
  }
  function renderMap() {
    const jobPlaces = myJobs().map((j) => j.place);
    BLOCKS.forEach((b, i) => {
      const el = $(`block-${i}`);
      const icons = b.places.map((p) => placeIcon(p)).join("");
      const n = cansAt[i].filter(Boolean).length;
      el.innerHTML = `<span class="icons">${icons}</span>${b.name}${n ? `<span class="cans-here">🥫 ×${n}</span>` : ""}`;
      el.classList.toggle("here", i === s.block);
      el.classList.toggle("mine", (b.places.includes("home") && !!s.home) || b.places.some((p) => jobPlaces.includes(p)));
    });
  }
  function placeIcon(p) {
    if (p === "home") { const h = HOMES.find((x) => x.id === s.home); if (h) return h.icon; }
    return PLACES[p].icon;
  }
  function placeName(p) {
    if (p === "home") { const h = HOMES.find((x) => x.id === s.home); if (h) return `My ${h.name}`; }
    return PLACES[p].name;
  }
  function makeGoal(parent) {
    const g = document.createElement("div");
    g.className = "goal";
    g.textContent = "📍";
    g.hidden = true;
    parent.appendChild(g);
    return g;
  }

  // ---------- Inside a block ----------
  function buildStreet() {
    const b = BLOCKS[s.block];
    street.innerHTML = "";
    npcs = [];
    const mapBtn = document.createElement("button");
    mapBtn.type = "button";
    mapBtn.className = "map-btn";
    mapBtn.textContent = "🗺️ City map";
    mapBtn.addEventListener("click", (e) => { e.stopPropagation(); if (!paused() && !goingToFoodBank) showMap(); });
    street.appendChild(mapBtn);
    const name = document.createElement("div");
    name.className = "block-name";
    name.textContent = `📍 ${b.name}`;
    street.appendChild(name);
    const jobPlaces = myJobs().map((j) => j.place);
    b.places.forEach((p, i) => {
      const lot = LOTS[i];
      const el = document.createElement("button");
      el.type = "button";
      el.className = "building";
      el.dataset.place = p;
      el.style.left = `${lot.x}%`;
      el.style.top = `${lot.y}%`;
      el.innerHTML = `<span class="ico">${placeIcon(p)}</span>${placeName(p)}`;
      el.classList.toggle("mine", p === "home" && !!s.home);
      el.classList.toggle("myjob", jobPlaces.includes(p));
      street.appendChild(el);
    });
    b.deco.forEach((d, i) => {
      const lot = LOTS[b.places.length + i];
      if (!lot) return;
      const el = document.createElement("div");
      el.className = "deco";
      el.style.left = `${lot.x}%`;
      el.style.top = `${lot.y}%`;
      el.style.fontSize = "46px";
      el.textContent = d;
      street.appendChild(el);
    });
    // a few small things to make it cozy
    for (const [e, x, y] of [["🌳", 8, 8], ["🌳", 92, 8], ["🌷", 34, 44], ["🌷", 66, 44]]) {
      const el = document.createElement("div");
      el.className = "deco";
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.textContent = e;
      street.appendChild(el);
    }
    cansAt[s.block].forEach((has, i) => { if (has) drawCan(i); });
    streetGoal = makeGoal(street);
    streetMe = document.createElement("div");
    streetMe.className = "me";
    street.appendChild(streetMe);
    renderMe();
  }
  function drawCan(i) {
    const c = CORNERS[i];
    const el = document.createElement("button");
    el.type = "button";
    el.className = "can";
    el.id = `can-${i}`;
    el.dataset.can = i;
    el.textContent = "🥫";
    el.style.left = `${c.x}%`;
    el.style.top = `${c.y}%`;
    street.appendChild(el);
    return el;
  }
  function showMap() {
    view = "map";
    walking = null;
    mapPos = { ...BLOCKS[s.block].center };
    street.hidden = true;
    house.hidden = true;
    town.hidden = false;
    renderMap();
    renderMe();
    say("🗺️ The city map. Click a block to go there!");
  }
  function enterBlock(i, from) {
    s.block = i;
    view = "street";
    town.hidden = true;
    house.hidden = true;
    street.hidden = false;
    if (from === "map") { s.x = 50; s.y = 94; }
    if (from === "home") { const p = placePos("home"); s.x = p.x; s.y = p.y + 13; }
    buildStreet();
    renderHud();
    say(`📍 ${BLOCKS[i].name}. ${cansAt[i].some(Boolean) ? "I see some cans 🥫 on the corners!" : "Click anywhere to walk."}`);
  }

  function renderMe() {
    const ride = s.car ? "🚗" : s.bike ? "🚲" : "";
    // The bike (or car) goes under you, so it looks like you're riding it
    const pet = s.pet ? `<span class="pet">${PETS[s.pet.type].icon}</span>` : "";
    const html = `${ride && !asleep && view !== "house" ? `<span class="ride">${ride}</span>` : ""}<span class="kid">🧒</span>${pet}`;
    const el = meEl();
    if (!el) return;
    if (el.dataset.html !== html) { el.dataset.html = html; el.innerHTML = html; }
    el.classList.toggle("sleeping", asleep);
    const p = posNow();
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
  }
  function clockText(t) {
    const h = Math.floor(t / 60) % 24, m = Math.floor(t % 60);
    const ampm = h < 12 ? "am" : "pm";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  // Only change text when it's different (so the emoji pictures don't get rebuilt all the time)
  function setText(id, t) {
    const el = $(id);
    if (el.dataset.t !== t) { el.dataset.t = t; el.textContent = t; }
  }
  function renderHud() {
    setText("dayLabel", `Day ${s.day}`);
    setText("clock", `${s.time >= 20 * 60 ? "🌙" : "☀️"} ${clockText(s.time)}`);
    setText("coins", money(s.coins));
    setText("rank", `🏆 #${rank()}`);
    const items = s.cans + [...FOODS, ...PET_ITEMS].reduce((n, f) => n + (s.bag[f.id] || 0), 0);
    $("needPet").hidden = !s.pet;
    if (s.pet) {
      setText("petIcon", PETS[s.pet.type].icon);
      setBar("Pet", s.pet.food);
      setText("petFun", s.pet.fun <= 25 ? "😢 bored" : "💛");
    }
    setText("bag", bagWithMe() ? `🎒 Backpack (${items})` : "🎒 Backpack is at home 🏠");
    setBar("Hunger", s.hunger);
    setBar("Energy", s.energy);
    setText("fullIcon", fullNow() ? "😋 full" : "");
    setBar("Clean", s.clean);
    const jobs = myJobs();
    const title = s.title ? `${TITLES[s.title].icon} ${TITLES[s.title].name} · ` : "";
    setText("jobLabel", jobs.length || title ? `${title}💼 ${jobs.map((j) => `${j.icon} ${j.name}`).join(", ") || "no job"}` : "💼 No job yet");
    for (const el of [town, street, house]) {
      el.classList.toggle("evening", s.time >= 19 * 60 && s.time < 21 * 60);
      el.classList.toggle("night", s.time >= 21 * 60);
    }
  }
  function setBar(name, v) {
    const bar = $(`bar${name}`);
    bar.style.width = `${Math.max(0, v)}%`;
    bar.style.background = v > 50 ? "var(--good)" : v > 25 ? "var(--gold)" : "var(--bad)";
    $(`need${name}`).classList.toggle("low", v <= 25);
  }
  function say(text) { setText("msg", text); }
  function floatText(text, at, parent) {
    const f = document.createElement("div");
    f.className = "float";
    f.textContent = text;
    f.style.left = `${at.x}%`;
    f.style.top = `${at.y}%`;
    (parent || viewEl()).appendChild(f);
    setTimeout(() => f.remove(), 1600);
  }

  // ---------- Pop-ups ----------
  function paused() {
    return !playing || asleep || ["startScreen", "placeScreen", "workScreen", "infoScreen", "bagScreen"].some((id) => !$(id).hidden);
  }

  // ---------- Your backpack ----------
  function openBag() {
    if (!playing || asleep || !$("workScreen").hidden) return;
    if (!bagWithMe()) { say("🎒 Your backpack is at home! Go home to get it."); return; }
    renderBag("");
    $("bagScreen").hidden = false;
  }
  function renderBag(note) {
    const rows = $("bagRows");
    rows.innerHTML = "";
    let empty = true;
    if (s.cans) {
      empty = false;
      row(rows, "🥫", `Cans ×${s.cans}`, `Bring them to ♻️ Recycling on Clean Street for 💰${money(s.cans * CAN_PRICE)}`, null);
    }
    for (const f of FOODS) {
      const n = s.bag[f.id] || 0;
      if (!n) continue;
      empty = false;
      row(rows, f.icon, `${f.name} ×${n}`, `🍞 +${f.fill} · 😋 not hungry for ${f.hours} hour${f.hours === 1 ? "" : "s"}`, "Eat 😋", s.hunger < 98, () => {
        eat(f);
        renderBag(`😋 Munch munch! You ate the ${f.icon} ${f.name}. You won't get hungry for ${f.hours} hour${f.hours === 1 ? "" : "s"}!`);
      });
    }
    // Pet food and toys
    for (const it of PET_ITEMS) {
      const n = s.bag[it.id] || 0;
      if (!n) continue;
      empty = false;
      const pet = s.pet ? PETS[s.pet.type] : null;
      if (it.pet) {
        const ok = pet && s.pet.type === it.pet;
        row(rows, it.icon, `${it.name} ×${n}`, ok ? `feed your ${pet.name}` : `for a ${it.pet}`, "Feed 🍽️", ok && s.pet.food < 98, () => {
          s.bag[it.id]--;
          s.pet.food = 100;
          renderHud(); save();
          renderBag(`${pet.icon} ${pet.sound} Crunch crunch! Your ${pet.name} loves it! 💛`);
        });
      } else {
        // A toy doesn't get used up, you can play with it again and again!
        row(rows, it.icon, `${it.name} ×${n}`, pet ? `play with your ${pet.name}` : "for when you have a pet", "Play 🎾", !!pet && s.pet.fun < 98, () => {
          passTime(10);
          s.pet.fun = 100;
          renderHud(); save();
          renderBag(pick([`${pet.icon} You throw the ball and your ${pet.name} runs to get it! 🎾💨`, `${pet.icon} Your ${pet.name} jumps and plays! So much fun! 😆`]));
        });
      }
    }
    if (empty) note = note || "Your backpack is empty! Pick up cans 🥫 on the street corners, or buy food at the 🛒 Grocery Store.";
    else if (!note && s.hunger >= 98) note = "You're full! Save your food for later. 😊";
    $("bagNote").textContent = note;
  }
  $("bag").addEventListener("click", openBag);
  $("closeBagBtn").addEventListener("click", () => { $("bagScreen").hidden = true; });
  let infoDone = null;
  function info(art, title, text, button, then) {
    $("infoArt").textContent = art;
    $("infoTitle").textContent = title;
    $("infoText").textContent = text;
    $("infoBtn").textContent = button || "OK";
    infoDone = then || null;
    $("infoScreen").hidden = false;
  }
  $("infoBtn").addEventListener("click", () => {
    $("infoScreen").hidden = true;
    const t = infoDone;
    infoDone = null;
    if (t) t();
  });

  // ---------- Walking: click anywhere! ----------
  function speed() { return s.car ? RIDES[1].speed : s.bike ? RIDES[0].speed : 14; }
  function pointIn(el, e) {
    const r = el.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }
  town.addEventListener("click", (e) => {
    if (paused()) return;
    if (goingToFoodBank && walking) { say("😫 Too hungry! You're walking to the 🥫 Food Bank first."); return; }
    const blockEl = e.target.closest(".block");
    if (blockEl) { travelTo(Number(blockEl.dataset.block)); return; }
    const p = pointIn(town, e);
    walkTo(p.x, p.y, null); // you can walk on the roads too
  });
  street.addEventListener("click", (e) => {
    if (paused()) return;
    if (goingToFoodBank && walking) { say("😫 Too hungry! You're walking to the 🥫 Food Bank first."); return; }
    const b = e.target.closest(".building");
    if (b) {
      const p = b.dataset.place, pos = placePos(p);
      // Your own home: walk right in and look around! (no pop-up box)
      walkTo(pos.x, pos.y + 12, () => (p === "home" && s.home ? enterHouse() : openPlace(p)));
      return;
    }
    const can = e.target.closest(".can");
    if (can) { const c = CORNERS[Number(can.dataset.can)]; walkTo(c.x, c.y, null); return; }
    const p = pointIn(street, e);
    walkTo(p.x, p.y, null);
  });
  function walkTo(x, y, then) {
    walking = { x: Math.max(3, Math.min(97, x)), y: Math.max(5, Math.min(97, y)), then };
    const g = goalEl();
    g.style.left = `${walking.x}%`;
    g.style.top = `${walking.y}%`;
    g.hidden = !!then;
  }
  // Walk across the city map to a block, then go into it
  function travelTo(i, then) {
    if (view === "street" && s.block === i) { if (then) then(); return; }
    if (view === "house") { leaveHouse(); if (s.block === i) { if (then) then(); return; } }
    if (view === "street") showMap();
    const c = BLOCKS[i].center;
    say(`🚶 Going to ${BLOCKS[i].name}...`);
    walkTo(c.x, c.y, () => { enterBlock(i, "map"); if (then) then(); });
  }
  // Go to a place anywhere in town (used when you're too hungry)
  function goToPlace(p) {
    const i = blockOf(p);
    travelTo(i, () => { const pos = placePos(p); walkTo(pos.x, pos.y + 12, () => openPlace(p)); });
  }
  function stepWalk(dt) {
    if (!walking) return;
    const pos = posNow();
    const dx = walking.x - pos.x, dy = walking.y - pos.y;
    const dist = Math.hypot(dx, dy);
    const step = (view === "house" ? 24 : speed() * (view === "map" ? 1.4 : 1)) * dt; // indoors you just walk
    if (dist <= step) {
      pos.x = walking.x; pos.y = walking.y;
      const then = walking.then;
      walking = null;
      goalEl().hidden = true;
      renderMe();
      if (view === "street") pickUpCans();
      if (then) then();
      return;
    }
    pos.x += (dx / dist) * step;
    pos.y += (dy / dist) * step;
    renderMe();
    if (view === "street") pickUpCans();
  }

  // ---------- Cans ----------
  let noBagWarned = false;
  function pickUpCans() {
    const here = cansAt[s.block];
    if (!bagWithMe()) {
      // No backpack, no cans!
      const near = here.some((has, i) => has && Math.hypot(CORNERS[i].x - s.x, CORNERS[i].y - s.y) <= 4);
      if (near && !noBagWarned) { noBagWarned = true; say("🥫 A can! But your backpack is at home, so you can't carry it."); }
      if (!near) noBagWarned = false;
      return;
    }
    here.forEach((has, i) => {
      if (!has) return;
      const c = CORNERS[i];
      if (Math.hypot(c.x - s.x, c.y - s.y) > 4) return;
      here[i] = false;
      s.cans++;
      const el = $(`can-${i}`);
      if (el) el.remove();
      floatText("+🥫", c);
      renderHud();
      say(`🥫 You picked up a can! You have ${s.cans} in your backpack. Bring them to ♻️ Recycling on Clean Street.`);
    });
  }
  function addCanSomewhere(block) {
    const empty = cansAt[block].map((has, i) => (has ? -1 : i)).filter((i) => i >= 0);
    if (!empty.length) return;
    cansAt[block][pick(empty)] = true;
  }
  // People walk by on the little streets, and some of them toss a can on a corner
  function stepNpcs(dt) {
    if (view !== "street") return;
    npcTimer -= dt;
    if (npcTimer <= 0 && npcs.length < 2 && s.time < LATE) {
      npcTimer = 5 + Math.random() * 5;
      spawnNpc();
    }
    for (const n of [...npcs]) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.el.style.left = `${n.x}%`;
      n.el.style.top = `${n.y}%`;
      if (n.toss !== null && !n.tossed && Math.hypot(CORNERS[n.toss].x - n.x, CORNERS[n.toss].y - n.y) < 12) {
        n.tossed = true;
        tossCan(n, n.toss);
      }
      if (n.x < -6 || n.x > 106 || n.y < -6 || n.y > 106) {
        n.el.remove();
        npcs.splice(npcs.indexOf(n), 1);
      }
    }
  }
  function spawnNpc() {
    const el = document.createElement("div");
    el.className = "npc";
    el.textContent = pick(WALKERS);
    const across = Math.random() < 0.6;
    const n = { el, tossed: false };
    if (across) {
      const right = Math.random() < 0.5;
      n.x = right ? -4 : 104; n.y = pick([57, 70]);
      n.vx = right ? 9 : -9; n.vy = 0;
      if (right) el.classList.add("right");
    } else {
      const down = Math.random() < 0.5;
      n.x = pick([43, 57]); n.y = down ? -4 : 104;
      n.vx = 0; n.vy = down ? 11 : -11;
    }
    // Will this person toss a can? Pick an empty corner along the way.
    const empty = CORNERS.map((c, i) => i).filter((i) => !cansAt[s.block][i] &&
      (across ? Math.abs(CORNERS[i].y - n.y) < 12 : Math.abs(CORNERS[i].x - n.x) < 12));
    n.toss = empty.length && Math.random() < 0.65 ? pick(empty) : null;
    el.style.left = `${n.x}%`;
    el.style.top = `${n.y}%`;
    street.appendChild(el);
    npcs.push(n);
  }
  function tossCan(n, i) {
    if (cansAt[s.block][i]) return;
    cansAt[s.block][i] = true;
    const el = drawCan(i);
    const c = CORNERS[i];
    el.style.left = `${n.x}%`;
    el.style.top = `${n.y - 4}%`;
    el.classList.add("flying");
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = `${c.x}%`; el.style.top = `${c.y}%`; }));
    setTimeout(() => el.classList.remove("flying"), 750);
    const bubble = document.createElement("div");
    bubble.className = "npc-say";
    bubble.textContent = pick(TOSS_WORDS);
    bubble.style.left = `${n.x}%`;
    bubble.style.top = `${n.y - 8}%`;
    street.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1200);
  }

  // ---------- The clock and your needs ----------
  function passTime(minutes) {
    s.time += minutes;
    // From full to empty takes about 10 real minutes (600 game minutes)
    if (!fullNow()) s.hunger = Math.max(0, s.hunger - minutes * (100 / 600));
    const tiredRate = s.time >= BEDTIME ? 100 / 60 : 100 / 960; // after 11pm you get sleepy FAST
    s.energy = Math.max(0, s.energy - minutes * tiredRate);
    // From clean to "too stinky to work" takes about one game day, so you shower once or twice a day
    s.clean = Math.max(0, s.clean - minutes * (100 / 1920));
    // Your pet gets hungry (in about 20 minutes) and bored (in about a day)
    if (s.pet) {
      s.pet.food = Math.max(0, s.pet.food - minutes * (100 / 1200));
      s.pet.fun = Math.max(0, s.pet.fun - minutes * (100 / 1440));
    }
  }
  let dirtyWarned = false;
  const petWarned = { food: false, fun: false };
  let hungryWarned = false;
  const STARVE_SECS = 60;  // when your tummy is empty, you have 60 seconds to eat
  let starveLeft = null;
  function gameOver() {
    playing = false;
    starveLeft = null;
    closeAll();
    info("💀🍞", "Game over!", "You didn't eat anything, and your tummy was too empty... Your adventure starts all over again on the park bench. Remember to eat! 🍎", "Start again 🎒", () => begin(freshState()));
  }
  function checkNeeds() {
    if (!playing || asleep) return;
    if (!lateWarned && s.time >= LATE) {
      lateWarned = true;
      say(s.home ? "🌙 It's getting late! Go to your 🏠 home on Home Lane to sleep." : "🌙 It's getting late! Go sleep on the bench in the 🌳 Park.");
    }
    // Your pet tells you when it's hungry or wants to play
    if (s.pet) {
      const p = PETS[s.pet.type];
      if (s.pet.food <= 25 && !petWarned.food) { petWarned.food = true; say(`${p.icon} ${p.sound} Your ${p.name} is hungry! Feed it from your 🎒 backpack. (Buy ${p.name} food at the 🐾 Pet Shop.)`); }
      if (s.pet.food > 50) petWarned.food = false;
      if (s.pet.fun <= 25 && !petWarned.fun) { petWarned.fun = true; say(`${p.icon} ${p.sound} Your ${p.name} is bored and wants to play! Use a 🎾 toy from your backpack.`); }
      if (s.pet.fun > 50) petWarned.fun = false;
    }
    // Rich people with a home have to take baths!
    if (s.home && s.clean <= 30 && !dirtyWarned) {
      dirtyWarned = true;
      say("🧼 Oh, you're getting dirty! Go home and take a 🛁 bath.");
    }
    if (s.clean > 50) dirtyWarned = false;
    // Too tired: you lie down right where you are
    if (s.energy <= 0) { fallAsleepHere(); return; }
    // Hungry: a pop-up tells you, and takes you to your backpack
    const noFood = "My backpack has no food! Hurry to the 🥫 Food Bank on Park Street (free soup) or the 🛒 Grocery Store in Market Square!";
    if (s.hunger > 30) hungryWarned = false;
    if (s.hunger <= 20 && s.hunger > 0 && !hungryWarned) {
      hungryWarned = true;
      walking = null;
      if (bagFood().length) info("😋🍞", "I'm hungry!", "My tummy is rumbling! Let's eat something from my backpack.", "Open my backpack 🎒", openBag);
      else info("😋🍞", "I'm hungry!", `My tummy is rumbling! ${noFood}`, "OK, I'll hurry! 🏃");
      return;
    }
    // Starving: eat something soon, or it's game over!
    if (s.hunger <= 0 && starveLeft === null) {
      starveLeft = STARVE_SECS;
      walking = null;
      if (bagFood().length) info("😫🍞", "I'm STARVING!", `Eat something in ${STARVE_SECS} seconds, or it's game over!`, "Open my backpack 🎒", openBag);
      else info("😫🍞", "I'm STARVING!", `Eat something in ${STARVE_SECS} seconds, or it's game over! ${noFood}`, "Hurry! 🏃");
    }
    if (s.hunger > 0) starveLeft = null;
  }
  let last = 0, saveTimer = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  function tick(dt) {
    if (paused()) return;
    stepWalk(dt);
    stepNpcs(dt);
    passTime(dt * GAME_MIN_PER_SEC);
    renderHud();
    checkNeeds();
    if (starveLeft !== null && s.hunger <= 0 && $("infoScreen").hidden) {
      starveLeft -= dt;
      say(`😫 STARVING! Eat something in ${Math.ceil(Math.max(0, starveLeft))} seconds! Click 🎒 Backpack, or go to the 🥫 Food Bank!`);
      if (starveLeft <= 0) { gameOver(); return; }
    }
    saveTimer += dt;
    if (saveTimer > 10) { saveTimer = 0; save(); }
  }

  // ---------- Sleeping ----------
  function fallAsleepHere() {
    walking = null;
    closeAll();
    sleep("street");
  }
  function sleep(where) {
    asleep = true;
    renderMe();
    const parent = viewEl();
    const pos = posNow();
    const z = document.createElement("div");
    z.className = "zzz";
    z.textContent = "💤";
    z.style.left = `${pos.x + 2}%`;
    z.style.top = `${pos.y - 8}%`;
    parent.appendChild(z);
    parent.classList.add("night");
    if (where === "street") say("😴 You're SO tired... you lie down right here and fall asleep. 💤");
    setTimeout(() => {
      z.remove();
      wakeUp(where);
    }, 2500);
  }
  function wakeUp(where) {
    s.day++;
    s.time = WAKE_UP;
    lateWarned = false;
    goingToFoodBank = false;
    s.energy = where === "home" ? 100 : where === "bench" ? 75 : 60;
    s.hunger = Math.max(10, s.hunger - 20);
    if (where === "street") s.clean = Math.max(0, s.clean - 20);
    // Overnight, people dropped more cans around town
    for (let i = 0; i < BLOCKS.length; i++) addCanSomewhere(i);
    // Your businesses made money while you slept!
    let income = 0;
    const lines = [];
    for (const b of BUSINESSES) {
      const n = s.biz[b.id] || 0;
      if (n) { income += n * b.income; lines.push(`${b.icon}×${n} +💰${n * b.income}`); }
    }
    if (s.title) { const t = TITLES[s.title]; income += t.salary; lines.push(`${t.icon} ${t.name} pay +💰${t.salary}`); }
    asleep = false;
    if (income) s.coins += income;
    if (view === "street") buildStreet(); else if (view === "house") buildHouse(); else renderMap();
    renderMe(); renderHud(); save();
    say("☀️ Good morning! A new day to make money!");
    const wokeText = {
      home: "You slept in your cozy bed. You feel great! 😊",
      bench: "You woke up on the park bench. Your back is a little sore. 🥱",
      street: "You woke up on the sidewalk... Brrr! Next time, find a better place to sleep. 🥶",
    }[where];
    info("☀️", `Day ${s.day}`, wokeText + (income ? ` Your businesses made money while you slept: ${lines.join(", ")}!` : ""), "Let's go! 💪", checkWin);
  }

  // ---------- Inside your home: a little map with rooms, like the Potion Shop houses ----------
  const KITCHEN = "repeating-conic-gradient(#f4ecdc 0 25%, #e3d6bd 0 50%) 0 0 / 28px 28px";
  const TILES = "repeating-linear-gradient(90deg, #d8eef5 0 14px, #c7e4ee 14px 28px)";
  const HOUSE_MAPS = {
    apartment: {
      rooms: [
        { name: "Kitchen", x: 0, y: 0, w: 40, h: 50, floor: KITCHEN },
        { name: "Living room", x: 40, y: 0, w: 60, h: 50, floor: "#d7b98e" },
        { name: "Bedroom", x: 0, y: 50, w: 64, h: 50, floor: "#cbb6e4" },
        { name: "Bathroom", x: 64, y: 50, w: 36, h: 50, floor: TILES },
      ],
      things: [
        { icon: "🍳", name: "Stove", x: 14, y: 24, act: "cook" },
        { icon: "🛋️", x: 62, y: 30, say: ["You flop onto your little sofa. Ahhh! 😌", "Comfy! This is way better than a park bench."] },
        { icon: "📺", x: 88, y: 16, say: ["You watch a funny cartoon! 📺😂", "The news says: \"Someone went from a park bench to an apartment!\" 😎"] },
        { icon: "🛏️", name: "Bed", x: 22, y: 74, act: "bed" },
        { icon: "🛁", name: "Bath", x: 82, y: 78, act: "bath" },
      ],
    },
    house: {
      rooms: [
        { name: "Kitchen", x: 0, y: 0, w: 34, h: 50, floor: KITCHEN },
        { name: "Living room", x: 34, y: 0, w: 66, h: 50, floor: "#d7b98e" },
        { name: "Bedroom", x: 0, y: 50, w: 40, h: 50, floor: "#cbb6e4" },
        { name: "Playroom", x: 40, y: 50, w: 30, h: 50, floor: "#bfe3b4" },
        { name: "Bathroom", x: 70, y: 50, w: 30, h: 50, floor: TILES },
      ],
      things: [
        { icon: "🍳", name: "Stove", x: 12, y: 22, act: "cook" },
        { icon: "🍽️", x: 26, y: 36, say: ["You set the table like a fancy restaurant. 🍽️✨"] },
        { icon: "🛋️", x: 56, y: 30, say: ["You and your big comfy sofa. Best friends! 🛋️💛"] },
        { icon: "📺", x: 90, y: 14, say: ["You watch your favorite show on the big TV! 📺", "Cartoon time! 😆"] },
        { icon: "🌵", x: 42, y: 12, say: ["You water your cactus. 💧 It looks happy!"] },
        { icon: "🛏️", name: "Bed", x: 18, y: 74, act: "bed" },
        { icon: "🎮", x: 55, y: 70, say: ["You play a video game and beat level 10! 🎮🏆", "You build a castle in your video game! 🏰"] },
        { icon: "🧸", x: 62, y: 86, say: ["You give your teddy bear a big hug! 🧸💛"] },
        { icon: "🛁", name: "Bath", x: 86, y: 78, act: "bath" },
      ],
    },
    mansion: {
      rooms: [
        { name: "Giant kitchen", x: 0, y: 0, w: 30, h: 50, floor: KITCHEN },
        { name: "Living room", x: 30, y: 0, w: 40, h: 50, floor: "#d7b98e" },
        { name: "Office", x: 70, y: 0, w: 30, h: 50, floor: "#c9d3e8" },
        { name: "Bedroom", x: 0, y: 50, w: 30, h: 50, floor: "#cbb6e4" },
        { name: "Pool", x: 30, y: 50, w: 40, h: 50, floor: "repeating-linear-gradient(0deg, #7fd3f0 0 12px, #6cc6e8 12px 24px)" },
        { name: "Spa bathroom", x: 70, y: 50, w: 30, h: 50, floor: TILES },
      ],
      things: [
        { icon: "🍱", name: "Giant fridge", x: 10, y: 22, act: "fridge" },
        { icon: "🍳", name: "Stove", x: 22, y: 38, act: "cook" },
        { icon: "🛋️", x: 44, y: 30, say: ["Your sofa is SO big that ten friends could sit on it! 🛋️"] },
        { icon: "📺", x: 60, y: 12, say: ["A TV as big as a wall! 📺 It's like being at the movies! 🍿"] },
        { icon: "🎹", x: 62, y: 38, say: ["You play a song on your grand piano! 🎶", "Plink plonk! 🎹 Beautiful!"] },
        { icon: "💻", name: "Computer", x: 86, y: 24, act: "computer" },
        { icon: "🛏️", name: "Giant bed", x: 15, y: 74, act: "bed" },
        { icon: "🏊", x: 50, y: 74, say: ["Splash! You swim in your own pool! 🏊💦", "You do a cannonball into the pool! 💦💦💦"] },
        { icon: "🛁", name: "Bath", x: 86, y: 78, act: "bath" },
      ],
    },
  };
  function buildHouse() {
    const hm = HOUSE_MAPS[s.home];
    const h = HOMES.find((x) => x.id === s.home);
    house.innerHTML = "";
    for (const r of hm.rooms) {
      const d = document.createElement("div");
      d.className = "hroom";
      d.style.cssText = `left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;background:${r.floor}`;
      d.innerHTML = `<small>${r.name}</small>`;
      house.appendChild(d);
    }
    hm.things.forEach((t, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thing";
      b.dataset.thing = i;
      b.style.left = `${t.x}%`;
      b.style.top = `${t.y}%`;
      b.innerHTML = `${t.icon}${t.name ? `<small>${t.name}</small>` : ""}`;
      house.appendChild(b);
    });
    const door = document.createElement("button");
    door.type = "button";
    door.className = "thing door";
    door.dataset.thing = "door";
    door.innerHTML = "🚪<small>Go outside</small>";
    door.style.left = "50%";
    door.style.top = "95%";
    house.appendChild(door);
    // A hook by the door where you can leave your backpack
    const hook = document.createElement("button");
    hook.type = "button";
    hook.className = "thing door";
    hook.dataset.thing = "bag";
    hook.innerHTML = `🎒<small>${s.bagAtHome ? "Take my backpack" : "Leave backpack here"}</small>`;
    hook.style.left = "30%";
    hook.style.top = "93%";
    hook.style.opacity = s.bagAtHome ? "1" : "0.75";
    house.appendChild(hook);
    const name = document.createElement("div");
    name.className = "block-name";
    name.textContent = `${h.icon} My ${h.name}`;
    house.appendChild(name);
    houseGoal = makeGoal(house);
    houseMe = document.createElement("div");
    houseMe.className = "me";
    house.appendChild(houseMe);
    renderMe();
  }
  function enterHouse() {
    view = "house";
    walking = null;
    homePos = { x: 50, y: 86 };
    town.hidden = true;
    street.hidden = true;
    house.hidden = false;
    buildHouse();
    renderHud();
    say("🏠 Home sweet home! Click anywhere to walk, and click things to use them.");
  }
  function leaveHouse() {
    enterBlock(blockOf("home"), "home");
  }
  house.addEventListener("click", (e) => {
    if (paused()) return;
    const t = e.target.closest(".thing");
    if (t) {
      if (t.dataset.thing === "door") { walkTo(50, 92, leaveHouse); return; }
      if (t.dataset.thing === "bag") {
        walkTo(30, 88, () => {
          s.bagAtHome = !s.bagAtHome;
          save(); buildHouse(); renderHud();
          say(s.bagAtHome
            ? "🎒 You hang your backpack on the hook. Your arms feel free! But now you can't carry cans or groceries until you take it again."
            : "🎒 You put your backpack back on. Ready to go!");
        });
        return;
      }
      const thing = HOUSE_MAPS[s.home].things[Number(t.dataset.thing)];
      walkTo(thing.x, thing.y + 8, () => useThing(thing, t));
      return;
    }
    const p = pointIn(house, e);
    walkTo(p.x, p.y, null);
  });
  function useThing(t, el) {
    el.classList.remove("playing");
    void el.offsetWidth;
    el.classList.add("playing");
    const late = s.time >= LATE;
    if (t.say) { say(pick(t.say)); return; }
    if (t.act === "bed") {
      if (s.time < 19 * 60 && s.energy > 40) { say("😊 You're not sleepy yet! You can sleep in the evening (after 7 pm) or when you're tired."); return; }
      say("🛏️ You snuggle into your cozy bed... Good night! 💤");
      sleep("home");
    } else if (t.act === "bath") {
      s.clean = 100; renderHud();
      say("🛁 Bubbles everywhere! You're squeaky clean! ✨");
    } else if (t.act === "cook") {
      if (bagFood().length) { say("🍳 What should I cook? Pick some food from your backpack!"); openBag(); }
      else say("🍳 There's nothing to cook! Buy food at the 🛒 Grocery Store and it goes in your backpack.");
    } else if (t.act === "fridge") {
      if (s.hunger >= 98) { say("😋 You're already full! The fridge will wait for you."); return; }
      fillUp(100, 6); renderHud(); save();
      say(pick(["🍱 Your giant fridge has everything! You make a huge sandwich tower! 🥪", "🍱 Ice cream, fruit and pancakes for lunch! 😋"]) + " (Free! Not hungry for 6 hours.)");
    } else if (t.act === "computer") {
      // Your best job that can be done from home
      const job = myJobs().filter((j) => j.home).sort((a, b) => b.home - a.home)[0];
      if (!job) { say("💻 Get a really good job (👩‍⚕️ Doctor, 🎸 Rock Star or 🏦 Banker) and you can work from home on this computer!"); return; }
      if (late) { say("🌙 Too late to work. Time for bed!"); return; }
      if (s.energy < 10) { say("🥱 Too tired to work. Get some sleep!"); return; }
      passTime(120);
      s.energy = Math.max(1, s.energy - 8);
      s.coins += job.home;
      renderHud(); save();
      say(`💻 ${job.homeSay} You earned 💰${job.home}! 😎`);
      checkWin();
    }
  }

  // ---------- Places ----------
  let openPlaceId = null;
  function closeAll() {
    for (const id of ["placeScreen", "workScreen", "infoScreen", "bagScreen"]) $(id).hidden = true;
    stopWork(true);
    openPlaceId = null;
  }
  $("leaveBtn").addEventListener("click", () => { $("placeScreen").hidden = true; openPlaceId = null; renderHud(); });

  function openPlace(id) {
    openPlaceId = id;
    renderPlace("");
    $("placeScreen").hidden = false;
  }
  function row(box, icon, title, sub, label, enabled, act) {
    const r = document.createElement("div");
    r.className = "row";
    r.innerHTML = `<span class="ico">${icon}</span><span class="txt"><b>${title}</b>${sub || ""}</span>`;
    if (label) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !enabled;
      b.addEventListener("click", act);
      r.appendChild(b);
    }
    box.appendChild(r);
  }
  function title(box, text) {
    const t = document.createElement("div");
    t.className = "section-title";
    t.textContent = text;
    box.appendChild(t);
  }
  function refreshBuildings() { if (view === "street") buildStreet(); renderMap(); }
  function renderPlace(note) {
    const p = PLACES[openPlaceId];
    const rows = $("placeRows");
    rows.innerHTML = "";
    $("placeArt").textContent = p.icon;
    $("placeTitle").textContent = p.name;
    let text = "";
    const job = JOBS.find((j) => j.place === openPlaceId);
    const late = s.time >= LATE;
    const id = openPlaceId;

    if (id === "park") {
      text = "Birds are singing. There's a playground, and an old bench where you can sleep for free.";
      title(rows, "🎠 Playground (free!)");
      const PLAY = [
        ["🎠", "Swings", "Swing", ["Wheee! You swing so high you can almost touch the clouds! ☁️", "Back and forth, back and forth... the wind feels so nice! 🍃"]],
        ["🏰", "Slide", "Slide", ["Zoooom! Down the big twisty slide! 😆", "You slide down so fast your hair flies up! 💨"]],
        ["⛱️", "Sandbox", "Dig", ["You build a giant sand castle with a moat! 🏰", "You dig and dig... and find a shiny button! 🔘"]],
        ["🧗", "Climbing bars", "Climb", ["You climb all the way to the top! You can see the whole park! 👀", "You hang upside down like a bat! 🦇"]],
      ];
      for (const [icon, name, btn, lines] of PLAY) {
        row(rows, icon, name, "Play for 15 minutes", `${btn} 😄`, !late, () => {
          passTime(15);
          s.energy = Math.max(1, s.energy - 2);
          renderHud();
          renderPlace(pick(lines));
        });
      }
      if (late && !note) note = "🌙 It's too dark to play. Time for bed!";
      title(rows, "🌳 Bench");
      row(rows, "🌳", "Sleep on the bench", "Free, but not very comfy. You'll wake up with 75% energy.", "Sleep 💤", true, () => tryToSleep("bench"));
    } else if (id === "foodbank") {
      text = "Kind volunteers give free food to people who need it. 💛";
      const hungry = s.hunger < 50;
      row(rows, "🍲", "A warm bowl of soup", "Free when you're hungry", "Eat 😋", hungry, () => {
        s.hunger = Math.max(s.hunger, 70);
        goingToFoodBank = false;
        renderHud();
        renderPlace("😋 Yummy! The volunteer smiles: \"Come back anytime you need help!\"");
      });
      if (!hungry && !note) note = "You're not hungry right now. Come back when your tummy rumbles!";
      if (goingToFoodBank) {
        s.hunger = 70;
        goingToFoodBank = false;
        renderHud();
        note = "😋 The volunteer gives you a warm bowl of soup. You feel much better! Thank you, Food Bank! 💛";
      }
    } else if (id === "recycle") {
      text = `Bring cans you find on the street corners! Every can is 💰${money(CAN_PRICE)}.`;
      row(rows, "🥫", `Turn in your cans (you have ${s.cans})`, `💰${money(s.cans * CAN_PRICE)} for all of them`, "Recycle ♻️", s.cans > 0 && bagWithMe(), () => {
        const got = s.cans * CAN_PRICE;
        const n = s.cans;
        s.coins += got;
        s.cans = 0;
        renderHud(); save();
        renderPlace(`♻️ Clink clank! You recycled ${n} can${n === 1 ? "" : "s"} and got 💰${money(got)}!`);
        checkWin();
      });
      if (!bagWithMe() && !note) note = "🎒 Your cans are in your backpack, and it's at home! Go get it first.";
      if (!s.cans && !note) note = "Your backpack has no cans. Look on the street corners! People toss cans there. 🚶🥫";
    } else if (id === "jobs") {
      text = `Choose your jobs! You can have up to ${MAX_JOBS} jobs at the same time. Go to each workplace on the map to work. Better jobs pay more.`;
      const full = (s.jobs || []).length >= MAX_JOBS;
      for (const j of JOBS) {
        const need = [];
        if (j.needs.bike) need.push(s.bike ? "🚲 bike ✓" : "needs a 🚲 bike");
        if (j.needs.school) need.push(s.school >= j.needs.school ? `🎓 class ${j.needs.school} ✓` : `needs 🎓 class ${j.needs.school}`);
        if (j.needs.clean) need.push("must be clean 🧼");
        if (j.home) need.push("💻 can work from a mansion");
        const okNeeds = (!j.needs.bike || s.bike) && (!j.needs.school || s.school >= j.needs.school);
        const mine = hasJob(j.id);
        const where = BLOCKS[blockOf(j.place)].name;
        row(rows, j.icon, j.name, `💰${j.pay} each · at the ${PLACES[j.place].icon} ${PLACES[j.place].name} (${where})${need.length ? ` · ${need.join(", ")}` : ""}`,
          mine ? "Quit 👋" : "Get job", mine || (okNeeds && !full), () => {
            if (mine) {
              s.jobs = s.jobs.filter((x) => x !== j.id);
              refreshBuildings(); renderHud(); save();
              renderPlace(`👋 You quit being a ${j.name}.`);
              return;
            }
            s.jobs = [...(s.jobs || []), j.id];
            refreshBuildings(); renderHud(); save();
            renderPlace(`🎉 You're a ${j.name} now! Go to the ${PLACES[j.place].icon} ${PLACES[j.place].name} on ${where} to work.`);
          });
      }
      if (full && !note) note = `You already have ${MAX_JOBS} jobs! Quit one if you want a different job.`;
    } else if (id === "hall") {
      text = "The 🏆 Richest list! Everything you own counts: coins, homes, rides and businesses.";
      // If you became the Mayor or the Queen, the old one isn't anymore!
      const list = RICH_PEOPLE.map((x) => {
        const p = { ...x };
        if (s.title === "mayor" && x.name === "Mayor Max") p.name = "Old Mayor Max";
        if (s.title === "queen" && x.name === "Queen Ruby") p.name = "Old Queen Ruby";
        return p;
      });
      // Show what you are, like "👩‍⚕️ Doctor (You)"
      const best = bestJob();
      const t = s.title ? TITLES[s.title] : null;
      const whatAmI = t ? t.name : best ? best.name : s.home ? "Home Owner" : "Homeless Kid";
      list.push({ icon: t ? t.icon : best ? best.icon : "🧒", name: `${whatAmI} (You)`, worth: worth(), you: true });
      list.sort((a, b) => b.worth - a.worth);
      list.forEach((x, i) => {
        const r = document.createElement("div");
        r.className = "rich-row" + (x.you ? " you" : "");
        r.innerHTML = `<span class="n">#${i + 1}</span><span>${x.icon} ${x.name}</span><span class="w">💰${money(Math.floor(x.worth * 100) / 100)}</span>`;
        rows.appendChild(r);
      });
      // Rich enough? Become the Mayor or even the Queen!
      title(rows, "👑 Become a leader");
      for (const [id, tt] of Object.entries(TITLES)) {
        const have = s.title === id || (id === "mayor" && s.title === "queen");
        row(rows, tt.icon, `Become the ${tt.name}`, have ? "You are! ✓" : `When everything you own is worth 💰${tt.worth.toLocaleString()} · get 💰${tt.salary} every morning`,
          have ? "Yes! ✓" : "Become it", !have && worth() >= tt.worth, () => {
            s.title = id;
            renderHud(); save();
            renderPlace(tt.cheer);
          });
      }
    } else if (id === "school") {
      text = "Learn new things to get better jobs! Each class takes 2 hours.";
      for (const c of CLASSES) {
        const done = s.school >= c.n;
        const next = s.school === c.n - 1;
        row(rows, done ? "🎓" : "📚", c.name, done ? "Passed ✓" : `💰${c.cost}${next ? "" : " · finish the class before first"}`,
          done ? "Done ✓" : `Take it 💰${c.cost}`, !done && next && s.coins >= c.cost && !late, () => {
            s.coins -= c.cost;
            s.school = c.n;
            passTime(120);
            s.energy = Math.max(1, s.energy - 10);
            renderHud(); save();
            renderPlace(`🎓 You passed ${c.name}! ${c.n === 1 ? "Now you can be a 👩‍🍳 Chef!" : c.n === 3 ? "Now you can be a 👩‍⚕️ Doctor!" : "Keep going!"}`);
          });
      }
      if (late) note = note || "🌙 School is closed at night.";
    } else if (id === "estate") {
      text = "Buy a home to sleep in a real bed, and buy businesses that make money for you every morning!";
      title(rows, "🏠 Homes (your old home is sold for half price)");
      const cur = HOMES.findIndex((h) => h.id === s.home);
      HOMES.forEach((h, i) => {
        const sellBack = cur >= 0 ? Math.floor(HOMES[cur].cost / 2) : 0;
        const price = h.cost - sellBack;
        const owned = i === cur;
        row(rows, h.icon, h.name, owned ? "Your home ✓" : i < cur ? "Smaller than your home" : `💰${h.cost}${sellBack ? ` (you pay 💰${price} after selling your old home)` : ""}`,
          owned ? "Mine ✓" : "Buy", !owned && i > cur && s.coins >= price, () => {
            s.coins -= price;
            if (!s.home) s.clean = 100; // your first home: a nice first bath!
            s.home = h.id;
            refreshBuildings(); renderHud(); save();
            renderPlace(`🎉 You bought a ${h.icon} ${h.name}! It's on Home Lane. No more sleeping outside!`);
            checkWin();
          });
      });
      title(rows, "🏪 Businesses (they make money every morning)");
      for (const b of BUSINESSES) {
        const n = s.biz[b.id] || 0;
        row(rows, b.icon, b.name, `💰${b.cost} · makes 💰${b.income} every morning${n ? ` · you have ${n}` : ""}`, "Buy", s.coins >= b.cost, () => {
          s.coins -= b.cost;
          s.biz[b.id] = n + 1;
          renderHud(); save();
          renderPlace(`🎉 You own a ${b.icon} ${b.name}! It makes 💰${b.income} every morning.`);
          checkWin();
        });
      }
    } else if (id === "bath") {
      text = "Nobody minds if you're a bit stinky. But the café, the restaurant and the hospital only let you work if you're clean!";
      row(rows, "🚿", "Hot shower", "💰3 · 🧼 all clean", "Shower 💰3", s.coins >= 3 && s.clean < 95, () => {
        s.coins -= 3; s.clean = 100; renderHud();
        renderPlace("🚿 Splish splash! You're squeaky clean! ✨");
      });
      if (s.clean >= 95 && !note) note = "You're already squeaky clean! ✨";
    } else if (id === "store") {
      text = "Food to fill your tummy, and rides to get around faster. Better food keeps you full for longer!";
      title(rows, "🍞 Food");
      for (const f of FOODS) {
        const have = s.bag[f.id] || 0;
        row(rows, f.icon, f.name, `💰${f.cost} · 🍞 +${f.fill} · 😋 not hungry for ${f.hours} hour${f.hours === 1 ? "" : "s"}${have ? ` · 🎒 you have ${have}` : ""}`, `Buy 💰${f.cost}`, s.coins >= f.cost && bagWithMe(), () => {
          s.coins -= f.cost;
          s.bag[f.id] = have + 1;
          renderHud(); save();
          renderPlace(`🎒 You put the ${f.icon} ${f.name} in your backpack. Click 🎒 at the top to eat it anytime!`);
        });
      }
      if (!bagWithMe() && !note) note = "🎒 Your backpack is at home! You can't carry any groceries. Go home and get it first.";
      title(rows, "🚲 Rides");
      for (const r of RIDES) {
        const has = s[r.id];
        row(rows, r.icon, r.name, has ? "You have it ✓" : `💰${r.cost} · ${r.note}`, has ? "Mine ✓" : "Buy", !has && s.coins >= r.cost, () => {
          s.coins -= r.cost; s[r.id] = true; renderHud(); renderMe(); save();
          renderPlace(`🎉 You got a ${r.icon} ${r.name}! Vroom!`);
          checkWin();
        });
      }
    } else if (id === "home") {
      // (Once you own a home, you walk right inside instead of seeing this)
      text = "An empty lot. Buy a home at the 🏦 Homes & Business office on School Hill, and it will be built right here!";
    }

    // Workplaces: anyone can visit as a customer, and if it's your job, you can work here too
    const visits = VISITS[id];
    if (visits) {
      text = text || visits.text;
      title(rows, "🙋 Visit");
      for (const v of visits.list) {
        const can = s.coins >= v.cost && (!v.needs || v.needs());
        const missing = v.needs && !v.needs() ? v.why || " · you don't have one yet!" : "";
        row(rows, v.icon, v.name, `💰${v.cost} · ${v.what}${missing}`, `${v.button} 💰${v.cost}`, can, () => {
          s.coins -= v.cost;
          const said = v.act();
          renderHud(); save();
          renderPlace(said);
        });
      }
    }
    if (job) {
      title(rows, "💼 Work");
      if (!hasJob(job.id)) {
        row(rows, job.icon, job.name, "Want to work here? Choose this job at the 💼 Job Center in Downtown.", null);
      } else {
        row(rows, job.icon, `Work a shift as a ${job.name}`, `💰${job.pay} each · 30 seconds (2 hours)`, "Start work 💪", !late, () => tryWork(job));
        if (late) note = note || "🌙 It's too late to work. Go to sleep and come back tomorrow!";
      }
    }
    $("placeText").textContent = text;
    $("placeNote").textContent = note;
  }

  // Things you can do as a customer at each workplace
  const HEADLINES = [
    "🐶 Dog wins town pie-eating contest!", "🎈 Giant balloon floats over the school!", "👑 Queen Ruby buys a golden bathtub!",
    "🍋 Kid's lemonade stand sells 100 cups!", "🐦 Birds build a nest on the Mayor's hat!", "🚌 Bus driver Ben sings to every passenger!",
  ];
  const fillUp = (fill, hours) => {
    s.hunger = Math.min(100, s.hunger + fill);
    s.fullUntil = Math.max(s.fullUntil || 0, now() + hours * 60);
  };
  const VISITS = {
    hospital: { text: "The doctors and nurses keep everyone in town healthy. 🩺", list: [
      { icon: "🩺", name: "Checkup", cost: 20, what: "the doctor checks that you're healthy and gives you vitamins 💊 (😴 +25)", button: "Checkup",
        act: () => { s.energy = Math.min(100, s.energy + 25); return `🩺 "Say ahh!" The doctor listens to your heart: boom boom. "You're super healthy! Here's a vitamin and a sticker! ⭐"`; } },
    ] },
    restaurant: { text: "Yummy smells everywhere! Sit down and order a meal. 🍽️", list: [
      { icon: "🍝", name: "Spaghetti dinner", cost: 15, what: "🍞 +90 · 😋 not hungry for 5 hours", button: "Order",
        act: () => { fillUp(90, 5); return "🍝 Slurp! The spaghetti is delicious. You're so full! 😋"; } },
      { icon: "🍕", name: "Pizza slice", cost: 6, what: "🍞 +40 · 😋 not hungry for 2 hours", button: "Order",
        act: () => { fillUp(40, 2); return "🍕 Cheesy! Yum yum! 😋"; } },
    ] },
    cafe: { text: "A cozy café that smells like cookies and hot cocoa. ☕", list: [
      { icon: "☕", name: "Hot cocoa", cost: 4, what: "warms you up and wakes you up (😴 +20)", button: "Buy",
        act: () => { s.energy = Math.min(100, s.energy + 20); return "☕ Mmm, warm and chocolatey! You feel awake! ✨"; } },
      { icon: "🍩", name: "Donut", cost: 3, what: "🍞 +20 · 😋 not hungry for 1 hour", button: "Buy",
        act: () => { fillUp(20, 1); return "🍩 Sprinkles! Yummy! 😋"; } },
    ] },
    carwash: { text: "Soapy bubbles and big spinning brushes! 🧼", list: [
      { icon: "🚗", name: "Wash my car", cost: 10, what: "make your car sparkly", button: "Wash", needs: () => s.car,
        act: () => "🚗💦 Swish swish! Your car is sparkly clean! ✨" },
      { icon: "🚲", name: "Wash my bike", cost: 2, what: "make your bike shiny", button: "Wash", needs: () => s.bike,
        act: () => "🚲💦 Your bike is shiny like new! ✨" },
    ] },
    bakery: { text: "Warm bread and sweet treats! It smells SO good in here. 🥐", list: [
      { icon: "🥐", name: "Croissant", cost: 3, what: "🍞 +25 · 😋 not hungry for 1 hour", button: "Buy",
        act: () => { fillUp(25, 1); return "🥐 Flaky and buttery! Yum! 😋"; } },
      { icon: "🎂", name: "Slice of cake", cost: 5, what: "🍞 +30 · 😋 not hungry for 2 hours", button: "Buy",
        act: () => { fillUp(30, 2); return "🎂 Chocolate cake with sprinkles! 😋"; } },
    ] },
    police: { text: "The police officers keep the town safe. 🚓", list: [
      { icon: "🚓", name: "Sit in a police car", cost: 0, what: "free! Push the siren button", button: "Try it",
        act: () => "🚓 Wee-woo wee-woo! The officer lets you turn on the siren! 🚨😆" },
    ] },
    bus: { text: "Buses go all around town from here. 🚌", list: [
      { icon: "🚌", name: "Bus tour of the town", cost: 2, what: "look out the window at the whole town (30 minutes)", button: "Ride",
        act: () => { passTime(30); return "🚌 You ride all around town! You wave at people from the window. 👋"; } },
    ] },
    petshop: { text: "Puppies, kittens, food and toys! 🐾 Pets need food and playtime every day.", list: [
      ...Object.entries(PETS).map(([id, p]) => ({
        icon: p.icon, name: `Adopt a ${p.name}`, cost: p.cost, what: `your own pet ${p.name}! It follows you everywhere`, button: "Adopt",
        needs: () => !s.pet, why: " · you already have a pet!",
        act: () => { s.pet = { type: id, food: 100, fun: 100 }; renderMe(); return `${p.icon} ${p.sound} You adopted a ${p.name}! It's so happy to be your best friend! 💛 Don't forget to buy ${p.name} food!`; },
      })),
      ...PET_ITEMS.map((it) => ({
        icon: it.icon, name: it.name, cost: it.cost, what: it.pet ? `food for a ${it.pet} · goes in your 🎒 backpack` : "your pet loves to play with it! · goes in your 🎒 backpack",
        button: "Buy", needs: bagWithMe, why: " · your backpack is at home!",
        act: () => { s.bag[it.id] = (s.bag[it.id] || 0) + 1; return `🎒 You put the ${it.icon} ${it.name} in your backpack.`; },
      })),
    ] },
    stage: { text: "Rock concerts happen here every night! 🎤", list: [
      { icon: "🎟️", name: "Concert ticket", cost: 15, what: "watch a rock concert (1 hour, 😴 +10 from all the fun!)", button: "Watch",
        act: () => { passTime(60); s.energy = Math.min(100, s.energy + 10); return "🎸🤘 The music is SO loud and SO fun! You dance the whole time!"; } },
    ] },
    news: { text: "This is where the town newspaper is made. 📰", list: [
      { icon: "📰", name: "Buy a newspaper", cost: 1, what: "read today's news", button: "Buy",
        act: () => `📰 Today's news: "${pick(HEADLINES)}"` },
    ] },
  };

  function tryToSleep(where) {
    if (s.time < 19 * 60 && s.energy > 40) {
      renderPlace("😊 You're not sleepy yet! You can sleep in the evening (after 7 pm) or when you're tired.");
      return;
    }
    $("placeScreen").hidden = true;
    openPlaceId = null;
    sleep(where);
  }

  // ---------- Working ----------
  let work = null;
  function tryWork(job) {
    if (job.needs.clean && s.clean < 40) {
      renderPlace(`😬 "Sorry, you're too stinky to work here!" Take a shower at the 🚿 Bath House on Clean Street first (💰3).`);
      return;
    }
    if (s.energy < 15) { renderPlace("🥱 You're too tired to work. Get some sleep first!"); return; }
    if (s.hunger < 10) { renderPlace("😫 You're too hungry to work. Eat something first!"); return; }
    $("placeScreen").hidden = true;
    startWork(job);
  }
  function startWork(job) {
    work = { job, left: SHIFT_SECS, pay: 0, timers: [] };
    $("workTitle").textContent = `${job.icon} ${job.name}`;
    $("workHelp").textContent = job.help;
    $("workPay").textContent = "💰 0";
    const area = $("workArea");
    area.innerHTML = "";
    if (job.kind === "tap") {
      area.innerHTML = `<div class="work-field" id="field"><div class="bg">${job.bg}</div></div>`;
      spawnTarget();
    } else {
      area.innerHTML = `<div class="order" id="order"></div><div class="picks" id="picks"></div>`;
      nextOrder();
    }
    $("workScreen").hidden = false;
    work.timers.push(setInterval(() => {
      if (!work) return;
      work.left -= 0.1;
      $("workTime").textContent = `⏱️ ${Math.ceil(Math.max(0, work.left))}`;
      $("workBar").style.width = `${Math.max(0, work.left / SHIFT_SECS) * 100}%`;
      if (work.left <= 0) stopWork(false);
    }, 100));
  }
  function addPay(n) {
    work.pay += n;
    $("workPay").textContent = `💰 ${work.pay}`;
  }
  function spawnTarget() {
    if (!work) return;
    const field = $("field");
    const t = document.createElement("button");
    t.type = "button";
    t.className = "target";
    t.textContent = work.job.target;
    t.style.left = `${10 + Math.random() * 80}%`;
    t.style.top = `${12 + Math.random() * 76}%`;
    t.addEventListener("click", () => {
      if (!work) return;
      addPay(work.job.pay);
      t.textContent = "✨";
      t.disabled = true;
      setTimeout(() => t.remove(), 250);
    });
    field.appendChild(t);
    setTimeout(() => t.remove(), 2300);
    work.timers.push(setTimeout(spawnTarget, 650 + Math.random() * 400));
  }
  function nextOrder() {
    if (!work) return;
    const job = work.job;
    let ans, options, ask = job.ask;
    if (job.kind === "math") {
      // The teacher answers math questions from the students
      const x = 1 + Math.floor(Math.random() * 9), y = 1 + Math.floor(Math.random() * 9);
      const plus = Math.random() < 0.6;
      const big = Math.max(x, y), small = Math.min(x, y);
      const right = plus ? x + y : big - small;
      const nums = new Set([right]);
      while (nums.size < 4) { const n = right + Math.floor(Math.random() * 7) - 3; if (n >= 0) nums.add(n); }
      const list = [...nums].map((n) => [String(n)]);
      ans = list[0];
      options = shuffle(list);
      const q = plus ? `${x} + ${y}` : `${big} − ${small}`;
      ask = () => `"Teacher, what is ${q}?"`;
    } else {
      ans = pick(job.answers);
      options = shuffle([ans, ...shuffle(job.answers.filter((a) => a !== ans)).slice(0, 3)]);
    }
    const who = job.kind === "math" ? pick(["👧", "👦", "🧒"]) : pick(["👧", "👦", "👩", "👨", "👵", "👴", "🧑", "👱‍♀️"]);
    $("order").textContent = `${who} ${ask(ans)}`;
    const box = $("picks");
    box.innerHTML = "";
    let answered = false;
    for (const o of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = job.labels ? `${o[0]}<small>${o[1]}</small>` : o[0];
      b.addEventListener("click", () => {
        if (!work || answered) return;
        if (o === ans) {
          answered = true;
          b.classList.add("right");
          addPay(job.pay);
          $("order").textContent = `${who} "Thank you! 😊"`;
          work.timers.push(setTimeout(nextOrder, 600));
        } else {
          b.classList.add("wrong");
          b.disabled = true;
          $("order").textContent = `${who} "Hmm, that's not right!" ${ask(ans)}`;
        }
      });
      box.appendChild(b);
    }
  }
  function stopWork(silent) {
    if (!work) return;
    const w = work;
    work = null;
    for (const t of w.timers) { clearInterval(t); clearTimeout(t); }
    $("workScreen").hidden = true;
    if (silent) return;
    // Working takes time and makes you hungry, tired and a bit dirty
    const part = Math.max(0.2, (SHIFT_SECS - Math.max(0, w.left)) / SHIFT_SECS);
    passTime(Math.round(SHIFT_MINUTES * part));
    s.energy = Math.max(1, s.energy - 12 * part);
    s.hunger = Math.max(1, s.hunger - 8 * part);
    s.clean = Math.max(0, s.clean - 4 * part);
    s.coins += w.pay;
    renderHud();
    save();
    info(w.job.icon, "Shift done!", `You earned 💰${w.pay} as a ${w.job.name}. ${w.pay >= 30 ? "Great job! 🌟" : "Good work! 👍"}`, "OK", () => { openPlace(w.job.place); checkWin(); });
  }
  $("stopWorkBtn").addEventListener("click", () => stopWork(false));

  // ---------- Winning ----------
  function checkWin() {
    if (s.wonAt || rank() !== 1) return;
    s.wonAt = s.day;
    save();
    info("👑💰🏆", "You're the RICHEST in town!",
      `On day ${s.day}, you went from a park bench to the #1 richest person in town! Everyone is cheering! 🎉 You can keep playing and get even richer.`, "Hooray! 🎉");
  }

  // ---------- Start ----------
  function begin(state) {
    s = state;
    if (typeof s.cans !== "number") s.cans = 0;
    if (!s.bag) s.bag = {};
    if (typeof s.block !== "number") { s.block = 0; s.x = 22; s.y = 42; }
    // Old saves had just one job; now you can have up to 3
    if (!Array.isArray(s.jobs)) s.jobs = s.job && s.job !== "cans" ? [s.job] : [];
    delete s.job;
    playing = true;
    asleep = false;
    walking = null;
    starveLeft = null;
    hungryWarned = false;
    lateWarned = s.time >= LATE;
    goingToFoodBank = false;
    // Every block starts with a couple of cans on its corners
    cansAt = BLOCKS.map(() => CORNERS.map(() => false));
    for (let i = 0; i < BLOCKS.length; i++) { addCanSomewhere(i); if (Math.random() < 0.5) addCanSomewhere(i); }
    buildMap();
    town.hidden = true;
    enterBlock(s.block, "load");
    $("startScreen").hidden = true;
    if (s.day === 1 && s.coins === 0 && s.cans === 0) say("🎒 You woke up on the park bench. Click anywhere to walk. Look for cans 🥫 on the street corners!");
    else say("👋 Welcome back!");
    save();
  }
  const saved = load();
  if (saved) $("continueBtn").hidden = false;
  $("continueBtn").addEventListener("click", () => begin(load() || freshState()));
  $("newGameBtn").addEventListener("click", () => {
    if (saved && !confirm("Start over with nothing? Your old game will be gone.")) return;
    begin(freshState());
  });
  requestAnimationFrame(frame);
})();
