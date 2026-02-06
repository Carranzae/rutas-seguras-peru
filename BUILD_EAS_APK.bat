@echo off
setlocal enabledelayedexpansion
echo ==================================================================
echo   RUTA SEGURA - BUILD APK CON EAS (En la Nube - Sin Android Studio)
echo ==================================================================
echo.

:MENU
cls
echo ==================================================================
echo   MENU PRINCIPAL
echo ==================================================================
echo.
echo [1] Paso 1: Login en Expo (primeras vez)
echo [2] Paso 2: Configurar proyecto en EAS
echo [3] Paso 3: Construir APK (Desarrollo - Rapido)
echo [4] Paso 4: Construir APK (Preview - Recomendado)
echo [5] Ver estado de builds anteriores
echo [6] Salir
echo.
set /p OPCION="Selecciona una opcion (1-6): "

if "%OPCION%"=="1" goto LOGIN
if "%OPCION%"=="2" goto CONFIGURE
if "%OPCION%"=="3" goto BUILD_DEV
if "%OPCION%"=="4" goto BUILD_PREVIEW
if "%OPCION%"=="5" goto LIST_BUILDS
if "%OPCION%"=="6" goto EXIT

echo Opcion invalida. Intenta de nuevo.
timeout /t 2 >nul
goto MENU

:LOGIN
cls
echo [1/6] AUTENTICACION EN EXPO
echo.
echo Abriendo navegador para que inicies sesion...
npx eas login
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Login exitoso!
) else (
    echo.
    echo ✗ Error durante login. Intenta de nuevo.
    timeout /t 3 >nul
)
pause
goto MENU

:CONFIGURE
cls
echo [2/6] CONFIGURACION DE PROYECTO EN EAS
echo.
pushd apps\mobile
echo Configurando credenciales y vinculando proyecto...
npx eas build:configure
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Proyecto configurado en EAS!
) else (
    echo.
    echo ✗ Error durante configuracion. Verifica app.json
    timeout /t 3 >nul
)
popd
pause
goto MENU

:BUILD_DEV
cls
echo [3/6] CONSTRUIR APK (MODO DESARROLLO - Rapido)
echo.
echo DURACION ESTIMADA: 5-10 minutos
echo TIPO: Debug (no optimizado, pero rapido para pruebas)
echo.
set /p CONFIRM="¿Continuar? (S/N): "
if /i not "%CONFIRM%"=="S" goto MENU

pushd apps\mobile
echo.
echo Enviando codigo a servidores de Expo...
npx eas build --platform android --profile development --wait
popd

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================================
    echo   ✓ APK COMPILADO EXITOSAMENTE!
    echo ==================================================================
    echo.
    echo Tu APK esta listo. Proximos pasos:
    echo   1. Abre el link de descarga en el navegador
    echo   2. Descarga el APK en tu telefono
    echo   3. Abre el APK para instalar
    echo.
) else (
    echo.
    echo ✗ Error durante compilacion. Revisa los logs.
)
pause
goto MENU

:BUILD_PREVIEW
cls
echo [4/6] CONSTRUIR APK (MODO PREVIEW - Recomendado)
echo.
echo DURACION ESTIMADA: 10-15 minutos
echo TIPO: Release optimizado (mejor performance)
echo.
set /p CONFIRM="¿Continuar? (S/N): "
if /i not "%CONFIRM%"=="S" goto MENU

pushd apps\mobile
echo.
echo Enviando codigo a servidores de Expo...
npx eas build --platform android --profile preview --wait
popd

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================================
    echo   ✓ APK COMPILADO EXITOSAMENTE!
    echo ==================================================================
    echo.
    echo Tu APK esta listo. Proximos pasos:
    echo   1. Abre el link de descarga en el navegador
    echo   2. Descarga el APK en tu telefono
    echo   3. Abre el APK para instalar
    echo   4. Abre la app y verifica que NO hay error de PlatformConstants
    echo.
) else (
    echo.
    echo ✗ Error durante compilacion. Revisa los logs.
)
pause
goto MENU

:LIST_BUILDS
cls
echo [5/6] VER BUILDS ANTERIORES
echo.
pushd apps\mobile
npx eas build:list
popd
echo.
pause
goto MENU

:EXIT
cls
echo ==================================================================
echo   HASTA LUEGO!
echo ==================================================================
echo.
echo Recuerda:
echo   - Manten tu proyecto en Git
echo   - Cada commit a 'main' puede generar un build automatico
echo   - Consulta la guia: GUIA_EAS_BUILD.md
echo.
timeout /t 3 >nul
exit /b 0
