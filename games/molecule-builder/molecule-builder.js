const ALLOWED_ATOMS = ["H", "C", "O", "N", "S", "Na"];

// dodaj gi ovie vo json file da ne se vaka hardcoded
const molecules = [
  {
    name: "вода",
    formula: "H₂O",
    atoms: { H: 2, O: 1 },
    bonds: [
      { a: "O", b: "H", type: 1 },
      { a: "O", b: "H", type: 1 }
    ]
  },
  {
    name: "јаглерод диоксид",
    formula: "CO₂",
    atoms: { C: 1, O: 2 },
    bonds: [
      { a: "C", b: "O", type: 2 },
      { a: "C", b: "O", type: 2 }
    ]
  },
  {
    name: "сулфур диоксид",
    formula: "SO₂",
    atoms: { S: 1, O: 2 },
    bonds: [
      { a: "S", b: "O", type: 1 },
      { a: "S", b: "O", type: 1 }
    ]
  },
  {
    name: "амонијак",
    formula: "NH₃",
    atoms: { N: 1, H: 3 },
    bonds: [
      { a: "N", b: "H", type: 1 },
      { a: "N", b: "H", type: 1 },
      { a: "N", b: "H", type: 1 }
    ]
  },
  {
    name: "водород",
    formula: "H₂",
    atoms: { H: 2 },
    bonds: [
      { a: "H", b: "H", type: 1 }
    ]
  },

  {
    name: "кислород",
    formula: "O₂",
    atoms: { O: 2 },
    bonds: [
      { a: "O", b: "O", type: 2 }
    ]
  },

  {
    name: "водород пероксид",
    formula: "H₂O₂",
    atoms: { H: 2, O: 2 },
    bonds: [
      { a: "O", b: "O", type: 1 },
      { a: "O", b: "H", type: 1 },
      { a: "O", b: "H", type: 1 }
    ]
  },

  {
    name: "метан",
    formula: "CH₄",
    atoms: { C: 1, H: 4 },
    bonds: [
      { a: "C", b: "H", type: 1 },
      { a: "C", b: "H", type: 1 },
      { a: "C", b: "H", type: 1 },
      { a: "C", b: "H", type: 1 }
    ]
  },

  {
    name: "јаглерод моноксид",
    formula: "CO",
    atoms: { C: 1, O: 1 },
    bonds: [
      { a: "C", b: "O", type: 2 }
    ]
  },
  {
    name: "натриум хидроксид",
    formula: "NaOH",
    atoms: { Na: 1, O: 1, H: 1 },
    bonds: [
      { a: "O", b: "H", type: 1 },
      { a: "Na", b: "O", type: 1 }
    ]
  },
  {
    name: "азотен диоксид",
    formula: "NO₂",
    atoms: { N: 1, O: 2 },
    bonds: [
      { a: "N", b: "O", type: 2 },
      { a: "N", b: "O", type: 1 }
    ]
  }
];

// elementite 
let ELEMENTS = [];
let elementMap = new Map();

async function loadElements() {
  const res = await fetch("../../data/elements.json");
  if (!res.ok) throw new Error("Failed to load elements.json");
  ELEMENTS = await res.json();
  elementMap = new Map(ELEMENTS.map(e => [e.symbol, e]));
}

function isDark(hex) {
  if (!hex) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 160;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadElements();
  initGame();
});

