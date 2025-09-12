# Función Lambda para Consultar Estado de Procesamiento

Esta función Lambda consulta el estado de procesamiento de archivos de audio en tiempo real para polling desde JavaScript.

## Requisitos

- **Python:** 3.12
- **Bucket S3:** Un bucket S3 con las carpetas:
  - `processing/`: Para leer los archivos de estado del procesamiento
  - `results/`: Para generar URLs de descarga de resultados
- **Variables de entorno:**
  - `BUCKET_NAME`: Nombre del bucket S3

## Funcionamiento

La función recibe el `fileKey` del archivo de audio y retorna el estado actual del procesamiento:

**Request:**
```
GET /status/{fileKey}
```

**Response (En proceso):**
```json
{
    "file_key": "uploads/archivo.mp3",
    "status": "TRANSCRIBING",
    "message": "Transcribiendo audio con AssemblyAI",
    "progress": 30,
    "timestamp": "2024-01-01T12:00:00",
    "polling_recommended": true
}
```

**Response (Completado):**
```json
{
    "file_key": "uploads/archivo.mp3", 
    "status": "COMPLETED",
    "message": "Procesamiento completado exitosamente",
    "progress": 100,
    "resultado_key": "results/archivo_resultado.json",
    "transcripcion_key": "results/archivo_transcripcion.json",
    "resultado_download_url": "https://bucket.s3.amazonaws.com/...",
    "transcripcion_download_url": "https://bucket.s3.amazonaws.com/...",
    "tiempo_total": 45.2,
    "polling_recommended": false
}
```

## Estados del Procesamiento

- **PENDING:** Archivo en cola, proceso no iniciado
- **STARTING:** Iniciando procesamiento
- **TRANSCRIBING:** Transcribiendo audio con AssemblyAI
- **TRANSCRIPTION_COMPLETED:** Transcripción completada
- **ANALYZING:** Analizando contenido con IA
- **COMPLETED:** Procesamiento completado exitosamente
- **ERROR:** Error durante el procesamiento

## Uso para Polling

El campo `polling_recommended` indica si se debe continuar consultando:
- `true`: Continuar polling cada 2-5 segundos
- `false`: Proceso terminado (COMPLETED o ERROR)
