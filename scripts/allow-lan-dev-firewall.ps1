# Run in PowerShell *as Administrator* once per machine.
# Allows phones on the same Wi-Fi to reach the Next.js dev server (port 3000)
# and MinIO (port 9000) during local development.

$ErrorActionPreference = "Stop"

$rules = @(
  @{ Name = "Memopics Web Dev 3000"; Port = 3000 },
  @{ Name = "Memopics MinIO Dev 9000"; Port = 9000 }
)

foreach ($rule in $rules) {
  $existing = netsh advfirewall firewall show rule name="$($rule.Name)" 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Rule already exists: $($rule.Name)"
    continue
  }

  netsh advfirewall firewall add rule `
    name="$($rule.Name)" `
    dir=in action=allow protocol=TCP localport=$($rule.Port) `
    profile=private,public,domain

  Write-Host "Added firewall rule: $($rule.Name) (TCP $($rule.Port))"
}

Write-Host ""
Write-Host "Done. On your phone (same Wi-Fi), open:"
Write-Host "  http://192.168.0.103:3000/auth/login"
Write-Host ""
Write-Host "If your PC IP changes, update apps/web/next.config.js allowedDevOrigins."
