const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    loadView: (viewFile) => ipcRenderer.invoke('load-view', viewFile),
    getAllMembers: (organization) => ipcRenderer.invoke('get-all-members', organization),
    getAllEvents: (organization) => ipcRenderer.invoke('get-all-events', organization),
    addMember: (first_name, last_name, organization) => ipcRenderer.invoke('add-member', first_name, last_name, organization),
    getMember: (member_id) => ipcRenderer.invoke('get-member', member_id),
    deleteMember: (first_name, last_name, member_id) => ipcRenderer.invoke('delete-member', first_name, last_name, member_id),
    addEvent: (event_date, event_type, organization) => ipcRenderer.invoke('add-event', event_date, event_type, organization),
    removeEvent: (event_id) => ipcRenderer.invoke('remove-event', event_id),
    recordAttendance: (event_id, present_members) => ipcRenderer.invoke('record-attendance', event_id, present_members),
    getAllAttendance: () => ipcRenderer.invoke('get-all-attendance'),
    getMemberEventCount: (member_id, event_type) => ipcRenderer.invoke('get-member-event-count', member_id, event_type),
    getEventCount: (event_type, organization) => ipcRenderer.invoke('get-event-count', event_type, organization),
    getAttendedEvents: (event_type, member_id) => ipcRenderer.invoke('get-attended-events', event_type, member_id),
    getEventAttendance: (event_id) => ipcRenderer.invoke('get-event-attendance', event_id),
    getEvent: (event_id) => ipcRenderer.invoke('get-event', event_id),
    setOrganization: (organization) => ipcRenderer.invoke('set-organization', organization),
    getOrganization: () => ipcRenderer.invoke('get-organization')
})