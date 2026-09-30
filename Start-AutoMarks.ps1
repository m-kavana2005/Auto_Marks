# Starts both local services in separate, persistent processes.
# Run from PowerShell: .\Start-AutoMarks.ps1

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot 'automarks_BE'
$frontendPath = Join-Path $projectRoot 'automarks_FE'
$backendPython = Join-Path $backendPath '.venv\Scripts\python.exe'

if (-not (Test-Path $backendPython)) {
    $backendPython = 'python'
}

function Test-LocalPort([int]$Port) {
    try {
        return [bool](Test-NetConnection -ComputerName '127.0.0.1' -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue)
    } catch {
        return $false
    }
}

if (-not (Test-LocalPort 8000)) {
    # Use Uvicorn directly without the development reloader.  The reloader creates a
    # second child process and can leave the API unavailable after a terminal closes.
    Start-Process -FilePath $backendPython -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory $backendPath -WindowStyle Hidden
    Write-Host 'Starting API at http://127.0.0.1:8000 ...'
} else {
    Write-Host 'API is already running at http://127.0.0.1:8000.'
}

if (-not (Test-LocalPort 3000)) {
    Start-Process -FilePath 'npm' -ArgumentList 'run','dev','--','--host','127.0.0.1' -WorkingDirectory $frontendPath
    Write-Host 'Starting frontend at http://127.0.0.1:3000 ...'
} else {
    Write-Host 'Frontend is already running at http://127.0.0.1:3000.'
}
