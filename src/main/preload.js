const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    loadView: (viewFile) => ipcRenderer.invoke('load-view', viewFile),
    getAllMembers: () => ipcRenderer.invoke('get-all-members'),
    getAllEvents: () => ipcRenderer.invoke('get-all-events'),
    addMember: (first_name, last_name) => ipcRenderer.invoke('add-member', first_name, last_name),
    getMember: (member_id) => ipcRenderer.invoke('get-member', member_id),
    deleteMember: (first_name, last_name, member_id) => ipcRenderer.invoke('delete-member', first_name, last_name, member_id),
    addEvent: (event_date, event_type) => ipcRenderer.invoke('add-event', event_date, event_type),
    removeEvent: (event_id) => ipcRenderer.invoke('remove-event', event_id),
    recordAttendance: (event_id, present_members) => ipcRenderer.invoke('record-attendance', event_id, present_members),
    getAllAttendance: () => ipcRenderer.invoke('get-all-attendance'),
    getMemberEventCount: (member_id, event_type) => ipcRenderer.invoke('get-member-event-count', member_id, event_type),
    getEventCount: (event_type) => ipcRenderer.invoke('get-event-count', event_type),
    getAttendedEvents: (event_type, member_id) => ipcRenderer.invoke('get-attended-events', event_type, member_id),
    getEventAttendance: (event_id) => ipcRenderer.invoke('get-event-attendance', event_id),
    getEvent: (event_id) => ipcRenderer.invoke('get-event', event_id)
})