// js/wizard-manager.js (VERSIÓN ESQUELETO PARA DEPURAR)
console.log("wizard-manager.js: Script start parsing...");

class WizardManager {
    constructor() {
        console.log("WizardManager CONSTRUCTOR CALLED (Skeleton Version)");

        this.wizardElement = document.getElementById('config-wizard');
        this.closeWizardBtn = document.getElementById('close-wizard-btn');
        this.showWizardBtn = document.getElementById('show-wizard-btn');
        // ... otros elementos básicos del wizard si son necesarios para initDisplayLogic

        if (!this.wizardElement) {
            console.error("WizardManager Skeleton: #config-wizard element NOT FOUND! Cannot proceed with UI logic.");
        } else {
            console.log("WizardManager Skeleton: #config-wizard element found.");
            // Configurar listeners básicos para mostrar/ocultar el wizard si los botones existen
            if (this.showWizardBtn) {
                this.showWizardBtn.addEventListener('click', () => this.showWizard());
            }
            if (this.closeWizardBtn) {
                 this.closeWizardBtn.addEventListener('click', () => this.hideWizard());
            }
        }

        window.FlowWare = window.FlowWare || {};
        window.FlowWare.WizardManager = this; // Asignación global

        // Llamar a la lógica de visualización inicial desde aquí
        // Asegurarse de que las dependencias para initDisplayLogic (FlowWare.Utils) estén listas.
        // app.js ya verifica esto antes de instanciar WizardManager.
        this.initDisplayLogic();
    }

    initDisplayLogic() {
        console.log("WizardManager Skeleton: initDisplayLogic() CALLED.");
        if (!window.FlowWare || !window.FlowWare.Utils || !window.FlowWare.Utils.State) {
             console.error("WizardManager Skeleton: FlowWare.Utils.State is not available in initDisplayLogic. Cannot determine wizard completion state.");
             const msgContainer = document.getElementById('initial-config-message');
             if (msgContainer) {
                msgContainer.innerHTML = "<p style='color:red;'>Error: Dependencias de FlowWare.Utils no cargadas. Wizard no puede continuar.</p>";
                msgContainer.style.display = 'flex';
             }
             if (this.wizardElement) this.wizardElement.style.display = 'none'; // Ocultar wizard si hay error
             return;
        }

        const wizardCompleted = window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted');
        const initialConfigMessage = document.getElementById('initial-config-message');

        if (!wizardCompleted) {
            console.log("WizardManager Skeleton: Wizard not completed, attempting to show wizard.");
            this.showWizard();
        } else {
            console.log("WizardManager Skeleton: Wizard completed, showing message.");
            if (initialConfigMessage) initialConfigMessage.style.display = 'flex';
            this.hideWizard();
        }
    }

    showWizard() {
        console.log("WizardManager Skeleton: showWizard() CALLED");
        if (this.wizardElement) {
            this.wizardElement.classList.add('active');
            // Ocultar el mensaje de "configuración completada" si se muestra el wizard
            const initialConfigMessage = document.getElementById('initial-config-message');
            if (initialConfigMessage) {
                initialConfigMessage.style.display = 'none';
            }
        } else {
            console.error("WizardManager Skeleton: Cannot show wizard, #config-wizard element not found.");
        }
    }

    hideWizard() {
        console.log("WizardManager Skeleton: hideWizard() CALLED");
        if (this.wizardElement) {
            this.wizardElement.classList.remove('active');
        } else {
            console.error("WizardManager Skeleton: Cannot hide wizard, #config-wizard element not found.");
        }
    }

    // Todos los demás métodos de la clase WizardManager (init, changeStep, validateStepX, saveStepXState, loadStepXState, etc.)
    // están OMITIDOS en esta versión esqueleto para aislar el problema de definición de la clase.
    // Si esta versión esqueleto funciona (es decir, app.js no da error de "WizardManager no definido"),
    // entonces el error de sintaxis está en el código omitido.
}
console.log("wizard-manager.js: Script end parsing. WizardManager class SHOULD BE defined now (Skeleton Version).");

// No auto-instanciar WizardManager aquí. app.js es responsable de la instanciación.
// La línea `window.FlowWare.WizardManager = this;` está DENTRO del constructor.
// La clase WizardManager en sí misma está disponible globalmente porque no está envuelta en un IIFE.
// app.js puede hacer `new WizardManager();` siempre que este script se cargue primero.
