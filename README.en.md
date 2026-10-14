# AirCastBrowser

An Android browser for phones, tablets, TVs and boxes, with tabs, media playback, AirPlay casting, web TV, and local web management. Requires Android 5.0 or later.

Download from [GitHub Releases](https://github.com/buhanzhe/AirCastBrowser/releases/latest):

- `AirCastBrowser32.apk`: ARM 32-bit.
- `AirCastBrowser64.apk`: ARM 64-bit.
- `AirCastBrowserx86.apk`: x86 devices and emulators.

Updates are available only from **System Information** in web management, using `version-lite.json`. Installation requires user confirmation; there are no startup update prompts or forced updates. Open the local address or QR code shown in the app from a device on the same network. The default management port is `9955`; if occupied, the app tries subsequent ports.

On Windows, configure the Android SDK and local AirCast signing files, then run `build-release.bat`. Upload the three APKs and `version-lite.json` from `output` to the same Release. Keep signing keys and obfuscation mappings local.

[简体中文](README.md)
