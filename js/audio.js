const sounds = {};

export function load(name, url)
{
    const audio = new Audio(url);
    audio.preload = "auto";
    sounds[name] = audio;
}

export function play(name)
{
    const audio = sounds[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(error =>
    {
        console.warn("Audio playback failed:", error);
    });
}

export function stop(name)
{
    const audio = sounds[name];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
}

export function setVolume(name, volume)
{
    const audio = sounds[name];
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
}