(async () => {
    const form = document.querySelector(".add-member-form")
    form.addEventListener('submit', sendNewMember)
    const selectOrg = document.querySelector('#select-organization');
    let organization = await window.electronAPI.getOrganization();
    selectOrg.value = organization;
    //Send new member info to main
    async function sendNewMember(e) {
        e.preventDefault()
        const fname = form.fname.value.toUpperCase().trim()
        const lname = form.lname.value.toUpperCase().trim()
        const organization =  document.querySelector('select[name="select-organization"]').value;
        console.log(organization)
        const result = await window.electronAPI.addMember(fname, lname, organization); 
        if (result && !result.success) {
            console.log("Member exists!");
        } else {
            console.log("Member added!");
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

