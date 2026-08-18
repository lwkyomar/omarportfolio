let adminData = getSiteData();
let serverMode = false;
const html = document.documentElement;
html.dataset.theme = localStorage.getItem("omerPortfolioTheme") || "dark";

async function initAdmin() {
  bindAuth();
  bindAdminActions();
  try {
    const response = await fetch("/api/session", { credentials: "same-origin" });
    if (response.ok) {
      serverMode = true;
      const session = await response.json();
      if (session.authenticated) await showAdmin();
      return;
    }
  } catch {
    serverMode = false;
  }
  document.getElementById("loginStatus").textContent = "Admin panel təhlükəsizlik üçün serverlə açılmalıdır. Saytı npm start ilə başladın.";
}

function bindAuth() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (serverMode) {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        await showAdmin();
        return;
      }
      document.getElementById("loginStatus").textContent = "İstifadəçi adı və ya şifrə yanlışdır.";
      return;
    }
    document.getElementById("loginStatus").textContent = "Admin panel təhlükəsizlik üçün serverlə açılmalıdır.";
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

  document.getElementById("addService").addEventListener("click", () => {
    adminData.services.push({ icon: "▣", title: "Yeni xidmət", description: "Xidmət təsviri", price: 10 });
    renderServicesEditor();
  });

  document.getElementById("addWork").addEventListener("click", () => {
    adminData.portfolio.unshift({ id: cryptoRandomId(), image: "", title: "Yeni iş", category: "Kateqoriya", description: "İş haqqında qısa təsvir" });
    renderPortfolioEditor();
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

  document.getElementById("resetData").addEventListener("click", async () => {
    if (!confirm("Bütün sayt məlumatları ilkin vəziyyətə qayıtsın?")) return;
    if (serverMode) {
      await fetch("/api/site-data/reset", { method: "POST", credentials: "same-origin" });
    } else {
      localStorage.removeItem("omerPortfolioData");
    }
    adminData = await loadSiteData();
    fillGeneralFields();
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
  document.getElementById("siteName").value = adminData.texts.name;
  document.getElementById("siteProfession").value = adminData.texts.profession;
  document.getElementById("heroTextInput").value = adminData.texts.hero;
  document.getElementById("aboutTextInput").value = adminData.texts.about;
  document.getElementById("contactWhatsapp").value = adminData.contacts.whatsapp;
  document.getElementById("contactTelegram").value = adminData.contacts.telegram;
  document.getElementById("contactInstagram").value = adminData.contacts.instagram;
  document.getElementById("contactEmail").value = adminData.contacts.email;
}

function collectGeneralFields() {
  adminData.texts.name = document.getElementById("siteName").value.trim();
  adminData.texts.profession = document.getElementById("siteProfession").value.trim();
  adminData.texts.hero = document.getElementById("heroTextInput").value.trim();
  adminData.texts.about = document.getElementById("aboutTextInput").value.trim();
  adminData.contacts.whatsapp = document.getElementById("contactWhatsapp").value.trim();
  adminData.contacts.telegram = document.getElementById("contactTelegram").value.trim();
  adminData.contacts.instagram = document.getElementById("contactInstagram").value.trim();
  adminData.contacts.email = document.getElementById("contactEmail").value.trim();
}

function renderAllEditors() {
  renderServicesEditor();
  renderPortfolioEditor();
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
      <div class="item-actions"><button class="danger-button" type="button" data-delete-work="${index}">Sil</button></div>
    </article>
  `).join("");

  bindFieldUpdates("work", adminData.portfolio);
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

initAdmin();
