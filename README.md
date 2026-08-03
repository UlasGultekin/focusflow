# FocusFlow 🚀
> **Masaüstü Odaklanma, Görev, Takvim ve Alışkanlık Yönetim Uygulaması**

FocusFlow; Electron, React 19, Vite, Tailwind CSS ve sql.js (WebAssembly SQLite) teknolojileri ile geliştirilmiş modern, şık ve tam teşekküllü bir masaüstü kişisel üretkenlik komuta merkezidir.

---

## 🌟 Öne Çıkan Özellikler

### 1. 📋 Görev Yönetimi & Pomodoro Odaklanma
- Manuel süre başlatma veya dairesel geri sayım animasyonlu **Pomodoro Sayacı** (Odak, Kısa Mola, Uzun Mola modları).
- Öncelik, kategori, zaman tahmini, harcanan süre takibi ve renk kodlaması.

### 2. 📊 Kanban Görev Panosu (Board)
- **Yapılacak (Todo)** → **Devam Eden (In Progress)** → **Tamamlanan (Done)** sütunları.
- Toplam görev sayısı ve dinamik tamamlanma yüzdesi göstergesi.
- Bir göreve başlandığında otomatik olarak *In Progress* sütununa taşınma entegrasyonu.

### 3. 📅 Dahili Takvim & Günlük Zaman Planlayıcı
- Herhangi bir dış servise ihtiyaç duymadan çalışan **07:00 – 23:00** saatlik zaman çizelgesi.
- Belirli saat dilimlerine etkinlik veya görev atama.
- Çakışan planlarda otomatik **Zaman Çakışması Uyarısı**.

### 4. 🎓 Eğitimler & Kurslar (Learning Hub)
- Udemy, YouTube veya ders linklerini ekleme.
- **"Tarayıcıda Aç"** butonu ile bağlantıları tek tıkla bilgisayarınızın varsayılan web tarayıcısında açma.
- **Canlı Geçen Süre Sayacı (`MM:SS`)**: Eğitime çalışırken anlık sürenizi izleme.
- Ders bittiğinde harcanan zamanın otomatik olarak **Tamamlanmış Görev (Done)** olarak kaydedilmesi.

### 5. 🔥 Alışkanlık Takibi & Zinciri Kırma (Streak)
- Günlük tekrar eden eylemler (su iç, kitap oku, egzersiz yap vb.).
- **Ardışık Günlük Seri (Streak)** hesabı ve alev simgesi.
- **30 Günlük Isı Haritası Grid'i**: Son 30 gündeki tamamlama geçmişinin görsel takibi.

### 6. 📖 Günlük Düşünce & Akış Notları (Journal)
- Takvim tabanlı serbest metin alanı.
- **5'li Ruh Hali Seçici (Mood Tracker)**: 😞 😐 🙂 😊 🤩 emojileri ile duygusal durum kaydı.
- 1.5 saniye sonra otomatik veritabanına kayıt (**Debounce Auto-Save**).

### 7. 📁 Dosya ve Klasör Ekleri (Attachments)
- Görevlere bilgisayarınızdan dosya veya klasör yolları bağlama.
- **"Aç"** butonu ile dosyayı/klasörü işletim sisteminin varsayılan uygulamasında açma (`shell.openPath`).

### 8. 🔒 Görev Ön Koşulları & Kilit Sistemi (Dependencies)
- Görevler arası engelleme ilişkileri tanımlama (Blocks / Relates To).
- Ön koşul görev tamamlanmadan hedef görevin *"Şimdi Göreve Başla"* butonunun kilitlenmesi ve Board kartında kilit ikonu (`🔒`) gösterimi.

### 9. 📋 Görev İçinde Alt Görevler (Checklist / Subtasks)
- Ana görevleri küçük adımlara bölme.
- Yeşil canlı ilerleme çubuğu ve tamamlama oranı (`2 / 5 tamamlandı %40`).
- Adımlar bittiğinde ana görevi otomatik tamamlama seçeneği.

### 10. 📝 Oturum Notları (Session Notes)
- Pomodoro veya odaklanma seansı tamamlandığında beliren **15 saniyelik geri sayımlı Not Modalı**.
- Seans esnasında akla gelen fikirleri anında kaydetme.
- Görev detayında oturum notlarının kronolojik gösterimi ve satır içi düzenleme.

