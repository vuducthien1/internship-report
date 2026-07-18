---
title : "Quá trình triển khai hạ tầng qua dòng lệnh"
date : 2024-01-01
weight : 4
chapter : false
pre : " <b> 5.4. </b> "
---

#### Mục đích
Tự động hóa quá trình dựng máy chủ, phân mạng, phân quyền cấu hình hệ thống bằng cách thực thi mã lệnh, giảm thiểu sai sót do thao tác thủ công.

#### Các bước triển khai chi tiết

1. Từ thanh điều hướng AWS, mở cửa sổ tiện ích **AWS CloudShell**.
2. Thực hiện xóa thư mục rác cũ (nếu có) và tải phiên bản mã nguồn mới nhất từ nhánh dev trên Github bằng các câu lệnh:

```
rm -rf /tmp/vdcms
git clone --branch dev https://github.com/BuiThanhPhuoc/Voice-Driven-Construction-Management-System.git /tmp/vdcms
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4.png)

3. Khởi chạy tiến trình triển khai hạ tầng tự động bằng cách gọi công cụ `aws cloudformation deploy`. Các tham số truyền vào bao gồm: tên Stack (`vdcms-prod`), tệp cấu hình template (`/tmp/vdcms/infra/cloudformation/vdcms-production.yml`), cấp quyền định danh (`CAPABILITY_IAM`) và truyền tham số đầu vào cho địa chỉ email thông báo chính (`admin.vdcms@gmail.com`):

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

4. Hệ thống sẽ tự động khởi tạo Stack. Người thực hiện có thể kiểm tra trực tiếp tiến độ hiển thị trực quan dưới dạng biểu đồ dạng thanh (Timeline view) trong mục **Events** của CloudFormation Console để theo dõi quá trình tạo lập các thành phần mạng VPC, Subnet, Cơ sở dữ liệu và các phân quyền IAM tương ứng.

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-2.png)

5. Sau khi nhận được thông báo dòng lệnh `Successfully created/updated stack - vdcms-prod`, tiến hành truy xuất tự động các thông tin đầu ra (**Outputs**) của Stack và gán vào các biến môi trường để phục vụ cho việc triển khai mã nguồn:

```
# Lấy thông tin outputs từ stack
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

6. Thực hiện chuyển hướng vào thư mục chứa mã nguồn Frontend (`cd /tmp/vdcms/FE`), thiết lập các biến môi trường cấu hình trỏ về địa chỉ API và cổng Socket, chạy lệnh `npm ci`, đóng gói tài nguyên và tải toàn bộ lên S3 Bucket tĩnh. Cuối cùng, xóa dữ liệu cache cũ trên CloudFront Distribution:

```
# Build và upload Frontend
cd /tmp/vdcms/FE
npm ci
VITE_API_URL=/api VITE_SOCKET_URL="" npm run build
aws s3 sync ./dist "s3://$BUCKET" --region ap-southeast-1 --delete
aws cloudfront create-invalidation --distribution-id $DIST --paths '/*'

echo "=== FE DEPLOY XONG ==="
```

![](https://hoaithoai.github.io/images/5-Workshop/5.4-CloudFormation/5-4-3.png)

7. Kiểm tra độ phản hồi của API thông qua CloudFront bằng cách gửi một request HTTP POST mẫu:

```
# Kiểm tra API qua CloudFront
curl -s -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"vdcmsadmin","password":"wrongpass"}'
  
# Mong đợi: {"success":false,"message":"Tên đăng nhập hoặc mật khẩu không chính xác!"}
```

8. **GIAI ĐOẠN 7 — Lấy credentials Admin:** Truy vấn ARN của Secret quản lý tài khoản Admin và gọi dịch vụ AWS Secrets Manager để lấy thông tin đăng nhập gốc của hệ thống:

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
