"""
Función Lambda para procesamiento de audio con transcripción y análisis
Demo S3
"""

import json
import boto3
import os
import time
import logging
from datetime import datetime
import assemblyai as aai
import anthropic

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# =============================================================================
# PROMPT CONFIGURABLE - FÁCIL DE CAMBIAR
# =============================================================================
ANALYSIS_PROMPT = """
Analiza la siguiente transcripción de audio y proporciona:

1. **Resumen breve** (2-3 oraciones sobre el contenido principal)
2. **Puntos destacados** (3-5 puntos importantes mencionados)
3. **Temas principales** (categorías o temas que se discuten)
4. **Duración estimada de la conversación** (si se puede inferir)
5. **Tono general** (formal, informal, técnico, etc.)

Responde en formato JSON con esta estructura:
{
    "resumen": "texto del resumen",
    "puntos_destacados": ["punto 1", "punto 2", "punto 3"],
    "temas_principales": ["tema 1", "tema 2"],
    "duracion_estimada": "X minutos",
    "tono_general": "descripción del tono",
    "timestamp_analisis": "fecha y hora del análisis"
}

Transcripción a analizar:
"""

# =============================================================================
# CONFIGURACIÓN
# =============================================================================
SECRET_NAME = "bdat/demo"
RESULTS_BUCKET_PREFIX = "results/"
PROCESSING_BUCKET_PREFIX = "processing/"

def get_secrets():
    """Obtener secrets de AWS Secrets Manager"""
    try:
        client = boto3.client('secretsmanager')
        get_secret_value_response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_string = get_secret_value_response['SecretString']
        secret_dict = json.loads(secret_string)
        
        assemblyai_key = secret_dict.get('ASSEMBLYAI_API_KEY', '')
        anthropic_key = secret_dict.get('ANTHROPIC_API_KEY', '')
        
        if not assemblyai_key or not anthropic_key:
            raise ValueError("API keys not found in secrets")
            
        return assemblyai_key, anthropic_key
        
    except Exception as e:
        logger.error(f"Error getting secrets: {e}")
        raise

def get_transcriber():
    """
    Inicializa y retorna el transcriptor de AssemblyAI.
    Compatible con código original.
    """
    return aai.Transcriber()

def transcribe_audio(audio_url, assemblyai_key):
    """Transcribir audio usando AssemblyAI - Compatible con código original"""
    try:
        # Configurar AssemblyAI
        aai.settings.api_key = assemblyai_key
        transcriber = get_transcriber()
        
        # Configurar parámetros de transcripción (mismo que el original)
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speakers_expected=2,
            language_code="es",
            format_text=True,
            punctuate=True
        )
        
        logger.info(f"Iniciando transcripción de: {audio_url[:100]}...")
        
        # Transcribir
        transcript = transcriber.transcribe(audio_url, config=config)
        
        if transcript.status == aai.TranscriptStatus.error:
            error_msg = f"Error en transcripción AssemblyAI: {transcript.error}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Usar json_response como en el código original
        json_response = transcript.json_response
        
        # Formatear resultado compatible con el procesador original
        result = {
            "success": True,
            "data": json_response,
            "file_name": audio_url.split('/')[-1],  # Extraer nombre del archivo de la URL
            "id": transcript.id,
            "text": transcript.text,
            "audio_duration": transcript.audio_duration
        }
        
        # Agregar utterances si están disponibles
        utterances = []
        if transcript.utterances:
            for utterance in transcript.utterances:
                utterances.append({
                    "speaker": utterance.speaker,
                    "text": utterance.text,
                    "start": utterance.start,
                    "end": utterance.end
                })
        result["utterances"] = utterances
        
        logger.info(f"Transcripción completada. Duración: {transcript.audio_duration}ms, Utterances: {len(utterances)}")
        return result
        
    except Exception as e:
        error_msg = f"Error en transcripción: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)

