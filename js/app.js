// ===== APLICACIÓN PRINCIPAL FLOWWARE =====

class FlowWareApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Iniciando FlowWare...');

            // Verificar que el namespace esté disponible
            if (!window.FlowWare) {
                throw new Error('FlowWare namespace no inicializado');
            }

            // Verificar dependencias
            this.checkDependencies();

            // Inicializar managers en orden
            await this.initializeManagers();

            // Configurar eventos globales
            this.setupGlobalEvents();

            // Configurar atajos de teclado
            this.setupKeyboardShortcuts();

            // Verificar auto-guardado
            this.checkAutoSave();

            // Marcar como inicializado
            this.isInitialized = true;

            // Inicializar WizardManager aquí para asegurar que FlowWare.Utils esté listo
            if (window.WizardManager && typeof WizardManager === 'function') {
                new WizardManager(); // WizardManager se auto-asigna a window.FlowWare.WizardManager
            } else {
                console.error("WizardManager no está definido o no es una función.");
            }

            // Lógica para mostrar wizard o mensaje de completado
            this.handleInitialDisplay();

            // Mensaje de bienvenida (quizás no sea necesario si el wizard se muestra)
            // this.showWelcomeMessage();

            console.log('✅ FlowWare inicializado correctamente');

        } catch (error) {
            console.error('❌ Error al inicializar FlowWare:', error);
            if (window.FlowWare && window.FlowWare.NotificationManager) {
                window.FlowWare.NotificationManager.show('❌ Error al inicializar la aplicación', 'error');
            }
        }
    }

    checkDependencies() {
        // Verificar UUID
        if (typeof uuid === 'undefined') {
            throw new Error('UUID library no encontrada');
        }

        // Verificar elementos DOM requeridos
        const requiredElements = [
            // 'canvas', // Comentado
            // 'connections-svg', // Comentado
            // 'config-panel', // Comentado - Panel de config de nodos del canvas
            // 'node-name', // Comentado
            // 'node-description', // Comentado
            // 'zoom-level', // Comentado
            // 'node-count', // Comentado
            // 'connection-count' // Comentado
            // Se podrían añadir elementos del wizard aquí si fueran críticos para FlowWareApp
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            throw new Error(`Elementos DOM faltantes: ${missingElements.join(', ')}`);
        }
    }

    async initializeManagers() {
        // Inicializar Canvas Manager - Comentado
        // this.managers.canvas = new CanvasManager();
        // await this.waitForManager('canvas');

        // Inicializar Node Manager - Comentado
        // this.managers.nodes = new NodeManager();
        // await this.waitForManager('nodes');

        // Inicializar Connection Manager - Comentado
        // this.managers.connections = new ConnectionManager();
        // await this.waitForManager('connections');

        // Managers como NotificationManager (parte de FlowWare.Utils) y WorkflowManager (si se usa para lógica general)
        // se inicializan o están disponibles de otra forma. WizardManager se inicializa explícitamente.
        console.log('📦 Managers del canvas no inicializados (enfocando en wizard).');
    }

    async waitForManager(managerName) {
        return new Promise((resolve) => {
            const checkManager = () => {
                if (window.FlowWare.State[managerName]) {
                    resolve();
                } else {
                    setTimeout(checkManager, 10);
                }
            };
            checkManager();
        });
    }

    setupGlobalEvents() {
        // Eventos de ventana
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));

        // Eventos de visibilidad
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Eventos personalizados de FlowWare (con verificación)
        // Comentados ya que están relacionados con el canvas
        // if (window.FlowWare && window.FlowWare.EventBus) {
        //     window.FlowWare.EventBus.on(window.FlowWare.EVENTS.NODE_CREATED, this.handleNodeCreated.bind(this));
        //     window.FlowWare.EventBus.on(window.FlowWare.EVENTS.CONNECTION_CREATED, this.handleConnectionCreated.bind(this));
        // }

        console.log('🔗 Eventos globales configurados (eventos de canvas omitidos intencionalmente).');
    }

    setupKeyboardShortcuts() {
        // Configurar atajos del WorkflowManager (Guardar/Cargar/Limpiar Workflow del Wizard)
        // WorkflowManager actualmente guarda/carga el canvas. Habría que adaptarlo o crear
        // una nueva lógica de guardado/carga para el ESTADO DEL WIZARD si se desea con Ctrl+S/O.
        // Por ahora, el wizard guarda en cada paso. El WorkflowManager.save() actual no aplica.
        // WorkflowManager.setupKeyboardShortcuts(); // Comentado por ahora

        // Atajos adicionales de la aplicación
        document.addEventListener('keydown', (event) => {
            // Solo procesar si no se está editando texto
            if (this.isEditingText(event.target)) return;

            switch (event.key) {
                case 'F1':
                    event.preventDefault();
                    // this.showHelp(); // El contenido de ayuda actual es sobre el canvas
                    window.FlowWare.NotificationManager.show("La ayuda contextual aún no está implementada para el wizard.", "info");
                    break;

                case 'F2':
                    event.preventDefault();
                    this.toggleDebugMode();
                    break;

                // case 'F': // Relacionado con fitToNodes del canvas
                //     if (event.ctrlKey || event.metaKey) {
                //         event.preventDefault();
                //         this.fitToNodes();
                //     }
                //     break;

                // case '?': // Relacionado con atajos del canvas
                //     if (event.shiftKey) {
                //         event.preventDefault();
                //         this.showShortcuts();
                //     }
                //     break;
            }
        });

        console.log('⌨️ Atajos de teclado configurados (atajos de canvas omitidos).');
    }

    checkAutoSave() {
        // Verificar si hay auto-guardado disponible
        const autoSavedWorkflow = window.FlowWare.Utils.State.load('autosave_workflow');
        const timestamp = window.FlowWare.Utils.State.load('autosave_timestamp');

        if (autoSavedWorkflow && timestamp) {
            const timeDiff = Date.now() - timestamp;
            const minutesAgo = Math.floor(timeDiff / (1000 * 60));

            if (minutesAgo < 60) { // Solo ofrecer si es menor a 1 hora
                setTimeout(() => {
                    WorkflowManager.loadAutoSave();
                }, 2000);
            }
        }

        // Habilitar auto-guardado
        WorkflowManager.enableAutoSave(5); // Cada 5 minutos
    }

    showWelcomeMessage() {
        setTimeout(() => {
            window.FlowWare.NotificationManager.show(
                '🎉 FlowWare listo! Arrastra nodos para comenzar',
                'success',
                4000
            );
        }, 1000);
    }

    // ===== MANEJADORES DE EVENTOS =====

    handleBeforeUnload(event) {
        // Auto-guardar antes de cerrar
        if (window.FlowWare.State.nodeList.length > 0) {
            WorkflowManager.autoSave();

            // Mostrar advertencia si hay cambios sin guardar
            const message = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
            event.returnValue = message;
            return message;
        }
    }

    handleResize() {
        // Debounce para evitar múltiples llamadas
        // window.FlowWare.Utils.Performance.debounce(() => {
        //     if (this.managers.canvas) { // CanvasManager ya no se inicializa
        //         // this.managers.canvas.updateTransform();
        //     }
        // }, 250)();
        // No es necesaria acción de resize si el canvas no está visible.
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pausar animaciones cuando la pestaña no está visible
            this.pauseAnimations();
        } else {
            // Reanudar animaciones
            this.resumeAnimations();
        }
    }

    handleNodeCreated(nodeData) {
        console.log('Nodo creado:', nodeData.config.name);

        // Analizar workflow automáticamente si hay más de 3 nodos
        if (window.FlowWare.State.nodeList.length > 3) {
            this.scheduleWorkflowAnalysis();
        }
    }

    handleConnectionCreated(connectionData) {
        console.log('Conexión creada:', connectionData.from, '->', connectionData.to);

        // Validar workflow automáticamente
        this.scheduleWorkflowValidation();
    }

    // ===== UTILIDADES =====

    isEditingText(element) {
        return element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.contentEditable === 'true';
    }

    fitToNodes() {
        if (this.managers.canvas && window.FlowWare.State.nodeList.length > 0) {
            this.managers.canvas.fitToNodes();
            window.FlowWare.NotificationManager.show('🔍 Vista ajustada a nodos', 'info');
        }
    }

    showHelp() {
        const helpContent = `
        <div style="text-align: left; line-height: 1.6;">
          <h3>🚀 FlowWare - Guía Rápida</h3>
          <br>
          <strong>Crear nodos:</strong> Arrastra desde el panel lateral<br>
          <strong>Conectar:</strong> Arrastra desde puerto naranja a puerto azul<br>
          <strong>Mover:</strong> Arrastra el nodo<br>
          <strong>Seleccionar:</strong> Click en el nodo<br>
          <strong>Configurar:</strong> Doble click en el nodo<br>
          <strong>Eliminar:</strong> Seleccionar + tecla Delete<br>
          <br>
          <strong>Canvas:</strong><br>
          • Zoom: Rueda del mouse<br>
          • Pan: Mantén Espacio + arrastra<br>
          • Ajustar vista: Ctrl+F<br>
          <br>
          <strong>Atajos:</strong><br>
          • Ctrl+S: Guardar<br>
          • Ctrl+O: Abrir<br>
          • Ctrl+N: Nuevo<br>
          • Ctrl+D: Duplicar nodo<br>
          • Escape: Deseleccionar<br>
        </div>
      `;

        // Crear modal simple
        this.showModal('Ayuda', helpContent);
    }

    showShortcuts() {
        const shortcutsContent = `
        <div style="text-align: left; font-family: monospace; line-height: 1.8;">
          <h3>⌨️ Atajos de Teclado</h3>
          <br>
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
            <strong>Ctrl+S</strong> <span>Guardar workflow</span>
            <strong>Ctrl+O</strong> <span>Abrir workflow</span>
            <strong>Ctrl+N</strong> <span>Nuevo workflow</span>
            <strong>Ctrl+E</strong> <span>Exportar JSON</span>
            <strong>Ctrl+F</strong> <span>Ajustar vista</span>
            <strong>Ctrl+D</strong> <span>Duplicar nodo</span>
            <strong>Delete</strong> <span>Eliminar nodo</span>
            <strong>Escape</strong> <span>Deseleccionar</span>
            <strong>F1</strong> <span>Mostrar ayuda</span>
            <strong>F2</strong> <span>Modo debug</span>
            <strong>Shift+?</strong> <span>Mostrar atajos</span>
          </div>
        </div>
      `;

        this.showModal('Atajos de Teclado', shortcutsContent);
    }

    showModal(title, content) {
        // Crear modal dinámico
        const modal = window.FlowWare.Utils.DOM.createElement('div', {
            className: 'modal-overlay',
            styles: {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '2000'
            },
            innerHTML: `
          <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            max-height: 70vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #0c2a4f;">${title}</h2>
              <button onclick="this.closest('.modal-overlay').remove()" style="
                border: none;
                background: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">&times;</button>
            </div>
            <div>${content}</div>
          </div>
        `
        });

        document.body.appendChild(modal);

        // Cerrar con click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Cerrar con Escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }

    toggleDebugMode() {
        window.FlowWare.debugMode = !window.FlowWare.debugMode;

        if (window.FlowWare.debugMode) {
            document.body.classList.add('debug-mode');
            console.log('🐛 Modo debug activado');
            this.showDebugInfo();
        } else {
            document.body.classList.remove('debug-mode');
            console.log('🐛 Modo debug desactivado');
        }
    }

    showDebugInfo() {
        const debugInfo = {
            nodes: window.FlowWare.State.nodeList.length,
            connections: window.FlowWare.State.connectionList.length,
            zoom: window.FlowWare.State.zoom,
            panX: window.FlowWare.State.panX,
            panY: window.FlowWare.State.panY,
            selectedNode: window.FlowWare.State.selectedNode?.id || 'none',
            isConnecting: window.FlowWare.State.connections?.isConnecting || false,
            isDragging: window.FlowWare.State.isDragging
        };

        console.table(debugInfo);
    }

    scheduleWorkflowAnalysis() {
        // Debounce para evitar análisis múltiples
        window.FlowWare.Utils.Performance.debounce(() => {
            const analysis = WorkflowManager.analyzeWorkflow();
            console.log('📊 Análisis automático del workflow:', analysis);
        }, 2000)();
    }

    scheduleWorkflowValidation() {
        // Debounce para validación automática
        window.FlowWare.Utils.Performance.debounce(() => {
            WorkflowManager.validate();
        }, 1000)();
    }

    pauseAnimations() {
        document.body.classList.add('animations-paused');
    }

    resumeAnimations() {
        document.body.classList.remove('animations-paused');
    }

    // ===== MÉTODOS PÚBLICOS =====

    getManagers() {
        return this.managers;
    }

    getState() {
        return window.FlowWare.State;
    }

    isReady() {
        return this.isInitialized;
    }

    // ===== CLEANUP =====

    destroy() {
        console.log('🧹 Destruyendo FlowWare...');

        // Deshabilitar auto-guardado
        WorkflowManager.disableAutoSave();

        // Destruir managers
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });

        // Limpiar event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        // Limpiar EventBus
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.clear();
        }

        // Limpiar estado
        this.managers = {};
        this.isInitialized = false;

        console.log('✅ FlowWare destruido correctamente');
    }
}

