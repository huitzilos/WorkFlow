// ===== NODE MANAGER =====
class NodeManager {
    constructor() {
        this.selectedNode = null;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;

        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.updateStats();
        window.FlowWare.State.nodes = this;
    }

    setupDragAndDrop() {
        const nodeItems = document.querySelectorAll('.node-item');
        nodeItems.forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (event) => {
                const data = {
                    type: item.dataset.type,
                    subtype: item.dataset.subtype,
                    name: item.querySelector('.node-name').textContent,
                    description: item.querySelector('.node-desc').textContent
                };

                event.dataTransfer.setData('text/plain', JSON.stringify(data));
                event.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    setupEventListeners() {
        // Escuchar drop de nodos
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.on('dropNode', this.handleNodeDrop.bind(this));
        } else {
            // Configurar después si no está disponible
            setTimeout(() => {
                if (window.FlowWare && window.FlowWare.EventBus) {
                    window.FlowWare.EventBus.on('dropNode', this.handleNodeDrop.bind(this));
                }
            }, 200);
        }

        // Mouse events para drag de nodos existentes
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Click en canvas para deseleccionar
        document.getElementById('canvas').addEventListener('click', (event) => {
            if (event.target.id === 'canvas') {
                this.deselectNode();
            }
        });

        // Eventos de teclado
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Configuración de nodos
        this.setupConfigPanel();
    }

    setupConfigPanel() {
        const nameInput = document.getElementById('node-name');
        const descInput = document.getElementById('node-description');
        const tipoEtiquetaSelect = document.getElementById('node-etiqueta-tipo');
        const nivelTrazabilidadSelect = document.getElementById('node-etiqueta-trazabilidad');

        if (nameInput) {
            nameInput.addEventListener('input', (event) => {
                if (this.selectedNode) {
                    this.updateNodeProperty('name', event.target.value);
                }
            });
        }

        if (descInput) {
            descInput.addEventListener('input', (event) => {
                if (this.selectedNode) {
                    this.updateNodeProperty('description', event.target.value);
                }
            });
        }

        if (tipoEtiquetaSelect) {
            tipoEtiquetaSelect.addEventListener('change', (event) => {
                if (this.selectedNode && this.selectedNode.subtype === 'etiquetar') {
                    this.updateNodeProperty('tipoEtiqueta', event.target.value);
                }
            });
        }

        if (nivelTrazabilidadSelect) {
            nivelTrazabilidadSelect.addEventListener('change', (event) => {
                if (this.selectedNode && this.selectedNode.subtype === 'etiquetar') {
                    this.updateNodeProperty('nivelTrazabilidad', event.target.value);
                    // La llamada a checkTraceabilityLogic ya está en updateNodeProperty
                }
            });
        }
    }

    // ===== CREACIÓN DE NODOS =====

    handleNodeDrop(data) {
        const nodeConfig = window.FlowWare.NODE_TYPES[data.type]?.subtypes[data.subtype];
        if (!nodeConfig) {
            console.error('Tipo de nodo no válido:', data.type, data.subtype);
            return;
        }

        const newNode = this.createNode(data.type, data.subtype, data.x, data.y, {
            name: nodeConfig.name,
            description: nodeConfig.desc
        });

        if (newNode) {
            // Lógica de dependencia Picking/Packing al añadir
            if (newNode.subtype === 'picking') {
                if (confirm(`Ha añadido un nodo "Picking". ¿Desea añadir automáticamente un nodo "Packing"?`)) {
                    const packingConfig = window.FlowWare.NODE_TYPES['action']?.subtypes['packing'];
                    if (packingConfig) {
                        this.createNode('action', 'packing', newNode.x + 60, newNode.y + 60, { // Posición cercana
                            name: packingConfig.name,
                            description: packingConfig.desc
                        });
                    }
                }
            } else if (newNode.subtype === 'packing') {
                if (confirm(`Ha añadido un nodo "Packing". ¿Desea añadir automáticamente un nodo "Picking"?`)) {
                    const pickingConfig = window.FlowWare.NODE_TYPES['action']?.subtypes['picking'];
                    if (pickingConfig) {
                        this.createNode('action', 'picking', newNode.x - 60, newNode.y - 60, { // Posición cercana
                            name: pickingConfig.name,
                            description: pickingConfig.desc
                        });
                    }
                }
            }
        }
        // Después de añadir un nodo picking/packing, verificar la lógica de trazabilidad de los nodos etiquetar
        if (newNode && (newNode.subtype === 'picking' || newNode.subtype === 'packing')) {
            // Usamos setTimeout para asegurar que el nodo se añade a la nodeList antes de verificar
            setTimeout(() => {
                window.FlowWare.State.nodeList.forEach(node => {
                    if (node.subtype === 'etiquetar') {
                        this.checkTraceabilityLogic(node);
                    }
                });
            }, 0);
        }
    }

    createNode(type, subtype, x, y, config = {}) {
        const nodeId = 'node-' + uuid.v4();

        const nodeData = {
            id: nodeId,
            type: type,
            subtype: subtype,
            x: x,
            y: y,
            config: {
                name: config.name || 'Nuevo Nodo',
                description: config.description || '',
                // Valores por defecto para configuración de etiquetas
                ...(subtype === 'etiquetar' && {
                    tipoEtiqueta: 'codigo_barras',
                    nivelTrazabilidad: 'pallet'
                })
            }
        };

        // Validar datos del nodo
        if (!window.FlowWare.Utils.Validation.isValidNode(nodeData)) {
            console.error('Datos de nodo inválidos:', nodeData);
            return null;
        }

        // Agregar a la lista
        window.FlowWare.State.nodeList.push(nodeData);

        // Renderizar nodo
        this.renderNode(nodeData);

        // Actualizar stats y UI
        this.updateStats();
        this.hideEmptyState();

        // Seleccionar nodo recién creado
        this.selectNode(nodeData);

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_CREATED, nodeData);
        }

