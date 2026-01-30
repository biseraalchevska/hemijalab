let ELEMENTS = {};

fetch("../../data/elements.json")
  .then(r => r.json())
  .then(arr => {
    arr.forEach(el => {
      ELEMENTS[el.symbol] = el;
    });
  });

//trgni gi ovie od tuka stavi gi vo json
const reactions = [
  {
    id: "water",
    label: "H₂ + O₂ → H₂O",
    reactants: [
      { key: "h2", formula: "H₂", atoms: { H: 2 } },
      { key: "o2", formula: "O₂", atoms: { O: 2 } }
    ],
    products: [
      { key: "h2o", formula: "H₂O", atoms: { H: 2, O: 1 } }
    ]
  },
  {
    id: "co2",
    label: "C + O₂ → CO₂",
    reactants: [
      { key: "c", formula: "C", atoms: { C: 1 } },
      { key: "o2", formula: "O₂", atoms: { O: 2 } }
    ],
    products: [
      { key: "co2", formula: "CO₂", atoms: { C: 1, O: 2 } }
    ]
  },
  {
    id: "photosynthesis",
    label: "CO₂ + H₂O → C₆H₁₂O₆ + O₂",
    reactants: [
      { key: "co2", formula: "CO₂", atoms: { C: 1, O: 2 } },
      { key: "h2o", formula: "H₂O", atoms: { H: 2, O: 1 } }
    ],
    products: [
      { key: "glucose", formula: "C₆H₁₂O₆", atoms: { C: 6, H: 12, O: 6 } },
      { key: "o2", formula: "O₂", atoms: { O: 2 } }
    ]
  },
  {
    id: "double_displacement_koh_mgcl2",
    label: "KOH + MgCl₂ → KCl + Mg(OH)₂",
    reactants: [
      { key: "koh", formula: "KOH", atoms: { K: 1, O: 1, H: 1 } },
      { key: "mgcl2", formula: "MgCl₂", atoms: { Mg: 1, Cl: 2 } }
    ],
    products: [
      { key: "kcl", formula: "KCl", atoms: { K: 1, Cl: 1 } },
      { key: "mgoh2", formula: "Mg(OH)₂", atoms: { Mg: 1, O: 2, H: 2 } }
    ]
  },
  {
    id: "synthesis_n2_h2_nh3",
    label: "N₂ + H₂ → NH₃",
    reactants: [
      { key: "n2", formula: "N₂", atoms: { N: 2 } },
      { key: "h2", formula: "H₂", atoms: { H: 2 } }
    ],
    products: [
      { key: "nh3", formula: "NH₃", atoms: { N: 1, H: 3 } }
    ]
  },
  {
    id: "combustion_c2h6",
    label: "C₂H₆ + O₂ → H₂O + CO₂",
    reactants: [
      { key: "c2h6", formula: "C₂H₆", atoms: { C: 2, H: 6 } },
      { key: "o2", formula: "O₂", atoms: { O: 2 } }
    ],
    products: [
      { key: "h2o", formula: "H₂O", atoms: { H: 2, O: 1 } },
      { key: "co2", formula: "CO₂", atoms: { C: 1, O: 2 } }
    ]
  },
  {
    id: "synthesis_fe_s",
    label: "Fe + S → FeS",
    reactants: [
      { key: "fe", formula: "Fe", atoms: { Fe: 1 } },
      { key: "s", formula: "S", atoms: { S: 1 } }
    ],
    products: [
      { key: "fes", formula: "FeS", atoms: { Fe: 1, S: 1 } }
    ]
  },
  {
    id: "synthesis_na_cl2",
    label: "Na + Cl₂ → NaCl",
    reactants: [
      { key: "na", formula: "Na", atoms: { Na: 1 } },
      { key: "cl2", formula: "Cl₂", atoms: { Cl: 2 } }
    ],
    products: [
      { key: "nacl", formula: "NaCl", atoms: { Na: 1, Cl: 1 } }
    ]
  }
];

let currentReactionIndex = 0;
let currentReaction;
let coefficients = {};

function initSidebar(){
  const list = document.getElementById("reaction-list");
  list.innerHTML = "";

  reactions.forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = r.label;
    li.onclick = () => loadReaction(i);
    list.appendChild(li);
  });
}

function updateSidebar(){
  document.querySelectorAll("#reaction-list li")
    .forEach((li, i) => li.classList.toggle("active", i === currentReactionIndex));
}

function initCoefficients(reaction){
  coefficients = {};
  [...reaction.reactants, ...reaction.products].forEach(m => coefficients[m.key] = 1);
}

