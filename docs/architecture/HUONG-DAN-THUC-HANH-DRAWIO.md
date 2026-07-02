# Hướng dẫn thực hành vẽ kiến trúc VDCMS bằng icon có sẵn trong draw.io

## 1. Hiểu đúng cách vẽ

Các ảnh mẫu dùng đúng kiểu sơ đồ AWS: dùng khung và icon có sẵn, đặt tên dưới icon, gom dịch vụ thành layer, rồi nối mũi tên có nhãn. Không tự vẽ hộp màu thay cho icon AWS.

> File `.drawio` cũ của project chỉ dùng để tham khảo vị trí và luồng. Không dùng bản hộp màu đó làm sơ đồ nộp cuối. Hãy tự vẽ lại theo tài liệu này bằng các icon AWS trong panel bên trái.

## 2. Các nhóm AWS đang có trong draw.io

Bạn đã bật đúng thư viện. Không cần tải thêm icon lúc này. Mở nhóm bằng tam giác bên trái, rê chuột lên icon và chờ draw.io hiện tên.

| Nhóm bên trái | Dùng để lấy icon |
|---|---|
| `AWS / General Resources` | User, Users |
| `AWS / Groups` | AWS Cloud, Region, VPC, Availability Zone, Public Subnet, Private Subnet, Auto Scaling group |
| `AWS / Network & Content Delivery` | Amazon CloudFront, Application Load Balancer, Internet Gateway, NAT Gateway |
| `AWS / Storage` | Amazon S3, S3 Bucket, Bucket With Objects |
| `AWS / Security, Identity & Compliance` | Amazon Cognito, AWS WAF, IAM, AWS Secrets Manager |
| `AWS / Compute` | Amazon EC2, Amazon EC2 Auto Scaling |
| `AWS / Database` | Amazon RDS |
| `AWS / Application Integration` | Amazon SQS, SQS Queue |
| `AWS / Artificial Intelligence` | Amazon Transcribe |
| `AWS / Management & Governance` | AWS Systems Manager, Amazon CloudWatch |
| `AWS / Business Applications` | Amazon Simple Email Service / Amazon SES |

Nếu một nhóm có nhiều hình giống nhau như `AWS / Storage`, hãy rê chuột lên từng icon. Chỉ kéo khi tooltip đúng tên trong bảng dưới.

## 3. Danh sách chính xác icon phải kéo

| Số | Mở nhóm | Tên icon cần tìm khi rê chuột | Tên ghi dưới icon |
|---:|---|---|---|
| 1 | `AWS / General Resources` | `User` hoặc `Users` | `Guest / Admin / Manager / Engineer` |
| 2 | `AWS / Network & Content Delivery` | `Amazon CloudFront` | `Amazon CloudFront` |
| 3 | `AWS / Storage` | `Amazon Simple Storage Service (S3)` | `S3 Frontend Bucket` |
| 4 | `AWS / Security, Identity & Compliance` | `Amazon Cognito` | `Amazon Cognito` |
| 5 | `AWS / Security, Identity & Compliance` | `AWS WAF` | `AWS WAF` |
| 6 | `AWS / Network & Content Delivery` | `Application Load Balancer` | `Application Load Balancer` |
| 7 | `AWS / Compute` | `Amazon EC2` | `EC2 - Express API + Socket.IO + Worker` |
| 8 | `AWS / Database` | `Amazon RDS` | `Amazon RDS for MySQL` |
| 9 | `AWS / Storage` | `Amazon S3 Bucket With Objects` hoặc `Amazon S3 Bucket` | `S3 Data Bucket` |
| 10 | `AWS / Application Integration` | `Amazon Simple Queue Service (SQS)` | `Amazon SQS + DLQ` |
| 11 | `AWS / Artificial Intelligence` | `Amazon Transcribe` | `Amazon Transcribe` |
| 12a | `AWS / Security, Identity & Compliance` | `AWS Identity and Access Management` | `AWS IAM` |
| 12b | `AWS / Security, Identity & Compliance` | `AWS Secrets Manager` | `AWS Secrets Manager` |
| 12c | `AWS / Management & Governance` | `AWS Systems Manager` | `AWS Systems Manager` |
| 12d | `AWS / Management & Governance` | `Amazon CloudWatch` | `Amazon CloudWatch` |
| 13 | `AWS / Business Applications` | `Amazon Simple Email Service (SES)` | `Amazon SES` |

