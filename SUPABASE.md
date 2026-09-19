# Supabase

Situs ini tidak lagi memakai CMS. Seluruh konten — profil, pengalaman, project,
sertifikat, dan konteks untuk AI assistant — hardcoded di dalam kode.

Supabase sekarang tinggal dipakai untuk dua hal yang sama sekali tidak
berhubungan satu sama lain.

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

## 2. Edge Function `cv-download`

Dipanggil dari `src/components/CvDownloadModal.jsx:99` lewat
`supabase.functions.invoke('cv-download', ...)`. Pengunjung mengisi nama dan
email, function mengembalikan signed URL ke PDF CV di Supabase Storage privat.

> **Catatan:** source Edge Function ini **tidak ada di repo ini**. Yang jalan di
> production hanya ada di dashboard Supabase.

## Setup

1. Buat project Supabase.
2. Jalankan `supabase/page-views.sql` lewat Supabase SQL Editor (idempoten).
3. Deploy Edge Function `cv-download` dan upload PDF CV ke bucket privat.
4. Isi env:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Sisi server (`api/_lib/supabaseRest.js`) membaca `SUPABASE_URL` /
`SUPABASE_ANON_KEY` lebih dulu, dan jatuh ke varian `VITE_` kalau tidak ada.

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
cuma `page_views` dan `increment_page_view`.
