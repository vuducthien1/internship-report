# Workshop — Triển khai VDCMS lên AWS từng bước

## 1. Mục tiêu

Sau workshop, nhóm có thể:

- Triển khai hạ tầng VDCMS bằng CloudFormation.
- Build và phát hành frontend qua S3 + CloudFront.
- Chạy Express API, Socket.IO và Transcribe worker trên EC2 private sau ALB.
- Kết nối RDS MySQL, S3 Data, SQS, Transcribe, Cognito, SES và WAF.
- Kiểm tra website bằng URL AWS thật và thu thập ảnh minh chứng.

> **Trạng thái tài liệu:** quy trình đã sẵn sàng nhưng ảnh/URL thật chưa có vì stack chưa được provision. Thực hiện workshop bằng AWS account của nhóm rồi thay các placeholder bằng ảnh thật.

## 2. Cảnh báo chi phí và bảo mật

- NAT Gateway, ALB, RDS, WAF và EC2 có thể phát sinh phí khi đang tồn tại dù traffic thấp.
- Tạo AWS Budget/cảnh báo trước khi deploy và xóa tài nguyên demo khi không dùng.
- Không dùng root user cho thao tác hằng ngày. Ưu tiên IAM Identity Center hoặc quyền tạm thời.
- Không chụp/commit access key, secret key, token, password, nội dung Secrets Manager hoặc `.env`.
- RDS và các bucket có policy giữ dữ liệu/snapshot; xóa stack không đồng nghĩa mọi chi phí tự biến mất.

## 3. Kiến trúc sẽ triển khai

![Kiến trúc AWS VDCMS](../architecture/vdcms-aws-architecture.svg)

File chỉnh sửa: [`../architecture/vdcms-aws-architecture.drawio`](../architecture/vdcms-aws-architecture.drawio).

## 4. Chuẩn bị

### 4.1 Công cụ

- AWS account có quyền tạo VPC, EC2, IAM, RDS, S3, CloudFront, SQS, Cognito, WAF, Secrets Manager và SES.
- AWS CLI v2 đã đăng nhập đúng account.
- Git, Node.js/npm và PowerShell.
- Repository Git mà EC2 clone được bằng HTTPS. Bản workshop đơn giản nhất dùng repository public; nếu private cần cơ chế credential an toàn riêng.

Kiểm tra:

```powershell
aws --version
git --version
node --version
npm --version
aws sts get-caller-identity --region ap-southeast-1
```

Kết quả cuối phải là đúng AWS account của nhóm. Che Account ID trước khi đưa ảnh vào báo cáo.

**Ảnh cần chụp:** `workshop-01-cli-identity.png`.

### 4.2 Điền thông tin triển khai

| Biến | Giá trị của nhóm |
|---|---|
| Repository URL | `[BỔ SUNG]` |
| Branch | `main` hoặc `[BỔ SUNG]` |
| Region | `ap-southeast-1` hoặc `[BỔ SUNG]` |
| Stack name | `vdcms-prod` |
| Bootstrap Admin email | `[BỔ SUNG]` |
| SES sender email | `[BỔ SUNG/ĐỂ TRỐNG]` |

Không dùng dữ liệu cá nhân thật làm dữ liệu demo nếu không cần thiết.

## 5. Bước 1 — Tạo AWS Budget

1. Mở **Billing and Cost Management → Budgets**.
2. Chọn **Create budget → Cost budget**.
3. Đặt ngân sách phù hợp với bài demo và email cảnh báo ở 50%, 80%, 100%.
4. Xác nhận budget đang active.

**Ảnh cần chụp:** `workshop-02-budget.png` — chỉ chụp tên budget, ngưỡng và trạng thái; che email nếu cần.

## 6. Bước 2 — Chuẩn bị repository

1. Đẩy source code mới nhất lên Git.
2. Bảo đảm commit chứa `BE/`, `FE/`, `infra/` và không có `.env`.
3. Bảo đảm branch trong lệnh deploy tồn tại.
4. Mở repository từ trình duyệt ẩn danh nếu dùng public clone.

