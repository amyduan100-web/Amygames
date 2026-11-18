// Good Witch: an original game by Amy.
// The witch runs around a little world. Monsters leap in from the top of the screen and chase her.
// Hold to aim and charge a fireball like a bow, then let go to shoot. Some monsters can dodge!
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  // ---------- Settings ----------
  const WORLD_W = 2400;
  const WORLD_H = 1800;
  const WITCH_HEARTS = 5;
  const WITCH_SPEED = 230;      // pixels per second
  const HURT_TIME = 1.2;        // seconds the witch is safe after being caught
  const FULL_CHARGE = 0.9;      // seconds of holding for a full-power fireball
  const JUMP_TIME = 1.0;        // seconds a monster spends leaping in

  // dodge = chance to dodge a fireball heading at it
  const MONSTERS = {
    slime: { hearts: 1, speed: 55, radius: 22, points: 10, from: 1, dodge: 0 },
    bat:   { hearts: 1, speed: 125, radius: 18, points: 20, from: 2, dodge: 0.55 },
    ogre:  { hearts: 3, speed: 50,  radius: 30, points: 40, from: 3, dodge: 0 },
    ghost: { hearts: 2, speed: 85,  radius: 22, points: 35, from: 4, dodge: 0.4 },
  };
  const WEIGHT = { slime: 4, bat: 3, ogre: 1, ghost: 2 };

  const BEST_KEY = "amygames.goodWitch.best";

  // ---------- State ----------
  let W = 0, H = 0, scale = 1;
  let state = "start"; // start | play | paused | over
  let witch, fireballs, monsters, particles;
  let score, wave, toSpawn, spawnTimer, spawnGap, waveBanner;
  let cam = { x: 0, y: 0 };
  let lastTime = 0;
  let nextFireballId = 1;

  // Input
  const keys = new Set();
  const aim = { active: false, id: null, sx: 0, sy: 0, held: 0 };   // mouse or finger that aims
  const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }; // touch joystick
  let mouse = { sx: 0, sy: 0 };

  function loadBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* storage blocked */ }
  }

  // ---------- The world (same every game) ----------
  function seeded(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const trees = [], flowers = [], ponds = [], rocks = [];
  (function buildWorld() {
    const rnd = seeded(2026);
    ponds.push({ x: 600, y: 450, rx: 170, ry: 100 }, { x: 1850, y: 1350, rx: 210, ry: 120 }, { x: 1700, y: 380, rx: 120, ry: 80 });
    let tries = 0;
    while (trees.length < 48 && tries++ < 2000) {
      const t = { x: 80 + rnd() * (WORLD_W - 160), y: 80 + rnd() * (WORLD_H - 160), r: 26 + rnd() * 16 };
      if (Math.hypot(t.x - WORLD_W / 2, t.y - WORLD_H / 2) < 260) continue; // keep the start clear
      if (trees.some((o) => Math.hypot(o.x - t.x, o.y - t.y) < o.r + t.r + 90)) continue;
      if (ponds.some((p) => Math.hypot((t.x - p.x) / (p.rx + 50), (t.y - p.y) / (p.ry + 50)) < 1)) continue;
      trees.push(t);
    }
    for (let i = 0; i < 260; i++) {
      flowers.push({ x: rnd() * WORLD_W, y: rnd() * WORLD_H, c: ["#ffd6f0", "#fff3a6", "#c9d8ff", "#ffffff"][Math.floor(rnd() * 4)] });
    }
    for (let i = 0; i < 30; i++) rocks.push({ x: rnd() * WORLD_W, y: rnd() * WORLD_H, r: 6 + rnd() * 8 });
  })();

  // Push a round thing out of tree trunks and keep it inside the world.
  function solveCollisions(e) {
    for (const t of trees) {
      const dx = e.x - t.x, dy = e.y - t.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = e.r * 0.7 + t.r * 0.55;
      if (d < min) { e.x = t.x + (dx / d) * min; e.y = t.y + (dy / d) * min; }
    }
    e.x = Math.max(e.r, Math.min(WORLD_W - e.r, e.x));
    e.y = Math.max(e.r, Math.min(WORLD_H - e.r, e.y));
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

  function newGame() {
    witch = { x: WORLD_W / 2, y: WORLD_H / 2, r: 26, hearts: WITCH_HEARTS, hurt: 0, angle: 0, facing: 1, walk: 0 };
    fireballs = [];
    monsters = [];
    particles = [];
    score = 0;
    aim.active = false;
    stick.active = false;
    keys.clear();
    startWave(1);
    updateCamera();
  }

  function startWave(n) {
    wave = n;
    toSpawn = 3 + n * 2;
    spawnGap = Math.max(0.6, 2.0 - n * 0.12);
    spawnTimer = 1.5;
    waveBanner = 2;
    updateHud();
  }

  function updateCamera() {
    cam.x = Math.max(0, Math.min(WORLD_W - W, witch.x - W / 2));
    cam.y = Math.max(0, Math.min(WORLD_H - H, witch.y - H / 2));
    if (W > WORLD_W) cam.x = (WORLD_W - W) / 2;
    if (H > WORLD_H) cam.y = (WORLD_H - H) / 2;
  }

  // ---------- Monsters ----------
  function pickType() {
    const bag = [];
    for (const k of Object.keys(MONSTERS)) {
      if (wave >= MONSTERS[k].from) for (let i = 0; i < WEIGHT[k]; i++) bag.push(k);
    }
    return bag[Math.floor(Math.random() * bag.length)];
  }

  // Monsters leap in from above the top of the screen and land somewhere near the witch.
  function spawnMonster() {
    const type = pickType();
    const def = MONSTERS[type];
    const a = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 180;
    const land = { x: witch.x + Math.cos(a) * dist, y: witch.y + Math.sin(a) * dist, r: def.radius };
    solveCollisions(land);
    const speedUp = 1 + (wave - 1) * 0.06;
    monsters.push({
      type, r: def.radius,
      x: land.x, y: land.y,
      jump: { sx: land.x + (Math.random() - 0.5) * 200, sy: cam.y - 80, tx: land.x, ty: land.y, t: 0 },
      hearts: def.hearts, maxHearts: def.hearts,
      speed: def.speed * speedUp * (0.85 + Math.random() * 0.3),
      dodgeChance: def.dodge,
      dodgeCool: 0, dodgeT: 0, dvx: 0, dvy: 0,
      seen: new Set(),
      flash: 0, knock: 0, kvx: 0, kvy: 0,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  // How high above the ground a leaping monster is drawn
  function jumpLift(m) {
    if (!m.jump) return 0;
    const p = m.jump.t / JUMP_TIME;
    return Math.sin(p * Math.PI) * 140;
  }

  function tryDodge(m) {
    if (m.dodgeChance <= 0 || m.dodgeCool > 0 || m.dodgeT > 0) return;
    for (const f of fireballs) {
      if (m.seen.has(f.id)) continue;
      // Will this fireball pass close to the monster soon?
      const rx = m.x - f.x, ry = m.y - f.y;
      const v2 = f.vx * f.vx + f.vy * f.vy;
      const t = (rx * f.vx + ry * f.vy) / v2;
      if (t < 0 || t > 0.4) continue;
      const cx = f.x + f.vx * t - m.x, cy = f.y + f.vy * t - m.y;
      if (Math.hypot(cx, cy) > m.r + f.r + 12) continue;
      m.seen.add(f.id);
      if (Math.random() > m.dodgeChance) continue;
      // Hop sideways, away from the fireball's path
      const sp = Math.sqrt(v2);
      let px = -f.vy / sp, py = f.vx / sp;
      if (px * -cx + py * -cy < 0) { px = -px; py = -py; }
      m.dvx = px * 420; m.dvy = py * 420;
      m.dodgeT = 0.22;
      m.dodgeCool = 1.3;
      puff(m.x, m.y, "rgba(255,255,255,0.8)", 6);
      return;
    }
  }

  // ---------- Fireballs ----------
  function aimWorld() {
    return { x: aim.sx + cam.x, y: aim.sy + cam.y };
  }

  function charge() {
    return Math.min(1, aim.held / FULL_CHARGE);
  }

  function release() {
    if (!aim.active) return;
    aim.active = false;
    aim.id = null;
    if (state !== "play") return;
    const target = aimWorld();
    const dx = target.x - witch.x, dy = target.y - witch.y;
    const len = Math.hypot(dx, dy) || 1;
    const c = charge();
    const speed = 300 + 520 * c;
    fireballs.push({
      id: nextFireballId++,
      x: witch.x + (dx / len) * witch.r, y: witch.y + (dy / len) * witch.r,
      vx: (dx / len) * speed, vy: (dy / len) * speed,
      r: 7 + 4 * c,
      life: 0.5 + 0.9 * c,
      power: c,
    });
    aim.held = 0;
  }

  function puff(x, y, color, count, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (40 + Math.random() * 160) * power;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, max: 0.9, color, r: 2 + Math.random() * 4 });
    }
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

  function update(dt) {
    // Waves
    if (waveBanner > 0) waveBanner -= dt;
    if (toSpawn > 0) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnMonster();
        toSpawn--;
        spawnTimer = spawnGap * (0.6 + Math.random() * 0.8);
      }
    } else if (monsters.length === 0) {
      startWave(wave + 1);
    }

    // Witch moves (a bit slower while pulling back a fireball)
    const { mx, my } = moveInput();
    const sp = WITCH_SPEED * (aim.active ? 0.6 : 1);
    witch.x += mx * sp * dt;
    witch.y += my * sp * dt;
    solveCollisions(witch);
    if (mx || my) witch.walk += dt * 10;
    if (mx) witch.facing = mx > 0 ? 1 : -1;
    if (witch.hurt > 0) witch.hurt -= dt;
    updateCamera();

    if (aim.active) {
      aim.held += dt;
      const t = aimWorld();
      witch.facing = t.x > witch.x ? 1 : -1;
    }

    // Fireballs fly until they run out, hit a tree, or leave the world
    for (const f of fireballs) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      if (Math.random() < 0.7) {
        particles.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.25, max: 0.25, color: "#ffb347", r: 3 });
      }
      if (f.life <= 0) { f.hit = true; puff(f.x, f.y, "#ff9a3c", 5, 0.4); continue; }
      if (f.x < 0 || f.y < 0 || f.x > WORLD_W || f.y > WORLD_H) { f.hit = true; continue; }
      for (const t of trees) {
        if (Math.hypot(f.x - t.x, f.y - t.y) < t.r * 0.55 + f.r) { f.hit = true; puff(f.x, f.y, "#ff9a3c", 8, 0.6); break; }
      }
    }

    // Monsters
    for (const m of monsters) {
      m.wobble += dt * (m.type === "bat" ? 12 : 5);
      if (m.flash > 0) m.flash -= dt;

      if (m.jump) {
        m.jump.t += dt;
        const p = Math.min(1, m.jump.t / JUMP_TIME);
        m.x = m.jump.sx + (m.jump.tx - m.jump.sx) * p;
        m.y = m.jump.sy + (m.jump.ty - m.jump.sy) * p;
        if (p >= 1) { m.jump = null; puff(m.x, m.y + m.r * 0.6, "#c8b48a", 12, 0.7); }
        continue; // can't be hit while in the air
      }

      if (m.dodgeCool > 0) m.dodgeCool -= dt;
      tryDodge(m);

      const dx = witch.x - m.x, dy = witch.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      if (m.dodgeT > 0) {
        m.dodgeT -= dt;
        m.x += m.dvx * dt;
        m.y += m.dvy * dt;
      } else if (m.knock > 0) {
        m.knock -= dt;
        m.x += m.kvx * dt;
        m.y += m.kvy * dt;
      } else {
        let sx = (dx / d) * m.speed, sy = (dy / d) * m.speed;
        if (m.type === "bat") { sx += (-dy / d) * Math.sin(m.wobble) * 70; sy += (dx / d) * Math.sin(m.wobble) * 70; }
        if (m.type === "slime") { const hop = 0.5 + Math.max(0, Math.sin(m.wobble)); sx *= hop; sy *= hop; }
        m.x += sx * dt;
        m.y += sy * dt;
      }
      if (m.type !== "bat" && m.type !== "ghost") solveCollisions(m); // flying monsters go over trees

      // Fireball hits: each hit takes away one heart
      for (const f of fireballs) {
        if (f.hit) continue;
        if (Math.hypot(f.x - m.x, f.y - m.y) < m.r + f.r) {
          f.hit = true;
          m.hearts--;
          m.flash = 0.15;
          const fl = Math.hypot(f.vx, f.vy) || 1;
          m.kvx = (f.vx / fl) * 260; m.kvy = (f.vy / fl) * 260; m.knock = 0.12;
          puff(f.x, f.y, "#ff9a3c", 8);
          break;
        }
      }
      if (m.hearts <= 0) {
        m.dead = true;
        score += MONSTERS[m.type].points;
        puff(m.x, m.y, monsterColor(m.type), 20);
        continue;
      }

      // Caught the witch!
      if (witch.hurt <= 0 && d < m.r + witch.r * 0.8) {
        witch.hearts--;
        witch.hurt = HURT_TIME;
        m.kvx = (-dx / d) * 380; m.kvy = (-dy / d) * 380; m.knock = 0.3;
        puff(witch.x, witch.y, "#ff5a7a", 14);
        if (witch.hearts <= 0) { updateHud(); gameOver(); return; }
      }
    }
    fireballs = fireballs.filter((f) => !f.hit);
    monsters = monsters.filter((m) => !m.dead);

    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    particles = particles.filter((p) => p.life > 0);

    updateHud();
  }

  // ---------- Drawing ----------
  function monsterColor(type) {
    return { slime: "#58d66b", bat: "#8b6bd9", ogre: "#d9534f", ghost: "#e8e8ff" }[type];
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

  function drawGround() {
    // Outside the world
    ctx.fillStyle = "#1d3a24";
    ctx.fillRect(cam.x, cam.y, W, H);
    // Grass with a soft checker pattern
    ctx.fillStyle = "#4f9a4a";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const T = 80;
    ctx.fillStyle = "#4a9245";
    const x0 = Math.max(0, Math.floor(cam.x / T)), x1 = Math.min(WORLD_W / T, Math.ceil((cam.x + W) / T));
    const y0 = Math.max(0, Math.floor(cam.y / T)), y1 = Math.min(WORLD_H / T, Math.ceil((cam.y + H) / T));
    for (let i = x0; i < x1; i++) for (let j = y0; j < y1; j++) if ((i + j) % 2) ctx.fillRect(i * T, j * T, T, T);
    // Ponds
    for (const p of ponds) {
      if (!inView(p.x, p.y, p.rx + 20)) continue;
      ctx.fillStyle = "#3b7fc4";
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.35, p.ry * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of flowers) {
      if (!inView(f.x, f.y, 10)) continue;
      ctx.fillStyle = f.c;
      ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const r of rocks) {
      if (!inView(r.x, r.y, 20)) continue;
      ctx.fillStyle = "#8d9196";
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Fence around the edge of the world
    ctx.strokeStyle = "#7a5230";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, WORLD_W - 8, WORLD_H - 8);
  }

  function drawTree(t) {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(t.x, t.y + t.r * 0.5, t.r * 0.9, t.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6b4426";
    ctx.fillRect(t.x - t.r * 0.18, t.y - t.r * 0.1, t.r * 0.36, t.r * 0.6);
    ctx.fillStyle = "#2f7a3a";
    ctx.beginPath(); ctx.arc(t.x, t.y - t.r * 0.55, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3d9147";
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.8, t.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  function drawShadow(x, y, r, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawWitch(t) {
    drawShadow(witch.x, witch.y + witch.r * 0.9, witch.r * 0.9, 0.3);
    if (witch.hurt > 0 && Math.floor(witch.hurt * 16) % 2 === 0) ctx.globalAlpha = 0.35;
    const bob = Math.abs(Math.sin(witch.walk)) * 4;
    ctx.save();
    ctx.translate(witch.x, witch.y - bob);
    if (witch.facing > 0) ctx.scale(-1, 1); // the emoji faces left by default on most systems
    drawEmoji("🧙‍♀️", 0, 0, witch.r * 2.2);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawAim() {
    if (!aim.active) return;
    const target = aimWorld();
    const dx = target.x - witch.x, dy = target.y - witch.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const c = charge();
    const L = 50 + 150 * c;
    const sx = witch.x + ux * witch.r, sy = witch.y + uy * witch.r;
    const ex = sx + ux * L, ey = sy + uy * L;
    const col = c >= 1 ? "#ff3b1f" : "#ffb347";
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
    // Power bar under the witch
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

  function drawMonster(m) {
    const lift = jumpLift(m);
    if (m.jump) {
      // Growing shadow shows where it will land
      const p = m.jump.t / JUMP_TIME;
      drawShadow(m.jump.tx, m.jump.ty + m.r * 0.7, m.r * (0.4 + 0.6 * p), 0.15 + 0.25 * p);
    } else {
      drawShadow(m.x, m.y + m.r * 0.7, m.r * 0.8, m.type === "bat" || m.type === "ghost" ? 0.12 : 0.25);
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
      drawEmoji({ bat: "🦇", ogre: "👹", ghost: "👻" }[m.type], m.x, y, m.r * 2);
      ctx.globalAlpha = 1;
    }
    // Hearts above the monster
    const size = 12;
    const gap = 13;
    const startX = m.x - ((m.maxHearts - 1) * gap) / 2;
    for (let i = 0; i < m.maxHearts; i++) {
      drawEmoji(i < m.hearts ? "❤️" : "🖤", startX + i * gap, y - m.r - 10, size);
    }
  }

  function drawFireball(f) {
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2);
    g.addColorStop(0, "#fff6c2");
    g.addColorStop(0.4, f.power >= 1 ? "#ff5a1f" : "#ffb347");
    g.addColorStop(1, "rgba(255,90,20,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 2, 0, Math.PI * 2); ctx.fill();
  }

  function drawMinimap() {
    const mw = Math.min(160, W * 0.32), mh = mw * (WORLD_H / WORLD_W);
    const x = W - mw - 12, y = H - mh - 12;
    const k = mw / WORLD_W;
    ctx.fillStyle = "rgba(20,40,20,0.75)";
    ctx.fillRect(x, y, mw, mh);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, mw, mh);
    ctx.fillStyle = "#3b7fc4";
    for (const p of ponds) { ctx.beginPath(); ctx.ellipse(x + p.x * k, y + p.y * k, p.rx * k, p.ry * k, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#2f7a3a";
    for (const t of trees) ctx.fillRect(x + t.x * k - 1.5, y + t.y * k - 1.5, 3, 3);
    ctx.fillStyle = "#ff5a5a";
    for (const m of monsters) if (!m.jump) ctx.fillRect(x + m.x * k - 2, y + m.y * k - 2, 4, 4);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.strokeRect(x + cam.x * k, y + cam.y * k, W * k, H * k);
    ctx.fillStyle = "#ffe066";
    ctx.beginPath(); ctx.arc(x + witch.x * k, y + witch.y * k, 3.5, 0, Math.PI * 2); ctx.fill();
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
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawGround();
    if (witch) {
      // Draw things lower on the screen in front of things higher up
      const things = [];
      for (const tr of trees) if (inView(tr.x, tr.y, 80)) things.push({ y: tr.y, draw: () => drawTree(tr) });
      for (const m of monsters) things.push({ y: m.jump ? m.jump.ty : m.y, draw: () => drawMonster(m) });
      things.push({ y: witch.y, draw: () => drawWitch(t) });
      things.sort((a, b) => a.y - b.y);
      for (const th of things) th.draw();
      for (const f of fireballs) drawFireball(f);
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawAim();
    } else {
      for (const tr of trees) if (inView(tr.x, tr.y, 80)) drawTree(tr);
    }
    ctx.restore();

    if (witch) {
      drawMinimap();
      drawStick();
      if (state === "play" && waveBanner > 0) {
        ctx.globalAlpha = Math.min(1, waveBanner);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(42 * scale)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 8;
        ctx.fillText(`Wave ${wave}`, W / 2, H * 0.22);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  }

  // ---------- HUD and screens ----------
  function updateHud() {
    if (!witch) return;
    const h = Math.max(0, witch.hearts);
    $("hearts").textContent = "❤️".repeat(h) + "🖤".repeat(WITCH_HEARTS - h);
    $("wave").textContent = wave;
    $("score").textContent = score;
  }

  function show(id, on) { $(id).hidden = !on; }

  function startGame() {
    newGame();
    state = "play";
    show("startScreen", false);
    show("overScreen", false);
    show("pauseScreen", false);
    $("pauseBtn").textContent = "Pause";
  }

  function gameOver() {
    state = "over";
    aim.active = false;
    stick.active = false;
    let best = loadBest();
    const isNew = score > best;
    if (isNew) { best = score; saveBest(best); }
    $("finalScore").textContent = `You scored ${score} points and reached wave ${wave}.`;
    $("bestOver").textContent = isNew ? "🏆 New best score!" : `Best score: ${best}`;
    show("overScreen", true);
  }

  function togglePause() {
    if (state === "play") {
      state = "paused";
      aim.active = false;
      stick.active = false;
      keys.clear();
      show("pauseScreen", true);
      $("pauseBtn").textContent = "Resume";
    } else if (state === "paused") {
      state = "play";
      show("pauseScreen", false);
      $("pauseBtn").textContent = "Pause";
    }
  }

  // ---------- Input ----------
  // Mouse: hold to aim and charge, let go to shoot. Keys WASD or arrows to move.
  // Touch: drag on the left half to move, hold on the right half to aim, lift to shoot.
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "play") return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (e.pointerType === "touch" && e.clientX < W / 2 && !stick.active) {
      Object.assign(stick, { active: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
      return;
    }
    if (!aim.active) Object.assign(aim, { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, held: 0 });
  });
  canvas.addEventListener("pointermove", (e) => {
    mouse.sx = e.clientX; mouse.sy = e.clientY;
    if (stick.active && e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; }
    if (aim.active && e.pointerId === aim.id) { aim.sx = e.clientX; aim.sy = e.clientY; }
  });
  function pointerEnd(e) {
    if (stick.active && e.pointerId === stick.id) stick.active = false;
    if (aim.active && e.pointerId === aim.id) release();
  }
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", (e) => {
    if (stick.active && e.pointerId === stick.id) stick.active = false;
    if (aim.active && e.pointerId === aim.id) { aim.active = false; aim.id = null; }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("blur", () => { if (state === "play") togglePause(); });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "p" || k === "escape") { togglePause(); return; }
    if ((k === "enter" || k === " ") && (state === "start" || state === "over")) { e.preventDefault(); startGame(); return; }
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(k)) {
      e.preventDefault();
      if (state === "play") keys.add(k);
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  $("startBtn").addEventListener("click", startGame);
  $("againBtn").addEventListener("click", startGame);
  $("resumeBtn").addEventListener("click", togglePause);
  $("pauseBtn").addEventListener("click", togglePause);
  window.addEventListener("resize", () => { resize(); if (witch) updateCamera(); });

  // ---------- Main loop ----------
  function loop(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, t - lastTime || 0);
    lastTime = t;
    if (state === "play") update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  cam.x = (WORLD_W - W) / 2;
  cam.y = (WORLD_H - H) / 2;
  const best = loadBest();
  $("bestStart").textContent = best > 0 ? `Best score: ${best}` : "";
  requestAnimationFrame(loop);
})();
