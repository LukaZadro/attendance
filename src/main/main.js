const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");
const PDFDocument = require("pdfkit-table");

// Initialize the database
const dbPath = path.join(__dirname, "..", "data", "attendance.db");
const db = new Database(dbPath);
db.exec(`
    CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        organization TEXT NOT NULL,
        extra_event BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (organization) REFERENCES organization(organization_name) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS members (
        member_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        organization TEXT NOT NULL,
        UNIQUE (first_name, last_name, organization)
        FOREIGN KEY (organization) REFERENCES organization(organization_name) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INTEGER PRIMARY KEY,
        event_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        UNIQUE (event_id, member_id));
    CREATE TABLE IF NOT EXISTS organization (
        organization_name TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT);
    CREATE TABLE IF NOT EXISTS organization_event_types (
        organization_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        PRIMARY KEY (organization_name, event_type),
        FOREIGN KEY (organization_name) REFERENCES organization(organization_name) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS organization_settings (
        organization_name TEXT PRIMARY KEY,
        setting_key TEXT NOT NULL,
        setting_value TEXT,
        FOREIGN KEY (organization_name) REFERENCES organization(organization_name) ON DELETE CASCADE);
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

ipcMain.handle("get-regular-events", (_, organization) => {
    const stmnt = db.prepare("SELECT * FROM events WHERE organization = ? AND extra_event = FALSE");
    return stmnt.all(organization);
});
ipcMain.handle("get-extra-events", () => {
    const stmnt = db.prepare("SELECT * FROM events WHERE extra_event = TRUE");
    return stmnt.all();
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

ipcMain.handle(
    "add-event",
    (_, event_date, event_type, organization, extra_event) => {
        const insertEvent = db.prepare(`
        INSERT INTO events (event_date, event_type, organization, extra_event) 
        VALUES(?,?,?,?)
    `);

        const result = insertEvent.run(
            event_date,
            event_type,
            organization,
            extra_event ? 1 : 0 // Convert boolean to SQLite integer
        );
        return {
            success: true,
            message: "New event added!",
            event_id: result.lastInsertRowid,
        };
    }
);
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

ipcMain.handle('get-all-events', (_, organization) => {
    const getAllEvents = db.prepare("SELECT * FROM events WHERE organization = ?");
    return getAllEvents.all(organization);
});

ipcMain.handle("get-member-regular-event-count", (_, member_id, event_type) => {
    const getMemberAttendance = db.prepare(
        `SELECT COUNT(*) AS count 
        FROM attendance JOIN events ON attendance.event_id = events.event_id
        WHERE member_id = ? AND event_type = ? AND events.extra_event = FALSE`
    );
    return getMemberAttendance.get(member_id, event_type).count;
});

ipcMain.handle("get-member-extra-event-count", (_, member_id, event_type) => {
    const getExtraMemberAttendance = db.prepare(
        `SELECT COUNT(*) AS count 
        FROM attendance JOIN events ON attendance.event_id = events.event_id
        WHERE member_id = ? AND event_type = ? AND events.extra_event = TRUE`
    );
    return getExtraMemberAttendance.get(member_id, event_type).count;
});

ipcMain.handle("get-regular-event-count", (_, event_type, organization) => {
    const getEventCount = db.prepare(
        `SELECT COUNT(*) AS count 
        FROM events
        WHERE event_type = ? AND organization = ? AND extra_event = FALSE`
    );
    return getEventCount.get(event_type, organization).count;
});


ipcMain.handle("get-total-event-count", (_, organization) => {
    const getTotalEventCount = db.prepare(
        `SELECT COUNT(*) AS count
        FROM events
        WHERE organization = ? AND extra_event = FALSE`
    );
    return getTotalEventCount.get(organization).count;
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
            WHERE events.event_id = ?`);
    return getEventAttendance.all(event_id);
});