```powershell
git status
git log -1 --oneline
git ls-files | Select-String -Pattern '\.env$'
```

Lệnh cuối không được hiện file `.env` chứa secret.

**Ảnh cần chụp:** `workshop-03-repository.png` — trang repository và commit dùng để deploy.

## 7. Bước 3 — Kiểm thử source trước khi deploy

Backend:

```powershell
cd BE
npm ci
npm test
```

Frontend:

```powershell
cd ..\FE
npm ci
npm run lint
npm run build
cd ..
```

Chỉ tiếp tục khi test/lint/build đạt. Cảnh báo bundle lớn không phải lỗi build nhưng cần ghi vào phần hạn chế.

**Ảnh cần chụp:**

- `workshop-04-backend-tests.png`
- `workshop-05-frontend-build.png`

## 8. Bước 4 — Xác minh SES sender nếu sử dụng email thật

1. Mở **Amazon SES** đúng region.
2. Vào **Verified identities → Create identity**.
3. Chọn Email address hoặc Domain.
4. Mở email xác minh và hoàn tất.
5. Nếu account còn SES sandbox, địa chỉ nhận demo cũng phải được verify hoặc cần xin production access.

Nếu chưa muốn dùng SES, để `-SesFromEmail ''`; backend dùng fallback theo cấu hình.

**Ảnh cần chụp:** `workshop-06-ses-identity.png` — trạng thái Verified, không chụp email cá nhân nếu không cần.

## 9. Bước 5 — Kiểm tra parameter CloudFormation

Mở:

- `infra/cloudformation/vdcms-production.yml`
- `infra/cloudformation/parameters.example.json`

Xác nhận:

- `DatabaseMultiAZ=false` cho demo tiết kiệm hơn.
- `DatabaseDeletionProtection=true` nếu cần bảo vệ database.
- `BackendDesiredCapacity=1` vì Socket.IO chưa có Redis adapter.
- Repository URL và Admin email là dữ liệu thật của nhóm.

Không chèn password vào parameter file. Password được AWS Secrets Manager sinh tự động.

**Ảnh cần chụp:** `workshop-07-cloudformation-template.png` — phần Parameters/Resources, không có secret.

## 10. Bước 6 — Triển khai stack và frontend

Chạy từ thư mục gốc project:

```powershell
.\infra\deploy-aws.ps1 `
  -RepositoryUrl 'https://github.com/[ACCOUNT]/[REPOSITORY].git' `
  -RepositoryBranch 'main' `
  -BootstrapAdminEmail 'admin@example.com' `
  -StackName 'vdcms-prod' `
  -Region 'ap-southeast-1' `
  -SesFromEmail 'verified@example.com'
```

Nếu chưa dùng SES, bỏ `-SesFromEmail` hoặc truyền chuỗi rỗng.

Script sẽ:

1. Kiểm tra AWS identity.
2. Deploy CloudFormation với `CAPABILITY_IAM`.
3. Đọc stack outputs.
4. Build frontend với `/api` cùng origin.
5. Đồng bộ `FE/dist` lên S3 Frontend.
6. Tạo CloudFront invalidation.
7. In `ApplicationUrl`.

Quá trình có thể mất nhiều phút, đặc biệt ở RDS và CloudFront. Không đóng terminal khi stack đang chạy.

**Ảnh cần chụp:**

- `workshop-08-deploy-command.png` — lệnh và trạng thái, che email/repo private nếu cần.
- `workshop-09-stack-complete.png` — CloudFormation `CREATE_COMPLETE`.

## 11. Bước 7 — Kiểm tra CloudFormation Outputs

```powershell
aws cloudformation describe-stacks `
  --region ap-southeast-1 `
  --stack-name vdcms-prod `
  --query 'Stacks[0].Outputs' `
  --output table
```

