# Firebase Configuration Guide - Ruta Segura Perú

## Overview

This guide helps you set up Firebase for:
- **FCM Push Notifications** (emergency alerts, tour updates)
- **Firebase Auth** (optional, for social login)
- **Cloud Storage** (images, documents)

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Name it: `ruta-segura-peru`
4. Enable Google Analytics if desired
5. Click **Create**

---

## Step 2: Add Android App

1. In Project Overview, click **Android** icon
2. Enter package name: `com.rutaseguraperu.app`
3. App nickname: `Ruta Segura Perú`
4. Download `google-services.json`
5. Place it in: `android/app/google-services.json`

---

## Step 3: Add iOS App

1. Click **Add app** > **iOS**
2. Enter Bundle ID: `com.rutaseguraperu.app`
3. Download `GoogleService-Info.plist`
4. Place it in: `ios/RutaSeguraPeru/GoogleService-Info.plist`

---

## Step 4: Get Server Credentials (Backend)

1. Go to **Project Settings** > **Service Accounts**
2. Click **"Generate new private key"**
3. Save the JSON file as: `backend/firebase-credentials.json`
4. Update your `.env`:
   ```
   FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
   ```

---

## Step 5: Enable Cloud Messaging

1. Go to **Project Settings** > **Cloud Messaging**
2. Note your **Server Key** (for legacy API)
3. Enable **Firebase Cloud Messaging API (V1)**

---

## Step 6: Install Frontend Dependencies

```bash
# In the React Native project root
npx expo install expo-notifications
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/messaging
```

---

## Step 7: Configure app.json

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1152d4"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./android/app/google-services.json"
    },
    "ios": {
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    }
  }
}
```

---

## Step 8: Request Permissions (Frontend)

```typescript
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';

async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission not granted for notifications!');
    return null;
  }

  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  
  // Send token to backend
  await api.post('/users/fcm-token', { token });
  
  return token;
}
```

---

## Testing Push Notifications

### From Firebase Console:
1. Go to **Engage** > **Messaging**
2. Click **"Create your first campaign"**
3. Select **Firebase Notification messages**
4. Enter title and text
5. Send test message using your FCM token

### From Backend (Python):
```python
from app.integrations.firebase import firebase_provider

await firebase_provider.send_push(
    recipient_token="device-fcm-token",
    title="🚨 Emergency Alert",
    body="SOS activated near your location",
    data={"type": "sos", "emergency_id": "123"}
)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token not registering | Check Firebase project ID matches |
| Notifications not received | Verify FCM token is current |
| Backend errors | Ensure `firebase-credentials.json` is valid |
| iOS not working | Check APNs key is configured in Firebase |

---

## Security Notes

> ⚠️ **Never commit credentials to Git!**

Add to `.gitignore`:
```
firebase-credentials.json
google-services.json
GoogleService-Info.plist
```
