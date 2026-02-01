const stored = sessionStorage.getItem("quizResults");

if (!stored) {
  alert("Нема податоци за резултатите.");
  window.location.href = "./quiz.html";
  throw new Error("No quiz results found");
}

const { quizId, answers } = JSON.parse(stored);

fetch(`./data/quizzes/${quizId}.json`)
  .then(res => {
    if (!res.ok) throw new Error("Quiz JSON not found");
    return res.json();
  })
  .then(quizData => {
    renderResults(quizData, answers);
    setupCollapsibleCards();  
    setupRetryButton();
  })
  .catch(err => {
    console.error(err);
    alert("Грешка при вчитување резултати.");
  });



function renderResults(quizData, userAnswers) {
  const titleEl = document.getElementById("resultTitle");
  const summaryEl = document.getElementById("resultsSummary");

  const correctCountEl = document.getElementById("correctCount");
  const incorrectCountEl = document.getElementById("incorrectCount");
  const unansweredCountEl = document.getElementById("unansweredCount");

  const correctListEl = document.getElementById("correctList");
  const incorrectListEl = document.getElementById("incorrectList");
  const unansweredListEl = document.getElementById("unansweredList");

  titleEl.textContent = quizData.topic;

  const correct = [];
  const incorrect = [];
  const unanswered = [];

  quizData.questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];

    if (userAnswer === undefined) {
      unanswered.push({ q, index });
    } else if (userAnswer === q.correctAnswer) {
      correct.push({ q, index });
    } else {
      incorrect.push({ q, index, userAnswer });
    }
  });

  correctCountEl.textContent = correct.length;
  incorrectCountEl.textContent = incorrect.length;
  unansweredCountEl.textContent = unanswered.length;

  summaryEl.innerHTML = `
    <div class="summary-stat">
      <strong>Резултат:</strong> ${correct.length} / ${quizData.questions.length}
    </div>
    <p class="summary-message">
      ${getEncouragement(correct.length, quizData.questions.length)}
    </p>
  `;

  renderList(correct, correctListEl, "correct");
  renderList(incorrect, incorrectListEl, "incorrect");
  renderList(unanswered, unansweredListEl, "unanswered");
}



function renderList(items, container, type) {
  container.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "—";
    container.appendChild(li);
    return;
  }

  items.forEach(({ q, index, userAnswer }) => {
    const li = document.createElement("li");

    let html = `<strong>${index + 1}. ${q.question}</strong>`;

    if (type === "correct") {
      html += `
        <br>
        <small>Точен одговор: ${formatAnswer(q.correctAnswer)}</small>
      `;
    }

    if (type === "incorrect") {
      html += `
        <br>
        <small>Твојот одговор: ${formatAnswer(userAnswer)}</small><br>
        <small>Точен одговор: ${formatAnswer(q.correctAnswer)}</small>
      `;
    }

    if (type === "unanswered") {
      html += `
        <br>
        <small>Точен одговор: ${formatAnswer(q.correctAnswer)}</small>
      `;
    }

    li.innerHTML = html;
    container.appendChild(li);
  });
}



function setupCollapsibleCards() {
  const cards = document.querySelectorAll(".results-card");

  cards.forEach(card => {
    const header = card.querySelector(".results-header");

    header.addEventListener("click", () => {
      const isOpen = card.classList.contains("open");

      cards.forEach(c => c.classList.remove("open"));

      if (!isOpen) {
        card.classList.add("open");
      }
    });
  });
}



function formatAnswer(value) {
  if (value === true) return "Точно";
  if (value === false) return "Погрешно";
  if (value === undefined) return "Не е одговорено";
  return value;
}

function getEncouragement(correct, total) {
  const ratio = correct / total;

  if (ratio === 1) return "Браво! Продолжи така!";
  if (ratio >= 0.75) return "Многу добро!";
  if (ratio >= 0.5) return "Добар обид — продолжи со вежбање";
  return "Продолжи да вежбаш за да добиеш подобар резултат!!";
}


function setupRetryButton() {
  const retryBtn = document.getElementById("retryBtn");
  if (!retryBtn) return;

  retryBtn.onclick = () => {
    sessionStorage.removeItem("quizResults");
    window.location.href = `./take-quiz.html?id=${quizId}`;
  };
}