Các output quan trọng:

- `ApplicationUrl`
- `CloudFrontDistributionId`
- `FrontendBucketName`
- `DataBucketName`
- `BackendLoadBalancerDns`
- `DatabaseEndpoint`
- `TranscribeQueueUrl`
- `CognitoUserPoolId`
- `CognitoClientId`
- `BootstrapAdminSecretArn`

Che account-specific ARN/endpoint nếu quy định lớp yêu cầu.

**Ảnh cần chụp:** `workshop-10-stack-outputs.png`.

## 12. Bước 8 — Kiểm tra VPC và network

Trong **VPC Console**, xác nhận:

1. Một VPC CIDR `10.40.0.0/16`.
2. Hai public subnet ở hai Availability Zone.
3. Hai private application subnet.
4. Hai private database subnet.
5. Internet Gateway gắn vào VPC.
6. NAT Gateway nằm trong public subnet A.
7. Route table public có `0.0.0.0/0 → IGW`.
8. Route table app có `0.0.0.0/0 → NAT Gateway`.
9. Database subnet không có default route ra Internet.

Security group:

- ALB nhận HTTP 80.
- EC2 chỉ nhận TCP 5000 từ ALB security group.
- RDS chỉ nhận TCP 3306 từ EC2 security group.

**Ảnh cần chụp:**

- `workshop-11-vpc-subnets.png`
- `workshop-12-route-tables.png`
- `workshop-13-security-groups.png`

## 13. Bước 9 — Kiểm tra ALB, Auto Scaling và EC2

### ALB

1. Mở **EC2 → Load Balancers**.
2. Chọn ALB của stack.
3. Kiểm tra listener HTTP:80 chuyển đến target group.
4. Mở target group; chờ target chuyển **Healthy** qua `/health`.

### Auto Scaling/EC2

1. Mở Auto Scaling Group; xác nhận Desired/Min/Max = 1 cho demo.
2. EC2 phải nằm trong private subnet và không có public IPv4.
3. Kết nối bằng **Systems Manager Session Manager**, không mở SSH.
4. Kiểm tra service:

```bash
sudo systemctl status vdcms-api.service
sudo systemctl status vdcms-transcribe-worker.service
sudo journalctl -u vdcms-api.service --no-pager -n 50
sudo journalctl -u vdcms-transcribe-worker.service --no-pager -n 50
```

Không chụp dòng log có token/secret. UserData đã tắt shell tracing để tránh log secret.

**Ảnh cần chụp:**

- `workshop-14-alb-healthy.png`
- `workshop-15-autoscaling-ec2.png`
- `workshop-16-systemd-services.png`

## 14. Bước 10 — Kiểm tra RDS MySQL

Trong **RDS Console**:

1. Trạng thái database là **Available**.
2. `Publicly accessible = No`.
3. Storage encryption bật.
4. Backup retention là 7 ngày.
5. Deletion protection theo parameter.
6. DB subnet group gồm hai private database subnet.
7. Parameter `require_secure_transport=ON`.

Không mở cổng 3306 ra `0.0.0.0/0` để test. Backend `/health` là bằng chứng EC2 kết nối được database.

**Ảnh cần chụp:** `workshop-17-rds-private.png`.

## 15. Bước 11 — Kiểm tra S3 và CloudFront

### S3 Frontend

- Block Public Access bật.
- Versioning bật.
- Có `index.html` và thư mục `assets/`.
- Bucket policy chỉ cho CloudFront distribution đọc bằng OAC.

### S3 Data

- Block Public Access và versioning bật.
- Có lifecycle cho `transcribe/input/`.
- Không có public object URL hoạt động.

### CloudFront

- Distribution status là **Deployed**.
- Default origin là S3 Frontend + OAC.
- `/api/*`, `/socket.io/*`, `/uploads/*` đi đến ALB.
- API cache TTL = 0.
- CloudFront Function rewrite route SPA về `/index.html`.

