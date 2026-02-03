let ELEMENTS = [];
let symbolMap = new Map();

async function loadElements() {
  const res = await fetch("../../data/elements.json");
  if (!res.ok) throw new Error(`Failed to load elements JSON (${res.status})`);
  ELEMENTS = await res.json();
  symbolMap = new Map(ELEMENTS.map(e => [String(e.symbol).toLowerCase(), e]));
}

const $ = (id) => document.getElementById(id);

const periodicMain = $("periodicMain");
const periodicF = $("periodicF");

const wordInput = $("wordInput");
const lockBtn = $("lockBtn");
const resetBtn = $("resetBtn");

const targetWordEl = $("targetWord");
const progressWord = $("progressWord");
const buildZone = $("buildZone");
const jokerCountEl = $("jokerCount");

const switchBtn = $("switchBtn");
const checkBtn = $("checkBtn");
const hintBtn = $("hintBtn");

const statusEl = $("status");
const resultEl = $("result"); 

let target = "";
let idx = 0;                 
let build = [];              
let jokersUsed = 0;
let switchMode = false;
let selectedIndex = null;
let hoverInsertIndex = null; 
let dragging = null;         

function normalizeWord(raw) {
  return String(raw || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
}

function setResult(kind, msg) {
  if (!resultEl) return;
  resultEl.className = "result" + (kind ? ` ${kind}` : "");
  resultEl.textContent = msg;
}

function canFinishFrom(startIndex) {
  const memo = new Map();
  function dfs(i) {
    if (i === target.length) return true;
    if (memo.has(i)) return memo.get(i);

    for (const len of [2, 1]) {
      const part = target.slice(i, i + len);
      if (part.length !== len) continue;
      if (symbolMap.has(part) && dfs(i + len)) {
        memo.set(i, true);
        return true;
      }
    }
    memo.set(i, false);
    return false;
  }
  return dfs(startIndex);
}

function evaluateBuild() {
  let pos = 0;
  let firstWrongIndex = -1;

  for (let i = 0; i < build.length; i++) {
    const item = build[i];

    if (pos >= target.length) {
      firstWrongIndex = firstWrongIndex === -1 ? i : firstWrongIndex;
      break;
    }

    if (item.type === "joker") {
      pos += 1;
      continue;
    }

    const next = target.slice(pos, pos + item.len);
    if (next === item.text) pos += item.len;
    else {
      firstWrongIndex = i;
      break;
    }
  }

  const isComplete = (firstWrongIndex === -1 && pos === target.length);
  return { consumed: pos, firstWrongIndex, isComplete };
}

function recomputeCursor() {
  idx = evaluateBuild().consumed;
}

function getLetterPosBeforeTile(tileIndex) {
  let pos = 0;
  for (let i = 0; i < tileIndex; i++) {
    const item = build[i];

    if (item.type === "joker") {
      pos += 1;
      continue;
    }

    const next = target.slice(pos, pos + item.len);
    if (next !== item.text) return null;
    pos += item.len;
  }
  return pos;
}

function makeElementItem(symbol) {
  const text = String(symbol).toLowerCase();
  const el = symbolMap.get(text);
  if (!el) return null;
  return { type: "el", symbol: el.symbol, text, name: el.name, len: text.length };
}

function makeJokerItem() {
  return {
    type: "joker",
    symbol: "?",
    text: "?",
    name: "Joker",
    len: 1,
    resolved: null
  };
}

function unresolveJokers() {
  for (const item of build) {
    if (item.type === "joker") {
      item.resolved = null;
      item.symbol = "?";
      item.text = "?";
    }
  }
}

function resolveJokersInCurrentOrder() {
  let pos = 0;

  for (let i = 0; i < build.length; i++) {
    const item = build[i];
    if (pos >= target.length) break;

    if (item.type === "joker") {
      const letter = target[pos];
      item.resolved = letter;
      item.symbol = `?(${letter.toUpperCase()})`;
      item.text = letter;
      pos += 1;
      continue;
    }

    const next = target.slice(pos, pos + item.len);
    if (next !== item.text) break;

    pos += item.len;
  }
}

function getChipElements() {
  if (!buildZone) return [];
  return Array.from(buildZone.querySelectorAll(".build-chip"));
}

function getNearestChipIndex(clientX) {
  const chips = getChipElements();
  if (chips.length === 0) return null;

  let bestIdx = 0;
  let bestDist = Infinity;

  chips.forEach((chip, i) => {
    const r = chip.getBoundingClientRect();
    const center = r.left + r.width / 2;
    const dist = Math.abs(clientX - center);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  });

  return bestIdx;
}

function computeInsertIndexNearest(clientX) {
  const chips = getChipElements();
  if (chips.length === 0) return 0;

  const firstRect = chips[0].getBoundingClientRect();
  const lastRect = chips[chips.length - 1].getBoundingClientRect();

  if (clientX <= firstRect.left) return 0;
  if (clientX >= lastRect.right) return chips.length;

  const nearestIdx = getNearestChipIndex(clientX);
  const rect = chips[nearestIdx].getBoundingClientRect();
  const center = rect.left + rect.width / 2;

  return clientX < center ? nearestIdx : nearestIdx + 1;
}

function replaceAt(index, newItem) {
  unresolveJokers();

  const old = build[index];
  if (old?.type === "joker" && newItem.type !== "joker") jokersUsed -= 1;
  if (old?.type !== "joker" && newItem.type === "joker") jokersUsed += 1;

  build[index] = newItem;
  recomputeCursor();
  updateUI();
}

function insertAt(index, newItem) {
  unresolveJokers();

  if (newItem.type === "joker") jokersUsed += 1;
  build.splice(index, 0, newItem);

  if (selectedIndex !== null && selectedIndex >= index) selectedIndex += 1;

  recomputeCursor();
  updateUI();
}

function removeAt(index) {
  unresolveJokers();

  if (build[index]?.type === "joker") jokersUsed -= 1;
  build.splice(index, 1);

  if (selectedIndex === index) selectedIndex = null;
  else if (selectedIndex !== null && selectedIndex > index) selectedIndex -= 1;

  recomputeCursor();
  updateUI();
}

function moveTile(fromIndex, toIndex) {
  unresolveJokers();
  if (fromIndex === toIndex) return;

  const [moved] = build.splice(fromIndex, 1);
  const adjustedTo = (fromIndex < toIndex) ? toIndex - 1 : toIndex;
  build.splice(adjustedTo, 0, moved);

  if (selectedIndex === fromIndex) selectedIndex = adjustedTo;
  else if (selectedIndex !== null) {
    if (fromIndex < selectedIndex && adjustedTo >= selectedIndex) selectedIndex -= 1;
    else if (fromIndex > selectedIndex && adjustedTo <= selectedIndex) selectedIndex += 1;
  }

  recomputeCursor();
  updateUI();
}

function addOrSwitch(symbol, insertIndex = null) {
  if (!target) {
    setResult("bad", "Пред да започнеш, избери збор и потврди го.");
    return;
  }

  if (switchMode) {
    if (selectedIndex === null) {
      setResult("bad", "Кликни на симболот што сакаш да го смениш, па избери друг симбол од периодниот систем.");
      return;
    }

    if (symbol === "__JOKER__") {
      const pos = getLetterPosBeforeTile(selectedIndex);
      if (pos === null) {
        setResult("bad", "Најпрво поправи ја претходната грешка.");
        return;
      }
      if (canFinishFrom(pos)) {
        const needed = target[pos]?.toUpperCase() ?? "";
        setResult("bad", `Џокерот не ти е потребен, продолжи со хемиски елементи. Следниот симбол е “${needed}”.`);
        return;
      }

      replaceAt(selectedIndex, makeJokerItem());
      setResult("", `Симболот #${selectedIndex + 1} е заменет со џокер.`);
      return;
    }

    const newItem = makeElementItem(symbol);
    if (!newItem) return;

    replaceAt(selectedIndex, newItem);
    setResult("", `Симболот #${selectedIndex + 1} е заменет со ${newItem.symbol}.`);
    return;
  }

  if (symbol === "__JOKER__") {
    if (idx >= target.length) {
      setResult("", "Стигна до крајот! Провери го твојот резултат или тргни некој од симболите.");
      return;
    }
    if (canFinishFrom(idx)) {
      const nextLetter = target[idx].toUpperCase();
      setResult("bad", `Џокерот не ти е потребен, продолжи со хемиски елементи. Следната буква е  “${nextLetter}”.`);
      return;
    }

    const item = makeJokerItem();
    const where = (insertIndex !== null) ? insertIndex : build.length;
    insertAt(where, item);
    setResult("", "Додаден џокер.");
    return;
  }

  const item = makeElementItem(symbol);
  if (!item) return;

  const where = (insertIndex !== null) ? insertIndex : build.length;
  insertAt(where, item);

  const state = evaluateBuild();
  if (state.firstWrongIndex !== -1) {
    const expected = target[idx]?.toUpperCase() ?? "";
    setResult("bad", `Го стави симболот ${item.symbol}. За да продолжиш правилно, следниот симбол треба да започнува со “${expected}”.`);
  } else {
    setResult("", "Продолжи така!");
  }
}


function renderPreviewShift() {
  const chips = getChipElements();
  chips.forEach(c => c.classList.remove("gap-before", "gap-after"));
  if (hoverInsertIndex === null) return;

  if (hoverInsertIndex === build.length && chips.length > 0) {
    chips[chips.length - 1].classList.add("gap-after");
    return;
  }

  const targetChip = chips[hoverInsertIndex];
  if (targetChip) targetChip.classList.add("gap-before");
}

function updateUI() {
  if (targetWordEl) targetWordEl.textContent = target ? target.toUpperCase() : "—";

  const done = target.slice(0, idx).toUpperCase();
  const rest = target.slice(idx).toUpperCase();
  if (progressWord) progressWord.textContent = target ? `${done}▌${rest}` : "—";

  if (jokerCountEl) jokerCountEl.textContent = String(jokersUsed);

  if (checkBtn) checkBtn.disabled = !(target && build.length > 0);
  if (hintBtn) hintBtn.disabled = !target;
  if (switchBtn) switchBtn.disabled = !(target && build.length > 0);

  if (!buildZone) return;

  if (build.length === 0) {
    buildZone.innerHTML = `<span class="muted small">Кога ќе притиснеш на симболот, тој ќе се појави тука!</span>`;
    selectedIndex = null;
    hoverInsertIndex = null;
    return;
  }

  const state = evaluateBuild();
  buildZone.innerHTML = "";

  build.forEach((item, i) => {
    const chip = document.createElement("div");
    chip.className = "build-chip";
    chip.dataset.index = String(i);

    if (switchMode && selectedIndex === i) chip.classList.add("selected");
    if (state.firstWrongIndex === i) chip.classList.add("wrong");

    chip.innerHTML = `
      <div class="sym">${item.symbol}</div>
      <div class="meta">${item.name ?? ""}</div>
      <button class="chip-x" aria-label="Remove tile" title="Remove">✕</button>
    `;


    chip.querySelector(".chip-x").addEventListener("click", (e) => {
      e.stopPropagation();
      removeAt(i);
      setResult("", "Симболот е тргнат.");
    });

    chip.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("chip-x")) return;
      if (!switchMode) return;
      selectedIndex = i;
      setResult("", `Симболот #${i + 1} (${item.symbol}) е селектиран. Сега избери нов елемент за да го замени.`);
      updateUI();
    });

    chip.draggable = !switchMode;
    chip.style.cursor = switchMode ? "default" : "grab";

    chip.addEventListener("dragstart", (ev) => {
      if (switchMode) {
        ev.preventDefault();
        return;
      }
      dragging = { kind: "move", fromIndex: i };
      ev.dataTransfer.setData("text/plain", `__MOVE__:${i}`);
      ev.dataTransfer.effectAllowed = "move";
    });

    chip.addEventListener("dragend", () => {
      dragging = null;
      hoverInsertIndex = null;
      updateUI();
    });

    chip.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      const payload = ev.dataTransfer.getData("text/plain");
      if (!payload) return;
      hoverInsertIndex = computeInsertIndexNearest(ev.clientX);
      renderPreviewShift();
    }, true);

    chip.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const payload = ev.dataTransfer.getData("text/plain");
      if (!payload) return;

      const dropIndex = computeInsertIndexNearest(ev.clientX);

      if (payload.startsWith("__MOVE__:")) {
        const fromIndex = Number(payload.split(":")[1]);
        if (Number.isFinite(fromIndex)) moveTile(fromIndex, dropIndex);
      } else {
        addOrSwitch(payload, dropIndex);
      }

      hoverInsertIndex = null;
      updateUI();
    }, true);

    buildZone.appendChild(chip);
  });

  renderPreviewShift();
}

