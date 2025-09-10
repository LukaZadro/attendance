(async () => {
    const selectOrg = document.querySelector('#select-organization');
    const addOrgForm = document.querySelector('.add-organization-form');
    const message = document.querySelector('.message');
    
    const organizations = await window.electronAPI.getAllOrganizations();
    organizations.forEach(organization => {
        const option = document.createElement('option');
        option.value = organization.organization_name;
        option.textContent = organization.organization_name;
        selectOrg.appendChild(option);
    });
    // Get the current organization from main process
    let organization = await window.electronAPI.getOrganization();
    if (!organization) {
        organization = selectOrg.value; // fallback to the first option
        await window.electronAPI.setOrganization(organization);
    }
    selectOrg.value = organization;

    selectOrg.addEventListener('change', async (e) => {
        const organization = e.target.value;
        await window.electronAPI.setOrganization(organization);
    });
    addOrgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const orgName = addOrgForm.orgname.value.trim();
        await window.electronAPI.addOrganization(orgName);
        // Add new organization to the dropdown
        const option = document.createElement('option');
        option.value = orgName;
        option.textContent = orgName;
        selectOrg.appendChild(option);
        selectOrg.value = orgName;
        addOrgForm.reset();
        showMessage();
    });
    function showMessage() {
        message.style.display = "block"
        setTimeout(() => {
            message.style.display = "none"
        }, 3000);
    }
})();