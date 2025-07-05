// js/wizard-manager.js (VERSIÓN ESQUELETO MÍNIMA PARA DEPURAR Y FLUJO AUTOMÁTICO - V4 con más logs)
console.log("wizard-manager.js (Skeleton V4): Script start parsing...");

class WizardManager {
    constructor() {
        console.log("WizardManager CONSTRUCTOR (Skeleton V4) CALLED");

        this.wizardElement = document.getElementById('config-wizard');
        this.initialConfigMessage = document.getElementById('initial-config-message');
        this.reopenWizardBtn = document.getElementById('reopen-wizard-btn');
        this.closeWizardBtn = document.getElementById('close-wizard-btn');
        this.prevBtn = document.getElementById('wizard-prev-btn');
        this.nextBtn = document.getElementById('wizard-next-btn');
        this.finishBtn = document.getElementById('wizard-finish-btn');

        if (!this.wizardElement) {
            console.error("WizardManager Skeleton V4: #config-wizard element NOT FOUND! Wizard cannot function.");
        }
        if (!this.initialConfigMessage) {
            console.warn("WizardManager Skeleton V4: #initial-config-message element NOT FOUND! Completion message will not work.");
        }
         if (!this.reopenWizardBtn) {
            console.warn("WizardManager Skeleton V4: #reopen-wizard-btn element NOT FOUND! Reopening wizard from completion message will not work.");
        }
        if (!this.closeWizardBtn || !this.prevBtn || !this.nextBtn || !this.finishBtn) {
            console.warn("WizardManager Skeleton V4: One or more navigation/close buttons for the wizard modal are missing.");
        }

        window.FlowWare = window.FlowWare || {};
        window.FlowWare.WizardManager = this;

        this.initBaseListenersInSkeleton();
        this.initDisplayLogic();
        console.log("WizardManager Skeleton V4: Constructor finished.");
    }

    initDisplayLogic() {
        console.log("WizardManager Skeleton V4: initDisplayLogic() CALLED.");

        if (!window.FlowWare || !window.FlowWare.Utils || !window.FlowWare.Utils.State) {
             console.error("WizardManager Skeleton V4: FlowWare.Utils.State is not available. Cannot determine wizard completion state.");
             if (this.initialConfigMessage) {
                this.initialConfigMessage.innerHTML = "<p style='color:red;'>Error: Dependencias críticas (FlowWare.Utils.State) no cargadas. El asistente no puede continuar.</p>";
                this.initialConfigMessage.style.display = 'flex';
             }
             if (this.wizardElement) this.wizardElement.style.display = 'none';
             return;
        }
        console.log("WizardManager Skeleton V4: FlowWare.Utils.State IS available.");

        if (this.reopenWizardBtn) {
            const newReopenBtn = this.reopenWizardBtn.cloneNode(true);
            if (this.reopenWizardBtn.parentNode) {
                this.reopenWizardBtn.parentNode.replaceChild(newReopenBtn, this.reopenWizardBtn);
            }
            this.reopenWizardBtn = newReopenBtn;
            this.reopenWizardBtn.addEventListener('click', () => {
                console.log("WizardManager Skeleton V4: reopenWizardBtn clicked.");
                this.showWizard(true);
            });
            console.log("WizardManager Skeleton V4: reopenWizardBtn listener attached.");
        } else {
            console.warn("WizardManager Skeleton V4: #reopen-wizard-btn not found during initDisplayLogic. Reopening from message will not work.");
        }

        const wizardCompleted = window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted');
        console.log(`WizardManager Skeleton V4: wizardCompleted flag from localStorage is: ${wizardCompleted}`);

        if (!wizardCompleted) {
            console.log("WizardManager Skeleton V4: Configuration not complete. Attempting to show wizard.");
            this.showWizard(false);
        } else {
            console.log("WizardManager Skeleton V4: Configuration IS complete. Attempting to show completion message.");
            if (this.initialConfigMessage) {
                this.initialConfigMessage.style.display = 'flex';
                console.log("WizardManager Skeleton V4: Completion message displayed.");
            } else {
                console.error("WizardManager Skeleton V4: #initial-config-message is null, cannot show completion message.");
            }
            this.hideWizard(); // Ensure wizard modal is hidden
        }
    }

    showWizard(isReopening = false) {
        console.log(`WizardManager Skeleton V4: showWizard(isReopening: ${isReopening}) CALLED`);

        if (this.initialConfigMessage) {
            this.initialConfigMessage.style.display = 'none';
        } else {
            console.warn("WizardManager Skeleton V4: #initial-config-message not found in showWizard, cannot hide it.");
        }

        if (isReopening) {
             console.log("WizardManager Skeleton V4: Reopening wizard logic...");
             // const restartFresh = confirm("¿Desea borrar toda la configuración existente y empezar de cero, o solo revisar/editar?");
             // if (restartFresh) { /* Lógica para limpiar localStorage y wizardCompleted flag */ }
        }

        if (this.wizardElement) {
            this.wizardElement.classList.add('active');
            console.log("WizardManager Skeleton V4: Wizard modal activated.");
            // En una versión completa, aquí se inicializaría el primer paso:
            // this.currentStep = 0;
            // this.initializeStep(1);
            // this.updateStepVisibility();
            // this.updateButtonStates();
        } else {
            console.error("WizardManager Skeleton V4: #config-wizard element not found. CANNOT SHOW WIZARD.");
        }
    }

    hideWizard() {
        console.log("WizardManager Skeleton V4: hideWizard() CALLED");
        if (this.wizardElement) {
            this.wizardElement.classList.remove('active');
            console.log("WizardManager Skeleton V4: Wizard modal deactivated.");
        } else {
            console.warn("WizardManager Skeleton V4: #config-wizard not found in hideWizard.");
        }
    }

    initBaseListenersInSkeleton() {
        if(this.closeWizardBtn) {
            this.closeWizardBtn.addEventListener('click', () => {
                console.log("Skeleton V4: closeWizardBtn clicked");
                const wizardCompleted = window.FlowWare && window.FlowWare.Utils ? window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted') : false;
                if(!wizardCompleted) {
                    const msg = "Debe completar la configuración inicial para cerrar el asistente.";
                    if(window.FlowWare && window.FlowWare.NotificationManager) window.FlowWare.NotificationManager.show(msg, "warning");
                    else alert(msg);
                } else {
                    this.hideWizard();
                    if(this.initialConfigMessage) this.initialConfigMessage.style.display = 'flex';
                }
            });
        }
        if(this.prevBtn) this.prevBtn.addEventListener('click', () => console.log("Skeleton V4: prevBtn clicked."));
        if(this.nextBtn) this.nextBtn.addEventListener('click', () => console.log("Skeleton V4: nextBtn clicked."));
        if(this.finishBtn) {
            this.finishBtn.addEventListener('click', () => {
                console.log("Skeleton V4: finishBtn clicked");
                if(window.FlowWare && window.FlowWare.Utils) {
                    window.FlowWare.Utils.State.save('flowWareConfig.wizardCompleted', true);
                }
                this.hideWizard();
                if(this.initialConfigMessage) this.initialConfigMessage.style.display = 'flex';
            });
        }
    }
}

window.WizardManagerClassDefined = true;
console.log("wizard-manager.js (Skeleton V4): Script end parsing. Class WizardManager defined. window.WizardManagerClassDefined set to true.");
