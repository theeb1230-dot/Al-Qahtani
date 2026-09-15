# Batch #1 iOS physical-device hardening

Physical-device evidence showed a completed-looking download that could not be played locally. This is treated as a P0 device-verified failure pattern and does not get upgraded by CI alone.

The v1.0.33 branch therefore hardens the local-download completion boundary:

- stale persisted absolute paths are re-resolved by safe basename against the current app Documents container;
- explicit HTML/JSON/XML responses are rejected before a download can be finalized;
- generic octet-stream payloads must pass a media-signature probe before they can become visible as completed downloads;
- known MP4/MOV, MPEG-TS, WebM/Matroska, FLV, Ogg and AVI signatures are accepted;
- HLS playlists are rejected as unsupported local-download artifacts rather than being mislabeled as video files;
- `.part` -> final rename remains the finalization boundary and the renamed file is re-opened, length-checked and media-validated before `DownloadResult` is returned;
- the local library filters invalid completed-looking files and re-validates again on open/share.

CI covers the contracts above, including disguised HTML payloads and stale iOS sandbox prefixes. The full offline lifecycle on a real iPhone remains `DEVICE_REQUIRED_PENDING` until download -> restart -> Library -> offline playback -> Save to Files/share is re-tested successfully.
