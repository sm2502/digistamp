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
// UX helpers (screen-based messages)
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
// Backend error helpers (A)
// ==========================
function getFirstApiError(data) {
    if (data && Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors[0]; // { field, message }
    }
    return null;
}

function clearFieldErrors() {
    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function markFieldError(field) {
    const idMap = {
        email: ["login-email", "reg-email", "profile-email"],
        password: ["login-password", "reg-password", "profile-password"],
        name: ["reg-name", "profile-name"]
    };

    (idMap[field] || []).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("input-error");
    });
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

    if (currentUserId) saveSession();
}

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
    const $ = (id) => document.getElementById(id);

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

    // Auto-hide messages + clear field highlights while typing
    loginEmail?.addEventListener("input", () => { hideMsg("login"); clearFieldErrors(); });
    loginPassword?.addEventListener("input", () => { hideMsg("login"); clearFieldErrors(); });

    regName?.addEventListener("input", () => { hideMsg("register"); clearFieldErrors(); });
    regEmail?.addEventListener("input", () => { hideMsg("register"); clearFieldErrors(); });
    regPassword?.addEventListener("input", () => { hideMsg("register"); clearFieldErrors(); });

    profileName?.addEventListener("input", () => { hideMsg("profile"); clearFieldErrors(); });
    profileEmail?.addEventListener("input", () => { hideMsg("profile"); clearFieldErrors(); });
    profilePassword?.addEventListener("input", () => { hideMsg("profile"); clearFieldErrors(); });

    // Navigation
    btnWelcomeNext?.addEventListener("click", () => showScreen("login-screen"));
    btnToRegister?.addEventListener("click", () => { clearFieldErrors(); showScreen("register-screen"); });
    btnRegisterBack?.addEventListener("click", () => { clearFieldErrors(); showScreen("login-screen"); });

    // ==========================
    // B) Auto-login + Session-Validierung gegen Backend
    // ==========================
    (async () => {
        if (!loadSession()) {
            showScreen("welcome-screen");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}`);
            if (!res.ok) {
                clearSession();
                currentUserId = null;
                currentName = "";
                currentEmail = "";
                stamps = 0;

                showMsg("login", "Session ungültig. Bitte neu einloggen.", "warn");
                showScreen("login-screen");
                return;
            }

            const data = await res.json();
            currentName = data.name || "";
            currentEmail = data.email || "";
            stamps = data.stamps || 0;

            updateStampCard();
            showMsg("login", `Willkommen zurück, ${currentName || "Gast"}!`, "ok");
            showScreen("stampcard-screen");
        } catch {
            // Backend down: zeig trotzdem App an, aber Hinweis
            updateStampCard();
            showMsg("login", "Backend gerade nicht erreichbar – Offline-Ansicht.", "warn");
            showScreen("stampcard-screen");
        }
    })();

    // ==========================
    // Registrierung
    // ==========================
    btnRegisterSave?.addEventListener("click", async () => {
        clearFieldErrors();

        setLoading(btnRegisterSave, true, "Registriere...");
        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: regName?.value.trim() || "",
                    email: regEmail?.value.trim() || "",
                    password: regPassword?.value.trim() || ""
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const first = getFirstApiError(data);
                if (first) {
                    markFieldError(first.field);
                    return showMsg("register", first.message, "error");
                }
                return showMsg("register", data.error || "Fehler bei der Registrierung", "error");
            }

            currentUserId = data.id;
            currentName = data.name || "";
            currentEmail = data.email || "";
            stamps = data.stamps || 0;

            updateStampCard();
            showMsg("register", "Registrierung erfolgreich 🎉", "ok");
            showScreen("stampcard-screen");
        } catch (err) {
            console.error(err);
            showMsg("register", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnRegisterSave, false);
        }
    });

    // ==========================
    // Login
    // ==========================
    btnLogin?.addEventListener("click", async () => {
        clearFieldErrors();

        setLoading(btnLogin, true, "Logge ein...");
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail?.value.trim() || "",
                    password: loginPassword?.value.trim() || ""
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const first = getFirstApiError(data);
                if (first) {
                    markFieldError(first.field);
                    return showMsg("login", first.message, "error");
                }
                // Login-Fehler ist oft {error:"..."} absichtlich generisch
                return showMsg("login", data.error || "Login fehlgeschlagen", "error");
            }

            currentUserId = data.id;
            currentName = data.name || (data.email ? data.email.split("@")[0] : "Gast");
            currentEmail = data.email || "";
            stamps = data.stamps || 0;

            updateStampCard();
            showMsg("login", "Login erfolgreich ✅", "ok");
            showScreen("stampcard-screen");
        } catch (err) {
            console.error(err);
            showMsg("login", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnLogin, false);
        }
    });

    // ==========================
    // Scan
    // ==========================
    btnScan?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("stampcard", "Bitte zuerst einloggen.", "warn");
            showScreen("login-screen");
            return;
        }

        setLoading(btnScan, true, "Scanne...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/scan`, { method: "POST" });
            const data = await res.json();

            if (!res.ok) return showMsg("stampcard", data.error || "Fehler beim Scannen", "error");

            stamps = data.stamps;
            updateStampCard();
            updateStampAddedText();

            showScreen(stamps >= maxStamps ? "freecoffee-screen" : "stampadded-screen");
        } catch (err) {
            console.error(err);
            showMsg("stampcard", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnScan, false);
        }
    });

    btnStampNext?.addEventListener("click", () => showScreen("stampcard-screen"));
    btnFreeBack?.addEventListener("click", () => showScreen("stampcard-screen"));

    // Redeem
    btnFreeRedeem?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("freecoffee", "Bitte zuerst einloggen.", "warn");
            showScreen("login-screen");
            return;
        }

        setLoading(btnFreeRedeem, true, "Löse ein...");
        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}/redeem`, { method: "POST" });
            const data = await res.json();

            if (!res.ok) return showMsg("freecoffee", data.error || "Fehler beim Einlösen", "error");

            stamps = data.stamps;
            updateStampCard();
            showMsg("freecoffee", "Eingelöst ☕️", "ok");
            showScreen("stampcard-screen");
        } catch (err) {
            console.error(err);
            showMsg("freecoffee", "Backend nicht erreichbar.", "error");
        } finally {
            setLoading(btnFreeRedeem, false);
        }
    });

    // ==========================
    // Profil
    // ==========================
    btnOpenProfile?.addEventListener("click", () => {
        if (!currentUserId) {
            showMsg("stampcard", "Bitte zuerst einloggen.", "warn");
            showScreen("login-screen");
            return;
        }

        clearFieldErrors();
        profileName.value = currentName || "";
        profileEmail.value = currentEmail || "";
        profilePassword.value = "";
        showScreen("profile-screen");
    });

    btnProfileBack?.addEventListener("click", async () => {
        if (!currentUserId) {
            showMsg("profile", "Bitte zuerst einloggen.", "warn");
            showScreen("login-screen");
            return;
        }

        clearFieldErrors();
        setLoading(btnProfileBack, true, "Speichere...");

        try {
            const res = await fetch(`${API_BASE}/api/users/${currentUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profileName?.value.trim() || "",
                    email: profileEmail?.value.trim() || "",
                    password: profilePassword?.value.trim() || ""
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const first = getFirstApiError(data);
                if (first) {
                    markFieldError(first.field);
                    return showMsg("profile", first.message, "error");
                }
                return showMsg("profile", data.error || "Fehler beim Profil-Update", "error");
            }

            currentName = data.name || "";
            currentEmail = data.email || "";
            stamps = data.stamps || stamps;

            updateStampCard();
            showMsg("profile", "Profil gespeichert ✅", "ok");
            showScreen("stampcard-screen");
        } catch (err) {
            console.error(err);
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
        clearFieldErrors();

        if (loginEmail) loginEmail.value = "";
        if (loginPassword) loginPassword.value = "";

        showMsg("login", "Ausgeloggt.", "info");
        showScreen("login-screen");
    });
});
