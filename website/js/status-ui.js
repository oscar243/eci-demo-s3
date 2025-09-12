/**
 * StatusUI - Manejo de la interfaz de usuario para mostrar resultados del procesamiento
 * Adaptado para trabajar con la nueva estructura de respuesta de la API
 */
class StatusUI {
    constructor() {
        this.currentTranscriptionData = null;
        this.currentAnalysisData = null;
        this.currentFullResult = null;
        
        // Inicializar manejadores de descarga
        this.initializeDownloadButtons();
    }

    /**
     * Muestra los resultados finales del procesamiento
     * @param {Object} result - Resultado completo del procesamiento
     */
    showFinalResults(result) {
        console.log('[StatusUI] Mostrando resultados finales:', result);
        
        // Guardar resultado completo para descarga
        this.currentFullResult = result;
        
        // Mostrar transcripción
        this.showTranscription(result);
        
        // Mostrar análisis
        this.showAnalysis(result);
        
        // Scroll suave hacia resultados
        this.scrollToResults();
    }

    /**
     * Muestra la transcripción en la columna derecha
     * @param {Object} result - Resultado del procesamiento
     */
    showTranscription(result) {
        const transcriptionContent = document.getElementById('transcriptionContent');
        
        if (!transcriptionContent) {
            console.error('[StatusUI] Sección de transcripción no encontrada');
            return;
        }
        
        let html = '';
        let transcriptionData = null;
        
        // Extraer datos de transcripción de la nueva estructura
        if (result.transcripcion) {
            transcriptionData = result.transcripcion;
            this.currentTranscriptionData = transcriptionData;
            
            // Mostrar botón de descarga
            this.showDownloadButton('downloadTxtBtn');
            
            // Información básica del archivo y procesamiento
            html += this.buildTranscriptionInfo(result);
            
            // Mostrar transcripción por utterances (speakers)
            if (transcriptionData.utterances && transcriptionData.utterances.length > 0) {
                html += this.buildUtterancesSection(transcriptionData.utterances);
            } 
            // Fallback: mostrar texto completo si no hay utterances
            else if (transcriptionData.text) {
                html += this.buildFullTextSection(transcriptionData.text);
            }
            // Mostrar texto de la data de AssemblyAI si está disponible
            else if (transcriptionData.data && transcriptionData.data.text) {
                html += this.buildFullTextSection(transcriptionData.data.text);
            } else {
                html += '<p class="placeholder-text">No se encontró texto transcrito.</p>';
            }
        } else {
            this.currentTranscriptionData = null;
            this.hideDownloadButton('downloadTxtBtn');
            html = this.buildPlaceholderTranscription();
        }
        
        transcriptionContent.innerHTML = html;
    }

    /**
     * Construye la sección de información de la transcripción
     * @param {Object} result - Resultado completo
     * @returns {string} HTML para la información
     */
    buildTranscriptionInfo(result) {
        const transcription = result.transcripcion;
        const metadata = result.metadata || {};
        
        let html = '<div class="transcription-info">';
        
        // Información del archivo
        if (metadata.file_original) {
            const fileName = metadata.file_original.split('/').pop();
            html += `<p><strong>Archivo:</strong> ${fileName}</p>`;
        }
        
        // Duración del audio
        const duration = transcription.audio_duration || 
                        (transcription.data && transcription.data.audio_duration) || 0;
        html += `<p><strong>Duración:</strong> ${this.formatDuration(duration)}</p>`;
        
        // Idioma detectado
        const languageCode = (transcription.data && transcription.data.language_code) || 'es';
        html += `<p><strong>Idioma:</strong> ${this.formatLanguage(languageCode)}</p>`;
        
        // Tiempo de procesamiento
        if (metadata.tiempo_procesamiento_segundos) {
            html += `<p><strong>Tiempo de procesamiento:</strong> ${metadata.tiempo_procesamiento_segundos}s</p>`;
        }
        
        // Confianza promedio si está disponible
        if (transcription.data && transcription.data.confidence) {
            const confidence = Math.round(transcription.data.confidence * 100);
            html += `<p><strong>Confianza:</strong> ${confidence}%</p>`;
        }
        
        html += '</div><hr style="margin: 1rem 0; border: 1px solid var(--gray-300);">';
        
        return html;
    }

