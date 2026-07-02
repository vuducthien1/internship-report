# Hướng dẫn kiểm thử VDCMS trên AWS

Tài liệu này hướng dẫn kiểm thử stack AWS của VDCMS sau khi triển khai thật. Không thực hiện test trên dữ liệu production.

## 1. Chọn đúng Region

Ảnh Console hiện tại đang ở **Sydney — `ap-southeast-2`**. Project, sơ đồ và script triển khai đang mặc định **Singapore — `ap-southeast-1`**.

Để test đúng tài liệu:

1. Nhấn tên Region ở góc trên bên phải AWS Console.
2. Chọn **Asia Pacific (Singapore) — ap-southeast-1**.
3. Từ bước này trở đi, luôn kiểm tra góc phải vẫn là Singapore.

Nếu muốn dùng Sydney, phải truyền `-Region ap-southeast-2` khi deploy và đổi nhãn Region trên sơ đồ. Không tạo một nửa tài nguyên ở Singapore và một nửa ở Sydney.

## 2. Cảnh báo chi phí trước khi test

Stack có NAT Gateway, Application Load Balancer, RDS, WAF, EC2 và CloudFront. Một số tài nguyên phát sinh phí theo thời gian ngay cả khi ít truy cập.

### Tạo cảnh báo ngân sách

1. Trong ô tìm kiếm AWS, nhập `Billing and Cost Management`.
2. Chọn **Budgets → Create budget**.
3. Chọn **Use a template → Monthly cost budget**.
4. Nhập mức ngân sách demo phù hợp với bạn, ví dụ 5–10 USD.
5. Nhập email nhận cảnh báo.
6. Tạo thêm ngưỡng cảnh báo 50%, 80% và 100% nếu giao diện cho phép.

AWS Budgets dùng để theo dõi chi phí; số liệu Cost Explorer có thể không xuất hiện ngay. Xem [hướng dẫn AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html).

### Quy tắc an toàn

- Không dùng tài khoản root để thao tác hằng ngày.
- Bật MFA cho tài khoản quản trị.
- Không chụp hoặc gửi Access Key, Secret Key, mật khẩu RDS/JWT/Admin.
- Không bấm deploy nhiều lần khi stack lỗi; đọc tab **Events** trước.
- Sau buổi demo phải thực hiện mục **Dọn tài nguyên** cuối tài liệu.

## 3. Chuẩn bị trước khi deploy

### 3.1 Điều kiện cần

- AWS CLI đã đăng nhập đúng account.
- Repository Git HTTPS mà EC2 có thể clone; nếu repo private thì UserData hiện tại sẽ không clone được nếu chưa cấp cơ chế truy cập.
- Email Admin khởi tạo hợp lệ.
- Nếu test SES thật: email gửi đã được verify trong chính Region Singapore.
- MySQL local và code hiện tại đã test đạt trước khi đưa lên AWS.

### 3.2 Kiểm tra danh tính AWS CLI

Mở PowerShell tại thư mục gốc project:

```powershell
aws sts get-caller-identity
aws configure get region
```

Kết quả phải là đúng account của bạn. Nếu Region không phải Singapore:

```powershell
aws configure set region ap-southeast-1
```

### 3.3 Kiểm tra cú pháp CloudFormation

```powershell
aws cloudformation validate-template `
  --template-body file://infra/cloudformation/vdcms-production.yml `
  --region ap-southeast-1
```

Lệnh thành công chỉ xác nhận template được AWS đọc; change set vẫn cần validation trước khi thực thi. AWS khuyến nghị tạo/review change set để phát hiện lỗi property, xung đột tên tài nguyên và một số vấn đề trước deploy. Xem [CloudFormation pre-deployment validation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/validate-stack-deployments.html).

## 4. Triển khai stack test

Chỉ chạy khi đã đọc cảnh báo chi phí:

```powershell
.\infra\deploy-aws.ps1 `
  -RepositoryUrl https://github.com/your-account/your-repository.git `
  -RepositoryBranch main `
  -BootstrapAdminEmail your-email@example.com `
  -Region ap-southeast-1
```

Nếu đã verify SES và muốn gửi email thật:

```powershell
.\infra\deploy-aws.ps1 `
  -RepositoryUrl https://github.com/your-account/your-repository.git `
  -BootstrapAdminEmail your-email@example.com `
  -SesFromEmail verified-sender@example.com `
  -Region ap-southeast-1
