# ConstructNet UTP v5 Cloud

Versión multiusuario de ConstructNet UTP conectada a Supabase y lista para GitHub Pages.

## Antes de subir a GitHub

1. En Supabase > SQL Editor ejecuta `SUPABASE_PATCH_V5.sql` una sola vez.
2. En Authentication > Providers > Email, para una demo rápida puedes desactivar temporalmente la confirmación por correo. Si la mantienes activa, cada usuario deberá confirmar su email antes de iniciar sesión.
3. Verifica en Table Editor que `networking_rooms` tenga solo 7 registros.

## Publicar en GitHub Pages

Sube todos los archivos de esta carpeta a la raíz de tu repositorio y activa GitHub Pages desde Settings > Pages > Deploy from a branch > main / root.

## Qué guarda en Supabase

- Usuarios y contraseñas: Supabase Auth.
- ADN profesional y foto comprimida: `profiles`.
- Inscripciones a mesas: `room_members`.
- Conexiones profesionales: `connections`.
- Notificaciones: `notifications`.
- Oportunidades: `opportunities`.
- Historial: `networking_history`.

La sesión queda persistente entre recargas y el mismo usuario puede iniciar sesión desde computadora o celular.

## Seguridad

`cloud-config.js` contiene únicamente la Project URL y la Publishable Key. Nunca agregues una Secret Key, `service_role` ni la contraseña de la base de datos al repositorio.