// ===== INICIALIZACIÓN =====

    handleInitialDisplay() {
        const wizardCompleted = window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted');
        const initialConfigMessage = document.getElementById('initial-config-message');
        const appElement = document.querySelector('.app'); // Necesitamos el div .app
        const appContentWrapper = document.querySelector('.app-content-wrapper');


        if (!wizardCompleted) {
            if (window.FlowWare && window.FlowWare.WizardManager) {
                window.FlowWare.WizardManager.showWizard();
            } else {
                console.error("WizardManager no está disponible para mostrar el wizard automáticamente.");
            }
            if (initialConfigMessage) initialConfigMessage.style.display = 'none';
            if (appContentWrapper) appContentWrapper.style.display = 'none'; // Asegurar que el contenido principal esté oculto
            if (appElement) appElement.classList.remove('app-active');

        } else {
            if (initialConfigMessage) {
                initialConfigMessage.style.display = 'flex';
            }
            if (window.FlowWare && window.FlowWare.WizardManager) {
                 window.FlowWare.WizardManager.hideWizard(); // Asegurar que esté oculto si se completó
            }
            if (appContentWrapper) appContentWrapper.style.display = 'none'; // Mantener oculto
            if (appElement) appElement.classList.remove('app-active');

            // El mensaje de bienvenida original podría ser redundante aquí
            // this.showWelcomeMessage(); // Ya no se llama desde init() directamente.
            console.log("Configuración inicial ya completada. Mostrando mensaje.");
        }
    }
}

// Crear instancia global
window.FlowWareApp = new FlowWareApp();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeña demora para asegurar que todos los scripts se carguen
    // Esto es especialmente importante para que js/utils.js (con NotificationManager) esté disponible
    setTimeout(() => {
        window.FlowWareApp.init();
    }, 250); // Aumentar un poco el timeout por si acaso
});

// Exponer para debugging
if (typeof window !== 'undefined') {
    // Asegurar que FlowWare existe antes de asignar
    window.FlowWare = window.FlowWare || {};
    window.FlowWare.App = window.FlowWareApp;
  }