```

Trong CloudFormation Console:

1. Mở **CloudFormation → Stacks → `vdcms-prod`**.
2. Chờ trạng thái `CREATE_COMPLETE` hoặc `UPDATE_COMPLETE`.
3. Nếu lỗi, mở tab **Events**, đọc resource đầu tiên có `CREATE_FAILED`; không chỉ đọc dòng `ROLLBACK` cuối.
4. Mở tab **Outputs** và lưu các giá trị không bí mật:
   - `ApplicationUrl`.
   - `CloudFrontDistributionId`.
   - `FrontendBucketName`.
   - `DataBucketName`.
   - `BackendLoadBalancerDns`.
   - `DatabaseEndpoint`.
   - `TranscribeQueueUrl`.
   - `CognitoUserPoolId`.

Không chia sẻ `BootstrapAdminSecretArn` hoặc nội dung secret.

## 5. Test nhanh sau deploy

| Đã test | ID | Kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| [ ] | AWS-SMK-01 | CloudFormation stack | `CREATE_COMPLETE`/`UPDATE_COMPLETE` |
| [ ] | AWS-SMK-02 | Mở `ApplicationUrl` | Trang Guest tải bằng HTTPS |
| [ ] | AWS-SMK-03 | Mở `http://<BackendLoadBalancerDns>/health` từ CloudFormation Outputs | HTTP 200, `database=reachable` |
| [ ] | AWS-SMK-04 | Mở route sâu `/admin/dashboard` khi chưa login | SPA tải được rồi chuyển login/403, không hiện `AccessDenied` của S3 |
| [ ] | AWS-SMK-05 | Đăng nhập Admin bootstrap | Vào `/admin/dashboard` |
| [ ] | AWS-SMK-06 | Mở `/admin/aws` | Hiện trạng thái các dịch vụ, không lộ secret |

## 6. Test từng dịch vụ AWS trên Console

### 6.1 Amazon VPC

1. Tìm `VPC` → **Your VPCs**.
2. Chọn VPC có tag `vdcms-prod-vpc`.
3. Kiểm tra CIDR `10.40.0.0/16`.
4. Mở **Subnets**, kiểm tra có:
   - Hai public subnet.
   - Hai private application subnet.
   - Hai private database subnet.
   - Nằm trên hai Availability Zone.
5. Mở **Route tables**:
   - Public route `0.0.0.0/0` đi Internet Gateway.
   - Application route đi NAT Gateway.
   - Database subnet không có đường Internet trực tiếp.

Kết quả đạt: EC2 application và RDS không có public IP; ALB nằm public subnet.

### 6.2 Security Groups

Kiểm tra ba security group:

- ALB SG: inbound TCP 80 từ Internet theo template hiện tại.
- App SG: inbound TCP 5000 chỉ từ ALB SG.
- Database SG: inbound TCP 3306 chỉ từ App SG.

Không được có `0.0.0.0/0` vào cổng 5000 hoặc 3306.

### 6.3 Application Load Balancer

1. Tìm `EC2` → **Load Balancers**.
2. Chọn ALB của `vdcms-prod`.
3. Mở **Resource map/Target groups**.
4. Chọn target group → tab **Targets**.
5. EC2 phải có trạng thái `Healthy`.
6. Health check path phải là `/health`, port 5000 và expected code 200.

ALB chỉ chuyển traffic đến target healthy; health check được cấu hình theo target group. Xem [AWS target group health checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html).

Nếu target `Unhealthy`, kiểm tra theo thứ tự:

1. EC2 đã chạy chưa.
2. Service `vdcms-api` đã active chưa.
3. App SG có nhận từ ALB SG cổng 5000 không.
4. `/health` có kết nối được RDS không.

### 6.4 Amazon EC2 và Systems Manager

1. Mở `EC2 → Instances`.
2. Instance phải `Running`, không có public IPv4.
3. Chọn instance → **Connect → Session Manager → Connect**.
4. Không mở SSH port 22.

Trong Session Manager chạy:

