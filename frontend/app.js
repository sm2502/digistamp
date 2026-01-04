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
    const payload = {
        currentUserId,
        currentName,
        currentEmail,
        stamps
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

function clearSession() {
    localStorage.removeItem(LS_KEY);
}

function loadSession() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);

        if (!data || !data.currentUserId) return false;

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
// UX helpers: message + loading
// ==========================
function showMsg(text, type = "info") {
    const box = document.getElementById("app-msg");
    if (!box) {
        // Fallback
        alert(text);
        return;
    }

    box.style.display = "block";
    box.textContent = text;

    // simple styling by type
    // (no fancy CSS required)
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

    // auto-hide after a bit (except errors)
    if (type !== "error") {
        window.clearTimeout(showMsg._t);
        showMsg._t = window.setTimeout(() => {
            box.style.display = "none";
        }, 2500);
    }
}

function setLoading(btn, isLoading, loadingText = "Bitte warten...") {
    if (!btn) return;
    if (isLoading) {
        btn.dataset._oldText = btn.textContent;
        btn.textContent = loadingText;
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
    const stampInfoEl = document.getElementById("stamp-text");
    const freeCoffeeText = document.getElementById("freecoffee-text");
    const circles = document.querySelectorAll(".stamp-circle");

    if (helloNameEl) {
        helloNameEl.textContent = "Hallo " + (currentName || "Gast");
    }

    circles.forEach((circle, index) => {
        circle.classList.toggle("filled", index < stamps);
    });

    const remaining = maxStamps - stamps;
    if (stampInfoEl) {
        stampInfoEl.textContent =
            remaining > 0
                ? `Noch ${remaining} Kaffee bis gratis`
                : "Du hast einen Gratis Kaffee!";
    }

    if (freeCoffeeText) {
        freeCoffeeText.textContent = `Du hast ${maxStamps} Stempel gesammelt.`;
    }

    // keep localStorage in sync (only if logged in)
    if (currentUserId) saveSession();
}

// ==========================
// App
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    // Buttons
    const btnWelcomeNext  = document.getElementById("btn-welcome-next");
    const btnToRegister   = document.getElementById("btn-to-register");
    const btnLogin        = document.getElementById("btn-login");
    const btnRegisterBack = document.getElementById("btn-register-back");
    const btnRegisterSave = document.getElementById("btn-register-save");
    const btnScan         = document.getElementById("btn-scan");
    const btnStampNext    = document.getElementById("btn-stampadded-next");
    const btnFreeBack     = document.getElementById("btn-free-back");
    const btnFreeRedeem   = document.getElementById("btn-free-redeem");
    const btnOpenProfile  = document.getElementById("btn-open-profile");
    const btnProfileBack  = document.getElementById("btn-profile-back");
    const btnLogout       = document.getElementById("btn-logout");

    // Profile Inputs
    const profileNameInput     = document.getElementById("profile-name");
    const profileEmailInput    = document.getElementById("profile-email");
    const profilePasswordInput = document.getElementById("profile-password");

    // Welcome → Login
    btnWelcomeNext?.addEventListener("click", () => showScreen("login-screen"));

    // Login → Register
    btnToRegister?.addEventListener("click", () => showScreen("register-screen"));

    // Register → Back
    btnRegisterBack?.addEventListener("click", () => showScreen("login-screen"));

    // ==========================
    // Auto-login from localStorage
    // ==========================
    if (loadSession()) {
        updateStampCard();
        showMsg(`Willkommen zurück, ${currentName || "Gast"}!`, "ok");
        showScreen("stampcard-screen");
    } else {
        updateStampCard();
        showScreen("welcome-screen");
    }

    // ==========================
    // Registrierung
    // ==========================
    btnRegisterSave?.addEventListener("click", async () => {
        const name     = document.getElementById("reg-name").value.trim();
        const email    = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();

        if (!email || !password) {
            showMsg("Bitte E-Mail und Passwort eingeben.", "warn");
            return;
        }

        setLoading(btnRegisterSave, true, "Registriere...");
        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showMsg(data.error || "Fehler bei der Registrierung", "error");
                return;
            }

            currentUserId = data.id;
            currentName   = data.name || "";
            currentEmail  = data.email;
            stamps        = data.stamps || 0;

            saveSession();
            updateStampCard();
            showMsg("Registrierung erfolgreich 🎉", "ok");
            showScreen("stampcard-screen");

        } catch (err) {
            console.error(err);
            showMsg("Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnRegisterSave, false);
        }
    });

    // ==========================
    // Login
    // ==========================
    btnLogin?.addEventListener("click", async () => {
        const email    = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        if (!email || !password) {
            showMsg("Bitte E-Mail und Passwort eingeben.", "warn");
            return;
        }

        setLoading(btnLogin, true, "Logge ein...");
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showMsg(data.error || "Login fehlgeschlagen", "error");
                return;
            }

            currentUserId = data.id;
            currentName   = data.name || (data.email && data.email.split("@")[0]) || "Gast";
            currentEmail  = data.email;
            stamps        = data.stamps || 0;

            saveSession();
            updateStampCard();
            showMsg("Login erfolgreich ✅", "ok");
            showScreen("stampcard-screen");

        } catch (err) {
            console.error(err);
            showMsg("Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnLogin, false);
        }
    });

    // ==========================
    // Scan
    // ==========================
    btnScan?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("Bitte zuerst einloggen.", "warn");
            return;
        }

        setLoading(btnScan, true, "Scanne...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/scan`, { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                showMsg(data.error || "Fehler beim Scannen", "error");
                return;
            }

            stamps = data.stamps;
            updateStampCard();

            showScreen(stamps >= maxStamps ? "freecoffee-screen" : "stampadded-screen");

        } catch (err) {
            console.error(err);
            showMsg("Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnScan, false);
        }
    });

    btnStampNext?.addEventListener("click", () => showScreen("stampcard-screen"));
    btnFreeBack?.addEventListener("click", () => showScreen("stampcard-screen"));

    // Redeem
    btnFreeRedeem?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("Bitte zuerst einloggen.", "warn");
            return;
        }

        setLoading(btnFreeRedeem, true, "Löse ein...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/redeem`, { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                showMsg(data.error || "Fehler beim Einlösen", "error");
                return;
            }

            stamps = data.stamps;
            updateStampCard();
            showMsg("Eingelöst ☕️", "ok");
            showScreen("stampcard-screen");

        } catch (err) {
            console.error(err);
            showMsg("Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnFreeRedeem, false);
        }
    });

    // ==========================
    // Profil
    // ==========================
    btnOpenProfile?.addEventListener("click", () => {
        if (!currentUserId) {
            showMsg("Bitte zuerst einloggen.", "warn");
            return;
        }
        if (profileNameInput) profileNameInput.value = currentName || "";
        if (profileEmailInput) profileEmailInput.value = currentEmail || "";
        if (profilePasswordInput) profilePasswordInput.value = "";
        showScreen("profile-screen");
    });

    btnProfileBack?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("Bitte zuerst einloggen.", "warn");
            return;
        }

        const name     = profileNameInput ? profileNameInput.value.trim() : "";
        const email    = profileEmailInput ? profileEmailInput.value.trim() : "";
        const password = profilePasswordInput ? profilePasswordInput.value.trim() : "";

        setLoading(btnProfileBack, true, "Speichere...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                showMsg(data.error || "Fehler beim Profil-Update", "error");
                return;
            }

            currentName  = data.name;
            currentEmail = data.email;
            stamps       = data.stamps;

            saveSession();
            updateStampCard();
            showMsg("Profil gespeichert ✅", "ok");
            showScreen("stampcard-screen");

        } catch (err) {
            console.error(err);
            showMsg("Backend nicht erreichbar.", "error");
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
        updateStampCard();

        const loginEmail = document.getElementById("login-email");
        const loginPassword = document.getElementById("login-password");
        if (loginEmail) loginEmail.value = "";
        if (loginPassword) loginPassword.value = "";

        showMsg("Ausgeloggt.", "info");
        showScreen("login-screen");
    });
});