function initGame() {

  const workspace = document.getElementById("workspace");
  const atomPalette = document.getElementById("atomPalette");

  const checkBtn = document.getElementById("checkBtn");
  const resetBtn = document.getElementById("resetBtn");

  const singleBondBtn = document.getElementById("singleBondBtn");
  const doubleBondBtn = document.getElementById("doubleBondBtn");
  const tripleBondBtn = document.getElementById("tripleBondBtn");

  const resultBar = document.getElementById("resultBar");
  const resultText = document.getElementById("resultText");
  const tryAgainBtn = document.getElementById("tryAgainBtn");


  let atomCounter = 0;
  let bondMode = false;
  let bondFirstAtom = null;
  let currentBondType = 1;

  const placedAtoms = [];
  const placedBonds = [];

//atom
  function renderAtomPalette() {
    atomPalette.innerHTML = "";

    ALLOWED_ATOMS.forEach(symbol => {
      const el = elementMap.get(symbol);
      if (!el) return;

      const atom = document.createElement("div");
      atom.className = "atom";
      atom.textContent = symbol;
      atom.draggable = true;
      atom.dataset.atom = symbol;

      atom.style.backgroundColor = el.color || "#777";
      atom.style.color = isDark(el.color) ? "#fff" : "#000";

      atom.addEventListener("dragstart", e => {
        e.dataTransfer.setData("atomType", symbol);
      });

      atomPalette.appendChild(atom);
    });
  }

  renderAtomPalette();


  //povleci 
  workspace.addEventListener("dragover", e => e.preventDefault());

  workspace.addEventListener("drop", e => {
    e.preventDefault();
    const type = e.dataTransfer.getData("atomType");
    if (!type) return;

    const element = elementMap.get(type);
    const rect = workspace.getBoundingClientRect();

    const atom = document.createElement("div");
    atom.className = "placed-atom";
    atom.textContent = type;
    atom.dataset.id = String(atomCounter++);

    atom.style.left = `${e.clientX - rect.left - 28}px`;
    atom.style.top = `${e.clientY - rect.top - 28}px`;
    atom.style.backgroundColor = element?.color || "#777";
    atom.style.color = isDark(element?.color) ? "#fff" : "#000";

    atom.addEventListener("click", () => {
      if (bondMode) handleBondClick(atom.dataset.id);
    });

    workspace.appendChild(atom);
    placedAtoms.push({ id: atom.dataset.id, type, el: atom });
  });

  function resetResultBar() {
    resultBar.classList.remove("is-visible", "good", "bad", "partial");
    resultText.textContent = "";
  }

  //vrski
  function setBondType(type) {
    bondMode = true;
    bondFirstAtom = null;
    currentBondType = type;

    [singleBondBtn, doubleBondBtn, tripleBondBtn]
      .forEach(btn => btn.classList.remove("active-bond-btn"));

    if (type === 1) singleBondBtn.classList.add("active-bond-btn");
    if (type === 2) doubleBondBtn.classList.add("active-bond-btn");
    if (type === 3) tripleBondBtn.classList.add("active-bond-btn");
  }

  singleBondBtn.onclick = () => setBondType(1);
  doubleBondBtn.onclick = () => setBondType(2);
  tripleBondBtn.onclick = () => setBondType(3);

  function handleBondClick(atomId) {
    const atomObj = placedAtoms.find(a => a.id === atomId);
    if (!atomObj) return;

    if (!bondFirstAtom) {
      bondFirstAtom = atomId;
      atomObj.el.classList.add("selected-atom");
      return;
    }

    if (bondFirstAtom === atomId) {
      atomObj.el.classList.remove("selected-atom");
      bondFirstAtom = null;
      return;
    }

    const first = placedAtoms.find(a => a.id === bondFirstAtom);
    const second = atomObj;

    const bond = {
      atomAId: first.id,
      atomBId: second.id,
      atomAEl: first.el,
      atomBEl: second.el,
      type: currentBondType,
      lineEls: []
    };

    for (let i = 0; i < currentBondType; i++) {
      const line = document.createElement("div");
      line.className = "bond-line";
      line.dataset.offset = i - (currentBondType - 1) / 2;
      workspace.appendChild(line);
      bond.lineEls.push(line);
    }

    placedBonds.push(bond);
    updateBondLine(bond);

    first.el.classList.remove("selected-atom");
    bondFirstAtom = null;
  }

  function updateBondLine(bond) {
    const rect = workspace.getBoundingClientRect();
    const a = bond.atomAEl.getBoundingClientRect();
    const b = bond.atomBEl.getBoundingClientRect();

    const ax = a.left + a.width / 2 - rect.left;
    const ay = a.top + a.height / 2 - rect.top;
    const bx = b.left + b.width / 2 - rect.left;
    const by = b.top + b.height / 2 - rect.top;

    const dx = bx - ax;
    const dy = by - ay;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    bond.lineEls.forEach(line => {
      const offset = line.dataset.offset * 6;
      line.style.left = `${ax - offset * Math.sin(angle)}px`;
      line.style.top = `${ay + offset * Math.cos(angle)}px`;
      line.style.width = `${length}px`;
      line.style.transform = `rotate(${angle}rad)`;
    });
  }

  window.addEventListener("resize", () => {
    placedBonds.forEach(updateBondLine);
  });


  //kopcinja
  checkBtn.onclick = () => {
    const counts = {};
    placedAtoms.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1);

    const mol = molecules.find(m => sameCounts(counts, m.atoms));

    resultBar.classList.add("is-visible");
    resultBar.classList.remove("good", "bad", "partial");

    if (!mol) {
      resultText.textContent = "Молекулата не е точна.";
      resultBar.classList.add("bad");
    }
    else if (checkBondsExact(mol)) {
      resultText.textContent = `Точна молекула! ${mol.name} (${mol.formula})`;
      resultBar.classList.add("good");
    }
    else {
      resultText.textContent =
        "Атомите се точни, но врските помеѓу нив се погрешни.";
      resultBar.classList.add("partial");
    }
  };


  tryAgainBtn.onclick = () => {
    resetGame();
    resetResultBar()};

    //helpers
  function sameCounts(a, b) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    return ka.every(k => a[k] === b[k]);
  }

  function bondKey(a, b, t) {
    return `${t}:${[a, b].sort().join("-")}`;
  }

  function checkBondsExact(mol) {
    const req = {};
    mol.bonds.forEach(b => {
      const k = bondKey(b.a, b.b, b.type);
      req[k] = (req[k] || 0) + 1;
    });

    const placed = {};
    placedBonds.forEach(b => {
      const a = placedAtoms.find(x => x.id === b.atomAId).type;
      const c = placedAtoms.find(x => x.id === b.atomBId).type;
      const k = bondKey(a, c, b.type);
      placed[k] = (placed[k] || 0) + 1;
    });

    return sameCounts(req, placed);
  }


//reset
  function resetGame() {
    placedAtoms.forEach(a => a.el.remove());
    placedBonds.forEach(b => b.lineEls.forEach(l => l.remove()));
    placedAtoms.length = 0;
    placedBonds.length = 0;
    atomCounter = 0;
    bondFirstAtom = null;
    bondMode = false;
  }

  resetBtn.onclick = resetGame;
}
