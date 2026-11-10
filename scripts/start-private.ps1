$ErrorActionPreference = 'Stop'
# Use the security module shipped with this host, even when launched from PowerShell 7.
Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1')
if (-not $env:DL_AUTH_PASSWORD) {
  $dir = Join-Path $env:LOCALAPPDATA 'DomainLocker'
  $path = Join-Path $dir 'login.dpapi'
  if (Test-Path -LiteralPath $path) {
    $secret = Get-Content -Raw -LiteralPath $path | ConvertTo-SecureString
  } else {
    $secret = Read-Host 'Create your Domain Locker password (12 or more characters)' -AsSecureString
    if ($secret.Length -lt 12) { throw 'Use at least 12 characters.' }
    $confirm = Read-Host 'Confirm password' -AsSecureString
    $value = [Net.NetworkCredential]::new('', $secret).Password
    if ($value -cne [Net.NetworkCredential]::new('', $confirm).Password) { throw 'Passwords do not match.' }
    [IO.Directory]::CreateDirectory($dir) | Out-Null
    $file = [IO.File]::Open($path, 'CreateNew', 'Write', 'None')
    try {
      $bytes = [Text.Encoding]::UTF8.GetBytes((ConvertFrom-SecureString $secret))
      $file.Write($bytes, 0, $bytes.Length)
    } finally { $file.Dispose() }
  }
  $env:DL_AUTH_PASSWORD = [Net.NetworkCredential]::new('', $secret).Password
}
if (-not $env:DL_DB_KEY) {
  $dir = Join-Path $env:LOCALAPPDATA 'DomainLocker'
  $path = Join-Path $dir 'database.dpapi'
  if (-not (Test-Path -LiteralPath $path)) {
    [IO.Directory]::CreateDirectory($dir) | Out-Null
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $secret = ConvertTo-SecureString ([Convert]::ToBase64String($bytes)) -AsPlainText -Force
    $file = [IO.File]::Open($path, 'CreateNew', 'Write', 'None')
    try {
      $encoded = [Text.Encoding]::UTF8.GetBytes((ConvertFrom-SecureString $secret))
      $file.Write($encoded, 0, $encoded.Length)
    } finally { $file.Dispose() }
  }
  $secret = Get-Content -Raw -LiteralPath $path | ConvertTo-SecureString
  $env:DL_DB_KEY = [Net.NetworkCredential]::new('', $secret).Password
}
& node (Join-Path $PSScriptRoot '../dist/analog/server/index.mjs')
exit $LASTEXITCODE
