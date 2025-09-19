# Momentum Extension Setup with .env

Since you have your credentials in a `.env` file, here's how to connect them:

## Option 1: Using the Build Script (Recommended)

1. **Make sure your `.env` file contains:**

   ```
   GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=https://your_extension_id.chromiumapp.org/
   ```

2. **Run the build script:**

   ```bash
   node build.js
   ```

3. **Load the extension in Chrome**

## Option 2: Manual Setup

If the build script doesn't work, you can manually update the files:

### Step 1: Update manifest.json

Replace `YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your actual `GOOGLE_CLIENT_ID` from the .env file.

### Step 2: Create config.js

Copy `config.template.js` to `extension/config.js` and fill in your values:

```javascript
window.MOMENTUM_CONFIG = {
  GOOGLE_CLIENT_ID: "your_actual_client_id.apps.googleusercontent.com",
  GOOGLE_REDIRECT_URI: "https://your_extension_id.chromiumapp.org/",
};
```

## Getting Your Extension ID

1. Load the extension in Chrome (`chrome://extensions/`)
2. Enable Developer mode
3. Click "Load unpacked" and select the `extension` folder
4. Copy the Extension ID (something like `abcdefghijklmnopqrstuvwxyz123456`)
5. Update your `GOOGLE_REDIRECT_URI` to use this Extension ID

## Testing

1. Go to Gmail
2. Open any email thread
3. Click the "⚡ Momentum" button or press `Ctrl+Shift+K`
4. The side panel should open and attempt to authenticate

If you see authentication errors, double-check your Google Cloud Console settings match your Extension ID.
