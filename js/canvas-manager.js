// ===== CANVAS MANAGER =====
class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isSpacePressed = false;
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateZoomDisplay();
        window.FlowWare.State.canvas = this;
    }

    setupEventListeners() {
        // Zoom con rueda del mouse
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Pan con tecla espacio
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Pan con mouse
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Drag and drop de nodos
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));

        // Redimensionar ventana
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleWheel(event) {
        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
        const newScale = window.FlowWare.Utils.Math.clamp(
            this.scale * zoomFactor,
            window.FlowWare.CANVAS.ZOOM_MIN,
            window.FlowWare.CANVAS.ZOOM_MAX
        );

        if (newScale !== this.scale) {
            const scaleFactor = newScale / this.scale;

            // Mantener zoom centrado en posición del mouse
            this.translateX = mouseX - scaleFactor * (mouseX - this.translateX);
            this.translateY = mouseY - scaleFactor * (mouseY - this.translateY);
            this.scale = newScale;

            this.updateTransform();
            this.updateZoomDisplay();

            if (window.FlowWare && window.FlowWare.EventBus) {
                window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.CANVAS_ZOOMED, {
                    scale: this.scale,
                    translateX: this.translateX,
                    translateY: this.translateY
                });
            }
        }
    }

    handleKeyDown(event) {
        if (event.code === 'Space' && !event.repeat) {
            event.preventDefault();
            this.isSpacePressed = true;
            this.canvas.style.cursor = 'grab';
        }
    }

    handleKeyUp(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            this.isSpacePressed = false;
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseDown(event) {
        if (this.isSpacePressed && event.button === 0) {
            event.preventDefault();
            this.isPanning = true;
            this.lastPanPoint = { x: event.clientX, y: event.clientY };
            this.canvas.style.cursor = 'grabbing';
            window.FlowWare.State.isPanning = true;
        }
    }

    handleMouseMove(event) {
        if (this.isPanning && this.isSpacePressed) {
            event.preventDefault();

            const deltaX = event.clientX - this.lastPanPoint.x;
            const deltaY = event.clientY - this.lastPanPoint.y;

            this.translateX += deltaX;
            this.translateY += deltaY;

            this.lastPanPoint = { x: event.clientX, y: event.clientY };

            window.FlowWare.Utils.Performance.scheduleUpdate(() => {
                this.updateTransform();
            });

            if (window.FlowWare && window.FlowWare.EventBus) {
                window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.CANVAS_PANNED, {
                    translateX: this.translateX,
                    translateY: this.translateY
                });
            }
        }
    }

    handleMouseUp(event) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.isSpacePressed ? 'grab' : 'default';
            window.FlowWare.State.isPanning = false;
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(event) {
        event.preventDefault();

        try {
            const nodeData = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (nodeData && nodeData.type && nodeData.subtype) {
                const canvasCoords = this.screenToCanvas(event.clientX, event.clientY);

                window.FlowWare.EventBus.emit('dropNode', {
                    ...nodeData,
                    x: canvasCoords.x,
                    y: canvasCoords.y
                });
            }
        } catch (error) {
            console.error('Error al procesar drop:', error);
        }
    }

    handleResize() {
        window.FlowWare.Utils.Performance.debounce(() => {
            this.updateTransform();
        }, 100)();
    }

    // ===== MÉTODOS DE TRANSFORMACIÓN =====

    updateTransform() {
        // Actualizar todos los nodos
        const nodes = document.querySelectorAll('.workflow-node');
        nodes.forEach(nodeElement => {
            const nodeId = nodeElement.id;
            const nodeData = window.FlowWare.State.nodeList.find(n => n.id === nodeId);
            if (nodeData) {
                this.updateNodeTransform(nodeElement, nodeData);
            }
        });

        // Actualizar todas las conexiones
        if (window.FlowWare.State.connections) {
            window.FlowWare.State.connections.updateAllConnections();
        }
    }

    updateNodeTransform(nodeElement, nodeData) {
        const screenCoords = this.canvasToScreen(nodeData.x, nodeData.y);

        // Usar transform para mejor performance
        nodeElement.style.transform = `translate(${screenCoords.x}px, ${screenCoords.y}px) scale(${this.scale})`;
        nodeElement.style.transformOrigin = 'top left';
    }

    // ===== CONVERSIONES DE COORDENADAS =====

    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left - this.translateX) / this.scale,
            y: (screenY - rect.top - this.translateY) / this.scale
        };
    }

    canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * this.scale + this.translateX,
            y: canvasY * this.scale + this.translateY
        };
    }

    getCanvasRect() {
        return this.canvas.getBoundingClientRect();
    }

    // ===== MÉTODOS DE ZOOM =====

    zoomIn() {
        const newScale = window.FlowWare.Utils.Math.clamp(
            this.scale + window.FlowWare.CANVAS.ZOOM_STEP,
            window.FlowWare.CANVAS.ZOOM_MIN,
            window.FlowWare.CANVAS.ZOOM_MAX
        );

        if (newScale !== this.scale) {
            this.zoomToPoint(newScale,
                this.canvas.clientWidth / 2,
                this.canvas.clientHeight / 2
            );
        }
    }

    zoomOut() {
        const newScale = window.FlowWare.Utils.Math.clamp(
            this.scale - window.FlowWare.CANVAS.ZOOM_STEP,
            window.FlowWare.CANVAS.ZOOM_MIN,
            window.FlowWare.CANVAS.ZOOM_MAX
        );

        if (newScale !== this.scale) {
            this.zoomToPoint(newScale,
                this.canvas.clientWidth / 2,
                this.canvas.clientHeight / 2
            );
        }
    }

    resetZoom() {
        this.zoomToPoint(1,
            this.canvas.clientWidth / 2,
            this.canvas.clientHeight / 2
        );
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
        this.updateZoomDisplay();
    }

    zoomToPoint(newScale, pointX, pointY) {
        const scaleFactor = newScale / this.scale;

        this.translateX = pointX - scaleFactor * (pointX - this.translateX);
        this.translateY = pointY - scaleFactor * (pointY - this.translateY);
        this.scale = newScale;

        this.updateTransform();
        this.updateZoomDisplay();

        if (window.FlowWare && window.FlowWare.EventBus) {
            window.FlowWare.EventBus.emit(window.FlowWare.EVENTS.CANVAS_ZOOMED, {
                scale: this.scale,
                translateX: this.translateX,
                translateY: this.translateY
            });
        }
    }

    // ===== MÉTODOS DE FITTING =====

    fitToNodes() {
        if (window.FlowWare.State.nodeList.length === 0) return;

        // Calcular bounds de todos los nodos
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        window.FlowWare.State.nodeList.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + window.FlowWare.NODES.WIDTH);
            maxY = Math.max(maxY, node.y + window.FlowWare.NODES.HEIGHT);
        });

        // Agregar padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // Calcular escala para que todo sea visible
        const scaleX = this.canvas.clientWidth / contentWidth;
        const scaleY = this.canvas.clientHeight / contentHeight;
        const targetScale = Math.min(scaleX, scaleY, 1); // No hacer zoom in más de 100%

        // Centrar contenido
        this.scale = targetScale;
        this.translateX = (this.canvas.clientWidth - contentWidth * targetScale) / 2 - minX * targetScale;
        this.translateY = (this.canvas.clientHeight - contentHeight * targetScale) / 2 - minY * targetScale;

        this.updateTransform();
        this.updateZoomDisplay();
    }

    centerCanvas() {
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    }

    // ===== UTILIDADES =====

    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement) {
            zoomElement.textContent = Math.round(this.scale * 100) + '%';
        }

        // Actualizar estado global si existe
        if (window.FlowWare && window.FlowWare.State) {
            window.FlowWare.State.zoom = this.scale;
            window.FlowWare.State.panX = this.translateX;
            window.FlowWare.State.panY = this.translateY;
        }
    }

    getViewportBounds() {
        const topLeft = this.screenToCanvas(0, 0);
        const bottomRight = this.screenToCanvas(this.canvas.clientWidth, this.canvas.clientHeight);

        return {
            left: topLeft.x,
            top: topLeft.y,
            right: bottomRight.x,
            bottom: bottomRight.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }

    isPointVisible(x, y) {
        const bounds = this.getViewportBounds();
        return x >= bounds.left && x <= bounds.right &&
            y >= bounds.top && y <= bounds.bottom;
    }

    // ===== COORDENADAS DE PUERTOS =====

    getPortScreenCoordinates(nodeId, portType) {
        const nodeData = window.FlowWare.State.nodeList.find(n => n.id === nodeId);
        if (!nodeData) return null;

        const nodeScreenCoords = this.canvasToScreen(nodeData.x, nodeData.y);
        const portOffsetY = (window.FlowWare.NODES.HEIGHT - 20) * this.scale; // Puerto en la parte inferior

        if (portType === 'output') {
            return {
                x: nodeScreenCoords.x + (window.FlowWare.NODES.WIDTH - 8) * this.scale,
                y: nodeScreenCoords.y + portOffsetY
            };
        } else { // input
            return {
                x: nodeScreenCoords.x + 8 * this.scale,
                y: nodeScreenCoords.y + portOffsetY
            };
        }
    }

    // ===== CLEANUP =====

    destroy() {
        // Remover event listeners
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('dragover', this.handleDragOver);
        this.canvas.removeEventListener('drop', this.handleDrop);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);

        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('resize', this.handleResize);

        window.FlowWare.State.canvas = null;
    }
}

// Crear instancia global
window.CanvasManager = CanvasManager;