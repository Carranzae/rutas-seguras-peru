# 🔧 Troubleshooting: PlatformConstants could not be found

## ❌ Error Actual
```
[runtime not ready]: Invariant Violation:
TurboModule Registry.getEnforcing(...):
'Platform Constants' could not be found.
```

## 🎯 Root Cause Analysis
Este error ocurre cuando:
1. **Metro bundler compila OK en terminal** (JS bundle es válido)
2. **Pero el app nativo en el teléfono/emulador FALLA** (Módulos nativos de React Native no están linkeados)

El problema está en la discordancia entre:
- Tu configuración de monorepo con workspaces + nohoist
- El binario nativo de Android/iOS que fue compilado sin considerar esta arquitectura

## ✅ Soluciones (en orden de prioridad)

### Solución 1: Usar Expo Go (RÁPIDO - Sin necesidad de Android SDK)
```bash
cd apps/mobile
npx expo start
# Luego escanea el QR con Expo Go (app desde Play Store)
```
**Ventaja**: Sin necesidad de compilar nativo, sin SDK necesario
**Desventaja**: Dev Client no funciona, pero Expo Go tiene la mayoría de APIs

### Solución 2: Usar Dev Client con Rebuilds Limpios (RECOMENDADO - Requiere Android SDK)

#### Paso 1: Instalar Android SDK
```bash
# En Windows, descarga Android Studio desde https://developer.android.com/studio
# O instala SDK CLI: https://developer.android.com/tools/sdkmanager
# Luego configura ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
```

#### Paso 2: Verificar Metro Config
Tu `apps/mobile/metro.config.js` YA ESTÁ CORRECTO (contiene extraNodeModules).

#### Paso 3: Limpieza Total + Rebuild
```bash
cd apps/mobile

# Limpiar todo
rm -r node_modules android

# Reinstalar desde raiz
cd ../..
npm install --legacy-peer-deps

# Volver a mobile
cd apps/mobile

# Rebuild limpio
npx expo prebuild --clean

# Compilar e instalar en dispositivo/emulador
npx expo run:android
```

#### Paso 4: Arrancar dev server
```bash
npx expo start --clear
# Presiona 'a' para abrir Android
```

### Solución 3: Verificar que nohoist está activado
```bash
# En la raiz, verifica que package.json contiene:
# "nohoist": [
#   "**/react-native",
#   "**/react-native/**",
#   "**/@react-native/**",
#   "**/react-native-*",
#   "**/react-native-*/**"
# ]

# Luego reinstala
npm install
```

## 🐛 Debug adicional

Si aún persiste el error, ejecuta en la terminal (no en el app):
```bash
cd apps/mobile
npx expo-doctor
```

Busca warnings sobre:
- Metro config settings
- Package resolution issues
- Native module linking

## 📋 Checklist de Verificación

- [ ] `metro.config.js` contiene `extraNodeModules` con `react-native`
- [ ] `package.json` (raiz) contiene `nohoist` para `react-native` y `@react-native`
- [ ] `fresh_install.bat` ha sido ejecutado correctamente
- [ ] `expo prebuild --clean` ha regenerado la carpeta `android/`
- [ ] `npx expo run:android` compiló sin errores (requiere SDK)
- [ ] `npx expo start --clear` inicia sin errores en terminal

## 🚀 Comando Rápido de Recuperación Total

Si todo falla, ejecuta en orden:

```bash
# 1. Posiciónate en raiz
cd C:\Users\pedro\Downloads\turismo\ruta-segura-peru

# 2. Ejecuta el script de limpieza
.\fresh_install.bat

# 3. Si tienes SDK, luego:
cd apps\mobile
npx expo prebuild --clean
npx expo run:android

# 4. Si no tienes SDK, usa Expo Go:
npx expo start
# Escanea el QR con Expo Go desde tu teléfono
```

## 🔗 Referencias

- [Expo Troubleshooting](https://docs.expo.dev/debugging/runtime-issues/)
- [React Native TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [Metro Config Monorepo](https://facebook.github.io/metro/docs/configuration/)

---

**Estado de tu proyecto:**
✅ metro.config.js: Correcto
✅ package.json nohoist: Correcto  
✅ app.json: Correcto (removimos edgeToEdgeEnabled inválido)
⚠️ Android SDK: NO INSTALADO (requiere instalación manual)
⚠️ Dev Client: Necesita rebuild nativo

**Recomendación para ahora:**
1. Usa Expo Go temporalmente (Solución 1)
2. Luego instala Android SDK y usa Solución 2
