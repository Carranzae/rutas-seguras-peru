@echo off
setlocal
echo ==================================================================
echo   RUTA SEGURA - INICIO CON EXPO GO (Sin SDK necesario)
echo ==================================================================
echo.
echo Este script inicia tu app con Expo Go, que NO requiere Android SDK.
echo.
echo REQUISITOS:
echo   1. Instala "Expo Go" desde Google Play Store en tu telefono
echo   2. Asegurate de estar en la MISMA RED WIFI que tu PC
echo.
echo ==================================================================
echo.

cd apps\mobile

echo [1/3] Limpiando cache de Metro...
call npx expo start --clear

echo.
echo ==================================================================
echo   EXPO GO INICIADO
echo ==================================================================
echo.
echo 1. Abre la app "Expo Go" en tu telefono (desde Play Store)
echo 2. Escanea el CODIGO QR que aparece arriba con Expo Go
echo 3. Tu app deberia cargar sin el error de PlatformConstants
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.
pause
