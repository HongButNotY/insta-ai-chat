# AI DMs

An Instagram-style direct messaging app for Android where everyone you chat with is an AI character you design. Bring your own API key (Grok, ChatGPT, Claude, Gemini, OpenRouter, Groq, DeepSeek, or any OpenAI-compatible server). All data stays on your phone.

## Features

- **Instagram look and feel**: dark/light mode, inbox with search, notes, unread dots, scroll-aware gradient bubbles, typing indicator, "Seen", double-tap ❤️, long-press to react / reply / copy / edit / regenerate / unsend.
- **AI people you create**: photo, name, username, bio, note, personality, starting line, response style, example chats, and an optional per-person model and creativity setting.
- **Chat history import**: load a JSON chat (including Instagram's own data export) as past messages and/or as texting-style examples.
- **Group chats**: multiple AI people in one chat; @mention someone to get their reply, or tap ✨ to pick who texts next.
- **Chat themes**: 12 built-in backgrounds (Love, Galaxy, Ocean, Tie-dye, Lo-fi…) or your own photo.
- **Realistic texting**: replies split into several bubbles, emoji reactions, typing delays.
- **Backup and restore** of everything to a JSON file.

## Install

Download the APK from [Releases](../../releases), open it on your phone and allow "install unknown apps". Then open Settings (gear icon) → choose a provider → paste your API key → **Test connection**.

## Build from source

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

## How it works

The UI is plain HTML/CSS/JS in `android/app/src/main/assets/`, hosted in a WebView by a small Java activity (`MainActivity.java`). The activity makes API requests natively (so no CORS issues with any provider), handles the file picker, the back button and saving files to Downloads. Data is stored in IndexedDB on the device.

You can preview the UI on a computer by serving the assets folder (for example `python3 -m http.server -d android/app/src/main/assets`). API calls may be blocked by CORS in a desktop browser, but they work in the app.