```bash
sudo systemctl status vdcms-api --no-pager
sudo systemctl status vdcms-transcribe-worker --no-pager
curl -i http://127.0.0.1:5000/health
sudo journalctl -u vdcms-api -n 100 --no-pager
sudo journalctl -u vdcms-transcribe-worker -n 100 --no-pager
```

Kết quả mong đợi:

- Hai service `active (running)`.
- `/health` trả 200 và database reachable.
- Log không có vòng lặp restart hoặc lỗi credential.

Session Manager cho phép vào EC2 qua Console mà không cần SSH public. Xem [AWS Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-sessions-start.html).

### 6.5 Amazon RDS MySQL

1. Mở `RDS → Databases`.
2. Database phải `Available`.
3. Kiểm tra:
   - `Public access: No`.
   - Encryption bật.
   - Backup retention 7 ngày.
   - Deletion protection bật theo parameter production.
   - Security group chỉ nhận từ App SG.
4. Gọi lại backend `/health`; đây là test kết nối RDS an toàn nhất.

Nếu cần kiểm tra bằng Node trong Session Manager:

```bash
cd /opt/vdcms/BE
node -e "require('dotenv').config(); const db=require('./config/db'); db.query('SELECT 1 AS ok').then(([r])=>{console.log(r);return db.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```

Không mở RDS public chỉ để test từ máy cá nhân.

### 6.6 S3 Frontend Bucket

1. Mở `S3` → chọn `FrontendBucketName` trong Outputs.
2. Kiểm tra:
   - Block Public Access: bật toàn bộ.
   - Versioning: Enabled.
   - Default encryption: Enabled.
   - Có `index.html` và thư mục `assets/`.
3. Mở URL object S3 trực tiếp: phải bị từ chối vì bucket private.
4. Mở cùng nội dung qua CloudFront: phải tải được.

### 6.7 S3 Data Bucket

1. Chọn `DataBucketName`.
2. Kiểm tra private, encryption, versioning và lifecycle.
3. Trên web:
   - Upload tài liệu dự án.
   - Gửi ảnh/file/voice chat.
4. Quay lại S3 và kiểm tra object xuất hiện dưới prefix tương ứng.
5. Database không trả public S3 URL cố định; media chat dùng presigned URL có thời hạn.

### 6.8 Amazon CloudFront

1. Mở `CloudFront → Distributions`.
2. Chọn distribution từ Output.
3. Chờ Status `Deployed`; trạng thái này nghĩa cấu hình đã được truyền đến edge locations. Xem [cách test CloudFront distribution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-testing.html).
4. Kiểm tra behaviors:
   - Default → S3 Frontend.
   - `/api/*` → ALB, no cache.
   - `/socket.io/*` → ALB, no cache.
   - `/uploads/*` → ALB.
5. Test qua browser:
   - Trang chủ.
   - Refresh route sâu.
   - Login/API.
   - Chat realtime.

### 6.9 AWS WAF

1. Mở `WAF & Shield → Web ACLs`, chọn Region Singapore.
2. Mở Web ACL `vdcms-prod-regional-waf`.
3. Kiểm tra association với ALB và Cognito User Pool.
4. Mở tab **Traffic overview/Sampled requests** sau khi dùng web.
5. Request bình thường và upload multipart hợp lệ không được bị chặn.
6. Không tắt WAF để chữa lỗi upload; kiểm tra rule/action và log trước.

Test tùy chọn trên chính stack của bạn: gửi một request có query XSS đã URL-encode vào một API public và kiểm tra WAF sample/block. Không chạy công cụ tấn công hoặc load test vào tài nguyên không thuộc quyền bạn.

### 6.10 Amazon Cognito

1. Mở `Cognito → User pools`.
2. Kiểm tra pool `vdcms-prod-users`.
3. Kiểm tra:
   - Email auto verification.
   - MFA TOTP optional.
   - App client không có client secret cho SPA.
   - Ba group `admin`, `manager`, `engineer`.
4. Kiểm tra User Pool được WAF bảo vệ.

Giới hạn hiện tại: frontend vẫn dùng login JWT cũ. Test đạt ở giai đoạn này là tài nguyên Cognito, app client/group và backend dual-token đã sẵn sàng; không ghi rằng login đã chuyển hoàn toàn sang Cognito.

### 6.11 Amazon SES

