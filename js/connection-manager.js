// ===== CONNECTION MANAGER =====
class ConnectionManager {
    constructor() {
        this.isConnecting = false;
        this.startNode = null;
        this.targetNode = null;
        this.tempConnection = null;
        this.svg = document.getElementById('connections-svg');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        window.FlowWare.State.connections = this;
        window.FlowWare.State.connectionList = [];
    }

    setupEventListeners() {
        // Mouse events globales para conexiones temporales
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Escuchar cambios en el canvas (con verificación defensiva)
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.on(window.FlowWare.EVENTS.CANVAS_ZOOMED, this.updateAllConnections.bind(this));
            window.FlowWare.EventBus.on(window.FlowWare.EVENTS.CANVAS_PANNED, this.updateAllConnections.bind(this));
            window.FlowWare.EventBus.on(window.FlowWare.EVENTS.NODE_MOVED, this.handleNodeMoved.bind(this));
        } else {
            console.warn('EventBus no disponible, configurando listeners después...');
            // Reintentar después de un tiempo
            setTimeout(() => {
                if (window.FlowWare && window.FlowWare.EventBus) {
                    window.FlowWare.EventBus.on(window.FlowWare.EVENTS.CANVAS_ZOOMED, this.updateAllConnections.bind(this));
                    window.FlowWare.EventBus.on(window.FlowWare.EVENTS.CANVAS_PANNED, this.updateAllConnections.bind(this));
                    window.FlowWare.EventBus.on(window.FlowWare.EVENTS.NODE_MOVED, this.handleNodeMoved.bind(this));
                    console.log('EventBus listeners configurados después');
                }
            }, 200);
        }
    }

    // ===== INICIO DE CONEXIÓN =====

    startConnection(nodeData, portType, portElement, event) {
        if (this.isConnecting) return;

        this.isConnecting = true;
        this.startNode = {
            node: nodeData,
            portType: portType,
            element: portElement
        };

        // Marcar puerto como conectando
        portElement.classList.add('connecting');
        portElement.style.transform = `scale(${window.FlowWare.PORTS.CONNECTING_SCALE})`;

        // Crear línea temporal
        this.createTempConnection(event);

        // Cambiar cursor
        document.body.style.cursor = 'crosshair';

        console.log('Iniciando conexión desde:', nodeData.id, portType);
    }

    createTempConnection(event) {
        this.tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempConnection.classList.add('temp-connection');
        this.svg.appendChild(this.tempConnection);

        this.updateTempConnection(event);
    }

    updateTempConnection(event) {
        if (!this.tempConnection || !this.startNode) return;

        const startCoords = this.getPortScreenCoordinates(this.startNode.node.id, this.startNode.portType);
        if (!startCoords) return;

        const svgRect = this.svg.getBoundingClientRect();
        const endCoords = {
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top
        };

        const path = window.FlowWare.Utils.Geometry.createConnectionPath(
            startCoords,
            endCoords,
            window.FlowWare.CONNECTIONS.CURVE_STRENGTH
        );

        this.tempConnection.setAttribute('d', path);
    }

    // ===== TARGET PORT =====

    setTargetPort(nodeData, portType, portElement) {
        if (!this.isConnecting || !this.startNode) return;

        // Solo permitir conexiones output -> input
        if (this.startNode.portType === 'output' && portType === 'input' &&
            this.startNode.node.id !== nodeData.id) {

            // Verificar si ya existe la conexión
            if (this.connectionExists(this.startNode.node.id, nodeData.id)) {
                return;
            }

            this.targetNode = {
                node: nodeData,
                portType: portType,
                element: portElement
            };

            // Efecto visual
            portElement.classList.add('valid-target');
            portElement.style.transform = `scale(${window.FlowWare.PORTS.TARGET_SCALE})`;

            console.log('Target port válido:', nodeData.id);
        }
    }

    clearTargetPort() {
        if (this.targetNode) {
            this.targetNode.element.classList.remove('valid-target');
            this.targetNode.element.style.transform = '';
            this.targetNode = null;
        }
    }

    // ===== EVENTOS DE MOUSE =====

    handleMouseMove(event) {
        if (this.isConnecting && this.tempConnection) {
            window.FlowWare.Utils.Performance.scheduleUpdate(() => {
                this.updateTempConnection(event);
            });
        }
    }

    handleMouseUp(event) {
        if (this.isConnecting) {
            // Si hay un target válido, crear conexión
            if (this.targetNode) {
                this.createConnection(this.startNode.node.id, this.targetNode.node.id);
            }

            this.cancelConnection();
        }
    }

    // ===== CREACIÓN DE CONEXIONES =====

    createConnection(fromNodeId, toNodeId) {
        // Validaciones
        if (fromNodeId === toNodeId) return;
        if (this.connectionExists(fromNodeId, toNodeId)) return;

        // Verificar ciclos
        if (window.FlowWare.Utils.Validation.hasCircularDependency(
            window.FlowWare.State.connectionList, fromNodeId, toNodeId)) {
            window.FlowWare.NotificationManager.show('❌ No se pueden crear ciclos en el workflow', 'error');
            return;
        }

        const connectionId = 'conn-' + uuid.v4();
        const connection = {
            id: connectionId,
            from: fromNodeId,
            to: toNodeId,
            created: Date.now()
        };

        // Validar estructura
        if (!window.FlowWare.Utils.Validation.isValidConnection(connection)) {
            console.error('Conexión inválida:', connection);
            return;
        }

        // Agregar a la lista
        window.FlowWare.State.connectionList.push(connection);

        // Renderizar conexión
        this.renderConnection(connection);

        // Actualizar stats
        this.updateStats();

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.CONNECTION_CREATED, connection);
        }

        // Notificación
        const fromNode = window.FlowWare.State.nodes.getNodeById(fromNodeId);
        const toNode = window.FlowWare.State.nodes.getNodeById(toNodeId);
        window.FlowWare.NotificationManager.show(
            `🔗 Conectado: ${fromNode?.config.name} → ${toNode?.config.name}`,
            'success'
        );

        console.log('Conexión creada:', connection);
    }

    renderConnection(connection) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.id = connection.id;
        path.classList.add('connection-path');

        // Eventos de la conexión
        path.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            if (confirm('¿Eliminar esta conexión?')) {
                this.removeConnection(connection.id);
            }
        });

        path.addEventListener('mouseenter', () => {
            path.style.strokeWidth = window.FlowWare.CONNECTIONS.HOVER_WIDTH;
        });

        path.addEventListener('mouseleave', () => {
            path.style.strokeWidth = window.FlowWare.CONNECTIONS.STROKE_WIDTH;
        });

        this.svg.appendChild(path);
        this.updateConnection(connection);
    }

    updateConnection(connection) {
        const pathElement = document.getElementById(connection.id);
        if (!pathElement) return;

        const fromCoords = this.getPortScreenCoordinates(connection.from, 'output');
        const toCoords = this.getPortScreenCoordinates(connection.to, 'input');

        if (fromCoords && toCoords) {
            const path = window.FlowWare.Utils.Geometry.createConnectionPath(
                fromCoords,
                toCoords,
                window.FlowWare.CONNECTIONS.CURVE_STRENGTH
            );
            pathElement.setAttribute('d', path);
        } else {
            // Si no se pueden obtener las coordenadas, ocultar temporalmente
            pathElement.style.display = 'none';

            // Intentar actualizar en el siguiente frame
            requestAnimationFrame(() => {
                if (pathElement) {
                    pathElement.style.display = 'block';
                    this.updateConnection(connection);
                }
            });
        }
    }

    // ===== ACTUALIZACIÓN OPTIMIZADA =====

    updateConnectionsForNode(nodeId) {
        const relatedConnections = window.FlowWare.State.connectionList.filter(c =>
            c.from === nodeId || c.to === nodeId
        );

        relatedConnections.forEach(connection => {
            this.updateConnection(connection);
        });
    }

    updateAllConnections() {
        window.FlowWare.State.connectionList.forEach(connection => {
            this.updateConnection(connection);
        });
    }

    handleNodeMoved(nodeData) {
        // Solo actualizar conexiones del nodo que se movió
        this.updateConnectionsForNode(nodeData.id);
    }

    // ===== COORDENADAS DE PUERTOS =====

    getPortScreenCoordinates(nodeId, portType) {
        // Usar el método del CanvasManager que ya tiene en cuenta zoom y pan
        return window.FlowWare.State.canvas.getPortScreenCoordinates(nodeId, portType);
    }

    // ===== CANCELACIÓN DE CONEXIÓN =====

    cancelConnection() {
        this.isConnecting = false;

        // Restaurar cursor
        document.body.style.cursor = 'default';

        // Limpiar elementos visuales
        if (this.startNode) {
            this.startNode.element.classList.remove('connecting');
            this.startNode.element.style.transform = '';
        }

        if (this.targetNode) {
            this.targetNode.element.classList.remove('valid-target');
            this.targetNode.element.style.transform = '';
        }

        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }

        this.startNode = null;
        this.targetNode = null;

        console.log('Conexión cancelada');
    }

    // ===== ELIMINACIÓN DE CONEXIONES =====

    removeConnection(connectionId) {
        const connectionIndex = window.FlowWare.State.connectionList.findIndex(c => c.id === connectionId);
        if (connectionIndex === -1) return;

        const connection = window.FlowWare.State.connectionList[connectionIndex];

        // Eliminar de la lista
        window.FlowWare.State.connectionList.splice(connectionIndex, 1);

        // Eliminar elemento DOM
        const pathElement = document.getElementById(connectionId);
        if (pathElement) {
            pathElement.remove();
        }

        // Actualizar stats
        this.updateStats();

        // Emitir evento
        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.CONNECTION_DELETED, connection);
        }

        // Notificación
        window.FlowWare.NotificationManager.show('🔗 Conexión eliminada', 'info');
    }

    removeConnectionsForNode(nodeId) {
        const connectionsToRemove = window.FlowWare.State.connectionList.filter(c =>
            c.from === nodeId || c.to === nodeId
        );

        connectionsToRemove.forEach(connection => {
            this.removeConnection(connection.id);
        });
    }

    clearAllConnections() {
        // Eliminar elementos DOM
        const pathElements = this.svg.querySelectorAll('.connection-path, .temp-connection');
        pathElements.forEach(element => element.remove());

        // Limpiar lista
        window.FlowWare.State.connectionList = [];

        // Actualizar stats
        this.updateStats();
    }

    // ===== UTILIDADES =====

    connectionExists(fromNodeId, toNodeId) {
        return window.FlowWare.State.connectionList.some(c =>
            c.from === fromNodeId && c.to === toNodeId
        );
    }

    getConnectionsForNode(nodeId) {
        return window.FlowWare.State.connectionList.filter(c =>
            c.from === nodeId || c.to === nodeId
        );
    }

    getInputConnections(nodeId) {
        return window.FlowWare.State.connectionList.filter(c => c.to === nodeId);
    }

    getOutputConnections(nodeId) {
        return window.FlowWare.State.connectionList.filter(c => c.from === nodeId);
    }

    updateStats() {
        const connectionCount = document.getElementById('connection-count');
        if (connectionCount) {
            connectionCount.textContent = `${window.FlowWare.State.connectionList.length} conexiones`;
        }
    }

    // ===== VALIDACIONES =====

    validateConnections() {
        const errors = [];
        const warnings = [];

        // Verificar conexiones válidas
        const invalidConnections = window.FlowWare.State.connectionList.filter(conn => {
            const fromNode = window.FlowWare.State.nodes.getNodeById(conn.from);
            const toNode = window.FlowWare.State.nodes.getNodeById(conn.to);
            return !fromNode || !toNode;
        });

        if (invalidConnections.length > 0) {
            errors.push(`${invalidConnections.length} conexiones inválidas (nodos eliminados)`);
        }

        // Verificar ciclos
        const hasCycles = this.detectCycles();
        if (hasCycles.length > 0) {
            errors.push(`Ciclos detectados en el workflow`);
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    detectCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const dfs = (nodeId, path = []) => {
            if (recursionStack.has(nodeId)) {
                cycles.push([...path, nodeId]);
                return;
            }

            if (visited.has(nodeId)) return;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingConnections = this.getOutputConnections(nodeId);
            for (const conn of outgoingConnections) {
                dfs(conn.to, [...path, nodeId]);
            }

            recursionStack.delete(nodeId);
        };

        // Verificar desde cada nodo trigger
        const triggers = window.FlowWare.State.nodes.getNodesByType('trigger');
        triggers.forEach(trigger => dfs(trigger.id));

        return cycles;
    }

    // ===== CLEANUP =====

    destroy() {
        // Cancelar conexión en progreso
        this.cancelConnection();

        // Limpiar event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        // Limpiar eventos del EventBus
        window.FlowWare.EventBus.off(window.FlowWare.EVENTS.CANVAS_ZOOMED, this.updateAllConnections);
        window.FlowWare.EventBus.off(window.FlowWare.EVENTS.CANVAS_PANNED, this.updateAllConnections);
        window.FlowWare.EventBus.off(window.FlowWare.EVENTS.NODE_MOVED, this.handleNodeMoved);

        // Limpiar conexiones
        this.clearAllConnections();

        window.FlowWare.State.connections = null;
    }
}

// Crear instancia global
window.ConnectionManager = ConnectionManager;