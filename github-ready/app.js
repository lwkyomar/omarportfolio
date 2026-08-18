let data = getSiteData();
let currentWork = 0;

const html = document.documentElement;
const savedTheme = localStorage.getItem("omerPortfolioTheme") || "dark";
html.dataset.theme = savedTheme;

document.getElementById("year").textContent = new Date().getFullYear();

async function init() {
  data = await loadSiteData();
  renderTexts();
  renderContacts();
  renderServices();
  renderPortfolio();
  renderBenefits();
  renderFaq();
  bindEvents();
  revealOnScroll();
}

function renderTexts() {
  document.title = `${data.texts.name} | ${data.texts.profession}`;
  document.getElementById("heroName").textContent = data.texts.name;
  document.getElementById("heroProfession").textContent = data.texts.profession;
  document.getElementById("heroText").textContent = data.texts.hero;
  document.getElementById("aboutText").textContent = data.texts.about;

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

function renderPortfolio() {
  const track = document.getElementById("portfolioTrack");
  const works = data.portfolio.slice(currentWork, currentWork + visibleWorkCount());
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
    const maxIndex = Math.max(0, data.portfolio.length - visibleWorkCount());
    currentWork = Math.min(maxIndex, currentWork + visibleWorkCount());
    renderPortfolio();
  });

  window.addEventListener("resize", () => {
    currentWork = Math.min(currentWork, Math.max(0, data.portfolio.length - visibleWorkCount()));
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
