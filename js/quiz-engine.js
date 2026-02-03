let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = [];

const finishModal = document.getElementById("finishModal");
const finishModalText = document.getElementById("finishModalText");
const cancelFinishBtn = document.getElementById("cancelFinish");
const confirmFinishBtn = document.getElementById("confirmFinish");


const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

if (!quizId) {
  alert("Недостасува ID на квиз.");
  throw new Error("Quiz ID missing in URL");
}

fetch(`./data/quizzes/${quizId}.json`)
  .then(res => {
    if (!res.ok) throw new Error("Quiz JSON not found");
    return res.json();
  })
  .then(data => {
    quizData = data;
    renderQuizHeader();
    renderQuestion();
  })
  .catch(err => {
    console.error(err);
    alert("Не може да се вчита квизот.");
  });

function renderQuizHeader() {
  document.getElementById("quizTitle").textContent = quizData.topic;
}

function renderQuestion() {
  const question = quizData.questions[currentQuestionIndex];

  const questionEl = document.getElementById("questionText");
  const answersEl = document.getElementById("answers");

  questionEl.textContent = question.question;
  answersEl.innerHTML = "";

  const handleAnswer = (value, button) => {
    userAnswers[currentQuestionIndex] = value;

    document.querySelectorAll(".quiz-answer").forEach(btn => {
      btn.disabled = true;
      btn.classList.remove("selected");
    });

    button.classList.add("selected");

    renderQuestionBar();
    updateFinishButtonState();
  };

  if (question.type === "multiple-choice") {
    question.options.forEach(option => {
      const btn = document.createElement("button");
      btn.className = "quiz-answer";
      btn.textContent = option;

      if (userAnswers[currentQuestionIndex] !== undefined) {
        btn.disabled = true;
        if (userAnswers[currentQuestionIndex] === option) {
          btn.classList.add("selected");
        }
      }

      btn.onclick = () => handleAnswer(option, btn);
      answersEl.appendChild(btn);
    });
  }

  if (question.type === "true-false") {
    [
      { label: "Точно", value: true },
      { label: "Погрешно", value: false }
    ].forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "quiz-answer";
      btn.textContent = opt.label;

      if (userAnswers[currentQuestionIndex] !== undefined) {
        btn.disabled = true;
        if (userAnswers[currentQuestionIndex] === opt.value) {
          btn.classList.add("selected");
        }
      }

      btn.onclick = () => handleAnswer(opt.value, btn);
      answersEl.appendChild(btn);
    });
  }

  updateNavButtons();
  updateProgress();
  renderQuestionBar();
}

function updateFinishButtonState() {
  const finishBtn = document.getElementById("finishBtn");

  const hasAnyAnswer = userAnswers.some(ans => ans !== undefined);

  finishBtn.disabled = !hasAnyAnswer;
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const finishBtn = document.getElementById("finishBtn");

  const isLast = currentQuestionIndex === quizData.questions.length - 1;

  prevBtn.disabled = currentQuestionIndex === 0;

  nextBtn.hidden = isLast;

  prevBtn.onclick = () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    }
  };

  nextBtn.onclick = () => {
    if (!isLast) {
      currentQuestionIndex++;
      renderQuestion();
    }
  };

  finishBtn.onclick = () => {
    const total = quizData.questions.length;
    const answered = userAnswers.filter(a => a !== undefined).length;
  
    if (answered < total) {
      finishModalText.innerHTML = `
        Имате одговорено само ${answered} од ${total} прашања.<br>
        Сигурно ли сакате да го завршите квизот?
      `;
      finishModal.classList.remove("hidden");
    } else {
      finishQuiz();
    }
  };
  
}


function updateProgress() {
  document.getElementById("progress").textContent =
    `Прашање број ${currentQuestionIndex + 1} од ${quizData.questions.length}`;
}


function renderQuestionBar() {
  const bar = document.getElementById("questionBar");
  bar.innerHTML = "";

  quizData.questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.className = "question-dot";
    btn.textContent = index + 1;

    if (index === currentQuestionIndex) {
      btn.classList.add("active");
    }

    if (userAnswers[index] !== undefined) {
      btn.classList.add("answered");
    }

    btn.onclick = () => {
      currentQuestionIndex = index;
      renderQuestion();
    };

    bar.appendChild(btn);
  });
}

function finishQuiz() {
    const resultData = {
      quizId,
      answers: userAnswers
    };
  
    sessionStorage.setItem("quizResults", JSON.stringify(resultData));
    window.location.href = "./quiz-results.html";
  }
  
  cancelFinishBtn.onclick = () => {
    finishModal.classList.add("hidden");
  };
  
  confirmFinishBtn.onclick = () => {
    finishModal.classList.add("hidden");
    finishQuiz();
  };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      finishModal.classList.add("hidden");
    }
  });
    