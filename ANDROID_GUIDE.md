# Guide: Running on Android

This guide explains how to run both the API server and the mobile app on a single Android device.

## Part 1: Running the API Server on Android

The API server is a Node.js application. To run it on Android, we will use [Termux](https://termux.com), a terminal emulator and Linux environment for Android.

### 1.1. Install Termux

1.  Download and install Termux from [F-Droid](https://f-droid.org/en/packages/com.termux/). It is recommended to use the F-Droid version as the Google Play Store version is outdated.
2.  Open Termux.

### 1.2. Install Node.js

Run the following commands in the Termux terminal:

```bash
pkg update -y
pkg install nodejs -y
```

This will install the latest version of Node.js and npm.

### 1.3. Transfer Project Files

You need to transfer the necessary project files (excluding large and unnecessary folders like `node_modules` and `.git`) to your phone's storage.

1.  **On your computer**, navigate to your project's root directory in your terminal.
2.  Create a zip file containing only the essential files (run this in PowerShell):
    ```powershell
    $excludeList = "node_modules", ".git", "kite-mobile", "public", "public-html", "cache", "*.md", "COMPILATION.md", "ecosystem.config.js", "*.zip"
    Get-ChildItem -Path . -Exclude $excludeList | Compress-Archive -DestinationPath project.zip -Update -CompressionLevel Optimal
    ```
    This command creates `project.zip` excluding:
    *   `node_modules/`: These will be installed on your phone.
    *   `.git/`: Version control history, not needed on the phone.
    *   `kite-mobile/`: The mobile app's source code, which will be built separately.
    *   `public/`: Frontend static assets, not needed for the server.
    *   `public-html/`: Another frontend folder, not needed for the server.
    *   `cache/`: Local cache files, not needed for transfer.
    *   `ecosystem.config.js`: PM2 config, specific to the server's environment.
    *   `*.md` and `COMPILATION.md`: Documentation files, not needed for runtime.
    *   `*.zip`: To prevent the zip file from including itself on subsequent runs.

3.  Transfer the `project.zip` file to your phone (e.g., via USB, Google Drive, etc.).
4.  In your phone's file manager, unzip `project.zip` into a known location, for example, in your "Downloads" folder.

### 1.4. Run the Server

1.  In Termux, you need to access your phone's storage. If you haven't already, run this command to create a `storage` directory in Termux that links to your phone's storage:
    ```bash
    termux-setup-storage
    ```
    Accept the permission prompt if it appears.

2.  Navigate to your project directory. For example, if you unzipped it in your "Downloads" folder:
    ```bash
    cd ~/storage/downloads/your-project-folder-name
    ```

3.  **Install all dependencies (including pm2):**
    This command will install all necessary packages, including `pm2`, locally within the project. This avoids most permission issues.
    ```bash
    npm install
    ```

4.  **Start the server:**
    This command will use the locally installed `pm2` to start the server.
    ```bash
    npm run start:dev
    ```
    The server should now be running on `http://localhost:3000`. You can check the status with `npm run pm2:logs`.

---

## Part 2: Building and Installing the Mobile App

The `kite-mobile` app is an Expo project. We will use Expo Application Services (EAS) to build the APK.

### 2.1. Set up EAS CLI

If you don't have it, install the EAS CLI on your computer:
```bash
npm install -g eas-cli
```

### 2.2. Build the APK

1.  Navigate to the `kite-mobile` directory in your project on your computer:
    ```bash
    cd path/to/your/project/kite-mobile
    ```

2.  Run the build command:
    ```bash
    npm run build:apk
    ```
    This will start the build process on Expo's servers. You may need to log in to your Expo account. The build can take 15-20 minutes.

3.  Once the build is complete, you will get a URL to download the APK file.

### 2.3. Install the App

1.  Download the APK file from the URL provided by EAS.
2.  Transfer the APK file to your Android phone.
3.  Open a file manager on your phone, find the APK, and tap on it to install. You may need to "Allow installation from unknown sources" in your phone's settings.

---

## Part 3: Connecting the App to the Server

1.  **Make sure the API server is running in Termux.**

2.  **Open the Kite Trading Bot app** you just installed.

3.  You will be on the **Setup Screen**.
    *   For **Server URL**, enter: `http://localhost:3000`
    *   For **API Key**, enter the API key from your server's `.env` file or logs.

4.  Tap **"Test Connection"**. If both the app and server are running correctly on the same device, you should see a "Connection Successful!" message.

5.  Tap **"Continue"**, and you're all set! The dashboard should now load with the correct status information.

Your phone is now a self-contained trading bot server and client.
