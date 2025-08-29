(() => {
    const form = document.querySelector(".add-member-form")
    form.addEventListener('submit', sendNewMember)

    //Send new member info to main
    async function sendNewMember(e) {
        e.preventDefault()
        const fname = form.fname.value.toUpperCase().trim()
        const lname = form.lname.value.toUpperCase().trim()
        const result = await window.electronAPI.addMember(fname, lname); // <-- get the result here
        if (result && !result.success) {
            console.log("Member exists!");
        } else {
            console.log("Member added!");
            form.reset()
        } 
    }
    function showMessage() {

    }
    function removeMessage() {
        
    }
})();

