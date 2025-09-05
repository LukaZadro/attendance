const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
let currentOrganization = null;

// Initialize the database
const dbPath = path.join(__dirname, "..", "data", "attendance.db");
const db = new Database(dbPath);
db.exec(`
    CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        organization TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS members (
        member_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        organization TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INTEGER PRIMARY KEY,
        event_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        UNIQUE (event_id, member_id));
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
`);
console.log(db);
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

ipcMain.handle("load-view", async (_, viewFile) => {
    const fullPath = path.join(__dirname, "..", "renderer", "views", viewFile);
    try {
        return await fs.promises.readFile(fullPath, "utf8");
    } catch (err) {
        return `<p>Failed to load view: ${viewFile}</p>`;
    }
});

ipcMain.handle("get-all-members", (_, organization) => {
    const stmnt = db.prepare("SELECT * FROM members WHERE organization = ?");
    return stmnt.all(organization);
});

ipcMain.handle("get-all-events", (_, organization) => {
    const stmnt = db.prepare("SELECT * FROM events WHERE organization = ?");
    return stmnt.all(organization);
});

ipcMain.handle("get-member", (_, member_id) => {
    const getMember = db.prepare(
        "SELECT first_name, last_name FROM members WHERE member_id = ?"
    );
    return getMember.get(member_id);
});

ipcMain.handle("add-member", (_, first_name, last_name, organization) => {
    const insertMember = db.prepare(
        "INSERT INTO members (first_name, last_name, organization) VALUES (?, ?, ?)"
    );
    const checkStmnt = db.prepare(
        "SELECT * FROM members WHERE first_name = ? and last_name = ? and organization = ?"
    );
    const exists = checkStmnt.get(first_name, last_name, organization);
    if (exists) {
        return { success: false, message: "Member already exists" };
    }
    insertMember.run(first_name, last_name, organization);
    return { success: true, message: "New member added!" };
});

ipcMain.handle("delete-member", (_, member_id) => {
    const deleteMember = db.prepare("DELETE FROM members WHERE member_id = ?");
    const deleteMemberRecords = db.prepare(
        "DELETE FROM attendance WHERE member_id = ?"
    );
    deleteMember.run(member_id);
    deleteMemberRecords.run(member_id);
});

ipcMain.handle("add-event", (_, event_date, event_type, organization) => {
    const insertEvent = db.prepare(
        "INSERT INTO events (event_date, event_type, organization) VALUES(?,?,?)"
    );
    const result = insertEvent.run(event_date, event_type, organization);
    return {
        success: true,
        message: "New event added!",
        event_id: result.lastInsertRowid,
    };
});
ipcMain.handle("remove-event", (_, event_id) => {
    const removeEvent = db.prepare("DELETE FROM events WHERE event_id = ?");
    removeEvent.run(event_id);
});

ipcMain.handle("record-attendance", (_, event_id, present_members) => {
    const recordAttendance = db.prepare(
        "INSERT OR IGNORE INTO attendance (event_id, member_id) VALUES (?, ?)"
    );
    present_members.forEach((member) => {
        recordAttendance.run(event_id, member.member_id);
    });
});

ipcMain.handle("get-all-attendance", () => {
    const getAllAttendance = db.prepare("SELECT * FROM attendance");
    return getAllAttendance.all();
});

ipcMain.handle("get-member-event-count", (_, member_id, event_type) => {
    const getMemberAttendance = db.prepare(
        `SELECT COUNT(*) AS count 
        FROM attendance JOIN events ON attendance.event_id = events.event_id
        WHERE member_id = ? AND event_type = ?`
    );
    return getMemberAttendance.get(member_id, event_type).count;
});

ipcMain.handle("get-event-count", (_, event_type, organization) => {
    const getEventCount = db.prepare(
        `SELECT COUNT(*) AS count 
        FROM events
        WHERE event_type = ? AND organization = ?`
    );
    return getEventCount.get(event_type, organization).count;
});

ipcMain.handle("get-attended-events", (_, event_type, member_id) => {
    const getAttendedEvents = db.prepare(`SELECT * FROM 
            members 
            JOIN attendance ON attendance.member_id = members.member_id
            JOIN events ON attendance.event_id = events.event_id
            WHERE events.event_type = ? AND members.member_id = ?`);
    return getAttendedEvents.all(event_type, member_id);
});

ipcMain.handle("get-event-attendance", (_, event_id) => {
    const getEventAttendance = db.prepare(`SELECT * FROM 
            members 
            JOIN attendance ON attendance.member_id = members.member_id
            JOIN events ON attendance.event_id = events.event_id
            WHERE events.event_id = ?`)
    return getEventAttendance.all(event_id)
})

ipcMain.handle('get-event', (_, event_id) => {
    const getEvent = db.prepare(`SELECT * FROM events WHERE events.event_id = ?`)
    return getEvent.get(event_id)
})

ipcMain.handle('set-organization', (_, organization) => {
    currentOrganization = organization;
})

ipcMain.handle('get-organization', () => {
    return currentOrganization;
})

app.on("window-all-closed", () => {
    app.quit();
});
app.whenReady().then(() => {
    createWindow();
});
