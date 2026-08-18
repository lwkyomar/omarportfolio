let adminData = getSiteData();
let serverMode = false;
const html = document.documentElement;
html.dataset.theme = localStorage.getItem("omerPortfolioTheme") || "dark";

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function initAdmin() {
  bindAuth();
  bindAdminActions();
  try {
    const response = await fetch("/api/session", { credentials: "same-origin" });
    if (response.ok) {
      serverMode = true;
      const session = await response.json();
      if (session.authenticated) {
        await showAdmin();
        return;
      }
    }
  } catch (e) {
    serverMode = false;
  }
  
  if (!serverMode) {
    const localSession = sessionStorage.getItem("omerAdminSession");
    if (localSession === "active") {
      await showAdmin();
    }
  }
}

function bindAuth() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("password").value;
    if (serverMode) {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        await showAdmin();
        return;
      }
      const errData = await response.json().catch(() => ({}));
      document.getElementById("loginStatus").textContent = errData.error || "Şifrə yanlışdır.";
      return;
    } else {
      const hashed = await sha256(password);
      if (hashed === "c7150b654058355380431bdd5fbfaee49cc1da1a154372ee427753c039d3e315" || 
          hashed === "bb43951cd37a0349164b71c676f15a4d85129caddefedeca4f7fd59900996558") {
        sessionStorage.setItem("omerAdminSession", "active");
        await showAdmin();
        return;
      }
      document.getElementById("loginStatus").textContent = "Şifrə yanlışdır.";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (serverMode) {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    }
    sessionStorage.removeItem("omerAdminSession");
    location.reload();
  });
}

async function showAdmin() {
  adminData = await loadSiteData();
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminShell").classList.remove("hidden");
  fillGeneralFields();
  fillSeoFields();
  renderAllEditors();
}

function bindAdminActions() {
  document.getElementById("themeToggle").addEventListener("click", () => {
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("omerPortfolioTheme", html.dataset.theme);
  });

  document.getElementById("profileImageInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    adminData.profileImage = await fileToDataUrl(file);
    setStatus("Profil şəkli hazırlandı. Yadda saxlamağı unutmayın.");
  });

  document.getElementById("addStat").addEventListener("click", () => {
    if (!adminData.stats) adminData.stats = [];
    adminData.stats.push({ value: "Yeni göstərici", label: "Açıqlama" });
    renderStatsEditor();
  });

  document.getElementById("addService").addEventListener("click", () => {
    adminData.services.push({ icon: "▣", title: "Yeni xidmət", description: "Xidmət təsviri", price: 10 });
    renderServicesEditor();
  });

  document.getElementById("addWork").addEventListener("click", () => {
    adminData.portfolio.unshift({ id: cryptoRandomId(), image: "", title: "Yeni iş", category: "Kateqoriya", description: "İş haqqında qısa təsvir" });
    renderPortfolioEditor();
  });

  document.getElementById("addBenefit").addEventListener("click", () => {
    if (!adminData.benefits) adminData.benefits = [];
    adminData.benefits.push({ title: "Yeni üstünlük", description: "Üstünlük təsviri" });
    renderBenefitsEditor();
  });

  document.getElementById("addFaq").addEventListener("click", () => {
    adminData.faq.push({ id: cryptoRandomId(), question: "Yeni sual", answer: "Cavab mətni" });
    renderFaqEditor();
  });



  document.getElementById("saveAll").addEventListener("click", async () => {
    collectGeneralFields();
    const savedOnServer = await persistSiteData(adminData);
    setStatus(savedOnServer ? "Dəyişikliklər serverdə yadda saxlanıldı." : "Dəyişikliklər lokal yaddaşda saxlanıldı.");
  });

  document.getElementById("exportData").addEventListener("click", () => {
    downloadDataFile();
  });

  document.getElementById("resetData").addEventListener("click", async () => {
    if (!confirm("Bütün sayt məlumatları ilkin vəziyyətə qayıtsın?")) return;
    if (serverMode) {
      await fetch("/api/site-data/reset", { method: "POST", credentials: "same-origin" });
    } else {
      localStorage.removeItem("omerPortfolioData");
    }
    adminData = await loadSiteData();
    fillGeneralFields();
    fillSeoFields();
    renderAllEditors();
    setStatus("Məlumatlar ilkin vəziyyətə qaytarıldı.");
  });

  document.getElementById("changePassword").addEventListener("click", async () => {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    if (serverMode) {
      const response = await fetch("/api/change-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (!response.ok) {
        setStatus("Şifrə dəyişdirilə bilmədi. Köhnə şifrəni və yeni şifrənin uzunluğunu yoxlayın.", true);
        return;
      }
      clearPasswordFields();
      setStatus("Şifrə serverdə dəyişdirildi.");
      return;
    }
    setStatus("Şifrə yalnız server rejimində dəyişdirilə bilər.", true);
  });
}

