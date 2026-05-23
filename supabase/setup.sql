create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile (rare)" on public.profiles;

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke execute on function private.is_admin() from anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.products (
  id text primary key,
  nome text not null,
  subtitulo text,
  descricao text,
  categoria text,
  harmonizacao text,
  preco numeric(10,2) not null default 0,
  imagem text,
  destaque text,
  estoque integer not null default 0,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

alter table public.products enable row level security;

drop policy if exists "Public can view products" on public.products;
create policy "Public can view products"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (private.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (private.is_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
