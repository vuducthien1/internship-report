    # Danh sách icon AWS dùng cho sơ đồ VDCMS

Gói icon đã kiểm tra:

```text
C:\Users\ADMIN\Downloads\Icon-package_04302026.4705b90f5aa45b019271a2699e9ce9b97b941ee1
```

Nên dùng file **SVG 48 px** cho dịch vụ vì kéo lớn/nhỏ trong draw.io không bị vỡ. Icon bao vùng AWS Cloud/VPC/Subnet dùng bộ **Architecture Group Icons 32 px**.

## 1. Icon tương ứng với các số trên sơ đồ

Các đường dẫn dưới đây tính từ thư mục gốc của gói icon.

| Số | Thành phần | Tên file nên dùng | Ghi chú |
|---:|---|---|---|
| 1 | Users | `Resource-Icons_04302026\Res_General-Icons\Res_48_Light\Res_Users_48_Light.svg` | Dùng trên nền trắng; bản nền tối là `Res_Users_48_Dark.svg` |
| 2 | Amazon CloudFront | `Architecture-Service-Icons_04302026\Arch_Networking-Content-Delivery\48\Arch_Amazon-CloudFront_48.svg` | CDN và HTTPS entry |
| 3 | Amazon S3 Frontend | `Architecture-Service-Icons_04302026\Arch_Storage\48\Arch_Amazon-Simple-Storage-Service_48.svg` | Ghi nhãn bên dưới là `Frontend Bucket (Private + OAC)` |
| 4 | Amazon Cognito | `Architecture-Service-Icons_04302026\Arch_Security-Identity\48\Arch_Amazon-Cognito_48.svg` | User Pool/MFA/JWT chuyển tiếp |
| 5 | AWS WAF | `Architecture-Service-Icons_04302026\Arch_Security-Identity\48\Arch_AWS-WAF_48.svg` | Đặt trước ALB |
| 6 | Application Load Balancer | `Resource-Icons_04302026\Res_Networking-Content-Delivery\Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg` | Chính xác hơn icon Elastic Load Balancing tổng quát |
| 7 | Amazon EC2 | `Architecture-Service-Icons_04302026\Arch_Compute\48\Arch_Amazon-EC2_48.svg` | API + Socket.IO + worker |
| 7 | Auto Scaling | `Architecture-Group-Icons_04302026\Auto-Scaling-group_32.svg` | Dùng làm khung bao EC2, không cần đánh thêm số |
| 8 | Amazon RDS | `Architecture-Service-Icons_04302026\Arch_Databases\48\Arch_Amazon-RDS_48.svg` | Ghi nhãn `Amazon RDS for MySQL` |
| 9 | Amazon S3 Data | `Resource-Icons_04302026\Res_Storage\Res_Amazon-Simple-Storage-Service_Bucket-With-Objects_48.svg` | Thể hiện bucket chứa document/chat/audio |
| 10 | Amazon SQS | `Architecture-Service-Icons_04302026\Arch_Application-Integration\48\Arch_Amazon-Simple-Queue-Service_48.svg` | Queue Transcribe chính |
| 10 | Dead-Letter Queue | `Resource-Icons_04302026\Res_Application-Integration\Res_Amazon-Simple-Queue-Service_Queue_48.svg` | Dùng cùng icon queue, ghi nhãn `DLQ`; không cần số mới |
| 11 | Amazon Transcribe | `Architecture-Service-Icons_04302026\Arch_Artificial-Intelligence\48\Arch_Amazon-Transcribe_48.svg` | Audio → text |
| 12 | AWS IAM | `Architecture-Service-Icons_04302026\Arch_Security-Identity\48\Arch_AWS-Identity-and-Access-Management_48.svg` | Instance role/least privilege |
| 12 | AWS Secrets Manager | `Architecture-Service-Icons_04302026\Arch_Security-Identity\48\Arch_AWS-Secrets-Manager_48.svg` | RDS/JWT/Admin secret |
| 12 | AWS Systems Manager | `Architecture-Service-Icons_04302026\Arch_Management-Tools\48\Arch_AWS-Systems-Manager_48.svg` | Quản trị EC2 không mở SSH |
| 12 | Amazon CloudWatch | `Architecture-Service-Icons_04302026\Arch_Management-Tools\48\Arch_Amazon-CloudWatch_48.svg` | Log/metric/alarm |
| 13 | Amazon SES | `Architecture-Service-Icons_04302026\Arch_Business-Applications\48\Arch_Amazon-Simple-Email-Service_48.svg` | Verify email/reset password |

## 2. Icon dùng để vẽ khung mạng

| Khung/tài nguyên | Tên file |
|---|---|
| AWS Cloud | `Architecture-Group-Icons_04302026\AWS-Cloud_32.svg` |
| AWS Cloud có logo | `Architecture-Group-Icons_04302026\AWS-Cloud-logo_32.svg` |
| Region | `Architecture-Group-Icons_04302026\Region_32.svg` |
| Amazon VPC | `Architecture-Group-Icons_04302026\Virtual-private-cloud-VPC_32.svg` |
| Public Subnet | `Architecture-Group-Icons_04302026\Public-subnet_32.svg` |
| Private Subnet | `Architecture-Group-Icons_04302026\Private-subnet_32.svg` |
| Internet Gateway | `Resource-Icons_04302026\Res_Networking-Content-Delivery\Res_Amazon-VPC_Internet-Gateway_48.svg` |
| NAT Gateway | `Resource-Icons_04302026\Res_Networking-Content-Delivery\Res_Amazon-VPC_NAT-Gateway_48.svg` |
| EC2 Instance chi tiết | `Resource-Icons_04302026\Res_Compute\Res_Amazon-EC2_Instance_48.svg` |
| IAM Role chi tiết | `Resource-Icons_04302026\Res_Security-Identity\Res_AWS-Identity-Access-Management_Role_48.svg` |
| CloudWatch Alarm chi tiết | `Resource-Icons_04302026\Res_Management-Governance\Res_Amazon-CloudWatch_Alarm_48.svg` |

## 3. Những icon không dùng cho kiến trúc hiện tại

Không đưa các icon sau vào sơ đồ chính vì project không sử dụng chúng:

- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- AWS Amplify
- Amazon Bedrock
- Amazon ECR/ECS/EKS
- Amazon ElastiCache — chỉ là hướng nâng cấp sau này cho Socket.IO nhiều EC2

Điều này giúp sơ đồ khớp với mã nguồn và CloudFormation thay vì chỉ giống hình mẫu.

## 4. Cách tìm nhanh trong File Explorer

1. Mở thư mục gốc của gói icon.
2. Dán nguyên tên file, ví dụ `Arch_Amazon-CloudFront_48.svg`, vào ô Search.
3. Kéo file SVG từ File Explorer thẳng vào draw.io.
4. Giữ phím `Shift` khi thay đổi kích thước để giữ đúng tỷ lệ.
5. Đặt tên dịch vụ bên dưới icon; không sửa màu của icon AWS.

## 5. Kích thước trình bày đề xuất

- Icon service: **48 × 48 px** hoặc **64 × 64 px**.
- Số thứ tự: hình tròn **30–36 px**, nền `#111827`, chữ trắng.
- Khoảng cách icon và tên: **8–12 px**.
- Block cấp cao: padding tối thiểu **24 px**.
- Mũi tên chính: nét liền **2 px**; luồng chuyển tiếp/vận hành: nét đứt **2 px**.