function fillGeneralFields() {
  document.getElementById("siteName").value = adminData.texts.name || "";
  document.getElementById("siteProfession").value = adminData.texts.profession || "";
  document.getElementById("siteExperienceTitle").value = adminData.texts.experienceTitle || "";
  document.getElementById("siteExperienceDesc").value = adminData.texts.experienceDesc || "";
  document.getElementById("heroTextInput").value = adminData.texts.hero || "";
  document.getElementById("aboutTextInput").value = adminData.texts.about || "";
  document.getElementById("contactWhatsapp").value = adminData.contacts.whatsapp || "";
  document.getElementById("contactTelegram").value = adminData.contacts.telegram || "";
  document.getElementById("contactInstagram").value = adminData.contacts.instagram || "";
  document.getElementById("contactEmail").value = adminData.contacts.email || "";
}

function collectGeneralFields() {
  adminData.texts.name = document.getElementById("siteName").value.trim();
  adminData.texts.profession = document.getElementById("siteProfession").value.trim();
  adminData.texts.experienceTitle = document.getElementById("siteExperienceTitle").value.trim();
  adminData.texts.experienceDesc = document.getElementById("siteExperienceDesc").value.trim();
  adminData.texts.hero = document.getElementById("heroTextInput").value.trim();
  adminData.texts.about = document.getElementById("aboutTextInput").value.trim();
  adminData.contacts.whatsapp = document.getElementById("contactWhatsapp").value.trim();
  adminData.contacts.telegram = document.getElementById("contactTelegram").value.trim();
  adminData.contacts.instagram = document.getElementById("contactInstagram").value.trim();
  adminData.contacts.email = document.getElementById("contactEmail").value.trim();
  collectSeoFields();
}

function fillSeoFields() {
  document.getElementById("seoTitleInput").value = adminData.texts.seoTitle || "";
  document.getElementById("seoDescInput").value = adminData.texts.seoDescription || "";
  document.getElementById("seoKeywordsInput").value = adminData.texts.seoKeywords || "";
}

function collectSeoFields() {
  adminData.texts.seoTitle = document.getElementById("seoTitleInput").value.trim();
  adminData.texts.seoDescription = document.getElementById("seoDescInput").value.trim();
  adminData.texts.seoKeywords = document.getElementById("seoKeywordsInput").value.trim();
}

function renderAllEditors() {
  renderStatsEditor();
  renderServicesEditor();
  renderPortfolioEditor();
  renderBenefitsEditor();
  renderFaqEditor();
}

function renderServicesEditor() {
  document.getElementById("servicesEditor").innerHTML = adminData.services.map((service, index) => `
    <article class="editor-item">
      <div class="editor-grid">
        <label>İkon<input value="${escapeAttr(service.icon)}" data-service="${index}" data-field="icon" /></label>
        <label>Başlıq<input value="${escapeAttr(service.title)}" data-service="${index}" data-field="title" /></label>
        <label>Qiymət AZN<input type="number" min="0" value="${escapeAttr(service.price)}" data-service="${index}" data-field="price" /></label>
        <label>Təsvir<input value="${escapeAttr(service.description)}" data-service="${index}" data-field="description" /></label>
      </div>
      <div class="item-actions"><button class="danger-button" type="button" data-delete-service="${index}">Sil</button></div>
    </article>
  `).join("");

  bindFieldUpdates("service", adminData.services);
  document.querySelectorAll("[data-delete-service]").forEach((button) => {
    button.addEventListener("click", () => {
      adminData.services.splice(Number(button.dataset.deleteService), 1);
      renderServicesEditor();
    });
  });
}

