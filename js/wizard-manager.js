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
        }
        // Ocultar el mensaje de "configuración completada" si se muestra el wizard
        const initialConfigMessage = document.getElementById('initial-config-message');
        if (initialConfigMessage) {
            initialConfigMessage.style.display = 'none';
        }

        this.currentStep = 0;
        this.initializeStep(1);
        this.updateStepVisibility();
        this.updateButtonStates();
        this.wizardElement.classList.add('active');
    }

    hideWizard() {
        this.wizardElement.classList.remove('active');
        // Verificar si la configuración está completa y mostrar mensaje si es el caso
        const wizardCompleted = window.FlowWare.Utils.State.load('flowWareConfig.wizardCompleted');
        const initialConfigMessage = document.getElementById('initial-config-message');
        if (wizardCompleted && initialConfigMessage) {
            initialConfigMessage.style.display = 'flex'; // Mostrar el mensaje de config completada
        } else if (initialConfigMessage) {
            initialConfigMessage.style.display = 'none';
        }
    }

    changeStep(direction) {
        if (direction > 0) {
            if (!this.validateCurrentStep()) {
                window.FlowWare.NotificationManager.show('Por favor, corrija los errores antes de continuar.', 'error');
                return;
            }
            this.saveCurrentStepState();
        }

        const newStep = this.currentStep + direction;
        if (newStep >= 0 && newStep < this.steps.length) {
            this.currentStep = newStep;
            this.initializeStep(newStep + 1); // Los pasos son 1-indexed en dataset.step
            this.updateStepVisibility();
            this.updateButtonStates();
        }
    }

    updateStepVisibility() {
        this.steps.forEach((step, index) => {
            step.classList.toggle('active', index === this.currentStep);
        });
    }

    updateButtonStates() {
        this.prevBtn.disabled = this.currentStep === 0;
        this.nextBtn.style.display = (this.currentStep === this.steps.length - 1) ? 'none' : 'inline-block';
        this.finishBtn.style.display = (this.currentStep === this.steps.length - 1) ? 'inline-block' : 'none';
    }

    validateCurrentStep() {
        const stepElement = this.steps[this.currentStep];
        if (!stepElement) return false;
        const stepNumber = parseInt(stepElement.dataset.step, 10);
        switch(stepNumber) {
           case 1: return this.validateStep1();
           case 2: return this.validateStep2();
           case 3: return this.validateStep3();
           case 4: return this.validateStep4();
           case 5: return this.validateStep5();
           default: return true;
        }
    }

    saveCurrentStepState() {
        const stepElement = this.steps[this.currentStep];
        if (!stepElement) return;
        const stepNumber = parseInt(stepElement.dataset.step, 10);
        switch(stepNumber) {
           case 1: this.saveStep1State(); break;
           case 2: this.saveStep2State(); break;
           case 3: this.saveStep3State(); break;
           case 4: this.saveStep4State(); break;
           case 5: this.saveStep5State(); break;
        }
    }

    initializeStep(stepNumber) {
        switch(stepNumber) {
            case 1: this.loadStep1State(); break;
            case 2: this.initializeStep2(); break;
            case 3: this.initializeStep3(); break;
            case 4: this.initializeStep4(); break;
            case 5: this.initializeStep5(); break;
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

        clearError(this.formElementsStep1.name);
        if (!this.formElementsStep1.name || !this.formElementsStep1.name.value.trim()) {
            showError(this.formElementsStep1.name, 'El nombre de la compañía es obligatorio.');
        }
        clearError(this.formElementsStep1.address1);
        if (!this.formElementsStep1.address1 || !this.formElementsStep1.address1.value.trim()) {
            showError(this.formElementsStep1.address1, 'El domicilio 1 es obligatorio.');
        }
        clearError(this.formElementsStep1.country);
        if (!this.formElementsStep1.country || !this.formElementsStep1.country.value) {
            showError(this.formElementsStep1.country, 'Seleccione un país.');
        }
        clearError(this.formElementsStep1.state);
        if (!this.formElementsStep1.state || !this.formElementsStep1.state.value.trim()) {
            showError(this.formElementsStep1.state, 'El estado/provincia es obligatorio.');
        }
        clearError(this.formElementsStep1.lada);
        if (this.formElementsStep1.lada) {
            const ladaValue = this.formElementsStep1.lada.value.trim();
            if (ladaValue && (!/^\d+$/.test(ladaValue) || ladaValue.length > 4)) {
                showError(this.formElementsStep1.lada, 'Lada inválida (solo números, máx 4 dígitos).');
            }
        }
        clearError(this.formElementsStep1.phone1);
        if (this.formElementsStep1.phone1) {
            const phone1Value = this.formElementsStep1.phone1.value.trim();
            if (!phone1Value) {
                showError(this.formElementsStep1.phone1, 'El número de teléfono fijo es obligatorio.');
            } else if (!/^\d{7,15}$/.test(phone1Value.replace(/\s+/g, ''))) {
                showError(this.formElementsStep1.phone1, 'Teléfono fijo inválido (7-15 dígitos).');
            }
        }
        clearError(this.formElementsStep1.phone2);
        if (this.formElementsStep1.phone2) {
            const phone2Value = this.formElementsStep1.phone2.value.trim();
            if (phone2Value && !/^\d{7,15}$/.test(phone2Value.replace(/\s+/g, ''))) {
                 showError(this.formElementsStep1.phone2, 'Teléfono extra inválido (7-15 dígitos).');
            }
        }
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
        if (!this.formElementsStep1.name) return;
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
        }
    }
    // --- Fin Lógica Paso 1 ---

    // --- Lógica específica del Paso 2: Almacenes ---
    initializeStep2() {
        this.warehouseFormsContainer = document.getElementById('warehouse-forms-container');
        this.addWarehouseBtn = document.getElementById('add-warehouse-btn');
        this.step2ErrorMessage = document.getElementById('step2-error-message');
        this.warehouseCount = 0;

        if(this.addWarehouseBtn && !this.addWarehouseBtn.dataset.initialized) {
            this.addWarehouseBtn.addEventListener('click', () => this.addWarehouseForm());
            this.addWarehouseBtn.dataset.initialized = "true";
        }
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
                if (errorDiv && errorDiv.classList.contains('error-message')) { errorDiv.textContent = message; }
                isValid = false;
            };
            const clearError = (element) => {
                if (!element) return;
                element.classList.remove('invalid');
                const errorDiv = element.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('error-message')) { errorDiv.textContent = '';}
            };
            clearError(nameInput);
            if (!nameInput.value.trim()) showError(nameInput, 'El nombre del almacén es obligatorio.');
            clearError(addressInput);
            if (!addressInput.value.trim()) showError(addressInput, 'El domicilio del almacén es obligatorio.');
            clearError(capacityInput);
            if (capacityInput.value && parseInt(capacityInput.value, 10) < 0) showError(capacityInput, 'La capacidad no puede ser negativa.');
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
    }

    loadStep2State() {
        if (!this.warehouseFormsContainer) return;
        this.warehouseFormsContainer.innerHTML = '';
        this.warehouseCount = 0;
        const warehousesData = window.FlowWare.Utils.State.load('flowWareConfig.warehouses');
        if (warehousesData && warehousesData.length > 0) {
            warehousesData.forEach(whData => this.addWarehouseForm(whData));
        } else {
            this.addWarehouseForm();
        }
    }
    // --- Fin Lógica Paso 2 ---

    // --- Lógica específica del Paso 3: Usuarios Administradores ---
    initializeStep3() {
        this.userAssignmentsContainer = document.getElementById('user-assignments-container');
        this.step3ErrorMessage = document.getElementById('step3-error-message');
        this.userCount = 0;
        this.loadStep3State();
    }

    renderUserAssignments() {
        if (!this.userAssignmentsContainer) return;
        this.userAssignmentsContainer.innerHTML = '';
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
                <div class="user-forms-for-warehouse" data-warehouse-id="${this.escapeHTML(warehouse.id)}"></div>
                <button type="button" class="btn btn-info btn-sm add-user-to-warehouse-btn" data-warehouse-id="${this.escapeHTML(warehouse.id)}">
                    <span class="icon">👤</span> Añadir Usuario a ${this.escapeHTML(warehouse.name)}
                </button>
            `;
            this.userAssignmentsContainer.appendChild(warehouseSection);
            const addUserBtn = warehouseSection.querySelector('.add-user-to-warehouse-btn');
            const newAddUserBtn = addUserBtn.cloneNode(true);
            addUserBtn.parentNode.replaceChild(newAddUserBtn, addUserBtn);
            newAddUserBtn.addEventListener('click', () => this.addUserFormToWarehouse(warehouse.id));
        });
    }

    escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[match]);
    }

    addUserFormToWarehouse(warehouseId, userData = null) {
        const container = this.userAssignmentsContainer.querySelector(`.user-forms-for-warehouse[data-warehouse-id="${warehouseId}"]`);
        if (!container) return;
        this.userCount++;
        const userId = userData ? userData.id : `user-${Date.now()}-${this.userCount}`;
        const formIndex = container.children.length;
        const formHtml = `
            <div class="user-form" data-user-id="${userId}" style="border: 1px solid #e0e0e0; padding: 10px; margin-top: 10px; border-radius: 4px;">
                <h5>Usuario ${formIndex + 1} </h5>
                <input type="hidden" name="user-id" value="${userId}">
                <input type="hidden" name="user-warehouse-id" value="${warehouseId}">
                <div class="form-group"><label for="user-fullname-${userId}">Nombre Completo <span class="required">*</span></label><input type="text" id="user-fullname-${userId}" name="user-fullname" class="form-input" required value="${this.escapeHTML(userData?.fullName) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label for="user-gender-${userId}">Sexo</label><select id="user-gender-${userId}" name="user-gender" class="form-input"><option value="">Seleccionar...</option><option value="male" ${userData?.gender === 'male' ? 'selected' : ''}>Masculino</option><option value="female" ${userData?.gender === 'female' ? 'selected' : ''}>Femenino</option><option value="other" ${userData?.gender === 'other' ? 'selected' : ''}>Otro</option></select></div>
                <div class="form-group"><label for="user-lada-${userId}">Lada</label><input type="tel" id="user-lada-${userId}" name="user-lada" class="form-input" placeholder="Ej: 52" value="${this.escapeHTML(userData?.lada) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label for="user-phone-${userId}">Teléfono Fijo</label><input type="tel" id="user-phone-${userId}" name="user-phone" class="form-input" value="${this.escapeHTML(userData?.phone) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label for="user-mobile-${userId}">Celular <span class="required">*</span></label><input type="tel" id="user-mobile-${userId}" name="user-mobile" class="form-input" required value="${this.escapeHTML(userData?.mobile) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label for="user-email-personal-${userId}">Correo Personal</label><input type="email" id="user-email-personal-${userId}" name="user-email-personal" class="form-input" value="${this.escapeHTML(userData?.emailPersonal) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label for="user-email-company-${userId}">Correo de la Empresa <span class="required">*</span></label><input type="email" id="user-email-company-${userId}" name="user-email-company" class="form-input" required value="${this.escapeHTML(userData?.emailCompany) || ''}"><div class="error-message"></div></div>
                <div class="form-group"><label>Rol</label><input type="text" class="form-input" value="ADMIN" readonly></div>
                <div class="form-group"><label>Contraseña por Defecto</label><input type="text" class="form-input" value="FlowWareAdmin123!" readonly></div>
                <button type="button" class="btn btn-danger btn-sm remove-user-btn" style="margin-top: 5px;">Eliminar Usuario</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', formHtml);
        const newUserForm = container.querySelector(`.user-form[data-user-id="${userId}"]`);
        const removeBtn = newUserForm.querySelector('.remove-user-btn');
        removeBtn.addEventListener('click', () => { newUserForm.remove(); this.updateUserFormTitles(container); });
    }

    updateUserFormTitles(container) {
        const userForms = container.querySelectorAll('.user-form');
        userForms.forEach((form, index) => {
            const titleElement = form.querySelector('h5');
            if (titleElement) {
                titleElement.textContent = `Usuario ${index + 1}`;
            }
        });
    }

    validateStep3() {
        let isValid = true;
        if (!this.userAssignmentsContainer) return false;
        if(this.step3ErrorMessage) this.step3ErrorMessage.textContent = '';
        const warehouseSections = this.userAssignmentsContainer.querySelectorAll('.warehouse-user-section');
        if (warehouseSections.length === 0 && (window.FlowWare.Utils.State.load('flowWareConfig.warehouses') || []).length > 0) {
             if(this.step3ErrorMessage) this.step3ErrorMessage.textContent = 'Error al cargar secciones de almacén.';
             return false;
        }
        warehouseSections.forEach(section => {
            const userForms = section.querySelectorAll('.user-form');
            userForms.forEach(form => {
                const fullNameInput = form.querySelector('input[name="user-fullname"]');
                const mobileInput = form.querySelector('input[name="user-mobile"]');
                const emailCompanyInput = form.querySelector('input[name="user-email-company"]');
                const emailPersonalInput = form.querySelector('input[name="user-email-personal"]');
                const ladaInput = form.querySelector('input[name="user-lada"]');
                const phoneInput = form.querySelector('input[name="user-phone"]');
                const showError = (element, message) => {
                    if (!element) return;
                    element.classList.add('invalid');
                    const errorDiv = element.nextElementSibling;
                    if (errorDiv && errorDiv.classList.contains('error-message')) { errorDiv.textContent = message; }
                    isValid = false;
                };
                const clearError = (element) => {
                    if (!element) return;
                    element.classList.remove('invalid');
                    const errorDiv = element.nextElementSibling;
                    if (errorDiv && errorDiv.classList.contains('error-message')) { errorDiv.textContent = ''; }
                };
                clearError(fullNameInput);
                if (!fullNameInput.value.trim()) showError(fullNameInput, 'Nombre completo es obligatorio.');
                clearError(mobileInput);
                if (!mobileInput.value.trim()) {
                    showError(mobileInput, 'Celular es obligatorio.');
                } else if (!/^\d{7,15}$/.test(mobileInput.value.trim().replace(/\s+/g, ''))) {
                    showError(mobileInput, 'Celular inválido (7-15 dígitos).');
                }
                clearError(ladaInput);
                const ladaVal = ladaInput.value.trim();
                if (ladaVal && (!/^\d+$/.test(ladaVal) || ladaVal.length > 4)) showError(ladaInput, 'Lada inválida.');
                clearError(phoneInput);
                const phoneVal = phoneInput.value.trim();
                if (phoneVal && !/^\d{7,15}$/.test(phoneVal.replace(/\s+/g, ''))) showError(phoneInput, 'Teléfono fijo inválido.');
                clearError(emailCompanyInput);
                if (!emailCompanyInput.value.trim()) {
                    showError(emailCompanyInput, 'Correo de empresa es obligatorio.');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCompanyInput.value.trim())) {
                    showError(emailCompanyInput, 'Formato de correo inválido.');
                }
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
                    role: 'ADMIN',
                });
            });
        });
        window.FlowWare.Utils.State.save('flowWareConfig.users', users);
    }

    loadStep3State() {
        if (!this.userAssignmentsContainer) return;
        this.renderUserAssignments();
        const usersData = window.FlowWare.Utils.State.load('flowWareConfig.users');
        if (usersData && usersData.length > 0) {
            usersData.forEach(userData => {
                this.addUserFormToWarehouse(userData.warehouseId, userData);
            });
        }
    }
    // --- Fin Lógica Paso 3 ---

    // --- Lógica específica del Paso 4: Workflows Generales ---
    initializeStep4() {
        console.log("Initializing Step 4: General Workflows");
        this.step4ErrorMessage = document.getElementById('step4-error-message');
        this.populateWorkflowPalettes();
        this.setupWorkflowInteractionHandlers();
        this.loadStep4State();
        this.populateWarehouseAssignmentCheckboxes();
    }

    populateWorkflowPalettes() {
        const nodeTypes = window.FlowWare.NODE_TYPES;
        if (!nodeTypes) {
            console.error("FlowWare.NODE_TYPES no está definido.");
            return;
        }
        const selects = document.querySelectorAll('.workflow-node-select');
        selects.forEach(select => {
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            const flowType = select.dataset.flowType;
            let relevantNodeCategories = ['action', 'notification'];
            for (const typeKey in nodeTypes) {
                if (!relevantNodeCategories.includes(typeKey)) continue;
                const typeData = nodeTypes[typeKey];
                for (const subtypeKey in typeData.subtypes) {
                    const subtypeData = typeData.subtypes[subtypeKey];
                    const option = document.createElement('option');
                    option.value = `${typeKey}.${subtypeKey}`;
                    option.textContent = `${subtypeData.name}`;
                    option.dataset.icon = subtypeData.icon || '⚙️';
                    option.dataset.type = typeKey;
                    select.appendChild(option);
                }
            }
        });
    }

    setupWorkflowInteractionHandlers() {
        document.querySelectorAll('.add-workflow-node-btn:not(.specific-btn)').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (event) => {
                const flowType = event.target.dataset.flowType;
                const select = document.querySelector(`.workflow-node-select:not(.specific-select)[data-flow-type="${flowType}"]`);
                if (select && select.value) {
                    const selectedOption = select.options[select.selectedIndex];
                    const [type, subtype] = select.value.split('.');
                    const icon = selectedOption.dataset.icon;
                    const name = selectedOption.textContent;
                    let defaultConfig = { name: name, description: window.FlowWare.NODE_TYPES[type]?.subtypes[subtype]?.desc || '' };
                    if (subtype === 'etiquetar') {
                        defaultConfig.tipoEtiqueta = 'codigo_barras';
                        defaultConfig.nivelTrazabilidad = 'pallet';
                    }
                    this.addWorkflowBlock(flowType, type, subtype, name, icon, null, defaultConfig);
                    select.value = "";
                    this.runWorkflowValidations(flowType);
                } else {
                    window.FlowWare.NotificationManager.show("Por favor, seleccione una acción de la lista.", "warning");
                }
            });
        });
        this.setupDragAndDropForWorkflowContainers();
    }

    addWorkflowBlock(flowType, type, subtype, name, icon, blockId = null, config = {}) {
        const container = document.querySelector(`.workflow-blocks-container[data-flow-type="${flowType}"]:not(.specific-blocks-container)`);
        if (!container) return;
        const currentBlockId = blockId || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const blockHTML = `
            <div class="workflow-block" draggable="true" data-block-id="${currentBlockId}" data-type="${type}" data-subtype="${subtype}">
                <span class="node-icon">${icon || '⚙️'}</span>
                <span class="block-name">${this.escapeHTML(name)}</span>
                <button type="button" class="remove-block-btn" title="Eliminar bloque">&times;</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', blockHTML);
        const newBlock = container.querySelector(`.workflow-block[data-block-id="${currentBlockId}"]`);
        newBlock.dataset.config = JSON.stringify(config || {});
        newBlock.querySelector('.remove-block-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            newBlock.remove();
            this.runWorkflowValidations(flowType);
        });
        newBlock.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', currentBlockId);
            event.target.classList.add('dragging');
        });
        newBlock.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
        });
        newBlock.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-block-btn')) return;
            this.configureWorkflowBlock(newBlock);
        });
    }

    configureWorkflowBlock(blockElement, isSpecific = false) { // Añadido isSpecific
        const type = blockElement.dataset.type;
        const subtype = blockElement.dataset.subtype;
        const blockNameElement = blockElement.querySelector('.block-name');
        let blockName = blockNameElement.textContent;
        let currentConfig = {};
        try {
            currentConfig = JSON.parse(blockElement.dataset.config || '{}');
        } catch (e) { console.error("Error parsing block config", e); currentConfig = {}; }
        let configChanged = false;

        if (blockElement.classList.contains('inherited')) {
            window.FlowWare.NotificationManager.show("Los bloques heredados no se pueden configurar directamente aquí. Modifique el workflow general.", "info");
            return;
        }

        if (subtype === 'etiquetar') {
            const newTipoEtiqueta = prompt("Tipo de Etiqueta (codigo_barras, qr, rfid):", currentConfig.tipoEtiqueta || 'codigo_barras');
            if (newTipoEtiqueta !== null) { currentConfig.tipoEtiqueta = newTipoEtiqueta; configChanged = true; }
            const newNivelTrazabilidad = prompt("Nivel de Trazabilidad (pallet, caja, subpaquete):", currentConfig.nivelTrazabilidad || 'pallet');
            if (newNivelTrazabilidad !== null) { currentConfig.nivelTrazabilidad = newNivelTrazabilidad; configChanged = true; }
        } else {
            const newBlockDisplayName = prompt(`Nuevo nombre para "${blockName}":`, currentConfig.name || blockName);
            if (newBlockDisplayName !== null && newBlockDisplayName.trim() !== "") {
                currentConfig.name = newBlockDisplayName.trim();
                blockNameElement.textContent = this.escapeHTML(currentConfig.name);
                configChanged = true;
            }
        }
        if (configChanged) {
            blockElement.dataset.config = JSON.stringify(currentConfig);
            window.FlowWare.NotificationManager.show(`Configuración de "${blockName}" actualizada.`, "success");

            const flowTypeContainer = blockElement.closest('.workflow-blocks-container');
            const flowType = flowTypeContainer.dataset.flowType;
            const generalFlowType = flowTypeContainer.dataset.generalFlowType; // Para específicos

            if (isSpecific) {
                 const targetId = this.selectedProductId || this.selectedProviderId;
                 this.runSpecificWorkflowValidations(targetId, generalFlowType || flowType.replace('-especifico',''));
            } else {
                this.runWorkflowValidations(flowType);
            }
        }
    }

    setupDragAndDropForWorkflowContainers() {
        const containers = document.querySelectorAll('.workflow-blocks-container:not(.specific-blocks-container)');
        containers.forEach(container => {
            const newContainer = container.cloneNode(false);
            while(container.firstChild) newContainer.appendChild(container.firstChild);
            container.parentNode.replaceChild(newContainer, container);
            newContainer.addEventListener('dragover', (event) => {
                event.preventDefault();
                const afterElement = this.getDragAfterElement(newContainer, event.clientY);
                const draggingBlock = document.querySelector('.workflow-block.dragging:not(.specific-block)');
                if (draggingBlock && draggingBlock.closest('.workflow-blocks-container') === newContainer) {
                    if (afterElement == null) { newContainer.appendChild(draggingBlock); }
                    else { newContainer.insertBefore(draggingBlock, afterElement); }
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.workflow-block:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    runWorkflowValidations(flowType) {
        const container = document.querySelector(`.workflow-blocks-container[data-flow-type="${flowType}"]:not(.specific-blocks-container)`);
        if (!container) return;
        const blocks = Array.from(container.querySelectorAll('.workflow-block'));
        let etiquetaConfig = null; let hasPicking = false; let hasPacking = false; let etiquetaBlock = null;

        for (const block of blocks) {
            const subtype = block.dataset.subtype;
            if (subtype === 'etiquetar') {
                etiquetaBlock = block;
                try { etiquetaConfig = JSON.parse(block.dataset.config || '{}'); }
                catch(e) { etiquetaConfig = { nivelTrazabilidad: 'pallet' }; }
            }
            if (subtype === 'picking') hasPicking = true;
            if (subtype === 'packing') hasPacking = true;
        }
        const errorMessageElement = document.getElementById('step4-error-message') || this.step4ErrorMessage;
        if ((hasPicking || hasPacking) && etiquetaConfig && etiquetaConfig.nivelTrazabilidad === 'pallet') {
            const msg = `Advertencia en Flujo ${flowType}: El nivel de trazabilidad 'Pallet' en 'Generar Etiqueta' puede ser insuficiente con Picking/Packing. Considere cambiarlo.`;
            if (errorMessageElement) errorMessageElement.textContent = msg;
            if (etiquetaBlock && confirm(msg + "\n¿Desea cambiar el nivel de trazabilidad a 'Pallet -> Caja'?")) {
                etiquetaConfig.nivelTrazabilidad = 'caja';
                etiquetaBlock.dataset.config = JSON.stringify(etiquetaConfig);
                window.FlowWare.NotificationManager.show("Nivel de trazabilidad actualizado.", "info");
                if (errorMessageElement) errorMessageElement.textContent = '';
            } else {
                 window.FlowWare.NotificationManager.show(msg, "warning", 7000);
            }
        } else {
            if (errorMessageElement && errorMessageElement.textContent.includes(`Advertencia en Flujo ${flowType}`)) {
                errorMessageElement.textContent = '';
            }
        }
    }

    validateStep4() {
        let isValid = true;
        ['entrada', 'almacen', 'salida'].forEach(flowType => {
            this.runWorkflowValidations(flowType);
        });
        const assignedWarehouses = this.getSelectedWarehousesForGeneralWorkflow();
        const hasDefinedWorkflows = ['entrada', 'almacen', 'salida'].some(flowType => {
            const container = document.querySelector(`.workflow-blocks-container[data-flow-type="${flowType}"]:not(.specific-blocks-container)`);
            return container && container.children.length > 0;
        });
        if (hasDefinedWorkflows && assignedWarehouses.length === 0) {
            if (this.step4ErrorMessage) this.step4ErrorMessage.textContent = "Si define workflows, debe asignarlos al menos a un almacén.";
            isValid = false;
        } else {
            if (this.step4ErrorMessage && this.step4ErrorMessage.textContent.startsWith("Si define workflows")) {
                 this.step4ErrorMessage.textContent = "";
            }
        }
        return isValid;
    }

    saveStep4State() {
        const generalWorkflows = {
            entrada: this.getWorkflowBlocksData('entrada'),
            almacen: this.getWorkflowBlocksData('almacen'),
            salida: this.getWorkflowBlocksData('salida'),
            assignedWarehouses: this.getSelectedWarehousesForGeneralWorkflow()
        };
        window.FlowWare.Utils.State.save('flowWareConfig.generalWorkflows', generalWorkflows);
    }

    getWorkflowBlocksData(flowType, isSpecific = false) {
        const selector = isSpecific
            ? `.specific-blocks-container[data-general-flow-type="${flowType}"]`
            : `.workflow-blocks-container[data-flow-type="${flowType}"]:not(.specific-blocks-container)`;
        const container = document.querySelector(selector);
        if (!container) return [];
        const blocks = [];
        container.querySelectorAll('.workflow-block:not(.inherited)').forEach(blockElement => { // No guardar heredados
            blocks.push({
                id: blockElement.dataset.blockId,
                type: blockElement.dataset.type,
                subtype: blockElement.dataset.subtype,
                name: blockElement.querySelector('.block-name').textContent,
                icon: blockElement.querySelector('.node-icon').textContent,
                config: JSON.parse(blockElement.dataset.config || '{}')
            });
        });
        return blocks;
    }

    getSelectedWarehousesForGeneralWorkflow() {
        const selected = [];
        document.querySelectorAll('#warehouse-assignment-container input[type="checkbox"]:checked').forEach(checkbox => {
            selected.push(checkbox.value);
        });
        return selected;
    }

    loadStep4State() {
        const generalWorkflows = window.FlowWare.Utils.State.load('flowWareConfig.generalWorkflows');
        ['entrada', 'almacen', 'salida'].forEach(flowType => {
            const container = document.querySelector(`.workflow-blocks-container[data-flow-type="${flowType}"]:not(.specific-blocks-container)`);
            if(container) container.innerHTML = '';
            if (generalWorkflows && generalWorkflows[flowType]) {
                generalWorkflows[flowType].forEach(blockData => {
                    this.addWorkflowBlock(flowType, blockData.type, blockData.subtype, blockData.name, blockData.icon, blockData.id, blockData.config);
                });
            }
            this.runWorkflowValidations(flowType);
        });
        if (generalWorkflows && generalWorkflows.assignedWarehouses) {
            generalWorkflows.assignedWarehouses.forEach(warehouseId => {
                const checkbox = document.querySelector(`#warehouse-assign-${warehouseId}`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    populateWarehouseAssignmentCheckboxes() {
        const container = document.getElementById('warehouse-assignment-container');
        if (!container) return;
        const pElement = container.querySelector('p');
        const newContainer = container.cloneNode(false);
        if (pElement) newContainer.appendChild(pElement.cloneNode(true));
        container.parentNode.replaceChild(newContainer, container);
        this.warehouseAssignmentContainer = newContainer;
        const warehouses = window.FlowWare.Utils.State.load('flowWareConfig.warehouses') || [];
        if (warehouses.length === 0) {
            this.warehouseAssignmentContainer.insertAdjacentHTML('beforeend', '<p>No hay almacenes definidos para asignar.</p>');
            return;
        }
        warehouses.forEach(wh => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label for="warehouse-assign-${this.escapeHTML(wh.id)}">
                    <input type="checkbox" id="warehouse-assign-${this.escapeHTML(wh.id)}" name="assigned_warehouse" value="${this.escapeHTML(wh.id)}">
                    ${this.escapeHTML(wh.name)}
                </label>
            `;
            this.warehouseAssignmentContainer.appendChild(div);
        });
    }
    // --- Fin Lógica Paso 4 ---

    // --- Lógica específica del Paso 5: Proveedores, Productos y Workflows Específicos ---
    initializeStep5() {
        console.log("Initializing Step 5: Suppliers, Products, and Specific Workflows");
        this.providerForm = document.getElementById('wizard-provider-form');
        this.providerNameInput = document.getElementById('provider-name');
        this.providerIdInput = document.getElementById('provider-id');
        this.providerContactPersonInput = document.getElementById('provider-contact-person');
        this.providerEmailInput = document.getElementById('provider-email');
        this.providerPhoneInput = document.getElementById('provider-phone');
        this.addProviderBtn = document.getElementById('add-provider-btn');
        this.providersListElement = document.getElementById('providers-list');
        this.productForm = document.getElementById('wizard-product-form');
        this.productNameInput = document.getElementById('product-name');
        this.productSkuInput = document.getElementById('product-sku');
        this.productDescriptionInput = document.getElementById('product-description');
        this.addProductBtn = document.getElementById('add-product-btn');
        this.productsListElement = document.getElementById('products-list-for-provider');
        this.productManagementProviderNameSpan = document.getElementById('product-management-provider-name');
        this.specificWorkflowTargetNameSpan = document.getElementById('specific-workflow-target-name');
        this.step5WorkflowErrorMessage = document.getElementById('step5-workflow-error-message');
        this.step5ErrorMessage = document.getElementById('step5-error-message');
        this.providerSpecificContentElement = document.getElementById('provider-specific-content'); // Asegurar que se define
        this.selectedProviderAreaTitle = document.getElementById('selected-provider-area-title'); // Asegurar que se define

        this.providers = [];
        this.selectedProviderId = null;
        this.selectedProductId = null;
        this.specificWorkflowsData = {};

        if (this.addProviderBtn && !this.addProviderBtn.dataset.initialized) {
            this.addProviderBtn.addEventListener('click', () => this.handleAddProvider());
            this.addProviderBtn.dataset.initialized = "true";
        }
        if (this.addProductBtn && !this.addProductBtn.dataset.initialized) {
            this.addProductBtn.addEventListener('click', () => this.handleAddProduct());
            this.addProductBtn.dataset.initialized = "true";
        }

        this.setupSpecificWorkflowUI();
        this.loadStep5State();
    }

    setupSpecificWorkflowUI() {
        const specificSelects = document.querySelectorAll('.workflow-node-select.specific-select');
        specificSelects.forEach(select => {
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            const nodeTypes = window.FlowWare.NODE_TYPES;
            let relevantNodeCategories = ['action', 'notification'];
            for (const typeKey in nodeTypes) {
                if (!relevantNodeCategories.includes(typeKey)) continue;
                const typeData = nodeTypes[typeKey];
                for (const subtypeKey in typeData.subtypes) {
                    const subtypeData = typeData.subtypes[subtypeKey];
                    const option = document.createElement('option');
                    option.value = `${typeKey}.${subtypeKey}`;
                    option.textContent = `${subtypeData.name}`;
                    option.dataset.icon = subtypeData.icon || '⚙️';
                    option.dataset.type = typeKey;
                    select.appendChild(option);
                }
            }
        });
        document.querySelectorAll('.add-workflow-node-btn.specific-btn').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (event) => {
                const flowTypeRaw = event.target.dataset.flowType;
                const flowTypeClean = flowTypeRaw.replace('-especifico', '');
                const select = document.querySelector(`.workflow-node-select[data-flow-type="${flowTypeRaw}"]`);
                if (select && select.value) {
                    const selectedOption = select.options[select.selectedIndex];
                    const [type, subtype] = select.value.split('.');
                    const icon = selectedOption.dataset.icon;
                    const name = selectedOption.textContent;
                    let defaultConfig = { name: name, description: window.FlowWare.NODE_TYPES[type]?.subtypes[subtype]?.desc || '' };
                    if (subtype === 'etiquetar') {
                        defaultConfig.tipoEtiqueta = 'codigo_barras';
                        defaultConfig.nivelTrazabilidad = 'pallet';
                    }
                    const targetId = this.selectedProductId || this.selectedProviderId;
                    if (!targetId) {
                        window.FlowWare.NotificationManager.show("Seleccione un proveedor o producto para añadir acciones específicas.", "warning");
                        return;
                    }
                    this.addSpecificWorkflowBlock(targetId, flowTypeClean, type, subtype, name, icon, null, defaultConfig);
                    select.value = "";
                    this.runSpecificWorkflowValidations(targetId, flowTypeClean);
                } else {
                    window.FlowWare.NotificationManager.show("Por favor, seleccione una acción de la lista.", "warning");
                }
            });
        });
        this.setupDragAndDropForSpecificWorkflowContainers();
    }

    addSpecificWorkflowBlock(targetId, flowTypeClean, type, subtype, name, icon, blockId = null, config = {}) {
        const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowTypeClean}"]`);
        if (!container) {
            console.error(`Contenedor no encontrado para specific flow: ${flowTypeClean}`);
            return;
        }
        const currentBlockId = blockId || `sblock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const blockHTML = `
            <div class="workflow-block specific-block" draggable="true" data-block-id="${currentBlockId}" data-type="${type}" data-subtype="${subtype}">
                <span class="node-icon">${icon || '⚙️'}</span>
                <span class="block-name">${this.escapeHTML(name)}</span>
                <button type="button" class="remove-block-btn" title="Eliminar bloque específico">&times;</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', blockHTML);
        const newBlock = container.querySelector(`.workflow-block[data-block-id="${currentBlockId}"]`);
        newBlock.dataset.config = JSON.stringify(config || {});
        newBlock.querySelector('.remove-block-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            newBlock.remove();
            this.runSpecificWorkflowValidations(targetId, flowTypeClean);
        });
        newBlock.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', currentBlockId);
            event.target.classList.add('dragging');
        });
        newBlock.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
        });
        newBlock.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-block-btn')) return;
            if (event.target.closest('.workflow-block').classList.contains('inherited')) {
                 window.FlowWare.NotificationManager.show("Los bloques heredados no se pueden configurar directamente aquí. Modifique el workflow general o sobrescriba.", "info");
                return;
            }
            this.configureWorkflowBlock(newBlock, true);
        });
    }

    setupDragAndDropForSpecificWorkflowContainers() {
        const containers = document.querySelectorAll('.specific-blocks-container');
        containers.forEach(container => {
            const newContainer = container.cloneNode(false);
            while(container.firstChild) newContainer.appendChild(container.firstChild);
            container.parentNode.replaceChild(newContainer, container);
            newContainer.addEventListener('dragover', (event) => {
                event.preventDefault();
                const afterElement = this.getDragAfterElement(newContainer, event.clientY);
                const draggingBlock = document.querySelector('.workflow-block.dragging');
                if (draggingBlock && !draggingBlock.classList.contains('inherited') && draggingBlock.closest('.specific-blocks-container') === newContainer) {
                    if (afterElement == null) { newContainer.appendChild(draggingBlock); }
                    else { newContainer.insertBefore(draggingBlock, afterElement); }
                }
            });
        });
    }

    renderSpecificWorkflows(targetId, targetType ) {
        if (!targetId) return;
        const generalWorkflowsData = window.FlowWare.Utils.State.load('flowWareConfig.generalWorkflows');
        const specificWorkflowsForTarget = (this.specificWorkflowsData && this.specificWorkflowsData[targetId])
                                        ? this.specificWorkflowsData[targetId]
                                        : { entrada: [], almacen: [], salida: [] };
        ['entrada', 'almacen', 'salida'].forEach(flowKey => {
            const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowKey}"]`);
            if (!container) return;
            container.innerHTML = '';
            if (generalWorkflowsData && generalWorkflowsData[flowKey]) {
                generalWorkflowsData[flowKey].forEach(blockData => {
                    const inheritedBlockHTML = `
                        <div class="workflow-block inherited" data-block-id="inherited-${blockData.id}" data-type="${blockData.type}" data-subtype="${blockData.subtype}" data-config='${this.escapeHTML(JSON.stringify(blockData.config || {}))}'>
                            <span class="node-icon">${blockData.icon || '⚙️'}</span>
                            <span class="block-name">${this.escapeHTML(blockData.name)} (Heredado)</span>
                        </div>`;
                    container.insertAdjacentHTML('beforeend', inheritedBlockHTML);
                    const inheritedBlock = container.querySelector(`.workflow-block[data-block-id="inherited-${blockData.id}"]`);
                    if(inheritedBlock) {
                        inheritedBlock.addEventListener('click', () => {
                             window.FlowWare.NotificationManager.show("Este bloque es heredado del workflow general.", "info");
                        });
                    }
                });
            }
            if (specificWorkflowsForTarget[flowKey] && specificWorkflowsForTarget[flowKey].length > 0) {
                specificWorkflowsForTarget[flowKey].forEach(blockData => {
                    this.addSpecificWorkflowBlock(targetId, flowKey, blockData.type, blockData.subtype, blockData.name, blockData.icon, blockData.id, blockData.config);
                });
            }
            this.runSpecificWorkflowValidations(targetId, flowKey);
        });
    }

    runSpecificWorkflowValidations(targetId, flowTypeClean) {
        const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowTypeClean}"]`);
        if (!container) return;
        const blocks = Array.from(container.querySelectorAll('.workflow-block'));
        let etiquetaConfig = null; let hasPicking = false; let hasPacking = false; let etiquetaBlock = null;
        for (const block of blocks) {
            const subtype = block.dataset.subtype;
            if (subtype === 'etiquetar') {
                etiquetaBlock = block;
                try { etiquetaConfig = JSON.parse(block.dataset.config || '{}'); }
                catch(e) { etiquetaConfig = { nivelTrazabilidad: 'pallet' }; }
            }
            if (subtype === 'picking') hasPicking = true;
            if (subtype === 'packing') hasPacking = true;
        }
        const errorMessageElement = this.step5WorkflowErrorMessage || document.getElementById('step5-workflow-error-message');
        const provider = this.providers.find(p=>p.id === targetId);
        const targetName = provider ? provider.name : targetId; // Fallback a ID si no se encuentra el proveedor

        if ((hasPicking || hasPacking) && etiquetaConfig && etiquetaConfig.nivelTrazabilidad === 'pallet') {
            const msg = `Advertencia para ${this.escapeHTML(targetName)} (Flujo ${flowTypeClean}): Nivel 'Pallet' en 'Generar Etiqueta' puede ser insuficiente con Picking/Packing.`;
            if (errorMessageElement) errorMessageElement.textContent = msg;
            if (etiquetaBlock && !etiquetaBlock.classList.contains('inherited')) {
                if (confirm(msg + "\n¿Desea cambiar el nivel de trazabilidad de este 'Generar Etiqueta' a 'Pallet -> Caja'?")) {
                    etiquetaConfig.nivelTrazabilidad = 'caja';
                    etiquetaBlock.dataset.config = JSON.stringify(etiquetaConfig);
                    window.FlowWare.NotificationManager.show("Nivel de trazabilidad actualizado a 'Pallet -> Caja'.", "info");
                    if (errorMessageElement) errorMessageElement.textContent = '';
                }
            } else if (etiquetaBlock && etiquetaBlock.classList.contains('inherited')) {
                 window.FlowWare.NotificationManager.show(msg + " Considere modificar el workflow general o añadir un bloque 'Generar Etiqueta' específico con la trazabilidad adecuada.", "warning", 8000);
            } else {
                 window.FlowWare.NotificationManager.show(msg, "warning", 7000);
            }
        } else {
            if (errorMessageElement && errorMessageElement.textContent.includes(`Advertencia para ${this.escapeHTML(targetName)} (Flujo ${flowTypeClean})`)) {
                errorMessageElement.textContent = '';
            }
        }
    }

    handleAddProvider() {
        if (!this.providerForm) return;
        let isValid = true;
        const name = this.providerNameInput.value.trim();
        const id = this.providerIdInput.value.trim() || `prov-${Date.now()}`;
        const contactPerson = this.providerContactPersonInput.value.trim();
        const email = this.providerEmailInput.value.trim();
        const phone = this.providerPhoneInput.value.trim();
        const showError = (element, message) => {
            element.classList.add('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) errorDiv.textContent = message;
            isValid = false;
        };
        const clearError = (element) => {
            element.classList.remove('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) errorDiv.textContent = '';
        };
        clearError(this.providerNameInput);
        if (!name) {
            showError(this.providerNameInput, 'El nombre del proveedor es obligatorio.');
        }
        if (this.providerIdInput.value.trim() && this.providers.some(p => p.id === this.providerIdInput.value.trim())) {
             showError(this.providerIdInput, 'Este ID de proveedor ya existe.');
        } else {
            clearError(this.providerIdInput);
        }
        clearError(this.providerEmailInput);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError(this.providerEmailInput, 'Formato de email inválido.');
        }
        clearError(this.providerPhoneInput);
        if (phone && !/^\d{7,15}$/.test(phone.replace(/\s+/g, ''))) {
            showError(this.providerPhoneInput, 'Formato de teléfono inválido (7-15 dígitos).');
        }
        if (!isValid) {
            window.FlowWare.NotificationManager.show("Por favor corrija los errores en el formulario del proveedor.", "error");
            return;
        }
        const newProvider = { id, name, contactPerson, email, phone, products: [] };
        this.providers.push(newProvider);
        this.renderProvidersList();
        this.providerForm.reset();
        window.FlowWare.NotificationManager.show(`Proveedor "${name}" añadido.`, "success");
    }

    renderProvidersList() {
        if (!this.providersListElement) return;
        this.providersListElement.innerHTML = '';
        this.providers.forEach(provider => {
            const li = document.createElement('li');
            li.textContent = provider.name;
            li.dataset.providerId = provider.id;
            li.classList.toggle('selected', provider.id === this.selectedProviderId);
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Eliminar';
            removeBtn.className = 'btn-link remove-provider-btn';
            removeBtn.style.marginLeft = '10px';
            removeBtn.onclick = (event) => {
                event.stopPropagation();
                this.handleRemoveProvider(provider.id);
            };
            li.appendChild(removeBtn);
            li.addEventListener('click', () => this.handleSelectProvider(provider.id));
            this.providersListElement.appendChild(li);
        });
    }

    handleSelectProvider(providerId) {
        this.selectedProviderId = providerId;
        this.selectedProductId = null;
        this.renderProvidersList();
        const provider = this.providers.find(p => p.id === providerId);
        if (provider) {
            if(this.selectedProviderAreaTitle) this.selectedProviderAreaTitle.textContent = `Gestionar: ${this.escapeHTML(provider.name)}`;
            if(this.productManagementProviderNameSpan) this.productManagementProviderNameSpan.textContent = this.escapeHTML(provider.name);
            if(this.providerSpecificContentElement) this.providerSpecificContentElement.style.display = 'block';
            this.renderProductsList(providerId);
            if (this.specificWorkflowTargetNameSpan) this.specificWorkflowTargetNameSpan.textContent = `Proveedor: ${this.escapeHTML(provider.name)}`;
            this.renderSpecificWorkflows(providerId, 'provider'); // Renderizar workflows para el proveedor
        } else {
            if(this.providerSpecificContentElement) this.providerSpecificContentElement.style.display = 'none';
        }
    }

    handleRemoveProvider(providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        if (provider) {
            window.FlowWare.NotificationManager.show(`Proveedor "${this.escapeHTML(provider.name)}" eliminado.`, "info");
        }
        this.providers = this.providers.filter(p => p.id !== providerId);
        if (this.selectedProviderId === providerId) {
            this.selectedProviderId = null;
            if(this.selectedProviderAreaTitle) this.selectedProviderAreaTitle.textContent = 'Seleccione un Proveedor';
            if(this.providerSpecificContentElement) this.providerSpecificContentElement.style.display = 'none';
            if(this.productsListElement) this.productsListElement.innerHTML = '';
            if(this.specificWorkflowTargetNameSpan) this.specificWorkflowTargetNameSpan.textContent = 'N/A';
             // Limpiar contenedores de workflow específico
            ['entrada', 'almacen', 'salida'].forEach(flowKey => {
                const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowKey}"]`);
                if (container) container.innerHTML = '';
            });
        }
        this.renderProvidersList();
        // Eliminar datos de workflow específico del proveedor eliminado
        if (this.specificWorkflowsData && this.specificWorkflowsData[providerId]) {
            delete this.specificWorkflowsData[providerId];
        }
    }

    handleAddProduct() {
        if (!this.selectedProviderId) {
            window.FlowWare.NotificationManager.show("Por favor, seleccione un proveedor primero.", "warning");
            return;
        }
        if (!this.productForm) return;
        let isValid = true;
        const name = this.productNameInput.value.trim();
        const sku = this.productSkuInput.value.trim();
        const description = this.productDescriptionInput.value.trim();
        const showError = (element, message) => {
            element.classList.add('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) errorDiv.textContent = message;
            isValid = false;
        };
        const clearError = (element) => {
            element.classList.remove('invalid');
            const errorDiv = element.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('error-message')) errorDiv.textContent = '';
        };
        clearError(this.productNameInput);
        if (!name) {
            showError(this.productNameInput, 'El nombre del producto es obligatorio.');
        }
        clearError(this.productSkuInput);
        if (!sku) {
            showError(this.productSkuInput, 'El SKU del producto es obligatorio.');
        }
        const provider = this.providers.find(p => p.id === this.selectedProviderId);
        if (provider && provider.products.some(prod => prod.sku === sku)) {
            showError(this.productSkuInput, 'Este SKU ya existe para este proveedor.');
        }
        if (!isValid) {
            window.FlowWare.NotificationManager.show("Por favor corrija los errores en el formulario del producto.", "error");
            return;
        }
        const newProduct = { id: `prod-${Date.now()}`, name, sku, description };
        provider.products.push(newProduct);
        this.renderProductsList(this.selectedProviderId);
        this.productForm.reset();
        window.FlowWare.NotificationManager.show(`Producto "${name}" añadido a ${provider.name}.`, "success");
    }

    renderProductsList(providerId) {
        if (!this.productsListElement) return;
        this.productsListElement.innerHTML = '';
        const provider = this.providers.find(p => p.id === providerId);
        if (provider && provider.products && provider.products.length > 0) {
            provider.products.forEach(product => {
                const li = document.createElement('li');
                li.innerHTML = `${this.escapeHTML(product.name)} (SKU: ${this.escapeHTML(product.sku)})`;
                li.dataset.productId = product.id;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Eliminar';
                removeBtn.className = 'btn-link remove-product-btn';
                removeBtn.style.marginLeft = '10px';
                removeBtn.onclick = (event) => {
                    event.stopPropagation();
                    this.handleRemoveProduct(product.id, providerId);
                };
                li.appendChild(removeBtn);
                this.productsListElement.appendChild(li);
            });
        } else {
            this.productsListElement.innerHTML = '<li>No hay productos para este proveedor.</li>';
        }
    }

    handleRemoveProduct(productId, providerId) {
        const provider = this.providers.find(p => p.id === providerId);
        if (provider) {
            const product = provider.products.find(prod => prod.id === productId);
            if (product) {
                 window.FlowWare.NotificationManager.show(`Producto "${this.escapeHTML(product.name)}" eliminado.`, "info");
            }
            provider.products = provider.products.filter(p => p.id !== productId);
            this.renderProductsList(providerId);
        }
    }

    validateStep5() {
        console.log("Validating Step 5");
        if(this.step5ErrorMessage) this.step5ErrorMessage.textContent = "";
        // Validar que si hay workflows específicos definidos, el target (proveedor) aún exista
        if (this.selectedProviderId && this.specificWorkflowsData && this.specificWorkflowsData[this.selectedProviderId]) {
            const providerExists = this.providers.some(p => p.id === this.selectedProviderId);
            if (!providerExists) {
                // El proveedor para el que se estaban configurando workflows específicos fue eliminado
                // Limpiar los workflows específicos para este ID inválido
                delete this.specificWorkflowsData[this.selectedProviderId];
                 window.FlowWare.NotificationManager.show(`Los workflows específicos para un proveedor eliminado han sido descartados.`, "warning");
            }
        }
        // Aquí se podrían añadir más validaciones si fuera necesario,
        // por ejemplo, que cada workflow específico tenga al menos un bloque si no está vacío.
        return true;
    }

    saveStep5State() {
        console.log("Saving Step 5 state (Providers, Products, Specific Workflows)");
        // Guardar solo los bloques que no son heredados para los workflows específicos
        const specificWorkflowsToSave = {};
        if (this.specificWorkflowsData) {
            for (const targetId in this.specificWorkflowsData) {
                specificWorkflowsToSave[targetId] = {
                    entrada: this.getSpecificWorkflowBlocksData(targetId, 'entrada'),
                    almacen: this.getSpecificWorkflowBlocksData(targetId, 'almacen'),
                    salida: this.getSpecificWorkflowBlocksData(targetId, 'salida'),
                };
            }
        }

        const step5Data = {
            providers: this.providers.map(p => ({ ...p, products: p.products || [] })),
            selectedProviderId: this.selectedProviderId,
            selectedProductId: this.selectedProductId,
            specificWorkflows: specificWorkflowsToSave
        };
        window.FlowWare.Utils.State.save('flowWareConfig.step5Data', step5Data);
    }

    getSpecificWorkflowBlocksData(targetId, flowTypeClean) {
        const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowTypeClean}"]`);
        if (!container) return [];
        const blocks = [];
        // Asegurarse que solo se guardan los bloques específicos para el targetId actual
        // Esto es importante si la UI no se limpia completamente al cambiar de targetId antes de guardar.
        // Sin embargo, renderSpecificWorkflows ya limpia y reconstruye, así que esto debería ser correcto.
        container.querySelectorAll('.workflow-block:not(.inherited)').forEach(blockElement => {
             blocks.push({
                id: blockElement.dataset.blockId,
                type: blockElement.dataset.type,
                subtype: blockElement.dataset.subtype,
                name: blockElement.querySelector('.block-name').textContent,
                icon: blockElement.querySelector('.node-icon').textContent,
                config: JSON.parse(blockElement.dataset.config || '{}')
            });
        });
        return blocks;
    }


    loadStep5State() {
        console.log("Loading Step 5 state (Providers, Products, Specific Workflows)");
        const savedData = window.FlowWare.Utils.State.load('flowWareConfig.step5Data');
        if (savedData) {
            this.providers = (savedData.providers || []).map(p => ({ ...p, products: p.products || [] }));
            this.selectedProviderId = savedData.selectedProviderId || null;
            this.selectedProductId = savedData.selectedProductId || null;
            this.specificWorkflowsData = savedData.specificWorkflows || {};
        } else {
            this.providers = [];
            this.selectedProviderId = null;
            this.selectedProductId = null;
            this.specificWorkflowsData = {};
        }
        this.renderProvidersList();

        if (this.selectedProviderId) {
            this.handleSelectProvider(this.selectedProviderId); // Esto llamará a renderProductsList y renderSpecificWorkflows
        } else {
             if(this.selectedProviderAreaTitle) this.selectedProviderAreaTitle.textContent = 'Seleccione un Proveedor';
             if(this.providerSpecificContentElement) this.providerSpecificContentElement.style.display = 'none';
             if(this.productsListElement) this.productsListElement.innerHTML = '';
             // Limpiar también los contenedores de workflow específico si no hay proveedor seleccionado
             ['entrada', 'almacen', 'salida'].forEach(flowKey => {
                const container = document.querySelector(`.specific-blocks-container[data-general-flow-type="${flowKey}"]`);
                if (container) container.innerHTML = '';
            });
            if(this.specificWorkflowTargetNameSpan) this.specificWorkflowTargetNameSpan.textContent = 'N/A';

        }
    }
    // --- Fin Lógica Paso 5 ---

    finishWizard() {
        if (!this.validateCurrentStep()) {
            window.FlowWare.NotificationManager.show('Por favor, corrija los errores antes de finalizar.', 'error');
            return;
        }
        this.saveCurrentStepState();
        window.FlowWare.Utils.State.save('flowWareConfig.wizardCompleted', true);
        window.FlowWare.NotificationManager.show('🎉 Configuración inicial completada!', 'success');
        this.hideWizard();
    }
}

// La inicialización ahora se maneja desde FlowWareApp.init()
// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(() => {
//         if (window.FlowWare && window.FlowWare.Utils && window.FlowWare.NotificationManager) {
//             new WizardManager();
//         } else {
//             console.warn('FlowWare core components not ready for WizardManager, retrying...');
//             setTimeout(() => {
//                 if (window.FlowWare && window.FlowWare.Utils && window.FlowWare.NotificationManager) {
//                     new WizardManager();
//                 } else {
//                     console.error('Failed to initialize WizardManager: Core components missing.');
//                 }
//             }, 1000);
//         }
//     }, 200);
// });
