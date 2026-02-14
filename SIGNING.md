# Android APK Signing Guide

## Generate Keystore

Run this command in PowerShell to create a keystore:

```powershell
keytool -genkey -v -keystore meowtv.keystore -alias meowtv -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for:
- **Keystore password**: Choose a strong password (save it!)
- **Key password**: Can be the same as keystore password
- **Name, Organization, etc.**: Fill in your details

## Add Secrets to GitHub

1. Convert keystore to base64:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("meowtv.keystore")) | Out-File keystore-base64.txt
   ```

2. Go to: https://github.com/utkarshgupta188/meowtv-app/settings/secrets/actions

3. Click "New repository secret" and add these three secrets:

   - **Name**: `ANDROID_KEYSTORE_BASE64`
     - **Value**: Contents of `keystore-base64.txt`
   
   - **Name**: `KEYSTORE_PASSWORD`
     - **Value**: Your keystore password
   
   - **Name**: `KEY_PASSWORD`
     - **Value**: Your key password

4. Delete the temporary files:
   ```powershell
   Remove-Item meowtv.keystore, keystore-base64.txt
   ```

## Verify Signing

After the next build, the workflow will:
- Sign the APK if secrets are present
- Upload both unsigned and signed APKs
- Create a release with the signed APK

The signed APK will be named: `app-universal-release-signed.apk`

## Security Notes

⚠️ **Never commit the keystore file to git!**
⚠️ **Keep your passwords safe - you'll need them for future releases**
⚠️ **Backup the keystore file somewhere secure**

If you lose the keystore, you cannot update the app on users' devices!
