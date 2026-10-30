$ErrorActionPreference = 'Stop'
$projectDir = 'C:\Users\alfre\Downloads\jueguito'
$cli = 'C:\Users\alfre\AppData\Local\Temp\chispa-firebase-cli\node_modules\firebase-tools\lib\bin\firebase.js'
$env:XDG_CONFIG_HOME = 'C:\Users\alfre\AppData\Local\Temp\chispa-firebase-home\config'
$env:XDG_CACHE_HOME = 'C:\Users\alfre\AppData\Local\Temp\chispa-firebase-home\cache'
$env:XDG_DATA_HOME = 'C:\Users\alfre\AppData\Local\Temp\chispa-firebase-home\data'
$env:FIREBASE_CLI_DISABLE_UPDATE_CHECK = 'true'
Set-Location $projectDir
Write-Host 'Se abrirá Google para iniciar sesión con Firebase CLI. No compartas tu contraseña ni códigos en el chat.' -ForegroundColor Cyan
node $cli login
if ($LASTEXITCODE -ne 0) { Write-Host 'El inicio de sesión no terminó. Revisa el mensaje anterior.' -ForegroundColor Red; Read-Host 'Pulsa Enter para cerrar'; exit $LASTEXITCODE }
Write-Host 'Sesión iniciada. Publicando Chispa Web en juego-cruzado...' -ForegroundColor Cyan
node $cli deploy --only hosting --project juego-cruzado
if ($LASTEXITCODE -eq 0) {
  Set-Content -Path (Join-Path $projectDir 'hosting-deploy-result.txt') -Value "Despliegue exitoso: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')`nProyecto: juego-cruzado`nURL: https://juego-cruzado.web.app" -Encoding utf8
  Write-Host 'Publicación terminada. Comprueba la URL de Hosting mostrada arriba.' -ForegroundColor Green
} else { Write-Host 'El despliegue falló; copia el error del terminal al chat (sin incluir datos de acceso).' -ForegroundColor Red }
Read-Host 'Pulsa Enter para cerrar'

