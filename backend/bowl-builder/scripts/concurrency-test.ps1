# Concurrency test: 50 simultaneous orders against an ingredient with 10 portions.
# Expected with optimistic locking: exactly 10 x 201, 40 x 409, stock 0.
# Needs the app running on localhost:8080 and an ADMIN account.
param(
    [string]$AdminEmail = "test@example.com",
    [string]$AdminPassword = "password123",
    [string]$CustomerEmail = "other@example.com",
    [string]$CustomerPassword = "password123",
    [int]$Portions = 10,
    [int]$Requests = 50
)

$api = "http://localhost:8080"
function Login($email, $password) {
    (Invoke-RestMethod -Method Post -Uri "$api/api/auth/login" -ContentType "application/json" `
        -Body (@{ email = $email; password = $password } | ConvertTo-Json)).token
}
$admin = Login $AdminEmail $AdminPassword
$cust = Login $CustomerEmail $CustomerPassword

# Banana (id 3) is the scarce topping; Pitaya (id 2) has plenty of stock.
foreach ($setup in @(@{ id = 3; stock = $Portions }, @{ id = 2; stock = 1000 })) {
    Invoke-RestMethod -Method Patch -Uri "$api/api/ingredients/$($setup.id)/stock" `
        -Headers @{ Authorization = "Bearer $admin" } -ContentType "application/json" `
        -Body (@{ stock = $setup.stock } | ConvertTo-Json) | Out-Null
}
Write-Host "Reset: Banana = $Portions, Pitaya = 1000. Firing $Requests parallel orders..."

$body = '{"baseId":2,"toppingIds":[3],"size":"SMALL"}'
$pool = [runspacefactory]::CreateRunspacePool(1, $Requests)
$pool.Open()
$work = {
    param($token, $body)
    try {
        $r = Invoke-WebRequest -Method Post -Uri "http://localhost:8080/api/orders" `
            -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" `
            -Body $body -UseBasicParsing
        [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { -1 }
    }
}
$jobs = 1..$Requests | ForEach-Object {
    $ps = [powershell]::Create().AddScript($work).AddArgument($cust).AddArgument($body)
    $ps.RunspacePool = $pool
    [pscustomobject]@{ PS = $ps; Handle = $ps.BeginInvoke() }
}
$codes = $jobs | ForEach-Object { $_.PS.EndInvoke($_.Handle); $_.PS.Dispose() }
$pool.Close()

$ok = @($codes | Where-Object { $_ -eq 201 }).Count
$rejected = @($codes | Where-Object { $_ -eq 409 }).Count
$other = $Requests - $ok - $rejected
$items = Invoke-RestMethod "$api/api/ingredients"
$banana = ($items | Where-Object { $_.id -eq 3 }).stock

Write-Host ""
Write-Host "Orders accepted (201): $ok"
Write-Host "Rejected (409):        $rejected"
Write-Host "Other responses:       $other"
Write-Host "Banana stock left:     $banana"

if ($ok -eq $Portions -and $rejected -eq ($Requests - $Portions) -and $banana -eq 0) {
    Write-Host "PASS: no overselling, no lost updates." -ForegroundColor Green
} else {
    Write-Host "FAIL: expected $Portions accepted, $($Requests - $Portions) rejected, 0 left." -ForegroundColor Red
    exit 1
}
