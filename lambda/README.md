# Función Lambda para Análisis de Audio

Este paquete de despliegue (`deployment-package.zip`) contiene el código y las dependencias necesarias para una función AWS Lambda que procesa archivos de audio.

## Requisitos

- **Python:** 3.9
- **Bucket S3:** Se requiere un bucket S3 con la siguiente estructura de carpetas:
  - `uploads/`: Para cargar los archivos de audio a procesar.
  - `processing/`: Para almacenar los archivos de estado del procesamiento.
  - `results/`: Para guardar los resultados de la transcripción y el análisis.
- **AWS Secrets Manager:** Un secret para almacenar las claves de API. El nombre del secret esperado en el código es `bdat/demo`, y debe contener las siguientes claves:
  - `ASSEMBLYAI_API_KEY`: Clave de API de AssemblyAI.
  - `ANTHROPIC_API_KEY`: Clave de API de Anthropic.

## Funcionamiento

La función Lambda se activa automáticamente cuando un nuevo archivo de audio es subido a la carpeta `uploads/` del bucket S3. El proceso que sigue es:

1.  **Inicio y Estado:** Actualiza el estado a "Iniciando" en la carpeta `processing/`.
2.  **Transcripción:** Utiliza **AssemblyAI** para transcribir el audio. El estado se actualiza a "Transcribiendo".
3.  **Análisis con IA:** Envía la transcripción a **Anthropic Claude 3 Haiku** para obtener un resumen, puntos destacados y temas principales. El estado se actualiza a "Analizando".
4.  **Guardado de Resultados:** Almacena la transcripción completa y el análisis en formato JSON en la carpeta `results/`.
5.  **Finalización:** Actualiza el estado a "Completado" en la carpeta `processing/`.

El paquete `deployment-package.zip` incluye todas las dependencias necesarias. Para desplegar, simplemente subir el zip la función Lambda y configurar las variables de entorno y triggers de S3 correspondientes.
