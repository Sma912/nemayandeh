-- Supabase schema for loan-app-mvp

-- USERS
create table if not exists users (
  id text primary key,
  phone text not null unique,
  name text not null,
  role text check (role in ('admin','agent','customer')) not null,
  created_at timestamptz not null default now(),
  password text,
  is_active boolean default true,

  -- Agent profile
  first_name text,
  last_name text,
  national_id text,
  work_domain text,
  work_experience_years int,
  address text,
  postal_code text,

  -- Contracts
  contract_url text,
  signed_contract_url text
);

-- LOANS
create table if not exists loans (
  id text primary key,
  customer_id text not null references users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  agent_id text references users(id) on delete set null,
  agent_name text not null,
  amount numeric not null,
  status text not null,
  loan_type text not null,
  loan_type_name text not null,
  loan_purpose text,
  credit_check_fee numeric not null,
  commission numeric not null,
  documents jsonb not null default '[]',
  guarantors jsonb not null default '[]',
  credit_check jsonb not null default '{}'::jsonb,
  contract jsonb not null default '{}'::jsonb,
  form_data jsonb default '{}'::jsonb,
  purchase_from_refaheston boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MESSAGES
create table if not exists messages (
  id text primary key,
  loan_id text references loans(id) on delete cascade,
  sender_id text not null references users(id),
  sender_name text not null,
  sender_role text not null,
  content text not null,
  timestamp timestamptz not null default now(),
  type text not null,
  recipient_id text
);

-- SETTINGS (single latest row used)
create table if not exists settings (
  id bigint primary key generated always as identity,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Optionally create a storage bucket named 'contracts' in Supabase Storage UI.
-- Then you can store contracts and save public URLs in users.signed_contract_url.