Mở `ApplicationUrl`, sau đó refresh trực tiếp `/login` và một route bảo vệ. Không được nhận XML `AccessDenied` từ S3.

**Ảnh cần chụp:**

- `workshop-18-s3-private.png`
- `workshop-19-cloudfront-origins.png`
- `workshop-20-cloudfront-website.png`

## 16. Bước 12 — Lấy tài khoản Admin khởi tạo

1. Từ CloudFormation output, mở `BootstrapAdminSecretArn` trong Secrets Manager.
2. Chỉ người được phép mới chọn **Retrieve secret value**.
3. Lưu username/password vào password manager tạm thời.
4. Không chụp, copy vào chat, commit hoặc đưa secret value vào Workshop.
5. Đăng nhập lần đầu và đổi mật khẩu theo quy trình của nhóm nếu cần.

**Ảnh cần chụp:** `workshop-21-secrets-metadata.png` — chỉ tên/ARN đã che và trạng thái secret, tuyệt đối không có value.

## 17. Bước 13 — Kiểm tra ứng dụng theo vai trò

1. Đăng nhập Admin; tạo/chuẩn bị Manager và Engineer demo.
2. Admin tạo Project và giao assignment cho Manager.
3. Manager giao Task có checklist cho Engineer.
4. Engineer cập nhật task và gửi report.
5. Manager/Admin duyệt report.
6. Engineer thử vào `/admin/dashboard`; phải thấy trang 403.
7. Manager thử mở project của Manager khác; phải bị chặn.
8. Kiểm tra dark/light, Việt/Anh và responsive.

Chạy các nhóm Critical/High trong [`../TEST-CHECKLIST.md`](../TEST-CHECKLIST.md).

**Ảnh cần chụp:**

- `workshop-22-admin-dashboard.png`
- `workshop-23-manager-project.png`
- `workshop-24-engineer-task.png`
- `workshop-25-forbidden-403.png`

## 18. Bước 14 — Kiểm tra S3 media và chat realtime

1. Mở chat giữa Manager và Engineer.
2. Gửi text, ảnh, tài liệu và ghi âm.
3. Mở S3 Data và xác nhận object nằm trong prefix `chat/`.
4. Kiểm tra bucket vẫn private.
5. Mở media từ chat; URL phải là presigned URL có thời hạn.
6. Admin mở monitor và thử khóa/mở khóa chat.
7. Mở hai trình duyệt/tài khoản để xác nhận realtime.

**Ảnh cần chụp:**

- `workshop-26-chat-realtime.png`
- `workshop-27-s3-chat-object.png`

## 19. Bước 15 — Kiểm tra SQS và Amazon Transcribe

1. Engineer mở form báo cáo và ghi audio hợp lệ.
2. API phải trả job queued/HTTP 202.
3. Trong SQS, quan sát số message được nhận/xử lý; không cần mở nội dung chứa dữ liệu nhạy cảm.
4. Worker gọi Transcribe và cập nhật `transcription_jobs`.
5. Frontend poll trạng thái và nhận transcript.
6. File tạm `transcribe/input/` được xóa sau thành công hoặc hết hạn bằng lifecycle.
7. Với môi trường test riêng, tạo lỗi có kiểm soát và xác nhận message đi DLQ sau ba lần; không phá production demo.

**Ảnh cần chụp:**

- `workshop-28-sqs-queue.png`
- `workshop-29-transcribe-job.png`
- `workshop-30-transcript-result.png`

## 20. Bước 16 — Kiểm tra Cognito

1. Mở User Pool do stack tạo.
2. Xác nhận app client không có client secret cho web SPA.
3. Xác nhận MFA TOTP là optional.
4. Xác nhận group `admin`, `manager`, `engineer` tồn tại.
5. Kiểm tra WAF association.
6. Nếu demo dual-auth, dùng Cognito ID token hợp lệ map với local user theo email/cognito_sub.

