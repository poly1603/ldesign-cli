# UI API 功能测试脚本

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LDesign CLI UI API 功能测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 测试 1: 获取所有工具
Write-Host "[测试 1] 获取所有工具列表..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tools" -Method GET
    if ($response.success) {
        Write-Host "✅ 成功! 工具数量: $($response.data.Count)" -ForegroundColor Green
        Write-Host "   工具列表:" -ForegroundColor Gray
        $response.data | ForEach-Object {
            Write-Host "   - $($_.metadata.displayName) ($($_.name)): $($_.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ 失败: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 2: 获取单个工具状态
Write-Host "`n[测试 2] 获取 Builder 工具状态..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tools/builder/status" -Method GET
    if ($response.success) {
        Write-Host "✅ 成功! Builder 状态: $($response.data.status)" -ForegroundColor Green
    } else {
        Write-Host "❌ 失败: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 3: 获取工具配置
Write-Host "`n[测试 3] 获取 Builder 工具配置..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tools/builder/config" -Method GET
    if ($response.success) {
        Write-Host "✅ 成功! 配置项数量: $($response.data.PSObject.Properties.Count)" -ForegroundColor Green
    } else {
        Write-Host "❌ 失败: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 4: 获取所有项目
Write-Host "`n[测试 4] 获取所有项目..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method GET
    if ($response.success) {
        Write-Host "✅ 成功! 项目数量: $($response.data.Count)" -ForegroundColor Green
    } else {
        Write-Host "❌ 失败: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 5: 测试前端页面
Write-Host "`n[测试 5] 测试前端页面加载..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -Method GET
    if ($response.StatusCode -eq 200 -and $response.Content -match "LDesign") {
        Write-Host "✅ 成功! 前端页面正常加载 (状态码: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ 失败: 页面内容异常" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 6: 测试静态资源
Write-Host "`n[测试 6] 测试静态资源..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/favicon.svg" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 成功! 静态资源正常访问" -ForegroundColor Green
    } else {
        Write-Host "❌ 失败: 状态码 $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

# 测试 7: 测试 CORS
Write-Host "`n[测试 7] 测试 CORS 配置..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/tools" -Method GET
    $corsHeader = $response.Headers['Access-Control-Allow-Credentials']
    if ($corsHeader -eq 'true') {
        Write-Host "OK CORS configured" -ForegroundColor Green
    } else {
        Write-Host "WARNING CORS may not be complete" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试完成!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