Số 12 là một `Monitoring & Security Layer`, nên dùng bốn icon nhưng chỉ đặt một số 12 cho cả layer.

### Icon mạng phụ, không đánh thêm số

| Mở nhóm | Tên icon/khung cần tìm | Cách dùng |
|---|---|---|
| `AWS / Groups` | `AWS Cloud` | Khung lớn ngoài cùng; ảnh bạn gửi đang rê đúng icon này |
| `AWS / Groups` | `Region` | Đặt trong AWS Cloud, ghi `Region ap-southeast-1` |
| `AWS / Groups` | `Virtual private cloud (VPC)` | Khung VPC bên trong Region |
| `AWS / Groups` | `Availability Zone` | Hai khung AZ A và AZ B trong VPC |
| `AWS / Groups` | `Public Subnet` | Một public subnet trong mỗi AZ |
| `AWS / Groups` | `Private Subnet` | Application subnet và database subnet |
| `AWS / Groups` | `Auto Scaling group` | Bao icon EC2, ghi `Desired/Max: 1` |
| `AWS / Network & Content Delivery` | `Internet Gateway` | Đặt ở biên VPC trước ALB |
| `AWS / Network & Content Delivery` | `NAT Gateway` | Đặt trong Public Subnet A |

## 4. Thứ tự vẽ từng bước

### Bước 1 — Tạo trang

1. Chọn **File → Page Setup → Landscape**.
2. Đặt Zoom khoảng 50–75% để nhìn toàn trang.
3. Giữ nền trắng và bật Grid trong lúc căn chỉnh.

### Bước 2 — Vẽ người dùng bên trái

1. Mở `AWS / General Resources`.
2. Kéo icon `User` ra ngoài khung AWS Cloud.
3. Có thể dùng một icon `Users` với nhãn bốn role, hoặc nhân bản `User` bốn lần.
4. Khoanh bằng khung nét đứt, đặt số tròn đen `1` và tên `Actors`.

Không thêm `Developer` vì Developer không phải vai trò sử dụng production.

### Bước 3 — Vẽ khung AWS

1. Mở `AWS / Groups`.
2. Kéo `AWS Cloud` làm khung lớn nhất.
3. Kéo `Region` vào trong và ghi `Region ap-southeast-1`.
4. Nhấp phải từng khung → **To Back** để không che icon.

### Bước 4 — Vẽ Edge & Frontend Layer

1. Kéo số 2 `Amazon CloudFront`.
2. Kéo số 3 `Amazon S3` đặt dưới hoặc bên phải CloudFront.
3. Bao bằng rectangle nét đứt, ghi `Edge & Frontend Layer`.
4. Nối `Actors → CloudFront`, nhãn `HTTPS access`.
5. Nối `CloudFront → S3 Frontend Bucket`, nhãn `Static web assets (OAC)`.

### Bước 5 — Vẽ Identity & Security Layer

1. Kéo số 4 `Amazon Cognito`.
2. Kéo số 5 `AWS WAF`.
3. Bao bằng khung nét đứt, ghi `Identity & Security Layer`.
4. Nối `Actors → Cognito` bằng nét đứt, nhãn `JWT authentication - transition`.
5. Nối `WAF → Cognito` bằng nét đứt, nhãn `Protect user pool`.

Không ghi rằng toàn bộ login đã chuyển hẳn sang Cognito; backend đang hỗ trợ dual-auth.

### Bước 6 — Vẽ VPC và subnet

1. Kéo khung `Virtual private cloud (VPC)` vào giữa Region.
2. Trong VPC đặt hai `Availability Zone`: `AZ A` và `AZ B`.
3. Trong mỗi AZ tạo `Public Subnet`, `Private Application Subnet` và `Private Database Subnet`.
4. Đặt `Internet Gateway` ở biên VPC và `NAT Gateway` trong Public Subnet A.
5. Đặt số 6 `Application Load Balancer` giữa hai public subnet.
6. Đặt số 7 `Amazon EC2` trong Auto Scaling group trải qua hai private application subnet.
7. Đặt số 8 `Amazon RDS` giữa hai private database subnet.
8. Dưới RDS ghi `MySQL • TLS • Encrypted • Private`.

Nối theo thứ tự:

```text
CloudFront → AWS WAF → Application Load Balancer → Amazon EC2 → Amazon RDS
```

Nhãn đường nối:

