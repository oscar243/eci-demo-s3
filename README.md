# Demo S3 Lambda - Procesamiento de Audio

## Configuración del API

### URLs a cambiar:
- **Subida:** `docs/js/upload-handler.js` → buscar `UPLOAD_API_URL`
- **Estado:** `docs/js/status-handler.js` → buscar `STATUS_API_URL`

Cada archivo tiene una sección marcada con `// CONFIGURACIÓN DEL API - EDITAR AQUÍ`

### Ejemplo:
```javascript
const API_CONFIG = {
    UPLOAD_API_URL: 'https://API-ID.execute-api.REGION.amazonaws.com/v1/endpoint'
};
```

⚠️ **Nota:** APIs y Lambdas eliminadas por costos.