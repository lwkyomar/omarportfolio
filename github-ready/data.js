const DEFAULT_SITE_DATA = {
  profileImage: "",
  texts: {
    name: "İbrahimli Ömər",
    profession: "Qrafik Dizayner",
    hero: "TopAz, Lalafo və marketplace satışları üçün diqqət çəkən məhsul kartları, bannerlər və reklam materialları hazırlayıram.",
    about: "Mən İbrahimli Ömər, 17 yaşlı qrafik dizaynerəm. 1 illik təcrübəmdə əsas məqsədim hər müştəriyə etibarlı, səliqəli və nəticəyə yönəlmiş dizayn xidməti təqdim etməkdir. Layihələrə kreativ yanaşır, brendin və məhsulun real ehtiyacını nəzərə alıram. Müştəri məmnuniyyəti mənim üçün işin əsas göstəricisidir: briefi diqqətlə dinləyir, aydın kommunikasiya qurur və işi razılaşdırılmış vaxtda təhvil verməyə çalışıram. TopAz, Lalafo, marketplace kartları, bannerlər, loqolar və reklam materiallarında məqsədim sadəcə gözəl görüntü deyil, həm də satışa və güvənə xidmət edən vizual nəticə yaratmaqdır."
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
      id: cryptoRandomId(),
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
  faq: [
    { id: cryptoRandomId(), question: "Sifariş prosesi necə başlayır?", answer: "Əvvəlcə layihə haqqında qısa brief alınır, sonra qiymət və təhvil müddəti razılaşdırılır." },
    { id: cryptoRandomId(), question: "Düzəliş etmək mümkündür?", answer: "Bəli, razılaşdırılmış paket daxilində dizayn üzərində düzəlişlər edilir." },
    { id: cryptoRandomId(), question: "Fayllar hansı formatda təhvil verilir?", answer: "Layihəyə uyğun olaraq JPG, PNG və lazım olduqda çap üçün uyğun formatlar təqdim olunur." },
    { id: cryptoRandomId(), question: "Təcili sifariş qəbul olunur?", answer: "Mövcud iş yükündən asılı olaraq təcili sifarişlər üçün ayrıca vaxt və qiymət razılaşdırılır." }
  ]
};

function cryptoRandomId() {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return `id-${array[0].toString(16)}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    faq: incoming.faq || base.faq
  };
}
