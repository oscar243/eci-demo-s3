/**
 * Sistema de logging avanzado para debugging y monitoreo
 * Permite diferentes niveles de log y persistencia local
 */

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'INFO';
        this.enableConsole = options.enableConsole !== false;
        this.enableStorage = options.enableStorage !== false;
        this.maxStoredLogs = options.maxStoredLogs || 1000;
        this.component = options.component || 'App';
        
        this.levels = {
            'ERROR': 0,
            'WARN': 1,
            'INFO': 2,
            'DEBUG': 3,
            'TRACE': 4
        };
        
        this.logs = this.loadStoredLogs();
        this.sessionId = this.generateSessionId();
        
        // Log inicial del sistema
        this.info('Logger inicializado', {
            sessionId: this.sessionId,
            level: this.level,
            component: this.component,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Genera ID único para la sesión
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Carga logs almacenados localmente
     */
    loadStoredLogs() {
        if (!this.enableStorage) return [];
        
        try {
            const stored = localStorage.getItem('upload_logs');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Error cargando logs almacenados:', error);
            return [];
        }
    }

    /**
     * Guarda logs en localStorage
     */
    saveLogsToStorage() {
        if (!this.enableStorage) return;
        
        try {
            // Mantener solo los logs más recientes
            const recentLogs = this.logs.slice(-this.maxStoredLogs);
            localStorage.setItem('upload_logs', JSON.stringify(recentLogs));
        } catch (error) {
            console.warn('Error guardando logs:', error);
        }
    }

    /**
     * Método principal de logging
     */
    log(level, message, data = {}, error = null) {
        if (this.levels[level] > this.levels[this.level]) {
            return; // No logear si el nivel es menor al configurado
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            sessionId: this.sessionId,
            level,
            component: this.component,
            message,
            data: this.sanitizeData(data),
            error: error ? this.serializeError(error) : null,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Agregar a la colección de logs
        this.logs.push(logEntry);
        
        // Guardar en storage
        this.saveLogsToStorage();

        // Log en consola con formato
        if (this.enableConsole) {
            this.logToConsole(logEntry);
        }

        // Trigger evento personalizado para listeners externos
        this.dispatchLogEvent(logEntry);

        return logEntry;
    }

    /**
     * Sanitiza datos para evitar referencias circulares
     */
    sanitizeData(data) {
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            return { error: 'No se pudo serializar los datos', original: String(data) };
        }
    }

    /**
     * Serializa errores para almacenamiento
     */
    serializeError(error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code || null,
            status: error.status || null
        };
    }

    /**
     * Log formateado en consola
     */
    logToConsole(logEntry) {
        const { level, timestamp, component, message, data, error } = logEntry;
        
        const styles = {
            'ERROR': 'color: #ff4444; font-weight: bold;',
            'WARN': 'color: #ff8800; font-weight: bold;',
            'INFO': 'color: #0088ff; font-weight: bold;',
            'DEBUG': 'color: #888888;',
            'TRACE': 'color: #666666; font-style: italic;'
        };

        const timeStr = new Date(timestamp).toLocaleTimeString();
        const prefix = `[${timeStr}] [${component}] [${level}]`;
        
        console.group(`%c${prefix} ${message}`, styles[level] || '');
        
        if (Object.keys(data).length > 0) {
            console.log('Datos:', data);
        }
        
        if (error) {
            console.error('Error:', error);
        }
        
        console.groupEnd();
    }

    /**
     * Dispara evento personalizado para listeners
     */
    dispatchLogEvent(logEntry) {
        window.dispatchEvent(new CustomEvent('uploadLog', { 
            detail: logEntry 
        }));
    }

    // Métodos de conveniencia para diferentes niveles
    error(message, data = {}, error = null) {
        return this.log('ERROR', message, data, error);
    }

    warn(message, data = {}) {
        return this.log('WARN', message, data);
    }

    info(message, data = {}) {
        return this.log('INFO', message, data);
    }

    debug(message, data = {}) {
        return this.log('DEBUG', message, data);
    }

    trace(message, data = {}) {
        return this.log('TRACE', message, data);
    }

    /**
     * Métodos especializados para el proceso de upload
     */
    uploadStart(fileName, fileSize, fileType) {
        return this.info('Iniciando proceso de upload', {
            fileName,
            fileSize,
            fileType,
            fileSizeFormatted: this.formatFileSize(fileSize)
        });
    }

    uploadProgress(percent, bytesLoaded, bytesTotal) {
        return this.debug('📊 Progreso de upload', {
            percent: Math.round(percent),
            bytesLoaded,
            bytesTotal,
            speed: this.calculateSpeed(bytesLoaded)
        });
    }

    uploadSuccess(result) {
        return this.info('✅ Upload completado exitosamente', result);
    }

    uploadError(error, context = {}) {
        return this.error('❌ Error en upload', context, error);
    }

    apiRequest(method, url, data = {}) {
        return this.debug('🌐 Realizando petición API', {
            method,
            url,
            requestData: data,
            timestamp: Date.now()
        });
    }

    apiResponse(status, data, requestTime) {
        const responseTime = Date.now() - requestTime;
        return this.debug('📥 Respuesta API recibida', {
            status,
            responseTime: `${responseTime}ms`,
            responseData: data
        });
    }

    validationError(field, value, rule) {
        return this.warn('⚠️ Error de validación', {
            field,
            value,
            rule,
            type: 'validation'
        });
    }

    /**
     * Utilidades
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    calculateSpeed(bytesLoaded) {
        const now = Date.now();
        if (!this.lastSpeedCheck) {
            this.lastSpeedCheck = { time: now, bytes: 0 };
            return '0 KB/s';
        }

        const timeDiff = (now - this.lastSpeedCheck.time) / 1000;
        const bytesDiff = bytesLoaded - this.lastSpeedCheck.bytes;
        const speed = bytesDiff / timeDiff;

        this.lastSpeedCheck = { time: now, bytes: bytesLoaded };

        return this.formatFileSize(speed) + '/s';
    }

    /**
     * Obtiene logs filtrados
     */
    getLogs(filter = {}) {
        let filteredLogs = [...this.logs];

        if (filter.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level);
        }

        if (filter.component) {
            filteredLogs = filteredLogs.filter(log => log.component === filter.component);
        }

        if (filter.since) {
            const since = new Date(filter.since);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= since);
        }

        if (filter.search) {
            const search = filter.search.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(search) ||
                JSON.stringify(log.data).toLowerCase().includes(search)
            );
        }

        return filteredLogs;
    }

    /**
     * Exporta logs como texto
     */
    exportLogs(format = 'json') {
        const logs = this.getLogs();
        
        if (format === 'json') {
            return JSON.stringify(logs, null, 2);
        } else if (format === 'text') {
            return logs.map(log => {
                const time = new Date(log.timestamp).toLocaleString();
                const errorInfo = log.error ? ` | Error: ${log.error.message}` : '';
                return `[${time}] [${log.level}] ${log.message}${errorInfo}`;
            }).join('\n');
        }
    }

    /**
     * Descarga logs como archivo
     */
    downloadLogs(format = 'json') {
        const content = this.exportLogs(format);
        const filename = `upload_logs_${this.sessionId}.${format === 'json' ? 'json' : 'txt'}`;
        const mimeType = format === 'json' ? 'application/json' : 'text/plain';
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.info('📥 Logs descargados', { filename, format });
    }

    /**
     * Limpia logs almacenados
     */
    clearLogs() {
        this.logs = [];
        if (this.enableStorage) {
            localStorage.removeItem('upload_logs');
        }
        this.info('🧹 Logs limpiados');
    }

    /**
     * Genera reporte de sesión
     */
    generateSessionReport() {
        const sessionLogs = this.logs.filter(log => log.sessionId === this.sessionId);
        const errorCount = sessionLogs.filter(log => log.level === 'ERROR').length;
        const warnCount = sessionLogs.filter(log => log.level === 'WARN').length;
        
        return {
            sessionId: this.sessionId,
            totalLogs: sessionLogs.length,
            errorCount,
            warnCount,
            startTime: sessionLogs[0]?.timestamp,
            endTime: sessionLogs[sessionLogs.length - 1]?.timestamp,
            logs: sessionLogs
        };
    }
}

// Crear instancia global
window.logger = new Logger({
    level: 'DEBUG', // Cambiar a 'INFO' en producción
    component: 'UploadSystem',
    enableConsole: true,
    enableStorage: true
});

// Agregar listener para mostrar logs en tiempo real (opcional)
window.addEventListener('uploadLog', (event) => {
    // Aquí podrías agregar logs a una UI visual si quisieras
});

// Exportar para uso en módulos
window.Logger = Logger;
