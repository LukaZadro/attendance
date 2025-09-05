(async () => {
    const displaySelected = document.querySelector('#display-selected-org');
    const selectOrg = document.querySelector('#select-organization');

    // Get the current organization from main process
    let organization = await window.electronAPI.getOrganization();
    if (!organization) {
        organization = selectOrg.value; // fallback to the first option
        await window.electronAPI.setOrganization(organization);
    }
    displaySelected.innerText = `Current organization: ${organization}`;
    selectOrg.value = organization;

    selectOrg.addEventListener('change', async (e) => {
        const organization = e.target.value;
        await window.electronAPI.setOrganization(organization);
        displaySelected.innerText = `Current organization: ${organization}`;
    });
})();