- `CloudFront → WAF`: `/api/*, /socket.io/*`.
- `WAF → ALB`: `Allowed traffic`.
- `ALB → EC2`: `HTTP :5000 / health check`.
- `EC2 ↔ RDS`: `MySQL TLS`.

### Bước 7 — Vẽ Data, Queue & AI Layer

1. Xếp dọc số 9 `S3 Data Bucket`, số 10 `Amazon SQS + DLQ`, số 11 `Amazon Transcribe`.
2. Bao bằng khung nét đứt, ghi `Data, Queue & AI Layer`.
3. Nối `EC2 ↔ S3 Data`, nhãn `Documents / Chat media / Audio`.
4. Nối `EC2 → SQS`, nhãn `Enqueue transcription job`.
5. Nối `SQS → EC2` bằng nét đứt, nhãn `Worker long poll`.
6. Nối `EC2 → Transcribe`, nhãn `Start / Get job`.
7. Nối `Transcribe → EC2`, nhãn `Transcript result`.

SQS không gọi trực tiếp Transcribe; worker trên EC2 nhận message rồi mới gọi Transcribe.

### Bước 8 — Vẽ Monitoring & Security Layer

1. Xếp một hàng: `AWS IAM`, `AWS Secrets Manager`, `AWS Systems Manager`, `Amazon CloudWatch`.
2. Bao bằng khung nét đứt, đặt số 12 và tiêu đề `Monitoring & Security Layer`.
3. Nối nét đứt đến EC2 với nhãn lần lượt: `Instance role`, `Secrets`, `Admin without SSH`, `Logs / metrics`.

### Bước 9 — Vẽ Email Layer

1. Kéo số 13 `Amazon SES`.
2. Nối `EC2 → Amazon SES`, nhãn `Verify email / Reset password`.

### Bước 10 — Đánh số

1. Dùng **General → Ellipse**, kích thước 30–36 px.
2. Fill `#111827`, chữ trắng, in đậm.
3. Đặt ở góc trên-trái của icon/layer.
4. Dùng đúng số 1–13, không tạo số riêng cho NAT Gateway, Internet Gateway hoặc DLQ.

## 5. Bố cục cuối cùng

```text
Actors       AWS Cloud / Region ap-southeast-1
             ┌───────────────────────────────────────────────────────────────┐
             │ Edge & Frontend │ Identity & Security │ Monitoring/Security │
             │ CloudFront, S3  │ Cognito, WAF        │ IAM, Secret, SSM, CW│
             │                                                               │
             │ VPC                                                           │
             │ ┌ Public ─────┐ ┌ Private App ────┐ ┌ Private DB ─────────┐ │
             │ │ IGW/NAT/ALB │→│ EC2 API/Socket  │→│ RDS MySQL           │ │
             │ └─────────────┘ └──────────────────┘ └─────────────────────┘ │
             │                                                               │
             │ Data, Queue & AI: S3 Data → SQS/DLQ ⇄ EC2 → Transcribe       │
             │ Email: EC2 → SES                                               │
             └───────────────────────────────────────────────────────────────┘
```

## 6. Icon không đưa vào sơ đồ

- AWS Lambda.
- Amazon API Gateway.
- Amazon DynamoDB.
- AWS Amplify.
- Amazon Bedrock.
- CodePipeline/CodeBuild/ECR nếu chưa triển khai CI/CD thật.

VDCMS dùng **CloudFront + WAF + ALB + EC2 + RDS**, nên phải vẽ đúng các dịch vụ đó.

## 7. Khi nào mới tải icon

Chỉ tải khi đã mở đúng nhóm, kiểm tra tooltip, tìm bằng Search Shapes nhưng vẫn không có. Khi đó tải từ [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), chọn SVG 48 px. Không dùng PNG hoặc nguồn khác.

## 8. Checklist trước khi export

- [ ] Dùng icon AWS có sẵn hoặc SVG AWS chính thức.
- [ ] Có AWS Cloud, Region, VPC, AZ và subnet.
- [ ] Có đủ số 1–13 và tên đúng dưới icon.
- [ ] Mũi tên không cắt icon/chữ.
- [ ] SQS không nối trực tiếp sang Transcribe.
- [ ] EC2 và RDS không nối Internet trực tiếp.
- [ ] Không có Lambda/API Gateway/DynamoDB.
- [ ] Export PNG nền trắng, Crop, Border 10 px, Zoom 150–200%.
- [ ] Lưu thêm file `.drawio`.
