# 🚀 Health Sync PWA - 2 Minute Setup

## Super Quick Install (Choose One Method)

### 📱 **Method 1: Test Locally (Recommended)**
```bash
# 1. Open terminal in the web-app folder
cd fitbit-integration/tasker-app/web-app

# 2. Start web server 
python -m http.server 8080

# 3. On your Samsung phone:
#    - Open Chrome
#    - Go to: http://YOUR_COMPUTER_IP:8080
#    - Tap "Add to Home Screen" when prompted
```

### 🌐 **Method 2: Use Your Existing Server**
```bash
# Copy PWA to your web server directory
cp -r fitbit-integration/tasker-app/web-app /path/to/web/health-sync

# Access at: http://192.168.1.41:18082/health-sync/
```

### ☁️ **Method 3: GitHub Pages (Free Forever)**
1. Go to [github.com](https://github.com) → New Repository
2. Upload these files: `index.html`, `app.js`, `manifest.json`, `sw.js`
3. Settings → Pages → Deploy from main branch
4. Visit your GitHub Pages URL on phone
5. "Add to Home Screen"

## ✅ That's It!

Your phone now has a **Health Sync** app that:
- 🔄 Auto-syncs every 30 minutes
- 📱 Works offline 
- 📊 Shows steps, calories, sleep
- 📋 Keeps sync logs
- ⚙️ Has settings to configure everything

## 🔧 First Time Setup

1. **Open the app** on your phone
2. **Tap "Test"** button to verify connection
3. **Tap "🔄 Sync Now"** to test sync
4. **Done!** Auto-sync is already enabled

## 🆘 Need Help?

- **Connection issues?** Make sure phone and server are on same WiFi
- **Can't install?** Use Chrome browser, not Samsung Internet
- **App not working?** Check the full README.md for troubleshooting

**This FREE PWA does everything Tasker ($6) does - but better!** 🎉 