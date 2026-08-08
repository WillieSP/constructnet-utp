# ConstructNet UTP

Prototipo funcional de una plataforma digital colaborativa para estudiantes de la Maestría en Gestión de la Construcción de la UTP.

## Problema que resuelve

La comunicación entre estudiantes suele limitarse a los trabajos académicos y disminuir al finalizar cada curso. ConstructNet crea espacios estructurados para conocer perfiles profesionales, compartir experiencia y formar alianzas.

## Funcionalidades del MVP

- Registro y edición del **ADN profesional**.
- Campos de “lo que domino”, “lo que quiero aprender”, “lo que puedo aportar” y “lo que busco”.
- Algoritmo de complementariedad para formar grupos de **3 a 6 personas**.
- Índice de sinergia explicado con criterios visibles.
- Mesas Estratégicas de Speed Networking.
- Directorio profesional con buscador y filtros.
- Red de conexiones.
- Oportunidades laborales, proyectos, consultorías, eventos e investigación.
- Historial de sesiones.
- Networking Score y gamificación.
- Persistencia local mediante `localStorage`.
- Diseño responsive para celular y escritorio.

## Ejecutar localmente

No requiere instalación ni compilación.

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador.

Para evitar restricciones del navegador, también puedes iniciar un servidor local:

```bash
python -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de esta carpeta a la raíz.
3. En GitHub entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main` y la carpeta `/root`.
6. Guarda los cambios.

GitHub generará una URL pública del tipo:

`https://TU-USUARIO.github.io/constructnet-utp/`

## Algoritmo del prototipo

El índice de sinergia considera:

- 30%: relación entre lo que un usuario quiere aprender y lo que otro domina.
- 25%: objetivos profesionales compatibles.
- 20%: experiencia en tipos de proyecto relacionados.
- 15%: disponibilidad horaria compartida.
- 10%: diversidad profesional.

El algoritmo busca complementariedad, no perfiles idénticos.

## Nota académica

Este proyecto es un prototipo de validación para el curso de Innovación y Design Thinking. Los perfiles, oportunidades y datos son demostrativos.

## Edición Mobile App

Esta versión está diseñada principalmente para celular. En un teléfono ocupa toda la pantalla; en computadora se presenta dentro de un marco de 430 px para simular una aplicación móvil. Incluye barra inferior con accesos a Inicio, Match, Mesas, Mi red y Perfil, además de un menú lateral para las funciones secundarias.

## Acceso y registro (versión onboarding)

Esta versión incluye un flujo móvil de acceso:

1. Crear cuenta con nombre, correo y contraseña.
2. Completar el ADN Profesional en 6 pasos.
3. Registrar conocimientos, temas por aprender, aportes, objetivos, proyectos y disponibilidad.
4. Ingresar al dashboard y recibir matches de complementariedad.
5. Cerrar sesión y volver a ingresar con la cuenta creada.

### Importante sobre el prototipo
Las cuentas se almacenan en `localStorage`, por lo que sirven para una validación académica y para crear varias cuentas en un mismo navegador. GitHub Pages es estático: si se necesita que usuarios de distintos celulares vean en tiempo real los perfiles creados por otras personas, la siguiente etapa debe conectar el front-end a una base de datos/autenticación como Firebase o Supabase.

## Persistencia de datos

Esta versión guarda automáticamente las cuentas, perfiles, inscripciones a mesas, conexiones, notificaciones, oportunidades y puntaje en `localStorage`. Por ello, **actualizar la página no borra la información** en el mismo navegador/dispositivo.

### Pruebas con varias personas en diferentes celulares
GitHub Pages es estático, por lo que `localStorage` no comparte datos entre celulares. Para que perfiles e inscripciones aparezcan entre dispositivos se dejó preparada una sincronización opcional con **Supabase**:

1. Crea un proyecto gratuito en Supabase.
2. Ejecuta `supabase-schema.sql` en **SQL Editor**.
3. En Supabase > Project Settings > API copia `Project URL` y `anon public key`.
4. Pega ambos valores en `cloud-config.js`.
5. Sube nuevamente los archivos a GitHub Pages.

Si `cloud-config.js` queda vacío, la app sigue funcionando en modo local. Esto es suficiente si todas las cuentas de prueba se crean en el mismo navegador.

## Cambios de la versión v4
- Perfil completamente editable, incluida foto, teléfono, correo, sector, especialidad y biografía.
- Registro de teléfono desde la creación de la cuenta.
- Nuevos usuarios empiezan sin notificaciones, contactos, historial u oportunidades precargadas.
- Botones del inicio reparados.
- Mi Red incluye botón **Contactar** y muestra el número y correo previamente registrados.
- Directorio y mesas se alimentan de usuarios realmente registrados; no existen perfiles ficticios precargados.
- 7 Mesas Estratégicas temáticas con evaluación automática de afinidad.
- Cada mesa acepta entre 3 y 6 participantes y muestra estado "En formación" hasta alcanzar el mínimo.
- Persistencia automática tras actualizar la página.