Không tuyên bố frontend đã chuyển hoàn toàn sang Cognito Hosted UI nếu chưa thực hiện migration user/UI.

**Ảnh cần chụp:** `workshop-31-cognito-pool.png`.

## 21. Bước 17 — Kiểm tra WAF

1. Mở Regional Web ACL.
2. Xác nhận association với ALB và Cognito User Pool.
3. Xác nhận AWS Common Rules, Known Bad Inputs và rate rule.
4. Kiểm tra metric/sampled request.
5. Upload multipart hợp lệ để chắc rule body size không chặn nhầm; backend vẫn phải giới hạn file.

Không tạo tấn công tải cao vào môi trường thật. Chỉ dùng request test nhỏ và có kiểm soát.

**Ảnh cần chụp:** `workshop-32-waf-rules.png`.

## 22. Bước 18 — Kiểm tra SES và email

1. Đăng ký Engineer demo hoặc dùng chức năng quên mật khẩu.
2. Xác nhận email đến inbox/spam.
3. Link verify/reset phải hoạt động một lần và hết hạn đúng.
4. Nếu SES sandbox chặn người nhận, ghi rõ giới hạn và dùng verified receiver.

**Ảnh cần chụp:** `workshop-33-email-result.png` — che địa chỉ/token trong link.

## 23. Bước 19 — Theo dõi và hoàn thiện hồ sơ

1. Mở trang `/admin/aws` và chạy health check.
2. Kiểm tra WAF/RDS/ALB metrics trong CloudWatch Console.
3. Application log hiện được đọc qua `journalctl`/SSM; nếu muốn tập trung app log vào CloudWatch cần cài CloudWatch Agent ở phiên bản tiếp theo.
4. Điền Production URL, commit SHA và ngày deploy vào `PROJECT.md`.
5. Đánh dấu test trong `TEST-CHECKLIST.md`.
6. Chèn ảnh workshop vào các placeholder.

**Ảnh cần chụp:**

- `workshop-34-admin-aws-health.png`
- `workshop-35-cloudwatch-metrics.png`

## 24. Danh sách ảnh Workshop

| Đã có | Tên file | Nội dung |
|---|---|---|
| [ ] | `workshop-01-cli-identity.png` | AWS CLI identity đã che Account ID |
| [ ] | `workshop-02-budget.png` | Budget/alert |
| [ ] | `workshop-03-repository.png` | Repo + commit deploy |
| [ ] | `workshop-04-backend-tests.png` | Backend tests đạt |
| [ ] | `workshop-05-frontend-build.png` | FE lint/build đạt |
| [ ] | `workshop-06-ses-identity.png` | SES identity Verified |
| [ ] | `workshop-07-cloudformation-template.png` | Template/parameters |
| [ ] | `workshop-08-deploy-command.png` | Quá trình deploy |
| [ ] | `workshop-09-stack-complete.png` | Stack complete |
| [ ] | `workshop-10-stack-outputs.png` | Outputs đã che |
| [ ] | `workshop-11-vpc-subnets.png` | VPC/subnets |
| [ ] | `workshop-12-route-tables.png` | Route tables/NAT/IGW |
| [ ] | `workshop-13-security-groups.png` | SG ALB/App/RDS |
| [ ] | `workshop-14-alb-healthy.png` | ALB target healthy |
| [ ] | `workshop-15-autoscaling-ec2.png` | ASG/EC2 private |
| [ ] | `workshop-16-systemd-services.png` | API/worker active |
| [ ] | `workshop-17-rds-private.png` | RDS private/TLS/backup |
| [ ] | `workshop-18-s3-private.png` | Bucket private |
| [ ] | `workshop-19-cloudfront-origins.png` | Origins/behaviors |
| [ ] | `workshop-20-cloudfront-website.png` | Website production |
| [ ] | `workshop-21-secrets-metadata.png` | Secret metadata, không có value |
| [ ] | `workshop-22-admin-dashboard.png` | Admin dashboard |
| [ ] | `workshop-23-manager-project.png` | Manager workspace |
| [ ] | `workshop-24-engineer-task.png` | Engineer task/report |
| [ ] | `workshop-25-forbidden-403.png` | Chặn sai role |
| [ ] | `workshop-26-chat-realtime.png` | Chat realtime |
| [ ] | `workshop-27-s3-chat-object.png` | Chat media trong S3 |
| [ ] | `workshop-28-sqs-queue.png` | Queue/DLQ |
| [ ] | `workshop-29-transcribe-job.png` | Transcribe job |
| [ ] | `workshop-30-transcript-result.png` | Transcript trên web |
| [ ] | `workshop-31-cognito-pool.png` | Cognito pool/group |
| [ ] | `workshop-32-waf-rules.png` | WAF rules/association |
| [ ] | `workshop-33-email-result.png` | Email SES |
| [ ] | `workshop-34-admin-aws-health.png` | AWS health page |
| [ ] | `workshop-35-cloudwatch-metrics.png` | Metric vận hành |

