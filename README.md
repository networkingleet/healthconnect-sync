# healthconnect-sync
# Health Sync PWA - Installation Guide

This is a **Progressive Web App (PWA)** that syncs your health data with your Fasting Tracker. It works like a native app but installs through your web browser - **completely FREE!**

## 🚀 Quick Setup (5 Minutes)

### Step 1: Host the App

Choose one of these hosting methods:

#### **Method A: Local Server (Easiest for Testing)**
```bash
# Navigate to the web-app folder
cd fitbit-integration/tasker-app/web-app

# Start a simple web server (Python 3)
python -m http.server 8080

# Or if you have Python 2
python -m SimpleHTTPServer 8080

# Or if you have Node.js
npx http-server . -p 8080
```

The app will be available at: `http://localhost:8080`

#### **Method B: GitHub Pages (Free Hosting)**
1. Create a new repository on GitHub
2. Upload the `web-app` folder contents to the repository
3. Go to Settings → Pages → Deploy from main branch
4. Your app will be at: `https://yourusername.github.io/repositoryname`

#### **Method C: Copy to Your Fasting App Server**
```bash
# Copy PWA files to your existing web server
cp -r fitbit-integration/tasker-app/web-app/* /path/to/your/web/directory/health-sync/
```
Access at: `http://192.168.1.41:18082/health-sync/`

### Step 2: Install on Your Phone

1. **Open Chrome** on your Samsung phone
2. **Navigate** to your PWA URL (from Step 1)
3. **Wait for the prompt** "Add Health Sync to Home screen" 
4. **Tap "Add"** or look for the menu → "Add to Home Screen"
5. **Done!** The app icon appears on your home screen

### Step 3: Configure & Test

1. **Open the app** from your home screen
2. **Tap "Test"** under Server Status to verify connection
3. **Tap "🔄 Sync Now"** to test manual sync
4. **Enable Auto Sync** (toggle should be on by default)

## 📱 Features

✅ **Auto Sync**: Every 30 minutes  
✅ **Manual Sync**: Tap the sync button anytime  
✅ **Activity Tracking**: Steps, calories, sleep  
✅ **Sync Logs**: View all sync history  
✅ **Offline Support**: Works without internet  
✅ **Native Feel**: Looks and works like a real app  

## ⚙️ Configuration

### Change API Server
Edit `app.js` line 3:
```javascript
API_BASE: 'http://YOUR_SERVER_IP:18081/api',
```

### Change API Key
Edit `app.js` line 4:
```javascript
API_KEY: 'your_api_key_here',
```

### Change Sync Interval
Edit `app.js` line 5:
```javascript
SYNC_INTERVAL: 30 * 60 * 1000, // 30 minutes in milliseconds
```

## 🔧 Troubleshooting

### "Add to Home Screen" doesn't appear
- Make sure you're using **Chrome** (not Samsung Internet)
- Visit the site and **use it for a few seconds** first
- Check the URL bar for a "+" icon or install prompt
- Try Chrome menu → "Add to Home screen" manually

### App won't sync
- Tap **"Test"** to check server connection
- Verify your **API server is running** (`docker compose ps`)
- Check the **API endpoint** in settings matches your server
- Look at **sync logs** for error details

### App appears but won't work
- Make sure **all files** are in the same directory
- Check **browser console** for JavaScript errors (F12)
- Verify **manifest.json** is accessible

### Connection errors
- Ensure your phone is on the **same WiFi network** as your server
- Test the API directly: `http://192.168.1.41:18081/api/health`
- Check **firewall settings** on your server

## 📂 File Structure

```
web-app/
├── index.html          # Main app interface
├── app.js             # App logic and sync functionality  
├── manifest.json      # PWA configuration
├── sw.js             # Service worker (offline support)
└── README.md         # This file
```

## 🌐 Health Connect Integration

Currently uses **dummy data** for demonstration. To integrate real Health Connect:

1. **Grant permissions** in Android settings
2. **Replace `getHealthData()`** function in `app.js` 
3. **Add Health Connect SDK** calls

Example real integration:
```javascript
async function getHealthData() {
    // Real Health Connect API calls would go here
    const steps = await window.HealthConnect.readSteps();
    const calories = await window.HealthConnect.readCalories();
    // ... return real data
}
```

## 🔄 Updates

To update the app:
1. **Modify files** on your server
2. **Refresh** the app on your phone
3. **Service worker** automatically updates the cache

## 🆚 PWA vs Native App

| Feature | PWA | Native App |
|---------|-----|------------|
| Cost | FREE | $6+ for Tasker |
| Installation | Browser | App Store |
| Updates | Automatic | Manual |
| Permissions | Limited | Full System |
| Offline | ✅ | ✅ |
| Performance | Excellent | Excellent |

## 🎯 Next Steps

1. **Install the PWA** using this guide
2. **Test the sync functionality** 
3. **Set up the backend API** (if not done already)
4. **Integrate real Health Connect** data (optional)
5. **Enjoy automated health tracking!**

## 🐛 Support

If you encounter issues:
1. Check the **browser console** for errors
2. Review **sync logs** in the app
3. Test **API connectivity** using the test button
4. Verify **server logs**: `docker compose logs api`

The PWA provides the same functionality as expensive automation apps - completely free! 🎉 
