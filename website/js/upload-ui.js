/**
 * Interfaz de usuario para subida de archivos
 * Maneja la valid                    <div class="file-card-header">
                        <div class="file-info-text">, UI y experiencia del usuario
 */

class UploadUI {
    constructor() {
        console.log('[UploadUI] Construyendo instancia de UploadUI...');
        this.uploadHandler = new UploadHandler();
        this.currentUpload = null;
        console.log('[UploadUI] UploadHandler creado, iniciando interfaz...');
        this.init();
        console.log('[UploadUI] UploadUI completamente inicializado');
    }

    /**
     * Inicializa la interfaz de usuario
     */
    init() {
        console.log('[UploadUI] Inicializando interfaz de usuario...');
        this.setupExistingInterface();
        this.bindEvents();
        console.log('[UploadUI] Interfaz inicializada correctamente');
    }

    /**
     * Configura la interfaz existente en lugar de crear una nueva
     */
    setupExistingInterface() {
        console.log('[UploadUI] Configurando interfaz existente...');
        
        // Verificar que existen los elementos necesarios
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('audioFile');
        const uploadBtn = document.getElementById('uploadBtn');
        
        if (!uploadArea || !fileInput || !uploadBtn) {
            console.error('[UploadUI] Elementos HTML requeridos no encontrados, creando interfaz nueva');
            this.createUploadInterface();
            return;
        }

        console.log('[UploadUI] Elementos HTML existentes encontrados, integrando funcionalidad');
        
        // Agregar elementos necesarios que no existen
        this.addMissingElements();
        this.addStyles();
    }

    /**
     * Agrega elementos necesarios que no existen en el HTML actual
     */
    addMissingElements() {
        console.log('[UploadUI] Agregando elementos faltantes...');
        
        const uploadSection = document.querySelector('.upload-section');
        if (!uploadSection) {
            console.error('[UploadUI] No se encontró .upload-section');
            return;
        }

        // Agregar contenedor de información de archivo si no existe
        if (!document.getElementById('fileInfo')) {
            const fileInfo = document.createElement('div');
            fileInfo.id = 'fileInfo';
            fileInfo.className = 'file-card';
            fileInfo.style.display = 'none';
            fileInfo.innerHTML = `
                <div class="file-card-content">
                    <div class="file-card-header">
                        <div class="file-icon-container">
                            <div class="file-icon">�</div>
                        </div>
                        <div class="file-info-text">
                            <h4 class="file-name"></h4>
                            <p class="file-meta">
                                <span class="file-size"></span>
                                <span class="file-type"></span>
                            </p>
                        </div>
                    </div>
                    <div class="file-card-actions">
                        <button class="remove-file-btn" id="removeFile" title="Quitar archivo">
                            <span>×</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar estilos CSS inline para la tarjeta
            this.addFileCardStyles();
            
            // Insertar después del uploadArea
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea && uploadArea.parentNode) {
                uploadArea.parentNode.insertBefore(fileInfo, uploadArea.nextSibling);
            }
        }

        // Agregar barra de progreso mejorada si no existe
        if (!document.getElementById('uploadProgress')) {
            const uploadProgress = document.createElement('div');
            uploadProgress.id = 'uploadProgress';
            uploadProgress.className = 'upload-progress-container';
            uploadProgress.style.display = 'none';
            uploadProgress.innerHTML = `
                <div class="upload-progress-card">
                    <div class="upload-header">
                        <div class="upload-icon">
                            <div class="upload-spinner"></div>
                        </div>
                        <div class="upload-info">
                            <h4 class="upload-title">Subiendo archivo...</h4>
                            <p class="upload-filename"></p>
                        </div>
                    </div>
                    <div class="progress-section">
                        <div class="progress-bar-container">
                            <div class="progress-bar-track">
                                <div class="progress-bar-fill" id="progressFill"></div>
                            </div>
                            <div class="progress-percentage" id="progressPercent">0%</div>
                        </div>
                        <div class="progress-details">
                            <span class="progress-status" id="progressStatus">Preparando...</span>
                            <span class="progress-speed" id="progressSpeed"></span>
                        </div>
                    </div>
                    <div class="upload-actions">
                        <button class="cancel-upload-btn" id="cancelUpload">
                            <span>Cancelar</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Insertar antes del botón de upload
            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn && uploadBtn.parentNode) {
                uploadBtn.parentNode.insertBefore(uploadProgress, uploadBtn);
            }
        }

