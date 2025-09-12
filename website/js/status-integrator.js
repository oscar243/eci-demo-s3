/**
 * Integrador entre UploadHandler y StatusHandler
 * Conecta automáticamente el monitoreo de estado después de subidas exitosas
 */

(function() {
    'use strict';
    
    console.log('[StatusIntegrator] Inicializando integración automática...');
    
    // Función para integrar el StatusHandler con UploadHandler
    function integrateStatusMonitoring() {
        // Verificar que ambas clases estén disponibles
        if (typeof window.UploadHandler === 'undefined') {
            console.warn('[StatusIntegrator] UploadHandler no encontrado, reintentando en 1 segundo...');
            setTimeout(integrateStatusMonitoring, 1000);
            return;
        }
        
        if (typeof window.StatusHandler === 'undefined') {
            console.warn('[StatusIntegrator] StatusHandler no encontrado, reintentando en 1 segundo...');
            setTimeout(integrateStatusMonitoring, 1000);
            return;
        }
        
        console.log('[StatusIntegrator] Ambas clases encontradas, integrando...');
        
        // Obtener o crear instancia de StatusHandler
        if (!window.statusHandler) {
            window.statusHandler = new window.StatusHandler();
        }
        
        // Hook en el método uploadFile del UploadHandler
        const originalUploadFile = window.UploadHandler.prototype.uploadFile;
        
        window.UploadHandler.prototype.uploadFile = async function(file, onProgress) {
            console.log('[StatusIntegrator] Subida iniciada, preparando monitoreo de estado...');
            
            try {
                // Llamar al método original
                const result = await originalUploadFile.call(this, file, onProgress);
                
                // Si la subida fue exitosa, iniciar monitoreo
                if (result && result.success && result.fileKey) {
                    console.log('[StatusIntegrator] Subida exitosa, iniciando monitoreo de estado...');
                    console.log('[StatusIntegrator] FileKey:', result.fileKey);
                    
                    // Pequeño delay para asegurar que el archivo esté procesándose
                    setTimeout(() => {
                        window.statusHandler.startMonitoring(result.fileKey);
                    }, 2000);
                } else {
                    console.warn('[StatusIntegrator] Subida no exitosa o sin fileKey, no se iniciará monitoreo');
                }
                
                return result;
                
            } catch (error) {
                console.error('[StatusIntegrator] Error en subida, no se iniciará monitoreo:', error);
                throw error;
            }
        };
        
        console.log('[StatusIntegrator] ✅ Integración completada exitosamente');
        console.log('[StatusIntegrator] El monitoreo de estado se iniciará automáticamente después de cada subida exitosa');
    }
    
    // Función para mostrar comandos disponibles en consola
    function showConsoleCommands() {
        console.log('');
        console.log('🔧 [StatusIntegrator] ===== COMANDOS DISPONIBLES =====');
        console.log('📊 statusHandler.showDebugInfo()           - Mostrar información de debugging');
        console.log('🔍 statusHandler.getActivePollings()        - Ver polling activos');
        console.log('⏹️ statusHandler.stopAllMonitoring()        - Detener todos los polling');
        console.log('🎯 statusHandler.startMonitoring(fileKey)   - Iniciar monitoreo manual');
        console.log('=============================================');
        console.log('');
    }
    
    // Iniciar integración cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(integrateStatusMonitoring, 500);
            setTimeout(showConsoleCommands, 1000);
        });
    } else {
        setTimeout(integrateStatusMonitoring, 500);
        setTimeout(showConsoleCommands, 1000);
    }
    
})();
