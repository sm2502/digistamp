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

let currentName = "";
let currentEmail = "";
let stamps = 0;
const maxStamps = 5;

function updateStampCard() {
    const helloNameEl = document.getElementById("hello-name");
    const stampInfoEl = document.getElementById("stamp-text");
    const freeCoffeeText = document.getElementById("freecoffee-text");
    const circles = document.querySelectorAll(".stamp-circle");
    const progressFill = document.getElementById("progress-fill");

    // Begrüßung
    if (helloNameEl) {
        helloNameEl.textContent = "Hallo " + (currentName || "Gast");
    }

    // Stempelkreise
    circles.forEach((circle, index) => {
        circle.classList.toggle("filled", index < stamps);
    });

    // Text unter Stempeln
    const remaining = maxStamps - stamps;
    if (stampInfoEl) {
        stampInfoEl.textContent =
            remaining > 0
                ? `Noch ${remaining} Kaffee bis gratis`
                : "Du hast einen Gratis Kaffee!";
    }

    // Gratis-Kaffee-Screen Text
    if (freeCoffeeText) {
        freeCoffeeText.textContent = `Du hast ${maxStamps} Stempel gesammelt.`;
    }

    // Progress-Bar
    if (progressFill) {
        const percent = Math.min(100, (stamps / maxStamps) * 100);
        progressFill.style.width = percent + "%";
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
    btnWelcomeNext?.addEventListener("click", () => {
        showScreen("login-screen");
    });

    // Login → Registrierung
    btnToRegister?.addEventListener("click", () => {
        showScreen("register-screen");
    });

    // Registrierung → Zurück
    btnRegisterBack?.addEventListener("click", () => {
        showScreen("login-screen");
    });

    // Registrierung speichern → Stempelkarte
    btnRegisterSave?.addEventListener("click", () => {
        currentName  = document.getElementById("reg-name").value.trim() || "Gast";
        currentEmail = document.getElementById("reg-email").value.trim() || "";
        stamps = 0;
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Login → Stempelkarte
    btnLogin?.addEventListener("click", () => {
        const email = document.getElementById("login-email").value.trim();
        currentEmail = email;
        currentName = currentName || (email.includes("@") ? email.split("@")[0] : "Gast");
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Karte scannen → Stempel erhöhen
    btnScan?.addEventListener("click", () => {
        stamps++;

        updateStampCard();

        if (stamps >= maxStamps) {
            showScreen("freecoffee-screen");
        } else {
            showScreen("stampadded-screen");
        }
    });

    // 1 Stempel hinzugefügt → zurück
    btnStampNext?.addEventListener("click", () => {
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Gratis Kaffee → Zurück
    btnFreeBack?.addEventListener("click", () => {
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Gratis Kaffee einlösen
    btnFreeRedeem?.addEventListener("click", () => {
        stamps = 0;
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Profil öffnen
    btnOpenProfile?.addEventListener("click", () => {
        if (profileNameInput)  profileNameInput.value  = currentName;
        if (profileEmailInput) profileEmailInput.value = currentEmail;
        showScreen("profile-screen");
    });

    // Profil → Zurück
    btnProfileBack?.addEventListener("click", () => {
        if (profileNameInput?.value.trim()) {
            currentName = profileNameInput.value.trim();
        }
        if (profileEmailInput?.value.trim()) {
            currentEmail = profileEmailInput.value.trim();
        }
        updateStampCard();
        showScreen("stampcard-screen");
    });

    // Logout
    btnLogout?.addEventListener("click", () => {
        currentName = "";
        currentEmail = "";
        stamps = 0;
        updateStampCard();
        showScreen("login-screen");
    });

    // Startzustand
    updateStampCard();
    showScreen("welcome-screen");
});
