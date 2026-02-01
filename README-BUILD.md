# Building MeowTV

## Using GitHub Actions (Recommended)

The easiest way to build the Android APK is using GitHub Actions - no local Android setup required!

### Steps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Android build workflow"
   git push
   ```

2. **Trigger the build**
   - Go to your GitHub repository
   - Click "Actions" tab
   - Click "Build Android APK" workflow
   - Click "Run workflow" button
   - Wait 10-15 minutes for the build to complete

3. **Download the APK**
   - Once the workflow completes, click on the workflow run
   - Scroll down to "Artifacts" section
   - Download `meowtv-android-apk`
   - Extract the ZIP to get your APK file

### Creating a Release

To build both Windows and Android versions and create a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The "Build All Platforms" workflow will automatically create a GitHub release with:
- Windows installers (.msi and .exe)
- Android APK

## Local Build (Advanced)

### Windows
```bash
npm run build
npx @tauri-apps/cli build
```

### Android (requires Android Studio + NDK)
```bash
npm run build
npx @tauri-apps/cli android init
npx @tauri-apps/cli android build --apk
```

## Output Locations

- **Windows**: `src-tauri/target/release/bundle/`
- **Android** (local): `src-tauri/gen/android/app/build/outputs/apk/`
- **GitHub Actions**: Download from workflow artifacts

## Notes

- First Android build may take 15-20 minutes as it downloads Android SDK/NDK
- Subsequent builds are faster (~5-10 minutes) due to caching
- APK will be built for ARM64 and ARMv7 (universal APK)
