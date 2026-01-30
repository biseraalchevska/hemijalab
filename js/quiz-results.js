//done sega za sega ama treba da se preraboti
const stored = sessionStorage.getItem("quizResults");

if (!stored) {
  alert("Нема податоци за резултати.");
  window.location.href = "./quiz.html";
}

const { quizId, answers } = JSON.parse(stored);

// zemi go kvizot od json
fetch(`./data/quizzes/${quizId}.json`)
  .then(res => {
    if (!res.ok) throw new Error("Quiz JSON not found");
    return res.json();
  })
  .then(quizData => {
    renderResults(quizData, answers);
  })
  .catch(err => {
    console.error(err);
    alert("Грешка при вчитување резултати.");
  });

//rezultatite ama ne se zavrseni vaka ne se dobri
function renderResults(quizData, userAnswers) {
  const titleEl = document.getElementById("resultTitle");
  const scoreEl = document.getElementById("resultScore");
  const listEl = document.getElementById("resultsList");

  titleEl.textContent = quizData.topic;

  let correctCount = 0;

  quizData.questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === q.correctAnswer;

    if (isCorrect) correctCount++;

    const item = document.createElement("div");
    item.className = `result-item ${isCorrect ? "correct" : "wrong"}`;

    item.innerHTML = `
      <h3>
        ${index + 1}. ${q.question}
        <span class="result-icon">${isCorrect ? "✓" : "✗"}</span>
      </h3>

      <p><strong>Твој одговор:</strong> ${formatAnswer(userAnswer)}</p>
      <p><strong>Точен одговор:</strong> ${formatAnswer(q.correctAnswer)}</p>
    `;

    listEl.appendChild(item);
  });

  scoreEl.textContent =
    `Резултат: ${correctCount} / ${quizData.questions.length}`;
}

// ------------------------------------
function formatAnswer(value) {
  if (value === true) return "Точно";
  if (value === false) return "Погрешно";
  if (value === undefined) return "Не е одговорено";
  return value;
}
