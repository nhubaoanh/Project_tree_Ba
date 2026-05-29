# Script tu dong cap nhat IP vao .env
# Chay script nay moi khi doi mang hoac bat may

$envFile = "$PSScriptRoot\.env"
$port = "6001"

# Lay IP hien tai (WiFi hoac Ethernet, bo qua loopback va virtual)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.*" -and
        $_.IPAddress -notlike "172.*" -and
        $_.PrefixOrigin -ne "WellKnown"
    } |
    Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ Khong tim thay IP hop le!" -ForegroundColor Red
    exit 1
}

$newUrl = "http://${ip}:${port}/api-core"

# Doc noi dung hien tai cua .env
$content = Get-Content $envFile -Raw

# Thay the dong EXPO_PUBLIC_API_URL
$updated = $content -replace 'EXPO_PUBLIC_API_URL=http://[^/\r\n]+', "EXPO_PUBLIC_API_URL=$newUrl"

# Ghi lai file
Set-Content $envFile $updated -NoNewline

Write-Host "✅ Da cap nhat IP thanh: $newUrl" -ForegroundColor Green
Write-Host "👉 Hay restart Expo: npx expo start --clear" -ForegroundColor Yellow
