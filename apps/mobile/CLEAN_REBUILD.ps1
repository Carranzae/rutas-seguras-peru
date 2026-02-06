# PowerShell Clean Rebuild Script
Write-Host "================================================"
Write-Host "CLEAN REBUILD - Solución Definitiva PlatformConstants"
Write-Host "================================================"
Write-Host ""

$rootPath = "C:\Users\pedro\Downloads\turismo\ruta-segura-peru"
$mobilePath = "$rootPath\apps\mobile"

# Paso 1: Detener procesos
Write-Host "[1/6] Deteniendo procesos node..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process adb -ErrorAction SilentlyContinue | Stop-Process -Force

# Paso 2: Limpiar directorios en mobile
Write-Host "[2/6] Limpiando directorios en mobile..."
if (Test-Path "$mobilePath\android") {
    Remove-Item -Path "$mobilePath\android" -Recurse -Force
    Write-Host "  ✓ android borrado"
}
if (Test-Path "$mobilePath\.expo") {
    Remove-Item -Path "$mobilePath\.expo" -Recurse -Force
    Write-Host "  ✓ .expo borrado"
}
if (Test-Path "$mobilePath\node_modules") {
    Remove-Item -Path "$mobilePath\node_modules" -Recurse -Force
    Write-Host "  ✓ node_modules borrado"
}

# Paso 3: Limpiar directorios en raíz
Write-Host "[3/6] Limpiando directorios en raíz..."
if (Test-Path "$rootPath\node_modules") {
    Remove-Item -Path "$rootPath\node_modules" -Recurse -Force
    Write-Host "  ✓ node_modules raíz borrado"
}

# Paso 4: NPM cache
Write-Host "[4/6] Limpiando cache de NPM..."
npm cache clean --force
Write-Host "  ✓ Cache limpiado"

# Paso 5: Reinstalar desde raíz
Write-Host "[5/6] Reinstalando dependencias..."
Set-Location $rootPath
npm install --legacy-peer-deps --no-audit
Write-Host "  ✓ Instalación completada"

# Paso 6: Prebuild limpio
Write-Host "[6/6] Haciendo prebuild limpio..."
Set-Location $mobilePath
npx expo prebuild --clean
Write-Host "  ✓ Prebuild completado"

Write-Host ""
Write-Host "================================================"
Write-Host "✓ CLEANUP COMPLETO"
Write-Host "================================================"
Write-Host ""
Write-Host "Siguiente paso:"
Write-Host "  npx eas build --platform android --profile preview --wait"
Write-Host ""
