# Quick Server Test Script
# Tests if the server is running and responding

$serverUrl = "http://193.57.137.90:8000"
$localUrl = "http://localhost:8000"

Write-Host "=== INK NFS Backend Server Test ===" -ForegroundColor Cyan
Write-Host ""

# Test Production Server
Write-Host "Testing Production Server: $serverUrl" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Production server is running!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Production server is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Local Server
Write-Host "Testing Local Server: $localUrl" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$localUrl/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Local server is running!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Local server is not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

