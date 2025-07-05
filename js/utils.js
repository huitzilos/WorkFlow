// ===== SISTEMA DE EVENTOS =====
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en event listener para ${event}:`, error);
                }
            });
        }
    }

    clear() {
        this.listeners.clear();
    }
}

// Instancia global del event bus
window.FlowWare = window.FlowWare || {};
window.FlowWare.EventBus = new EventBus();

// ===== UTILIDADES MATEMÁTICAS =====
const MathUtils = {
    // Limitar un valor entre min y max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Distancia entre dos puntos
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Interpolar entre dos valores
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    // Convertir grados a radianes
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    // Redondear a múltiplo más cercano
    roundToMultiple(value, multiple) {
        return Math.round(value / multiple) * multiple;
    },

    // Verificar si un punto está dentro de un rectángulo
    pointInRect(point, rect) {
        return point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.y >= rect.y &&
            point.y <= rect.y + rect.height;
    }
};

// ===== UTILIDADES DOM =====
const DOMUtils = {
    // Crear elemento con clases y atributos
    createElement(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.className) {
            element.className = options.className;
        }

        if (options.id) {
            element.id = options.id;
        }

        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }

        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (options.styles) {
            Object.assign(element.style, options.styles);
        }

        return element;
    },

    // Obtener coordenadas relativas al elemento
    getRelativeCoordinates(event, element) {
        const rect = element.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    // Animar elemento con CSS
    animate(element, keyframes, options = {}) {
        const defaultOptions = {
            duration: 300,
            easing: 'ease',
            fill: 'forwards'
        };

        return element.animate(keyframes, { ...defaultOptions, ...options });
    },

    // Verificar si elemento está visible
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }
};

// ===== UTILIDADES DE PERFORMANCE =====
const PerformanceUtils = {
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Debounce function
    debounce(func, delay) {
        let timeoutId;
        return function () {
            const args = arguments;
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        };
    },

    // Programar actualización en el siguiente frame
    scheduleUpdate(callback) {
        if (window.FlowWare.State.animationFrame) {
            cancelAnimationFrame(window.FlowWare.State.animationFrame);
        }

        window.FlowWare.State.animationFrame = requestAnimationFrame(() => {
            callback();
            window.FlowWare.State.animationFrame = null;
        });
    },

    // Batch updates para mejor performance
    batchUpdate(updates) {
        this.scheduleUpdate(() => {
            updates.forEach(update => update());
        });
    }
};

// ===== UTILIDADES DE VALIDACIÓN =====
const ValidationUtils = {
    // Validar estructura de nodo
    isValidNode(node) {
        return node &&
            typeof node.id === 'string' &&
            typeof node.type === 'string' &&
            typeof node.x === 'number' &&
            typeof node.y === 'number';
    },

    // Validar estructura de conexión
    isValidConnection(connection) {
        return connection &&
            typeof connection.id === 'string' &&
            typeof connection.from === 'string' &&
            typeof connection.to === 'string' &&
            connection.from !== connection.to;
    },

    // Validar que no haya ciclos en las conexiones
    hasCircularDependency(connections, fromNode, toNode) {
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingConnections = connections.filter(c => c.from === nodeId);
            for (const conn of outgoingConnections) {
                if (hasCycle(conn.to)) return true;
            }

            recursionStack.delete(nodeId);
            return false;
        };

        // Crear conexión temporal para verificar
        const tempConnections = [...connections, { from: fromNode, to: toNode }];
        return hasCycle(fromNode);
    }
};

// ===== SISTEMA DE NOTIFICACIONES =====
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
    }

    createContainer() {
        const container = DOMUtils.createElement('div', {
            className: 'notifications-container',
            styles: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '1000',
                pointerEvents: 'none'
            }
        });
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = DOMUtils.createElement('div', {
            className: `notification ${type}`,
            innerHTML: message
        });

        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-remover
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        // Limitar número de notificaciones visibles
        if (this.notifications.length > window.FlowWare.NOTIFICATIONS.MAX_VISIBLE) {
            this.remove(this.notifications[0]);
        }
    }

    remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
            notification.classList.remove('show');

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    clear() {
        this.notifications.forEach(notification => this.remove(notification));
    }
}

// ===== UTILIDADES DE GEOMETRÍA PARA CONEXIONES =====
const GeometryUtils = {
    // Crear path SVG para conexión con curva Bézier
    createConnectionPath(start, end, curvature = 0.5) {
        const dx = end.x - start.x;
        const curve = Math.abs(dx) * curvature;

        return `M ${start.x},${start.y} C ${start.x + curve},${start.y} ${end.x - curve},${end.y} ${end.x},${end.y}`;
    },

    // Calcular punto en curva Bézier
    getPointOnBezier(t, p0, p1, p2, p3) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    },

    // Obtener bounds de un elemento
    getElementBounds(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        };
    }
};

// ===== GESTIÓN DE ESTADO LOCAL =====
const StateManager = {
    save(key, data) {
        try {
            localStorage.setItem(`flowware_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`flowware_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn('No se pudo cargar de localStorage:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(`flowware_${key}`);
        } catch (error) {
            console.warn('No se pudo eliminar de localStorage:', error);
        }
    }
};

// Exportar utilidades al namespace global
window.FlowWare = window.FlowWare || {};
window.FlowWare.Utils = {
    Math: MathUtils,
    DOM: DOMUtils,
    Performance: PerformanceUtils,
    Validation: ValidationUtils,
    Geometry: GeometryUtils,
    State: StateManager
};

window.FlowWare.NotificationManager = new NotificationManager();