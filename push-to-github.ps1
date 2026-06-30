# push-to-github.ps1
Write-Host "==========================================" -ForegroundColor Green
Write-Host "      LinkUp GitHub Push Helper" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Ask user for their GitHub Username
$username = Read-Host -Prompt "Enter your GitHub Username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Error "Username cannot be empty."
    exit
}

# Ask user for their GitHub Repository Name
$repoName = Read-Host -Prompt "Enter your GitHub Repository Name (e.g., LinkUp)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    Write-Error "Repository name cannot be empty."
    exit
}

# Ask user for their GitHub Personal Access Token (Classic)
Write-Host "Paste your Personal Access Token (chars will not show for security):" -ForegroundColor Yellow
$token = Read-Host -AsSecureString
if ($null -eq $token) {
    Write-Error "Token cannot be empty."
    exit
}
# Convert secure string to plain text for URL embedding
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

Write-Host "Updating git remote configuration..." -ForegroundColor Cyan

# Remove existing remote if any
git remote remove origin 2>$null

# Construct authenticated URL
$remoteUrl = "https://${username}:${plainToken}@github.com/${username}/${repoName}.git"

# Add new remote
git remote add origin $remoteUrl

Write-Host "Pushing files to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "   Success! Your code is now on GitHub!   " -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Warning "Push failed. Please verify your token permissions (make sure 'repo' scope is selected)."
}
