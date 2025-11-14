# Script pour nettoyer le cache des icônes Windows et désinstaller les anciennes versions

Write-Host "=== Nettoyage ListX ===" -ForegroundColor Cyan

# 1. Fermer ListX si ouvert
Write-Host "`n1. Fermeture de ListX..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object { $_.Name -like "*ListX*" -or $_.ProcessName -like "*listx*" }
if ($processes) {
    $processes | ForEach-Object {
        Write-Host "  - Arrêt de $($_.ProcessName) (PID: $($_.Id))"
        Stop-Process -Id $_.Id -Force
    }
} else {
    Write-Host "  - Aucun processus ListX en cours"
}

# 2. Rechercher les installations
Write-Host "`n2. Recherche des installations..." -ForegroundColor Yellow
$possiblePaths = @(
    "$env:LOCALAPPDATA\Programs\ListX",
    "$env:LOCALAPPDATA\ListX",
    "$env:ProgramFiles\ListX",
    "${env:ProgramFiles(x86)}\ListX",
    "$env:APPDATA\ListX"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        Write-Host "  - Trouvé: $path" -ForegroundColor Green

        # Chercher l'uninstaller
        $uninstaller = Get-ChildItem -Path $path -Recurse -Filter "Uninstall*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($uninstaller) {
            Write-Host "    Désinstalleur trouvé: $($uninstaller.FullName)" -ForegroundColor Cyan
            Write-Host "    Voulez-vous désinstaller? (O/N)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq "O" -or $response -eq "o") {
                Start-Process -FilePath $uninstaller.FullName -ArgumentList "/S" -Wait
                Write-Host "    Désinstallation terminée" -ForegroundColor Green
            }
        }
    }
}

# 3. Supprimer les raccourcis
Write-Host "`n3. Suppression des raccourcis..." -ForegroundColor Yellow
$shortcuts = @(
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\ListX.lnk",
    "$env:PUBLIC\Desktop\ListX.lnk",
    "$env:USERPROFILE\Desktop\ListX.lnk"
)

foreach ($shortcut in $shortcuts) {
    if (Test-Path $shortcut) {
        Remove-Item $shortcut -Force
        Write-Host "  - Supprimé: $shortcut" -ForegroundColor Green
    }
}

# 4. Nettoyer le cache des icônes Windows
Write-Host "`n4. Nettoyage du cache des icônes..." -ForegroundColor Yellow

# Arrêter l'explorateur
Write-Host "  - Arrêt de l'explorateur Windows..."
Stop-Process -Name explorer -Force

Start-Sleep -Seconds 2

# Supprimer les fichiers de cache d'icônes
$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db"
)

foreach ($cachePath in $iconCachePaths) {
    Get-Item $cachePath -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "  - Supprimé: $($_.FullName)" -ForegroundColor Green
    }
}

# Redémarrer l'explorateur
Write-Host "  - Redémarrage de l'explorateur Windows..."
Start-Process explorer.exe

Write-Host "`n=== Nettoyage terminé ===" -ForegroundColor Cyan
Write-Host "`nVous pouvez maintenant:" -ForegroundColor Yellow
Write-Host "  1. Télécharger la nouvelle version depuis GitHub Releases"
Write-Host "  2. Installer ListX-Setup-1.3.3.exe"
Write-Host "  3. L'icône devrait maintenant s'afficher correctement"
Write-Host "`nAppuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