Nếu `SesFromEmail` để trống, `/admin/aws` sẽ báo SES chưa cấu hình và hệ thống dùng fallback. Đây không phải lỗi.

Để test SES thật:

1. Mở `Amazon SES → Verified identities` tại Singapore.
2. Chọn **Create identity → Email address**.
3. Nhập email gửi và xác nhận link trong hộp thư.
4. Nếu account còn trong SES sandbox, email nhận cũng phải được verify, trừ mailbox simulator. Xem [SES verified identities](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html).
5. Deploy/update stack với `-SesFromEmail`.
6. Test đăng ký, gửi lại xác minh và quên mật khẩu.
7. Kiểm tra email đến và SES sending statistics.

### 6.12 Amazon SQS và DLQ

Test rõ nhất bằng cách tạm dừng worker:

1. Trong Session Manager:

   ```bash
   sudo systemctl stop vdcms-transcribe-worker
   ```

2. Đăng nhập Engineer, ghi âm và gửi Transcribe.
3. API phải trả trạng thái queued/HTTP 202.
4. Mở `SQS → Queues → vdcms...`.
5. Kiểm tra `Messages available` tăng hoặc dùng **Send and receive messages → Poll for messages**.
6. Không xóa message test bằng tay.
7. Khởi động worker:

   ```bash
   sudo systemctl start vdcms-transcribe-worker
   sudo journalctl -u vdcms-transcribe-worker -f
   ```

8. Message biến khỏi queue sau khi xử lý thành công.

SQS Console cho phép receive/delete message tại mục **Send and receive messages**; xem [hướng dẫn SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/step-receive-delete-message.html).

### 6.13 Amazon Transcribe

Sau bài test SQS:

1. Mở `Amazon Transcribe → Transcription jobs`.
2. Tìm job có tên bắt đầu `vdcms-`.
3. Trạng thái phải chuyển `IN_PROGRESS` → `COMPLETED`.
4. Quay lại web; frontend poll job và điền transcript vào nội dung.
5. Kiểm tra row `transcription_jobs` có status completed và transcript.
6. Audio tạm dưới `transcribe/input/` được worker xóa; lifecycle một ngày là lớp dọn dự phòng.

Test thêm:

- Audio `vi-VN` và `en-US`.
- File sai định dạng hoặc vượt 10 MB phải bị backend chặn trước AWS.
- Nếu job lỗi lặp lại đủ số lần, message phải sang DLQ.

### 6.14 Amazon CloudWatch

Kiểm tra những gì stack hiện có:

- ALB metrics.
- EC2 metrics cơ bản.
- RDS metrics và log `error`, `slowquery`.
- WAF metrics/sampled requests.

Lưu ý: application log của Express/worker hiện xem bằng `journalctl`; template chưa cài CloudWatch Agent để đẩy toàn bộ systemd log. Không đánh dấu test “CloudWatch application logs” là đạt nếu chưa bổ sung agent/log group.

### 6.15 IAM và Secrets Manager

1. Mở `IAM → Roles`, tìm EC2 instance role của stack.
2. Xác nhận policy chỉ cấp S3 Data, SQS, Transcribe, SES, Secrets, Cognito cần thiết.
3. Mở `Secrets Manager`:
   - Database secret.
   - JWT secret.
   - Bootstrap Admin secret.
4. Chỉ chọn **Retrieve secret value** khi cần lấy tài khoản Admin lần đầu.
5. Không chụp màn hình/ghi secret vào báo cáo hoặc Git.

## 7. Test nghiệp vụ end-to-end trên URL CloudFront

Chạy theo thứ tự để đồng thời test AWS và chức năng web:

