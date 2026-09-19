# Supabase

Situs ini tidak lagi memakai CMS. Seluruh konten — profil, pengalaman, project,
sertifikat, dan konteks untuk AI assistant — hardcoded di dalam kode.

Supabase sekarang dipakai untuk tiga hal yang saling tidak berhubungan.

## 1. Visitor counter (README generator)

| Bagian | Lokasi |
|---|---|
| Endpoint | `api/visitor-count.js` |
| Helper | `api/_lib/pageViews.js` |
| Skema | `supabase/page-views.sql` |

Menaikkan dan membaca penghitung kunjungan untuk badge SVG yang dipasang di
README GitHub. Satu baris per `key` di tabel `public.page_views`.

Penambahan counter lewat RPC `increment_page_view`, bukan `update` langsung.
Function-nya `security definer` supaya anon key bisa menaikkan angka satu per
satu tanpa punya hak tulis ke tabel — kalau punya, siapa pun bisa menulis angka
sembarangan. RLS di tabelnya hanya mengizinkan `select`.

## 2. Arsip Q&A AI assistant

| Bagian | Lokasi |
|---|---|
| Helper | `api/_lib/qaArchive.js` |
| Pemanggil | `api/ai-faq.js`, `api/ai-assistant.js` |
| Skema | `supabase/assistant-qa.sql` |

Menyimpan pertanyaan pengunjung beserta jawaban assistant ke tabel
`public.assistant_qa`. Ini **fase 1** dari RAG: mengumpulkan korpus. Fase 2
nanti menambah kolom `embedding` dan pencarian kemiripan di tabel yang sama,
supaya jawaban lama bisa jadi konteks tambahan saat ada pertanyaan serupa.

Beberapa keputusan desain yang tidak terlihat dari kodenya:

- **RLS aktif tanpa policy sama sekali.** Tabel ini berisi pertanyaan orang
  lain. Anon key itu publik (ikut ter-bundle ke klien lewat `VITE_`), jadi
  policy untuk `anon` sama saja dengan policy untuk semua orang. Service role
  mem-bypass RLS dan jadi satu-satunya penulis.
- **`SUPABASE_SERVICE_ROLE_KEY` dibaca tanpa fallback `VITE_`.** Helper
  Supabase lain di repo ini jatuh ke nama `VITE_` kalau nama utamanya kosong;
  melakukan itu pada key yang mem-bypass RLS akan membocorkan database.
- **Jawaban yang ditolak scope-guard tidak diarsipkan.** Penolakan bukan
  jawaban tentang Wahid, dan akan jadi contoh yang buruk untuk di-retrieve.
- **Kegagalan menyimpan tidak pernah menggagalkan respons.** `recordQaSafe()`
  menelan semua error, sama seperti `sendN8nEventSafe()`. Kalau
  `SUPABASE_SERVICE_ROLE_KEY` tidak diset, arsipnya dilewati diam-diam dan
  assistant tetap berjalan normal.
- **Tapi kegagalannya dicatat.** Error ditelan, bukan disembunyikan: tanpa log,
  key yang salah terlihat persis sama dengan fitur yang sengaja dimatikan —
  sama-sama tabel kosong dan endpoint sehat. `recordQaSafe()` menulis
  `console.warn` berisi nama tabel dan alasannya saja; Vercel menangkapnya di
  function logs. Isi pertanyaan dan jawaban pengunjung **tidak pernah** ikut
  di-log.
- **Retensi 90 hari dijalankan berbarengan dengan insert**, bukan lewat
  `pg_cron`, supaya tidak butuh extension apa pun. Pindahkan ke `pg_cron`
  kalau trafiknya naik. Atur lewat `ASSISTANT_QA_RETENTION_DAYS`.

Yang **tidak** disimpan: IP, user-agent, dan pengenal pengunjung apa pun.

## 3. Edge Function `cv-download`

Dipanggil dari `src/components/CvDownloadModal.jsx:99` lewat
`supabase.functions.invoke('cv-download', ...)`. Pengunjung mengisi nama dan
email, function mengembalikan signed URL ke PDF CV di Supabase Storage privat.

> **Catatan:** source Edge Function ini **tidak ada di repo ini**. Yang jalan di
> production hanya ada di dashboard Supabase.

## Setup

1. Buat project Supabase.
2. Jalankan `supabase/page-views.sql` dan `supabase/assistant-qa.sql` lewat
   Supabase SQL Editor (keduanya idempoten).
3. Deploy Edge Function `cv-download` dan upload PDF CV ke bucket privat.
4. Isi env:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Sisi server (`api/_lib/supabaseRest.js`) membaca `SUPABASE_URL` /
`SUPABASE_ANON_KEY` lebih dulu, dan jatuh ke varian `VITE_` kalau tidak ada.
`SUPABASE_SERVICE_ROLE_KEY` **tidak** punya fallback `VITE_` dan hanya dipakai
arsip Q&A — kosongkan kalau belum mau mengaktifkan fitur itu.

**Pakai anon key saja di env frontend. Jangan pernah memasukkan service role key
ke file env frontend** — apa pun yang ber-prefix `VITE_` akan di-inline Vite ke
bundle klien, sementara service role mem-bypass seluruh RLS.

## Sisa CMS lama di database

Kalau project Supabase-mu sudah pernah menjalankan `experience-cms.sql` dan
`cms-seed.sql` (dua file itu sudah dihapus dari repo), maka di database masih
tersisa tabel yang **tidak dibaca kode mana pun**: `cms_items`, `experiences`,
`projects`, `project_focus`, `project_scope`, `project_stack`,
`project_outcomes`, `project_signals`, plus function `is_admin()` beserta policy
admin di tiap tabel.

Semuanya aman di-`drop` kalau mau bersih-bersih. Yang **tidak boleh** disentuh
cuma `page_views`, `increment_page_view`, dan `assistant_qa`.
