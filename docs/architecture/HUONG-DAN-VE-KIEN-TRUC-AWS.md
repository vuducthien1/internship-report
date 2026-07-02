# Hướng dẫn vẽ kiến trúc AWS cho VDCMS bằng draw.io

## 1. File hoàn chỉnh

- File có thể chỉnh sửa: [`vdcms-aws-architecture.drawio`](./vdcms-aws-architecture.drawio)
- Tên icon chính xác trong gói AWS đã tải: [`DANH-SACH-ICON-AWS.md`](./DANH-SACH-ICON-AWS.md)
- Mở [diagrams.net](https://app.diagrams.net/), chọn **File → Open From → Device** rồi chọn file trên.
- Sơ đồ được xây dựng theo mã nguồn và CloudFormation hiện tại, không đưa thêm dịch vụ chưa có trong project.

> **Lưu ý:** file draw.io hiện tại chỉ là bản tham khảo bố cục/luồng. Không dùng bản hộp màu đó làm sơ đồ nộp cuối. Để tự vẽ bằng đúng icon AWS có sẵn giống ảnh mẫu, hãy dùng [`HUONG-DAN-THUC-HANH-DRAWIO.md`](./HUONG-DAN-THUC-HANH-DRAWIO.md). Tài liệu này ghi rõ nhóm cần mở, tên icon khi rê chuột, vị trí và từng đường nối.

Nguồn tham khảo:

- [AWS Architecture Center](https://aws.amazon.com/architecture/) — mẫu kiến trúc và các nguyên tắc thiết kế AWS.
- [Video hướng dẫn draw.io do nhóm cung cấp](https://www.youtube.com/watch?v=l8isyDe-GwY&list=PLTTsZr0YjyiiQGD-Isu9lL-80Pdigv1qQ) — tham khảo thao tác vẽ.
- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) — tải bộ biểu tượng AWS chính thức nếu muốn thay các hộp màu bằng icon.

## 2. Phạm vi của sơ đồ

Sơ đồ mô tả môi trường production dự kiến của **Voice-Driven Construction Management System (VDCMS)**:

- Frontend React/Vite được host trong S3 private và phân phối qua CloudFront.
- Backend Express/Socket.IO chạy trên EC2 trong private subnet, nhận traffic qua ALB.
- Dữ liệu nghiệp vụ nằm trong RDS MySQL; tài liệu và media nằm trong S3.
- Luồng chuyển giọng nói chạy bất đồng bộ qua SQS, worker và Amazon Transcribe.
- Cognito đang ở chế độ **chuyển tiếp**: backend chấp nhận token Cognito nhưng frontend vẫn có thể dùng đăng nhập JWT hiện tại.
- WAF, IAM, Secrets Manager, Systems Manager và CloudWatch tạo lớp bảo mật/vận hành.

## 3. Giải thích từng số trên sơ đồ

### Số 1 — Người dùng

Gồm Guest, Admin, Manager và Engineer. Người dùng truy cập website bằng HTTPS. Sau khi đăng nhập, giao diện và API giới hạn chức năng theo vai trò; truy cập sai vai trò được chuyển đến trang 403.

### Số 2 — Amazon CloudFront

Là điểm truy cập HTTPS duy nhất của trình duyệt và CDN của hệ thống. CloudFront:

- Lấy file tĩnh từ S3 Frontend.
- Chuyển `/api/*`, `/socket.io/*` và `/uploads/*` đến ALB.
- Giúp frontend và backend dùng cùng origin, giảm lỗi CORS.
- Cache file tĩnh nhưng không cache API.

### Số 3 — Amazon S3 Frontend

Bucket private chứa kết quả `npm run build` của React/Vite. CloudFront đọc bucket bằng Origin Access Control (OAC); người dùng không truy cập trực tiếp bucket.

### Số 4 — Amazon Cognito

Quản lý User Pool, MFA TOTP và ba nhóm `admin`, `manager`, `engineer`. Backend xác minh chữ ký RS256, issuer và client ID của token. Quyền và trạng thái cuối cùng vẫn lấy từ user trong RDS để hỗ trợ khóa tài khoản, xóa mềm và thay đổi quyền ngay lập tức.

> Trạng thái hiện tại: dual-auth/chuyển tiếp. Đường nối Cognito được vẽ nét đứt để tránh hiểu nhầm rằng toàn bộ màn hình đăng nhập đã chuyển hẳn sang Cognito.

### Số 5 — AWS WAF

Lọc request trước ALB và bảo vệ Cognito bằng AWS Managed Rules cùng giới hạn tần suất theo IP. Rule giới hạn body được chuyển sang chế độ đếm để không chặn nhầm file multipart hợp lệ; kích thước và chữ ký file được backend kiểm tra tiếp.

### Số 6 — Application Load Balancer

Nhận API và kết nối Socket.IO từ CloudFront, kiểm tra backend qua `/health`, rồi chuyển request đến EC2 cổng 5000. Sticky session được bật cho kết nối realtime.

### Số 7 — Amazon EC2 Auto Scaling

Chạy hai service bằng systemd:

1. Express API + Socket.IO.
2. SQS Transcribe worker.

EC2 nằm trong private application subnet, không mở SSH công khai và ra Internet qua NAT Gateway khi cần gọi dịch vụ AWS hoặc tải dependency.

> Auto Scaling hiện giới hạn một instance vì Socket.IO chưa dùng Redis adapter dùng chung. Muốn tăng nhiều instance cần bổ sung ElastiCache/Redis adapter.

### Số 8 — Amazon RDS MySQL

Lưu user, project, task, report, chat metadata, notification, audit log và transcription job. Database nằm trong private database subnet, chỉ cho security group của EC2 truy cập cổng 3306, bắt buộc TLS, bật mã hóa, backup và deletion protection.

### Số 9 — Amazon S3 Data

Bucket private chứa:

- Tài liệu dự án và các phiên bản tài liệu.
- File/hình ảnh/ghi âm chat.
- Audio đầu vào tạm thời cho Transcribe.

Database chỉ lưu địa chỉ `s3://` nội bộ. Media chat được trả về bằng URL ký tạm thời; tài liệu được tải qua API kiểm tra quyền.

### Số 10 — Amazon SQS và DLQ

API ghi bản ghi `transcription_jobs`, đưa message vào SQS và trả HTTP 202 ngay. Worker long-poll queue để xử lý nền. Message lỗi ba lần được chuyển vào Dead-Letter Queue để điều tra, tránh mất tác vụ.

### Số 11 — Amazon Transcribe

Chuyển audio tiếng Việt (`vi-VN`) hoặc tiếng Anh (`en-US`) thành văn bản. Worker bắt đầu job, theo dõi trạng thái, lấy transcript, cập nhật RDS và xóa audio tạm trong S3 khi hoàn tất.

### Số 12 — Security, Secrets và Operations

Nhóm dịch vụ hỗ trợ toàn hệ thống:

- **IAM Role:** cấp quyền tối thiểu cho EC2 và Transcribe.
- **Secrets Manager:** giữ mật khẩu RDS, JWT secret và tài khoản Admin khởi tạo.
- **Systems Manager:** quản trị EC2 mà không mở SSH.
- **CloudWatch:** nhận log, metric và cảnh báo vận hành khi triển khai thật.

### Số 13 — Amazon SES

Gửi email xác minh tài khoản và đặt lại mật khẩu. Khi chạy local hoặc SES chưa cấu hình, hệ thống có thể dùng Resend/outbox fallback.

## 4. Các luồng chính phải trình bày khi bảo vệ

### 4.1 Tải giao diện

`1 Người dùng → 2 CloudFront → 3 S3 Frontend`

CloudFront lấy `index.html`, JavaScript, CSS từ bucket private và trả về trình duyệt.

### 4.2 Gọi API và chat realtime

`1 Người dùng → 2 CloudFront → 5 WAF → 6 ALB → 7 EC2`

WAF lọc request, ALB kiểm tra backend và chuyển API/Socket.IO đến ứng dụng.

### 4.3 Xác thực

`1 Người dùng ⇢ 4 Cognito ⇢ 7 EC2 → 8 RDS`

EC2 xác minh token, sau đó đọc role/status của user trong RDS. Mũi tên nét đứt thể hiện quá trình chuyển đổi dần từ JWT cũ.

### 4.4 Lưu file

`7 EC2 ↔ 9 S3 Data`

Backend kiểm tra quyền, MIME, kích thước và chữ ký file trước khi lưu hoặc cấp quyền tải.

### 4.5 Chuyển giọng nói thành văn bản

`7 API → 9 S3 → 10 SQS ⇢ 7 Worker → 11 Transcribe → 7 Worker → 8 RDS`

Đây là luồng bất đồng bộ; frontend poll trạng thái đến khi nhận transcript.

### 4.6 Email

`7 EC2 → 13 SES → hộp thư người dùng`

Được dùng cho xác minh email và quên mật khẩu.

## 5. Hướng dẫn tự vẽ lại trên draw.io

### Nguyên tắc chọn icon

Thực hiện đúng thứ tự sau cho **mọi icon**:

1. Tìm trong thư viện AWS có sẵn của draw.io.
2. Thử tên đầy đủ, tên viết tắt và từ đồng nghĩa trong ô tìm kiếm.
3. Di chuột lên kết quả để kiểm tra tooltip đúng dịch vụ AWS.
4. Chỉ khi không có kết quả phù hợp mới tải SVG từ [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/).
5. Không dùng icon lấy ngẫu nhiên từ Google, icon PNG mờ hoặc trộn nhiều đời icon trong cùng sơ đồ.

draw.io cung cấp nhiều phiên bản thư viện AWS và cả group shapes; cách chính thức là mở **More Shapes**, bật thư viện AWS trong nhóm **Networking**, sau đó kéo shape vào canvas. Xem [hướng dẫn AWS diagrams của draw.io](https://www.drawio.com/docs/diagram-types/aws-diagrams/).

### Bước 1 — Tạo khung

1. Truy cập [app.diagrams.net](https://app.diagrams.net/).
2. Chọn nơi lưu file → **Create New Diagram → Blank Diagram**.
3. Chọn **File → Page Setup → Landscape**.
4. Vẽ một rectangle lớn, tiêu đề `AWS Cloud - Region ap-southeast-1`.
5. Đặt bốn actor bên ngoài AWS Cloud ở mép trái: `Guest/User`, `Admin`, `Manager`, `Engineer`.
6. Mỗi actor dùng cùng icon một người `Res_User_48_Light.svg`; đặt dọc hoặc theo lưới 2 × 2 để không chiếm quá nhiều chiều cao.
7. Bao bốn actor bằng một vùng nét đứt nhỏ, ghi `1. Actors`; như vậy sơ đồ vẫn giữ hệ đánh số 1–13.

### Bước 2 — Bật thư viện AWS

1. Nhấn **More Shapes…** ở thanh bên trái.
2. Kéo xuống nhóm **Networking**.
3. Đánh dấu thư viện AWS mới nhất đang có trên máy, thường mang tên **AWS Architecture**, **AWS 2020**, **AWS 2023** hoặc tên AWS tương tự. Chỉ cần bật một bộ icon phẳng; không bật AWS 3D nếu muốn giống mẫu kiến trúc chính thức 2D.
4. Bật thêm thư viện **AWS / Groups** nếu nó được tách riêng; thư viện này chứa AWS Cloud, Region, VPC, Availability Zone và Subnet.
5. Nhấn **Apply**.
6. Ở ô **Search Shapes** phía trên panel trái, nhập tên dịch vụ. draw.io có thể tìm cả shape thuộc thư viện đang đóng; nếu kết quả ít, nhấn **More results**.
7. Chỉ khi tìm không thấy icon phù hợp mới tải bộ [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) và kéo file SVG vào canvas.
8. File tải về dự phòng được liệt kê tại [`DANH-SACH-ICON-AWS.md`](./DANH-SACH-ICON-AWS.md); ưu tiên SVG 48 px.

### Bước 2.1 — Tìm đúng icon có sẵn

Nhập lần lượt các từ khóa dưới đây vào **Search Shapes**. Chọn icon có tooltip đúng tên dịch vụ, không chỉ chọn hình có màu gần giống.

| Số | Thành phần | Từ khóa tìm trong draw.io | Nếu không tìm thấy |
|---:|---|---|---|
| 1 | Người dùng | `User`, `Users`, `Actor` | Dùng General/User SVG chính thức |
| 2 | Amazon CloudFront | `CloudFront` | `Arch_Amazon-CloudFront_48.svg` |
| 3 | S3 Frontend | `S3`, `Simple Storage Service` | `Arch_Amazon-Simple-Storage-Service_48.svg` |
| 4 | Amazon Cognito | `Cognito` | `Arch_Amazon-Cognito_48.svg` |
| 5 | AWS WAF | `WAF`, `Web Application Firewall` | `Arch_AWS-WAF_48.svg` |
| 6 | Application Load Balancer | `Application Load Balancer`, `ALB`, `Elastic Load Balancing` | Resource icon Application Load Balancer |
| 7 | EC2 Auto Scaling | `EC2`, `Auto Scaling` | EC2 service SVG + Auto Scaling group SVG |
| 8 | RDS MySQL | `RDS`, `Relational Database Service`, `MySQL` | `Arch_Amazon-RDS_48.svg` |
| 9 | S3 Data | `S3 Bucket`, `Bucket With Objects` | Resource icon S3 Bucket With Objects |
| 10 | SQS và DLQ | `SQS`, `Simple Queue Service`, `Queue` | SQS service/queue SVG |
| 11 | Amazon Transcribe | `Transcribe` | `Arch_Amazon-Transcribe_48.svg` |
| 12 | Vận hành/bảo mật | `IAM`, `Secrets Manager`, `Systems Manager`, `CloudWatch` | Bốn SVG chính thức tương ứng |
| 13 | Amazon SES | `SES`, `Simple Email Service` | `Arch_Amazon-Simple-Email-Service_48.svg` |

Icon khung và mạng không đánh thêm số:

| Thành phần | Từ khóa draw.io |
|---|---|
| AWS Cloud | `AWS Cloud` |
| Region | `Region` |
| Amazon VPC | `VPC`, `Virtual Private Cloud` |
| Availability Zone | `Availability Zone`, `AZ` |
| Public Subnet | `Public Subnet` |
| Private Subnet | `Private Subnet` |
| Internet Gateway | `Internet Gateway`, `IGW` |
| NAT Gateway | `NAT Gateway` |

> Nếu tìm `S3` trả về nhiều kết quả, dùng icon service cho số 3 và dùng icon resource **Bucket With Objects** cho số 9 để người xem phân biệt frontend bucket với data bucket.

### Bước 2.2 — Chỉnh nền và lưới draw.io

1. **Giữ nền trang màu trắng `#FFFFFF`**. Đây là nền phù hợp với bộ icon AWS bản Light và dễ đưa vào báo cáo.
2. Vùng màu xám ngoài trang chỉ là khu vực làm việc của draw.io, **không xuất hiện trong file PNG/PDF**.
3. Lưới chấm trên trang cũng không xuất hiện khi export. Tuy nhiên để kiểm tra bản cuối dễ hơn, vào **Xem → Lưới (View → Grid)** và bỏ chọn.
4. Nhấn vào vùng trống của trang, trong panel bên phải chọn phần **Trang/Page → Nền/Background → màu trắng**.
5. Không bật nền trong suốt cho bản nộp Word/PDF; nền trong suốt chỉ dùng khi slide của nhóm đã có nền riêng.
6. Thanh đỏ `Thay đổi chưa được lưu` trong draw.io nghĩa là file chưa lưu; nhấn vào đó hoặc dùng `Ctrl+S` trước khi đóng/export.

### Bước 3 — Vẽ các block cấp cao

Tạo sáu block có tiêu đề rõ ràng:

| Block | Vị trí gợi ý | Thành phần |
|---|---|---|
| Edge & Frontend | Trên, bên trái | CloudFront, S3 Frontend |
| Identity | Trên, chính giữa | Cognito |
| Security & Entry | Trên, bên phải | WAF, ALB |
| Amazon VPC | Giữa, bên trái | EC2 và RDS trong các private subnet |
| Data, Queue & AI | Giữa, bên phải | S3 Data, SQS/DLQ, Transcribe |
| Security/Operations và Email | Dưới cùng | IAM, Secrets Manager, SSM, CloudWatch, SES |

Thứ tự thao tác để các khung không che icon:

1. Kéo khung **AWS Cloud** vào trước và chọn **Arrange → To Back**.
2. Đặt khung **Region ap-southeast-1** bên trong AWS Cloud rồi **To Back**.
3. Đặt khung **Amazon VPC** trong Region rồi **To Back**.
4. Vẽ Availability Zone/Subnet trước khi thả icon ALB, EC2, RDS.
5. Các dịch vụ regional không nằm trong subnet như S3, SQS, Transcribe, Cognito và SES đặt trong Region nhưng ngoài VPC.
6. CloudFront là dịch vụ edge/global; đặt gần mép vào của AWS Cloud, trước luồng vào VPC.

### Bước 4 — Chia subnet trong VPC

1. Chia VPC thành hai cột: **Availability Zone A** và **Availability Zone B**.
2. Trong mỗi AZ tạo ba lớp: **Public Subnet**, **Private Application Subnet** và **Private Database Subnet**.
3. Đặt ALB trải qua hai public subnet. Nếu không muốn nhân đôi icon, đặt một icon ALB ở giữa và nối/bao bởi hai public subnet.
4. Đặt **Internet Gateway** ở biên VPC, trước ALB.
5. Đặt một **NAT Gateway** trong Public Subnet A; private application subnets đi ra ngoài thông qua NAT này.
6. Đặt EC2/Auto Scaling Group trải qua hai private application subnet; ghi chú `Desired/Max = 1` vì Socket.IO chưa có Redis adapter.
7. Đặt RDS/Subnet Group trải qua hai private database subnet; ghi `MySQL, TLS, encrypted, private`.
8. Không nối Internet trực tiếp vào EC2 hoặc RDS và không vẽ public IP cho hai dịch vụ này.

### Bước 5 — Đặt số

1. Dùng hình tròn kích thước khoảng 30–36 px.
2. Nền `#111827`, chữ trắng, in đậm.
3. Đặt số ở góc trên-trái của dịch vụ tương ứng.
4. Đánh số liên tục từ 1 đến 13, tuyệt đối không dùng lại số.

### Bước 6 — Nối mũi tên

| Từ | Đến | Nhãn |
|---|---|---|
| Users | CloudFront | HTTPS |
| CloudFront | S3 Frontend | Static assets |
| CloudFront | WAF | `/api`, `/socket.io` |
| WAF | ALB | Allowed traffic |
| ALB | EC2 | HTTP :5000 |
| Users | Cognito | Đăng nhập chuyển tiếp — nét đứt |
| Cognito | EC2 | JWT RS256 — nét đứt |
| EC2 | RDS | MySQL TLS — hai chiều |
| EC2 | S3 Data | Private files — hai chiều |
| EC2 API | SQS | Tạo job |
| SQS | EC2 Worker | Worker nhận job — nét đứt |
| EC2 Worker | Transcribe | Start/Get job |
| EC2 | SES | Send email |

Chọn connector dạng **Orthogonal/Elbow** để đường đi vuông góc, hạn chế giao nhau. Đường chính dùng nét liền; xác thực/chuyển tiếp/vận hành dùng nét đứt.

### Bước 7 — Căn chỉnh

1. Chọn các block cùng hàng → **Arrange → Align → Middle**.
2. Chọn các block cần giãn đều → **Arrange → Distribute → Horizontally**.
3. Mỗi block chỉ nên có tên dịch vụ và tối đa ba dòng mô tả.
4. Dùng một màu nhất quán cho cùng nhóm dịch vụ; không dùng màu chữ gần màu nền.

### Bước 8 — Kiểm tra và xuất file

1. Kiểm tra đủ 13 số và mọi mũi tên đều có hướng.
2. Kiểm tra các service đúng với CloudFormation, không thêm Lambda/API Gateway/DynamoDB vì project này không sử dụng chúng.
3. Lưu bản chỉnh sửa dưới dạng `.drawio`.
4. Chọn **File → Export as → PNG**, bật **Crop**, **Transparent Background** nếu cần đưa vào báo cáo.
5. Với báo cáo nền trắng: bỏ chọn **Transparent Background**, chọn viền/border khoảng 10 px và Zoom 150–200% để chữ rõ.
6. Xuất thêm PDF hoặc SVG để chèn vào slide mà không bị vỡ hình.
7. Kiểm tra lần cuối rằng **không có Lambda, API Gateway hoặc DynamoDB** trong sơ đồ chính; kiến trúc VDCMS đang dùng EC2 + ALB + RDS.

## 6. Những điểm cần nói rõ khi thuyết trình

- Đây là kiến trúc production bằng Infrastructure as Code; việc tạo tài nguyên thật chỉ thực hiện khi có AWS account và chấp nhận chi phí.
- NAT Gateway, ALB, RDS và WAF có thể phát sinh phí ngay cả khi ít người dùng.
- Cognito đã được provision và backend hỗ trợ token, nhưng chuyển đổi màn hình đăng nhập/user hiện hữu là giai đoạn tiếp theo.
- Sơ đồ giữ một EC2 vì Socket.IO chưa có Redis adapter. Đây là quyết định kỹ thuật có chủ đích, không phải thiếu Auto Scaling.
- Ảnh sự cố và file báo cáo cũ còn cơ chế local; tài liệu dự án cùng media chat mới đã hỗ trợ S3 private.
