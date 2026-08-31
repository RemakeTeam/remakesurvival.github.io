export function create()
{
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
    // The video has no visible controls and never needs to be clicked/hovered
    // itself. Excluding it from hit-testing lets pointer events fall straight
    // through to whatever Avalonia renders underneath, which is what actually
    // owns correct hit-testing/hover for the rest of the page. Without this,
    // mousemove events landing on this native element get picked up by
    // Avalonia's own pointer tracking with a wrong Y (X stays correct), which
    // was misfiring hover highlights on the header nav while hovering the video.
    video.style.pointerEvents = "none";
    return video;
}

export function setSource(video, source)
{
    const value = source ?? "";
    if (video.getAttribute("src") === value) return;
    video.setAttribute("src", value);
}

export function destroy(video)
{
    video.pause();
    video.removeAttribute("src");
    video.load();
}

export function setAutoPlay(video, value)
{
    video.autoplay = value;
}

export function setLoop(video, value)
{
    video.loop = value;
}

export function setMuted(video, value)
{
    video.muted = value;
}

export function setVolume(video, value)
{
    video.volume = Math.max(0, Math.min(1, value));
}

export function setObjectFit(video, value)
{
    video.style.objectFit = value;
}

export function setCornerRadius(video, topLeft, topRight, bottomRight, bottomLeft)
{
    // A wrapping Border's CornerRadius/ClipToBounds can't round this element —
    // it's a real native <video> node (the "airspace" problem), not something
    // Avalonia's own clipping applies to — so it has to be rounded directly.
    video.style.borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

export function setTopClip(video, pixels)
{
    // NativeControlHost content always renders above regular Avalonia content
    // (the "airspace" problem) and isn't reliably clipped by an ancestor
    // ScrollViewer, so it can visually cover — and swallow clicks meant for —
    // controls that are supposed to sit above it, like the header nav.
    // Clipping just the overlapping top sliver (rather than hiding the whole
    // element) keeps the rest of the video showing normally, and clipped-away
    // pixels also fall out of hit-testing in modern browsers.
    const value = Math.max(0, pixels || 0);
    video.style.clipPath = value > 0 ? `inset(${value}px 0 0 0)` : "";
}

export function play(video)
{
    const promise = video.play();
    if (promise) promise.catch(() => {});
}

export function pause(video)
{
    video.pause();
}

export function stop(video)
{
    video.pause();
    video.currentTime = 0;
}

export function seek(video, seconds)
{
    if (Number.isFinite(seconds)) video.currentTime = Math.max(0, seconds);
}