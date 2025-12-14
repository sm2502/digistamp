// unterstützung von ChatGpt
// Hilfsfunktion: nur einen Screen anzeigen
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
        if (el) {
            el.style.display = (sid === id) ? "block" : "none";
        }
    });
}

// App-State
let currentName = "";
let currentEmail = "";
let stamps = 0;
const maxStamps = 5;

// Stempelkarte aktualisieren
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
        if (remaining > 0) {
            stampInfoEl.textContent = `Noch ${remaining} Kaffee bis gratis`;
        } else {
            stampInfoEl.textContent = "Du hast einen Gratis Kaffee!";
        }
    }

    if (freeCoffeeText) {
        freeCoffeeText.textContent = `Du hast ${maxStamps} Stempel gesammelt.`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Buttons
    const btnWelcomeNext   = document.getElementById("btn-welcome-next");
    const btnToRegister    = document.getElementById("btn-to-register");
    const btnLogin         = document.getElementById("btn-login");
    const btnRegisterBack  = document.getElementById("btn-register-back");
    const btnRegisterSave  = document.getElementById("btn-register-save");
    const btnScan          = document.getElementById("btn-scan");
    const btnStampNext     = document.getElementById("btn-stampadded-next");
    const btnFreeBack      = document.getElementById("btn-free-back");
    const btnFreeRedeem    = document.getElementById("btn-free-redeem");
    const btnOpenProfile   = document.getElementById("btn-open-profile");
    const btnProfileBack   = document.getElementById("btn-profile-back");
    const btnLogout        = document.getElementById("btn-logout");

    // Profil-Inputs
    const profileNameInput  = document.getElementById("profile-name");
    const profileEmailInput = document.getElementById("profile-email");

    // Welcome → Login
    if (btnWelcomeNext) {
        btnWelcomeNext.addEventListener("click", () => {
            showScreen("login-screen");
        });
    }

    // Login → Registrierung
    if (btnToRegister) {
        btnToRegister.addEventListener("click", () => {
            showScreen("register-screen");
        });
    }

    // Registrierung → Zurück → Login
    if (btnRegisterBack) {
        btnRegisterBack.addEventListener("click", () => {
            showScreen("login-screen");
        });
    }

    // Registrierung speichern → Stempelkarte
    if (btnRegisterSave) {
        btnRegisterSave.addEventListener("click", () => {
            const name = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim();

            currentName = name || "Gast";
            currentEmail = email || "";

            stamps = 0;
            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Login → Stempelkarte (einfacher Dummy-Login)
    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            const email = document.getElementById("login-email").value.trim();
            currentEmail = email;
            // Name aus E-Mail ableiten, falls kein Profilname
            currentName = currentName || ((email && email.includes("@")) ? email.split("@")[0] : "Gast");

            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Karte scannen → Stempel erhöhen
    if (btnScan) {
        btnScan.addEventListener("click", () => {
            stamps++;
            if (stamps >= maxStamps) {
                // genug Stempel → Gratis Kaffee Screen
                updateStampCard();
                showScreen("freecoffee-screen");
            } else {
                // sonst: 1 Stempel hinzugefügt Screen
                updateStampCard();
                showScreen("stampadded-screen");
            }
        });
    }

    // "1 Stempel hinzugefügt" → zurück zur Stempelkarte
    if (btnStampNext) {
        btnStampNext.addEventListener("click", () => {
            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Gratis Kaffee → Zurück
    if (btnFreeBack) {
        btnFreeBack.addEventListener("click", () => {
            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Gratis Kaffee einlösen → Stempel auf 0
    if (btnFreeRedeem) {
        btnFreeRedeem.addEventListener("click", () => {
            stamps = 0;
            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Profil über drei Punkte öffnen
    if (btnOpenProfile) {
        btnOpenProfile.addEventListener("click", () => {
            if (profileNameInput)  profileNameInput.value  = currentName || "";
            if (profileEmailInput) profileEmailInput.value = currentEmail || "";
            showScreen("profile-screen");
        });
    }

    // Profil → Zurück (Änderungen übernehmen)
    if (btnProfileBack) {
        btnProfileBack.addEventListener("click", () => {
            if (profileNameInput && profileNameInput.value.trim() !== "") {
                currentName = profileNameInput.value.trim();
            }
            if (profileEmailInput && profileEmailInput.value.trim() !== "") {
                currentEmail = profileEmailInput.value.trim();
            }
            updateStampCard();
            showScreen("stampcard-screen");
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            currentName = "";
            currentEmail = "";
            stamps = 0;
            const loginEmail = document.getElementById("login-email");
            const loginPassword = document.getElementById("login-password");
            if (loginEmail) loginEmail.value = "";
            if (loginPassword) loginPassword.value = "";
            updateStampCard();
            showScreen("login-screen");
        });
    }

    // Startzustand
    updateStampCard();
    showScreen("welcome-screen");
});
