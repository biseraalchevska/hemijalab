document.addEventListener("DOMContentLoaded", () => {

  const reactionArea = document.getElementById("reaction-area");
  const explanation = document.getElementById("explanation");
  const balanced = document.getElementById("balanced");
  const reactionList = document.getElementById("reactionList");
  const productCard = document.getElementById("productCard");

  const quizCards = document.querySelectorAll(".predict-quiz");
  const productOptions = document.getElementById("productOptions");
  const reactionTypeOptions = document.getElementById("reactionTypeOptions");
  const submitPredictionBtn = document.getElementById("submitPrediction");

  const studentResults = document.getElementById("student-results");
  const restartBtn = document.getElementById("restartBtn");

  const TYPE_LABELS = {
    synthesis: "Синтеза",
    neutralization: "Неутрализација",
    decomposition: "Разградување",
    "no-reaction": "Нема реакција"
  };
  const reactions = [
    {
      id: "synthesis_mg_o2",
      type: "synthesis",
      reactants: [
        { formula: "Mg", name: "Магнезиум" },
        { formula: "O₂", name: "Кислород" }
      ],
      products: [{ formula: "MgO", name: "Магнезиум оксид" }],
      balanced: "2Mg + O₂ → 2MgO",
      explanation: "Магнезиумот реагира со кислородот за да состаде магнезиум оксид.",
      quiz: {
        reacts: true,
        products: ["MgO"],
        productOptions: ["MgO", "Mg₂O", "MgO₂", "Нема реакција"],
        reactionType: "synthesis"
      }
    },
    {
      id: "no_reaction_he_o2",
      type: "no-reaction",
      reactants: [
        { formula: "He", name: "Хелиум" },
        { formula: "O₂", name: "Кислород" }
      ],
      products: [],
      balanced: "Нема реакција",
      explanation: "Хелиумот е благороден гас и не реагира.",
      quiz: {
        reacts: false,
        products: [],
        productOptions: ["Нема реакција", "HeO", "HeO₂", "He₂O"],
        reactionType: "no-reaction"
      }
    },
    {
      id: "synthesis_h2_o2",
      type: "synthesis",
      reactants: [
        { formula: "H₂", name: "Водород" },
        { formula: "O₂", name: "Кислород" }
      ],
      products: [{ formula: "H₂O", name: "Вода" }],
      balanced: "2H₂ + O₂ → 2H₂O",
      explanation: "Водородот реагира со кислородот за да добиеме вода!",
      quiz: {
        reacts: true,
        products: ["H₂O"],
        productOptions: ["H₂O", "HO", "H₂O₂", "Нема реакција"],
        reactionType: "synthesis"
      }
    },
    {
      id: "neutralization_hcl_naoh",
      type: "neutralization",
      reactants: [
        { formula: "HCl", name: "Солна киселина" },
        { formula: "NaOH", name: "Натриум хидроксид" }
      ],
      products: [
        { formula: "NaCl", name: "Натриум хлорид" },
        { formula: "H₂O", name: "Вода" }
      ],
      balanced: "HCl + NaOH → NaCl + H₂O",
      explanation:
        "Солната киселина реагира со натриум хидроксид. Како резултат на неутрализацијата се добиваат сол и вода.",
      quiz: {
        reacts: true,
        products: ["NaCl"],
        productOptions: ["NaCl", "H₂O", "NaOH", "HCl", "Нема реакција"],
        reactionType: "neutralization"
      }
    }
  ];

  let currentIndex = 0;
  let currentReaction = reactions[currentIndex];

  let predictionState = {
    reacts: null,
    products: null,
    reactionType: null
  };

  const ALL_TYPES = [
    { key: "synthesis", label: "Синтеза" },
    { key: "neutralization", label: "Неутрализација" },
    { key: "decomposition", label: "Разградување" },
    { key: "no-reaction", label: "Нема реакција" }
  ];

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function goToStep(step) {
    quizCards.forEach(c => c.classList.remove("active"));
    const next = document.querySelector(`.predict-quiz[data-step="${step}"]`);
    if (next) next.classList.add("active");
  }

  function resetQuizUI() {
    predictionState = { reacts: null, products: null, reactionType: null };

    quizCards.forEach(c => c.classList.remove("active"));
    quizCards[0].classList.add("active");

    productOptions.innerHTML = "";
    reactionTypeOptions.innerHTML = "";
    studentResults.innerHTML = "";

    submitPredictionBtn.disabled = true;
    restartBtn.style.display = "none";
  }

  function loadReaction(reaction) {
    reactionArea.classList.remove("animate", "no-reaction");

    explanation.textContent = "";
    balanced.textContent = "";
    explanation.classList.remove("show");
    balanced.classList.remove("show");

    productCard.style.display = "none";

    explanation.dataset.text = reaction.explanation;
    balanced.dataset.text = reaction.balanced;

    document.querySelector("#reactantA .formula").textContent = reaction.reactants[0].formula;
    document.querySelector("#reactantA .name").textContent = reaction.reactants[0].name;

    document.querySelector("#reactantB .formula").textContent = reaction.reactants[1].formula;
    document.querySelector("#reactantB .name").textContent = reaction.reactants[1].name;

    const productFormula = productCard.querySelector(".formula");
    const productName = productCard.querySelector(".name");

    if (reaction.products.length > 0) {
      productFormula.textContent = reaction.products.map(p => p.formula).join(" + ");
      productName.textContent = reaction.products.map(p => p.name).join(" + ");
    }

    resetQuizUI();
  }

  function renderReactionList() {
    reactionList.innerHTML = "";

    reactions.forEach((reaction, index) => {
      const item = document.createElement("div");
      item.className = "reaction-item";
      item.textContent = `${reaction.reactants[0].formula} + ${reaction.reactants[1].formula}`;

      item.addEventListener("click", () => {
        currentIndex = index;
        currentReaction = reactions[index];
        loadReaction(currentReaction);
        setActiveItem(index);
      });

      reactionList.appendChild(item);
    });

    setActiveItem(currentIndex);
  }

  function setActiveItem(activeIndex) {
    document.querySelectorAll(".reaction-item").forEach((item, i) => {
      item.classList.toggle("active", i === activeIndex);
    });
  }

  function buildProductOptions() {
    productOptions.innerHTML = "";

    shuffle(currentReaction.quiz.productOptions).forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "predict-answer";
      btn.textContent = choice;

      btn.addEventListener("click", () => {
        predictionState.products = choice;
        goToStep(2);
        buildReactionTypeOptions();
      });

      productOptions.appendChild(btn);
    });
  }

  function buildReactionTypeOptions() {
    reactionTypeOptions.innerHTML = "";
    submitPredictionBtn.disabled = true;

    shuffle(ALL_TYPES).forEach(t => {
      const btn = document.createElement("button");
      btn.className = "predict-answer";
      btn.textContent = t.label;

      btn.addEventListener("click", () => {
        predictionState.reactionType = t.key;
        submitPredictionBtn.disabled = false;
      });

      reactionTypeOptions.appendChild(btn);
    });
  }

  document.querySelectorAll('.predict-quiz[data-step="0"] .predict-answer')
    .forEach(btn => {
      btn.addEventListener("click", () => {
        predictionState.reacts = (btn.dataset.value === "yes");
        goToStep(1);
        buildProductOptions();
      });
    });

  function runReveal() {
    submitPredictionBtn.disabled = true;

    if (currentReaction.type === "no-reaction") {
      reactionArea.classList.add("no-reaction");
    } else {
      reactionArea.classList.add("animate");
      if (currentReaction.products.length > 0) {
        setTimeout(() => {
          productCard.style.display = "flex";
        }, 900);
      }
    }

    setTimeout(() => {
      explanation.textContent = explanation.dataset.text;
      balanced.textContent = balanced.dataset.text;
      explanation.classList.add("show");
      balanced.classList.add("show");
    }, 1200);
  }

  function renderStudentResults() {
    const correct = currentReaction.quiz;

    const line = (ok, label, student, correct) =>
      `<div>${ok ? "✓" : "✗"} <b>${label}</b>: ${student} (точен одговор: ${correct})</div>`;

    studentResults.innerHTML = `
      <h3>Твојoт одговор</h3>
      ${line(predictionState.reacts === correct.reacts, "Реакција",
        predictionState.reacts ? "Да" : "Не",
        correct.reacts ? "Да" : "Не")}
      ${line(
        predictionState.products === (correct.reacts ? correct.products[0] : "Нема реакција"),
        "Продукти",
        predictionState.products,
        correct.reacts ? correct.products[0] : "Нема реакција"
      )}
      ${line(
        predictionState.reactionType === correct.reactionType,
        "Тип",
        TYPE_LABELS[predictionState.reactionType],
        TYPE_LABELS[correct.reactionType]
      )}
    `;
    studentResults.classList.add("show");
  }

  submitPredictionBtn.addEventListener("click", () => {
    runReveal();
    renderStudentResults();
    restartBtn.style.display = "inline-block";
  });

  restartBtn.addEventListener("click", () => {
    loadReaction(currentReaction);
  });

  loadReaction(currentReaction);
  renderReactionList();

});