function renderPortfolioEditor() {
  document.getElementById("portfolioEditor").innerHTML = adminData.portfolio.map((work, index) => `
    <article class="editor-item">
      <div class="editor-grid">
        <label>Başlıq<input value="${escapeAttr(work.title)}" data-work="${index}" data-field="title" /></label>
        <label>Kateqoriya<input value="${escapeAttr(work.category)}" data-work="${index}" data-field="category" /></label>
      </div>
      <label>Təsvir<textarea rows="3" data-work="${index}" data-field="description">${escapeHtml(work.description)}</textarea></label>
      <label>Şəkil dəyiş<input type="file" accept="image/*" data-work-image="${index}" /></label>
      <div class="item-actions">
        <button class="ghost-button" type="button" data-move-up="${index}" ${index === 0 ? 'disabled style="opacity:0.5; cursor:default;"' : ''}>↑ Yuxarı</button>
        <button class="ghost-button" type="button" data-move-down="${index}" ${index === adminData.portfolio.length - 1 ? 'disabled style="opacity:0.5; cursor:default;"' : ''}>↓ Aşağı</button>
        <button class="danger-button" type="button" data-delete-work="${index}">Sil</button>
      </div>
    </article>
  `).join("");

  bindFieldUpdates("work", adminData.portfolio);
  
  document.querySelectorAll("[data-move-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const idx = Number(button.dataset.moveUp);
      if (idx > 0) {
        const temp = adminData.portfolio[idx];
        adminData.portfolio[idx] = adminData.portfolio[idx - 1];
        adminData.portfolio[idx - 1] = temp;
        renderPortfolioEditor();
      }
    });
  });

  document.querySelectorAll("[data-move-down]").forEach((button) => {
    button.addEventListener("click", () => {
      const idx = Number(button.dataset.moveDown);
      if (idx < adminData.portfolio.length - 1) {
        const temp = adminData.portfolio[idx];
        adminData.portfolio[idx] = adminData.portfolio[idx + 1];
        adminData.portfolio[idx + 1] = temp;
        renderPortfolioEditor();
      }
    });
  });

  document.querySelectorAll("[data-work-image]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      adminData.portfolio[Number(input.dataset.workImage)].image = await fileToDataUrl(file);
      setStatus("Portfolio şəkli hazırlandı. Yadda saxlayın.");
    });
  });
  document.querySelectorAll("[data-delete-work]").forEach((button) => {
    button.addEventListener("click", () => {
      adminData.portfolio.splice(Number(button.dataset.deleteWork), 1);
      renderPortfolioEditor();
    });
  });
}

function renderFaqEditor() {
  document.getElementById("faqEditor").innerHTML = adminData.faq.map((item, index) => `
    <article class="editor-item">
      <label>Sual<input value="${escapeAttr(item.question)}" data-faq="${index}" data-field="question" /></label>
      <label>Cavab<textarea rows="3" data-faq="${index}" data-field="answer">${escapeHtml(item.answer)}</textarea></label>
      <div class="item-actions"><button class="danger-button" type="button" data-delete-faq="${index}">Sil</button></div>
    </article>
  `).join("");

  bindFieldUpdates("faq", adminData.faq);
  document.querySelectorAll("[data-delete-faq]").forEach((button) => {
    button.addEventListener("click", () => {
      adminData.faq.splice(Number(button.dataset.deleteFaq), 1);
      renderFaqEditor();
    });
  });
}

