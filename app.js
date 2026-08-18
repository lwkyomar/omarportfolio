let data = getSiteData();
let currentWork = 0;

const html = document.documentElement;
const savedTheme = localStorage.getItem("omerPortfolioTheme") || "dark";
html.dataset.theme = savedTheme;

document.getElementById("year").textContent = new Date().getFullYear();

let activeCategory = "all";

async function init() {
  data = await loadSiteData();
  renderTexts();
  renderContacts();
  renderStats();
  renderServices();
  renderPortfolioFilters();
  renderPortfolio();
  renderBenefits();
  renderFaq();
  bindEvents();
  revealOnScroll();
}

function renderTexts() {
  const title = data.texts.seoTitle || `${data.texts.name} | ${data.texts.profession}`;
  document.title = title;

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && data.texts.seoDescription) descMeta.content = data.texts.seoDescription;
  const keysMeta = document.querySelector('meta[name="keywords"]');
  if (keysMeta && data.texts.seoKeywords) keysMeta.content = data.texts.seoKeywords;

  document.getElementById("heroName").textContent = data.texts.name;
  document.getElementById("heroProfession").textContent = data.texts.profession;
  document.getElementById("heroText").textContent = data.texts.hero;
  document.getElementById("aboutText").textContent = data.texts.about;

  const trustTitle = document.getElementById("trustTitle");
  const trustDesc = document.getElementById("trustDesc");
  if (trustTitle) trustTitle.textContent = data.texts.experienceTitle || "1 il təcrübə";
  if (trustDesc) trustDesc.textContent = data.texts.experienceDesc || "Marketplace və reklam dizaynlarında fokuslanmış yanaşma";

  const image = document.getElementById("profileImage");
  const placeholder = document.getElementById("profilePlaceholder");
  if (data.profileImage) {
    image.src = data.profileImage;
    image.style.display = "block";
    placeholder.style.display = "none";
  } else {
    image.style.display = "none";
    placeholder.style.display = "grid";
  }
}

function renderContacts() {
  const phone = data.contacts.whatsapp.replace(/[^\d+]/g, "");
  const telegramUser = data.contacts.telegram.replace("@", "");
  const instagramUser = data.contacts.instagram.replace("@", "");
  const whatsappUrl = `https://wa.me/${phone.replace("+", "")}`;
  const telegramUrl = `https://t.me/${telegramUser}`;
  const instagramUrl = `https://instagram.com/${instagramUser}`;

  setLink("primaryContact", whatsappUrl);
  setLink("whatsappHero", whatsappUrl);
  setLink("telegramHero", telegramUrl);
  setLink("instagramHero", instagramUrl);
}

function setLink(id, href, label) {
  const element = document.getElementById(id);
  element.href = href;
  if (label) element.textContent = label;
}

function renderStats() {
  const band = document.getElementById("statsBand");
  if (!band) return;
  const items = data.stats || [];
  band.innerHTML = items.map(item => `
    <div>
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>
  `).join("");
}

function renderServices() {
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = data.services.map((service) => `
    <article class="service-card reveal">
      <span class="service-icon">${escapeHtml(service.icon)}</span>
      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.description)}</p>
      <strong>${Number(service.price).toLocaleString("az-AZ")} AZN-dən</strong>
    </article>
  `).join("");
}

function getFilteredWorks() {
  if (activeCategory === "all") return data.portfolio;
  return data.portfolio.filter(work => work.category === activeCategory);
}

function renderPortfolioFilters() {
  const container = document.getElementById("portfolioFilters");
  if (!container) return;

  const categories = new Set();
  data.portfolio.forEach(work => {
    if (work.category) categories.add(work.category.trim());
  });

  const list = ["all", ...Array.from(categories)];

  container.innerHTML = list.map(cat => {
    const label = cat === "all" ? "Hamısı" : cat;
    const activeClass = cat === activeCategory ? "active" : "";
    return `
      <button class="filter-tab ${activeClass}" type="button" data-category="${escapeHtml(cat)}">
        ${escapeHtml(label)}
      </button>
    `;
  }).join("");

  container.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.category;
      currentWork = 0;
      renderPortfolioFilters();
      renderPortfolio();
    });
  });
}

function renderPortfolio() {
  const track = document.getElementById("portfolioTrack");
  const filtered = getFilteredWorks();
  const works = filtered.slice(currentWork, currentWork + visibleWorkCount());

  if (works.length === 0) {
    track.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:2rem;">Bu kateqoriyada hələ heç bir iş yoxdur.</p>`;
    return;
  }

  track.innerHTML = works.map((work, index) => `
    <article class="work-card reveal" style="animation-delay:${index * 80}ms">
      <div class="work-image">
        ${work.image ? `<img src="${work.image}" alt="${escapeHtml(work.title)}" loading="lazy" />` : `<span>Şəkil placeholder</span>`}
      </div>
      <div class="work-body">
        <span>${escapeHtml(work.category)}</span>
        <h3>${escapeHtml(work.title)}</h3>
        <p>${escapeHtml(work.description)}</p>
      </div>
    </article>
  `).join("");
  revealOnScroll();
}

function visibleWorkCount() {
  if (window.innerWidth < 720) return 1;
  if (window.innerWidth < 1080) return 2;
  return 3;
}

function renderBenefits() {
  document.getElementById("benefitsGrid").innerHTML = data.benefits.map((benefit) => `
    <article class="benefit reveal">
      <h3>${escapeHtml(benefit.title)}</h3>
      <p>${escapeHtml(benefit.description)}</p>
    </article>
  `).join("");
}

function renderReviews() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;
  const reviews = data.reviews || [];
  grid.innerHTML = reviews.map(review => {
    const stars = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5));
    return `
      <article class="review-card reveal">
        <div>
          <div class="review-stars">${stars}</div>
          <p class="review-text">"${escapeHtml(review.text)}"</p>
        </div>
        <div class="review-author">
          <strong>${escapeHtml(review.name)}</strong>
          <span>${escapeHtml(review.project)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderFaq() {
  document.getElementById("faqList").innerHTML = data.faq.map((item) => `
    <details>
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>
  `).join("");
}

function bindEvents() {
  document.getElementById("themeToggle").addEventListener("click", () => {
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("omerPortfolioTheme", html.dataset.theme);
  });

  document.getElementById("prevWork").addEventListener("click", () => {
    currentWork = Math.max(0, currentWork - visibleWorkCount());
    renderPortfolio();
  });

  document.getElementById("nextWork").addEventListener("click", () => {
    const filtered = getFilteredWorks();
    const maxIndex = Math.max(0, filtered.length - visibleWorkCount());
    currentWork = Math.min(maxIndex, currentWork + visibleWorkCount());
    renderPortfolio();
  });

  window.addEventListener("resize", () => {
    const filtered = getFilteredWorks();
    currentWork = Math.min(currentWork, Math.max(0, filtered.length - visibleWorkCount()));
    renderPortfolio();
  });
}

function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

init();
