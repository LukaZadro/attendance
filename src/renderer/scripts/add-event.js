(async () => {
    const recordAttendance = document.querySelector(".check-members");
    const form = document.querySelector("form");
    const selectOrg = document.querySelector("#select-organization");
    const selectEventType = document.querySelector("#event-type");
    const extraEventCheckbox = document.querySelector("#extra-event");
    let organization = await window.electronAPI.getSetting(
        "currentOrganization"
    );
    let eventType = await window.electronAPI.getSetting("defaultEventType");
    showMembers(organization);
    await showEventTypes(organization);
    await showOrganizations();
    selectEventType.value = eventType;

    selectOrg.value = organization;
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
        const event_type = document.querySelector(
            'select[name="event-type"]'
        ).value;
        const organization = document.querySelector(
            'select[name="select-organization"]'
        ).value;
        const extra_event = extraEventCheckbox.checked;
        const result = await window.electronAPI.addEvent(
            event_date,
            event_type,
            organization,
            extra_event
        );
        await window.electronAPI.recordAttendance(
            result.event_id,
            presentMembers
        );
        showMessage();
        form.reset();
    }
    selectOrg.addEventListener("change", async (e) => {
        organization = e.target.value;
        clearMembers();
        showMembers(organization);
        showEventTypes(organization);
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
    }
    async function showOrganizations() {
        const organizations = await window.electronAPI.getAllOrganizations();
        organizations.forEach((organization) => {
            const option = document.createElement("option");
            option.value = organization.organization_name;
            option.textContent = organization.organization_name;
            selectOrg.appendChild(option);
        });
    }
    function showMessage() {
        const message = document.querySelector(".message");
        message.style.display = "block";
        setTimeout(() => {
            message.style.display = "none";
        }, 3000);
    }
})();
