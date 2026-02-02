# Plivo Configuration Guide - Ruta Segura Perú

## Overview

Plivo is used for:
- **SMS Alerts** (emergency notifications, OTP codes)
- **Voice Calls** (automated emergency calls to authorities)

---

## Step 1: Create Plivo Account

1. Go to [Plivo Console](https://console.plivo.com/)
2. Sign up for a free account
3. Verify your phone number
4. Complete account setup

---

## Step 2: Get API Credentials

1. Go to **Overview** in the console
2. Find your credentials:
   - **Auth ID**: `MAXXXXXXXXXXXXXXXXXXXX`
   - **Auth Token**: `YourSecretAuthToken`
3. Update your `.env`:
   ```
   PLIVO_AUTH_ID=MAXXXXXXXXXXXXXXXXXXXX
   PLIVO_AUTH_TOKEN=YourSecretAuthToken
   ```

---

## Step 3: Buy a Phone Number

1. Go to **Phone Numbers** > **Buy Numbers**
2. Select country: **Peru** (or USA for testing)
3. Choose a number with **Voice** and **SMS** enabled
4. Purchase the number
5. Update your `.env`:
   ```
   PLIVO_PHONE_NUMBER=+1234567890
   ```

---

## Step 4: Configure Message Templates

Create message templates for emergencies:

```python
# In app/integrations/plivo.py

EMERGENCY_SMS_TEMPLATE = """
🚨 ALERTA DE EMERGENCIA - RUTA SEGURA PERÚ

Turista: {tourist_name}
Ubicación: {latitude}, {longitude}
Hora: {timestamp}

Ver detalles: {dashboard_url}
"""

EMERGENCY_CALL_SCRIPT = """
Alerta de emergencia de Ruta Segura Perú.
Un turista ha activado el botón de pánico.
Nombre: {tourist_name}.
Ubicación aproximada: {location_description}.
Por favor verifique el panel de control para más detalles.
"""
```

---

## Step 5: Test SMS

```python
from app.integrations.plivo import plivo_provider

# Send test SMS
await plivo_provider.send_sms(
    phone_number="+51999888777",
    message="Prueba de SMS desde Ruta Segura Perú"
)
```

---

## Step 6: Test Voice Call

```python
# Make test call with text-to-speech
await plivo_provider.make_call(
    phone_number="+51999888777",
    message="Esta es una llamada de prueba de Ruta Segura Perú."
)
```

---

## Pricing (Estimated)

| Service | Price |
|---------|-------|
| Peru SMS Outbound | ~$0.03 per SMS |
| Peru Voice Outbound | ~$0.05 per minute |
| US SMS Outbound | ~$0.01 per SMS |

---

## Emergency Integration

When SOS is triggered:
1. SMS sent to emergency contacts
2. SMS sent to guide (if on tour)
3. SMS sent to agency admin
4. Voice call to local authorities (if configured)

---

## Production Checklist

- [ ] Verify production API credentials
- [ ] Buy Peru phone number
- [ ] Configure emergency contact numbers
- [ ] Test SMS delivery to Peru numbers
- [ ] Set up usage alerts for billing
- [ ] Enable message logging for audit