function bindFieldUpdates(kind, list) {
  document.querySelectorAll(`[data-${kind}]`).forEach((field) => {
    field.addEventListener("input", () => {
      const index = Number(field.dataset[kind]);
      const key = field.dataset.field;
      list[index][key] = key === "price" ? Number(field.value) : field.value;
    });
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setStatus(message, isError = false) {
  const status = document.getElementById("saveStatus");
  status.textContent = message;
  status.style.color = isError ? "var(--danger)" : "var(--success)";
}

function clearPasswordFields() {
  document.getElementById("oldPassword").value = "";
  document.getElementById("newPassword").value = "";
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

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function renderStatsEditor() {
  if (!adminData.stats) adminData.stats = [];
  document.getElementById("statsEditor").innerHTML = adminData.stats.map((item, index) => `
    <article class="editor-item">
      <div class="editor-grid">
        <label>Göstərici (məs. 24-48 saat)<input value="${escapeAttr(item.value)}" data-stat="${index}" data-field="value" /></label>
        <label>Açıqlama (məs. təhvil seçimi)<input value="${escapeAttr(item.label)}" data-stat="${index}" data-field="label" /></label>
      </div>
      <div class="item-actions">
        <button class="danger-button" type="button" data-delete-stat="${index}">Sil</button>
      </div>
    </article>
  `).join("");

  bindFieldUpdates("stat", adminData.stats);
  document.querySelectorAll("[data-delete-stat]").forEach((button) => {
    button.addEventListener("click", () => {
      adminData.stats.splice(Number(button.dataset.deleteStat), 1);
      renderStatsEditor();
    });
  });
}

function renderBenefitsEditor() {
  if (!adminData.benefits) adminData.benefits = [];
  document.getElementById("benefitsEditor").innerHTML = adminData.benefits.map((benefit, index) => `
    <article class="editor-item">
      <div class="editor-grid">
        <label>Başlıq<input value="${escapeAttr(benefit.title)}" data-benefit="${index}" data-field="title" /></label>
        <label>Təsvir<input value="${escapeAttr(benefit.description)}" data-benefit="${index}" data-field="description" /></label>
      </div>
      <div class="item-actions">
        <button class="danger-button" type="button" data-delete-benefit="${index}">Sil</button>
      </div>
    </article>
  `).join("");

  bindFieldUpdates("benefit", adminData.benefits);
  document.querySelectorAll("[data-delete-benefit]").forEach((button) => {
    button.addEventListener("click", () => {
      adminData.benefits.splice(Number(button.dataset.deleteBenefit), 1);
      renderBenefitsEditor();
    });
  });
}



function downloadDataFile() {
  collectGeneralFields();
  const dataJson = JSON.stringify(adminData, null, 2);
  const fileContent = `const DEFAULT_SITE_DATA = ${dataJson};

function cryptoRandomId() {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return \`id-\${array[0].toString(16)}\`;
  }
  return \`id-\${Date.now()}-\${Math.random().toString(16).slice(2)}\`;
}

function getSiteData() {
  const stored = localStorage.getItem("omerPortfolioData");
  if (!stored) return structuredClone(DEFAULT_SITE_DATA);
  try {
    return mergeData(structuredClone(DEFAULT_SITE_DATA), JSON.parse(stored));
  } catch {
    return structuredClone(DEFAULT_SITE_DATA);
  }
}

function saveSiteData(data) {
  localStorage.setItem("omerPortfolioData", JSON.stringify(data));
}

async function loadSiteData() {
  try {
    const response = await fetch("/api/site-data", { credentials: "same-origin" });
    if (response.ok) return mergeData(structuredClone(DEFAULT_SITE_DATA), await response.json());
  } catch {
    return getSiteData();
  }
  return getSiteData();
}

async function persistSiteData(data) {
  try {
    const response = await fetch("/api/site-data", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (response.ok) return true;
  } catch {
    saveSiteData(data);
    return false;
  }
  saveSiteData(data);
  return false;
}

function mergeData(base, incoming) {
  return {
    ...base,
    ...incoming,
    texts: { ...base.texts, ...(incoming.texts || {}) },
    contacts: { ...base.contacts, ...(incoming.contacts || {}) },
    services: incoming.services || base.services,
    portfolio: incoming.portfolio || base.portfolio,
    benefits: incoming.benefits || base.benefits,
    stats: incoming.stats || base.stats,
    reviews: incoming.reviews || base.reviews,
    faq: incoming.faq || base.faq
  };
}
`;

  const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "data.js";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

initAdmin();
