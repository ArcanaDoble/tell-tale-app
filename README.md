# Tell Tale Reader

Aplicación web construida con React + Vite para explorar y leer mangas/libros almacenados en Firebase. Incluye vistas de biblioteca, detalles y lector con visor de páginas, controles de zoom/paginación y marcadores locales.

## Requisitos

- Node.js 18+
- npm 9+
- Una cuenta de Firebase con Firestore y opcionalmente Storage habilitados

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz con la configuración de Firebase (puedes usar `.env.example` como referencia).

```bash
cp .env.example .env
```

Completa las variables con los valores proporcionados por tu proyecto de Firebase (estos son los valores actuales del proyecto configurado en la app):

```env
VITE_FIREBASE_API_KEY=AIzaSyDMX1EdXlacksOLUhUzYxgT627Ud-nROCU
VITE_FIREBASE_AUTH_DOMAIN=base-de-datos-noma.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=base-de-datos-noma
VITE_FIREBASE_STORAGE_BUCKET=base-de-datos-noma.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=485513400814
VITE_FIREBASE_APP_ID=1:485513400814:web:bc4f7eaeebd1baf3eafeff
VITE_FIREBASE_MEASUREMENT_ID=G-FFDG8M3N8Q
```

## Scripts disponibles

- `npm run dev` – Inicia el servidor de desarrollo en `http://localhost:5173`.
- `npm run build` – Genera la build de producción.
- `npm run preview` – Sirve la build generada.
- `npm run test` – Ejecuta las pruebas con Vitest y Testing Library.
- `npm run lint` – Ejecuta ESLint sobre el proyecto.

## Estructura principal

```
src/
├── components/        # Componentes reutilizables como tarjetas y visor de páginas
├── firebase/          # Inicialización de Firebase
├── services/          # Funciones para consumir Firestore
├── views/             # Vistas de Biblioteca, Detalles y Lector
└── routes/            # Configuración de rutas con React Router
```

## Datos y Firebase

La aplicación consulta la colección `resources` en Firestore. Cada documento debe contener los campos:

- `title`, `description`, `author`, `coverUrl`, `tags` (array) y `pages` (array de URLs de imágenes ordenadas).
- `resourceType` (`manga`, `libro` o `documento`) para clasificar el contenido.
- `downloadUrl` (opcional) para documentos descargables y `pageCount` para controlar el progreso.

Si la conexión con Firebase falla, se mostrará un recurso de demostración incluido en la app para mantener la experiencia.

## Carga de archivos

Desde la ruta `/upload` puedes subir nuevos mangas, libros ilustrados o documentos en PDF/EPUB. Los archivos se almacenan en
Firebase Storage y se registran automáticamente en Firestore, quedando disponibles en la biblioteca.

## Estilos y responsive

Se utiliza Tailwind CSS para estilos adaptativos (mobile/tablet/desktop). El lector incluye controles de zoom y paginación, y los listados se ajustan automáticamente a distintos tamaños de pantalla.

## Pruebas

Se incluye una prueba básica de integración con Testing Library que verifica el renderizado de la vista de biblioteca consumiendo datos del servicio de Firebase (mockeado).

## Licencia

Distribuido con fines educativos. Ajusta o extiende según tus necesidades.
