# Supabase Content (`cms_items`)

> **Admin panel sudah tidak ada.** Panel `/admin/*` beserta login Google OAuth-nya
> dihapus di commit `afea5be` ("refactor: hardcode site content and remove the
> admin CMS"). Hampir semua konten situs sekarang hardcoded di dalam kode.
> Dokumen ini hanya menjelaskan bagian Supabase yang **masih benar-benar dipakai**.

## Yang masih dibaca saat runtime

Satu koleksi saja, yaitu `ai-faq` dari tabel `cms_items`:

| Pembaca | Jalur |
|---|---|
| `api/ai-faq.js` | `buildPortfolioAssistantContext()` |
| `api/ai-assistant.js` | `buildPortfolioAssistantContext()` |

Keduanya lewat `api/_lib/cmsFaqContext.js:45`, yang memanggil
`readPublishedCmsItems('ai-faq', { limit: 30 })` dari `api/_lib/cms.js` — satu-satunya
call site `readPublishedCmsItems` di seluruh repo.

Isi koleksi ini jadi konteks pengetahuan untuk AI assistant di landing page.
Kalau Supabase belum dikonfigurasi atau koleksinya kosong, kedua endpoint jatuh
ke konteks default yang sudah hardcoded.

## Setup

1. Buat project Supabase.
2. Jalankan `supabase/experience-cms.sql` lewat Supabase SQL Editor (idempoten).
   File ini yang membuat tabel `cms_items`.
3. Jalankan `supabase/cms-seed.sql` untuk data awal. Memakai
   `on conflict do update`, jadi aman diulang.
4. Buat `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Sisi server (`api/_lib/cms.js`, `api/_lib/supabaseRest.js`) menerima
`SUPABASE_URL` / `SUPABASE_ANON_KEY`, dan jatuh ke varian `VITE_` kalau tidak ada.

**Gunakan anon key saja di env frontend. Jangan pernah memasukkan service role key
ke file env frontend** — apa pun yang ber-prefix `VITE_` akan di-inline Vite ke
bundle klien, sementara service role mem-bypass seluruh RLS.

## Cara mengubah konten sekarang

Karena tidak ada lagi UI admin, `ai-faq` diedit langsung lewat **Supabase
dashboard atau SQL Editor** (atau dengan menyunting `supabase/cms-seed.sql` lalu
menjalankannya ulang).

## Soal RLS dan `is_admin()`

Perlu dicatat supaya tidak membingungkan saat membaca SQL-nya: `experience-cms.sql`
**masih** mendefinisikan `is_admin()` (`experience-cms.sql:121`), yang mencocokkan
`auth.jwt() ->> 'email'` dengan `awahid.safhadi@gmail.com`, lengkap dengan policy
insert/update/delete untuk admin di tiap tabel.

Policy itu masih berlaku di level database. Yang hilang adalah **antarmukanya** —
tidak ada satu pun file di `src/` yang menyentuh `supabase.auth`, dan
`src/lib/supabaseClient.js:16` mematikan sesi secara eksplisit
(`persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`).
Jadi aplikasi ini tidak pernah menghasilkan JWT yang bisa lolos `is_admin()`.

Yang tetap aktif dan relevan: pengunjung hanya bisa membaca baris dengan
`is_published = true`.

## Tabel dan koleksi yang tidak lagi dibaca

`experience-cms.sql` dan `cms-seed.sql` masih membuat dan mengisi lebih banyak
tabel dan koleksi daripada yang dipakai. Berikut yang **tidak** dibaca oleh kode
mana pun saat ini:

- Tabel `experiences` — `src/components/Experience.jsx:40` memakai konstanta
  `EXPERIENCES` dari `src/lib/experienceData.js`
- Tabel `projects` beserta `project_focus`, `project_scope`, `project_stack`,
  `project_outcomes`, `project_signals` — data portfolio hardcoded di
  `src/components/Portfolio.jsx`
- Koleksi `cms_items`: `profile`, `services`, `skills`, `certificates`, `about`,
  `contact`, `settings`, `api-settings`

Semuanya dibiarkan apa adanya, bukan dihapus — tetapi jangan berharap mengubahnya
akan mengubah tampilan situs.

## AI provider settings

Konfigurasi runtime SumoPod dibaca **dari environment variable saja**, bukan dari
`cms_items`. `getSumopodConfig()` di `api/_lib/sumopod.js` membaca:

```env
SUMOPOD_API_KEY=your_sumopod_api_key
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
SUMOPOD_MODEL=["gpt-4o-mini","gpt-4.1-mini"]
SUMOPOD_TIMEOUT_MS=12000
```

Koleksi `api-settings-sumopod` di seed masih ada, tapi tidak ada kode yang
membacanya.
