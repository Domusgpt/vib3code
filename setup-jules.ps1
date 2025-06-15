# Jules Environment Setup Script for Paul Phillips Projects
# PowerShell script for Windows setup

Write-Host "🚀 Setting up Jules' development environment for Paul Phillips projects..." -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Please run this script as Administrator for full installation" -ForegroundColor Yellow
}

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Install Winget if not available
if (-not (Test-Command "winget")) {
    Write-Host "📦 Installing Windows Package Manager..." -ForegroundColor Yellow
    # Download and install winget
    $progressPreference = 'silentlyContinue'
    $url = "https://aka.ms/getwinget"
    $output = "$env:TEMP\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle"
    Invoke-WebRequest -Uri $url -OutFile $output
    Add-AppxPackage $output
}

Write-Host "📦 Installing essential development tools..." -ForegroundColor Green

# Install core development tools
$tools = @(
    "Git.Git",
    "GitHub.cli", 
    "OpenJS.NodeJS",
    "Python.Python.3.11",
    "Microsoft.VisualStudioCode",
    "ImageMagick.ImageMagick"
)

foreach ($tool in $tools) {
    Write-Host "Installing $tool..." -ForegroundColor Blue
    try {
        winget install $tool --accept-package-agreements --accept-source-agreements --silent
        Write-Host "✅ $tool installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install $tool" -ForegroundColor Red
    }
}

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "🔧 Configuring development tools..." -ForegroundColor Green

# Configure Git
Write-Host "Configuring Git..." -ForegroundColor Blue
git config --global init.defaultBranch main
git config --global pull.rebase false

# Install global npm packages
Write-Host "Installing global npm packages..." -ForegroundColor Blue
npm install -g firebase-tools serve

# Install Python packages
Write-Host "Installing Python packages..." -ForegroundColor Blue
pip install markdown beautifulsoup4 pillow requests pyyaml

# Create projects directory
$projectsDir = "$env:USERPROFILE\paul-phillips-projects"
if (-not (Test-Path $projectsDir)) {
    New-Item -ItemType Directory -Path $projectsDir
    Write-Host "📁 Created projects directory: $projectsDir" -ForegroundColor Green
}

# Install VS Code extensions
Write-Host "Installing VS Code extensions..." -ForegroundColor Blue
$extensions = @(
    "ms-vscode.vscode-github-pullrequest",
    "github.vscode-pull-request-github", 
    "ms-python.python",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.live-server"
)

foreach ($ext in $extensions) {
    code --install-extension $ext
}

Write-Host "🔑 Setting up authentication..." -ForegroundColor Green
Write-Host "Please complete the following manual steps:" -ForegroundColor Yellow
Write-Host "1. Run: gh auth login" -ForegroundColor White
Write-Host "2. Run: firebase login" -ForegroundColor White
Write-Host "3. Configure Git user:" -ForegroundColor White
Write-Host "   git config --global user.name 'Jules [LastName]'" -ForegroundColor White
Write-Host "   git config --global user.email 'jules@[email].com'" -ForegroundColor White

# Create quick start script
$quickStartScript = @"
# Quick Start Commands for Jules
cd $projectsDir

# Clone VIB3CODE repository
git clone https://github.com/Domusgpt/vib3code.git
cd vib3code

# Start local development server
python -m http.server 8000

# Open in VS Code
code .
"@

$quickStartScript | Out-File "$projectsDir\quick-start.ps1" -Encoding UTF8

Write-Host "📋 Creating helpful aliases..." -ForegroundColor Green

# Create PowerShell profile with useful aliases
$profileContent = @"
# Paul Phillips Project Aliases
function vib3 { 
    Set-Location "$projectsDir\vib3code"
    python -m http.server 8000
}

function vib3-deploy {
    cd "$projectsDir\vib3code"
    gh run list --limit 5
}

function vib3-status {
    cd "$projectsDir\vib3code" 
    Write-Host "Local index.html: " -NoNewline
    (Get-Item index.html).Length
    Write-Host "Deployed: " -NoNewline
    (Invoke-WebRequest https://domusgpt.github.io/vib3code/).Content.Length
}

function vib3-debug {
    cd "$projectsDir\vib3code"
    gh run view --log
}
"@

# Create PowerShell profile if it doesn't exist
if (-not (Test-Path $PROFILE)) {
    New-Item -Path $PROFILE -Type File -Force
}

Add-Content $PROFILE $profileContent

Write-Host "🎯 Verification tests..." -ForegroundColor Green

# Verify installations
$verificationTests = @{
    "Git" = { git --version }
    "GitHub CLI" = { gh --version }
    "Node.js" = { node --version }
    "Python" = { python --version }
    "VS Code" = { code --version }
    "Firebase CLI" = { firebase --version }
}

foreach ($test in $verificationTests.GetEnumerator()) {
    try {
        $result = & $test.Value
        Write-Host "✅ $($test.Key): $($result.Split("`n")[0])" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($test.Key): Not installed or not in PATH" -ForegroundColor Red
    }
}

Write-Host "`n🚀 SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "Next steps for Jules:" -ForegroundColor Yellow
Write-Host "1. Restart PowerShell/Terminal" -ForegroundColor White
Write-Host "2. Run authentication commands shown above" -ForegroundColor White
Write-Host "3. Execute: $projectsDir\quick-start.ps1" -ForegroundColor White
Write-Host "4. Use 'vib3' command to start VIB3CODE development" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "vib3          - Start VIB3CODE development server" -ForegroundColor White
Write-Host "vib3-deploy   - Check deployment status" -ForegroundColor White
Write-Host "vib3-status   - Compare local vs deployed file sizes" -ForegroundColor White
Write-Host "vib3-debug    - View deployment logs" -ForegroundColor White

Write-Host "`n📋 Read JULES_ENVIRONMENT_SETUP.md for complete documentation" -ForegroundColor Cyan