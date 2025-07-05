// ===== CONFIGURACIÓN GLOBAL =====
window.FlowWare = {
    // Configuración del canvas
    CANVAS: {
        ZOOM_MIN: 0.3,
        ZOOM_MAX: 2.5,
        ZOOM_STEP: 0.1,
        GRID_SIZE: 20,
        PAN_SPEED: 1
    },

    // Configuración de nodos
    NODES: {
        WIDTH: 180,
        HEIGHT: 100,
        MIN_HEIGHT: 80,
        SNAP_THRESHOLD: 10
    },

    // Configuración de conexiones
    CONNECTIONS: {
        CURVE_STRENGTH: 0.5,
        STROKE_WIDTH: 2.5,
        HOVER_WIDTH: 3.5,
        TEMP_DASH: '6,4'
    },

    // Configuración de puertos
    PORTS: {
        SIZE: 16,
        HOVER_SCALE: 1.3,
        CONNECTING_SCALE: 1.4,
        TARGET_SCALE: 1.5,
        HIT_AREA: 24
    },

    // Tipos de nodos disponibles
    NODE_TYPES: {
        trigger: {
            color: '#ff9d00',
            bgColor: 'rgba(255, 157, 0, 0.1)',
            borderColor: 'rgba(255, 157, 0, 0.3)',
            subtypes: {
                'entrada': { icon: '📦', name: 'Orden de Entrada', desc: 'Productos que llegan' },
                'salida': { icon: '🚛', name: 'Orden de Salida', desc: 'Productos que salen' }
            }
        },
        action: {
            color: '#0c2a4f',
            bgColor: 'rgba(12, 42, 79, 0.1)',
            borderColor: 'rgba(12, 42, 79, 0.3)',
            subtypes: {
                'recepcion': { icon: '📥', name: 'Recepción', desc: 'Recibir productos' },
                'verificar-stock': { icon: '📊', name: 'Verificar Stock', desc: 'Revisar inventario' },
                'almacenaje': { icon: '🏪', name: 'Almacenaje', desc: 'Almacenar productos' },
                'etiquetar': { icon: '🏷️', name: 'Generar Etiqueta', desc: 'Código de barras' },
                'reabastecer': { icon: '📈', name: 'Reabastecer', desc: 'Reponer inventario' },
                'picking': { icon: '🔍', name: 'Picking', desc: 'Recolectar productos' },
                'packing': { icon: '📦', name: 'Packing', desc: 'Empacar productos' },
                'mover-a': { icon: '📍', name: 'Mover a', desc: 'Reubicar productos' },
                'embarque': { icon: '🚚', name: 'Embarque', desc: 'Cargar vehículo' },
                'envio': { icon: '🚛', name: 'Envío', desc: 'Despachar productos' }
            }
        },
        condition: {
            color: '#1a4480',
            bgColor: 'rgba(26, 68, 128, 0.1)',
            borderColor: 'rgba(26, 68, 128, 0.3)',
            subtypes: {
                'stock-disponible': { icon: '📈', name: 'Stock Disponible', desc: 'Verificar cantidad' },
                'prioridad': { icon: '⭐', name: 'Prioridad Alta', desc: 'Pedidos urgentes' },
                'categoria': { icon: '🏷️', name: 'Por Categoría', desc: 'Filtrar por tipo' },
                'ubicacion': { icon: '📍', name: 'Por Ubicación', desc: 'Verificar zona' }
            }
        },
        notification: {
            color: '#ff9d00',
            bgColor: 'rgba(255, 157, 0, 0.1)',
            borderColor: 'rgba(255, 157, 0, 0.3)',
            subtypes: {
                'email': { icon: '📧', name: 'Enviar Email', desc: 'Notificación por correo' },
                'sistema': { icon: '🔔', name: 'Alerta Sistema', desc: 'Notificación interna' },
                'sms': { icon: '📱', name: 'Enviar SMS', desc: 'Mensaje de texto' }
            }
        }
    },

    // Eventos personalizados
    EVENTS: {
        NODE_CREATED: 'nodeCreated',
        NODE_SELECTED: 'nodeSelected',
        NODE_DESELECTED: 'nodeDeselected',
        NODE_MOVED: 'nodeMoved',
        NODE_DELETED: 'nodeDeleted',
        CONNECTION_CREATED: 'connectionCreated',
        CONNECTION_DELETED: 'connectionDeleted',
        CANVAS_ZOOMED: 'canvasZoomed',
        CANVAS_PANNED: 'canvasPanned'
    },

    // Configuración de animaciones
    ANIMATIONS: {
        DURATION_FAST: 200,
        DURATION_NORMAL: 300,
        DURATION_SLOW: 500,
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },

    // Configuración de notificaciones
    NOTIFICATIONS: {
        DURATION: 3000,
        MAX_VISIBLE: 3,
        POSITION: 'top-right'
    }
};

// ===== ESTADO GLOBAL =====
window.FlowWare.State = {
    // Managers
    canvas: null,
    nodes: null,
    connections: null,

    // Estado del canvas
    zoom: 1,
    panX: 0,
    panY: 0,

    // Estado de interacción
    isDragging: false,
    isConnecting: false,
    isPanning: false,

    // Selección actual
    selectedNode: null,

    // Datos
    nodeList: [],
    connectionList: [],

    // Performance
    animationFrame: null,
    updateQueue: []
  };