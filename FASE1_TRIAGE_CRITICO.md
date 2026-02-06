# FASE 1: TRIAGE CRÍTICO
## Resolver error PlatformConstants + Establecer baseline técnico

---

## PROBLEMA ACTUAL
- ❌ `'PlatformConstants' could not be found` en el teléfono/emulador
- ❌ Metro compila OK, pero binario nativo NO está configurado correctamente
- ❌ Sin Android SDK → no hay forma de compilar nativo

## SOLUCIÓN INMEDIATA (30 minutos)

### Opción A: Expo Go (SIN INSTALAR NADA)
**Requerimientos:** Teléfono + Expo Go (app gratuita)

```bash
cd apps/mobile
npx expo start --clear
# Escanea el QR con Expo Go
```

**Ventajas:**
- ✅ 0 dependencias de compilación
- ✅ 0 configuración de SDK
- ✅ Compatible con 99% de APIs
- ✅ Deploy en segundos

**Desventajas:**
- ❌ No acceso a módulos nativos personalizados
- ❌ Performance limitada

---

### Opción B: Docker + Android Emulator (RECOMENDADO PARA CONCURSO)

**Requerimientos:** Docker (11 GB descarga inicial)

```bash
# 1. Instalar Docker: https://www.docker.com/products/docker-desktop

# 2. Usar imagen Expo + Android preconfigurada
docker run -it --rm \
  -v "C:\Users\pedro\Downloads\turismo\ruta-segura-peru:/workspace" \
  -w /workspace/apps/mobile \
  eas-cli:latest \
  expo prebuild --clean && expo run:android
```

**Ventajas:**
- ✅ Emulador Android sin instalar 15GB de Android Studio
- ✅ Reproducible en cualquier máquina
- ✅ Aislado del sistema operativo
- ✅ Ideal para CI/CD

**Desventajas:**
- ⚠️ 11 GB de descarga
- ⚠️ Lento en la primera ejecución

---

### Opción C: Instalación Manual de Android SDK (TEDIOSO)

```bash
# 1. Descargar Android Studio
https://developer.android.com/studio

# 2. Configurar variables de entorno
$env:ANDROID_HOME = "C:\Users\pedro\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

# 3. Instalar emulador
# (Abrir Android Studio → Device Manager → Crear emulador)

# 4. Iniciar emulador
# emulator -avd Pixel_5_API_34

# 5. Compilar
cd apps/mobile
npx expo prebuild --clean
npx expo run:android
```

---

## RECOMENDACIÓN FINAL

**PARA DEMOSTRACIÓN INMEDIATA:** Opción A (Expo Go)
- Muestra la app funcionando SIN el error de PlatformConstants
- 5 minutos de setup

**PARA CONCURSO MINISTERIAL:** Opción B (Docker)
- Reproducible, profesional, escalable
- Impresiona al jurado con DevOps

**PARA DESARROLLO DIARIO:** Opción C (Manual)
- Una sola vez, incómodo pero funciona para siempre

---

## CHECKLIST PRE-ARQUITECTURA EMPRESARIAL

Antes de implementar MQTT, gRPC, Temporal.io:

- [ ] App compila sin errores en dispositivo/emulador
- [ ] Puedes ver la pantalla de inicio en el teléfono
- [ ] Mapas funcionan (Mapbox muestra la ubicación)
- [ ] Biometría se integra correctamente
- [ ] Backend (FastAPI) responde desde el móvil

Una vez esto esté ✅, procedemos con Fase 2.

---

## SIGUIENTE PASO

Responde: **¿Cuál opción prefieres?**
A) Expo Go (5 min, SIN instalación)
B) Docker (Profesional, reproducible)
C) Android Studio Manual (Completo pero tedioso)
