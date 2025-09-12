(async () => {
    const selectOrg = document.querySelector("#select-organization");
    const addOrgForm = document.querySelector(".add-organization-form");
    const addEventTypeForm = document.querySelector(".add-event-type-form");
    const selectEventType = document.querySelector("#event-type");
    const orgAddedMessage = document.querySelector(
        ".organization-added-message"
    );
    const eventTypeAddedMessage = document.querySelector(
        ".event-type-added-message"
    );
    const deleteOrgConfirm = document.querySelector(
        ".delete-organization-confirm"
    );
    const finalDeleteConfirm = document.querySelector(".final-delete-confirm");
    const organizations = await window.electronAPI.getAllOrganizations();
    
    // Get the current organization from main process
    let organization = await window.electronAPI.getSetting(
        "currentOrganization"
    );
    showOrganizations();
    if (!organization) {
        organization = selectOrg.value; // fallback to the first option
        await window.electronAPI.setSetting(
            "currentOrganization",
            organization
        );
    }
    selectOrg.value = organization;

    
    let eventType = await window.electronAPI.getSetting("defaultEventType");
    showEventTypes(organization);
    if (!eventType) {
        eventType = selectEventType.value; // fallback to the first option
        await window.electronAPI.setSetting("defaultEventType", eventType);
    }
    selectEventType.value = eventType;

    selectOrg.addEventListener("change", async (e) => {
        const organization = e.target.value;
        await window.electronAPI.setSetting(
            "currentOrganization",
            organization
        );
        showEventTypes(organization);
    });
    selectEventType.addEventListener("change", async (e) => {
        eventType = e.target.value;
        await window.electronAPI.setSetting("defaultEventType", eventType);
    });
    addOrgForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orgName = addOrgForm.orgname.value.trim();
        await window.electronAPI.addOrganization(orgName);
        // Add new organization to the dropdown
        const option = document.createElement("option");
        option.value = orgName;
        option.textContent = orgName;
        selectOrg.appendChild(option);
        selectOrg.value = orgName;
        addOrgForm.reset();
        showMessage(orgAddedMessage);
    });
    addEventTypeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const eventType = addEventTypeForm.eventType.value.trim();
        await window.electronAPI.addEventType(selectOrg.value, eventType);
        addEventTypeForm.reset();
        showOrganizations();
        showMessage(eventTypeAddedMessage);
    });
    async function showEventTypes(organization) {
        selectEventType.innerHTML = ""; // Clear existing options
        const eventTypes = await window.electronAPI.getAllEventTypes(
            organization
        );
        eventTypes.forEach((type) => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            selectEventType.appendChild(option);
        });
        selectEventType.value = eventType;
    }
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-organization-button")) {
            document.querySelector(
                ".select-organization-container"
            ).style.display = "none";
            deleteOrgConfirm.style.display = "block";
            deleteOrgConfirm.querySelector(
                "h2"
            ).innerText = `Are you sure you want to permanently delete ${organization.toUpperCase()} and all its records?`;
        }
        if (e.target.classList.contains("confirm-organization-delete")) {
            deleteOrgConfirm.style.display = "none";
            finalDeleteConfirm.style.display = "block";
        }
        if (e.target.classList.contains("cancel-organization-delete")) {
            deleteOrgConfirm.style.display = "none";
            finalDeleteConfirm.style.display = "none";
            document.querySelector(
                ".select-organization-container"
            ).style.display = "block";
        }
        if (e.target.classList.contains("delete-anyway-button")) {
            window.electronAPI.deleteOrganization(selectOrg.value);
            deleteOrgConfirm.style.display = "none";
            finalDeleteConfirm.style.display = "none";
            document.querySelector(
                ".select-organization-container"
            ).style.display = "block";
            selectOrg.innerHTML = "";
            clearEventTypes();
            showOrganizations();
            organization = selectOrg.value;
            await window.electronAPI.setSetting(
                "currentOrganization",
                organization
            );
            showEventTypes(organization);
            selectOrg.value = organization;
            eventType = selectEventType.value;
            await window.electronAPI.setSetting("defaultEventType", eventType);
            selectEventType.value = eventType;
        }
    });
    function clearEventTypes() {
        const options = document.querySelectorAll("#event-type option");
        options.forEach((el) => el.remove());
    }
    function showOrganizations() {
        organizations.forEach((organization) => {
            const option = document.createElement("option");
            option.value = organization.organization_name;
            option.textContent = organization.organization_name;
            selectOrg.appendChild(option);
        });
        selectOrg.value = organization;
    }
    function showMessage(message) {
        message.style.display = "block";
        setTimeout(() => {
            message.style.display = "none";
        }, 3000);
    }
})();
