# 🚀 GUÍA EAS BUILD: Crear APK Nativa en la Nube (Sin Android Studio)

## PROBLEMA A RESOLVER
✅ El error `'PlatformConstants' could not be found` desaparece cuando compilas **APK nativa real** en EAS
✅ EAS compila en servidores de Expo (no en tu PC)
✅ Obtienes un APK real que puedes instalar en cualquier teléfono Android

---

## REQUISITOS
- Node.js (ya tienes)
- Cuenta Expo (gratuita en https://expo.dev)
- git (ya tienes)

---

## PASO 1: Login en Expo (Cloud)

```bash
npx eas login
```

**Qué hace:**
- Te abre un navegador para autenticarte en Expo
- Guarda tu token localmente
- Te conecta a los servidores de Expo

**Output esperado:**
```
✔ Logged in as: tu_usuario_expo
```

---

## PASO 2: Crear el Proyecto en EAS (Cloud)

```bash
cd apps/mobile
npx eas build:configure
```

**Qué hace:**
- Vincula tu proyecto local con EAS
- Crea credenciales Android en la nube
- Configura el `projectId` en `app.json` (YA TIENES ESTO)

**Output esperado:**
```
✔ Android build credentials configured
✔ EAS project linked
```

---

## PASO 3: Construir APK en la Nube

### Opción A: APK de Desarrollo (Rápido, ~5 min)
```bash
cd apps/mobile
npx eas build --platform android --profile development --wait
```

**Qué hace:**
- Envía tu código a servidores de Expo
- Compila el APK nativo en la nube (tarda 5-10 min)
- Te da el link para descargar el APK

**Output esperado:**
```
Build queued (ID: abc123def456)
Waiting for build to complete...
✓ Build completed successfully
📱 Download APK: https://eas-builds.s3.amazonaws.com/...apk
```

### Opción B: APK de Preview/Prueba (Recomendado)
```bash
cd apps/mobile
npx eas build --platform android --profile preview --wait
```

**Qué hace:**
- Mismo que Opción A, pero versión "release" (optimizada)
- Mejor performance, pero más lento de compilar

---

## PASO 4: Descargar e Instalar el APK

### Método 1: Desde el Link de EAS
```bash
# EAS te da un link directo. Abre en navegador y descarga
https://eas-builds.s3.amazonaws.com/...apk
```

### Método 2: Instalar Directamente en Teléfono Conectado
```bash
# Si tienes adb (Android Debug Bridge) instalado
adb install -r app-release.apk
```

### Método 3: Escanear QR desde Terminal
```bash
# EAS te muestra un QR que puedes escanear con tu teléfono
# El APK se descarga y se instala automáticamente
```

---

## PASO 5: Ejecutar en Tu Teléfono

1. Abre el APK descargado (desde Files/Archivos)
2. Acepta las permisiones
3. La app debería cargar **SIN el error de PlatformConstants**

---

## TROUBLESHOOTING

### Error: "No credentials configured"
```bash
npx eas build:configure
```

### Error: "Build failed: Metro bundling error"
- Ejecuta `npm install` en la raiz
- Ejecuta `npx expo prebuild --clean` en apps/mobile
- Intenta de nuevo

### Error: "Insufficient quota"
- Estás usando plan gratuito de Expo
- Espera 24h o suscríbete a plan pagado

### APK instalada pero app no carga
- Limpia cache: Settings → Apps → Ruta Segura → Clear Cache
- Desinstala y reinstala
- Verifica que tienes permisos de ubicación activados

---

## MONITOREO DE BUILD

### Ver status en tiempo real
```bash
npx eas build:list
```

### Ver logs detallados de un build
```bash
npx eas build:view <BUILD_ID>
```

---

## AUTOMATIZACIÓN (OPCIONAL)

### Crear build automáticamente al hacer push a main

**Crea archivo:** `.github/workflows/eas-build.yml`

```yaml
name: EAS Build on Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build APK
        working-directory: apps/mobile
        run: npx eas build --platform android --profile preview --wait
```

Luego cada commit a `main` genera automáticamente un APK.

---

## REFERENCIA RÁPIDA

| Tarea | Comando |
|-------|---------|
| Login | `npx eas login` |
| Configurar | `npx eas build:configure` |
| Build debug | `npx eas build --platform android --profile development --wait` |
| Build release | `npx eas build --platform android --profile preview --wait` |
| Ver builds | `npx eas build:list` |
| Ver logs | `npx eas build:view <ID>` |

---

## SIGUIENTE PASO DESPUÉS DE APK FUNCIONANDO

Una vez que el APK compile sin errores y se ejecute en tu teléfono:

1. ✅ Verifica que mapas funcionan (Mapbox muestra ubicación)
2. ✅ Verifica que biometría funciona (huella dactilar/facial)
3. ✅ Verifica que backend responde (prueba una API call)

Entonces implementamos **FASE 2: Arquitectura Empresarial** con:
- MQTT (streaming de GPS)
- gRPC (comunicación interna)
- Temporal.io (orquestación de flujos)
- Redis (hot data)
- Live Activities + Widgets

---

## CONTACTO

Si hay errores durante EAS Build, reporta:
- Build ID (desde `npx eas build:list`)
- Error message completo
- Tu `eas.json` y `app.json`
