@echo off
setlocal
echo ==================================================================
echo   RUTA SEGURA - PROTOCOLO DE RECUPERACION TOTAL (v3.1 - TURBOMODULE)
echo ==================================================================

echo [1/11] DETENIENDO PROCESOS BLOQUEANTES...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM adb.exe >nul 2>&1
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM openjdk.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo    - Procesos terminados.

echo [2/11] ELIMINACION AGRESIVA DE DIRECTORIOS (Fuerza Bruta)...
REM Raiz
if exist node_modules ( 
    echo    - Eliminando node_modules raiz...
    rmdir /s /q node_modules 
)
if exist package-lock.json ( del /f /q package-lock.json )

REM Apps - Limpieza Recursiva
for /d %%d in (apps\*) do (
    if exist "%%d\node_modules" (
        echo    - Eliminando %%d\node_modules...
        rmdir /s /q "%%d\node_modules"
    )
    if exist "%%d\.expo" (
        rmdir /s /q "%%d\.expo"
    )
    if exist "%%d\.next" (
        rmdir /s /q "%%d\.next"
    )
)

REM Limpieza especifica de Android/iOS
if exist apps\mobile\android\.gradle ( rmdir /s /q apps\mobile\android\.gradle )
if exist apps\mobile\android\app\build ( rmdir /s /q apps\mobile\android\app\build )
if exist apps\mobile\ios\Pods ( rmdir /s /q apps\mobile\ios\Pods )
if exist apps\mobile\ios\build ( rmdir /s /q apps\mobile\ios\build )

echo [3/11] LIMPIEZA DE CACHES DE SISTEMA...
call npm cache clean --force
set "EXPO_METRO_CACHE=%TEMP%\metro-cache"
if exist "%EXPO_METRO_CACHE%" ( rmdir /s /q "%EXPO_METRO_CACHE%" )
echo    - Cache de NPM y Metro limpiadas.

echo [4/11] INSTALACION DESDE RAIZ (workspaces)...
echo       Instalando dependencias desde la raiz con --legacy-peer-deps...
call npm install --legacy-peer-deps --no-audit

echo [5/11] VERIFICACION DE PAQUETES CRITICOS (Parcheo)
call npm install ajv@^8.12.0 ansi-escapes makeerror escape-html encodeurl parseurl on-finished graceful-fs --legacy-peer-deps --save-dev

echo [6/11] ALINEACION DE EXPO (Mobile)
pushd apps\mobile
echo       Ejecutando expo install --fix...
call npx expo@~52.0.0 install --fix

echo [7/11] PREBUILD LIMPIO (Opcional, recomendado para Dev Client)
echo       Regenerando código nativo con expo prebuild --clean...
call npx expo prebuild --clean
popd

echo [8/11] SINCRONIZACION DE PODS/GRADLE (Se hará en la primera corrida)
echo       Android/iOS reconstruiran dependencias nativas en la próxima ejecución.

echo [9/11] DIAGNOSTICO FINAL (Doctor)
pushd apps\mobile
call npx expo-doctor
popd

echo [10/11] INICIO LIMPIO DE METRO
pushd apps\mobile
call npx expo start --clear
popd

echo [11/11] FIN
echo.
echo ==================================================================
echo   PROCESO COMPLETADO. Si ves errores, comparte el log completo.
echo ==================================================================
echo.
echo Para iniciar TODO el sistema (Webs + Movil):
echo    npm start
echo.
echo Para iniciar SOLO el Movil (con cache limpio):
echo    npm run dev:mobile -- --clear
echo.
pause
