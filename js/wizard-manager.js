// ===== WIZARD MANAGER =====
class WizardManager {
    constructor() {
        this.wizardElement = document.getElementById('config-wizard');
        this.closeWizardBtn = document.getElementById('close-wizard-btn');
        this.showWizardBtn = document.getElementById('show-wizard-btn');
        this.prevBtn = document.getElementById('wizard-prev-btn');
        this.nextBtn = document.getElementById('wizard-next-btn');
        this.finishBtn = document.getElementById('wizard-finish-btn');
        this.steps = Array.from(this.wizardElement.querySelectorAll('.wizard-step'));
        this.currentStep = 0;

        this.init();
    }

    init() {
        if (!this.wizardElement || !this.showWizardBtn || !this.closeWizardBtn || !this.prevBtn || !this.nextBtn || !this.finishBtn) {
            console.warn("Wizard elements not found, WizardManager will not initialize.");
            return;
        }

        this.showWizardBtn.addEventListener('click', () => this.showWizard());
        this.closeWizardBtn.addEventListener('click', () => this.hideWizard());
        this.wizardElement.addEventListener('click', (event) => {
            if (event.target === this.wizardElement) { // Click en el overlay
                this.hideWizard();
            }
        });

        this.prevBtn.addEventListener('click', () => this.changeStep(-1));
        this.nextBtn.addEventListener('click', () => this.changeStep(1));
        this.finishBtn.addEventListener('click', () => this.finishWizard());

        this.formElementsStep1 = {
            name: document.getElementById('company-name'),
            address1: document.getElementById('company-address1'),
            address2: document.getElementById('company-address2'),
            country: document.getElementById('company-country'),
            state: document.getElementById('company-state'),
            lada: document.getElementById('company-lada'),
            phone1: document.getElementById('company-phone1'),
            phone2: document.getElementById('company-phone2'),
            capacity: document.getElementById('company-capacity'),
        };

        this.updateStepVisibility();
        this.updateButtonStates();

        // Guardar referencia global
        window.FlowWare = window.FlowWare || {};
        window.FlowWare.WizardManager = this;
        console.log('🧙 WizardManager initialized');
    }

    showWizard() {
        const wizardCompleted = window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted');
        if (wizardCompleted) {
            if (!confirm("Ya ha completado la configuración inicial. ¿Desea revisarla o empezar de nuevo? (Empezar de nuevo limpiará los datos existentes si avanza en los pasos).")) {
                return;
            }
            // Si decide continuar, no borramos los datos aquí, se sobreescribirán al guardar cada paso.
        }
        this.currentStep = 0;
        this.initializeStep(1); // Inicializa y carga el primer paso
        this.updateStepVisibility();
        this.updateButtonStates();
        this.wizardElement.classList.add('active');
    }

    hideWizard() {
        this.wizardElement.classList.remove('active');
    }

    changeStep(direction) {
        if (direction > 0) { // Avanzando
            if (!this.validateCurrentStep()) {
                window.FlowWare.NotificationManager.show('Por favor, corrija los errores antes de continuar.', 'error');
                return;
            }
            this.saveCurrentStepState();
        }

        const newStep = this.currentStep + direction;
        if (newStep >= 0 && newStep < this.steps.length) {
            this.currentStep = newStep;
            this.loadCurrentStepState(); // Cargar datos del nuevo paso
            this.updateStepVisibility();
            this.updateButtonStates();
        }
    }

