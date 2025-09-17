/**
 * Manejador de subida de archivos a S3
 * Maneja la comunicación con API Gateway y la subida directa a S3
 */

// ========================================
// CONFIGURACIÓN DEL API - EDITAR AQUÍ
// ========================================
const API_CONFIG = {
    // URL del API Gateway para generar URLs de subida
    UPLOAD_API_URL: 'https://wdinnh5fgb.execute-api.us-east-1.amazonaws.com/v1/generate-upload-url'
};
// ========================================

class UploadHandler {
    constructor() {
        this.apiUrl = API_CONFIG.UPLOAD_API_URL;
        this.maxFileSize = 20 * 1024 * 1024; // 20MB
        this.allowedTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/vnd.wave',
            'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac'
        ];
    }

    /**
     * Obtiene URL de subida temporal desde API Gateway
     * @param {Object} fileInfo - Información del archivo
     * @returns {Promise<Object>} - Respuesta con URL y campos para subida
     */
    async getUploadUrl(fileInfo) {
        console.log('[UploadHandler] Iniciando solicitud de URL de subida');
        console.log('[UploadHandler] Información del archivo:', {
            name: fileInfo.name,
            type: fileInfo.type,
            size: fileInfo.size,
            sizeFormatted: this.formatFileSize(fileInfo.size)
        });
        console.log('[UploadHandler] URL del API:', this.apiUrl);

        try {
            const requestBody = {
                file_name: fileInfo.name,
                content_type: fileInfo.type,
                file_size: fileInfo.size
            };
            
            console.log('[UploadHandler] Enviando request body:', requestBody);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[UploadHandler] Response status:', response.status);
            console.log('[UploadHandler] Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('[UploadHandler] Response data:', data);

            if (!response.ok) {
                console.error('[UploadHandler] Error en response:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error
                });
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
            }

            if (!data.success) {
                console.error('[UploadHandler] API retornó success: false:', data.error);
                throw new Error(data.error || 'Error obteniendo URL de subida');
            }

            console.log('[UploadHandler] URL de subida obtenida exitosamente');
            console.log('[UploadHandler] Upload URL:', data.upload_url);
            console.log('[UploadHandler] File key:', data.file_key);
            console.log('[UploadHandler] Fields:', data.fields);

            return data;
        } catch (error) {
            console.error('[UploadHandler] Error obteniendo URL de subida:', error);
            console.error('[UploadHandler] Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * Sube archivo directamente a S3 usando URL presignada
     * @param {File} file - Archivo a subir
     * @param {Object} uploadData - Datos de subida (URL y campos)
     * @param {Function} onProgress - Callback para progreso
     * @returns {Promise<Object>} - Resultado de la subida
     */
    async uploadToS3(file, uploadData, onProgress = null) {
        console.log('[UploadHandler] Iniciando subida a S3');
        console.log('[UploadHandler] Archivo a subir:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        console.log('[UploadHandler] S3 Upload URL:', uploadData.upload_url);
        console.log('[UploadHandler] S3 Fields:', uploadData.fields);

        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // Agregar campos requeridos por S3
            console.log('[UploadHandler] Agregando campos a FormData...');
            Object.keys(uploadData.fields).forEach(key => {
                formData.append(key, uploadData.fields[key]);
                console.log(`   ${key}: ${uploadData.fields[key]}`);
            });

            // Agregar el archivo al final
            formData.append('file', file);
            console.log('[UploadHandler] Archivo agregado a FormData');

            const xhr = new XMLHttpRequest();

            // Configurar callback de progreso
            if (onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        console.log(`[UploadHandler] Progreso: ${percentComplete.toFixed(1)}% (${event.loaded}/${event.total} bytes)`);
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                console.log('[UploadHandler] XHR Load event - Status:', xhr.status);
                console.log('[UploadHandler] XHR Response:', xhr.responseText);
                console.log('[UploadHandler] XHR Response headers:', xhr.getAllResponseHeaders());

                if (xhr.status === 204) {
                    console.log('[UploadHandler] Subida a S3 exitosa (status 204)');
                    resolve({
                        success: true,
                        fileKey: uploadData.file_key,
                        message: 'Archivo subido exitosamente'
                    });
                } else {
                    console.error('[UploadHandler] Error en subida a S3:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        response: xhr.responseText
                    });
                    reject(new Error(`Error en subida: ${xhr.status} ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', (event) => {
                console.error('[UploadHandler] Error de red en XHR:', event);
                reject(new Error('Error de red durante la subida'));
            });

            xhr.addEventListener('abort', (event) => {
                console.warn('[UploadHandler] Subida cancelada (XHR abort):', event);
                reject(new Error('Subida cancelada'));
            });

            console.log('[UploadHandler] Iniciando POST a S3...');
            xhr.open('POST', uploadData.upload_url);
            xhr.send(formData);
        });
    }

    /**
     * Proceso completo de subida: obtener URL y subir archivo
     * @param {File} file - Archivo a subir
     * @param {Function} onProgress - Callback para progreso
     * @returns {Promise<Object>} - Resultado final
     */
    async uploadFile(file, onProgress = null) {
        console.log('[UploadHandler] ===== INICIANDO PROCESO COMPLETO DE SUBIDA =====');
        console.log('[UploadHandler] Archivo seleccionado:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });

        try {
            // Paso 1: Validar archivo
            console.log('[UploadHandler] PASO 1: Validando archivo...');
            const validation = this.validateFile(file);
            if (!validation.valid) {
                console.error('[UploadHandler] Validación falló:', validation.error);
                throw new Error(validation.error);
            }
            console.log('[UploadHandler] Archivo válido');

            // Determinar nombre de archivo a usar
            const fileName = this.generateShortFileName(file.name);
            if (fileName !== file.name) {
                console.log('[UploadHandler] Usando nombre procesado:', fileName);
            }

            // Paso 2: Obtener URL de subida
            console.log('[UploadHandler] PASO 2: Obteniendo URL de subida...');
            const uploadData = await this.getUploadUrl({
                name: fileName,
                type: file.type,
                size: file.size
            });
            console.log('[UploadHandler] URL de subida obtenida');

            // Paso 3: Subir archivo a S3
            console.log('[UploadHandler] PASO 3: Subiendo archivo a S3...');
            const result = await this.uploadToS3(file, uploadData, onProgress);
            console.log('[UploadHandler] Archivo subido a S3');

            const finalResult = {
                success: true,
                fileKey: result.fileKey,
                fileName: fileName,
                fileSize: file.size,
                fileType: file.type,
                message: 'Archivo subido exitosamente'
            };

            console.log('[UploadHandler] ===== PROCESO COMPLETADO EXITOSAMENTE =====');
            console.log('[UploadHandler] Resultado final:', finalResult);

            return finalResult;

        } catch (error) {
            console.error('[UploadHandler] ===== ERROR EN PROCESO DE SUBIDA =====');
            console.error('[UploadHandler] Error:', error.message);
            console.error('[UploadHandler] Stack trace:', error.stack);
            throw error;
        }
    }

    /**
     * Cancela subida en progreso (si es posible)
     * @param {XMLHttpRequest} xhr - Request a cancelar
     */
    cancelUpload(xhr) {
        if (xhr && xhr.readyState !== XMLHttpRequest.DONE) {
            xhr.abort();
        }
    }

    /**
     * Genera un nombre de archivo más corto si es necesario
     * @param {string} originalName - Nombre original del archivo
     * @returns {string} - Nombre procesado (original o alias)
     */
    generateShortFileName(originalName) {
        console.log('[UploadHandler] Generando nombre corto para:', originalName);
        console.log('[UploadHandler] Longitud original:', originalName.length);

        if (originalName.length <= 100) {
            console.log('[UploadHandler] Nombre ya es válido, no se requiere alias');
            return originalName;
        }

        // Extraer extensión
        const lastDotIndex = originalName.lastIndexOf('.');
        const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';
        const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;

        console.log('[UploadHandler] Extensión detectada:', extension);

        // Buscar patrones básicos para crear nombre más simple
        const patterns = {
            date: /DATE_(\d{2}-\d{2}-\d{2})/,
            ani: /ANI_(\d+)/,
            dnis: /DNIS_(\d+)/
        };

        const matches = {};
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = nameWithoutExt.match(pattern);
            if (match) {
                matches[key] = match[1];
            }
        }

        // Construir nombre corto y simple
        const parts = [];
        
        if (matches.date) {
            parts.push(matches.date.replace(/-/g, ''));
        }
        
        if (matches.ani) {
            parts.push(matches.ani.substring(0, 6)); // Solo 6 dígitos
        }
        
        if (matches.dnis) {
            parts.push(`D${matches.dnis}`);
        }

        // Si no encontramos patrones, usar timestamp simple
        if (parts.length === 0) {
            const now = new Date();
            const timestamp = now.getFullYear().toString().slice(-2) + 
                            (now.getMonth() + 1).toString().padStart(2, '0') + 
                            now.getDate().toString().padStart(2, '0') + '_' +
                            now.getHours().toString().padStart(2, '0') + 
                            now.getMinutes().toString().padStart(2, '0');
            parts.push(`audio_${timestamp}`);
        }

        const shortName = parts.join('_');
        const finalName = shortName + extension;
        
        console.log('[UploadHandler] Nuevo nombre generado:', finalName);
        console.log('[UploadHandler] Nueva longitud:', finalName.length);

        return finalName;
    }
    /**
     * Valida archivo antes de subir
     * @param {File} file - Archivo a validar
     * @returns {Object} - Resultado de validación
     */
    validateFile(file) {
        console.log('[UploadHandler] Iniciando validación de archivo...');
        
        if (!file) {
            console.error('[UploadHandler] Validación: No hay archivo');
            return { valid: false, error: 'No se seleccionó ningún archivo' };
        }

        console.log('[UploadHandler] Validando tamaño del archivo...');
        if (file.size === 0) {
            console.error('[UploadHandler] Validación: Archivo vacío');
            return { valid: false, error: 'El archivo está vacío' };
        }

        if (file.size > this.maxFileSize) {
            console.error('[UploadHandler] Validación: Archivo muy grande', {
                fileSize: file.size,
                maxSize: this.maxFileSize,
                fileSizeFormatted: this.formatFileSize(file.size),
                maxSizeFormatted: this.formatFileSize(this.maxFileSize)
            });
            return { 
                valid: false, 
                error: `El archivo es muy grande. Máximo permitido: ${this.formatFileSize(this.maxFileSize)}` 
            };
        }

        console.log('[UploadHandler] Validando tipo de archivo...');
        if (!this.allowedTypes.includes(file.type)) {
            console.error('[UploadHandler] Validación: Tipo no permitido', {
                fileType: file.type,
                allowedTypes: this.allowedTypes
            });
            return { 
                valid: false, 
                error: 'Tipo de archivo no permitido. Solo se permiten archivos de audio.' 
            };
        }

        console.log('[UploadHandler] Validando nombre del archivo...');
        
        // Generar nombre corto si es necesario
        const processedName = this.generateShortFileName(file.name);
        
        // Validar caracteres en nombre de archivo
        const safePattern = /^[a-zA-Z0-9._\-\s()]+$/;
        if (!safePattern.test(processedName)) {
            console.error('[UploadHandler] Validación: Caracteres no permitidos en nombre', {
                fileName: processedName,
                pattern: safePattern.toString()
            });
            return { 
                valid: false, 
                error: 'El nombre del archivo contiene caracteres no permitidos' 
            };
        }

        console.log('[UploadHandler] Validación exitosa - Archivo válido');
        return { valid: true, error: null };
    }

    /**
     * Formatea tamaño de archivo para mostrar
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} - Tamaño formateado
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Exportar para uso global
window.UploadHandler = UploadHandler;