function renderEquationBar(reaction){
  const bar = document.getElementById("equation-bar");
  bar.innerHTML = "";

  const renderMol = mol => {
    const coef = coefficients[mol.key];
    bar.innerHTML += `
      <div class="molecule-control">
        <div class="coefficient">${coef === 1 ? "" : coef}${mol.formula}</div>
        <div class="control-buttons">
          <button class="coef-btn" data-target="${mol.key}" data-dir="-">−</button>
          <button class="coef-btn" data-target="${mol.key}" data-dir="+">+</button>
        </div>
      </div>`;
  };

  reaction.reactants.forEach((m,i)=>{
    renderMol(m);
    if(i<reaction.reactants.length-1) bar.innerHTML+=`<span class="operator">+</span>`;
  });
  bar.innerHTML += `<span class="operator">→</span>`;
  reaction.products.forEach((m,i)=>{
    renderMol(m);
    if(i<reaction.products.length-1) bar.innerHTML+=`<span class="operator">+</span>`;
  });

  attachHandlers();
}

function renderSide(id, side){
  const c = document.getElementById(id);
  c.innerHTML = "";

  side.forEach(m=>{
    for(let i=0;i<coefficients[m.key];i++){
      const d = document.createElement("div");
      d.className="molecule";

      Object.entries(m.atoms).forEach(([el,n])=>{
        for(let j=0;j<n;j++){
          const a=document.createElement("div");
          a.className="atom";
          a.textContent=el;

          if(ELEMENTS[el]){
            a.style.background = ELEMENTS[el].color;
            a.title = ELEMENTS[el].name;
          }

          d.appendChild(a);
        }
      });

      c.appendChild(d);
    }
  });
}

function renderScales(r){
  const box=document.getElementById("scales");
  box.innerHTML="";
  const els=new Set();
  [...r.reactants,...r.products].forEach(m=>Object.keys(m.atoms).forEach(e=>els.add(e)));
  els.forEach(e=>{
    box.innerHTML+=`
      <div class="scale" id="scale-${e}">
        <strong>${e}</strong>
        <div><span id="${e}-left">0</span> | <span id="${e}-right">0</span></div>
      </div>`;
  });
}

function count(side){
  const t={};
  side.forEach(m=>{
    Object.entries(m.atoms).forEach(([e,n])=>{
      t[e]=(t[e]||0)+n*coefficients[m.key];
    });
  });
  return t;
}

function updateScales(){
  const L=count(currentReaction.reactants);
  const R=count(currentReaction.products);

  Object.keys({...L,...R}).forEach(e=>{
    document.getElementById(`${e}-left`).textContent=L[e]||0;
    document.getElementById(`${e}-right`).textContent=R[e]||0;
    const b=(L[e]||0)===(R[e]||0);
    document.getElementById(`scale-${e}`).classList.toggle("balanced",b);
  });
}

function checkBalance(){
  const L=count(currentReaction.reactants);
  const R=count(currentReaction.products);
  let ok=true;

  Object.keys({...L,...R}).forEach(e=>{
    if((L[e]||0)!==(R[e]||0)) ok=false;
  });

  const f=document.getElementById("feedback");
  f.textContent=ok?"Равенката е израмнета!":"Равенката не е точно израмнета.";
  f.style.color=ok?"green":"red";
}

function render(){
  renderSide("reactants",currentReaction.reactants);
  renderSide("products",currentReaction.products);
  updateScales();
}

function attachHandlers(){
  document.querySelectorAll(".coef-btn").forEach(b=>{
    b.onclick=()=>{
      const k=b.dataset.target;
      if(b.dataset.dir==="+" )coefficients[k]++;
      if(b.dataset.dir==="-" && coefficients[k]>1)coefficients[k]--;
      document.getElementById("feedback").textContent="";
      renderEquationBar(currentReaction);
      render();
    };
  });
}

function loadReaction(i){
  currentReactionIndex=i;
  currentReaction=reactions[i];
  initCoefficients(currentReaction);
  renderEquationBar(currentReaction);
  renderScales(currentReaction);
  render();
  document.getElementById("reaction-label").textContent=currentReaction.label;
  document.getElementById("feedback").textContent="";
  updateSidebar();
}

document.getElementById("prevReaction").onclick=()=>{
  if(currentReactionIndex>0) loadReaction(currentReactionIndex-1);
};
document.getElementById("nextReaction").onclick=()=>{
  if(currentReactionIndex<reactions.length-1) loadReaction(currentReactionIndex+1);
};

document.getElementById("checkBtn").onclick=checkBalance;

initSidebar();
loadReaction(0);
