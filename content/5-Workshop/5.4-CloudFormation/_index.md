---
title : "Infrastructure Deployment Process via Command Line"
date : 2024-01-01
weight : 4
chapter : false
pre : " <b> 5.4. </b> "
---

#### Purpose
Automate the provisioning of servers, networking, and permissions by executing command-line scripts to reduce manual errors and ensure consistency.

#### Detailed deployment steps

1. From the AWS Console navigation bar, open the **AWS CloudShell** utility.
2. Remove any old temporary folder and clone the latest source from the `dev` branch of the Github repository:

```
rm -rf /tmp/vdcms
git clone --branch dev https://github.com/BuiThanhPhuoc/Voice-Driven-Construction-Management-System.git /tmp/vdcms
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4.png)

3. Start the automated infrastructure deployment by invoking the `aws cloudformation deploy` command. Parameters include: Stack name (`vdcms-prod`), template file (`/tmp/vdcms/infra/cloudformation/vdcms-production.yml`), IAM capability (`CAPABILITY_IAM`), and pass the primary notification email address (`admin.vdcms@gmail.com`):

```
aws cloudformation deploy \
  --region ap-southeast-1 \
  --stack-name vdcms-prod \
  --template-file /tmp/vdcms/infra/cloudformation/vdcms-production.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    RepositoryBranch="dev" \
    RepositoryURL="https://github.com/BuiThanhPhuoc/Voice-Driven-Construction-Management-System.git" \
    BootstrapAdminEmail="admin.vdcms@gmail.com" \
    SesFromEmail="admin.vdcms@gmail.com" \
  --no-fail-on-empty-changeset
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-1.png)

4. The stack will initialize automatically. You can monitor progress directly via the Timeline view of **Events** in the CloudFormation Console to track the creation of VPC, Subnet, Database, and IAM permissions.

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-2.png)

5. After receiving the command notification `Successfully created/updated stack - vdcms-prod`, automatically retrieve the Stack Outputs and assign them to environment variables for the deployment process:

```
# Get outputs from stack
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

DIST=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

APP_URL=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' \
  --output text)

echo "App URL: $APP_URL"
echo "S3 Bucket: $BUCKET"
echo "CloudFront ID: $DIST"
```

6. Change into the Frontend source directory (`cd /tmp/vdcms/FE`), set environment variables for API and Socket URL configuration, run `npm ci`, package the resources, and upload them to the S3 static bucket. Finally, invalidate the old cache on the CloudFront Distribution:

```
# Build and upload Frontend
cd /tmp/vdcms/FE
npm ci
VITE_API_URL=/api VITE_SOCKET_URL="" npm run build
aws s3 sync ./dist "s3://$BUCKET" --region ap-southeast-1 --delete
aws cloudfront create-invalidation --distribution-id $DIST --paths '/*'

echo "=== FE DEPLOY COMPLETE ==="
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-3.png)

7. Test API responsiveness via CloudFront by sending a sample HTTP POST request:

```
# Test API via CloudFront
curl -s -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"vdcmsadmin","password":"wrongpass"}'
  
# Expected: {"success":false,"message":"Tên đăng nhập hoặc mật khẩu không chính xác!"}
```

8. **PHASE 7 — Retrieve Admin Credentials:** Query the ARN of the Secret managing the Admin account and invoke AWS Secrets Manager to retrieve the system root credentials:

```
ADMIN_SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`BootstrapAdminSecretArn`].OutputValue' \
  --output text)

aws secretsmanager get-secret-value \
  --secret-id "$ADMIN_SECRET_ARN" \
  --region ap-southeast-1 \
  --query SecretString --output text
  
# Output: {"username":"vdcmsadmin","email":"...","password":"..."}
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-4.png)

aws secretsmanager get-secret-value \
  --secret-id "$ADMIN_SECRET_ARN" \
  --region ap-southeast-1 \
  --query SecretString --output text

# Output: {"username":"vdcmsadmin","email":"...","password":"..."}
```

![secrets](/images/5-Workshop/5.4-CloudFormation/5-4-4.png)
