// Same emojis on every device!
// Windows, iPads and phones all draw emojis differently. This turns every emoji on the page into a
// Twemoji picture (CC-BY 4.0, https://github.com/jdecked/twemoji), so they look the same everywhere.
// The good witch 🧙‍♀️ uses our own picture (assets/witch.svg) so she looks young.
// Games that draw on a canvas can use AmyEmoji.image("🍄") to get a picture to draw.
(function () {
  "use strict";
  if (!window.twemoji) return; // couldn't load Twemoji: just use the device's own emojis
  const CDN = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/";
  const here = document.currentScript ? document.currentScript.src : location.href;
  const OWN = {
    "1f9d9-200d-2640-fe0f": new URL("../assets/witch.svg", here).href, // 🧙‍♀️ our young witch
  };
  const urlFor = (icon, png) => OWN[icon] || (png ? `${CDN}72x72/${icon}.png` : `${CDN}svg/${icon}.svg`);

  // Pictures in the page
  const style = document.createElement("style");
  style.textContent = "img.emoji{height:1em;width:1em;margin:0 .05em 0 .1em;vertical-align:-0.12em;display:inline-block;pointer-events:none}";
  document.head.appendChild(style);
  const options = { className: "emoji", callback: (icon) => urlFor(icon, false) };
  // In a grid or flex box, each picture would become its own little box and they'd stack up.
  // So when a box only has text and emoji pictures inside, keep them together in one line.
  function keepTogether(el) {
    const kids = [...el.childNodes];
    if (kids.length < 2 || !kids.some((k) => k.nodeType === 1)) return;
    if (!kids.every((k) => k.nodeType === 3 || (k.nodeType === 1 && k.tagName === "IMG" && k.classList.contains("emoji")))) return;
    const d = getComputedStyle(el).display;
    if (!/grid|flex/.test(d)) return;
    const span = document.createElement("span");
    span.className = "emoji-line";
    for (const k of kids) span.appendChild(k);
    el.appendChild(span);
  }
  const parse = (node) => {
    try {
      twemoji.parse(node, options);
      const boxes = new Set();
      node.querySelectorAll("img.emoji").forEach((img) => boxes.add(img.parentNode));
      if (node.matches && node.matches("img.emoji")) boxes.add(node.parentNode);
      boxes.forEach((b) => b && b.nodeType === 1 && keepTogether(b));
    } catch (e) { /* leave it as it is */ }
  };

  // Watch the page: whenever the game changes some text, turn its emojis into pictures too
  const watch = { childList: true, subtree: true, characterData: true };
  const observer = new MutationObserver((changes) => {
    const nodes = new Set();
    for (const c of changes) {
      if (c.type === "characterData") { if (c.target.parentNode) nodes.add(c.target.parentNode); continue; }
      for (const n of c.addedNodes) {
        if (n.nodeType === 3) { if (n.parentNode) nodes.add(n.parentNode); } else if (n.nodeType === 1 && n.tagName !== "IMG") nodes.add(n);
      }
    }
    observer.disconnect(); // don't watch our own changes
    for (const n of nodes) if (n.isConnected && n.tagName !== "TEXTAREA" && n.tagName !== "INPUT") parse(n);
    observer.observe(document.body, watch);
  });
  parse(document.body);
  observer.observe(document.body, watch);

  // Pictures for canvas games
  const cache = {};
  function iconOf(text) {
    let found = null, count = 0;
    twemoji.parse(text, { callback: (icon) => { found = icon; count++; return false; } });
    // only a single emoji (and nothing else) can be drawn as a picture
    return count === 1 && text.replace(/[\s️]/g, "").length <= 12 ? found : null;
  }
  window.AmyEmoji = {
    // Returns a ready picture for the emoji, or null (then draw it as text for now)
    image(text) {
      let c = cache[text];
      if (!c) {
        const icon = iconOf(text);
        c = cache[text] = { img: null, ok: false };
        if (icon) {
          const img = new Image();
          img.onload = () => { c.ok = true; };
          img.src = urlFor(icon, true);
          c.img = img;
        }
      }
      return c.ok ? c.img : null;
    },
  };
})();
