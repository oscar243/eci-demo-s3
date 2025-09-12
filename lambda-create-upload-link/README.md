# Función Lambda para Enlaces de Subida de Audio

Esta función Lambda genera enlaces temporales (presigned URLs) para subir archivos de audio directamente a Amazon S3 de forma segura.

## Requisitos

- **Python:** 3.12
- **Bucket S3:** Un bucket S3 configurado con las siguientes carpetas:
  - `uploads/`: Para almacenar los archivos de audio subidos.
- **Variables de entorno:**
  - `S3_BUCKET_NAME`: Nombre del bucket S3.

## Características

- **Solo archivos de audio:** MP3, WAV, M4A, AAC, OGG, FLAC, WebM
- **Tamaño máximo:** 20MB por archivo
- **Validación de nombres:** Caracteres seguros únicamente
- **Enlaces temporales:** Expiran en 1 hora por defecto (máximo 24 horas)

## Uso

### Generar enlace de subida

**Request:**
```json
{
    "action": "upload",
    "file_name": "mi-audio.mp3",
    "content_type": "audio/mpeg"
}
```

**Response:**
```json
{
    "success": true,
    "upload_url": "https://bucket.s3.amazonaws.com/",
    "fields": {
        "key": "uploads/20231210_143022_uuid_mi-audio.mp3",
        "Content-Type": "audio/mpeg"
    },
    "file_key": "uploads/20231210_143022_uuid_mi-audio.mp3",
    "expires_in_seconds": 3600
}
```
