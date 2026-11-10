-- Emagrece Paulistana: produtos, informações do site, pasta de fotos e permissões.
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar de novo sem problema.

-- 1. Tabela de produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 300),
  price numeric(10,2) check (price is null or price > 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price > 0),
  image_path text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promo_menor_que_preco
    check (promo_price is null or (price is not null and promo_price < price))
);

-- 2. Tabela de informações do site (textos, link do grupo, foto do topo)
create table if not exists public.site_settings (
  key text primary key check (key in (
    'group_link', 'hero_title', 'hero_text', 'group_title', 'group_text',
    'footer_note', 'instagram', 'hero_image'
  )),
  value text not null default '' check (char_length(value) <= 400)
);

-- 3. Trava de segurança: só quem tem permissão mexe nas linhas
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

grant select on public.products, public.site_settings to anon, authenticated;
grant insert, update, delete on public.products, public.site_settings to authenticated;

drop policy if exists "Visitantes veem produtos ativos" on public.products;
create policy "Visitantes veem produtos ativos" on public.products
  for select to anon, authenticated using (active = true);

drop policy if exists "Admin ve todos os produtos" on public.products;
create policy "Admin ve todos os produtos" on public.products
  for select to authenticated using (true);

drop policy if exists "Admin cadastra produtos" on public.products;
create policy "Admin cadastra produtos" on public.products
  for insert to authenticated with check (true);

drop policy if exists "Admin altera produtos" on public.products;
create policy "Admin altera produtos" on public.products
  for update to authenticated using (true) with check (true);

drop policy if exists "Admin apaga produtos" on public.products;
create policy "Admin apaga produtos" on public.products
  for delete to authenticated using (true);

drop policy if exists "Todos leem as informacoes do site" on public.site_settings;
create policy "Todos leem as informacoes do site" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admin cadastra informacoes" on public.site_settings;
create policy "Admin cadastra informacoes" on public.site_settings
  for insert to authenticated with check (true);

drop policy if exists "Admin altera informacoes" on public.site_settings;
create policy "Admin altera informacoes" on public.site_settings
  for update to authenticated using (true) with check (true);

drop policy if exists "Admin apaga informacoes" on public.site_settings;
create policy "Admin apaga informacoes" on public.site_settings
  for delete to authenticated using (true);

-- 4. Pasta de fotos (qualquer pessoa vê; só o admin envia, troca e apaga)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin envia fotos" on storage.objects;
create policy "Admin envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

drop policy if exists "Admin lista fotos" on storage.objects;
create policy "Admin lista fotos" on storage.objects
  for select to authenticated using (bucket_id = 'products');

drop policy if exists "Admin troca fotos" on storage.objects;
create policy "Admin troca fotos" on storage.objects
  for update to authenticated using (bucket_id = 'products') with check (bucket_id = 'products');

drop policy if exists "Admin apaga fotos" on storage.objects;
create policy "Admin apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'products');

-- 5. Dois produtos de partida, tirados do Instagram da loja (só entram se o catálogo estiver vazio).
--    Edite ou apague pelo painel quando quiser.
insert into public.products (name, description, price, position)
select v.name, v.description, v.price, v.position
from (values
  ('Protocolo 30 dias', 'Protocolo completo de 30 dias, com acompanhamento durante todo o processo.', 270.00, 0),
  ('Protocolo 15 dias', 'Protocolo de teste de 15 dias, com acompanhamento durante todo o processo.', 170.00, 1)
) as v(name, description, price, position)
where not exists (select 1 from public.products);
