-- ==============================================================
-- ConstructNet UTP v5 Cloud
-- Ejecutar UNA VEZ en Supabase > SQL Editor
-- Este parche adapta la base ya creada a la WebApp multiusuario.
-- ==============================================================

-- Campos adicionales necesarios para mostrar contacto y ubicación.
alter table public.profiles add column if not exists email text;
alter table public.opportunities add column if not exists ubicacion text default 'Virtual';

-- Índice útil para localizar perfiles por correo.
create index if not exists profiles_email_idx on public.profiles(email);

-- RLS debe permanecer activo.
alter table public.profiles enable row level security;
alter table public.networking_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.connections enable row level security;
alter table public.notifications enable row level security;
alter table public.opportunities enable row level security;
alter table public.networking_history enable row level security;

-- Políticas adicionales que necesita la app.
drop policy if exists "Usuario puede eliminar su conexion" on public.connections;
create policy "Usuario puede eliminar su conexion"
on public.connections for delete to authenticated
using (auth.uid() = requester_id or auth.uid() = receiver_id);

drop policy if exists "Usuario puede crear sus notificaciones" on public.notifications;
create policy "Usuario puede crear sus notificaciones"
on public.notifications for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuario puede borrar sus notificaciones" on public.notifications;
create policy "Usuario puede borrar sus notificaciones"
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Usuario puede registrar su historial" on public.networking_history;
create policy "Usuario puede registrar su historial"
on public.networking_history for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuario puede eliminar sus oportunidades" on public.opportunities;
create policy "Usuario puede eliminar sus oportunidades"
on public.opportunities for delete to authenticated
using (auth.uid() = user_id);

-- Verificación rápida: debe devolver 7 mesas.
select id, nombre, capacidad_min, capacidad_max, estado
from public.networking_rooms
order by id;
