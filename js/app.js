export function openUrl(url) {
    window.open(url, "_blank");
}

export function getPath() {
    return window.location.pathname;
}

export function navigate(path) {
    window.history.pushState({}, "", path);
}

export function setTitle(title) {
    document.title = title;
}

export function hideLoadingScreen() {
    document.getElementById("loading-screen").remove();
}