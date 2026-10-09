# expo-video: turning the screen off keeps the auto-PiP candidate playing (Android)

Minimal reproduction for an `expo-video` bug on Android.

A `VideoView` with `allowsPictureInPicture` and `startsPictureInPictureAutomatically` keeps playing **with the screen off**. Turning the screen off stops the activity without entering Picture-in-Picture, but the auto-PiP candidate is never paused: `PictureInPictureManager.shouldPauseOnBackground` skips it because it expects PiP to take over, and the helper fragment only reacts to PiP mode changes.

- `expo` 57.0.27, `expo-video` 57.0.5, `react-native` 0.86.3 (New Architecture)
- Reproduced in a release build on an Android 14 emulator (Pixel 7, API 34).

## Run

```bash
npm install
npx expo run:android --variant release
```

The app plays an HLS stream in a loop with `startsPictureInPictureAutomatically` on while playing.

## Reproduce

1. Wait until it is playing.
2. Turn the screen off (power button, or `adb shell input keyevent KEYCODE_SLEEP`).
3. **Expected:** playback pauses, as it does when `startsPictureInPictureAutomatically` is off.
   **Actual:** the audio keeps playing with the screen off.

To check it without listening:

```bash
PID=$(adb shell pidof dev.repro.videopip)
adb shell input keyevent KEYCODE_SLEEP; sleep 5
adb shell dumpsys audio | grep "u/pid:[0-9]*/$PID " | grep -o "state:[a-z]*"
# without the fix: state:started   ·   with the fix: state:paused
```

## Proposed fix

`fix/expo-video+57.0.5.patch` (`patch-package`): `PictureInPictureHelperFragment.onStop` notifies the manager when the activity stops outside PiP, and `PictureInPictureManager` pauses the views whose player does not have `staysActiveInBackground`.

```bash
mkdir -p patches && cp fix/expo-video+57.0.5.patch patches/ && npx patch-package
npx expo run:android --variant release
```

`package.json` builds `expo-video` from source on Android (`expo.autolinking.android.buildFromSource`), so the patch reaches the native build.
