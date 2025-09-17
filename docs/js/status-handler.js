/**
 * Manejador de estado de procesamiento de archivos
 * Realiza polling para monitorear el progreso y obtener resultados
 */

// ========================================
// CONFIGURACIÓN DEL API - EDITAR AQUÍ
// ========================================
const API_CONFIG = {
    // URL base del API Gateway para consultar estado
    STATUS_API_URL: 'https://wdinnh5fgb.execute-api.us-east-1.amazonaws.com/v1/status'
};
// ========================================

class StatusHandler {
    constructor() {
        this.apiBaseUrl = API_CONFIG.STATUS_API_URL;
        this.pollingInterval = 3000; // 3 segundos
        this.maxPollingTime = 300000; // 5 minutos máximo
        this.maxConsecutiveErrors = 5; // Máximo 5 errores consecutivos
        this.maxTotalErrors = 10; // Máximo 10 errores totales
        this.activePollings = new Map(); // Tracking de polling activos
        
        console.log('[StatusHandler] Inicializado');
        console.log('[StatusHandler] Configuración:');
        console.log('  - Intervalo de polling:', this.pollingInterval / 1000, 'segundos');
        console.log('  - Tiempo máximo:', this.maxPollingTime / 1000, 'segundos');
        console.log('  - Errores consecutivos máximos:', this.maxConsecutiveErrors);
        console.log('  - Errores totales máximos:', this.maxTotalErrors);
    }

    /**
     * Inicia el monitoreo de estado para un archivo
     * @param {string} fileKey - Clave del archivo subido (ej: "uploads/archivo.wav")
     */
    async startMonitoring(fileKey) {
        if (!fileKey) {
            console.error('[StatusHandler] Error: fileKey es requerido');
            return;
        }

        // Limpiar fileKey si viene con prefijo
        const cleanFileKey = fileKey.replace('uploads/', '');
        const fullFileKey = `uploads/${cleanFileKey}`;
        
        console.log('[StatusHandler] ===== INICIANDO MONITOREO =====');
        console.log('[StatusHandler] Archivo:', fullFileKey);
        
        // Verificar si ya hay polling activo para este archivo
        if (this.activePollings.has(fullFileKey)) {
            console.warn('[StatusHandler] Ya hay polling activo para este archivo');
            return;
        }

        const startTime = Date.now();
        
        // Marcar polling como activo con contadores de error
        this.activePollings.set(fullFileKey, {
            startTime,
            intervalId: null,
            consecutiveErrors: 0,
            totalErrors: 0,
            lastSuccessTime: Date.now()
        });

        // Primera consulta inmediata
        await this.checkStatus(fullFileKey);
        
        // Configurar polling
        const intervalId = setInterval(async () => {
            const elapsedTime = Date.now() - startTime;
            const pollingInfo = this.activePollings.get(fullFileKey);
            
            // Verificar timeout
            if (elapsedTime > this.maxPollingTime) {
                console.warn('[StatusHandler] Timeout alcanzado, deteniendo polling');
                this.stopMonitoring(fullFileKey, 'TIMEOUT');
                return;
            }
            
            // Verificar límites de error
            if (pollingInfo && pollingInfo.consecutiveErrors >= this.maxConsecutiveErrors) {
                console.error('[StatusHandler] ❌ Demasiados errores consecutivos, deteniendo polling');
                this.stopMonitoring(fullFileKey, 'TOO_MANY_CONSECUTIVE_ERRORS');
                return;
            }
            
            if (pollingInfo && pollingInfo.totalErrors >= this.maxTotalErrors) {
                console.error('[StatusHandler] ❌ Demasiados errores totales, deteniendo polling');
                this.stopMonitoring(fullFileKey, 'TOO_MANY_TOTAL_ERRORS');
                return;
            }
            
            await this.checkStatus(fullFileKey);
        }, this.pollingInterval);
        
        // Actualizar referencia del interval
        this.activePollings.get(fullFileKey).intervalId = intervalId;
        
        console.log('[StatusHandler] Polling iniciado cada', this.pollingInterval / 1000, 'segundos');
    }

