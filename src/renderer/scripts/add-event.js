(async () => {
    const recordAttendance = document.querySelector(".check-members");
    const form = document.querySelector("form");
    const members = await window.electronAPI.getAllMembers();
    members.forEach((member) => {
        recordAttendance.insertAdjacentHTML(
            "beforeend",
            `<div class="member-check">
            <input type="checkbox" name="attendance" value="${member.member_id}" checked>
            <label for="student-checkbox">${member.first_name} ${member.last_name}</label>
        </div>`
        );
    });

    form.addEventListener("submit", submitAttendance);
    async function submitAttendance(e) {
        e.preventDefault();
        const presentMembers = Array.from(
            document.querySelectorAll('input[name="attendance"]')
        ).map(checkbox => ({
            member_id: checkbox.value,
            first_name: checkbox.nextElementSibling.textContent.trim().split(" ")[0],
            last_name: checkbox.nextElementSibling.textContent.trim().split(" ")[1],
            attended: checkbox.checked
        })).filter(member => member.attended)
        const event_date = document.querySelector('input[name="date"]').value;
        const event_type = document.querySelector('select[name="type"]').value;
        const result = await window.electronAPI.addEvent(event_date, event_type)
        await window.electronAPI.recordAttendance(result.event_id, presentMembers)
        //const attendence = await window.electronAPI.getAllAttendance()
        form.reset()
    }
})();
