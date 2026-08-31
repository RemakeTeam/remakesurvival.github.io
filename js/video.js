// The value Avalonia gets back from create() is a *container* div wrapping the real
// <video> element (as container.videoElement), not the <video> itself. That lets us
// also host a native mute/unmute button positioned over the video — a plain Avalonia
// control drawn "on top" wouldn't actually be visible, since NativeControlHost content
// always renders above regular Avalonia content (the "airspace" problem). Every other
// function here takes that same container and reaches into .videoElement as needed.

export function create()
{
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";
    container.style.border = "1px solid rgba(128, 22, 190, 0.35)";
    // Let clicks/hover fall straight through to whatever Avalonia renders
    // underneath (see the note on the video below) — the mute button re-enables
    // pointer events for just itself further down.
    container.style.pointerEvents = "none";

    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.style.display = "block";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.margin = "0";
    video.style.padding = "0";
    video.style.border = "0";
    video.style.background = "transparent";
    // The video has no controls of its own and never needs to be clicked/hovered
    // itself. Excluding it from hit-testing lets pointer events fall straight
    // through to whatever Avalonia renders underneath, which is what actually
    // owns correct hit-testing/hover for the rest of the page. Without this,
    // mousemove events landing on this native element get picked up by
    // Avalonia's own pointer tracking with a wrong Y (X stays correct), which
    // was misfiring hover highlights on the header nav while hovering the video.
    video.style.pointerEvents = "none";
    container.appendChild(video);
    container.videoElement = video;

    const muteButton = document.createElement("button");
    muteButton.type = "button";
    Object.assign(muteButton.style, {
        position: "absolute",
        top: "16px",
        right: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 18px",
        borderRadius: "999px",
        border: "none",
        background: "rgba(15, 13, 17, 0.68)",
        color: "#ffffff",
        fontFamily: "inherit",
        fontSize: "13px",
        fontWeight: "600",
        lineHeight: "1",
        cursor: "pointer",
        pointerEvents: "auto"
    });

    const icon = document.createElement("span");
    const label = document.createElement("span");
    muteButton.appendChild(icon);
    muteButton.appendChild(label);

    const refreshMuteButton = () =>
    {
        const muted = video.muted;
        icon.textContent = muted ? "🔇" : "🔊";
        label.textContent = muted ? "Включить звук" : "Выключить звук";
    };

    const toggleMute = (e) =>
    {
        // Avalonia.Browser installs its own global, capture-phase pointer
        // listeners to drive its synthetic input pipeline, and appears to call
        // preventDefault() on pointerdown regardless of the actual DOM target —
        // which also suppresses the browser's derived "click" event entirely, so
        // a plain click listener here never fires. Handling pointerdown directly
        // (and stopping it from propagating any further) sidesteps that.
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        refreshMuteButton();
    };
    muteButton.addEventListener("pointerdown", toggleMute);
    video.addEventListener("volumechange", refreshMuteButton);
    refreshMuteButton();

    container.appendChild(muteButton);
    container.refreshMuteButton = refreshMuteButton;
    return container;
}

export function setSource(container, source)
{
    const video = container.videoElement;
    const value = source ?? "";
    if (video.getAttribute("src") === value) return;
    video.setAttribute("src", value);
}

export function destroy(container)
{
    const video = container.videoElement;
    video.pause();
    video.removeAttribute("src");
    video.load();
}

export function setAutoPlay(container, value)
{
    container.videoElement.autoplay = value;
}

export function setLoop(container, value)
{
    container.videoElement.loop = value;
}

export function setMuted(container, value)
{
    container.videoElement.muted = value;
    // The "volumechange" listener normally keeps the mute button's icon/label in
    // sync, but don't rely on it firing for a programmatic change on an element
    // that isn't attached to the DOM yet (Create() sets the initial Muted value
    // before the element is inserted) — refresh explicitly too.
    if (container.refreshMuteButton) container.refreshMuteButton();
}

export function setVolume(container, value)
{
    container.videoElement.volume = Math.max(0, Math.min(1, value));
}

export function setObjectFit(container, value)
{
    container.videoElement.style.objectFit = value;
}

export function setCornerRadius(container, topLeft, topRight, bottomRight, bottomLeft)
{
    // A wrapping Border's CornerRadius/ClipToBounds can't round this element —
    // it's real native DOM content (the "airspace" problem), not something
    // Avalonia's own clipping applies to — so it has to be rounded directly.
    // Rounding (and clipping via overflow:hidden) the container, not just the
    // video, keeps the mute button's corner from poking out past the curve too.
    container.style.borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

export function setTopClip(container, pixels)
{
    // NativeControlHost content always renders above regular Avalonia content
    // (the "airspace" problem) and isn't reliably clipped by an ancestor
    // ScrollViewer, so it can visually cover — and swallow clicks meant for —
    // controls that are supposed to sit above it, like the header nav.
    // Clipping just the overlapping top sliver (rather than hiding the whole
    // element) keeps the rest of the video showing normally, and clipped-away
    // pixels also fall out of hit-testing in modern browsers.
    const value = Math.max(0, pixels || 0);
    container.style.clipPath = value > 0 ? `inset(${value}px 0 0 0)` : "";
}

export function play(container)
{
    const promise = container.videoElement.play();
    if (promise) promise.catch(() => {});
}

export function pause(container)
{
    container.videoElement.pause();
}

export function stop(container)
{
    const video = container.videoElement;
    video.pause();
    video.currentTime = 0;
}

export function seek(container, seconds)
{
    if (Number.isFinite(seconds)) container.videoElement.currentTime = Math.max(0, seconds);
}
