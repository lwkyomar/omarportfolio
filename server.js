const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
loadEnvFile();
const contentDir = path.join(root, "content");
const dataPath = path.join(contentDir, "site-data.json");
const adminPath = path.join(contentDir, "admin.json");
const sessions = new Map();
const port = Number(process.env.PORT || 4173);

const loginAttempts = new Map();
const ALLOWED_STATIC_FILES = new Set([
  "/index.html",
  "/admin.html",
  "/styles.css",
  "/app.js",
  "/admin.js",
  "/data.js",
  "/robots.txt",
  "/sitemap.xml"
]);

const defaultData = {
  profileImage: "",
  texts: {
    name: "İbrahimli Ömər",
    profession: "Qrafik Dizayner",
    hero: "TopAz, Lalafo və marketplace satışları üçün diqqət çəkən məhsul kartları, bannerlər və reklam materialları hazırlayıram.",
    about: "Mən İbrahimli Ömər, 17 yaşlı qrafik dizaynerəm. 1 illik təcrübəmdə əsas məqsədim hər müştəriyə etibarlı, səliqəli və nəticəyə yönəlmiş dizayn xidməti təqdim etməkdir. Layihələrə kreativ yanaşır, brendin və məhsulun real ehtiyacını nəzərə alıram. Müştəri məmnuniyyəti mənim üçün işin əsas göstəricisidir: briefi diqqətlə dinləyir, aydın kommunikasiya qurur və işi razılaşdırılmış vaxtda təhvil verməyə çalışıram. TopAz, Lalafo, marketplace kartları, bannerlər, loqolar və reklam materiallarında məqsədim sadəcə gözəl görüntü deyil, həm də satışa və güvənə xidmət edən vizual nəticə yaratmaqdır.",
    seoTitle: "İbrahimli Ömər | Qrafik Dizayner Portfolio",
    seoDescription: "TopAz, Lalafo və marketplace elanları üçün satış yönümlü məhsul kartları, loqo və banner dizaynları.",
    seoKeywords: "qrafik dizayner, TopAz kart dizaynı, Lalafo kart dizaynı, banner dizaynı, loqo dizaynı, azerbaijan",
    experienceTitle: "1 il təcrübə",
    experienceDesc: "Marketplace və reklam dizaynlarında fokuslanmış yanaşma"
  },
  contacts: {
    whatsapp: "+9940552162466",
    telegram: "@taffmvp",
    instagram: "@taffomvp",
    email: "omer.design@example.com"
  },
  services: [
    { icon: "▣", title: "Kart dizaynı", description: "TopAz, Lalafo və digər marketplace elanları üçün satış yönümlü məhsul kartları.", price: 8 },
    { icon: "◩", title: "Banner dizaynı", description: "Sosial şəbəkə, reklam və kampaniya üçün müasir banner kompozisiyaları.", price: 15 },
    { icon: "◇", title: "Loqo dizaynı", description: "Yeni biznes və şəxsi brendlər üçün təmiz, yadda qalan loqo konseptləri.", price: 35 },
    { icon: "▤", title: "Vizit kartı", description: "Premium görünüşlü, çap üçün hazır vizit kartı dizaynı.", price: 12 },
    { icon: "◫", title: "Flayer dizaynı", description: "Tədbir, kampaniya və xidmət tanıtımı üçün cəlbedici flayer dizaynı.", price: 18 }
  ],
  portfolio: Array.from({ length: 20 }, (_, index) => {
    const categories = ["TopAz kartı", "Lalafo kartı", "Marketplace", "Banner", "Loqo", "Vizit kartı", "Flayer"];
    return {
      id: `work-${index + 1}`,
      image: "",
      title: `Placeholder iş ${index + 1}`,
      category: categories[index % categories.length],
      description: "Bu sahəyə real iş şəkli, başlıq və qısa təsvir admin paneldən əlavə edilə bilər."
    };
  }),
  benefits: [
    { title: "Kreativ yanaşma", description: "Hər layihə üçün məhsula və auditoriyaya uyğun vizual istiqamət seçilir." },
    { title: "Sürətli təhvil", description: "Razılaşdırılmış müddətə hörmət edilir və proses boyunca aydın əlaqə saxlanılır." },
    { title: "Müasir dizayn", description: "Marketplace və sosial media trendlərinə uyğun təmiz, premium görünüş yaradılır." },
    { title: "Müştəri dəstəyi", description: "Brief, düzəliş və yekun fayl mərhələlərində rahat kommunikasiya təmin olunur." },
    { title: "Sərfəli qiymətlər", description: "Başlanğıc paketlər yeni bizneslər və fərdi satıcılar üçün əlçatan saxlanılır." }
  ],
  stats: [
    { value: "24-48 saat", label: "operativ təhvil seçimi" },
    { value: "AZN", label: "şəffaf qiymətləndirmə" }
  ],
  reviews: [
    { name: "Anar Qasımov", project: "TopAz satıcısı", text: "Ömər bəy çox sürətli və keyfiyyətli dizaynlar hazırladı. Satışlarımız əhəmiyyətli dərəcədə artdı. Təşəkkür edirəm!", rating: 5 },
    { name: "Leyla Məmmədova", project: "Butik sahibi", text: "Loqo və banner dizaynları üçün müraciət etdim. Tam istədiyim kimi, müasir və premium iş təhvil aldım.", rating: 5 }
  ],
  faq: [
    { id: "faq-1", question: "Sifariş prosesi necə başlayır?", answer: "Əvvəlcə layihə haqqında qısa brief alınır, sonra qiymət və təhvil müddəti razılaşdırılır." },
    { id: "faq-2", question: "Düzəliş etmək mümkündür?", answer: "Bəli, razılaşdırılmış paket daxilində dizayn üzərində düzəlişlər edilir." },
    { id: "faq-3", question: "Fayllar hansı formatda təhvil verilir?", answer: "Layihəyə uyğun olaraq JPG, PNG və lazım olduqda çap üçün uyğun formatlar təqdim olunur." },
    { id: "faq-4", question: "Təcili sifariş qəbul olunur?", answer: "Mövcud iş yükündən asılı olaraq təcili sifarişlər üçün ayrıca vaxt və qiymət razılaşdırılır." }
  ]
};

