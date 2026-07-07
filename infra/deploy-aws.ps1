param(
    [Parameter(Mandatory = $true)] [string] $RepositoryUrl,
    [Parameter(Mandatory = $true)] [string] $BootstrapAdminEmail,
    [string] $RepositoryBranch = 'main',
    [string] $StackName = 'vdcms-prod',
    [string] $Region = 'ap-southeast-1',
    [string] $SesFromEmail = '',
    [string] $WebPushVapidPublicKey = '',
    [string] $WebPushVapidPrivateKey = '',
    [string] $WebPushVapidSubject = 'mailto:admin@example.com'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$template = Join-Path $PSScriptRoot 'cloudformation\vdcms-production.yml'
$frontend = Join-Path $root 'FE'

Write-Host 'Checking AWS identity...'
aws sts get-caller-identity --region $Region | Out-Null

Write-Host 'Deploying CloudFormation infrastructure...'
aws cloudformation deploy `
    --region $Region `
    --stack-name $StackName `
    --template-file $template `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides `
        RepositoryUrl=$RepositoryUrl `
        RepositoryBranch=$RepositoryBranch `
        BootstrapAdminEmail=$BootstrapAdminEmail `
        SesFromEmail=$SesFromEmail `
        WebPushVapidPublicKey=$WebPushVapidPublicKey `
        WebPushVapidPrivateKey=$WebPushVapidPrivateKey `
        WebPushVapidSubject=$WebPushVapidSubject `
    --no-fail-on-empty-changeset

$outputs = aws cloudformation describe-stacks `
    --region $Region `
    --stack-name $StackName `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

function Get-Output([string] $key) {
    return ($outputs | Where-Object { $_.OutputKey -eq $key }).OutputValue
}

$bucket = Get-Output 'FrontendBucketName'
$distribution = Get-Output 'CloudFrontDistributionId'
$applicationUrl = Get-Output 'ApplicationUrl'

Write-Host 'Building frontend for same-origin CloudFront API routing...'
$env:VITE_API_URL = '/api'
$env:VITE_SOCKET_URL = ''
Push-Location $frontend
try {
    npm ci
    npm run build
    aws s3 sync '.\dist' "s3://$bucket" --region $Region --delete
} finally {
    Pop-Location
}

Write-Host 'Invalidating CloudFront cache...'
aws cloudfront create-invalidation --distribution-id $distribution --paths '/*' | Out-Null

Write-Host "Deployment submitted successfully: $applicationUrl"
Write-Host "Retrieve the bootstrap Admin secret from the CloudFormation output BootstrapAdminSecretArn."
