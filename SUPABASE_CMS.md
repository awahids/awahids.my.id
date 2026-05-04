# Supabase Experience CMS

Admin panel tersedia di:

```text
/admin/experience
```

## Setup

1. Buat project Supabase.
2. Aktifkan Google provider di `Authentication > Providers > Google`.
3. Buat OAuth Client di Google Cloud Console, lalu masukkan Client ID dan Client Secret ke Supabase Google provider.
4. Di Google OAuth Client, tambahkan Authorized redirect URI Supabase:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Project ref bisa dilihat dari Supabase project URL.

5. Di Supabase `Authentication > URL Configuration`, tambahkan redirect URL untuk admin panel:

```text
http://localhost:5173/admin/experience
http://localhost:5173/admin/**
https://your-domain.com/admin/experience
https://your-domain.com/admin/**
```

6. Jalankan SQL schema di `supabase/experience-cms.sql` lewat Supabase SQL Editor.
7. Jalankan data awal/seeder di `supabase/cms-seed.sql`.
8. Buat `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Gunakan anon key saja di Vite. Jangan pernah memasukkan service role key ke file env frontend.

Admin yang diizinkan:

```text
awahid.safhadi@gmail.com
```

## Security

CMS ini memakai Supabase Auth dan Row Level Security:

- pengunjung hanya bisa membaca experience yang `is_published = true`
- login admin hanya memakai Google OAuth
- hanya `awahid.safhadi@gmail.com` yang bisa membuka CMS dan mengubah data
- akun Google lain akan langsung ditolak di UI dan tetap ditolak oleh Supabase RLS
- draft tetap bisa dilihat oleh admin, tapi tidak tampil di website publik

## Admin Menus

`/admin/experience` memakai tabel khusus `experiences`.
`/admin/projects` memakai tabel khusus `projects`.

Menu berikut memakai tabel umum `cms_items`:

```text
/admin/skills
/admin/services
/admin/certificates
/admin/profile
/admin/about
/admin/contact
/admin/ai-faq        # AI Knowledge
/admin/api-settings  # AI Settings
/admin/settings
```

Landing page dan runtime API membaca data published dari `cms_items`:

- `profile` untuk Hero
- `services` untuk What I Build
- `skills` untuk Tech Stack by Layer
- `certificates` untuk Certificates
- `about` untuk Biography
- `contact` untuk Contact
- `settings` untuk title/meta SEO client-side
- `ai-faq` untuk context `/api/ai-faq` dan `/api/ai-assistant`
- `api-settings` untuk runtime AI provider settings

Portfolio membaca data published dari tabel `projects` dan tabel detail:

- `project_focus`
- `project_scope`
- `project_stack`
- `project_outcomes`
- `project_signals`

Setiap integrasi otomatis fallback ke data hardcoded/default kalau Supabase belum
configured atau tabel/collection masih kosong.

Data awal untuk semua menu sudah tersedia di:

```text
supabase/cms-seed.sql
```

File seed ini memakai `on conflict do update`, jadi aman dijalankan ulang saat ingin
reset/sinkronisasi data awal.

Struktur data yang dipakai:

Projects (`projects`):

```json
{
  "year": "2025",
  "project_type": "Appointment Platform",
  "role": "Fullstack Developer",
  "live_url": "https://example.com",
  "case_url": "#",
  "bento": "bento-compact",
  "num": "01",
  "problem": "...",
  "built": "...",
  "result": "...",
  "impact": "..."
}
```

Project list/detail memakai child tables:

```text
project_focus     label
project_scope     label
project_stack     label
project_outcomes  body
project_signals   label, value, note
```

Skills:

```json
{
  "num": "01",
  "chips": ["React", "Next.js", "TypeScript"]
}
```

Services:

```json
{}
```

Gunakan `title` sebagai nama service dan `summary` sebagai deskripsi kartu.

Certificates:

```json
{
  "url": "https://credential-url.example"
}
```

AI Settings:

```json
{
  "provider": "sumopod",
  "base_url": "https://ai.sumopod.com/v1",
  "models": ["gpt-4o-mini", "gpt-4.1-mini"],
  "model": "gpt-4o-mini",
  "timeout_ms": 12000,
  "notes": "API key stays in server environment variable SUMOPOD_API_KEY."
}
```

`/api/ai-faq`, `/api/ai-brief`, dan fallback SumoPod di `/api/ai-assistant`
membaca item `api-settings-sumopod` dari `cms_items`. Setting ini hanya untuk
runtime non-secret seperti base URL, model, dan timeout. API key tetap wajib
disimpan di environment server:

```env
SUMOPOD_API_KEY=your_sumopod_api_key
```
