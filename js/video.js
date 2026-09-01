// Video frame source: decodes a video and exposes captured RGBA frames for
// Avalonia to draw as an ordinary bitmap (VideoView copies these into a
// WriteableBitmap) instead of showing the <video> element itself. This
// sidesteps the native-DOM "airspace" problem entirely — a native <video>
// element always renders above regular Avalonia content, no matter what
// z-order/clipping is set on it. Once video is just pixel data, it's normal
// Avalonia content: normal z-order (other controls can sit on top with zero
// extra code), normal clipping by an ancestor Border/ScrollViewer, normal
// Border rounding/outline. No workarounds needed.

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

export function create()
{
    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    // Browsers require a video to already be muted for unprompted autoplay to
    // be allowed at all; setMuted (called right after this, with the real
    // initial value) can then un-mute it if asked to.
    video.muted = true;
    // Some browsers throttle or never actually decode a <video> that's fully
    // detached from the document, even though nothing here displays it — so it
    // still needs to be in the DOM. Keep it at a normal (non-degenerate) size
    // rather than 1x1/opacity:0 too: some browsers apply extra throttling to
    // near-zero-size or fully-transparent video elements specifically, on the
    // assumption nothing is actually looking at them — shove it off-screen
    // instead, which doesn't trip that heuristic.
    Object.assign(video.style, {
        position: "absolute",
        top: "0",
        left: "-9999px",
        pointerEvents: "none"
    });
    document.body.appendChild(video);
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
    // readyState < 2 (HAVE_CURRENT_DATA) means there's no decoded frame yet.
    if (video.readyState < 2 || width <= 0 || height <= 0) return false;
    try
    {
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const frame = ctx.getImageData(0, 0, width, height);
        // frame.data is a Uint8ClampedArray — the marshalled buffer's own
        // .set() strictly requires a real Uint8Array, so wrap (not copy) it as
        // one: same underlying bytes, just a different typed-array view.
        buffer.set(new Uint8Array(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength));
        return true;
    }
    catch (e)
    {
        // Surface this instead of silently producing a blank frame forever —
        // a tainted canvas (cross-origin video without CORS) throws here, for
        // example, and would otherwise be very hard to notice from the C# side.
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
