# AI DMs

An Instagram-style direct messaging app for Android and iOS where everyone you chat with is an AI character you design. Bring your own API key (Grok, ChatGPT, Claude, Gemini, OpenRouter, Groq, DeepSeek, or any OpenAI-compatible server). All data stays on your phone.

## Features

- **Instagram look and feel**: dark/light mode, inbox with search, notes, unread dots, scroll-aware gradient bubbles, typing indicator, "Seen", double-tap ❤️, long-press to react / reply / copy / edit / regenerate / unsend.
- **AI people you create**: photo, name, username, bio, note, personality, starting line, response style, example chats, and an optional per-person model and creativity setting.
- **Chat history import**: load a JSON chat (including Instagram's own data export) as past messages and/or as texting-style examples.
- **Group chats**: multiple AI people in one chat; @mention someone to get their reply, or tap ✨ to pick who texts next.
- **Chat themes**: 12 built-in backgrounds (Love, Galaxy, Ocean, Tie-dye, Lo-fi…) or your own photo.
- **Realistic texting**: replies split into several bubbles, emoji reactions, typing delays.
- **Backup and restore** of everything to a JSON file.

## Install

Download from [Releases](../../releases), then open Settings (gear icon) → choose a provider → paste your API key → **Test connection**.

**Android:** download `AI-DMs.apk`, open it on your phone and allow "install unknown apps".

**iPhone:** download `AI-DMs-unsigned.ipa`. Apple only installs signed apps, so sign and install it with [Sideloadly](https://sideloadly.io) or [AltStore](https://altstore.io) using your Apple ID (free Apple IDs need to re-sign every 7 days), or sign it with your own Apple Developer account. Requires iOS 15+.

## Build from source

### Android

Requirements: JDK 17 and the Android SDK (platform 34, build-tools 34).

```bash
cd android
echo "sdk.dir=/path/to/android/sdk" > local.properties
./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/`. Without a `keystore.properties` file it is signed with the debug key. To use your own key, create `android/keystore.properties`:

```properties
storeFile=release.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

### iOS

Requirements: macOS with Xcode 15+ and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd ios
xcodegen generate
open AIDMs.xcodeproj
```

Set your signing team in Xcode and run it on your device. Without a Mac, the [iOS build workflow](.github/workflows/ios.yml) builds an unsigned IPA on GitHub Actions; run it manually with a release tag to attach the IPA to that release.

## How it works

The UI is plain HTML/CSS/JS in `web/`, shared by both apps:

- **Android:** a small Java activity (`MainActivity.java`) hosts it in a WebView, makes API requests natively (so no CORS issues with any provider), and handles the file picker, the back button and saving to Downloads. Data is stored in IndexedDB.
- **iOS:** a Swift `WKWebView` shell (`WebViewController.swift`) does the same: native API requests, data stored as files in the app's Application Support folder, and exports through the share sheet.

You can preview the UI on a computer by serving the folder (for example `python3 -m http.server -d web`). API calls may be blocked by CORS in a desktop browser, but they work in the app.