### 11. 🔍 Gelişmiş Arama & Komut Paleti (`Ctrl + Shift + F`)
- Her yerden erişilebilen **`Ctrl + Shift + F` Komut Paleti**.
- Canlı arama önerileri (suggestions) ve filtre çipleri (Görevler, Notlar, Günlük, Oturumlar, Dosyalar).
- Fosforlu `<mark>` metin vurgulu sonuçlar sayfası ve doğrudan içeriğe yönlendirme.
- **"İndeksi Yenile"** ile tüm veritabanını anında yeniden indeksleme.

### 🎨 Tema & Sistem Tepsisi (Tray)
- **Soft Light**, **Deep Dark** ve **Pastel Calm** renk temaları.
- Sistem tepsisinde (Tray) arka planda çalışma ve `Ctrl+Shift+Space` küresel kısayol tuşu.

---

## 💻 Kurulum ve Çalıştırma Adımları

Uygulamayı yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla takip edin:

### 1. Ön Gereksinimler
- Bilgisayarınızda **Node.js v20 LTS veya daha yeni sürüm** kurulu olmalıdır (Electron 34 gereksinimi). Node sürümünüzü kontrol etmek için:
  ```bash
  node -v
  ```

> **⚠️ Bilgisayarınızda farklı bir Node.js sürümü kuruluysa (örn. v14)?**
> Endişelenmeyin — mevcut Node sürümünüze dokunmadan **nvm-windows** ile birden fazla Node versiyonunu yan yana kullanabilirsiniz. Detaylar için aşağıdaki "nvm-windows Kullanımı" bölümüne bakın.

---

### 🔄 Farklı Node.js Sürümü Kullananlar İçin: nvm-windows

Bilgisayarınızda başka bir projeniz için Node.js v14 (veya başka bir sürüm) kurulu ise, mevcut kurulumunuza **dokunmadan** Node 20'yi yükleyip sadece bu proje için kullanabilirsiniz.

#### Adım 1 — nvm-windows'u Yükleyin

1. [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases) adresine gidin.
2. En son `nvm-setup.exe` dosyasını indirin ve yükleyin.
3. Yükleme tamamlandıktan sonra terminali (PowerShell veya CMD) kapatıp yeniden açın.

#### Adım 2 — Node.js v20'yi nvm ile Yükleyin

Mevcut Node sürümünüze dokunulmadan Node 20 yüklenir:

```powershell
nvm install 20
nvm list          # Yüklü tüm versiyonları listeler
```

Çıktı şuna benzeyecektir:
```
  * 14.21.3 (currently active)
    20.19.0
```

#### Adım 3 — FocusFlow'u Çalıştırmadan Önce Node 20'ye Geçin

```powershell
nvm use 20
node -v           # v20.x.x çıktısı görmelisiniz
```

#### Adım 4 — Projeyi Normal Şekilde Çalıştırın

```powershell
npm install
npm run dev       # Geliştirici modu
# veya
npm run build     # .exe paketi oluştur
```

#### Adım 5 — İşiniz Bitince Eski Sürüme Dönün

```powershell
nvm use 14
node -v           # v14.x.x — eski projeniz etkilenmez ✅
```

> **📌 Not:** nvm, her Node sürümü için tamamen bağımsız bir `node_modules` ortamı tutar. İki proje birbirini hiçbir şekilde etkilemez.

---

### 2. Repoyu Klonlayın
```bash
git clone https://github.com/UlasGultekin/focusflow.git
cd focusflow
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Geliştirici Modunda Çalıştırın (Development)
Uygulamayı canlı sıcak yeniden yükleme (HMR) ile başlatmak için:
```bash
npm run dev
```

### 5. Production Masaüstü Paketi Derleme (Build)
Uygulamanın çalıştırılabilir `.exe` (Windows) paketini derlemek için:
```bash
npm run build
```

---

## 🛠️ Proje Mimarısı & Teknoloji Yığını

- **Masaüstü Çatısı**: [Electron](https://www.electronjs.org/)
- **Kullanıcı Arayüzü**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Stil & Tasarım**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Veritabanı Motoru**: `sql.js` (WebAssembly SQLite - C++ derleme bağımlılığı olmadan yerel `.db` dosyasında veri saklar)
- **Durum Yönetimi (State)**: [Zustand](https://github.com/pmndrs/zustand)
- **Grafikler & Analiz**: [Recharts](https://recharts.org/)

---

## 📝 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Dilediğiniz gibi geliştirebilir ve özelleştirebilirsiniz.
