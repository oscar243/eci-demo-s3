import json
import boto3
import os
import re
import uuid
from datetime import datetime

# Configuración
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_AUDIO_TYPES = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/vnd.wave', 'audio/wave',
    'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-wav',
    'audio/x-ms-wma', 'audio/webm', 'audio/opus', 'audio/3gpp', 'audio/amr',
    'audio/x-aiff', 'audio/aiff', 'audio/x-m4a', 'audio/m4a'
]
SAFE_FILENAME = re.compile(r'^[a-zA-Z0-9._\-\s()]+$')

def validate_request(file_name, content_type, file_size):
    """Validar archivo de audio"""
    if not file_name or len(file_name) > 100:
        return False, "Nombre de archivo inválido"
    
    if not SAFE_FILENAME.match(file_name):
        return False, "Nombre contiene caracteres no permitidos"
    
    if content_type not in ALLOWED_AUDIO_TYPES:
        return False, "Solo se permiten archivos de audio"
    
    if file_size > MAX_FILE_SIZE:
        return False, "Archivo muy grande, máximo 20MB"
    
    return True, "Válido"

def generate_upload_url(bucket_name, file_name, content_type):
    """Generar URL temporal para subir archivo"""
    s3_client = boto3.client('s3')
    
    file_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    extension_map = {
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 
        'audio/wav': 'wav', 'audio/vnd.wave': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav',
        'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a',
        'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/webm': 'webm', 'audio/opus': 'opus',
        'audio/x-ms-wma': 'wma', 'audio/3gpp': '3gp', 'audio/amr': 'amr',
        'audio/x-aiff': 'aiff', 'audio/aiff': 'aiff'
    }
    
    extension = extension_map.get(content_type, 'audio')
    clean_name = re.sub(r'[^a-zA-Z0-9._\-\s()]', '_', file_name)
    
    if clean_name.lower().endswith(f'.{extension}'):
        clean_name = clean_name[:-len(f'.{extension}')]
    
    s3_key = f"uploads/{timestamp}_{file_id}_{clean_name}.{extension}"
    
    presigned_post = s3_client.generate_presigned_post(
        Bucket=bucket_name,
        Key=s3_key,
        Fields={"Content-Type": content_type},
        Conditions=[
            {"bucket": bucket_name},
            {"key": s3_key},
            {"Content-Type": content_type},
            ["content-length-range", 1, MAX_FILE_SIZE],
            ["starts-with", "$Content-Type", "audio/"]
        ],
        ExpiresIn=3600
    )
    
    return {
        "success": True,
        "upload_url": presigned_post['url'],
        "fields": presigned_post['fields'],
        "file_key": s3_key
    }

def lambda_handler(event, context):
    """Handler principal"""
    try:
        if 'body' in event and event['body']:
            body = json.loads(event['body'])
        else:
            body = event
        
        file_name = body.get('file_name')
        content_type = body.get('content_type')
        file_size = int(body.get('file_size', 0))
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        
        if not bucket_name:
            raise ValueError("S3_BUCKET_NAME no configurado")
        
        if not file_name or not content_type:
            raise ValueError("file_name y content_type son requeridos")
        
        is_valid, message = validate_request(file_name, content_type, file_size)
        if not is_valid:
            raise ValueError(message)
        
        result = generate_upload_url(bucket_name, file_name, content_type)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
        
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Error interno'})
        }
