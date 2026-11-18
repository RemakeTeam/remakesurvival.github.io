const API_URL = "https://auth.remake-survival.site/api/system";
const versionElement = document.getElementById("game-version");
const windowsButton = document.getElementById("windows-download");
const androidButton = document.getElementById("android-download");
const maintenanceElement = document.getElementById("maintenance-status");


function setDownload(button, url) {
    if (typeof url !== "string" || !url.startsWith("https://")) {
        button.href = "#";
        button.classList.add("is-disabled");
        button.setAttribute("aria-disabled", "true");
        return;
    }

    button.href = url;
    button.classList.remove("is-disabled");
    button.setAttribute("aria-disabled", "false");
}


async function loadGameInfo() {
    try {
        const response = await fetch(API_URL, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const system = data.system;

        if (!data.version || !system) {
            throw new Error("Invalid API response");
        }
        versionElement.textContent = data.version;

        setDownload(windowsButton, system.exeUrl);
        setDownload(androidButton, system.apkUrl);

        const maintenance = data.technicalWork || system.technicalWork;

        if (maintenance) {
            maintenanceElement.textContent = "Ведутся технические работы";
            maintenanceElement.classList.add("visible");
        } else {
            maintenanceElement.textContent = "";
            maintenanceElement.classList.remove("visible");
        }

    } catch (error) {
        console.error("Failed to load game information:", error);
        versionElement.textContent = "Недоступна";
        
        setDownload(windowsButton, null);
        setDownload(androidButton, null);

        maintenanceElement.textContent = "Не удалось загрузить информацию об игре";
        maintenanceElement.classList.add("visible");
    }
}

loadGameInfo();