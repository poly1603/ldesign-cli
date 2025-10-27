$baseUrl = "http://localhost:3000"

Write-Host "Test 1: Get all tools"
$r1 = Invoke-RestMethod -Uri "$baseUrl/api/tools"
Write-Host "Tools count: $($r1.data.Count)"

Write-Host "`nTest 2: Get builder status"
$r2 = Invoke-RestMethod -Uri "$baseUrl/api/tools/builder/status"
Write-Host "Builder status: $($r2.data.status)"

Write-Host "`nTest 3: Get builder config"
$r3 = Invoke-RestMethod -Uri "$baseUrl/api/tools/builder/config"
Write-Host "Config loaded: $($r3.success)"

Write-Host "`nTest 4: Get projects"
$r4 = Invoke-RestMethod -Uri "$baseUrl/api/projects"
Write-Host "Projects count: $($r4.data.Count)"

Write-Host "`nTest 5: Get homepage"
$r5 = Invoke-WebRequest -Uri "$baseUrl/"
Write-Host "Homepage status: $($r5.StatusCode)"

Write-Host "`nAll tests completed!"