        // Agregar contenedor de resultado si no existe
        if (!document.getElementById('uploadResult')) {
            const uploadResult = document.createElement('div');
            uploadResult.id = 'uploadResult';
            uploadResult.className = 'upload-result';
            uploadResult.style.display = 'none';
            uploadResult.innerHTML = `
                <div class="result-icon"></div>
                <div class="result-message"></div>
                <button class="upload-another" id="uploadAnother">Subir otro archivo</button>
            `;
            
            // Insertar al final de la sección de upload
            uploadSection.appendChild(uploadResult);
        }

        console.log('[UploadUI] Elementos faltantes agregados');
    }

    /**
     * Crea la interfaz de subida de archivos (solo usado como fallback)
     */
    createUploadInterface() {
        console.log('[UploadUI] Creando interfaz nueva como fallback...');
        const container = document.createElement('div');
        container.className = 'upload-container';
        container.innerHTML = `
            <div class="upload-section">
                <h2>Subir Archivo de Audio</h2>
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">�</div>
                    <p>Arrastra tu archivo de audio aquí o <span class="upload-link">haz clic para seleccionar</span></p>
                    <input type="file" id="fileInput" accept="audio/*" style="display: none;">
                    <div class="file-requirements">
                        <small>
                            • Formatos permitidos: MP3, WAV, MP4, AAC, OGG, FLAC<br>
                            • Tamaño máximo: 20MB<br>
                            • Solo caracteres alfanuméricos, espacios, puntos, guiones y paréntesis en el nombre
                        </small>
                    </div>
                </div>
                
                <div id="fileInfo" class="file-info" style="display: none;">
                    <div class="file-details">
                        <div class="file-icon">🎙️</div>
                        <div class="file-text">
                            <div class="file-name"></div>
                            <div class="file-size"></div>
                        </div>
                        <button class="remove-file" id="removeFile">✕</button>
                    </div>
                </div>

                <div id="uploadProgress" class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="progressPercent">0%</span>
                        <span id="progressStatus">Preparando...</span>
                    </div>
                    <button class="cancel-upload" id="cancelUpload">Cancelar</button>
                </div>

                <div id="uploadResult" class="upload-result" style="display: none;">
                    <div class="result-icon"></div>
                    <div class="result-message"></div>
                    <button class="upload-another" id="uploadAnother">Subir otro archivo</button>
                </div>

                <button id="uploadBtn" class="upload-btn" disabled>Subir Archivo</button>
            </div>
        `;

        // Solo crear si no existe estructura en la página
        let targetContainer = document.getElementById('upload-container');
        if (!targetContainer) {
            targetContainer = document.createElement('div');
            targetContainer.id = 'upload-container';
            document.body.appendChild(targetContainer);
        }
        
        targetContainer.innerHTML = '';
        targetContainer.appendChild(container);

        this.addStyles();
    }

    /**
     * Agrega estilos CSS para la interfaz
     */
    addStyles() {
        // Los estilos están definidos en main.css
        // Esta función se mantiene por compatibilidad pero no hace nada
        return;
    }

    /**
     * Agrega estilos CSS para la tarjeta de archivo
     */
    addFileCardStyles() {
        // Verificar si ya existen los estilos
        if (document.getElementById('fileCardStyles')) return;

        const style = document.createElement('style');
        style.id = 'fileCardStyles';
        style.textContent = `
            .file-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
                animation: slideInUp 0.4s ease-out;
            }

            .file-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                border-color: #3b82f6;
            }

            .file-card-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 15px;
            }

            .file-card-header {
                display: flex;
                align-items: center;
                flex: 1;
                gap: 15px;
            }

            .file-info-text {
                flex: 1;
            }

            .file-name {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 4px 0;
                word-break: break-word;
                line-height: 1.4;
            }

            .file-meta {
                margin: 0;
                color: #64748b;
                font-size: 14px;
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .file-size {
                font-weight: 500;
            }

            .file-type {
                background: #e0f2fe;
                color: #0369a1;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }

            .file-card-actions {
                display: flex;
                align-items: center;
            }

            .remove-file-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: #fee2e2;
                color: #dc2626;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.2s ease;
            }

            .remove-file-btn:hover {
                background: #fecaca;
                transform: scale(1.1);
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Estilos para el progreso de subida */
            .upload-progress-container {
                margin: 20px 0;
                animation: slideInUp 0.4s ease-out;
            }

            .upload-progress-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                position: relative;
                overflow: hidden;
            }

            .upload-progress-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6);
                background-size: 200% 100%;
                animation: progressShimmer 2s infinite;
            }

            .upload-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 20px;
            }

            .upload-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .upload-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .upload-info {
                flex: 1;
            }

            .upload-title {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
            }

            .upload-filename {
                margin: 0;
                font-size: 14px;
                color: #64748b;
                word-break: break-word;
            }

            .progress-section {
                margin-bottom: 20px;
            }

            .progress-bar-container {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            }

            .progress-bar-track {
                flex: 1;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #22c55e, #16a34a);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .progress-bar-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: progressGlow 1.5s infinite;
            }

            .progress-percentage {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                min-width: 40px;
                text-align: right;
            }

            .progress-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .progress-status {
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
            }

            .progress-speed {
                font-size: 12px;
                color: #94a3b8;
            }

            .upload-actions {
                display: flex;
                justify-content: flex-end;
            }

            .cancel-upload-btn {
                padding: 8px 16px;
                border: 2px solid #e2e8f0;
                background: white;
                color: #64748b;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .cancel-upload-btn:hover {
                border-color: #f87171;
                color: #dc2626;
                background: #fef2f2;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes progressShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            @keyframes progressGlow {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Agrega estilos CSS para el mensaje de éxito mejorado
     */
    addSuccessStyles() {
        // Verificar si ya existen los estilos
        if (document.getElementById('successStyles')) return;

        const style = document.createElement('style');
        style.id = 'successStyles';
        style.textContent = `
            .upload-result.success {
                background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                border: 2px solid #bbf7d0;
                border-radius: 20px;
                padding: 32px;
                margin: 24px 0;
                box-shadow: 0 10px 40px rgba(34, 197, 94, 0.15);
                text-align: center;
                position: relative;
                overflow: hidden;
                animation: successPulse 0.6s ease-out;
            }

            .upload-result.success::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #22c55e, #16a34a, #22c55e);
                background-size: 200% 100%;
                animation: successShimmer 3s infinite;
            }

            .success-icon-container {
                margin-bottom: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .success-checkmark {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 50%;
                width: 64px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
                animation: checkmarkBounce 0.8s ease-out 0.2s both;
                transform: scale(0);
            }

            .success-checkmark svg {
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
            }

            .success-content {
                animation: contentSlideUp 0.6s ease-out 0.4s both;
                opacity: 0;
                transform: translateY(20px);
            }

            .success-title {
                font-size: 24px;
                font-weight: 700;
                color: #166534;
                margin: 0 0 8px 0;
                text-shadow: 0 1px 2px rgba(22, 101, 52, 0.1);
            }

            .success-description {
                font-size: 16px;
                color: #15803d;
                margin: 0 0 24px 0;
                font-weight: 500;
                opacity: 0.9;
            }

            .success-details {
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid #d1fae5;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                backdrop-filter: blur(5px);
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid rgba(209, 250, 229, 0.5);
            }

            .detail-item:last-child {
                border-bottom: none;
            }

            .detail-label {
                font-weight: 600;
                color: #166534;
                font-size: 14px;
            }

            .detail-value {
                color: #15803d;
                font-weight: 500;
                font-size: 14px;
                text-align: right;
                word-break: break-word;
                max-width: 60%;
            }

            .upload-another {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
                position: relative;
                overflow: hidden;
            }

            .upload-another::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: left 0.5s ease;
            }

            .upload-another:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(34, 197, 94, 0.4);
            }

            .upload-another:hover::before {
                left: 100%;
            }

            .upload-another:active {
                transform: translateY(0);
                box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
            }

            @keyframes successPulse {
                0% {
                    transform: scale(0.95);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.02);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes checkmarkBounce {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes contentSlideUp {
                0% {
                    opacity: 0;
                    transform: translateY(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes successShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            @media (max-width: 768px) {
                .upload-result.success {
                    padding: 24px 20px;
                    margin: 16px 0;
                }

                .success-title {
                    font-size: 20px;
                }

                .success-description {
                    font-size: 14px;
                }

                .detail-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }

                .detail-value {
                    text-align: left;
                    max-width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Vincula eventos de la interfaz
     */
    bindEvents() {
        console.log('[UploadUI] Vinculando eventos de la interfaz...');
        
        // Usar elementos existentes o los nuevos creados
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('audioFile') || document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const removeFile = document.getElementById('removeFile');
        const cancelUpload = document.getElementById('cancelUpload');
        const uploadAnother = document.getElementById('uploadAnother');

        console.log('[UploadUI] Elementos encontrados:', {
            uploadArea: !!uploadArea,
            fileInput: !!fileInput,
            uploadBtn: !!uploadBtn,
            selectFileBtn: !!selectFileBtn,
            removeFile: !!removeFile,
            cancelUpload: !!cancelUpload,
            uploadAnother: !!uploadAnother
        });

        // Eventos de drag & drop en el área de upload
        if (uploadArea) {
            console.log('[UploadUI] Configurando eventos drag & drop...');
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            uploadArea.addEventListener('click', () => {
                console.log('[UploadUI] Click en área de subida, abriendo selector...');
                if (fileInput) fileInput.click();
            });
        }

        // Evento del botón "Seleccionar Archivo"
        if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => {
                console.log('[UploadUI] Click en botón seleccionar, abriendo selector...');
                fileInput.click();
            });
        }

        // Eventos de archivo
        if (fileInput) {
            console.log('[UploadUI] Configurando evento de selección de archivo...');
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
        
        // Otros eventos
        if (removeFile) {
            removeFile.addEventListener('click', this.removeSelectedFile.bind(this));
        }
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.startUpload.bind(this));
        }
        if (cancelUpload) {
            cancelUpload.addEventListener('click', this.cancelUpload.bind(this));
        }
        if (uploadAnother) {
            uploadAnother.addEventListener('click', this.resetUpload.bind(this));
        }

        console.log('[UploadUI] Todos los eventos vinculados correctamente');
    }

    /**
     * Maneja evento de arrastrar sobre el área
     */
    handleDragOver(e) {
        e.preventDefault();
        console.log('[UploadUI] Drag over event');
        e.currentTarget.classList.add('dragover');
    }

    /**
     * Maneja evento de salir del área de arrastre
     */
    handleDragLeave(e) {
        e.preventDefault();
        console.log('[UploadUI] Drag leave event');
        e.currentTarget.classList.remove('dragover');
    }

    /**
     * Maneja evento de soltar archivo
     */
    handleDrop(e) {
        e.preventDefault();
        console.log('[UploadUI] Drop event');
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        console.log('[UploadUI] Archivos arrastrados:', files.length);
        
        if (files.length > 0) {
            console.log('[UploadUI] Primer archivo:', {
                name: files[0].name,
                size: files[0].size,
                type: files[0].type
            });
            this.selectFile(files[0]);
        } else {
            console.warn('[UploadUI] No se detectaron archivos en el drop');
        }
    }

    /**
     * Maneja selección de archivo desde input
     */
    handleFileSelect(e) {
        console.log('[UploadUI] File input change event');
        const files = e.target.files;
        console.log('[UploadUI] Archivos seleccionados:', files.length);
        
        if (files.length > 0) {
            console.log('[UploadUI] Primer archivo seleccionado:', {
                name: files[0].name,
                size: files[0].size,
                type: files[0].type
            });
            this.selectFile(files[0]);
        } else {
            console.warn('[UploadUI] No se detectaron archivos en la selección');
        }
    }

    /**
     * Selecciona y valida archivo
     */
    selectFile(file) {
        console.log('[UploadUI] Usuario seleccionó archivo:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });

        this.hideError();
        
        // Resetear etapas de procesamiento previo
        if (window.processingStages) {
            window.processingStages.reset();
        }
        
        console.log('[UploadUI] Validando archivo seleccionado...');
        const validation = this.uploadHandler.validateFile(file);
        if (!validation.valid) {
            console.error('[UploadUI] Validación falló:', validation.error);
            this.showError(validation.error);
            return;
        }

        console.log('[UploadUI] Archivo válido, mostrando información');
        this.selectedFile = file;
        this.showFileInfo(file);
        
        // Habilitar botón y cambiar texto a "Subir Archivo"
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir Archivo';
            uploadBtn.onclick = () => this.startUpload();
        }
        
        console.log('[UploadUI] Botón de subida habilitado');
    }

    /**
     * Muestra información del archivo seleccionado
     */
    showFileInfo(file) {
        console.log('[UploadUI] Mostrando información del archivo:', file.name);
        
        // Intentar usar el elemento de tarjeta primero
        let fileInfo = document.getElementById('fileInfo');
        
        if (fileInfo) {
            // Usar la nueva estructura de tarjeta
            const fileName = fileInfo.querySelector('.file-name');
            const fileSize = fileInfo.querySelector('.file-size');
            const fileType = fileInfo.querySelector('.file-type');

            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = this.uploadHandler.formatFileSize(file.size);
            if (fileType) {
                // Extraer extensión del archivo
                const extension = file.name.split('.').pop().toUpperCase();
                fileType.textContent = extension;
            }

            // Mostrar la tarjeta con animación
            fileInfo.style.display = 'block';
            
            // Pequeño delay para asegurar que la animación se ejecute
            setTimeout(() => {
                fileInfo.classList.add('show');
            }, 10);
            
        } else {
            // Fallback: usar el placeholder existente del HTML original
            const placeholder = document.getElementById('fileStatusPlaceholder');
            if (placeholder) {
                const existingFileName = placeholder.querySelector('.file-name');
                const existingFileMeta = placeholder.querySelector('.file-meta');
                
                if (existingFileName) existingFileName.textContent = file.name;
                if (existingFileMeta) {
                    existingFileMeta.textContent = `${this.uploadHandler.formatFileSize(file.size)} • ${file.type}`;
                }
                
                placeholder.style.display = 'block';
                placeholder.style.visibility = 'visible';
                console.log('[UploadUI] Usando placeholder existente');
            }
        }

        // Ocultar el área de upload original con transición suave
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            uploadArea.style.opacity = '0';
            uploadArea.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                uploadArea.style.display = 'none';
            }, 300);
        }

        console.log('[UploadUI] Información del archivo mostrada');
    }

    /**
     * Remueve archivo seleccionado
     */
    removeSelectedFile() {
        console.log('[UploadUI] Removiendo archivo seleccionado');
        
        this.selectedFile = null;
        
        // Ocultar información del archivo con animación
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            fileInfo.style.opacity = '0';
            fileInfo.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                fileInfo.style.display = 'none';
                fileInfo.classList.remove('show');
                // Resetear estilos
                fileInfo.style.opacity = '';
                fileInfo.style.transform = '';
            }, 300);
        }
        
        // Ocultar placeholder si está visible
        const placeholder = document.getElementById('fileStatusPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }
        
        // Mostrar área de upload con animación
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            // Resetear estilos primero
            uploadArea.style.opacity = '0';
            uploadArea.style.transform = 'translateY(10px)';
            uploadArea.style.display = 'block';
            
            // Animar la entrada
            setTimeout(() => {
                uploadArea.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                uploadArea.style.opacity = '1';
                uploadArea.style.transform = 'translateY(0)';
            }, 50);
        }
        
        // Deshabilitar botón
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }
        
        // Limpiar input
        const fileInput = document.getElementById('audioFile') || document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.hideError();
        console.log('[UploadUI] Archivo removido correctamente');
    }

    /**
     * Reinicia la interfaz para nueva subida
     */
    resetUpload() {
        console.log('[UploadUI] Reiniciando interfaz para nueva subida');
        
        this.selectedFile = null;
        
        // Resetear etapas de procesamiento
        if (window.processingStages) {
            window.processingStages.reset();
        }
        
        // Ocultar resultado
        const uploadResult = document.getElementById('uploadResult');
        if (uploadResult) {
            uploadResult.style.display = 'none';
        }
        
        // Ocultar información del archivo con animación
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            fileInfo.style.opacity = '0';
            fileInfo.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                fileInfo.style.display = 'none';
                fileInfo.classList.remove('show');
                // Resetear estilos
                fileInfo.style.opacity = '';
                fileInfo.style.transform = '';
            }, 300);
        }
        
        // Ocultar placeholder
        const placeholder = document.getElementById('fileStatusPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }
        
        // Mostrar área de upload con animación
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            // Resetear estilos primero
            uploadArea.style.opacity = '0';
            uploadArea.style.transform = 'translateY(10px)';
            uploadArea.style.display = 'block';
            
            // Animar la entrada
            setTimeout(() => {
                uploadArea.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                uploadArea.style.opacity = '1';
                uploadArea.style.transform = 'translateY(0)';
            }, 350);
        }
        
        // Mostrar y deshabilitar botón de upload
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            // Restaurar comportamiento original del botón
            uploadBtn.textContent = 'Subir Archivo';
            uploadBtn.disabled = true;
            uploadBtn.classList.remove('processing');
            uploadBtn.onclick = () => this.startUpload();
            
            // Primero mostrarlo si estaba oculto
            uploadBtn.style.display = 'block';
            uploadBtn.style.opacity = '0';
            uploadBtn.style.transform = 'translateY(10px)';
            
            // Animar la aparición
            setTimeout(() => {
                uploadBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                uploadBtn.style.opacity = '1';
                uploadBtn.style.transform = 'translateY(0)';
            }, 400);
        }
        
        // Limpiar input
        const fileInput = document.getElementById('audioFile') || document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.hideError();
        console.log('[UploadUI] Interfaz reiniciada correctamente');
    }

    /**
     * Inicia proceso de subida
     */
    async startUpload() {
        if (!this.selectedFile) {
            console.error('[UploadUI] No hay archivo seleccionado para subir');
            return;
        }

        console.log('[UploadUI] ===== INICIANDO SUBIDA DESDE UI =====');
        console.log('[UploadUI] Archivo a subir:', {
            name: this.selectedFile.name,
            size: this.selectedFile.size,
            type: this.selectedFile.type
        });

        // Limpiar resultados anteriores usando StatusUI
        if (window.statusUI) {
            console.log('[UploadUI] Limpiando resultados anteriores...');
            window.statusUI.clearResults();
        }

        // Iniciar etapas de procesamiento
        if (window.processingStages) {
            console.log('[UploadUI] Iniciando etapas de procesamiento...');
            window.processingStages.startProcessing();
            window.processingStages.nextStage('upload');
        }

        this.showProgress();
        
        try {
            console.log('[UploadUI] Llamando uploadHandler.uploadFile...');
            const result = await this.uploadHandler.uploadFile(
                this.selectedFile,
                this.updateProgress.bind(this)
            );

            console.log('[UploadUI] Subida completada exitosamente');
            console.log('[UploadUI] Resultado:', result);
            
            // Marcar upload como completado y avanzar a trigger
            if (window.processingStages) {
                window.processingStages.completeStage('upload');
                window.processingStages.nextStage('trigger');
            }
            
            this.showSuccess(result);
        } catch (error) {
            console.error('[UploadUI] Error en subida:', error);
            console.error('[UploadUI] Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            // Marcar error en upload
            if (window.processingStages) {
                window.processingStages.errorStage('upload', `Error subiendo archivo: ${error.message}`);
            }
            
            this.showError(error.message);
            this.hideProgress();
            
            // Restaurar texto del botón después del error
            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn) {
                uploadBtn.textContent = 'Subir Archivo';
            }
        }
    }

    /**
     * Actualiza barra de progreso
     */
    updateProgress(percent) {
        console.log(`[UploadUI] Actualizando progreso: ${percent.toFixed(1)}%`);
        
        // Actualizar barra de progreso moderna
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const progressStatus = document.getElementById('progressStatus');
        const progressSpeed = document.getElementById('progressSpeed');
        
        // Fallback a elementos existentes del HTML original
        const fallbackProgressFill = document.getElementById('progressBar');
        const fallbackProgressPercent = document.getElementById('progressText');
        const fallbackProgressStatus = document.getElementById('progressMessage');

        // Actualizar elementos modernos si existen
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        } else if (fallbackProgressFill) {
            fallbackProgressFill.style.width = `${percent}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(percent)}%`;
        } else if (fallbackProgressPercent) {
            fallbackProgressPercent.textContent = `${Math.round(percent)}%`;
        }
        
        // Actualizar estado
        let statusText = 'Preparando...';
        if (percent > 0 && percent < 100) {
            statusText = 'Subiendo archivo...';
        } else if (percent >= 100) {
            statusText = 'Procesando...';
        }
        
        if (progressStatus) {
            progressStatus.textContent = statusText;
        } else if (fallbackProgressStatus) {
            fallbackProgressStatus.textContent = statusText;
        }
        
        // Simular velocidad de subida (opcional)
        if (progressSpeed && percent > 0 && percent < 100) {
            const speeds = ['1.2 MB/s', '850 KB/s', '2.1 MB/s', '1.8 MB/s'];
            progressSpeed.textContent = speeds[Math.floor(Math.random() * speeds.length)];
        } else if (progressSpeed) {
            progressSpeed.textContent = '';
        }
        
        // Actualizar título del archivo en el progreso
        const uploadFilename = document.querySelector('.upload-filename');
        if (uploadFilename && this.selectedFile) {
            uploadFilename.textContent = this.selectedFile.name;
        }
    }

    /**
     * Muestra progreso de subida
     */
    showProgress() {
        console.log('[UploadUI] Mostrando progreso de subida');
        
        // NO ocultar el botón, solo deshabilitarlo y cambiar su estado visual
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Procesando...';
            uploadBtn.classList.add('processing');
        }
        
        // Ocultar tarjeta de archivo con animación
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            fileInfo.style.opacity = '0';
            fileInfo.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                fileInfo.style.display = 'none';
            }, 300);
        }
        
        // Mostrar progreso - intentar elemento nuevo primero
        let progressContainer = document.getElementById('uploadProgress');
        if (!progressContainer) {
            progressContainer = document.getElementById('progress');
        }
        
        if (progressContainer) {
            // Mostrar con animación
            progressContainer.style.display = 'block';
            progressContainer.style.opacity = '0';
            progressContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                progressContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                progressContainer.style.opacity = '1';
                progressContainer.style.transform = 'translateY(0)';
            }, 350);
        }
        
        // Resetear valores y configurar nombre del archivo
        this.updateProgress(0);
    }

    /**
     * Oculta progreso de subida
     */
    hideProgress() {
        console.log('[UploadUI] Ocultando progreso de subida');
        
        // Ocultar progreso con animación
        let progressContainer = document.getElementById('uploadProgress');
        if (!progressContainer) {
            progressContainer = document.getElementById('progress');
        }
        
        if (progressContainer) {
            progressContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            progressContainer.style.opacity = '0';
            progressContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                // Resetear estilos
                progressContainer.style.opacity = '';
                progressContainer.style.transform = '';
            }, 300);
        }
        
        // Reactivar botón de upload (no mostrarlo porque ya está visible)
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.classList.remove('processing');
            // No cambiar el texto aquí - se maneja en showSuccess() o resetUpload()
        }
    }

    /**
     * Cancela subida en progreso
     */
    cancelUpload() {
        if (this.currentUpload) {
            this.uploadHandler.cancelUpload(this.currentUpload);
        }
        this.hideProgress();
        
        // Restaurar texto del botón después de cancelar
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.textContent = 'Subir Archivo';
        }
        
        this.showError('Subida cancelada');
    }

    /**
     * Muestra resultado exitoso de la subida (NO del procesamiento completo)
     */
    showSuccess(result) {
        console.log('[UploadUI] Subida exitosa:', result);
        
        // Solo ocultar el progreso y la información del archivo
        this.hideProgress();
        
        // IMPORTANTE: Limpiar referencia al archivo para evitar reutilización
        this.selectedFile = null;
        
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        // MANTENER el botón bloqueado hasta que termine el procesamiento completo
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true; // Mantener bloqueado
            uploadBtn.textContent = 'Procesando archivo...';
            uploadBtn.classList.add('processing');
        }
        
        // Configurar listener para cuando termine el procesamiento completo
        this.setupProcessingCompleteListener();
        
        console.log('[UploadUI] Subida completada - esperando fin del procesamiento');
    }

    /**
     * Configura listener para detectar cuando el procesamiento completo termine
     */
    setupProcessingCompleteListener() {
        console.log('[UploadUI] Configurando listener para procesamiento completo...');
        
        let checkCount = 0;
        const maxChecks = 150; // 5 minutos máximo (150 * 2 segundos)
        
        // Verificar periódicamente si el procesamiento ha completado
        const checkProcessingComplete = () => {
            checkCount++;
            
            // Timeout de seguridad - después de 5 minutos, habilitar el botón
            if (checkCount >= maxChecks) {
                console.log('[UploadUI] Timeout alcanzado - habilitando botón por seguridad');
                this.onProcessingComplete();
                return;
            }
            
            // Verificar si processing stages está disponible
            if (window.processingStages) {
                const stages = window.processingStages.stages;
                const completedStage = stages.find(stage => stage.id === 'completed');
                
                // Procesamiento completado exitosamente
                if (completedStage && completedStage.status === 'completed') {
                    console.log('[UploadUI] Procesamiento completo detectado - habilitando botón');
                    this.onProcessingComplete();
                    return;
                }
                
                // Verificar si hay errores en etapas críticas
                const criticalErrorStages = stages.filter(stage => 
                    stage.status === 'error' && 
                    ['upload', 'trigger', 'transcribing', 'analyzing', 'completed'].includes(stage.id)
                );
                
                if (criticalErrorStages.length > 0) {
                    console.log('[UploadUI] Error crítico en procesamiento detectado - habilitando botón');
                    this.onProcessingComplete();
                    return;
                }
            }
            
            // Verificar si el status handler ha detenido todos los polling (indica fin de procesamiento)
            if (window.statusHandler && window.statusHandler.activePollings) {
                if (window.statusHandler.activePollings.size === 0 && checkCount > 10) {
                    // Si no hay polling activo después de un tiempo, probablemente terminó
                    console.log('[UploadUI] No hay polling activo - asumiendo procesamiento terminado');
                    this.onProcessingComplete();
                    return;
                }
            }
            
            // Continuar chequeando cada 2 segundos
            setTimeout(checkProcessingComplete, 2000);
        };
        
        // Iniciar el chequeo después de un pequeño delay
        setTimeout(checkProcessingComplete, 2000);
    }

    /**
     * Maneja cuando el procesamiento completo ha terminado
     */
    onProcessingComplete() {
        console.log('[UploadUI] Procesamiento completo terminado - esperando antes de habilitar interfaz');
        
        // Cambiar el texto del botón para indicar que está esperando
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.textContent = 'Procesamiento completado...';
        }
        
        // Agregar un delay de 5 segundos antes de habilitar el botón
        // para dar tiempo a que el usuario vea los resultados finales
        setTimeout(() => {
            console.log('[UploadUI] Delay completado - habilitando interfaz');
            this.enableUploadButton();
            console.log('[UploadUI] UI lista para nueva subida');
        }, 10000); // 5 segundos de delay
    }

    /**
     * Muestra mensaje de error
     */
    showError(message) {
        console.error('[UploadUI] Mostrando error:', message);
        
        // Si hay un error, habilitar el botón para permitir reintentos
        this.enableUploadButton();
        
        // Buscar contenedor de error dentro de la sección de upload existente
        let errorDiv = document.querySelector('.upload-section .error-message');
        if (!errorDiv) {
            console.log('[UploadUI] Creando nuevo div de error');
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #fed7d7;
                color: #742a2a;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
                border: 1px solid #fc8181;
                position: relative;
                width: 100%;
                box-sizing: border-box;
                word-wrap: break-word;
                max-width: 100%;
            `;
            
            // Insertar al inicio de la sección de upload para que esté visible
            const uploadSection = document.querySelector('.upload-section');
            if (uploadSection) {
                const firstChild = uploadSection.firstElementChild;
                if (firstChild) {
                    uploadSection.insertBefore(errorDiv, firstChild);
                } else {
                    uploadSection.appendChild(errorDiv);
                }
            }
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        console.log('[UploadUI] Error mostrado en la UI');
    }

    /**
     * Habilita el botón de upload después de un error o procesamiento completo
     */
    enableUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            // Si hay un archivo seleccionado, permitir reintento de subida
            if (this.selectedFile) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Reintentar Subida';
                uploadBtn.classList.remove('processing');
                uploadBtn.onclick = () => this.startUpload();
            } else {
                // Si no hay archivo, configurar para subir otro archivo
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Subir Otro Archivo';
                uploadBtn.classList.remove('processing');
                uploadBtn.onclick = () => this.resetUpload();
            }
        }
    }

    /**
     * Oculta mensaje de error
     */
    hideError() {
        console.log('[UploadUI] Ocultando mensajes de error');
        const errorDiv = document.querySelector('.upload-section .error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UploadUI] DOM cargado, inicializando UploadUI...');
    window.uploadUI = new UploadUI();
    console.log('[UploadUI] UploadUI inicializado y disponible globalmente');
});

// Exportar para uso global
window.UploadUI = UploadUI;
