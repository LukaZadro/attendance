(async () => {
    const recordAttendance = document.querySelector(".check-members");
    const form = document.querySelector("form");
    const selectOrg = document.querySelector("#select-organization");
    let organization = await window.electronAPI.getOrganization();
    selectOrg.value = organization;
    showMembers(organization);

    form.addEventListener("submit", submitAttendance);
    async function submitAttendance(e) {
        e.preventDefault();
        const presentMembers = Array.from(
            document.querySelectorAll('input[name="attendance"]')
        )
            .map((checkbox) => ({
                member_id: checkbox.value,
                first_name: checkbox.nextElementSibling.textContent
                    .trim()
                    .split(" ")[0],
                last_name: checkbox.nextElementSibling.textContent
                    .trim()
                    .split(" ")[1],
                attended: checkbox.checked,
            }))
            .filter((member) => member.attended);
        const event_date = document.querySelector('input[name="date"]').value;
        const event_type = document.querySelector('select[name="type"]').value;
        const organization = document.querySelector(
            'select[name="select-organization"]'
        ).value;
        console.log(organization);
        const result = await window.electronAPI.addEvent(
            event_date,
            event_type,
            organization
        );
        await window.electronAPI.recordAttendance(
            result.event_id,
            presentMembers
        );
        form.reset();
    }
    selectOrg.addEventListener("change", async (e) => {
        organization = e.target.value;
        clearMembers();
        showMembers(organization);
    });
    function showMembers(organization) {
        window.electronAPI.getAllMembers(organization).then((members) => {
            members.forEach((member) => {
                recordAttendance.insertAdjacentHTML(
                    "beforeend",
                    `<div class="member-check">
            <input type="checkbox" name="attendance" value="${member.member_id}" checked>
            <label for="student-checkbox">${member.first_name} ${member.last_name}</label>
        </div>`
                );
            });
        });
    }

    function clearMembers() {
        const members = document.querySelectorAll(".member-check");
        members.forEach((el) => {
           el.remove();
        });
    }
})();
