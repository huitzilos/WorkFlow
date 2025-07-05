// ===== CONFIGURACIÓN GLOBAL =====
window.FlowWare = {
    // Tipos de nodos disponibles (usados por el Wizard para las paletas de workflow)
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

    // Eventos personalizados (se pueden mantener si el wizard los usa, o simplificar/eliminar)
    // Por ahora, se dejan por si alguna notificación o lógica futura los necesita.
    // Si no, se pueden eliminar para mayor limpieza.
    EVENTS: {
        // Eventos del wizard podrían ir aquí si es necesario
        WIZARD_STEP_CHANGED: 'wizardStepChanged',
        WIZARD_COMPLETED: 'wizardCompleted',
        // Mantener algunos genéricos por si acaso
        CONFIG_UPDATED: 'configUpdated'
    },

    // Configuración de animaciones (puede ser útil para transiciones en el wizard)
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
    // El estado global ahora se manejará principalmente a través de localStorage
    // y las propiedades internas del WizardManager.
    // Se puede mantener este objeto window.FlowWare.State si alguna utilidad general
    // o el NotificationManager lo esperan, pero su contenido específico del canvas se ha ido.
    wizardDataLoaded: false // Ejemplo de un estado global que podría ser útil
  };