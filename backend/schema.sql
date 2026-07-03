-- Enable the pgvector extension for storing vector embeddings
create extension if not exists vector;

-- profiles table: stores user metadata and resume file references + texts
create table if not exists public.profiles (
  user_id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,                 -- Supabase Storage path for profile photo
  default_resume_url text,         -- Supabase Storage path for the resume PDF
  default_resume_text text,        -- Extracted plain text for RAG queries
  default_resume_structured jsonb, -- Parsed structured resume representation (contact, experience, education, skills)
  resume_updated_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- resume_chunks table: stores vector embeddings of the user's default resume for RAG search
create table if not exists public.resume_chunks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  chunk_text text not null,
  embedding vector(384) not null, -- 384 dimensions matching all-MiniLM-L6-v2
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on both tables
alter table public.profiles enable row level security;
alter table public.resume_chunks enable row level security;

-- Profile RLS Policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Resume Chunks RLS Policies
create policy "Users can view their own resume chunks" on public.resume_chunks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own resume chunks" on public.resume_chunks
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own resume chunks" on public.resume_chunks
  for delete using (auth.uid() = user_id);

-- Storage bucket access policies
-- Allow users to manage their own default resume file in the resumes bucket (scoped to user folder)
create policy "Manage own resume" on storage.objects
  for all using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to manage their own avatar in the avatars bucket
create policy "Manage own avatar" on storage.objects
  for all using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- match_resume_chunks stored procedure for vector similarity search scoped to a user
create or replace function public.match_resume_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id uuid
) returns table (
  id uuid,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    resume_chunks.id,
    resume_chunks.chunk_text,
    1 - (resume_chunks.embedding <=> query_embedding) as similarity
  from resume_chunks
  where resume_chunks.user_id = filter_user_id
    and 1 - (resume_chunks.embedding <=> query_embedding) > match_threshold
  order by resume_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Trigger to automatically create a profile for a new user in profiles table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url, default_resume_url, default_resume_text, default_resume_structured, resume_updated_at)
  values (new.id, new.raw_user_meta_data->>'full_name', null, null, null, null, null);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