ipcMain.handle("get-event", (_, event_id) => {
    const getEvent = db.prepare(
        `SELECT * FROM events WHERE events.event_id = ?`
    );
    return getEvent.get(event_id);
});

ipcMain.handle("show-save-dialog", async (_, defaultFileName) => {
    const result = await dialog.showSaveDialog({
        title: "Save PDF",
        defaultPath: defaultFileName,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    });
    return result.filePath;
});

ipcMain.handle("generate-pdf", async (_, filePath, content) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath); // write to PDF
        doc.pipe(stream);

        const table = {
            headers: [
                "First Name",
                "Last Name",
                "Rehearsals",
                "Concerts",
                "Reh. %",
                "Conc. %",
                "Total %",
            ],
            rows: content.map((member) => [
                member.first_name,
                member.last_name,
                member.rehearsals,
                member.concerts,
                member.rehearsalPercentage.toFixed(2),
                member.concertPercentage.toFixed(2),
                member.totalPercentage.toFixed(2),
            ]),
        };

        doc.table(table);
        doc.end();

        stream.on("finish", () =>
            resolve({ success: true, message: "PDF generated!" })
        );
        stream.on("error", (err) =>
            reject({ success: false, message: err.message })
        );
    });
});

ipcMain.handle("add-organization", (_, orgName) => {
    const insertOrg = db.prepare(
        "INSERT INTO organization (organization_name) VALUES (?)"
    );
    const checkStmnt = db.prepare(
        "SELECT * FROM organization WHERE organization_name = ?"
    );
    const exists = checkStmnt.get(orgName);
    if (exists) {
        return { success: false, message: "Organization already exists" };
    }
    insertOrg.run(orgName);
    return { success: true, message: "New organization added!" };
});

ipcMain.handle("delete-organization", (_, orgName) => {
    const deleteOrg = db.prepare(
        "DELETE FROM organization WHERE organization_name = ?"
    );
    deleteOrg.run(orgName);
});

ipcMain.handle("get-all-organizations", () => {
    const getAllOrgs = db.prepare("SELECT * FROM organization");
    return getAllOrgs.all();
});

ipcMain.handle("get-setting", (_, key) => {
    const getSetting = db.prepare(
        "SELECT setting_value FROM settings WHERE setting_key = ?"
    );
    const row = getSetting.get(key);
    return row ? row.setting_value : null;
});

ipcMain.handle("set-setting", (_, key, value) => {
    const insertSetting = db.prepare(`
        REPLACE INTO settings (setting_key, setting_value) 
        VALUES (?, ?)
    `);
    insertSetting.run(key, value);
});

ipcMain.handle("add-event-type", (_, organization_name, event_type) => {
    const insertEventType = db.prepare(`
        INSERT OR IGNORE INTO organization_event_types (organization_name, event_type)
        VALUES (?, ?)
    `);
    insertEventType.run(organization_name, event_type);
});

ipcMain.handle("get-event-types", (_, organization_name) => {
    const getEventTypes = db.prepare(`
        SELECT event_type FROM organization_event_types
        WHERE organization_name = ?
    `);
    return getEventTypes.all(organization_name).map((row) => row.event_type);
});

ipcMain.handle("get-extra-events-for-member", (_, member_id) => {
    const getExtraEvents = db.prepare(`
        SELECT *
        FROM events
        JOIN attendance ON events.event_id = attendance.event_id
        JOIN members ON attendance.member_id = members.member_id
        WHERE events.extra_event = TRUE AND attendance.member_id = ?
    `);
    return getExtraEvents.all(member_id);
});

ipcMain.handle("remove-event-type", (_, organization_name, event_type) => {
    const removeEventType = db.prepare(`
        DELETE FROM organization_event_types
        WHERE organization_name = ? AND event_type = ?
    `);
    removeEventType.run(organization_name, event_type);
});
app.on("window-all-closed", () => {
    app.quit();
});
app.whenReady().then(() => {
    createWindow();
});
