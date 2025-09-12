(async () => {
    const form = document.querySelector(".add-member-form")
    form.addEventListener('submit', sendNewMember)
    const selectOrg = document.querySelector('#select-organization');
    const organization = await window.electronAPI.getSetting('currentOrganization');
    

    const organizations = await window.electronAPI.getAllOrganizations();
    organizations.forEach(organization => {
        const option = document.createElement('option');
        option.value = organization.organization_name;
        option.textContent = organization.organization_name;
        selectOrg.appendChild(option);
    });

    selectOrg.value = organization;
    async function sendNewMember(e) {
        e.preventDefault()
        const fname = form.fname.value.toUpperCase().trim()
        const lname = form.lname.value.toUpperCase().trim()
        const organization =  document.querySelector('select[name="select-organization"]').value;
        const result = await window.electronAPI.addMember(fname, lname, organization); 
        if (result && !result.success) {
            console.log("Member exists!");
        } else {
            showMessage()
            form.reset()
        } 
    }
    selectOrg.addEventListener("change", async (e) => {
        organization = e.target.value;
    });
    function showMessage() {
        const message = document.querySelector(".message")
        message.style.display = "block"
        setTimeout(() => {
            message.style.display = "none"
        }, 3000);
    }
})();