    updateStepVisibility() {
        this.steps.forEach((step, index) => {
            if (index === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    updateButtonStates() {
        this.prevBtn.disabled = this.currentStep === 0;
        this.nextBtn.style.display = (this.currentStep === this.steps.length - 1) ? 'none' : 'inline-block';
        this.finishBtn.style.display = (this.currentStep === this.steps.length - 1) ? 'inline-block' : 'none';
    }

    validateCurrentStep() {
        const stepElement = this.steps[this.currentStep];
        if (!stepElement) return false; // No debería pasar si currentStep está bien manejado
        const stepNumber = parseInt(stepElement.dataset.step, 10);
        switch(stepNumber) {
           case 1: return this.validateStep1();
           // case 2: return this.validateStep2(); // A implementar en el siguiente paso del plan
           default: return true;
        }
    }

    saveCurrentStepState() {
        const stepElement = this.steps[this.currentStep];
        if (!stepElement) return;
        const stepNumber = parseInt(stepElement.dataset.step, 10);
        switch(stepNumber) {
           case 1: this.saveStep1State(); break;
           // case 2: this.saveStep2State(); break; // A implementar
        }
    }

    loadCurrentStepState() {
        const stepElement = this.steps[this.currentStep];
        if (!stepElement) return;
        const stepNumber = parseInt(stepElement.dataset.step, 10);
        this.initializeStep(stepNumber); // Cambiado para llamar a initializeStep
    }

    initializeStep(stepNumber) {
        // Esta función se encarga de la inicialización específica de cada paso,
        // incluyendo la configuración de listeners y la carga de su estado.
        switch(stepNumber) {
            case 1:
                // Para el paso 1, los elementos del formulario ya se obtienen en el constructor.
                // Solo necesitamos cargar su estado.
                this.loadStep1State();
                break;
            case 2:
                this.initializeStep2(); // Configura listeners y luego llama a loadStep2State internamente
                break;
            case 3:
                this.initializeStep3(); // Configura listeners y luego llama a loadStep3State internamente
                break;
            // case 4: // El paso final (resumen) no tiene carga de estado en esta fase.
            //    break;
        }
    }

    // --- Lógica específica del Paso 1: Compañía ---
    validateStep1() {
        let isValid = true;
        const showError = (element, message) => {
            if (!element) return;
            element.classList.add('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) {
                errorDiv.textContent = message;
            }
            isValid = false;
        };
        const clearError = (element) => {
            if (!element) return;
            element.classList.remove('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) {
                errorDiv.textContent = '';
            }
        };

        // Nombre de la Compañía
        clearError(this.formElementsStep1.name);
        if (!this.formElementsStep1.name || !this.formElementsStep1.name.value.trim()) {
            showError(this.formElementsStep1.name, 'El nombre de la compañía es obligatorio.');
        }

        // Domicilio 1
        clearError(this.formElementsStep1.address1);
        if (!this.formElementsStep1.address1 || !this.formElementsStep1.address1.value.trim()) {
            showError(this.formElementsStep1.address1, 'El domicilio 1 es obligatorio.');
        }

        // País
        clearError(this.formElementsStep1.country);
        if (!this.formElementsStep1.country || !this.formElementsStep1.country.value) {
            showError(this.formElementsStep1.country, 'Seleccione un país.');
        }

        // Estado/Provincia
        clearError(this.formElementsStep1.state);
        if (!this.formElementsStep1.state || !this.formElementsStep1.state.value.trim()) {
            showError(this.formElementsStep1.state, 'El estado/provincia es obligatorio.');
        }

        // Lada (opcional, pero si existe, debe ser numérico y corto)
        clearError(this.formElementsStep1.lada);
        if (this.formElementsStep1.lada) {
            const ladaValue = this.formElementsStep1.lada.value.trim();
            if (ladaValue && (!/^\d+$/.test(ladaValue) || ladaValue.length > 4)) {
                showError(this.formElementsStep1.lada, 'Lada inválida (solo números, máx 4 dígitos).');
            }
        }

        // Teléfono Fijo
        clearError(this.formElementsStep1.phone1);
        if (this.formElementsStep1.phone1) {
            const phone1Value = this.formElementsStep1.phone1.value.trim();
            if (!phone1Value) {
                showError(this.formElementsStep1.phone1, 'El número de teléfono fijo es obligatorio.');
            } else if (!/^\d{7,15}$/.test(phone1Value.replace(/\s+/g, ''))) {
                showError(this.formElementsStep1.phone1, 'Teléfono fijo inválido (7-15 dígitos).');
            }
        }

        // Teléfono Extra (opcional, pero si existe, validar)
        clearError(this.formElementsStep1.phone2);
        if (this.formElementsStep1.phone2) {
            const phone2Value = this.formElementsStep1.phone2.value.trim();
            if (phone2Value && !/^\d{7,15}$/.test(phone2Value.replace(/\s+/g, ''))) {
                 showError(this.formElementsStep1.phone2, 'Teléfono extra inválido (7-15 dígitos).');
            }
        }

        // Capacidad en M2
        clearError(this.formElementsStep1.capacity);
        if (this.formElementsStep1.capacity) {
            if (!this.formElementsStep1.capacity.value) {
                showError(this.formElementsStep1.capacity, 'La capacidad es obligatoria.');
            } else if (parseInt(this.formElementsStep1.capacity.value, 10) < 1) {
                showError(this.formElementsStep1.capacity, 'La capacidad debe ser un número positivo.');
            }
        }

        return isValid;
    }

    saveStep1State() {
        if (!this.formElementsStep1.name) return; // Salir si los elementos no están listos

        const companyData = {
            name: this.formElementsStep1.name.value.trim(),
            address1: this.formElementsStep1.address1.value.trim(),
            address2: this.formElementsStep1.address2.value.trim(),
            country: this.formElementsStep1.country.value,
            state: this.formElementsStep1.state.value.trim(),
            lada: this.formElementsStep1.lada.value.trim(),
            phone1: this.formElementsStep1.phone1.value.trim(),
            phone2: this.formElementsStep1.phone2.value.trim(),
            capacity: this.formElementsStep1.capacity.value ? parseInt(this.formElementsStep1.capacity.value, 10) : null,
        };
        window.FlowWare.Utils.State.save('flowWareConfig.company', companyData);
        // console.log('Company data saved:', companyData);
    }

    loadStep1State() {
        if (!this.formElementsStep1.name) return;

        const companyData = window.FlowWare.Utils.State.load('flowWareConfig.company');
        if (companyData) {
            this.formElementsStep1.name.value = companyData.name || '';
            this.formElementsStep1.address1.value = companyData.address1 || '';
            this.formElementsStep1.address2.value = companyData.address2 || '';
            this.formElementsStep1.country.value = companyData.country || '';
            this.formElementsStep1.state.value = companyData.state || '';
            this.formElementsStep1.lada.value = companyData.lada || '';
            this.formElementsStep1.phone1.value = companyData.phone1 || '';
            this.formElementsStep1.phone2.value = companyData.phone2 || '';
            this.formElementsStep1.capacity.value = companyData.capacity || '';
            // console.log('Company data loaded:', companyData);
        }
    }
    // --- Fin Lógica Paso 1 ---

    // --- Lógica específica del Paso 2: Almacenes ---
    initializeStep2() {
        this.warehouseFormsContainer = document.getElementById('warehouse-forms-container');
        this.addWarehouseBtn = document.getElementById('add-warehouse-btn');
        this.step2ErrorMessage = document.getElementById('step2-error-message');
        this.warehouseCount = 0;

        if(this.addWarehouseBtn) {
            this.addWarehouseBtn.addEventListener('click', () => this.addWarehouseForm());
        }
        // Cargar almacenes existentes si los hay
        this.loadStep2State();
    }

    addWarehouseForm(warehouseData = null) {
        this.warehouseCount++;
        const warehouseId = warehouseData ? warehouseData.id : `wh-${Date.now()}-${this.warehouseCount}`;

        const formHtml = `
            <div class="warehouse-form" data-id="${warehouseId}" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
                <h4>Almacén ${this.warehouseFormsContainer.children.length + 1}</h4>
                <input type="hidden" name="warehouse-id" value="${warehouseId}">
                <div class="form-group">
                    <label for="warehouse-name-${warehouseId}">Nombre del Almacén <span class="required">*</span></label>
                    <input type="text" id="warehouse-name-${warehouseId}" name="warehouse-name" class="form-input" required value="${warehouseData?.name || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="warehouse-address-${warehouseId}">Domicilio <span class="required">*</span></label>
                    <input type="text" id="warehouse-address-${warehouseId}" name="warehouse-address" class="form-input" required value="${warehouseData?.address || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="warehouse-capacity-${warehouseId}">Capacidad M2</label>
                    <input type="number" id="warehouse-capacity-${warehouseId}" name="warehouse-capacity" class="form-input" min="0" value="${warehouseData?.capacity || ''}">
                    <div class="error-message"></div>
                </div>
                <button type="button" class="btn btn-danger btn-sm remove-warehouse-btn" style="margin-top: 5px;">Eliminar Almacén</button>
            </div>
        `;
        if(this.warehouseFormsContainer) {
            this.warehouseFormsContainer.insertAdjacentHTML('beforeend', formHtml);
            const newForm = this.warehouseFormsContainer.querySelector(`.warehouse-form[data-id="${warehouseId}"]`);
            const removeBtn = newForm.querySelector('.remove-warehouse-btn');
            if(removeBtn) {
                removeBtn.addEventListener('click', () => {
                    newForm.remove();
                    this.updateWarehouseTitles();
                });
            }
        }
    }

    updateWarehouseTitles() {
        const forms = this.warehouseFormsContainer.querySelectorAll('.warehouse-form');
        forms.forEach((form, index) => {
            const titleElement = form.querySelector('h4');
            if (titleElement) {
                titleElement.textContent = `Almacén ${index + 1}`;
            }
        });
    }

    validateStep2() {
        let isValid = true;
        if (!this.warehouseFormsContainer) return false;

        const forms = this.warehouseFormsContainer.querySelectorAll('.warehouse-form');

        if (forms.length === 0) {
            if(this.step2ErrorMessage) this.step2ErrorMessage.textContent = 'Debe añadir al menos un almacén.';
            return false;
        }
        if(this.step2ErrorMessage) this.step2ErrorMessage.textContent = '';


        forms.forEach(form => {
            const nameInput = form.querySelector('input[name="warehouse-name"]');
            const addressInput = form.querySelector('input[name="warehouse-address"]');
            const capacityInput = form.querySelector('input[name="warehouse-capacity"]');

            const showError = (element, message) => {
                if (!element) return;
                element.classList.add('invalid');
                const errorDiv = element.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('error-message')) {
                    errorDiv.textContent = message;
                }
                isValid = false;
            };
            const clearError = (element) => {
                if (!element) return;
                element.classList.remove('invalid');
                const errorDiv = element.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('error-message')) {
                    errorDiv.textContent = '';
                }
            };

            clearError(nameInput);
            if (!nameInput.value.trim()) {
                showError(nameInput, 'El nombre del almacén es obligatorio.');
            }

            clearError(addressInput);
            if (!addressInput.value.trim()) {
                showError(addressInput, 'El domicilio del almacén es obligatorio.');
            }

            clearError(capacityInput);
            if (capacityInput.value && parseInt(capacityInput.value, 10) < 0) {
                showError(capacityInput, 'La capacidad no puede ser negativa.');
            }
        });
        return isValid;
    }

    saveStep2State() {
        if (!this.warehouseFormsContainer) return;
        const warehouses = [];
        const forms = this.warehouseFormsContainer.querySelectorAll('.warehouse-form');
        forms.forEach(form => {
            warehouses.push({
                id: form.dataset.id,
                name: form.querySelector('input[name="warehouse-name"]').value.trim(),
                address: form.querySelector('input[name="warehouse-address"]').value.trim(),
                capacity: form.querySelector('input[name="warehouse-capacity"]').value ? parseInt(form.querySelector('input[name="warehouse-capacity"]').value, 10) : null,
            });
        });
        window.FlowWare.Utils.State.save('flowWareConfig.warehouses', warehouses);
        // console.log('Warehouses data saved:', warehouses);
    }

    loadStep2State() {
        if (!this.warehouseFormsContainer) { // Si el contenedor no existe aún (ej. en la primera carga de WizardManager)
            // Llama a initializeStep2 cuando el wizard se muestre y el paso 2 sea el activo.
            // Esto se maneja ahora en loadStepState y showWizard.
            return;
        }

        this.warehouseFormsContainer.innerHTML = ''; // Limpiar formularios existentes
        this.warehouseCount = 0;
        const warehousesData = window.FlowWare.Utils.State.load('flowWareConfig.warehouses');
        if (warehousesData && warehousesData.length > 0) {
            warehousesData.forEach(whData => this.addWarehouseForm(whData));
        } else {
            // Añadir un formulario por defecto si no hay datos guardados
            this.addWarehouseForm();
        }
        // console.log('Warehouses data loaded:', warehousesData);
    }
    // --- Fin Lógica Paso 2 ---

    // --- Lógica específica del Paso 3: Usuarios Administradores ---
    initializeStep3() {
        this.userAssignmentsContainer = document.getElementById('user-assignments-container');
        this.step3ErrorMessage = document.getElementById('step3-error-message');
        this.userCount = 0; // Para IDs únicos de formularios de usuario
        this.loadStep3State();
    }

    renderUserAssignments() {
        if (!this.userAssignmentsContainer) return;
        this.userAssignmentsContainer.innerHTML = ''; // Limpiar
        const warehouses = window.FlowWare.Utils.State.load('flowWareConfig.warehouses') || [];

        if (warehouses.length === 0) {
            this.userAssignmentsContainer.innerHTML = '<p>No hay almacenes creados. Por favor, vuelva al Paso 2 para añadir almacenes.</p>';
            return;
        }

        warehouses.forEach(warehouse => {
            const warehouseSection = document.createElement('div');
            warehouseSection.className = 'warehouse-user-section';
            warehouseSection.style.border = "1px solid #ccc";
            warehouseSection.style.padding = "15px";
            warehouseSection.style.marginBottom = "20px";
            warehouseSection.style.borderRadius = "5px";
            warehouseSection.innerHTML = `
                <h4>Usuarios para: ${this.escapeHTML(warehouse.name)} (ID: ${this.escapeHTML(warehouse.id)})</h4>
                <div class="user-forms-for-warehouse" data-warehouse-id="${this.escapeHTML(warehouse.id)}">
                    <!-- Formularios de usuario para este almacén -->
                </div>
                <button type="button" class="btn btn-info btn-sm add-user-to-warehouse-btn">
                    <span class="icon">👤</span> Añadir Usuario a ${this.escapeHTML(warehouse.name)}
                </button>
            `;
            this.userAssignmentsContainer.appendChild(warehouseSection);

            const addUserBtn = warehouseSection.querySelector('.add-user-to-warehouse-btn');
            addUserBtn.addEventListener('click', () => this.addUserFormToWarehouse(warehouse.id));
        });
    }

    escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }


    addUserFormToWarehouse(warehouseId, userData = null) {
        const container = this.userAssignmentsContainer.querySelector(`.user-forms-for-warehouse[data-warehouse-id="${warehouseId}"]`);
        if (!container) return;

        this.userCount++;
        const userId = userData ? userData.id : `user-${Date.now()}-${this.userCount}`;
        const formIndex = container.children.length; // Para títulos simples

        const formHtml = `
            <div class="user-form" data-user-id="${userId}" style="border: 1px solid #e0e0e0; padding: 10px; margin-top: 10px; border-radius: 4px;">
                <h5>Usuario ${formIndex + 1} para Almacén ${this.escapeHTML(warehouseId)}</h5>
                <input type="hidden" name="user-id" value="${userId}">
                <input type="hidden" name="user-warehouse-id" value="${warehouseId}">

                <div class="form-group">
                    <label for="user-fullname-${userId}">Nombre Completo <span class="required">*</span></label>
                    <input type="text" id="user-fullname-${userId}" name="user-fullname" class="form-input" required value="${this.escapeHTML(userData?.fullName) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="user-gender-${userId}">Sexo</label>
                    <select id="user-gender-${userId}" name="user-gender" class="form-input">
                        <option value="">Seleccionar...</option>
                        <option value="male" ${userData?.gender === 'male' ? 'selected' : ''}>Masculino</option>
                        <option value="female" ${userData?.gender === 'female' ? 'selected' : ''}>Femenino</option>
                        <option value="other" ${userData?.gender === 'other' ? 'selected' : ''}>Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="user-lada-${userId}">Lada</label>
                    <input type="tel" id="user-lada-${userId}" name="user-lada" class="form-input" placeholder="Ej: 52" value="${this.escapeHTML(userData?.lada) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="user-phone-${userId}">Teléfono Fijo</label>
                    <input type="tel" id="user-phone-${userId}" name="user-phone" class="form-input" value="${this.escapeHTML(userData?.phone) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="user-mobile-${userId}">Celular <span class="required">*</span></label>
                    <input type="tel" id="user-mobile-${userId}" name="user-mobile" class="form-input" required value="${this.escapeHTML(userData?.mobile) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="user-email-personal-${userId}">Correo Personal</label>
                    <input type="email" id="user-email-personal-${userId}" name="user-email-personal" class="form-input" value="${this.escapeHTML(userData?.emailPersonal) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="user-email-company-${userId}">Correo de la Empresa <span class="required">*</span></label>
                    <input type="email" id="user-email-company-${userId}" name="user-email-company" class="form-input" required value="${this.escapeHTML(userData?.emailCompany) || ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <input type="text" class="form-input" value="ADMIN" readonly>
                </div>
                <div class="form-group">
                    <label>Contraseña por Defecto</label>
                    <input type="text" class="form-input" value="FlowWareAdmin123!" readonly>
                </div>
                <button type="button" class="btn btn-danger btn-sm remove-user-btn" style="margin-top: 5px;">Eliminar Usuario</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', formHtml);
        const newUserForm = container.querySelector(`.user-form[data-user-id="${userId}"]`);
        const removeBtn = newUserForm.querySelector('.remove-user-btn');
        removeBtn.addEventListener('click', () => {
             newUserForm.remove();
             // Re-enumerar títulos si es necesario, similar a updateWarehouseTitles
        });
    }

    validateStep3() {
        let isValid = true;
        if (!this.userAssignmentsContainer) return false;
        if(this.step3ErrorMessage) this.step3ErrorMessage.textContent = '';

        const warehouseSections = this.userAssignmentsContainer.querySelectorAll('.warehouse-user-section');
        if (warehouseSections.length === 0 && (window.FlowWare.Utils.State.load('flowWareConfig.warehouses') || []).length > 0) {
             if(this.step3ErrorMessage) this.step3ErrorMessage.textContent = 'Error al cargar secciones de almacén.';
             return false; // Si hay almacenes pero no secciones, algo falló en renderUserAssignments
        }


        warehouseSections.forEach(section => {
            const userForms = section.querySelectorAll('.user-form');
            // Opcional: Requerir al menos un usuario por almacén
            // if (userForms.length === 0) {
            //     if(this.step3ErrorMessage) this.step3ErrorMessage.textContent = `El almacén ${section.querySelector('h4').textContent.split("ID:")[0].replace("Usuarios para:","").trim()} debe tener al menos un usuario.`;
            //     isValid = false;
            //     return; // Sale del forEach para esta sección, pero la validación general continúa
            // }

            userForms.forEach(form => {
                const fullNameInput = form.querySelector('input[name="user-fullname"]');
                const mobileInput = form.querySelector('input[name="user-mobile"]');
                const emailCompanyInput = form.querySelector('input[name="user-email-company"]');
                const emailPersonalInput = form.querySelector('input[name="user-email-personal"]');
                const ladaInput = form.querySelector('input[name="user-lada"]');
                const phoneInput = form.querySelector('input[name="user-phone"]');

                const showError = (element, message) => { /* ... (similar a step 1/2) ... */
                    if (!element) return;
                    element.classList.add('invalid');
                    const errorDiv = element.nextElementSibling;
                    if (errorDiv && errorDiv.classList.contains('error-message')) {
                        errorDiv.textContent = message;
                    }
                    isValid = false;
                };
                const clearError = (element) => { /* ... (similar a step 1/2) ... */
                    if (!element) return;
                    element.classList.remove('invalid');
                    const errorDiv = element.nextElementSibling;
                    if (errorDiv && errorDiv.classList.contains('error-message')) {
                        errorDiv.textContent = '';
                    }
                };

                // Validar Nombre Completo
                clearError(fullNameInput);
                if (!fullNameInput.value.trim()) showError(fullNameInput, 'Nombre completo es obligatorio.');

                // Validar Celular
                clearError(mobileInput);
                if (!mobileInput.value.trim()) {
                    showError(mobileInput, 'Celular es obligatorio.');
                } else if (!/^\d{7,15}$/.test(mobileInput.value.trim().replace(/\s+/g, ''))) {
                    showError(mobileInput, 'Celular inválido (7-15 dígitos).');
                }

                // Validar Lada (opcional)
                clearError(ladaInput);
                const ladaVal = ladaInput.value.trim();
                if (ladaVal && (!/^\d+$/.test(ladaVal) || ladaVal.length > 4)) {
                     showError(ladaInput, 'Lada inválida.');
                }

                // Validar Teléfono Fijo (opcional)
                clearError(phoneInput);
                const phoneVal = phoneInput.value.trim();
                if (phoneVal && !/^\d{7,15}$/.test(phoneVal.replace(/\s+/g, ''))) {
                     showError(phoneInput, 'Teléfono fijo inválido.');
                }


                // Validar Correo Empresa
                clearError(emailCompanyInput);
                if (!emailCompanyInput.value.trim()) {
                    showError(emailCompanyInput, 'Correo de empresa es obligatorio.');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCompanyInput.value.trim())) {
                    showError(emailCompanyInput, 'Formato de correo inválido.');
                }

                // Validar Correo Personal (opcional, pero si existe, validar formato)
                clearError(emailPersonalInput);
                if (emailPersonalInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPersonalInput.value.trim())) {
                    showError(emailPersonalInput, 'Formato de correo personal inválido.');
                }
            });
        });
        return isValid;
    }

    saveStep3State() {
        if (!this.userAssignmentsContainer) return;
        const users = [];
        const warehouseSections = this.userAssignmentsContainer.querySelectorAll('.warehouse-user-section');
        warehouseSections.forEach(section => {
            const warehouseId = section.querySelector('.user-forms-for-warehouse').dataset.warehouseId;
            const userForms = section.querySelectorAll('.user-form');
            userForms.forEach(form => {
                users.push({
                    id: form.dataset.userId,
                    warehouseId: warehouseId,
                    fullName: form.querySelector('input[name="user-fullname"]').value.trim(),
                    gender: form.querySelector('select[name="user-gender"]').value,
                    lada: form.querySelector('input[name="user-lada"]').value.trim(),
                    phone: form.querySelector('input[name="user-phone"]').value.trim(),
                    mobile: form.querySelector('input[name="user-mobile"]').value.trim(),
                    emailPersonal: form.querySelector('input[name="user-email-personal"]').value.trim(),
                    emailCompany: form.querySelector('input[name="user-email-company"]').value.trim(),
                    role: 'ADMIN', // Hardcoded por ahora
                });
            });
        });
        window.FlowWare.Utils.State.save('flowWareConfig.users', users);
        // console.log('Users data saved:', users);
    }

    loadStep3State() {
        if (!this.userAssignmentsContainer) {
             // Es posible que se llame antes de que el DOM del paso 3 esté completamente listo o visible.
             // renderUserAssignments se encargará de esto cuando el paso se active.
            return;
        }
        this.renderUserAssignments(); // Renderiza la estructura de almacenes
        const usersData = window.FlowWare.Utils.State.load('flowWareConfig.users');
        if (usersData && usersData.length > 0) {
            usersData.forEach(userData => {
                this.addUserFormToWarehouse(userData.warehouseId, userData);
            });
        }
        // console.log('Users data loaded');
    }

    // --- Fin Lógica Paso 3 ---


    finishWizard() {
        if (!this.validateCurrentStep()) { // Validar el último paso antes de finalizar
