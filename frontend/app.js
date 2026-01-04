// Hilfsfunktion: Screens
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


// Backend
const API_BASE = "http://localhost:3000";


// App-State
let currentUserId = null;
let currentName = "";
let currentEmail = "";
let stamps = 0;
const maxStamps = 5;


// UI Update
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
}


// App Logik
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
    btnWelcomeNext?.addEventListener("click", () => {
        showScreen("login-screen");
    });

    // Login → Register
    btnToRegister?.addEventListener("click", () => {
        showScreen("register-screen");
    });

    // Register → Back
    btnRegisterBack?.addEventListener("click", () => {
        showScreen("login-screen");
    });


    // Registrierung
    btnRegisterSave?.addEventListener("click", async () => {
        const name     = document.getElementById("reg-name").value.trim();
        const email    = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value.trim();

        try {
            const res = await fetch(`${API_BASE}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (!res.ok) return alert(data.error);

            currentUserId = data.id;
            currentName   = data.name;
            currentEmail  = data.email;
            stamps        = data.stamps;

            updateStampCard();
            showScreen("stampcard-screen");

        } catch {
            alert("Backend nicht erreichbar");
        }
    });

    // Login
    btnLogin?.addEventListener("click", async () => {
        const email    = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) return alert(data.error);

            currentUserId = data.id;
            currentName   = data.name || data.email.split("@")[0];
            currentEmail  = data.email;
            stamps        = data.stamps;

            updateStampCard();
            showScreen("stampcard-screen");

        } catch {
            alert("Backend nicht erreichbar");
        }
    });


    // Scan
    btnScan?.addEventListener("click", async () => {
        const res = await fetch(`${API_BASE}/api/users/${currentUserId}/scan`, { method: "POST" });
        const data = await res.json();

        stamps = data.stamps;
        updateStampCard();

        showScreen(stamps >= maxStamps ? "freecoffee-screen" : "stampadded-screen");
    });

    btnStampNext?.addEventListener("click", () => {
        showScreen("stampcard-screen");
    });

    btnFreeBack?.addEventListener("click", () => {
        showScreen("stampcard-screen");
    });

    btnFreeRedeem?.addEventListener("click", async () => {
        const res = await fetch(`${API_BASE}/api/users/${currentUserId}/redeem`, { method: "POST" });
        const data = await res.json();
        stamps = data.stamps;
        updateStampCard();
        showScreen("stampcard-screen");
    });


    // Profil
    btnOpenProfile?.addEventListener("click", () => {
        profileNameInput.value  = currentName;
        profileEmailInput.value = currentEmail;
        profilePasswordInput.value = "";
        showScreen("profile-screen");
    });

    btnProfileBack?.addEventListener("click", async () => {
        const name     = profileNameInput.value.trim();
        const email    = profileEmailInput.value.trim();
        const password = profilePasswordInput.value.trim();

        const res = await fetch(`${API_BASE}/api/users/${currentUserId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (!res.ok) return alert(data.error);

        currentName  = data.name;
        currentEmail = data.email;
        stamps       = data.stamps;

        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Logout
    btnLogout?.addEventListener("click", () => {
        currentUserId = null;
        currentName = "";
        currentEmail = "";
        stamps = 0;
        showScreen("login-screen");
    });

    updateStampCard();
    showScreen("welcome-screen");
});
