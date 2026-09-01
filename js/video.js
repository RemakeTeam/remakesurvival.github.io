const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

export function create()
{
    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.muted = true;
    Object.assign(video.style, {
        position: "absolute",
        top: "0",
        left: "-9999px",
        pointerEvents: "none"
    });
    document.body.appendChild(video);
    video.addEventListener("error", () => console.error("[VideoView] error:", video.error));
    video.addEventListener("stalled", () => console.warn("[VideoView] stalled (network idle while still waiting for data)"));
    video.addEventListener("waiting", () => console.warn("[VideoView] waiting (buffering, playback paused)"));
    video.addEventListener("playing", () => console.log("[VideoView] playing (resumed after buffering, if any)"));
    video.addEventListener("progress", () =>
    {
        const buffered = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
        console.log(`[VideoView] progress: buffered ${buffered.toFixed(1)}s / duration ${video.duration || "?"}s, readyState=${video.readyState}, networkState=${video.networkState}`);
    });
    const STALL_TIMEOUT_MS = 8000;
    let lastProgressTime = video.currentTime;
    let lastProgressAt = Date.now();
    video.addEventListener("timeupdate", () =>
    {
        if (video.currentTime !== lastProgressTime)
        {
            lastProgressTime = video.currentTime;
            lastProgressAt = Date.now();
        }
    });
    const watchdog = setInterval(() =>
    {
        if (video.ended || !video.getAttribute("src")) return;
        if (video.paused)
        {
            if (video.autoplay)
            {
                const p = video.play();
                if (p) p.catch(() => {});
            }
            return;
        }
        if (Date.now() - lastProgressAt < STALL_TIMEOUT_MS) return;
        console.warn(`[VideoView] no playback progress for ${STALL_TIMEOUT_MS}ms — reloading to recover from a stall`);
        lastProgressAt = Date.now();
        video.load();
        const p = video.play();
        if (p) p.catch(() => {});
    }, 3000);
    video._stallWatchdog = watchdog;
    return video;
}

export function setSource(video, source)
{
    const value = source ?? "";
    if (video.getAttribute("src") === value) return;
    video.setAttribute("src", value);
    if (value && video.autoplay)
    {
        const p = video.play();
        if (p) p.catch(() => {});
    }
}

export function destroy(video)
{
    if (video._stallWatchdog) clearInterval(video._stallWatchdog);
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
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

export function getWidth(video)
{
    return video.videoWidth || 0;
}

export function getHeight(video)
{
    return video.videoHeight || 0;
}

export function captureFrame(video, buffer, width, height)
{
    if (video.readyState < 2 || width <= 0 || height <= 0) return false;
    try
    {
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const frame = ctx.getImageData(0, 0, width, height);
        buffer.set(new Uint8Array(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength));
        return true;
    }
    catch (e)
    {
        console.error("[VideoView] captureFrame failed:", e);
        return false;
    }
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