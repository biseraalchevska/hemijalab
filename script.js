document.getElementById("year").textContent = new Date().getFullYear();

const burger = document.querySelector(".burger");
const mobileNav = document.querySelector(".mobileNav");

burger?.addEventListener("click", () => {
  const isOpen = burger.getAttribute("aria-expanded") === "true";
  burger.setAttribute("aria-expanded", String(!isOpen));
  mobileNav.hidden = isOpen;
});

const modal = document.getElementById("videoModal");
const openVideoBtn = document.getElementById("openVideo");
const frame = document.getElementById("videoFrame");

const VIDEO_ID = "dQw4w9WgXcQ";
const VIDEO_URL = `https://www.youtube.com/embed/${VIDEO_ID}`;

function openModal() {
  modal.setAttribute("aria-hidden", "false");
  frame.src = VIDEO_URL;
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  frame.src = "";
}

openVideoBtn?.addEventListener("click", openModal);

modal?.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
});

const tabs = document.querySelectorAll(".tab[data-grade]");
const gradeSections = document.querySelectorAll(".grade-section[data-grade-section]");
const searchInput = document.getElementById("quizSearch");

function setActiveTab(grade) {
  tabs.forEach(t => {
    const isActive = t.dataset.grade === grade;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });

  gradeSections.forEach(section => {
    const show = grade === "all" || section.dataset.gradeSection === grade;
    section.style.display = show ? "" : "none";
  });

  applySearchFilter();
}

function applySearchFilter() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  const cards = document.querySelectorAll(".quiz-card");

  cards.forEach(card => {
    const title = (card.dataset.title || card.textContent || "").toLowerCase();
    const tags = (card.dataset.tags || "").toLowerCase();
    const matches = !q || title.includes(q) || tags.includes(q);

    const section = card.closest(".grade-section");
    const sectionHidden = section && section.style.display === "none";
    card.style.display = (!sectionHidden && matches) ? "" : "none";
  });

  gradeSections.forEach(section => {
    const grade = section.dataset.gradeSection;
    const visibleCards = [...section.querySelectorAll(".quiz-card")]
      .filter(c => c.style.display !== "none").length;

    const countEl = document.querySelector(`.grade-count[data-count="${grade}"]`);
    if (countEl) countEl.textContent = `${visibleCards} квиз(ови)`;
  });
}

tabs.forEach(t => t.addEventListener("click", () => setActiveTab(t.dataset.grade)));
searchInput?.addEventListener("input", applySearchFilter);

if (tabs.length && gradeSections.length) {
  setActiveTab("all");
}


const expTabs = document.querySelectorAll('.tab[data-filter]');
const expSearch = document.getElementById('expSearch');
const expCards = document.querySelectorAll('#expGrid .quiz-card');

function setExpFilter(filter){
  expTabs.forEach(t => {
    const active = t.dataset.filter === filter;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  applyExpFilterAndSearch(filter);
}

function applyExpFilterAndSearch(filter){
  const q = (expSearch?.value || '').trim().toLowerCase();

  expCards.forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const type = (card.dataset.type || '').toLowerCase();

    const matchesSearch = !q || title.includes(q) || tags.includes(q);
    const matchesFilter = filter === 'all' || type.includes(filter);

    card.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
  });
}

expTabs.forEach(t => t.addEventListener('click', () => setExpFilter(t.dataset.filter)));
expSearch?.addEventListener('input', () => {
  const active = document.querySelector('.tab.is-active[data-filter]')?.dataset.filter || 'all';
  applyExpFilterAndSearch(active);
});

if (expTabs.length && expCards.length) setExpFilter('all');

const gameTabs = document.querySelectorAll('.tab[data-filter]');
const gameSearch = document.getElementById('gameSearch');
const gameGrid = document.getElementById('gamesGrid');

if (gameGrid && gameTabs.length) {
  const gameCards = gameGrid.querySelectorAll('.quiz-card');

  function applyGameFilter(filter) {
    const q = (gameSearch?.value || '').trim().toLowerCase();

    gameCards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();
      const type = (card.dataset.type || '').toLowerCase();

      const matchesSearch = !q || title.includes(q) || tags.includes(q);
      const matchesFilter = filter === 'all' || type.includes(filter);

      card.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });
  }

  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      gameTabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      applyGameFilter(tab.dataset.filter);
    });
  });

  gameSearch?.addEventListener('input', () => {
    const active =
      document.querySelector('.tab.is-active[data-filter]')?.dataset.filter || 'all';
    applyGameFilter(active);
  });

  applyGameFilter('all');
}
