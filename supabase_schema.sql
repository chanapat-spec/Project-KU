-- ====================================================================
-- KU VOLLEY QUEST - SUPABASE DATABASE SCHEMA
-- Best Practices: RLS Enabled, Explicit Roles, Indexes, Realtime
-- ก๊อปปี้โค้ดทั้งหมดนี้ไปวางในเมนู SQL Editor บน Supabase แล้วกด RUN
-- ====================================================================

-- 1. ตารางนักเรียน (Students)
create table if not exists public.students (
    id text primary key,
    name text not null,
    student_number text not null,
    room text not null,
    total_xp integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ดัชนีเพื่อค้นหาและจัดอันดับ Leaderboard ได้รวดเร็ว
create index if not exists idx_students_room_xp on public.students(room, total_xp desc);
create index if not exists idx_students_xp on public.students(total_xp desc);

-- 2. ตารางบันทึกประวัติการส่งคะแนนแต่ละครั้ง (Scores)
create table if not exists public.scores (
    id uuid primary key default gen_random_uuid(),
    student_id text references public.students(id) on delete cascade,
    student_name text not null,
    student_number text not null,
    room text not null,
    exercise_id text not null,
    reps integer not null,
    target_reps integer not null,
    accuracy integer default 100,
    grade text default 'A',
    xp_earned integer not null,
    duration_seconds integer default 0,
    snapshot_url text,
    created_at timestamptz default now()
);

-- ดัชนีค้นหาประวัติคะแนน
create index if not exists idx_scores_student_id on public.scores(student_id);
create index if not exists idx_scores_room on public.scores(room);
create index if not exists idx_scores_created_at on public.scores(created_at desc);

-- ====================================================================
-- 3. ตารางบันทึกข้อมูลสุขภาพ & BMI (Health & BMI Records)
-- ====================================================================
create table if not exists public.health_records (
    id text primary key,
    student_id text not null,
    name text not null,
    student_number text not null,
    room text not null,
    gender text default 'male',
    age integer default 10,
    weight numeric not null,
    height numeric not null,
    bmi numeric not null,
    classification text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ดัชนีค้นหาข้อมูลสุขภาพ
create index if not exists idx_health_records_room on public.health_records(room);
create index if not exists idx_health_records_student_id on public.health_records(student_id);
create index if not exists idx_health_records_updated_at on public.health_records(updated_at desc);

-- ====================================================================
-- 4. ระบบความปลอดภัย Row Level Security (RLS) ตาม Best Practices
-- ====================================================================

alter table public.students enable row level security;
alter table public.scores enable row level security;
alter table public.health_records enable row level security;

-- สิทธิ์การอ่าน/เขียน สำหรับหน้านักเรียนและหน้าอาจารย์ (Anon Key)
drop policy if exists "Allow public read students" on public.students;
create policy "Allow public read students"
on public.students for select to anon, authenticated using (true);

drop policy if exists "Allow public upsert students" on public.students;
create policy "Allow public upsert students"
on public.students for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow public read scores" on public.scores;
create policy "Allow public read scores"
on public.scores for select to anon, authenticated using (true);

drop policy if exists "Allow public insert scores" on public.scores;
create policy "Allow public insert scores"
on public.scores for insert to anon, authenticated with check (true);

drop policy if exists "Allow public read health_records" on public.health_records;
create policy "Allow public read health_records"
on public.health_records for select to anon, authenticated using (true);

drop policy if exists "Allow public upsert health_records" on public.health_records;
create policy "Allow public upsert health_records"
on public.health_records for all to anon, authenticated using (true) with check (true);

-- ====================================================================
-- 5. ถังเก็บไฟล์ภาพถ่ายหลักฐาน (Supabase Storage Bucket)
-- ====================================================================

insert into storage.buckets (id, name, public)
values ('homework-snapshots', 'homework-snapshots', true)
on conflict (id) do nothing;

drop policy if exists "Allow public select snapshots" on storage.objects;
create policy "Allow public select snapshots"
on storage.objects for select to anon, authenticated
using (bucket_id = 'homework-snapshots');

drop policy if exists "Allow public upload snapshots" on storage.objects;
create policy "Allow public upload snapshots"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'homework-snapshots');

-- ====================================================================
-- 6. เปิดใช้งาน Realtime สำหรับแสดง Leaderboard และข้อมูลสุขภาพสด
-- ====================================================================

alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.health_records;
