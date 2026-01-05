// ==========================
// Screens
// ==========================
function showScreen(id) {
    const screens = [
        "welcome-screen",
        "login-screen",
        "register-screen",
        "stampcard-screen",
        "stampadded-screen",
        "freecoffee-screen",
        "profile-screen"
    ];

    screens.forEach(sid => {
        const el = document.getElementById(sid);
        if (el) el.style.display = (sid === id) ? "block" : "none";
    });
}

// ==========================
// Backend
// ==========================
const API_BASE = "http://localhost:3000";

// ==========================
// localStorage helpers
// ==========================
const LS_KEY = "digistamp_session_v1";

function saveSession() {
    localStorage.setItem(
        LS_KEY,
        JSON.stringify({ currentUserId, currentName, currentEmail, stamps })
    );
}

function clearSession() {
    localStorage.removeItem(LS_KEY);
}

function loadSession() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return false;

        const data = JSON.parse(raw);
        if (!data.currentUserId) return false;

        currentUserId = data.currentUserId;
        currentName = data.currentName || "";
        currentEmail = data.currentEmail || "";
        stamps = Number.isFinite(data.stamps) ? data.stamps : 0;

        return true;
    } catch {
        return false;
    }
}

// ==========================
// UX helpers (screen-based)
// ==========================
function getMsgBox(screen) {
    const map = {
        login: "login-msg",
        register: "register-msg",
        stampcard: "stamp-msg",
        freecoffee: "freecoffee-msg",
        profile: "profile-msg"
    };
    return document.getElementById(map[screen]);
}

function hideMsg(screen) {
    const box = getMsgBox(screen);
    if (box) box.style.display = "none";
}

