# İbrahimli Ömər Portfolio Saytı

Bu paket premium portfolio saytı, admin panel və sadə Node.js backend ilə birlikdə hazırlanıb.

## İşə salma

```powershell
cd C:\Users\Omar\Documents\Codex\2026-06-09\s-n-pe-kar-ui-ux\outputs
npm start
```

Sayt:

```text
http://localhost:4173
```

Admin panel:

```text
http://localhost:4173/admin.html
```

Admin girişi:

```text
İstifadəçi adı: admin
Şifrə: serverdə gizli saxlanılır
```

Lokal `content/admin.json` faylında şifrə yalnız hash kimi saxlanılır. Bu fayl `.gitignore` içindədir və GitHub-a yüklənməməlidir.

Serverə yerləşdirəndə admin şifrəsini kodda yazmayın. Hostinq panelində secret/environment dəyişəni kimi `ADMIN_PASSWORD` təyin edin.

## Fayl strukturu

```text
outputs/
  index.html        Ana portfolio səhifəsi
  admin.html        İdarəetmə paneli
  styles.css        Responsiv dizayn, tema və animasiyalar
  data.js           İlkin sayt datası və data oxuma/yazma köməkçiləri
  app.js            Ana səhifənin render və interaktiv məntiqi
  admin.js          Admin panel məntiqi
  server.js         Node.js backend, login, sessiya və data API
  package.json      Start komandası
  robots.txt        SEO indeksləmə qaydaları
  sitemap.xml       SEO sitemap
  .env.example      Gizli environment dəyişənləri üçün nümunə
  .gitignore        GitHub-a düşməməli fayllar
  content/          Server işə düşəndə avtomatik yaranır
    site-data.json  Sayt məzmunu
    admin.json      Admin istifadəçi və hash-lənmiş şifrə
```

## Admin paneldən dəyişdirilə bilənlər

- Profil şəkli
- Hero və haqqımda mətnləri
- Xidmətlər və AZN qiymətləri
- Portfolio işləri, başlıq, kateqoriya, təsvir və şəkillər
- FAQ sualları
- Admin şifrəsi

## GitHub təhlükəsizliyi

GitHub-a yükləməzdən əvvəl bu faylların commit olunmadığını yoxlayın:

```text
content/admin.json
content/site-data.json
.env
```

Admin parolunu heç vaxt `server.js`, `admin.js`, `README.md` və ya başqa açıq fayla yazmayın. Lokal və ya hostinq mühitində `.env` və ya platformanın secret panelindən istifadə edin.

## Qeyd

Sayt serverlə açıldıqda məlumatlar `content/site-data.json` faylında saxlanılır. Faylı birbaşa brauzerdə açsanız, sayt yenə işləyir, amma dəyişikliklər brauzerin lokal yaddaşında qalır.
