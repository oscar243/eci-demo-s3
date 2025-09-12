/**
 * ProcessingStages - Manejo de las etapas del procesamiento con cronómetro
 */
class ProcessingStages {
    constructor() {
        this.startTime = null;
        this.timerInterval = null;
        this.stages = [
            {
                id: 'upload',
                title: 'Subiendo archivo a S3',
                icon: '⬆️'
            },
            {
                id: 'trigger',
                title: 'Iniciando procesamiento',
                icon: '🚀'
            },
            {
                id: 'transcribing',
                title: 'Transcribiendo audio',
                icon: '🎤'
            },
            {
                id: 'analyzing',
                title: 'Analizando contenido',
                icon: '🤖'
            },
            {
                id: 'completed',
                title: 'Procesamiento completado',
                icon: '✅'
            }
        ];
        
        this.currentStageIndex = -1;
    }

    /**
     * Inicia el procesamiento y muestra las etapas
     */
    startProcessing() {
        this.startTime = Date.now();
        this.currentStageIndex = -1;
        
        // Mostrar la sección de etapas
        const stagesContainer = document.getElementById('processingStages');
        if (stagesContainer) {
            stagesContainer.style.display = 'block';
        }
        
        // Inicializar el cronómetro general
        this.startTimer();
        
        // Crear las etapas en el DOM
        this.renderStages();
        
        // Bloquear botón de upload
        this.lockUploadButton();
        
        console.log('[ProcessingStages] Procesamiento iniciado');
    }

    /**
     * Avanza a la siguiente etapa
     * @param {string} stageId - ID de la etapa (opcional, usa el siguiente si no se especifica)
     */
    nextStage(stageId = null) {
        // Si se especifica un stageId, buscar su índice
        if (stageId) {
            const stageIndex = this.stages.findIndex(stage => stage.id === stageId);
            if (stageIndex !== -1) {
                this.currentStageIndex = stageIndex;
            }
        } else {
            this.currentStageIndex++;
        }
        
        if (this.currentStageIndex >= 0 && this.currentStageIndex < this.stages.length) {
            const stage = this.stages[this.currentStageIndex];
            
            this.updateStageDisplay(stage.id, 'active');
            console.log(`[ProcessingStages] Etapa activa: ${stage.title}`);
        }
    }

    /**
     * Marca una etapa como completada
     * @param {string} stageId - ID de la etapa (opcional, usa la actual si no se especifica)
     */
    completeStage(stageId = null) {
        const targetStageId = stageId || (this.currentStageIndex >= 0 ? this.stages[this.currentStageIndex].id : null);
        
        if (targetStageId) {
            this.updateStageDisplay(targetStageId, 'completed');
            console.log(`[ProcessingStages] Etapa completada: ${targetStageId}`);
        }
    }

    /**
     * Marca una etapa como error
     * @param {string} stageId - ID de la etapa
     * @param {string} errorMessage - Mensaje de error (opcional)
     */
    errorStage(stageId = null, errorMessage = null) {
        const targetStageId = stageId || (this.currentStageIndex >= 0 ? this.stages[this.currentStageIndex].id : null);
        
        if (targetStageId) {
            this.updateStageDisplay(targetStageId, 'error');
            console.log(`[ProcessingStages] Error en etapa: ${targetStageId}`);
        }
    }

    /**
     * Finaliza el procesamiento
     * @param {boolean} success - Si el procesamiento fue exitoso
     */
    finishProcessing(success = true) {
        if (success) {
            // Marcar todas las etapas como completadas
            this.stages.forEach(stage => {
                this.updateStageDisplay(stage.id, 'completed');
            });
        }
        
        // Detener cronómetro
        this.stopTimer();
        
        // Desbloquear botón después de un tiempo
        setTimeout(() => {
            this.unlockUploadButton();
        }, 3000);
        
        console.log(`[ProcessingStages] Procesamiento ${success ? 'completado' : 'fallido'}`);
    }

    /**
     * Renderiza las etapas en el DOM
     */
    renderStages() {
        const stagesList = document.getElementById('stagesList');
        if (!stagesList) return;
        
        stagesList.innerHTML = '';
        
        this.stages.forEach((stage, index) => {
            const stageElement = document.createElement('div');
            stageElement.className = 'stage-item pending';
            stageElement.setAttribute('data-stage-id', stage.id);
            
            stageElement.innerHTML = `
                <div class="stage-icon">${stage.icon}</div>
                <div class="stage-content">
                    <div class="stage-title">${stage.title}</div>
                </div>
            `;
            
            stagesList.appendChild(stageElement);
        });
    }

    /**
     * Actualiza el display de una etapa específica
     * @param {string} stageId - ID de la etapa
     * @param {string} status - Estado: 'pending', 'active', 'completed', 'error'
     */
    updateStageDisplay(stageId, status) {
        const stageElement = document.querySelector(`[data-stage-id="${stageId}"]`);
        if (!stageElement) return;
        
        // Actualizar clases
        stageElement.className = `stage-item ${status}`;
    }

    /**
     * Inicia el cronómetro general
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        this.updateTimer(); // Actualizar inmediatamente
    }

    /**
     * Detiene el cronómetro general
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Actualiza el cronómetro general
     */
    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const timerElement = document.getElementById('processingTimer');
        
        if (timerElement) {
            timerElement.textContent = this.formatTime(elapsed);
        }
    }

    /**
     * Formatea tiempo en milisegundos a MM:SS
     * @param {number} ms - Milisegundos
     * @returns {string} Tiempo formateado
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Bloquea el botón de upload
     */
    lockUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const uploadArea = document.getElementById('uploadArea');
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Procesando...';
            uploadBtn.classList.add('processing');
        }
        
        if (selectFileBtn) {
            selectFileBtn.disabled = true;
        }
        
        if (uploadArea) {
            uploadArea.style.pointerEvents = 'none';
            uploadArea.style.opacity = '0.7';
        }
    }

    /**
     * Desbloquea el botón de upload
     */
    unlockUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const uploadArea = document.getElementById('uploadArea');
        
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir Otro Archivo';
            uploadBtn.classList.remove('processing');
        }
        
        if (selectFileBtn) {
            selectFileBtn.disabled = false;
        }
        
        if (uploadArea) {
            uploadArea.style.pointerEvents = 'auto';
            uploadArea.style.opacity = '1';
        }
    }

    /**
     * Oculta las etapas de procesamiento
     */
    hideStages() {
        const stagesContainer = document.getElementById('processingStages');
        if (stagesContainer) {
            stagesContainer.style.display = 'none';
        }
        
        this.stopTimer();
        this.startTime = null;
        this.currentStageIndex = -1;
    }

    /**
     * Resetea el estado para un nuevo procesamiento
     */
    reset() {
        this.hideStages();
        this.unlockUploadButton();
        
        // Restaurar estructura original
        this.stages = [
            {
                id: 'upload',
                title: 'Subiendo archivo a S3',
                icon: '⬆️'
            },
            {
                id: 'trigger',
                title: 'Iniciando procesamiento',
                icon: '🚀'
            },
            {
                id: 'transcribing',
                title: 'Transcribiendo audio',
                icon: '🎤'
            },
            {
                id: 'analyzing',
                title: 'Analizando contenido',
                icon: '🤖'
            },
            {
                id: 'completed',
                title: 'Procesamiento completado',
                icon: '✅'
            }
        ];
    }
}

// Crear instancia global
window.processingStages = new ProcessingStages();
