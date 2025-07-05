// ===== WORKFLOW MANAGER - COMPLETO DESDE CERO =====
class WorkflowManager {
    // Variable estática para auto-guardado
    static autoSaveInterval = null;

    // ===== MÉTODOS PRINCIPALES =====

    static save() {
        try {
            const workflow = this.createWorkflowData();
            const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const a = document.createElement('a');
            a.href = url;
            a.download = `workflow-${timestamp}.json`;
            a.click();

            URL.revokeObjectURL(url);

            window.FlowWare.NotificationManager.show('✅ Workflow guardado exitosamente', 'success');

            // Backup en localStorage
            window.FlowWare.Utils.State.save('last_workflow', workflow);

        } catch (error) {
            console.error('Error al guardar workflow:', error);
            window.FlowWare.NotificationManager.show('❌ Error al guardar el workflow', 'error');
        }
    }

    static load() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workflow = JSON.parse(e.target.result);
                    this.loadWorkflowData(workflow);
                    window.FlowWare.NotificationManager.show('✅ Workflow cargado exitosamente', 'success');
                } catch (error) {
                    console.error('Error al cargar workflow:', error);
                    window.FlowWare.NotificationManager.show('❌ Error al cargar el workflow', 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    static clear() {
        if (!confirm('¿Estás seguro de que quieres limpiar el workflow? Se perderán todos los cambios no guardados.')) {
            return;
        }

        this.clearWorkflow();
        window.FlowWare.NotificationManager.show('🗑️ Workflow limpiado', 'info');
    }

    static clearWorkflow() {
        // Limpiar nodos
        if (window.FlowWare.State.nodes) {
            window.FlowWare.State.nodes.clearAllNodes();
        }

        // Limpiar conexiones
        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.clearAllConnections();
        }

        // Resetear canvas
        if (window.FlowWare.State.canvas) {
            window.FlowWare.State.canvas.resetZoom();
        }
    }

    static validate() {
        const nodeValidation = window.FlowWare.State.nodes?.validateWorkflow() ||
            { errors: [], warnings: [], isValid: true };
        const connectionValidation = window.FlowWare.State.connections?.validateConnections() ||
            { errors: [], warnings: [], isValid: true };

        const allErrors = [...nodeValidation.errors, ...connectionValidation.errors];
        const allWarnings = [...nodeValidation.warnings, ...connectionValidation.warnings];

        if (allErrors.length === 0) {
            let message = '✅ Workflow válido';
            if (allWarnings.length > 0) {
                message += ` (${allWarnings.length} advertencias)`;
            }
            window.FlowWare.NotificationManager.show(message, 'success');

            if (allWarnings.length > 0) {
                console.warn('Advertencias del workflow:', allWarnings);
            }

            return true;
        } else {
            window.FlowWare.NotificationManager.show(`❌ Workflow inválido: ${allErrors[0]}`, 'error');
            console.error('Errores del workflow:', allErrors);
            return false;
        }
    }

    // ===== CREAR Y CARGAR DATOS =====

    static createWorkflowData() {
        return {
            metadata: {
                name: 'Workflow de Almacén',
                description: 'Flujo automatizado para gestión de almacén',
                version: '2.0',
                created: new Date().toISOString(),
                creator: 'FlowWare',
                id: uuid.v4()
            },
            canvas: {
                zoom: window.FlowWare.State.canvas?.scale || 1,
                panX: window.FlowWare.State.canvas?.translateX || 0,
                panY: window.FlowWare.State.canvas?.translateY || 0
            },
            nodes: (window.FlowWare.State.nodeList || []).map(node => ({
                id: node.id,
                type: node.type,
                subtype: node.subtype,
                x: node.x,
                y: node.y,
                config: { ...node.config }
            })),
            connections: (window.FlowWare.State.connectionList || []).map(conn => ({
                id: conn.id,
                from: conn.from,
                to: conn.to,
                created: conn.created || Date.now()
            })),
            statistics: {
                nodeCount: window.FlowWare.State.nodeList?.length || 0,
                connectionCount: window.FlowWare.State.connectionList?.length || 0,
                nodesByType: this.getNodeStatistics()
            }
        };
    }

    static loadWorkflowData(workflow) {
        if (!this.validateWorkflowFormat(workflow)) {
            throw new Error('Formato de workflow inválido');
        }

        // Limpiar sin confirmación
        this.clearWorkflow();

        // Restaurar canvas
        if (workflow.canvas && window.FlowWare.State.canvas) {
            window.FlowWare.State.canvas.scale = workflow.canvas.zoom || 1;
            window.FlowWare.State.canvas.translateX = workflow.canvas.panX || 0;
            window.FlowWare.State.canvas.translateY = workflow.canvas.panY || 0;
        }

        // Cargar nodos
        if (workflow.nodes && Array.isArray(workflow.nodes)) {
            workflow.nodes.forEach(nodeData => {
                if (this.isValidNodeData(nodeData)) {
                    window.FlowWare.State.nodeList.push(nodeData);

                    if (window.FlowWare.State.nodes) {
                        window.FlowWare.State.nodes.renderNode(nodeData);
                    }
                } else {
                    console.warn('Nodo inválido ignorado:', nodeData);
                }
            });
        }

        // Cargar conexiones
        if (workflow.connections && Array.isArray(workflow.connections)) {
            workflow.connections.forEach(connData => {
                if (this.isValidConnectionData(connData)) {
                    window.FlowWare.State.connectionList.push(connData);

                    if (window.FlowWare.State.connections) {
                        window.FlowWare.State.connections.renderConnection(connData);
                    }
                } else {
                    console.warn('Conexión inválida ignorada:', connData);
                }
            });
        }

        // Actualizar UI
        this.updateUI();

        console.log('Workflow cargado:', workflow.metadata?.name || 'Sin nombre');
    }

    static updateUI() {
        if (window.FlowWare.State.nodes) {
            window.FlowWare.State.nodes.updateStats();
            if (window.FlowWare.State.nodeList.length > 0) {
                window.FlowWare.State.nodes.hideEmptyState();
            }
        }

        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.updateStats();
        }

        if (window.FlowWare.State.canvas) {
            window.FlowWare.State.canvas.updateTransform();
            window.FlowWare.State.canvas.updateZoomDisplay();
        }
    }

    // ===== VALIDACIONES =====

    static validateWorkflowFormat(workflow) {
        if (!workflow || typeof workflow !== 'object') return false;
        if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.connections)) return false;
        if (workflow.metadata && typeof workflow.metadata !== 'object') return false;
        return true;
    }

    static isValidNodeData(nodeData) {
        return nodeData &&
            typeof nodeData.id === 'string' &&
            typeof nodeData.type === 'string' &&
            typeof nodeData.subtype === 'string' &&
            typeof nodeData.x === 'number' &&
            typeof nodeData.y === 'number' &&
            nodeData.config && typeof nodeData.config === 'object';
    }

    static isValidConnectionData(connData) {
        return connData &&
            typeof connData.id === 'string' &&
            typeof connData.from === 'string' &&
            typeof connData.to === 'string' &&
            connData.from !== connData.to;
    }

    static getNodeStatistics() {
        const stats = {};

        if (window.FlowWare.State.nodeList) {
            window.FlowWare.State.nodeList.forEach(node => {
                if (!stats[node.type]) {
                    stats[node.type] = 0;
                }
                stats[node.type]++;
            });
        }

        return stats;
    }

    // ===== TEMPLATES Y DEMOS =====

    static loadTemplate(templateName) {
        const templates = this.getTemplates();
        const template = templates[templateName];

        if (!template) {
            window.FlowWare.NotificationManager.show('❌ Demo no encontrado', 'error');
            return;
        }

        if (window.FlowWare.State.nodeList.length > 0) {
            if (!confirm('¿Cargar demo? Se perderá el workflow actual.')) {
                return;
            }
        }

        this.loadWorkflowData(template);
        window.FlowWare.NotificationManager.show(`📋 Demo "${template.metadata.name}" cargado`, 'success');

        // Auto-ajustar vista
        setTimeout(() => {
            if (window.FlowWare.State.canvas) {
                window.FlowWare.State.canvas.fitToNodes();
            }
        }, 500);
    }

    static getTemplates() {
        return {
            'recepcion-completa': {
                metadata: {
                    name: 'Proceso de Entrada Completo',
                    description: 'Recepción, etiquetado y almacenaje de productos'
                },
                canvas: { zoom: 1, panX: 0, panY: 0 },
                nodes: [
                    {
                        id: 'node-entrada-1',
                        type: 'trigger',
                        subtype: 'entrada',
                        x: 100,
                        y: 150,
                        config: { name: 'Orden de Entrada', description: 'Productos que llegan al almacén' }
                    },
                    {
                        id: 'node-recepcion-1',
                        type: 'action',
                        subtype: 'recepcion',
                        x: 350,
                        y: 150,
                        config: { name: 'Recepción', description: 'Recibir y verificar productos' }
                    },
                    {
                        id: 'node-etiquetar-1',
                        type: 'action',
                        subtype: 'etiquetar',
                        x: 600,
                        y: 150,
                        config: { name: 'Generar Etiquetas', description: 'Crear códigos de barras' }
                    },
                    {
                        id: 'node-almacenaje-1',
                        type: 'action',
                        subtype: 'almacenaje',
                        x: 850,
                        y: 150,
                        config: { name: 'Almacenaje', description: 'Ubicar en estantería' }
                    },
                    {
                        id: 'node-notif-1',
                        type: 'notification',
                        subtype: 'sistema',
                        x: 1100,
                        y: 150,
                        config: { name: 'Confirmar Recepción', description: 'Notificar finalización' }
                    }
                ],
                connections: [
                    { id: 'conn-entrada-1', from: 'node-entrada-1', to: 'node-recepcion-1', created: Date.now() },
                    { id: 'conn-recepcion-1', from: 'node-recepcion-1', to: 'node-etiquetar-1', created: Date.now() },
                    { id: 'conn-etiquetar-1', from: 'node-etiquetar-1', to: 'node-almacenaje-1', created: Date.now() },
                    { id: 'conn-almacenaje-1', from: 'node-almacenaje-1', to: 'node-notif-1', created: Date.now() }
                ]
            },

            'salida-simple': {
                metadata: {
                    name: 'Proceso de Salida Simple',
                    description: 'Orden de salida → Embarque → Envío'
                },
                canvas: { zoom: 1, panX: 0, panY: 0 },
                nodes: [
                    {
                        id: 'node-salida-1',
                        type: 'trigger',
                        subtype: 'salida',
                        x: 100,
                        y: 150,
                        config: { name: 'Orden de Salida', description: 'Solicitud de despacho' }
                    },
                    {
                        id: 'node-embarque-1',
                        type: 'action',
                        subtype: 'embarque',
                        x: 350,
                        y: 150,
                        config: { name: 'Embarque', description: 'Cargar productos en vehículo' }
                    },
                    {
                        id: 'node-envio-1',
                        type: 'action',
                        subtype: 'envio',
                        x: 600,
                        y: 150,
                        config: { name: 'Envío', description: 'Despachar productos' }
                    },
                    {
                        id: 'node-notif-salida-1',
                        type: 'notification',
                        subtype: 'email',
                        x: 850,
                        y: 150,
                        config: { name: 'Confirmar Envío', description: 'Notificar al cliente' }
                    }
                ],
                connections: [
                    { id: 'conn-salida-1', from: 'node-salida-1', to: 'node-embarque-1', created: Date.now() },
                    { id: 'conn-embarque-1', from: 'node-embarque-1', to: 'node-envio-1', created: Date.now() },
                    { id: 'conn-envio-1', from: 'node-envio-1', to: 'node-notif-salida-1', created: Date.now() }
                ]
            },

            'salida-completa': {
                metadata: {
                    name: 'Proceso de Salida Completo',
                    description: 'Orden de salida → Picking → Packing → Embarque → Envío'
                },
                canvas: { zoom: 1, panX: 0, panY: 0 },
                nodes: [
                    {
                        id: 'node-salida-2',
                        type: 'trigger',
                        subtype: 'salida',
                        x: 100,
                        y: 150,
                        config: { name: 'Orden de Salida', description: 'Solicitud de despacho' }
                    },
                    {
                        id: 'node-picking-1',
                        type: 'action',
                        subtype: 'picking',
                        x: 350,
                        y: 150,
                        config: { name: 'Picking', description: 'Recolectar productos del almacén' }
                    },
                    {
                        id: 'node-packing-1',
                        type: 'action',
                        subtype: 'packing',
                        x: 600,
                        y: 150,
                        config: { name: 'Packing', description: 'Empacar productos' }
                    },
                    {
                        id: 'node-embarque-2',
                        type: 'action',
                        subtype: 'embarque',
                        x: 850,
                        y: 150,
                        config: { name: 'Embarque', description: 'Cargar productos en vehículo' }
                    },
                    {
                        id: 'node-envio-2',
                        type: 'action',
                        subtype: 'envio',
                        x: 1100,
                        y: 150,
                        config: { name: 'Envío', description: 'Despachar productos' }
                    },
                    {
                        id: 'node-notif-salida-2',
                        type: 'notification',
                        subtype: 'email',
                        x: 1350,
                        y: 150,
                        config: { name: 'Confirmar Envío', description: 'Notificar al cliente' }
                    }
                ],
                connections: [
                    { id: 'conn-salida-2', from: 'node-salida-2', to: 'node-picking-1', created: Date.now() },
                    { id: 'conn-picking-1', from: 'node-picking-1', to: 'node-packing-1', created: Date.now() },
                    { id: 'conn-packing-1', from: 'node-packing-1', to: 'node-embarque-2', created: Date.now() },
                    { id: 'conn-embarque-2', from: 'node-embarque-2', to: 'node-envio-2', created: Date.now() },
                    { id: 'conn-envio-2', from: 'node-envio-2', to: 'node-notif-salida-2', created: Date.now() }
                ]
            }
        };
    }

    static getAvailableTemplates() {
        return [
            {
                id: 'recepcion-completa',
                name: 'Proceso de Entrada Completo',
                description: 'Recepción, etiquetado y almacenaje',
                icon: '📥'
            },
            {
                id: 'salida-simple',
                name: 'Proceso de Salida Simple',
                description: 'Embarque y envío directo',
                icon: '🚛'
            },
            {
                id: 'salida-completa',
                name: 'Proceso de Salida Completo',
                description: 'Picking, packing, embarque y envío',
                icon: '📦'
            }
        ];
    }

    // ===== AUTO-GUARDADO =====

    static enableAutoSave(intervalMinutes = 5) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, intervalMinutes * 60 * 1000);

        console.log(`Auto-guardado habilitado cada ${intervalMinutes} minutos`);
    }

    static disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('Auto-guardado deshabilitado');
        }
    }

    static autoSave() {
        try {
            if (window.FlowWare.State.nodeList && window.FlowWare.State.nodeList.length > 0) {
                const workflow = this.createWorkflowData();
                window.FlowWare.Utils.State.save('autosave_workflow', workflow);
                window.FlowWare.Utils.State.save('autosave_timestamp', Date.now());
                console.log('Auto-guardado completado');
            }
        } catch (error) {
            console.error('Error en auto-guardado:', error);
        }
    }

    static loadAutoSave() {
        const autoSavedWorkflow = window.FlowWare.Utils.State.load('autosave_workflow');
        const timestamp = window.FlowWare.Utils.State.load('autosave_timestamp');

        if (autoSavedWorkflow && timestamp) {
            const timeDiff = Date.now() - timestamp;
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

            if (hoursAgo < 24 && confirm(`Se encontró un auto-guardado de hace ${hoursAgo} horas. ¿Deseas cargarlo?`)) {
                this.loadWorkflowData(autoSavedWorkflow);
                window.FlowWare.NotificationManager.show('📁 Auto-guardado restaurado', 'success');
            }
        }
    }

    // ===== EXPORTACIÓN =====

    static exportToJSON() {
        try {
            const workflow = this.createWorkflowData();
            const jsonStr = JSON.stringify(workflow, null, 2);

            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `workflow-export-${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            window.FlowWare.NotificationManager.show('📄 JSON exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error al exportar JSON:', error);
            window.FlowWare.NotificationManager.show('❌ Error al exportar JSON', 'error');
        }
    }

    // ===== ANÁLISIS DEL WORKFLOW =====

    static analyzeWorkflow() {
        const analysis = {
            nodeCount: window.FlowWare.State.nodeList?.length || 0,
            connectionCount: window.FlowWare.State.connectionList?.length || 0,
            complexity: this.calculateComplexity(),
            entryPoints: this.getEntryPoints(),
            exitPoints: this.getExitPoints(),
            longestPath: this.findLongestPath()
        };

        console.log('Análisis del workflow:', analysis);
        return analysis;
    }

    static calculateComplexity() {
        const edges = window.FlowWare.State.connectionList?.length || 0;
        const nodes = window.FlowWare.State.nodeList?.length || 0;
        const components = 1;

        return Math.max(0, edges - nodes + 2 * components);
    }

    static getEntryPoints() {
        if (!window.FlowWare.State.nodeList || !window.FlowWare.State.connectionList) return [];

        return window.FlowWare.State.nodeList.filter(node => {
            const hasInput = window.FlowWare.State.connectionList.some(conn => conn.to === node.id);
            return !hasInput || node.type === 'trigger';
        });
    }

    static getExitPoints() {
        if (!window.FlowWare.State.nodeList || !window.FlowWare.State.connectionList) return [];

        return window.FlowWare.State.nodeList.filter(node => {
            const hasOutput = window.FlowWare.State.connectionList.some(conn => conn.from === node.id);
            return !hasOutput;
        });
    }

    static findLongestPath() {
        if (!window.FlowWare.State.nodeList || !window.FlowWare.State.connectionList) return 0;

        let maxDepth = 0;

        const dfs = (nodeId, depth = 0) => {
            maxDepth = Math.max(maxDepth, depth);

            const outgoing = window.FlowWare.State.connectionList.filter(c => c.from === nodeId);
            outgoing.forEach(conn => {
                dfs(conn.to, depth + 1);
            });
        };

        this.getEntryPoints().forEach(entry => {
            dfs(entry.id);
        });

        return maxDepth;
    }

    // ===== ATAJOS DE TECLADO =====

    static setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 's':
                        event.preventDefault();
                        this.save();
                        break;
                    case 'o':
                        event.preventDefault();
                        this.load();
                        break;
                    case 'n':
                        event.preventDefault();
                        this.clear();
                        break;
                    case 'e':
                        event.preventDefault();
                        this.exportToJSON();
                        break;
                }
            }
        });
    }
}

// Crear instancia global
window.WorkflowManager = WorkflowManager;