(async () => {
    const membersContainer = document.querySelector(".members-container");
    const confirmContainer = document.querySelector(
        ".confirm-member-container"
    );

    const seeMembersContainer = document.querySelector(
        ".see-members-container"
    );
    const memberStatsContainer = document.querySelector(
        ".member-stats-container"
    );
    const selectOrg = document.querySelector("#select-organization");
    let organization = await window.electronAPI.getSetting(
        "currentOrganization"
    );
    let member_id = null;
    let member = null;
    let memberInfo = null;
    let totalAttendance = null;
    let eventAttendance = null;
    let totalEvents = null;
    showMembers(organization);
    const organizations = await window.electronAPI.getAllOrganizations();
    organizations.forEach((organization) => {
        const option = document.createElement("option");
        option.value = organization.organization_name;
        option.textContent = organization.organization_name;
        selectOrg.appendChild(option);
    });
    selectOrg.value = organization;
    seeMembersContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-member-button")) {
            member = e.target.closest(".member");
            member_id = e.target.id;
            confirmContainer.style.display = "block";
            confirmContainer.querySelector(
                "h2"
            ).innerText = `Are you sure you want to permanently delete ${
                member.querySelector("h3").innerText
            } and their records?`;
            membersContainer.style.display = "none";
        }
        if (e.target.classList.contains("confirm-member-delete")) {
            await window.electronAPI.deleteMember(member_id);
            member.remove(); // Remove the member from DOM
            membersContainer.style.display = "block";
            confirmContainer.style.display = "none";
        }
        if (e.target.classList.contains("cancel-member-delete")) {
            membersContainer.style.display = "block";
            confirmContainer.style.display = "none";
        }
        if (e.target.classList.contains("see-member-stats")) {
            member_id = e.target.id;
            showMemberStats(member_id);
        }
        if (e.target.classList.contains("download-button")) {
            const members = await window.electronAPI.getAllMembers(
                organization
            );
            const stats = await Promise.all(
                members.map(async (member) => {
                    return {};
                })
            );
            console.log(stats);
            const filePath = await window.electronAPI.showSaveDialog(
                "member_stats_" +
                    new Date().toLocaleDateString("de-DE") +
                    ".pdf"
            );
            if (!filePath) return;
            console.log(filePath);
            const result = await window.electronAPI.generatePDF(
                filePath,
                stats
            );
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        }
        if (e.target.classList.contains("return-button")) {
            membersContainer.style.display = "block";
            memberStatsContainer.style.display = "none";
            document.querySelector(`#info-${member_id}`).remove();
            document.querySelectorAll(".event").forEach((e) => e.remove());
        }
    });
    selectOrg.addEventListener("change", async (e) => {
        organization = e.target.value;
        clearMembers();
        showMembers(organization);
    });
    function showMembers(organization) {
        window.electronAPI.getAllMembers(organization).then((members) => {
            members.forEach((member) => {
                membersContainer.insertAdjacentHTML(
                    "beforeend",
                    `<div class="member">
                <h3>${member.first_name} ${member.last_name}</h3>
                <button class='see-member-stats' id="${member.member_id}"> See stats </button>
                <button class="delete-member-button" id="${member.member_id}"> Delete </button>
            </div>`
                );
            });
        });
    }

    async function showMemberStats(member_id) {
        membersContainer.style.display = "none";
        memberStatsContainer.style.display = "block";
        console.log(
            await window.electronAPI.getExtraEventsForMember(member_id)
        );
        const memberName = await window.electronAPI.getMember(member_id);
        const eventTypes = await window.electronAPI.getAllEventTypes(
            organization
        );
        let totalRegularAttendance = 0;
        let totalExtraAttendance = 0;
        memberStatsContainer.insertAdjacentHTML(
            "afterbegin",
            `<div id='info-${member_id}'>
                    <h2>Stats for ${memberName.first_name} ${memberName.last_name}</h2>
                </div>`
        );
        memberInfo = document.querySelector(`#info-${member_id}`);
        totalEvents = await window.electronAPI.getTotalEventCount(organization);
        for (const type of eventTypes) {
            let regularEventCount = await window.electronAPI.getRegularEventCount(
                type,
                organization
            );

            let regularAttendance =
                await window.electronAPI.getMemberRegularEventCount(
                    member_id,
                    type
                );
            totalRegularAttendance += regularAttendance;
            let extraAttendance = await window.electronAPI.getMemberExtraEventCount(
                member_id,
                type
            );
            totalExtraAttendance += extraAttendance;
            console.log(regularAttendance, extraAttendance, type);
            if (
                extraAttendance === 0
            ) {
                memberInfo.insertAdjacentHTML(
                    "beforeend",
                    `<h3>${type}: ${regularAttendance} (${
                        regularAttendance
                            ? (
                                  (regularAttendance / regularEventCount) *
                                  100
                              ).toFixed(2)
                            : 0
                    }%)</h3>`
                );
            } else {
                memberInfo.insertAdjacentHTML(
                    "beforeend",
                    `<h3>${type}: ${regularAttendance} + ${extraAttendance} extra (${(
                        ((regularAttendance + extraAttendance) / regularEventCount) *
                        100
                    ).toFixed(2)}%)</h3>`
                );
            }
        }
        console.log(totalRegularAttendance, totalExtraAttendance);
        console.log(totalEvents);
        memberInfo.insertAdjacentHTML(
            "beforeend",
            `<h2>Total attendance: ${totalRegularAttendance} + ${totalExtraAttendance} (${
                (totalRegularAttendance + totalExtraAttendance) && totalEvents
                    ? (((totalRegularAttendance + totalExtraAttendance)/ totalEvents) * 100).toFixed(2)
                    : 0
            }%)</h2>`
        );

        eventTypes.forEach((type) => {
            window.electronAPI
                .getAttendedEvents(type, member_id)
                .then((events) => {
                    events.forEach((event) => {
                        memberStatsContainer.insertAdjacentHTML(
                            "beforeend",
                            `<div class="event">
                Date: ${event.event_date}
                Type: ${event.event_type}
            </div>`
                        );
                    });
                });
        });
    }
    function clearMembers() {
        const members = document.querySelectorAll(".member");
        members.forEach((el) => {
            el.remove();
        });
    }
})();