function wireJokerTile() {
  const jokerTile = $("jokerTile");
  if (!jokerTile) return;

  jokerTile.draggable = true;

  jokerTile.addEventListener("dragstart", (ev) => {
    dragging = { kind: "new", symbol: "__JOKER__" };
    ev.dataTransfer.setData("text/plain", "__JOKER__");
    ev.dataTransfer.effectAllowed = "copy";
  });

  jokerTile.addEventListener("dragend", () => {
    dragging = null;
    hoverInsertIndex = null;
    updateUI();
  });

  jokerTile.addEventListener("click", () => addOrSwitch("__JOKER__", null));
}

function renderPeriodicTable() {
    if (!periodicMain || !periodicF) return;
  
    const jokerNode = document.getElementById("jokerTile");
  
    periodicMain.innerHTML = "";
    periodicF.innerHTML = "";
  
    if (jokerNode) {
      periodicF.appendChild(jokerNode);
      jokerNode.style.gridRow = "2";
      jokerNode.style.gridColumn = "1";
    }
  
    ELEMENTS.forEach(el => {
      const tile = document.createElement("div");
      tile.className = "element-tile";
      tile.dataset.symbol = el.symbol;
      tile.draggable = true;
  
 
      tile.innerHTML = `
        <div class="tile-top">
          <div class="symbol">${el.symbol}</div>
          <div class="atomic-number">${el.number}</div>
        </div>
        <div class="name">${el.name}</div>
      `;
  
      tile.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData("text/plain", el.symbol);
        ev.dataTransfer.effectAllowed = "copy";
      });
  
      tile.addEventListener("click", () => addOrSwitch(el.symbol, null));

      if (el.color) {
        tile.style.backgroundColor = el.color;
      
 
      }
  
      if ((el.number >= 57 && el.number <= 71) || (el.number >= 89 && el.number <= 103)) {
        const isLanthanide = el.number <= 71;
        const row = isLanthanide ? 1 : 2;
        const colOffset = isLanthanide ? (el.number - 56) : (el.number - 88); 
  
        tile.style.gridRow = row;
        tile.style.gridColumn = colOffset + 3; 
  
        periodicF.appendChild(tile);
        return;
      }
  
      if (el.group && el.period) {
        tile.style.gridColumn = el.group;
        tile.style.gridRow = el.period;
        periodicMain.appendChild(tile);
      }
      
    });
  }
  
