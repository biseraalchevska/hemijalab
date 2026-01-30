//done sea za sea
let allQuizzes = [];
let activeGrade = "all";

//data za kvizovite od json
fetch("./data/quizzes.json")
  .then(res => {
    if (!res.ok) throw new Error("Failed to load quizzes.json");
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data)) {
      throw new Error("quizzes.json must export an array");
    }

    allQuizzes = data;

    renderQuizzes(allQuizzes);
    updateCounts(allQuizzes);
    setupSearch();
    setupGradeTabs();
  })
  .catch(err => {
    console.error("Quiz loading error:", err);
  });


// po odd
function renderQuizzes(quizzes) {
  document.querySelectorAll(".grade-section").forEach(section => {
    const grid = section.querySelector(".quiz-grid");
    if (grid) grid.innerHTML = "";
  });

  quizzes.forEach(quiz => {
    const section = document.querySelector(
      `.grade-section[data-grade-section="${quiz.grade}"]`
    );

    if (!section) return;

    const grid = section.querySelector(".quiz-grid");
    if (!grid) return;

    const card = document.createElement("a");
    card.className = "quiz-card";
    card.href = `take-quiz.html?id=${quiz.id}`;

    // prebaruvanje
    card.dataset.title = quiz.title.toLowerCase();
    card.dataset.tags = quiz.tags.join(" ").toLowerCase();
    card.dataset.grade = quiz.grade;

    card.innerHTML = `
      <div class="quiz-card__top">
        <span class="badge">${quiz.grade} одд.</span>
      </div>
      <h4>${quiz.title}</h4>
      <p>${quiz.tags.join(", ")}</p>
    `;

    grid.appendChild(card);
  });
}


// kolku ima
function updateCounts(quizzes) {
  [7, 8, 9].forEach(g => {
    const count = quizzes.filter(q => q.grade === g).length;
    const countEl = document.querySelector(`[data-count="${g}"]`);
    if (countEl) {
      countEl.textContent = `${count} квиз${count === 1 ? "" : "ови"}`;
    }
  });
}


// prebaruvanje
function setupSearch() {
  const searchInput = document.getElementById("quizSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = allQuizzes.filter(q => {
      const text =
        q.title.toLowerCase() +
        " " +
        q.tags.join(" ").toLowerCase();

      const matchesSearch = text.includes(query);
      const matchesGrade =
        activeGrade === "all" || q.grade === Number(activeGrade);

      return matchesSearch && matchesGrade;
    });

    renderQuizzes(filtered);
    updateCounts(filtered);
  });
}


// filter
function setupGradeTabs() {
  const tabs = document.querySelectorAll(".grade-tabs .tab");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      activeGrade = tab.dataset.grade;

      const filtered =
        activeGrade === "all"
          ? allQuizzes
          : allQuizzes.filter(q => q.grade === Number(activeGrade));

      renderQuizzes(filtered);
      updateCounts(filtered);
    });
  });
}
