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
    let organizations = await window.electronAPI.getAllOrganizations();

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
        organization = e.target.value;
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
        eventType = addEventTypeForm.eventType.value.trim();
        await window.electronAPI.addEventType(selectOrg.value, eventType);
        addEventTypeForm.reset();
        showEventTypes(organization);
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
            selectOrg.querySelectorAll("option").forEach((el) => {
                if ((el.value === selectOrg.value)) el.remove();
            });
            clearEventTypes();
            // selectOrg.innerHTML = "";
            // await showOrganizations();
            if (selectOrg.options.length > 0) {
                organization = selectOrg.options[0].value;
                await window.electronAPI.setSetting(
                    "currentOrganization",
                    organization
                );
                await showEventTypes(organization);
                selectOrg.value = organization;
                eventType = selectEventType.value;
                await window.electronAPI.setSetting(
                    "defaultEventType",
                    eventType
                );
                selectEventType.value = eventType;
            } else {
                selectEventType.innerHTML = "";
                selectOrg.innerHTML = "";
                organization = null;
                eventType = null;
                await window.electronAPI.setSetting(
                    "currentOrganization",
                    organization
                );
                await window.electronAPI.setSetting("defaultEventType", eventType);
            }
        }
        if (e.target.classList.contains("remove-event-type")) {
            const confirmEventTypeRemove = document.querySelector(
                ".remove-event-type-container"
            );
            eventType = selectEventType.value;
            if (
                eventType === null ||
                eventType === undefined ||
                eventType === ""
            ) {
                document.querySelector(".no-events-message").style.display =
                    "block";
                setTimeout(() => {
                    document.querySelector(".no-events-message").style.display =
                        "none";
                }, 3000);
                return;
            } else {
                confirmEventTypeRemove.style.display = "block";
                confirmEventTypeRemove.querySelector(
                    "h2"
                ).innerText = `Are you sure you want to permanently delete event type ${eventType.toUpperCase()}? This will NOT delete past events of this type but you wont be able to add new events of the same type.`;
                document.querySelector(
                    ".select-organization-container"
                ).style.display = "none";
            }
        }
        if (e.target.classList.contains("confirm-event-type-remove")) {
            await window.electronAPI.removeEventType(organization, eventType);
            document.querySelector(
                ".remove-event-type-container"
            ).style.display = "none";
            document.querySelector(
                ".select-organization-container"
            ).style.display = "block";
            selectEventType.innerHTML = "";
            clearEventTypes();
            showEventTypes(organization);
            eventType = selectEventType.value;
            await window.electronAPI.setSetting("defaultEventType", eventType);
            selectEventType.value = eventType;
        }
        if (e.target.classList.contains("cancel-event-type-remove")) {
            document.querySelector(
                ".remove-event-type-container"
            ).style.display = "none";
            document.querySelector(
                ".select-organization-container"
            ).style.display = "block";
        }
    });
    function clearEventTypes() {
        const options = document.querySelectorAll("#event-type option");
        options.forEach((el) => el.remove());
    }
    async function showOrganizations() {
        organizations = await window.electronAPI.getAllOrganizations();
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
