# Tell Tale Reader

Aplicación web construida con React (Create React App) para subir, organizar y leer mangas, cómics o libros digitales desde cualquier dispositivo. Incluye biblioteca con filtros, ficha de detalles enriquecida y lector responsivo compatible con imágenes y documentos (PDF/EPUB/CBZ/TXT).

## Requisitos

- Node.js 18+
- npm 9+
- Una cuenta de Firebase con Firestore y Storage habilitados (o usa el modo demo incluido)

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz con la configuración de Firebase (puedes usar `.env.example` como referencia).

```bash
cp .env.example .env
```

Completa las variables con los valores de tu proyecto de Firebase. El repositorio incluye los datos de ejemplo proporcionados:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDMX1EdXlacksOLUhUzYxgT627Ud-nROCU
REACT_APP_FIREBASE_AUTH_DOMAIN=base-de-datos-noma.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=base-de-datos-noma
REACT_APP_FIREBASE_STORAGE_BUCKET=base-de-datos-noma.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=485513400814
REACT_APP_FIREBASE_APP_ID=1:485513400814:web:bc4f7eaeebd1baf3eafeff
REACT_APP_FIREBASE_MEASUREMENT_ID=G-FFDG8M3N8Q
```

> Si alguna variable falta, la app mostrará los recursos demo sin conexión.

## Scripts disponibles

- `npm start` – Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build` – Genera la build de producción.
- `npm test` – Ejecuta las pruebas con Jest y Testing Library.
- `npm run lint` – Ejecuta ESLint sobre el proyecto.

## Funcionalidades clave

- **Biblioteca moderna** con búsqueda, filtros por formato y estadísticas en vivo.
- **Carga de contenido** directamente desde la web (PDF, EPUB, CBZ, TXT o lotes de imágenes). Los archivos se almacenan en Firebase Storage cuando está configurado.
- **Ficha detallada** con metadatos, descarga directa y botones rápidos para leer o volver a la biblioteca.
- **Lector responsivo** con controles de zoom, paginación, soporte táctil y visor integrado para documentos.
- **Marcadores locales** para retomar lecturas favoritas sin necesidad de iniciar sesión.
- **Modo demo offline** que mantiene contenido de ejemplo cuando Firebase no está disponible.

## Estructura principal

```
src/
├── components/        # Componentes reutilizables como tarjetas, visor de páginas y diálogo de subida
├── firebase/          # Inicialización de Firebase y comprobación de variables
├── services/          # Funciones para Firestore/Storage y caché local
├── views/             # Vistas de Biblioteca, Detalles y Lector
└── routes/            # Configuración de rutas con React Router
```

## Datos y Firebase

La aplicación consulta la colección `resources` en Firestore. Cada documento puede contener:

- Campos base: `title`, `description`, `author`, `coverUrl`, `tags`, `format` y `pageCount`.
- `pages` (array de URLs de imágenes) para lectura tipo manga/comic.
- `fileUrl` y `fileName` para documentos únicos (PDF, EPUB, CBZ, TXT).

El formulario de subida crea automáticamente los registros y archivos correspondientes. Si Firestore/Storage no están disponibles, los recursos se guardan temporalmente en memoria mediante URLs locales.

## Estilos y responsive

Se utiliza Tailwind CSS para estilos adaptativos (mobile/tablet/desktop). Los layouts incluyen fondos degradados, tarjetas 3D y controles táctiles, asegurando una experiencia agradable en pantallas pequeñas o grandes.

## Pruebas

Se incluye una prueba básica de integración con Testing Library que verifica el renderizado de la vista de biblioteca consumiendo datos mockeados del servicio.

## Licencia

Distribuido con fines educativos. Ajusta o extiende según tus necesidades.
