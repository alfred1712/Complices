$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$projectId = 'juego-cruzado'
$hostingTarget = 'complices'
$hostingUrl = 'https://complices-en-juego.web.app'

$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
  throw 'Firebase CLI no está en PATH. Instálalo e inicia sesión con `firebase login` antes de publicar.'
}

Push-Location $projectDir
try {
  Write-Host "Publicando Cómplices únicamente en el target '$hostingTarget' ($hostingUrl)..." -ForegroundColor Cyan
  & $firebase.Source deploy --only "hosting:$hostingTarget" --project $projectId
  $deployExitCode = $LASTEXITCODE
  if ($deployExitCode -ne 0) { throw "El despliegue falló con código $deployExitCode." }

  $record = "Despliegue exitoso: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')`nProyecto: $projectId`nTarget: $hostingTarget`nURL: $hostingUrl"
  Add-Content -Path (Join-Path $projectDir 'hosting-deploy-result.txt') -Value "`n$record" -Encoding utf8
  Write-Host "Publicación terminada: $hostingUrl" -ForegroundColor Green
} finally {
  Pop-Location
}