def analyze_with_ai(transcript_text, anthropic_key):
    """Analizar transcripción con Claude"""
    try:
        # Configurar Anthropic
        client = anthropic.Anthropic(api_key=anthropic_key)
        
        # Preparar prompt completo
        full_prompt = ANALYSIS_PROMPT + "\n\n" + transcript_text
        
        logger.info("Iniciando análisis con Claude")
        
        # Llamar a Claude
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.1,
            messages=[{
                "role": "user",
                "content": full_prompt
            }]
        )
        
        # Extraer respuesta
        analysis_text = response.content[0].text
        
        # Intentar parsear como JSON
        try:
            analysis_json = json.loads(analysis_text)
        except json.JSONDecodeError:
            # Si no es JSON válido, crear estructura básica
            analysis_json = {
                "resumen": "Análisis disponible en texto plano",
                "puntos_destacados": ["Ver análisis completo en campo 'analisis_texto'"],
                "temas_principales": ["Análisis general"],
                "duracion_estimada": "No determinada",
                "tono_general": "No determinado",
                "analisis_texto": analysis_text,
                "timestamp_analisis": datetime.now().isoformat()
            }
        
        # Agregar timestamp si no existe
        if "timestamp_analisis" not in analysis_json:
            analysis_json["timestamp_analisis"] = datetime.now().isoformat()
        
        # Agregar metadata
        analysis_json["tokens_utilizados"] = response.usage.input_tokens + response.usage.output_tokens
        analysis_json["modelo_usado"] = "claude-3-haiku-20240307"
        
        logger.info(f"Análisis completado. Tokens: {analysis_json['tokens_utilizados']}")
        return analysis_json
        
    except Exception as e:
        logger.error(f"Error en análisis AI: {e}")
        raise

def generate_presigned_url(bucket, key, expiration=900):
    """Generar URL prefirmada para acceso temporal a S3 (15 minutos por defecto)"""
    try:
        s3 = boto3.client('s3')
        
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration  # 900 segundos = 15 minutos
        )
        
        logger.info(f"URL prefirmada generada para {key}, expira en {expiration} segundos")
        return presigned_url
        
    except Exception as e:
        logger.error(f"Error generando URL prefirmada: {e}")
        raise

def save_to_s3(bucket, key, data, content_type="application/json"):
    """Guardar datos en S3"""
    try:
        s3 = boto3.client('s3')
        
        if isinstance(data, dict):
            body = json.dumps(data, indent=2, ensure_ascii=False)
        else:
            body = str(data)
        
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )
        
        logger.info(f"Archivo guardado en S3: s3://{bucket}/{key}")
        return f"s3://{bucket}/{key}"
        
    except Exception as e:
        logger.error(f"Error guardando en S3: {e}")
        raise

def update_processing_status(bucket, file_key, status, message="", progress=0):
    """Actualizar estado de procesamiento"""
    try:
        # Crear nombre del archivo de estado
        base_name = file_key.replace('uploads/', '').split('.')[0]
        status_key = f"{PROCESSING_BUCKET_PREFIX}{base_name}_status.json"
        
        status_data = {
            "file_key": file_key,
            "status": status,
            "message": message,
            "progress": progress,
            "timestamp": datetime.now().isoformat(),
            "lambda_request_id": os.environ.get('AWS_REQUEST_ID', 'unknown')
        }
        
        save_to_s3(bucket, status_key, status_data)
        
    except Exception as e:
        logger.warning(f"Error actualizando estado: {e}")

