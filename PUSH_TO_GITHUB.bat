@echo off
setlocal enabledelayedexpansion
echo ==================================================================
echo   ACTUALIZAR GITHUB CON TODOS LOS CAMBIOS
echo ==================================================================
echo.

cd /d "C:\Users\pedro\Downloads\turismo\ruta-segura-peru"

echo [1/5] Verificando estado de git...
git status --short
echo.

echo [2/5] Agregando todos los cambios...
git add .
echo    ✓ Cambios agregados

echo [3/5] Creando commit con mensaje descriptivo...
git commit -m "feat: fix PlatformConstants TurboModule error and backend connectivity

- Enhanced metro.config.js with extraNodeModules mapping for React Native
- Extended nohoist patterns in package.json for proper dependency resolution
- Removed invalid edgeToEdgeEnabled property from app.json
- Configured EAS Build profiles for APK compilation
- Updated README with complete project documentation
- Added troubleshooting guides and deployment instructions
- Fixed backend connectivity for mobile app (http://192.168.48.174:8000)
- Implemented clean rebuild process with fresh_install.bat and CLEAN_REBUILD.ps1
- Cloud-native architecture with Expo Application Services (EAS)

Fixes:
- Resolves Invariant Violation: 'Platform Constants' could not be found
- Enables APK installation and testing on real devices
- Establishes mobile-to-backend communication

Files Modified:
- apps/mobile/metro.config.js (monorepo support)
- package.json (workspaces and nohoist configuration)
- apps/mobile/app.json (removed invalid properties)
- apps/mobile/eas.json (build profiles)
- apps/mobile/src/core/api/config.ts (IP configuration)
- README.md (comprehensive documentation)

Scripts Added:
- fresh_install.bat (automated cleanup and rebuild)
- BUILD_EAS_APK.bat (EAS build automation)
- CLEAN_REBUILD.ps1 (PowerShell rebuild)
- GUIA_EAS_BUILD.md (detailed guide)
- SOLUCION_PLATFORMCONSTANTS.md (troubleshooting)

Co-Authored-By: Warp <agent@warp.dev>"
echo    ✓ Commit creado

echo [4/5] Verificando rama remota...
git remote -v

echo [5/5] Empujando cambios a GitHub...
git push origin main
echo    ✓ Cambios empujados a GitHub

echo.
echo ==================================================================
echo   ✓ ACTUALIZADO EXITOSAMENTE
echo ==================================================================
echo.
echo Ver cambios en: https://github.com/Carranzae/rutas-seguras-peru
echo.
pause
