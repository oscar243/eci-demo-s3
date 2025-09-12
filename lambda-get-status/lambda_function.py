import boto3
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
PROCESSING_PREFIX = 'processing/'
RESULTS_PREFIX = 'results/'

def generate_presigned_url(bucket, key, expiration=300):
    """Generar URL prefirmada para descargar resultados (5 minutos por defecto)"""
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration
        )
        return presigned_url
    except Exception as e:
        logger.error(f"Error generando URL prefirmada para {key}: {e}")
        return None

def lambda_handler(event, context):
    try:
        logger.info(f"Consultando estado. Event: {json.dumps(event)}")
        
        # Obtener fileKey desde pathParameters
        original_file_key = event['pathParameters']['fileKey']
        logger.info(f"Consultando estado para archivo: {original_file_key}")
        
        # Construir clave del archivo de estado
        base_name = original_file_key.replace('uploads/', '').split('.')[0]
        status_key = f"{PROCESSING_PREFIX}{base_name}_status.json"
        
        logger.info(f"Buscando archivo de estado: {status_key}")

        try:
            # Intentar obtener el archivo de estado
            response = s3_client.get_object(Bucket=BUCKET_NAME, Key=status_key)
            content = response['Body'].read().decode('utf-8')
            status_data = json.loads(content)
            
            logger.info(f"Estado encontrado: {status_data.get('status', 'UNKNOWN')}")
            
            # Si el procesamiento está completado, agregar URLs de descarga
            if status_data.get('status') == 'COMPLETED':
                # Generar URLs prefirmadas para los resultados
                if 'resultado_key' in status_data:
                    resultado_url = generate_presigned_url(BUCKET_NAME, status_data['resultado_key'])
                    if resultado_url:
                        status_data['resultado_download_url'] = resultado_url
                
                if 'transcripcion_key' in status_data:
                    transcripcion_url = generate_presigned_url(BUCKET_NAME, status_data['transcripcion_key'])
                    if transcripcion_url:
                        status_data['transcripcion_download_url'] = transcripcion_url
            
            # Agregar información útil para el cliente
            status_data['polling_recommended'] = status_data.get('status') not in ['COMPLETED', 'ERROR']
            status_data['timestamp_consulta'] = datetime.now().isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(status_data, ensure_ascii=False)
            }
            
        except s3_client.exceptions.NoSuchKey:
            # Archivo de estado no existe, el proceso no ha comenzado
            logger.info("Archivo de estado no encontrado, proceso no iniciado")
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'file_key': original_file_key,
                    'status': 'PENDING',
                    'message': 'El archivo está en cola para procesamiento',
                    'progress': 0,
                    'timestamp': datetime.now().isoformat(),
                    'polling_recommended': True,
                    'timestamp_consulta': datetime.now().isoformat()
                }, ensure_ascii=False)
            }

    except KeyError as e:
        logger.error(f"Parámetro faltante en request: {e}")
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Parámetro fileKey requerido',
                'message': 'Debe proporcionar el fileKey del archivo a consultar'
            }, ensure_ascii=False)
        }
    
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Error interno del servidor',
                'message': 'No se pudo obtener el estado del procesamiento'
            }, ensure_ascii=False)
        }