## 25. Lỗi thường gặp

### Stack lỗi vì EC2 không clone được source

- Kiểm tra Repository URL/branch.
- Nếu repository private, không nhúng Git token vào template/UserData; dùng cơ chế artifact hoặc credential an toàn.
- Xem `/var/log/cloud-init-output.log` qua SSM nhưng không chia sẻ log có dữ liệu nhạy cảm.

### ALB target Unhealthy

- Kiểm tra `vdcms-api.service`.
- Kiểm tra backend đã kết nối RDS và `/health` trả 200.
- Kiểm tra App SG cho phép cổng 5000 chỉ từ ALB SG.

### CloudFront trả AccessDenied khi refresh route

- Kiểm tra CloudFront Function SPA rewrite đã publish và gắn vào default behavior.
- Kiểm tra OAC và bucket policy.
- Tạo invalidation `/*` sau khi upload frontend.

### Backend không kết nối RDS

- RDS phải Available.
- DB SG chỉ nhận từ App SG.
- CA bundle tồn tại và `DB_SSL=true`.
- Kiểm tra secret/endpoint qua metadata, không in password ra log.

### Transcribe job đứng queued

- Kiểm tra worker service.
- Kiểm tra SQS Queue URL, IAM permission, Transcribe role và object S3.
- Kiểm tra visibility timeout/DLQ.

### SES không gửi email

- Kiểm tra identity verified và đúng region.
- Trong sandbox, verify cả người nhận.
- Kiểm tra `AWS_SES_FROM_EMAIL` trong cấu hình runtime.

## 26. Dọn tài nguyên sau demo

Chỉ thực hiện khi đã sao lưu và được nhóm đồng ý:

1. Tải/xác nhận dữ liệu cần giữ.
2. Tắt RDS deletion protection trước nếu muốn xóa stack.
3. Xóa object/version trong bucket nếu CloudFormation không thể xóa bucket; lưu ý bucket đang `DeletionPolicy: Retain`.
4. Xóa CloudFormation stack.
5. Kiểm tra tài nguyên Retain: S3 bucket, Secrets Manager secret, RDS snapshot.
6. Kiểm tra NAT Gateway, Elastic IP, ALB, WAF, EC2 và RDS không còn chạy ngoài ý muốn.
7. Mở Cost Explorer/Billing để xác nhận không còn chi phí tiếp tục phát sinh.

Không ghi lệnh xóa hàng loạt vào báo cáo và không chạy cleanup trên môi trường cần nghiệm thu.

## 27. Xác nhận hoàn thành Workshop

```text
Stack name: ____________________________
Region: ________________________________
Application URL: _______________________
Commit SHA: ____________________________
Ngày triển khai: _______________________
Người triển khai: ______________________
Số ảnh đã chụp: ______ / 35
Critical/High tests: Đạt / Chưa đạt
Chi phí dự kiến/đã dùng: ______________
```