        // Notificación
        window.FlowWare.NotificationManager.show(`✅ Nodo "${nodeData.config.name}" creado`, 'success');

        return nodeData;
    }

    renderNode(nodeData) {
        const nodeTypeConfig = window.FlowWare.NODE_TYPES[nodeData.type];
        const nodeSubtypeConfig = nodeTypeConfig?.subtypes[nodeData.subtype];

        if (!nodeSubtypeConfig) {
            console.error('Configuración de nodo no encontrada:', nodeData.type, nodeData.subtype);
            return;
        }

        const nodeElement = window.FlowWare.Utils.DOM.createElement('div', {
            className: 'workflow-node new',
            id: nodeData.id,
            attributes: {
                'data-type': nodeData.type,
                'data-subtype': nodeData.subtype
            },
            innerHTML: `
          <div class="node-header">
            <div class="node-type-indicator ${nodeData.type}">
              <span class="node-icon">${nodeSubtypeConfig.icon}</span>
            </div>
            <div class="node-content">
              <div class="node-title">${nodeData.config.name}</div>
              <div class="node-subtitle">${nodeData.subtype}</div>
            </div>
          </div>
          <div class="node-ports">
            <div class="node-port input" data-node-id="${nodeData.id}" data-port="input"></div>
            <div class="node-port output" data-node-id="${nodeData.id}" data-port="output"></div>
          </div>
          <div class="node-overlay"></div>
        `
        });

        // Setup eventos del nodo
        this.setupNodeEvents(nodeElement, nodeData);

        // Agregar al canvas
        document.getElementById('canvas').appendChild(nodeElement);

        // Actualizar posición
        window.FlowWare.State.canvas.updateNodeTransform(nodeElement, nodeData);

        // Remover clase 'new' después de la animación
        setTimeout(() => {
            nodeElement.classList.remove('new');
        }, 300);
    }

    setupNodeEvents(nodeElement, nodeData) {
        // Click para seleccionar
        nodeElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this.selectNode(nodeData);
        });

        // Doble click para configurar
        nodeElement.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            this.openConfig(nodeData);
        });

        // Mouse down para iniciar drag
        nodeElement.addEventListener('mousedown', (event) => {
            // Solo si no es un puerto
            if (!event.target.classList.contains('node-port')) {
                event.stopPropagation();
                event.preventDefault();
                this.startDrag(nodeData, event);
            }
        });

        // Setup puertos
        this.setupPortEvents(nodeElement, nodeData);
    }

    setupPortEvents(nodeElement, nodeData) {
        const inputPort = nodeElement.querySelector('.node-port.input');
        const outputPort = nodeElement.querySelector('.node-port.output');

        // Puerto de salida - iniciar conexión
        outputPort.addEventListener('mousedown', (event) => {
            event.stopPropagation();
            event.preventDefault();

            if (window.FlowWare.State.connections) {
                window.FlowWare.State.connections.startConnection(nodeData, 'output', outputPort, event);
            }
        });

        // Puerto de entrada - eventos para conexión
        inputPort.addEventListener('mouseenter', (event) => {
            if (window.FlowWare.State.connections?.isConnecting) {
                window.FlowWare.State.connections.setTargetPort(nodeData, 'input', inputPort);
            }
        });

        inputPort.addEventListener('mouseleave', (event) => {
            if (window.FlowWare.State.connections?.isConnecting) {
                window.FlowWare.State.connections.clearTargetPort();
            }
        });

        // Efectos hover en puertos
        [inputPort, outputPort].forEach(port => {
            port.addEventListener('mouseenter', () => {
                if (!window.FlowWare.State.connections?.isConnecting) {
                    port.style.transform = `scale(${window.FlowWare.PORTS.HOVER_SCALE})`;
                }
            });

            port.addEventListener('mouseleave', () => {
                if (!window.FlowWare.State.connections?.isConnecting) {
                    port.style.transform = '';
                }
            });
        });
    }

    // ===== DRAG AND DROP DE NODOS =====

    startDrag(nodeData, event) {
        if (window.FlowWare.State.isPanning) return;

        this.isDragging = true;
        this.draggedNode = nodeData;

        // Seleccionar nodo si no está seleccionado
        if (this.selectedNode !== nodeData) {
            this.selectNode(nodeData);
        }

        const nodeElement = document.getElementById(nodeData.id);
        const rect = nodeElement.getBoundingClientRect();

        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        nodeElement.classList.add('dragging');
        nodeElement.style.willChange = 'transform';

        window.FlowWare.State.isDragging = true;
    }

    handleMouseMove(event) {
        if (this.isDragging && this.draggedNode && !window.FlowWare.State.isPanning) {
            window.FlowWare.Utils.Performance.scheduleUpdate(() => {
                this.updateDragPosition(event);
            });
        }
    }

    updateDragPosition(event) {
        if (!this.draggedNode) return;

        const canvasCoords = window.FlowWare.State.canvas.screenToCanvas(
            event.clientX - this.dragOffset.x,
            event.clientY - this.dragOffset.y
        );

        // Snap to grid (opcional)
        if (event.ctrlKey || event.metaKey) {
            canvasCoords.x = window.FlowWare.Utils.Math.roundToMultiple(canvasCoords.x, window.FlowWare.CANVAS.GRID_SIZE);
            canvasCoords.y = window.FlowWare.Utils.Math.roundToMultiple(canvasCoords.y, window.FlowWare.CANVAS.GRID_SIZE);
        }

        // Actualizar posición del nodo
        this.draggedNode.x = canvasCoords.x;
        this.draggedNode.y = canvasCoords.y;

        // Actualizar elemento visual
        const nodeElement = document.getElementById(this.draggedNode.id);
        window.FlowWare.State.canvas.updateNodeTransform(nodeElement, this.draggedNode);

        // Actualizar solo las conexiones de este nodo
        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.updateConnectionsForNode(this.draggedNode.id);
        }

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_MOVED, this.draggedNode);
        }
    }

    handleMouseUp(event) {
        if (this.isDragging) {
            this.stopDrag();
        }
    }

    stopDrag() {
        if (this.draggedNode) {
            const nodeElement = document.getElementById(this.draggedNode.id);
            if (nodeElement) {
                nodeElement.classList.remove('dragging');
                nodeElement.style.willChange = 'auto';
            }
        }

        this.isDragging = false;
        this.draggedNode = null;
        window.FlowWare.State.isDragging = false;
    }

    // ===== SELECCIÓN DE NODOS =====

    selectNode(nodeData) {
        // Deseleccionar anterior
        if (this.selectedNode) {
            const prevElement = document.getElementById(this.selectedNode.id);
            if (prevElement) {
                prevElement.classList.remove('selected');
            }
            if (window.FlowWare && window.FlowWare.EventBus) {
                if (window.FlowWare && window.FlowWare.EventBus) {
                    window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_DESELECTED, this.selectedNode);
                }
            }
        }

        // Seleccionar nuevo
        this.selectedNode = nodeData;
        window.FlowWare.State.selectedNode = nodeData;

        const nodeElement = document.getElementById(nodeData.id);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }

        // Actualizar panel de configuración
        this.updateConfigPanel(nodeData);
        this.showConfigPanel();

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_SELECTED, nodeData);
        }
    }

    deselectNode() {
        if (this.selectedNode) {
            const nodeElement = document.getElementById(this.selectedNode.id);
            if (nodeElement) {
                nodeElement.classList.remove('selected');
            }

            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_DESELECTED, this.selectedNode);

            this.selectedNode = null;
            window.FlowWare.State.selectedNode = null;
        }

        this.hideConfigPanel();
    }

    // ===== CONFIGURACIÓN DE NODOS =====

    updateConfigPanel(nodeData) {
        const nameInput = document.getElementById('node-name');
        const descInput = document.getElementById('node-description');
        const etiquetarConfigSection = document.getElementById('config-etiquetar-specific');
        const tipoEtiquetaSelect = document.getElementById('node-etiqueta-tipo');
        const nivelTrazabilidadSelect = document.getElementById('node-etiqueta-trazabilidad');

        if (nameInput) nameInput.value = nodeData.config.name || '';
        if (descInput) descInput.value = nodeData.config.description || '';

        if (nodeData.subtype === 'etiquetar') {
            if (etiquetarConfigSection) etiquetarConfigSection.style.display = 'block';
            if (tipoEtiquetaSelect) tipoEtiquetaSelect.value = nodeData.config.tipoEtiqueta || 'codigo_barras';
            if (nivelTrazabilidadSelect) nivelTrazabilidadSelect.value = nodeData.config.nivelTrazabilidad || 'pallet';
        } else {
            if (etiquetarConfigSection) etiquetarConfigSection.style.display = 'none';
        }
    }

    updateNodeProperty(property, value) {
        if (!this.selectedNode) return;

        this.selectedNode.config[property] = value;

        // Actualizar UI si es el nombre
        if (property === 'name') {
            const nodeElement = document.getElementById(this.selectedNode.id);
            const titleElement = nodeElement?.querySelector('.node-title');
            if (titleElement) {
                titleElement.textContent = value;
            }
        }

        // Si se actualiza el nivel de trazabilidad, verificar lógica
        if (property === 'nivelTrazabilidad' && this.selectedNode.subtype === 'etiquetar') {
            this.checkTraceabilityLogic(this.selectedNode);
        }
    }

    checkTraceabilityLogic(nodeData) {
        if (!nodeData || nodeData.subtype !== 'etiquetar') return;

        const nivelTrazabilidad = nodeData.config.nivelTrazabilidad;
        if (nivelTrazabilidad === 'pallet') {
            const hasPicking = window.FlowWare.State.nodeList.some(n => n.subtype === 'picking');
            const hasPacking = window.FlowWare.State.nodeList.some(n => n.subtype === 'packing');

            if (hasPicking && hasPacking) {
                if (confirm("Precaución: El nivel de trazabilidad 'Pallet' en el nodo 'Generar Etiquetas' puede ser insuficiente ya que existen nodos de Picking y Packing en el workflow. ¿Desea cambiar automáticamente el nivel a 'Pallet → Caja'?")) {
                    nodeData.config.nivelTrazabilidad = 'caja';
                    // Actualizar el select en la UI si el nodo sigue seleccionado
                    if (this.selectedNode && this.selectedNode.id === nodeData.id) {
                        const nivelTrazabilidadSelect = document.getElementById('node-etiqueta-trazabilidad');
                        if (nivelTrazabilidadSelect) nivelTrazabilidadSelect.value = 'caja';
                    }
                    window.FlowWare.NotificationManager.show('ℹ️ Nivel de trazabilidad actualizado a "Pallet → Caja".', 'info');
                }
            }
        }
    }

    // Se debe llamar a checkTraceabilityLogic cuando se añade/elimina un nodo picking/packing
    // Esto se puede hacer modificando las funciones deleteNode y handleNodeDrop para que,
    // después de su operación principal, iteren sobre todos los nodos 'etiquetar' y llamen a checkTraceabilityLogic.
    // O, si un nodo 'etiquetar' está seleccionado, llamarlo para ese.
    // Por ahora, la verificación se activa al cambiar el desplegable del nodo 'etiquetar'.

    showConfigPanel() {
        const panel = document.getElementById('config-panel');
        if (panel) {
            panel.classList.add('active');
        }
    }

    hideConfigPanel() {
        const panel = document.getElementById('config-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    openConfig(nodeData) {
        this.selectNode(nodeData);
    }

    // ===== ELIMINACIÓN DE NODOS =====

    deleteNode(nodeId, isRecursiveDelete = false) {
        const nodeIndex = window.FlowWare.State.nodeList.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;

        const nodeData = window.FlowWare.State.nodeList[nodeIndex];

        // Eliminar conexiones asociadas
        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.removeConnectionsForNode(nodeId);
        }

        // Eliminar de la lista
        window.FlowWare.State.nodeList.splice(nodeIndex, 1);

        // Eliminar elemento DOM
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.remove();
        }

        // Deseleccionar si era el seleccionado
        if (this.selectedNode && this.selectedNode.id === nodeId) {
            this.deselectNode();
        }

        // Actualizar stats
        this.updateStats();

        // Mostrar empty state si no hay nodos
        if (window.FlowWare.State.nodeList.length === 0) {
            this.showEmptyState();
        }

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.NODE_DELETED, nodeData);
        }

        // Notificación (solo para la eliminación iniciada por el usuario)
        if (!isRecursiveDelete) {
            window.FlowWare.NotificationManager.show(`🗑️ Nodo "${nodeData.config.name}" eliminado`, 'info');
        }

        // Lógica de dependencia Picking/Packing
        if (!isRecursiveDelete) { // Evitar bucles infinitos si ambos se llaman recursivamente
            if (nodeData.subtype === 'picking') {
                const packingNodes = window.FlowWare.State.nodeList.filter(n => n.subtype === 'packing');
                if (packingNodes.length > 0) {
                    // Por simplicidad, eliminamos todos los nodos de packing.
                    // Una lógica más avanzada podría buscar nodos conectados o agrupados.
                    packingNodes.forEach(packingNode => {
                        window.FlowWare.NotificationManager.show(`🗑️ Nodo "${packingNode.config.name}" (Packing) eliminado automáticamente debido a la eliminación de "${nodeData.config.name}".`, 'info');
                        this.deleteNode(packingNode.id, true); // Marcar como eliminación recursiva
                    });
                }
            } else if (nodeData.subtype === 'packing') {
                const pickingNodes = window.FlowWare.State.nodeList.filter(n => n.subtype === 'picking');
                if (pickingNodes.length > 0) {
                    pickingNodes.forEach(pickingNode => {
                        window.FlowWare.NotificationManager.show(`🗑️ Nodo "${pickingNode.config.name}" (Picking) eliminado automáticamente debido a la eliminación de "${nodeData.config.name}".`, 'info');
                        this.deleteNode(pickingNode.id, true); // Marcar como eliminación recursiva
                    });
                }
            }
        }
        // Después de eliminar un nodo picking/packing, verificar la lógica de trazabilidad de los nodos etiquetar
        if (!isRecursiveDelete && (nodeData.subtype === 'picking' || nodeData.subtype === 'packing')) {
            window.FlowWare.State.nodeList.forEach(node => {
                if (node.subtype === 'etiquetar') {
                    this.checkTraceabilityLogic(node);
                }
            });
        }
    }

    deleteSelectedNode() {
        if (this.selectedNode) {
            this.deleteNode(this.selectedNode.id);
        }
    }

    // ===== EVENTOS DE TECLADO =====

    handleKeyDown(event) {
        // Eliminar nodo seleccionado
        if (event.key === 'Delete' && this.selectedNode) {
            event.preventDefault();
            this.deleteSelectedNode();
        }

        // Deseleccionar con Escape
        if (event.key === 'Escape') {
            event.preventDefault();
            this.deselectNode();
        }

        // Duplicar nodo con Ctrl+D
        if ((event.ctrlKey || event.metaKey) && event.key === 'd' && this.selectedNode) {
            event.preventDefault();
            this.duplicateNode(this.selectedNode);
        }
    }

    // ===== UTILIDADES =====

    duplicateNode(nodeData) {
        const newNode = {
            ...nodeData,
            id: 'node-' + uuid.v4(),
            x: nodeData.x + 30,
            y: nodeData.y + 30,
            config: { ...nodeData.config }
        };

        window.FlowWare.State.nodeList.push(newNode);
        this.renderNode(newNode);
        this.selectNode(newNode);
        this.updateStats();

        window.FlowWare.NotificationManager.show(`📋 Nodo duplicado`, 'success');
    }

    getNodeById(nodeId) {
        return window.FlowWare.State.nodeList.find(n => n.id === nodeId);
    }

    getNodesByType(type) {
        return window.FlowWare.State.nodeList.filter(n => n.type === type);
    }

    updateStats() {
        const nodeCount = document.getElementById('node-count');
        if (nodeCount) {
            nodeCount.textContent = `${window.FlowWare.State.nodeList.length} nodos`;
        }
    }

    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    clearAllNodes() {
        // Eliminar conexiones primero
        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.clearAllConnections();
        }

        // Eliminar elementos DOM
        const nodeElements = document.querySelectorAll('.workflow-node');
        nodeElements.forEach(element => element.remove());

        // Limpiar lista
        window.FlowWare.State.nodeList = [];

        // Deseleccionar
        this.selectedNode = null;
        window.FlowWare.State.selectedNode = null;
        this.hideConfigPanel();

        // Actualizar UI
        this.updateStats();
        this.showEmptyState();
    }

    // ===== VALIDACIONES =====

    validateWorkflow() {
        const errors = [];
        const warnings = [];

        // Verificar que hay al menos un trigger
        const triggers = this.getNodesByType('trigger');
        if (triggers.length === 0) {
            errors.push('El workflow debe tener al menos un disparador');
        }

        // Verificar nodos sin conexiones
        const nodesWithoutConnections = window.FlowWare.State.nodeList.filter(node => {
            const hasInputConnection = window.FlowWare.State.connectionList.some(conn => conn.to === node.id);
            const hasOutputConnection = window.FlowWare.State.connectionList.some(conn => conn.from === node.id);
            return !hasInputConnection && !hasOutputConnection && node.type !== 'trigger';
        });

        if (nodesWithoutConnections.length > 0) {
            warnings.push(`${nodesWithoutConnections.length} nodos sin conexiones`);
        }

        // Verificar nodos huérfanos (sin entrada excepto triggers)
        const orphanNodes = window.FlowWare.State.nodeList.filter(node => {
            const hasInputConnection = window.FlowWare.State.connectionList.some(conn => conn.to === node.id);
            return !hasInputConnection && node.type !== 'trigger';
        });

        if (orphanNodes.length > 0) {
            warnings.push(`${orphanNodes.length} nodos sin entrada`);
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    // ===== CLEANUP =====

    destroy() {
        // Limpiar event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);

        // Limpiar eventos del EventBus
        window.FlowWare.EventBus.off('dropNode', this.handleNodeDrop);

        // Limpiar estado
        this.clearAllNodes();
        window.FlowWare.State.nodes = null;
    }
}

// Crear instancia global
window.NodeManager = NodeManager;