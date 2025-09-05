(async () => {
    const eventsContainer = document.querySelector(".events-container");
    const confirmContainer = document.querySelector('.confirm-event-container');
    const eventAttendanceContainer = document.querySelector(".event-attendance-container");
    const selectOrg = document.querySelector('#select-organization');
    let organization = await window.electronAPI.getOrganization();
    selectOrg.value = organization;
    let event_id = null;
    let event = null;
    showEvents(organization);  
    document.addEventListener("click", async (e) => {
         if (e.target.classList.contains("delete-event-button")) {
            event_id = e.target.dataset.eventId;
            event = e.target.closest(".event")
            eventsContainer.style.display = 'none'
            confirmContainer.style.display = 'block'
         }
         if (e.target.classList.contains("confirm-event-delete")) {
            await window.electronAPI.removeEvent(event_id);
            event.remove(); // Remove the member from DOM
            eventsContainer.style.display = "block";
            confirmContainer.style.display = "none";
        }
        if (e.target.classList.contains("cancel-event-delete")) {
            eventsContainer.style.display = "block";
            confirmContainer.style.display = "none";
        }
        if (e.target.classList.contains("see-event-attendance")) {
            event_id = e.target.dataset.eventId;
            eventsContainer.style.display = 'none'
            eventAttendanceContainer.style.display = 'block'
            const attendedMembers = await electronAPI.getEventAttendance(event_id)
            const eventInfo = await electronAPI.getEvent(event_id)
            console.log(eventInfo)
            document.querySelector('.event-info').textContent = 
                    `Attendance for ${eventInfo.event_type} ${eventInfo.event_date}`
            attendedMembers.forEach(member => {
                eventAttendanceContainer.insertAdjacentHTML('beforeend',
                    `<div class='member'>${member.first_name} ${member.last_name}</div>`)
            })
        }
        if (e.target.classList.contains("return-events-button")) {
            eventsContainer.style.display = "block";
            eventAttendanceContainer.style.display = "none";
            const members = document.querySelectorAll('.member')
            members.forEach(() => {
                document.querySelector('.member').remove()
            })
                
        }
    });
    selectOrg.addEventListener('change', async (e) => {
        organization = e.target.value;
        clearEvents()
        showEvents(organization)
    })
    function showEvents(organization) {
        window.electronAPI.getAllEvents(organization).then((events) => {
        events.forEach((event) => {
            eventsContainer.insertAdjacentHTML(
                "beforeend",
                `<div class="event">
                Date: ${event.event_date}
                Type: ${event.event_type}
                <button class='see-event-attendance' data-event-id="${event.event_id}"> Event attendance </button>
                <button class="delete-event-button" data-event-id="${event.event_id}"> Delete </button>
            </div>`
            );
        });
    });
    }
    function clearEvents() {
        const events = document.querySelectorAll('.event')
        events.forEach(() => {
            document.querySelector('.event').remove()
        })
    }
})();