function enableBuildZoneDnD() {
  if (!buildZone) return;

  buildZone.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    hoverInsertIndex = computeInsertIndexNearest(ev.clientX);
    renderPreviewShift();
  });

  buildZone.addEventListener("dragleave", (ev) => {
    if (!buildZone.contains(ev.relatedTarget)) {
      hoverInsertIndex = null;
      renderPreviewShift();
    }
  });

  buildZone.addEventListener("drop", (ev) => {
    ev.preventDefault();

    const payload = ev.dataTransfer.getData("text/plain");
    if (!payload) return;

    const overChip = ev.target && ev.target.closest && ev.target.closest(".build-chip");
    if (overChip) return;

    const dropIndex = computeInsertIndexNearest(ev.clientX);

    if (payload.startsWith("__MOVE__:")) {
      const fromIndex = Number(payload.split(":")[1]);
      if (Number.isFinite(fromIndex)) moveTile(fromIndex, dropIndex);
    } else {
      addOrSwitch(payload, dropIndex);
    }

    hoverInsertIndex = null;
    updateUI();
  });
}

function lockWord() {
  const word = normalizeWord(wordInput ? wordInput.value : "");
  if (!word) {
    setResult("bad", "Напиши збор користејќи само латинични букви.");
    return;
  }

  target = word;
  build = [];
  jokersUsed = 0;
  idx = 0;

  switchMode = false;
  selectedIndex = null;
  hoverInsertIndex = null;
  if (switchBtn) switchBtn.textContent = "Промени симбол";

  setStatus("Drag tiles to reorder. Switch replaces one tile. ✕ removes.");
  setResult("", "Твојот збор е потврден. Почни да го спелуваш!");
  updateUI();
}

