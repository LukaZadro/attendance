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
    let organization = await window.electronAPI.getOrganization();
    let member_id = null;
    let member = null;
    showMembers(organization);
    const organizations = await window.electronAPI.getAllOrganizations();
    organizations.forEach(organization => {
        const option = document.createElement('option');
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
            membersContainer.style.display = "none";
            memberStatsContainer.style.display = "block";
            const totalRehearsals = await window.electronAPI.getEventCount(
                "rehearsal",
                organization
            );
            const totalConcerts = await window.electronAPI.getEventCount(
                "concert",
                organization
            );
            const memberRehearsals =
                await window.electronAPI.getMemberEventCount(
                    member_id,
                    "rehearsal"
                ); //ovisno o opcijama koje postoje
            const memberConcerts = await window.electronAPI.getMemberEventCount(
                member_id,
                "concert"
            );
            const memberName = await window.electronAPI.getMember(member_id);
            memberStatsContainer.insertAdjacentHTML(
                "afterbegin",
                `<div id='info-${member_id}'>
                    <h2>Stats for ${memberName.first_name} ${
                    memberName.last_name
                }</h2>
                    <h3>rehearsals: ${memberRehearsals}   rehearsal percentage: ${
                    totalRehearsals !== 0
                        ? ((memberRehearsals / totalRehearsals) * 100).toFixed(
                              2
                          )
                        : 0
                }% </h3>
                    <h3>concerts: ${memberConcerts}   concert percentage: ${
                    totalConcerts !== 0
                        ? ((memberConcerts / totalConcerts) * 100).toFixed(2)
                        : 0
                }% </h3>
                <h3>Total: ${
                    totalRehearsals + totalConcerts !== 0
                        ? (
                              ((memberRehearsals + memberConcerts) /
                                  (totalRehearsals + totalConcerts)) *
                              100
                          ).toFixed(2)
                        : 0
                }%</h3>
                </div>`
            );
            window.electronAPI
                .getAttendedEvents("rehearsal", member_id)
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
            window.electronAPI
                .getAttendedEvents("concert", member_id)
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
        }
        if (e.target.classList.contains("download-button")) {
            const members = await window.electronAPI.getAllMembers(
                organization
            );
            const stats = await Promise.all(
                members.map(async (member) => {
                    const rehearsals =
                        await window.electronAPI.getMemberEventCount(
                            member.member_id,
                            "rehearsal"
                        );
                    const concerts =
                        await window.electronAPI.getMemberEventCount(
                            member.member_id,
                            "concert"
                        );
                    const totalRehearsals =
                        await window.electronAPI.getEventCount(
                            "rehearsal",
                            organization
                        );
                    const totalConcerts =
                        await window.electronAPI.getEventCount(
                            "concert",
                            organization
                        );
                    const rehearsalPercentage = totalRehearsals
                        ? (rehearsals / totalRehearsals) * 100
                        : 0;
                    const concertPercentage = totalConcerts
                        ? (concerts / totalConcerts) * 100
                        : 0;
                    const totalPercentage =
                        totalRehearsals + totalConcerts
                            ? ((rehearsals + concerts) /
                                  (totalRehearsals + totalConcerts)) *
                              100
                            : 0;
                    return {
                        ...member,
                        rehearsals,
                        concerts,
                        rehearsalPercentage,
                        concertPercentage,
                        totalPercentage
                    };
                })
            );
            console.log(stats);
            const filePath = await window.electronAPI.showSaveDialog(
                "member_stats_" + new Date().toLocaleDateString('de-DE') + ".pdf"
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
    function clearMembers() {
        const members = document.querySelectorAll(".member");
        members.forEach((el) => {
            el.remove();
        });
    }
})();