function showMsg(screen, text, type = "info") {
    const box = getMsgBox(screen);
    if (!box) {
        alert(text);
        return;
    }

    box.style.display = "block";
    box.textContent = text;

    const styles = {
        info:  { background: "#eef2ff", border: "1px solid #c7d2fe", color: "#1e1b4b" },
        ok:    { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#064e3b" },
        warn:  { background: "#fffbeb", border: "1px solid #fcd34d", color: "#78350f" },
        error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#7f1d1d" }
    };

    const s = styles[type] || styles.info;
    box.style.background = s.background;
    box.style.border = s.border;
    box.style.color = s.color;

    if (type !== "error") {
        window.clearTimeout(showMsg._t);
        showMsg._t = window.setTimeout(() => {
            box.style.display = "none";
        }, 2500);
    }
}

function setLoading(btn, isLoading, text = "Bitte warten...") {
    if (!btn) return;
    if (isLoading) {
        btn.dataset._oldText = btn.textContent;
        btn.textContent = text;
        btn.disabled = true;
    } else {
        btn.textContent = btn.dataset._oldText || btn.textContent;
        btn.disabled = false;
        delete btn.dataset._oldText;
    }
}

// ==========================
// App-State
// ==========================
let currentUserId = null;
let currentName = "";
let currentEmail = "";
let stamps = 0;
const maxStamps = 5;

// ==========================
// UI Update
// ==========================
function updateStampCard() {
    const helloNameEl = document.getElementById("hello-name");
    const stampTextEl = document.getElementById("stamp-text");
    const freeCoffeeText = document.getElementById("freecoffee-text");
    const circles = document.querySelectorAll(".stamp-circle");

    if (helloNameEl) {
        helloNameEl.textContent = "Hallo " + (currentName || "Gast");
    }

    circles.forEach((circle, index) => {
        circle.classList.toggle("filled", index < stamps);
    });

    const remaining = maxStamps - stamps;
    if (stampTextEl) {
        stampTextEl.textContent =
            remaining > 0
                ? `Noch ${remaining} Kaffee bis gratis`
                : "Du hast einen Gratis Kaffee!";
    }

    if (freeCoffeeText) {
        freeCoffeeText.textContent = `Du hast ${maxStamps} Stempel gesammelt.`;
    }

    if (currentUserId) {
        saveSession();
    }
}

// ✅ NEU: Text im "1 Stempel hinzugefügt" Screen aktualisieren
function updateStampAddedText() {
    const el = document.getElementById("stampadded-remaining");
    if (!el) return;

    const remaining = Math.max(0, maxStamps - stamps);

    if (remaining <= 0) {
        el.textContent = "Du hast genug Stempel für einen Gratis Kaffee!";
    } else if (remaining === 1) {
        el.textContent = "1 Stempel fehlt noch.";
    } else {
        el.textContent = `${remaining} Stempel fehlen noch.`;
    }
}

// ==========================
// App
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    const $ = id => document.getElementById(id);

    // Buttons
    const btnWelcomeNext  = $("btn-welcome-next");
    const btnToRegister   = $("btn-to-register");
    const btnLogin        = $("btn-login");
    const btnRegisterBack = $("btn-register-back");
    const btnRegisterSave = $("btn-register-save");
    const btnScan         = $("btn-scan");
    const btnStampNext    = $("btn-stampadded-next");
    const btnFreeBack     = $("btn-free-back");
    const btnFreeRedeem   = $("btn-free-redeem");
    const btnOpenProfile  = $("btn-open-profile");
    const btnProfileBack  = $("btn-profile-back");
    const btnLogout       = $("btn-logout");

    // Inputs
    const loginEmail = $("login-email");
    const loginPassword = $("login-password");
    const regName = $("reg-name");
    const regEmail = $("reg-email");
    const regPassword = $("reg-password");
    const profileName = $("profile-name");
    const profileEmail = $("profile-email");
    const profilePassword = $("profile-password");

    // Auto-hide messages while typing
    loginEmail?.addEventListener("input", () => hideMsg("login"));
    loginPassword?.addEventListener("input", () => hideMsg("login"));
    regName?.addEventListener("input", () => hideMsg("register"));
    regEmail?.addEventListener("input", () => hideMsg("register"));
    regPassword?.addEventListener("input", () => hideMsg("register"));
    profileName?.addEventListener("input", () => hideMsg("profile"));
    profileEmail?.addEventListener("input", () => hideMsg("profile"));
    profilePassword?.addEventListener("input", () => hideMsg("profile"));

    btnWelcomeNext?.addEventListener("click", () => showScreen("login-screen"));
    btnToRegister?.addEventListener("click", () => showScreen("register-screen"));
    btnRegisterBack?.addEventListener("click", () => showScreen("login-screen"));

    // Auto-login
    if (loadSession()) {
        updateStampCard();
        showMsg("login", `Willkommen zurück, ${currentName}!`, "ok");
        showScreen("stampcard-screen");
    } else {
        showScreen("welcome-screen");
    }

    // ==========================
    // Registrierung
    // ==========================
    btnRegisterSave?.addEventListener("click", async () => {
        if (!regEmail.value || !regPassword.value) {
            showMsg("register", "Bitte E-Mail und Passwort eingeben.", "warn");
            return;
        }

        setLoading(btnRegisterSave, true, "Registriere...");
        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: regName.value.trim(),
                    email: regEmail.value.trim(),
                    password: regPassword.value.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) return showMsg("register", data.error, "error");

            currentUserId = data.id;
            currentName = data.name;
            currentEmail = data.email;
            stamps = data.stamps;

            updateStampCard();
            showMsg("register", "Registrierung erfolgreich 🎉", "ok");
            showScreen("stampcard-screen");

        } catch {
            showMsg("register", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnRegisterSave, false);
        }
    });

    // ==========================
    // Login
    // ==========================
    btnLogin?.addEventListener("click", async () => {
        if (!loginEmail.value || !loginPassword.value) {
            showMsg("login", "Bitte E-Mail und Passwort eingeben.", "warn");
            return;
        }

        setLoading(btnLogin, true, "Logge ein...");
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail.value.trim(),
                    password: loginPassword.value.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) return showMsg("login", data.error, "error");

            currentUserId = data.id;
            currentName = data.name || data.email.split("@")[0];
            currentEmail = data.email;
            stamps = data.stamps;

            updateStampCard();
            showMsg("login", "Login erfolgreich ✅", "ok");
            showScreen("stampcard-screen");

        } catch {
            showMsg("login", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnLogin, false);
        }
    });

    // ==========================
    // Scan
    // ==========================
    btnScan?.addEventListener("click", async () => {
        setLoading(btnScan, true, "Scanne...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/scan`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) return showMsg("stampcard", data.error, "error");

            stamps = data.stamps;
            updateStampCard();
            updateStampAddedText(); // ✅ NEU

            showScreen(stamps >= maxStamps ? "freecoffee-screen" : "stampadded-screen");

        } catch {
            showMsg("stampcard", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnScan, false);
        }
    });

    btnStampNext?.addEventListener("click", () => showScreen("stampcard-screen"));
    btnFreeBack?.addEventListener("click", () => showScreen("stampcard-screen"));

    // Redeem
    btnFreeRedeem?.addEventListener("click", async () => {
        setLoading(btnFreeRedeem, true, "Löse ein...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/redeem`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) return showMsg("freecoffee", data.error, "error");

            stamps = data.stamps;
            updateStampCard();
            showMsg("freecoffee", "Eingelöst ☕️", "ok");
            showScreen("stampcard-screen");

        } catch {
            showMsg("freecoffee", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnFreeRedeem, false);
        }
    });

    // ==========================
    // Profil
    // ==========================
    btnOpenProfile?.addEventListener("click", () => {
        profileName.value = currentName;
        profileEmail.value = currentEmail;
        profilePassword.value = "";
        showScreen("profile-screen");
    });

    btnProfileBack?.addEventListener("click", async () => {
        setLoading(btnProfileBack, true, "Speichere...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profileName.value.trim(),
                    email: profileEmail.value.trim(),
                    password: profilePassword.value.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) return showMsg("profile", data.error, "error");

            currentName = data.name;
            currentEmail = data.email;
            stamps = data.stamps;

            updateStampCard();
            showMsg("profile", "Profil gespeichert ✅", "ok");
            showScreen("stampcard-screen");

        } catch {
            showMsg("profile", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnProfileBack, false);
        }
    });

    // ==========================
    // Logout
    // ==========================
    btnLogout?.addEventListener("click", () => {
        currentUserId = null;
        currentName = "";
        currentEmail = "";
        stamps = 0;
        clearSession();
        showMsg("login", "Ausgeloggt.", "info");
        showScreen("login-screen");
    });
});
