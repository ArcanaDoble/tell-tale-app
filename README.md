# Tell Tale Reader

Aplicación web construida con React (Create React App) para explorar y leer mangas/libros almacenados en Firebase. Incluye vistas de biblioteca, detalles y lector con visor de páginas, controles de zoom/paginación y marcadores locales.

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

Completa las variables con los valores proporcionados por tu proyecto de Firebase:

```env
REACT_APP_FIREBASE_API_KEY=tu-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=tu-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=tu-app-id
```

## Scripts disponibles

- `npm start` – Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build` – Genera la build de producción.
- `npm test` – Ejecuta las pruebas con Jest y Testing Library.
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

Si la conexión con Firebase falla, se mostrará un recurso de demostración incluido en la app para mantener la experiencia.

## Estilos y responsive

Se utiliza Tailwind CSS para estilos adaptativos (mobile/tablet/desktop). El lector incluye controles de zoom y paginación, y los listados se ajustan automáticamente a distintos tamaños de pantalla.

## Pruebas

Se incluye una prueba básica de integración con Testing Library que verifica el renderizado de la vista de biblioteca consumiendo datos del servicio de Firebase (mockeado).

## Licencia

Distribuido con fines educativos. Ajusta o extiende según tus necesidades.
