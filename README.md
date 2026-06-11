# ⚽ WC 2026 Tahmin Yarışması

Dünya Kupası 2026 grup maçları tahmin oyunu. Oda oluştur, arkadaşlarını davet et, tahminleri yap, puanları takip et.

## 🚀 Deploy (5 dakika)

### 1. Supabase

- [supabase.com](https://supabase.com) → New Project oluştur
- SQL Editor'a git → `supabase-schema.sql` dosyasının içeriğini yapıştır → Run
- Settings > API sayfasından kopyala:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Vercel

```bash
npm install
```

`.env.local.example` → `.env.local` olarak kopyala, Supabase bilgilerini yapıştır.

```bash
npx vercel
```

Vercel Dashboard'da Environment Variables'a da aynı değerleri ekle.

### 3. Kullan

- Siteye gir → "Yeni Oda Oluştur" → oda adı + ismin → Oda kodu alırsın
- Kodu arkadaşlarına at (veya "Paylaş" butonuna bas)
- Herkes kendi tahmini 1/X/2 basar
- Maç bitince admin sonucu girer → puanlar otomatik hesaplanır
- Canlı güncelleme: biri tahmin girince herkesin ekranı anında yansır

## 📋 Kurallar

- 🎯 Doğru maç tahmini = **3 puan**
- 🏆 Doğru grup sıralaması = **5 puan** (pozisyon başına, sıra önemli!)
- Sonuç girildikten sonra o maçın tahmini kilitleni

## 🏗️ Stack

- Next.js 14 (App Router)
- Supabase (PostgreSQL + Realtime)
- Tailwind CSS
- Vercel

## 📁 Yapı

```
src/
├── app/
│   ├── page.jsx          ← Ana sayfa (oda oluştur/katıl)
│   └── room/[code]/
│       └── page.jsx      ← Oyun sayfası
└── lib/
    ├── supabase.js       ← Supabase client
    └── matches.js        ← Gruplar, bayraklar, puan hesaplama
```