def lambda_handler(event, context):
    """Handler principal de Lambda"""
    start_time = time.time()
    
    try:
        logger.info(f"Lambda iniciada. Event: {json.dumps(event)}")
        
        # Extraer información del evento S3
        s3_event = event['Records'][0]['s3']
        bucket_name = s3_event['bucket']['name']
        file_key = s3_event['object']['key']
        
        logger.info(f"Procesando archivo: s3://{bucket_name}/{file_key}")
        
        # Verificar que es un archivo de upload
        if not file_key.startswith('uploads/'):
            logger.info("Archivo no está en carpeta uploads/, ignorando")
            return {
                'statusCode': 200,
                'body': json.dumps('Archivo ignorado - no está en uploads/')
            }
        
        # Actualizar estado: Iniciando
        update_processing_status(bucket_name, file_key, "STARTING", "Iniciando procesamiento", 10)
        
        # Obtener secrets
        logger.info("Obteniendo API keys...")
        assemblyai_key, anthropic_key = get_secrets()
        
        # Generar URL prefirmada para AssemblyAI (15 minutos de acceso)
        logger.info(f"Generando URL prefirmada para: {file_key}")
        audio_url = generate_presigned_url(bucket_name, file_key, expiration=900)
        
        # Actualizar estado: Transcribiendo
        update_processing_status(bucket_name, file_key, "TRANSCRIBING", "Transcribiendo audio con AssemblyAI", 30)
        
        # Transcribir audio
        logger.info(f"Iniciando transcripción con URL prefirmada...")
        logger.info(f"URL (primeros 100 chars): {audio_url[:100]}...")
        transcription = transcribe_audio(audio_url, assemblyai_key)
        
        # Actualizar estado: Transcripción completa
        update_processing_status(bucket_name, file_key, "TRANSCRIPTION_COMPLETED", "Transcripción completada", 60)
        
        # Verificar que hay texto para analizar
        if not transcription.get('text'):
            raise Exception("No se obtuvo texto de la transcripción")
        
        # Actualizar estado: Analizando
        update_processing_status(bucket_name, file_key, "ANALYZING", "Analizando contenido con IA", 80)
        
        # Analizar con IA
        logger.info("Iniciando análisis con IA...")
        analysis = analyze_with_ai(transcription['text'], anthropic_key)
        
        # Crear resultado final
        base_name = file_key.replace('uploads/', '').split('.')[0]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        result = {
            "metadata": {
                "file_original": file_key,
                "bucket": bucket_name,
                "timestamp_procesamiento": datetime.now().isoformat(),
                "lambda_request_id": context.aws_request_id,
                "tiempo_procesamiento_segundos": round(time.time() - start_time, 2)
            },
            "transcripcion": transcription,
            "analisis": analysis
        }
        
        # Guardar resultado completo
        result_key = f"{RESULTS_BUCKET_PREFIX}{base_name}_{timestamp}_resultado.json"
        save_to_s3(bucket_name, result_key, result)
        
        # Guardar solo transcripción
        transcription_key = f"{RESULTS_BUCKET_PREFIX}{base_name}_{timestamp}_transcripcion.json"
        save_to_s3(bucket_name, transcription_key, transcription)
        
        # Actualizar estado: Completado
        final_status = {
            "file_key": file_key,
            "status": "COMPLETED",
            "message": "Procesamiento completado exitosamente",
            "progress": 100,
            "timestamp": datetime.now().isoformat(),
            "resultado_key": result_key,
            "transcripcion_key": transcription_key,
            "tiempo_total": round(time.time() - start_time, 2)
        }
        
        status_key = f"{PROCESSING_BUCKET_PREFIX}{base_name}_status.json"
        save_to_s3(bucket_name, status_key, final_status)
        
        logger.info(f"Procesamiento completado exitosamente en {final_status['tiempo_total']} segundos")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Procesamiento completado exitosamente',
                'resultado_key': result_key,
                'transcripcion_key': transcription_key,
                'tiempo_procesamiento': final_status['tiempo_total']
            })
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error en procesamiento: {error_msg}")
        
        # Intentar actualizar estado de error
        try:
            if 'file_key' in locals() and 'bucket_name' in locals():
                update_processing_status(
                    bucket_name, 
                    file_key, 
                    "ERROR", 
                    f"Error: {error_msg}", 
                    0
                )
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_msg,
                'message': 'Error durante el procesamiento'
            })
        }