ensureContent();

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/site-data" && req.method === "GET") return sendJson(res, readData());
    if (req.url === "/api/session" && req.method === "GET") return sendJson(res, { authenticated: isAuthenticated(req) });
    if (req.url === "/api/login" && req.method === "POST") return handleLogin(req, res);
    if (req.url === "/api/logout" && req.method === "POST") return handleLogout(req, res);
    if (req.url === "/api/change-password" && req.method === "POST") return handlePasswordChange(req, res);
    if (req.url === "/api/site-data" && req.method === "PUT") return handleDataUpdate(req, res);
    if (req.url === "/api/site-data/reset" && req.method === "POST") return handleDataReset(req, res);
    return serveStatic(req, res);
  } catch (error) {
    sendJson(res, { error: "Server xətası" }, 500);
  }
});

server.listen(port, () => {
  console.log(`Portfolio saytı hazırdır: http://localhost:${port}`);
});

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = valueParts.join("=").trim();
  }
}

function ensureContent() {
  fs.mkdirSync(contentDir, { recursive: true });
  if (!fs.existsSync(dataPath)) writeJson(dataPath, defaultData);
  
  let adminConfig = null;
  if (fs.existsSync(adminPath)) {
    try {
      adminConfig = JSON.parse(fs.readFileSync(adminPath, "utf8"));
    } catch (e) {}
  }
  
  if (!adminConfig || adminConfig.username || !adminConfig.password) {
    writeJson(adminPath, {
      password: hashPassword("Taffonun127!")
    });
    console.log("Admin şifrəsi 'Taffonun127!' olaraq təyin olundu (istifadəçi adı ləğv edildi).");
  }
}