function toggleSwitchMode() {
  if (!(target && build.length > 0)) return;

  switchMode = !switchMode;
  selectedIndex = null;
  hoverInsertIndex = null;

  if (switchBtn) switchBtn.textContent = switchMode ? "Селектирана е промена на симбол (притисни пак за да завршиш со промената)" : "Промена на симбол";
  setResult("", switchMode
    ? "Промена на симбол - кликни на симболот што сакаш да го смениш, па избери друг симбол од периодниот систем."
    : "Промената е завршена — повлечи ги елементите на лево/десно за да го смениш редоследот."
  );
  updateUI();
}

function hint() {
  if (!target) return;

  const next2 = target.slice(idx, idx + 2);
  const next1 = target.slice(idx, idx + 1);

  const suggestion =
    (next2 && symbolMap.has(next2) ? symbolMap.get(next2).symbol : null) ||
    (next1 && symbolMap.has(next1) ? symbolMap.get(next1).symbol : null) ||
    (!canFinishFrom(idx) ? `Joker` : null) ||
    "Пробај да го замениш распоредот на симболите";

  setResult("", `Помош: следниот симбол е ${suggestion}.`);
}

function check() {
  if (!target) return;

  const state = evaluateBuild();
  resolveJokersInCurrentOrder();
  updateUI();

  if (state.firstWrongIndex !== -1) {
    setResult("bad", `Погрешен симбол на позиција број ${state.firstWrongIndex + 1}. Или избриши го, или смени го распоредот.`);
    setStatus("Fix the highlighted tile.");
    return;
  }

  if (!state.isComplete) {
    const nextLetter = target[state.consumed]?.toUpperCase() ?? "";
    setResult("bad", `Не си завршен! Следната буква е “${nextLetter}”.`);
    setStatus("Keep going!");
    return;
  }

  setResult("good", `Точно! Зборот ${target.toUpperCase()} е изграден со ${build.length} хемиски симболи и: ${jokersUsed} џокери.`);
  setStatus("Perfect build!");
}

function resetAll() {
  if (wordInput) wordInput.value = "";

  target = "";
  build = [];
  jokersUsed = 0;
  idx = 0;

  switchMode = false;
  selectedIndex = null;
  hoverInsertIndex = null;
  if (switchBtn) switchBtn.textContent = "Промена на симбол";

  setStatus("Type a word and press Lock word.");
  setResult("", "");
  updateUI();
}

(async function init() {
  try {
    await loadElements();
    wireJokerTile();
    renderPeriodicTable();
    enableBuildZoneDnD();
    resetAll();
  } catch (err) {
    console.error(err);
    setResult("bad", "Could not load periodic table data.");
  }
})();

if (lockBtn) lockBtn.addEventListener("click", lockWord);
if (resetBtn) resetBtn.addEventListener("click", resetAll);
if (switchBtn) switchBtn.addEventListener("click", toggleSwitchMode);
if (hintBtn) hintBtn.addEventListener("click", hint);
if (checkBtn) checkBtn.addEventListener("click", check);
if (wordInput) {
  wordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") lockWord();
  });
}
