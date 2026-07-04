# Caleb AI Media Demo Inputs

These files are safe JSON examples for the explicit media CLI commands.

Media commands are separate from the accepted V1 CLI commands. They expose the media-track Hollow catalog only when a caller uses `list-media-hollows`, `inspect-media-hollow`, or `run-media-hollow`.

The audio and video duration examples use provided metadata only. They do not read, decode, probe, convert, render, export, or execute media files.

`image-dimensions-input.json` shows the required shape for a real explicit path-safe image file. Replace the sample project root and relative path with a local image path when running it.

These examples do not implement Hollowcut runtime, FFmpeg/export, UI, shell commands, network calls, or media conversion.