function readData() {
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function handleLogin(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockUntil > Date.now()) {
    const waitMinutes = Math.ceil((attempt.lockUntil - Date.now()) / 60000);
    return sendJson(res, { error: `Çox sayda yanlış cəhd. Zəhmət olmasa ${waitMinutes} dəqiqə gözləyin.` }, 429);
  }

  const body = await readBody(req);
  const admin = JSON.parse(fs.readFileSync(adminPath, "utf8"));
  
  const enteredPassword = body.password || "";
  const isDefaultStored = verifyPassword("Taffonun127!", admin.password) || verifyPassword("Taffnun127!", admin.password);
  
  let isValid = false;
  if (isDefaultStored) {
    isValid = (enteredPassword === "Taffonun127!" || enteredPassword === "Taffnun127!");
  } else {
    isValid = verifyPassword(enteredPassword, admin.password);
  }

  if (!isValid) {
    const current = attempt || { count: 0, lockUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockUntil = Date.now() + 15 * 60 * 1000;
      current.count = 0;
    }
    loginAttempts.set(ip, current);
    return sendJson(res, { error: "Şifrə yanlışdır" }, 401);
  }

  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { createdAt: Date.now() });
  res.setHeader("Set-Cookie", `omer_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  sendJson(res, { ok: true });
}

function handleLogout(req, res) {
  const token = getCookie(req, "omer_session");
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "omer_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  sendJson(res, { ok: true });
}

async function handlePasswordChange(req, res) {
  if (!isAuthenticated(req)) return sendJson(res, { error: "İcazə yoxdur" }, 401);
  const body = await readBody(req);
  if (!body.newPassword || body.newPassword.length < 8) return sendJson(res, { error: "Zəif şifrə" }, 400);
  const admin = JSON.parse(fs.readFileSync(adminPath, "utf8"));
  if (!verifyPassword(body.oldPassword || "", admin.password)) return sendJson(res, { error: "Yanlış şifrə" }, 400);
  admin.password = hashPassword(body.newPassword);
  writeJson(adminPath, admin);
  sendJson(res, { ok: true });
}

async function handleDataUpdate(req, res) {
  if (!isAuthenticated(req)) return sendJson(res, { error: "İcazə yoxdur" }, 401);
  const body = await readBody(req, 25 * 1024 * 1024);
  writeJson(dataPath, sanitizeData(body));
  sendJson(res, { ok: true });
}

function sanitizeImage(imageStr) {
  if (!imageStr) return "";
  const str = String(imageStr).trim();
  if (str.startsWith("data:image/") && !str.toLowerCase().includes("script") && !str.toLowerCase().includes("javascript:")) {
    const parts = str.split(",");
    if (parts.length === 2 && /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64$/.test(parts[0])) {
      return str;
    }
  }
  return "";
}

function sanitizeData(data) {
  const sanitizedPortfolio = Array.isArray(data.portfolio) ? data.portfolio.slice(0, 250).map(item => ({
    id: String(item.id || ""),
    image: sanitizeImage(item.image),
    title: String(item.title || ""),
    category: String(item.category || ""),
    description: String(item.description || "")
  })) : defaultData.portfolio;

  const sanitizedBenefits = Array.isArray(data.benefits) ? data.benefits.map(item => ({
    title: String(item.title || ""),
    description: String(item.description || "")
  })) : defaultData.benefits;

  const sanitizedStats = Array.isArray(data.stats) ? data.stats.map(item => ({
    value: String(item.value || ""),
    label: String(item.label || "")
  })) : (defaultData.stats || []);

  const sanitizedReviews = Array.isArray(data.reviews) ? data.reviews.map(item => ({
    name: String(item.name || ""),
    project: String(item.project || ""),
    text: String(item.text || ""),
    rating: Number(item.rating || 5)
  })) : (defaultData.reviews || []);

  return {
    profileImage: sanitizeImage(data.profileImage),
    texts: {
      name: String(data.texts?.name || defaultData.texts.name),
      profession: String(data.texts?.profession || defaultData.texts.profession),
      hero: String(data.texts?.hero || defaultData.texts.hero),
      about: String(data.texts?.about || defaultData.texts.about),
      seoTitle: String(data.texts?.seoTitle || ""),
      seoDescription: String(data.texts?.seoDescription || ""),
      seoKeywords: String(data.texts?.seoKeywords || ""),
      experienceTitle: String(data.texts?.experienceTitle || "1 il təcrübə"),
      experienceDesc: String(data.texts?.experienceDesc || "Marketplace və reklam dizaynlarında fokuslanmış yanaşma")
    },
    contacts: {
      whatsapp: String(data.contacts?.whatsapp || defaultData.contacts.whatsapp),
      telegram: String(data.contacts?.telegram || defaultData.contacts.telegram),
      instagram: String(data.contacts?.instagram || defaultData.contacts.instagram),
      email: String(data.contacts?.email || defaultData.contacts.email)
    },
    services: Array.isArray(data.services) ? data.services.map(item => ({
      icon: String(item.icon || ""),
      title: String(item.title || ""),
      description: String(item.description || ""),
      price: Number(item.price || 0)
    })) : defaultData.services,
    portfolio: sanitizedPortfolio,
    benefits: sanitizedBenefits,
    stats: sanitizedStats,
    reviews: sanitizedReviews,
    faq: Array.isArray(data.faq) ? data.faq.map(item => ({
      id: String(item.id || ""),
      question: String(item.question || ""),
      answer: String(item.answer || "")
    })) : defaultData.faq
  };
}

function isAuthenticated(req) {
  const token = getCookie(req, "omer_session");
  const session = token && sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, Buffer.from(originalHash, "hex"));
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error("Limit exceeded"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
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

function serveStatic(req, res) {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const fileName = requested === "/" ? "/index.html" : requested;
  if (!ALLOWED_STATIC_FILES.has(fileName)) {
    return sendText(res, "Tapılmadı", 404);
  }
  const filePath = path.normalize(path.join(root, fileName));
  if (!filePath.startsWith(root)) return sendText(res, "Qadağandır", 403);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return sendText(res, "Tapılmadı", 404);
  
  if (fileName === "/index.html") {
    let htmlContent = fs.readFileSync(filePath, "utf8");
    try {
      const siteData = readData();
      const seoTitle = siteData.texts.seoTitle || `${siteData.texts.name} | ${siteData.texts.profession}`;
      const seoDesc = siteData.texts.seoDescription || "Qrafik dizayn xidmətləri, marketplace elanları üçün satış yönümlü məhsul kartları.";
      const seoKeys = siteData.texts.seoKeywords || "qrafik dizayner, azerbaijan, portfolio";
      
      htmlContent = htmlContent.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(seoTitle)}</title>`);
      htmlContent = htmlContent.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${escapeHtml(seoDesc)}" />`);
      htmlContent = htmlContent.replace(/<meta name="keywords" content=".*?" \/>/i, `<meta name="keywords" content="${escapeHtml(seoKeys)}" />`);
      htmlContent = htmlContent.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${escapeHtml(seoTitle)}" />`);
      htmlContent = htmlContent.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${escapeHtml(seoDesc)}" />`);
    } catch (e) {}
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(htmlContent);
    return;
  }

  res.setHeader("Content-Type", mimeType(path.extname(filePath)));
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, text, status = 200) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function mimeType(ext) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}