| Đã test | ID | Luồng | Kết quả mong đợi |
|---|---|---|---|
| [ ] | E2E-01 | Guest mở trang chủ, đổi theme/ngôn ngữ | CloudFront/S3 hoạt động |
| [ ] | E2E-02 | Đăng ký Engineer và xác minh email | API/RDS/SES hoặc fallback hoạt động |
| [ ] | E2E-03 | Admin đăng nhập, tạo/activate Manager và Engineer | Auth + RDS hoạt động |
| [ ] | E2E-04 | Admin tạo dự án, giao Manager | Project flow hoạt động |
| [ ] | E2E-05 | Admin/Manager giao task cho Engineer | Task + notification realtime hoạt động |
| [ ] | E2E-06 | Engineer cập nhật checklist/timeline | Socket/API/RDS hoạt động |
| [ ] | E2E-07 | Engineer gửi report kèm file | Upload + RDS/S3/local đúng cấu hình |
| [ ] | E2E-08 | Engineer ghi âm Transcribe | S3 → SQS → Worker → Transcribe → RDS hoạt động |
| [ ] | E2E-09 | Manager/Admin duyệt report/request | RBAC + notification hoạt động |
| [ ] | E2E-10 | Hai user chat text/voice/file | CloudFront Socket.IO + S3 media hoạt động |
| [ ] | E2E-11 | Admin xem và khóa chat | Admin monitor + realtime lock hoạt động |
| [ ] | E2E-12 | Manager yêu cầu xóa Engineer, Admin duyệt | Soft delete + audit + notification hoạt động |
| [ ] | E2E-13 | Engineer thử mở `/admin/dashboard` | Hiện 403, không lộ dữ liệu |
| [ ] | E2E-14 | Admin mở `/admin/aws` và chạy health | Trạng thái AWS đúng, không lộ credential |

Bộ test chi tiết toàn hệ thống nằm trong [`TEST-CHECKLIST.md`](./TEST-CHECKLIST.md).

## 8. Thu thập bằng chứng để nộp

Chụp các ảnh sau nhưng che account ID/email/ARN nhạy cảm nếu cần:

1. CloudFormation `CREATE_COMPLETE` và Outputs không chứa secret value.
2. CloudFront URL mở trang chủ HTTPS.
3. ALB target `Healthy`.
4. EC2 không có public IP và Session Manager kết nối được.
5. RDS `Available`, Public access `No`.
6. S3 bucket private/versioning/encryption.
7. SQS queue và DLQ.
8. Transcribe job `COMPLETED`.
9. Cognito User Pool/groups.
10. WAF Web ACL association/metrics.
11. SES verified identity hoặc ghi rõ fallback nếu chưa test SES.
12. Màn hình `/admin/aws` của ứng dụng.

Không chụp Access Key, Secret Key, password hoặc secret value.

## 9. Dọn tài nguyên sau khi test

Đây là bước bắt buộc để ngừng phần lớn chi phí.

### 9.1 Tắt deletion protection của RDS trước

1. CloudFormation → stack → **Update**.
2. Dùng template hiện tại.
3. Đổi parameter `DatabaseDeletionProtection` thành `false`.
4. Chờ `UPDATE_COMPLETE`.

### 9.2 Xóa stack

1. Chọn stack `vdcms-prod` → **Delete**.
2. Theo dõi Events đến `DELETE_COMPLETE`.
3. Nếu lỗi, đọc resource `DELETE_FAILED`, không tạo stack khác để thay thế.

### 9.3 Xóa/kiểm tra tài nguyên được Retain

Template cố ý giữ lại một số dữ liệu. Sau khi backup bằng chứng cần thiết, kiểm tra thủ công:

- Hai S3 bucket và mọi object/version.
- RDS final snapshot.
- Database/JWT/Admin secrets.
- CloudWatch log groups còn giữ lại.

Chỉ xóa khi chắc chắn không cần phục hồi. Snapshot và bucket giữ lại vẫn có thể phát sinh phí lưu trữ.

### 9.4 Xác nhận không còn tài nguyên tính phí chính

Tại Region Singapore kiểm tra:

- EC2 Instances/Auto Scaling Groups.
- Load Balancers/Target Groups.
- NAT Gateways và Elastic IP.
- RDS Databases/Snapshots.
- WAF Web ACL.
- CloudFront Distribution.
- SQS Queues.

Cuối cùng kiểm tra Billing/Cost Explorer và budget alert trong những ngày sau đó.

## 10. Mẫu ghi kết quả

| Test ID | Ngày giờ | Region | Kết quả | Bằng chứng | Ghi chú |
|---|---|---|---|---|---|
| AWS-SMK-01 |  | ap-southeast-1 | Pass/Fail | Ảnh/URL |  |

Khi test lỗi, ghi thêm:

- CloudFormation logical resource ID.
- HTTP status/API message.
- ALB target reason.
- `journalctl` của đúng service.
- AWS request ID nếu Console/API cung cấp.