    /**
     * Consulta el estado actual del procesamiento
     * @param {string} fileKey - Clave del archivo
     */
    async checkStatus(fileKey) {
        try {
            // No codificar el fileKey completo para mantener las barras / en la URL
            const url = `${this.apiBaseUrl}/${fileKey}`;
            
            console.log('[StatusHandler] Consultando estado...');
            console.log('[StatusHandler] URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const statusData = await response.json();
            
            // Consulta exitosa - resetear contadores de error
            const pollingInfo = this.activePollings.get(fileKey);
            if (pollingInfo) {
                pollingInfo.consecutiveErrors = 0;
                pollingInfo.lastSuccessTime = Date.now();
            }
            
            console.log('[StatusHandler] Estado recibido:', {
                status: statusData.status,
                progress: statusData.progress,
                message: statusData.message,
                timestamp: statusData.timestamp
            });

            // Procesar respuesta según el estado
            this.processStatusResponse(fileKey, statusData);

        } catch (error) {
            this.handlePollingError(fileKey, error);
        }
    }

    /**
     * Maneja errores durante el polling
     * @param {string} fileKey - Clave del archivo
     * @param {Error} error - Error ocurrido
     */
    handlePollingError(fileKey, error) {
        const pollingInfo = this.activePollings.get(fileKey);
        if (!pollingInfo) return;
        
        // Incrementar contadores de error
        pollingInfo.consecutiveErrors++;
        pollingInfo.totalErrors++;
        
        const timeSinceLastSuccess = Date.now() - pollingInfo.lastSuccessTime;
        
        console.error('[StatusHandler] Error consultando estado:', error.message);
        console.error('[StatusHandler] Estadísticas de error:');
        console.error('  - Errores consecutivos:', pollingInfo.consecutiveErrors, '/', this.maxConsecutiveErrors);
        console.error('  - Errores totales:', pollingInfo.totalErrors, '/', this.maxTotalErrors);
        console.error('  - Tiempo desde último éxito:', Math.round(timeSinceLastSuccess / 1000), 'segundos');
        
        // Verificar si se debe detener el polling
        if (pollingInfo.consecutiveErrors >= this.maxConsecutiveErrors) {
            console.error('[StatusHandler] 🛑 Límite de errores consecutivos alcanzado, deteniendo polling');
            this.stopMonitoring(fileKey, 'TOO_MANY_CONSECUTIVE_ERRORS');
            return;
        }
        
        if (pollingInfo.totalErrors >= this.maxTotalErrors) {
            console.error('[StatusHandler] 🛑 Límite de errores totales alcanzado, deteniendo polling');
            this.stopMonitoring(fileKey, 'TOO_MANY_TOTAL_ERRORS');
            return;
        }
        
        // Calcular próximo intento con backoff exponencial
        const backoffDelay = Math.min(this.pollingInterval * Math.pow(1.5, pollingInfo.consecutiveErrors), 30000);
        console.warn('[StatusHandler] ⏳ Reintentando en', Math.round(backoffDelay / 1000), 'segundos...');
    }

    /**
     * Procesa la respuesta de estado y toma acciones según el resultado
     * @param {string} fileKey - Clave del archivo
     * @param {Object} statusData - Datos de estado recibidos
     */
    processStatusResponse(fileKey, statusData) {
        const { status, progress, message, polling_recommended } = statusData;

        // Mostrar información del estado actual
        console.log('');
        console.log('[StatusHandler] ===== ESTADO ACTUAL =====');
        console.log('[StatusHandler] Archivo:', fileKey);
        console.log('[StatusHandler] Estado:', status);
        console.log('[StatusHandler] Progreso:', progress + '%');
        console.log('💬 [StatusHandler] Mensaje:', message);
        
        if (statusData.tiempo_total) {
            console.log('[StatusHandler] Tiempo total:', statusData.tiempo_total, 'segundos');
        }

        // Manejar estados específicos
        switch (status) {
            case 'PENDING':
                console.log('[StatusHandler] Archivo en cola, esperando inicio del procesamiento...');
                if (window.processingStages) {
                    window.processingStages.completeStage('trigger');
                }
                break;
                
            case 'STARTING':
                console.log('[StatusHandler] Procesamiento iniciado...');
                if (window.processingStages) {
                    window.processingStages.nextStage('transcribing');
                }
                break;
                
            case 'TRANSCRIBING':
                console.log('[StatusHandler] Transcribiendo audio con AssemblyAI...');
                if (window.processingStages) {
                    window.processingStages.nextStage('transcribing', 'Transcribiendo audio con AssemblyAI...');
                }
                break;
                
            case 'TRANSCRIPTION_COMPLETED':
                console.log('[StatusHandler] Transcripción completada');
                if (window.processingStages) {
                    window.processingStages.completeStage('transcribing');
                    window.processingStages.nextStage('analyzing');
                }
                break;
                
            case 'ANALYZING':
                console.log('[StatusHandler] Analizando contenido con IA...');
                if (window.processingStages) {
                    window.processingStages.nextStage('analyzing', 'Analizando contenido con Claude AI...');
                }
                break;
                
            case 'COMPLETED':
                console.log('[StatusHandler] ===== PROCESAMIENTO COMPLETADO =====');
                if (window.processingStages) {
                    window.processingStages.completeStage('analyzing');
                    window.processingStages.nextStage('completed');
                }
                this.handleCompletedProcessing(fileKey, statusData);
                this.stopMonitoring(fileKey, 'COMPLETED');
                return;
                
            case 'ERROR':
                console.error('[StatusHandler] ===== ERROR EN PROCESAMIENTO =====');
                console.error('[StatusHandler] Error:', message);
                if (window.processingStages) {
                    window.processingStages.errorStage(null, `Error en procesamiento: ${message}`);
                    window.processingStages.finishProcessing(false);
                }
                this.stopMonitoring(fileKey, 'PROCESSING_ERROR');
                return;
                
            default:
                console.log('[StatusHandler] Estado desconocido:', status);
        }

        // Verificar si se debe continuar el polling
        if (!polling_recommended) {
            console.log('[StatusHandler] Polling no recomendado, deteniendo monitoreo');
            this.stopMonitoring(fileKey, 'POLLING_NOT_RECOMMENDED');
        } else {
            console.log('🔄 [StatusHandler] Continuando monitoreo...');
        }

        console.log('');
    }

    /**
     * Maneja el procesamiento completado exitosamente
     * @param {string} fileKey - Clave del archivo
     * @param {Object} statusData - Datos de estado completos
     */
    /**
     * Maneja el procesamiento completado exitosamente
     * @param {string} fileKey - Clave del archivo
     * @param {Object} statusData - Datos del estado
     */
    async handleCompletedProcessing(fileKey, statusData) {
        const { 
            resultado_download_url, 
            transcripcion_download_url,
            resultado_key,
            transcripcion_key,
            tiempo_total
        } = statusData;

        console.log('[StatusHandler] Procesamiento finalizado exitosamente');
        console.log('[StatusHandler] Archivos generados:');
        
        if (resultado_key) {
            console.log('  Resultado completo:', resultado_key);
        }
        
        if (transcripcion_key) {
            console.log('  Transcripción:', transcripcion_key);
        }
        
        if (tiempo_total) {
            console.log('[StatusHandler] Tiempo total de procesamiento:', tiempo_total, 'segundos');
        }

        console.log('[StatusHandler] Enlaces de descarga:');
        
        if (resultado_download_url) {
            console.log('  Resultado completo:');
            console.log('    ', resultado_download_url);
        }
        
        if (transcripcion_download_url) {
            console.log('  Transcripción:');
            console.log('    ', transcripcion_download_url);
        }

        console.log('');
        console.log('[StatusHandler] Los enlaces de descarga son temporales y expiran en 1 hora');
        console.log('[StatusHandler] Descarga los archivos ahora si los necesitas');
        
        // Descargar y mostrar el resultado usando StatusUI
        if (resultado_download_url) {
            try {
                console.log('[StatusHandler] Descargando resultado para mostrar en UI...');
                const resultData = await this.downloadResultFile(resultado_download_url);
                
                if (resultData && window.statusUI) {
                    console.log('[StatusHandler] Mostrando resultado en StatusUI');
                    window.statusUI.showFinalResults(resultData);
                    
                    // Finalizar etapas de procesamiento exitosamente
                    if (window.processingStages) {
                        window.processingStages.completeStage('completed');
                        window.processingStages.finishProcessing(true);
                    }
                } else {
                    console.error('[StatusHandler] No se pudo descargar el resultado o StatusUI no está disponible');
                    if (window.processingStages) {
                        window.processingStages.errorStage('completed', 'Error mostrando resultados');
                        window.processingStages.finishProcessing(false);
                    }
                }
            } catch (error) {
                console.error('[StatusHandler] Error descargando resultado:', error);
                if (window.processingStages) {
                    window.processingStages.errorStage('completed', `Error descargando resultado: ${error.message}`);
                    window.processingStages.finishProcessing(false);
                }
            }
        } else {
            // No hay URL de descarga, pero aún así completar las etapas
            if (window.processingStages) {
                window.processingStages.completeStage('completed');
                window.processingStages.finishProcessing(true);
            }
        }
        
        console.log('[StatusHandler] ===== FIN DEL MONITOREO =====');
    }

    /**
     * Descarga el archivo de resultado desde la URL
     * @param {string} downloadUrl - URL de descarga
     * @returns {Object} Datos del resultado parseados
     */
    async downloadResultFile(downloadUrl) {
        try {
            console.log('[StatusHandler] Descargando desde:', downloadUrl);
            
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            
            const resultData = await response.json();
            console.log('[StatusHandler] Resultado descargado exitosamente');
            
            return resultData;
        } catch (error) {
            console.error('[StatusHandler] Error descargando resultado:', error);
            throw error;
        }
    }

    /**
     * Detiene el monitoreo para un archivo específico
     * @param {string} fileKey - Clave del archivo
     */
    stopMonitoring(fileKey) {
        const pollingInfo = this.activePollings.get(fileKey);
        
        if (pollingInfo && pollingInfo.intervalId) {
            clearInterval(pollingInfo.intervalId);
            console.log('[StatusHandler] Polling detenido para:', fileKey);
        }
        
        this.activePollings.delete(fileKey);
    }

    /**
     * Detiene todos los polling activos
     */
    stopAllMonitoring() {
        console.log('[StatusHandler] Deteniendo todos los polling activos...');
        
        for (const [fileKey, pollingInfo] of this.activePollings) {
            if (pollingInfo.intervalId) {
                clearInterval(pollingInfo.intervalId);
            }
        }
        
        this.activePollings.clear();
        console.log('[StatusHandler] Todos los polling detenidos');
    }

    /**
     * Obtiene el estado actual de todos los polling activos
     */
    getActivePollings() {
        const active = [];
        const now = Date.now();
        
        for (const [fileKey, pollingInfo] of this.activePollings) {
            active.push({
                fileKey,
                elapsedTime: Math.round((now - pollingInfo.startTime) / 1000),
                isActive: !!pollingInfo.intervalId
            });
        }
        
        return active;
    }

    /**
     * Muestra información de debugging
     */
    showDebugInfo() {
        console.log('[StatusHandler] ===== DEBUG INFO =====');
        console.log('[StatusHandler] API Base URL:', this.apiBaseUrl);
        console.log('[StatusHandler] Polling Interval:', this.pollingInterval / 1000, 'segundos');
        console.log('[StatusHandler] Max Polling Time:', this.maxPollingTime / 1000, 'segundos');
        console.log('[StatusHandler] Active Pollings:', this.getActivePollings());
        console.log('[StatusHandler] ========================');
    }
}

// Crear instancia global
window.statusHandler = new StatusHandler();

// Exportar para uso global
window.StatusHandler = StatusHandler;

console.log('[StatusHandler] Clase StatusHandler cargada y disponible globalmente');