    /**
     * Construye la sección de utterances (conversación por speakers)
     * @param {Array} utterances - Array de utterances
     * @returns {string} HTML para los utterances
     */
    buildUtterancesSection(utterances) {
        let html = '<div class="transcription-text">';
        html += '<h4 style="margin-bottom: 1rem; color: var(--primary-color);">Conversación por Participantes</h4>';
        
        utterances.forEach((utterance, index) => {
            const speaker = this.formatSpeakerName(utterance.speaker, index);
            const text = utterance.text || '';
            const timeInfo = this.formatTimeInfo(utterance.start, utterance.end);
            
            html += `<div class="utterance-block">`;
            html += `<div class="speaker-header">`;
            html += `<span class="speaker-label">${speaker}</span>`;
            if (timeInfo) {
                html += `<span class="time-info">${timeInfo}</span>`;
            }
            html += `</div>`;
            html += `<div class="speaker-text">${text}</div>`;
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Construye la sección de texto completo
     * @param {string} text - Texto completo
     * @returns {string} HTML para el texto
     */
    buildFullTextSection(text) {
        return `
            <div class="transcription-text">
                <h4 style="margin-bottom: 1rem; color: var(--primary-color);">Transcripción Completa</h4>
                <div class="full-text">${text}</div>
            </div>
        `;
    }

    /**
     * Muestra el análisis en la columna derecha
     * @param {Object} result - Resultado del procesamiento
     */
    showAnalysis(result) {
        const evaluationContent = document.getElementById('evaluationContent');
        
        if (!evaluationContent) {
            console.error('[StatusUI] Sección de análisis no encontrada');
            return;
        }
        
        let html = '';
        
        if (result.analisis) {
            this.currentAnalysisData = result.analisis;
            this.showDownloadButton('downloadJsonBtn');
            
            html += this.buildAnalysisSection(result.analisis);
        } else {
            this.currentAnalysisData = null;
            this.hideDownloadButton('downloadJsonBtn');
            html = this.buildPlaceholderAnalysis();
        }
        
        evaluationContent.innerHTML = html;
    }

    /**
     * Construye la sección de análisis
     * @param {Object} analysis - Datos del análisis
     * @returns {string} HTML para el análisis
     */
    buildAnalysisSection(analysis) {
        let html = '<div class="analysis-content">';
        
        // Resumen
        if (analysis.resumen) {
            html += `
                <div class="analysis-section">
                    <h4>Resumen</h4>
                    <p class="analysis-text">${analysis.resumen}</p>
                </div>
            `;
        }
        
        // Puntos destacados
        if (analysis.puntos_destacados && analysis.puntos_destacados.length > 0) {
            html += `
                <div class="analysis-section">
                    <h4>Puntos Destacados</h4>
                    <ul class="highlights-list">
            `;
            analysis.puntos_destacados.forEach(punto => {
                html += `<li>${punto}</li>`;
            });
            html += `</ul></div>`;
        }
        
        // Temas principales
        if (analysis.temas_principales && analysis.temas_principales.length > 0) {
            html += `
                <div class="analysis-section">
                    <h4>Temas Principales</h4>
                    <div class="topics-list">
            `;
            analysis.temas_principales.forEach(tema => {
                html += `<span class="topic-tag">${tema}</span>`;
            });
            html += `</div></div>`;
        }
        
        // Información adicional
        html += '<div class="analysis-section">';
        html += '<h4>Información Adicional</h4>';
        html += '<div class="analysis-meta">';
        
        if (analysis.duracion_estimada) {
            html += `<p><strong>Duración estimada:</strong> ${analysis.duracion_estimada}</p>`;
        }
        
        if (analysis.tono_general) {
            html += `<p><strong>Tono general:</strong> ${analysis.tono_general}</p>`;
        }
        
        if (analysis.modelo_usado) {
            html += `<p><strong>Modelo usado:</strong> ${analysis.modelo_usado}</p>`;
        }
        
        if (analysis.tokens_utilizados) {
            html += `<p><strong>Tokens utilizados:</strong> ${analysis.tokens_utilizados}</p>`;
        }
        
        html += '</div></div>';
        
        // Datos técnicos en formato JSON colapsable
        html += `
            <div class="analysis-section">
                <details class="json-details">
                    <summary>Ver datos técnicos completos (JSON)</summary>
                    <pre class="json-content">${JSON.stringify(analysis, null, 2)}</pre>
                </details>
            </div>
        `;
        
        html += '</div>';
        return html;
    }

    /**
     * Limpia los resultados y restaura placeholders
     */
    clearResults() {
        // Limpiar datos
        this.currentTranscriptionData = null;
        this.currentAnalysisData = null;
        this.currentFullResult = null;
        
        // Ocultar botones de descarga
        this.hideDownloadButton('downloadTxtBtn');
        this.hideDownloadButton('downloadJsonBtn');
        
        // Restaurar placeholders
        const transcriptionContent = document.getElementById('transcriptionContent');
        const evaluationContent = document.getElementById('evaluationContent');
        
        if (transcriptionContent) {
            transcriptionContent.innerHTML = this.buildPlaceholderTranscription();
        }
        
        if (evaluationContent) {
            evaluationContent.innerHTML = this.buildPlaceholderAnalysis();
        }
    }

    /**
     * Construye el placeholder para transcripción
     * @returns {string} HTML del placeholder
     */
    buildPlaceholderTranscription() {
        return `
            <div class="placeholder-container">
                <div class="placeholder-icon">🎤</div>
                <p class="placeholder-text">La transcripción con etiquetas de hablante aparecerá aquí una vez procesado el audio</p>
                <div class="placeholder-features">
                    <span class="feature-item">Identificación de speakers</span>
                    <span class="feature-item">Timestamps</span>
                    <span class="feature-item">Texto estructurado</span>
                </div>
            </div>
        `;
    }

    /**
     * Construye el placeholder para análisis
     * @returns {string} HTML del placeholder
     */
    buildPlaceholderAnalysis() {
        return `
            <div class="placeholder-container">
                <div class="placeholder-icon">📊</div>
                <p class="placeholder-text">El análisis detallado aparecerá aquí una vez procesado el audio</p>
                <div class="placeholder-features">
                    <span class="feature-item">Resumen breve</span>
                    <span class="feature-item">Puntos destacados</span>
                    <span class="feature-item">Temas principales</span>
                    <span class="feature-item">Análisis de tono</span>
                </div>
            </div>
        `;
    }

    // Funciones utilitarias

    /**
     * Formatea la duración en segundos a un formato legible
     * @param {number} duration - Duración en segundos
     * @returns {string} Duración formateada
     */
    formatDuration(duration) {
        if (!duration) return '0s';
        
        if (duration < 60) {
            return `${duration}s`;
        }
        
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}m ${seconds}s`;
    }

    /**
     * Formatea el código de idioma
     * @param {string} languageCode - Código de idioma
     * @returns {string} Idioma formateado
     */
    formatLanguage(languageCode) {
        const languages = {
            'es': 'Español',
            'en': 'Inglés',
            'fr': 'Francés',
            'pt': 'Portugués'
        };
        return languages[languageCode] || languageCode.toUpperCase();
    }

    /**
     * Formatea el nombre del speaker
     * @param {string} speaker - ID del speaker
     * @param {number} index - Índice del utterance
     * @returns {string} Nombre formateado del speaker
     */
    formatSpeakerName(speaker, index) {
        if (!speaker) return `Participante ${index + 1}`;
        
        // Convertir A, B, C a nombres más amigables
        const speakerNames = {
            'A': 'Participante A',
            'B': 'Participante B',
            'C': 'Participante C',
            'D': 'Participante D'
        };
        
        return speakerNames[speaker] || speaker;
    }

    /**
     * Formatea información de tiempo
     * @param {number} start - Tiempo de inicio en ms
     * @param {number} end - Tiempo de fin en ms
     * @returns {string} Información de tiempo formateada
     */
    formatTimeInfo(start, end) {
        if (!start && !end) return '';
        
        const formatTime = (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };
        
        if (start && end) {
            return `${formatTime(start)} - ${formatTime(end)}`;
        }
        return start ? formatTime(start) : '';
    }

    /**
     * Scroll suave hacia los resultados
     */
    scrollToResults() {
        const rightColumn = document.querySelector('.right-column');
        if (rightColumn) {
            rightColumn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Funciones de descarga

    /**
     * Inicializa los manejadores de botones de descarga
     */
    initializeDownloadButtons() {
        const downloadTxtBtn = document.getElementById('downloadTxtBtn');
        const downloadJsonBtn = document.getElementById('downloadJsonBtn');
        
        if (downloadTxtBtn) {
            downloadTxtBtn.addEventListener('click', () => this.downloadTranscription());
        }
        
        if (downloadJsonBtn) {
            downloadJsonBtn.addEventListener('click', () => this.downloadAnalysis());
        }
    }

    /**
     * Muestra un botón de descarga
     * @param {string} buttonId - ID del botón
     */
    showDownloadButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'flex';
        }
    }

    /**
     * Oculta un botón de descarga
     * @param {string} buttonId - ID del botón
     */
    hideDownloadButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'none';
        }
    }

    /**
     * Descarga el archivo de transcripción
     */
    downloadTranscription() {
        if (!this.currentTranscriptionData) {
            console.error('[StatusUI] No hay datos de transcripción para descargar');
            return;
        }
        
        let content = '';
        const transcription = this.currentTranscriptionData;
        
        // Encabezado
        content += `TRANSCRIPCIÓN DE AUDIO\n`;
        content += `Fecha: ${new Date().toLocaleString('es-ES')}\n`;
        content += `Duración: ${this.formatDuration(transcription.audio_duration || 0)}\n`;
        
        if (transcription.data && transcription.data.language_code) {
            content += `Idioma: ${this.formatLanguage(transcription.data.language_code)}\n`;
        }
        
        content += `\n${'='.repeat(50)}\n\n`;
        
        // Contenido de la transcripción
        if (transcription.utterances && transcription.utterances.length > 0) {
            // Transcripción por utterances
            transcription.utterances.forEach((utterance, index) => {
                const speaker = this.formatSpeakerName(utterance.speaker, index);
                const text = utterance.text || '';
                const timeInfo = this.formatTimeInfo(utterance.start, utterance.end);
                
                content += `${speaker}`;
                if (timeInfo) {
                    content += ` (${timeInfo})`;
                }
                content += `:\n${text}\n\n`;
            });
        } else if (transcription.text) {
            // Texto completo
            content += transcription.text;
        } else if (transcription.data && transcription.data.text) {
            // Texto de AssemblyAI
            content += transcription.data.text;
        }
        
        this.downloadFile(content, 'text/plain', 'transcripcion', 'txt');
    }

    /**
     * Descarga el archivo de análisis
     */
    downloadAnalysis() {
        if (!this.currentFullResult) {
            console.error('[StatusUI] No hay datos de análisis para descargar');
            return;
        }
        
        const content = JSON.stringify(this.currentFullResult, null, 2);
        this.downloadFile(content, 'application/json', 'analisis_completo', 'json');
    }

    /**
     * Función utilitaria para descargar archivos
     * @param {string} content - Contenido del archivo
     * @param {string} mimeType - Tipo MIME
     * @param {string} baseName - Nombre base del archivo
     * @param {string} extension - Extensión del archivo
     */
    downloadFile(content, mimeType, baseName, extension) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`[StatusUI] Archivo ${extension.toUpperCase()} descargado`);
    }
}

// Crear instancia global
window.statusUI = new StatusUI();
