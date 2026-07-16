---
title: "Bản đề xuất"
date: 2026-06-22
weight: 2
chapter: false
pre: " <b> 2. </b> "
---

{{% notice note %}}
📌 **Info:** Đề xuất dự án VDCMS — hệ thống quản lý nội dung tích hợp chuyển giọng nói thành văn bản trên AWS.
{{% /notice %}}

# VDCMS - Voice-Driven Content Management System
## Giải pháp AWS cho hệ thống quản lý nội dung tích hợp chuyển giọng nói thành văn bản

---

### 1. Tóm tắt điều hành

VDCMS là hệ thống quản lý nội dung hỗ trợ người dùng tạo, lưu trữ và quản lý báo cáo thông qua giao diện web hiện đại. Điểm nổi bật của hệ thống là tích hợp quy trình chuyển giọng nói thành văn bản bằng Amazon Transcribe, giúp người dùng có thể ghi âm nội dung và chuyển đổi thành văn bản phục vụ quá trình tạo báo cáo.

Hệ thống được thiết kế cho môi trường demo/MVP với giả định khoảng 50 người dùng, khoảng 100 báo cáo mỗi tháng và khoảng 30 phút ghi âm mỗi tháng. Kiến trúc sử dụng các dịch vụ AWS như Amazon CloudFront, Amazon S3, AWS WAF, Application Load Balancer, Amazon EC2, Amazon RDS MySQL, Amazon SQS, Amazon Transcribe, Amazon SES, Amazon Cognito, AWS Secrets Manager, AWS Systems Manager và Amazon CloudWatch.

Mục tiêu của dự án là xây dựng một kiến trúc web ba lớp có khả năng bảo mật, vận hành ổn định, xử lý tác vụ bất đồng bộ và phù hợp với phạm vi đồ án. Nhờ triển khai bằng Infrastructure as Code, nhóm có thể xóa toàn bộ tài nguyên sau khi kiểm thử để tiết kiệm chi phí và triển khai lại cùng một kiến trúc khi cần chấm điểm.

---

### 2. Tuyên bố vấn đề

#### Vấn đề hiện tại

Trong quá trình tạo và quản lý báo cáo, người dùng thường phải nhập nội dung thủ công, dễ mất thời gian khi báo cáo có nhiều ý hoặc cần ghi nhận nhanh từ nội dung trình bày, họp nhóm hoặc thuyết minh. Nếu không có hệ thống tập trung, dữ liệu báo cáo có thể bị phân tán, khó quản lý, khó theo dõi lịch sử chỉnh sửa và khó mở rộng thêm các chức năng như gửi email, xác thực người dùng hoặc xử lý file ghi âm.

Bên cạnh đó, các hệ thống web thông thường nếu triển khai thiếu kiến trúc rõ ràng có thể gặp nhiều hạn chế như bảo mật chưa tốt, khó kiểm soát truy cập, khó theo dõi lỗi hệ thống và khó tối ưu chi phí khi chạy trên cloud.

#### Giải pháp

VDCMS được đề xuất như một hệ thống quản lý nội dung triển khai trên AWS, kết hợp mô hình web ba lớp với quy trình xử lý sự kiện bất đồng bộ. Frontend SPA được lưu trữ trên Amazon S3 và phân phối qua Amazon CloudFront. Các request từ người dùng được bảo vệ bởi AWS WAF và điều phối qua Application Load Balancer đến Amazon EC2, nơi chạy backend và Transcribe worker.

Dữ liệu quan hệ của hệ thống được lưu trong Amazon RDS MySQL. Các file ghi âm và file tạm phục vụ Amazon Transcribe được lưu trên Amazon S3. Khi người dùng gửi file ghi âm, hệ thống đưa job vào Amazon SQS để xử lý bất đồng bộ, sau đó worker trên EC2 gọi Amazon Transcribe để chuyển giọng nói thành văn bản. Amazon SES được sử dụng để gửi email, Amazon Cognito phục vụ xác thực người dùng, AWS Secrets Manager quản lý thông tin nhạy cảm và Amazon CloudWatch hỗ trợ giám sát hệ thống.

#### Lợi ích và hoàn vốn đầu tư (ROI)

Giải pháp giúp giảm thao tác nhập liệu thủ công khi tạo báo cáo, hỗ trợ người dùng chuyển nội dung ghi âm thành văn bản nhanh hơn và tập trung dữ liệu trong một hệ thống quản lý thống nhất. Kiến trúc cũng giúp nhóm thực hành triển khai các thành phần quan trọng của một hệ thống cloud thực tế như bảo mật, cân bằng tải, lưu trữ, cơ sở dữ liệu, hàng đợi, xử lý bất đồng bộ, giám sát và quản lý bí mật.

Đối với phạm vi đồ án, lợi ích chính không chỉ nằm ở chi phí vận hành thấp trong môi trường demo/MVP, mà còn ở khả năng chứng minh được tư duy thiết kế kiến trúc AWS hoàn chỉnh. Nhóm có thể triển khai, kiểm thử, trình bày và xóa tài nguyên sau khi hoàn tất để tránh phát sinh chi phí không cần thiết.

---

### 3. Kiến trúc giải pháp

VDCMS áp dụng kiến trúc web ba lớp kết hợp xử lý bất đồng bộ. Lớp giao diện gồm Amazon S3 và Amazon CloudFront để phục vụ frontend SPA. Lớp ứng dụng gồm AWS WAF, Application Load Balancer và Amazon EC2 để bảo vệ, điều phối và xử lý request. Lớp dữ liệu gồm Amazon RDS MySQL, Amazon S3 và các dịch vụ hỗ trợ xử lý như Amazon SQS, Amazon Transcribe, Amazon SES, Amazon Cognito, AWS Secrets Manager, AWS Systems Manager và Amazon CloudWatch.

![VDCMS Architecture](/images/2-Proposal/vdcms_architecture.png)

#### Dịch vụ AWS sử dụng

- **Amazon CloudFront:** Phân phối frontend SPA, cache tài nguyên tĩnh và giảm tải cho backend.
- **Amazon S3:** Lưu trữ frontend, file ghi âm, file tạm của Transcribe và dữ liệu liên quan.
- **AWS WAF:** Bảo vệ ứng dụng web bằng WebACL và Managed Rule Groups.
- **Application Load Balancer:** Điều phối request từ người dùng đến EC2 backend.
- **Amazon EC2:** Chạy backend và Transcribe worker.
- **Amazon RDS MySQL:** Lưu trữ dữ liệu quan hệ của hệ thống.
- **Amazon SQS:** Làm hàng đợi cho các job xử lý Transcribe và DLQ.
- **Amazon Transcribe:** Chuyển file ghi âm thành văn bản.
- **Amazon SES:** Gửi email từ hệ thống.
- **Amazon Cognito:** Hỗ trợ xác thực người dùng.
- **AWS Secrets Manager:** Quản lý các thông tin nhạy cảm như credential và secret.
- **AWS Systems Manager:** Hỗ trợ quản trị và vận hành EC2 an toàn.
- **Amazon CloudWatch:** Thu thập metrics, sampled requests, log RDS và metrics cơ bản từ các dịch vụ AWS.
- **IAM:** Quản lý quyền truy cập giữa các dịch vụ theo nguyên tắc phân quyền tối thiểu.

#### Thiết kế thành phần

- **Frontend:** Ứng dụng SPA được build và lưu trữ trên Amazon S3, sau đó phân phối qua Amazon CloudFront. Người dùng truy cập hệ thống thông qua CloudFront để tăng tốc độ tải trang và giảm tải cho backend.
- **Bảo mật biên:** AWS WAF được gắn với luồng truy cập web để lọc các request bất thường, thu thập sampled requests và giảm nguy cơ tấn công phổ biến.
- **Điều phối request:** Application Load Balancer nhận request hợp lệ và chuyển tiếp đến EC2 backend.
- **Backend:** EC2 chạy ứng dụng backend, xử lý nghiệp vụ chính như quản lý người dùng, quản lý báo cáo, upload file, gọi dịch vụ AWS và trả kết quả cho frontend.
- **Cơ sở dữ liệu:** Amazon RDS MySQL lưu dữ liệu người dùng, báo cáo, metadata file ghi âm và trạng thái xử lý.
- **Xử lý ghi âm:** File ghi âm được lưu vào S3, sau đó job được đưa vào SQS. Worker trên EC2 lấy job từ SQS, gọi Amazon Transcribe và cập nhật kết quả về hệ thống.
- **Gửi email:** Amazon SES được dùng để gửi email thông báo hoặc email liên quan đến chức năng hệ thống.
- **Xác thực:** Amazon Cognito được định hướng làm hệ thống xác thực chính cho người dùng.
- **Quản lý bí mật:** AWS Secrets Manager lưu các secret cần thiết để tránh hard-code thông tin nhạy cảm trong mã nguồn.
- **Giám sát:** CloudWatch thu thập metrics từ WAF, RDS và các dịch vụ AWS. Log ứng dụng EC2 hiện được lưu trong systemd journal.

---

### 4. Triển khai kỹ thuật

#### Các giai đoạn triển khai

Dự án được triển khai theo các giai đoạn chính sau:

- **Phân tích yêu cầu và thiết kế kiến trúc:** Xác định phạm vi hệ thống VDCMS, số lượng người dùng demo, số lượng báo cáo, nhu cầu ghi âm và các dịch vụ AWS phù hợp.
- **Xây dựng hạ tầng bằng Infrastructure as Code:** Khai báo các tài nguyên như VPC, EC2, RDS, S3, SQS, WAF, ALB, CloudFront và Secrets Manager để có thể triển khai lại cùng một kiến trúc khi cần.
- **Triển khai frontend và backend:** Build frontend SPA, đưa lên S3, cấu hình CloudFront; triển khai backend và Transcribe worker trên EC2.
- **Tích hợp xử lý bất đồng bộ:** Cấu hình S3, SQS và Amazon Transcribe để xử lý file ghi âm, chuyển đổi thành văn bản và cập nhật kết quả về hệ thống.
- **Cấu hình bảo mật và vận hành:** Thiết lập IAM Role, Secrets Manager, Systems Manager, WAF, RDS log và CloudWatch metrics.
- **Kiểm thử và tối ưu chi phí:** Kiểm thử luồng người dùng, luồng tạo báo cáo, upload ghi âm, xử lý Transcribe, gửi email và xóa tài nguyên sau khi hoàn tất để tránh phát sinh phí.

#### Yêu cầu kỹ thuật

- **Frontend:** Ứng dụng SPA triển khai qua Amazon S3 và Amazon CloudFront.
- **Backend:** Ứng dụng chạy trên Amazon EC2 t3.small, đồng thời xử lý vai trò backend và Transcribe worker.
- **Cơ sở dữ liệu:** Amazon RDS MySQL db.t3.micro, 20 GB gp3, Single-AZ.
- **Mạng:** Kiến trúc sử dụng NAT Gateway, Application Load Balancer và các subnet phù hợp cho môi trường demo/MVP.
- **Xử lý bất đồng bộ:** Amazon SQS quản lý hàng đợi job Transcribe và DLQ để hỗ trợ xử lý lỗi.
- **Speech-to-text:** Amazon Transcribe xử lý khoảng 30 phút ghi âm mỗi tháng.
- **Email:** Amazon SES gửi khoảng 200 email mỗi tháng.
- **Xác thực:** Amazon Cognito hỗ trợ khoảng 50 MAU trong phạm vi Free Tier.
- **Bảo mật:** AWS WAF, IAM, AWS Secrets Manager và Systems Manager hỗ trợ kiểm soát truy cập và bảo vệ hệ thống.
- **Giám sát:** Amazon CloudWatch thu thập metrics, sampled requests và log từ RDS.

---

### 5. Lộ trình & Mốc triển khai

- **Giai đoạn 1 - Chuẩn bị:** Xác định yêu cầu hệ thống, chức năng chính, phạm vi người dùng, số lượng báo cáo và nhu cầu xử lý ghi âm.
- **Giai đoạn 2 - Thiết kế kiến trúc:** Thiết kế kiến trúc AWS gồm frontend, backend, database, storage, queue, speech-to-text, email, bảo mật và giám sát.
- **Giai đoạn 3 - Triển khai hạ tầng:** Sử dụng Infrastructure as Code để tạo các tài nguyên AWS cần thiết.
- **Giai đoạn 4 - Phát triển ứng dụng:** Hoàn thiện frontend, backend, kết nối RDS, upload file, tạo báo cáo và xử lý Transcribe.
- **Giai đoạn 5 - Kiểm thử:** Kiểm thử truy cập qua CloudFront, request qua WAF/ALB, kết nối backend, database, SQS, Transcribe và SES.
- **Giai đoạn 6 - Trình bày và tối ưu:** Trình bày hệ thống, thu thập kết quả, xóa tài nguyên sau kiểm thử để tiết kiệm chi phí.
- **Sau triển khai:** Nâng cấp hệ thống theo hướng production nếu cần, bao gồm Multi-AZ, nhiều EC2, Redis Adapter, CloudWatch Agent, SNS Alarm và SES Production Access.

---

### 6. Ước tính ngân sách

#### Chi phí hạ tầng

*(Giả định: 50 người dùng, ~100 báo cáo/tháng, ~30 phút ghi âm/tháng — môi trường demo/MVP, region ap-southeast-1)*

- **Amazon EC2** (t3.small — backend + Transcribe worker): 15,49 USD/tháng ($0,021/giờ × 730 giờ).
- **Amazon RDS MySQL** (db.t3.micro, 20 GB gp3, Single-AZ): 15,62 USD/tháng ($0,018/giờ × 730 giờ + 20 GB × $0,115/GB).
- **NAT Gateway:** 32,85 USD/tháng ($0,045/giờ × 730 giờ, chưa tính data transfer).
- **Application Load Balancer:** 16,43 USD/tháng ($0,008/giờ × 730 giờ + LCU tối thiểu).
- **AWS WAF** (1 WebACL + 2 Managed Rule Groups): 7,00 USD/tháng ($5/WebACL + $1/rule group × 2).
- **Amazon CloudFront** (phục vụ frontend SPA, ~5 GB/tháng): 0,43 USD/tháng ($0,085/GB × 5 GB).
- **Amazon S3** (2 buckets, ~2 GB data + versioning): 0,05 USD/tháng ($0,025/GB × 2 GB).
- **Amazon SQS** (Transcribe queue + DLQ, ~100 job/tháng): 0,00 USD/tháng (trong Free Tier 1 triệu request).
- **Amazon Transcribe** (~30 phút ghi âm/tháng): 0,72 USD/tháng ($0,024/phút × 30 phút).
- **Amazon SES** (~200 email/tháng): 0,02 USD/tháng ($0,10/1.000 email × 0,2).
- **Amazon Cognito** (~50 MAU): 0,00 USD/tháng (trong Free Tier 50.000 MAU).
- **AWS Secrets Manager** (3 secrets): 1,20 USD/tháng ($0,40/secret × 3).
- **Amazon CloudWatch** (RDS logs, metrics): 0,50 USD/tháng (metrics + log storage cơ bản).

Tổng: ~90,31 USD/tháng

---

### 7. Đánh giá rủi ro

#### Ma trận rủi ro

- NAT Gateway, ALB, WAF và RDS vẫn phát sinh phí khi ít người dùng: Ảnh hưởng trung bình, xác suất trung bình.
- EC2 gặp lỗi hoặc bị quá tải do chỉ chạy một instance: Ảnh hưởng cao, xác suất thấp trong môi trường demo.
- RDS Single-AZ gặp sự cố vùng khả dụng: Ảnh hưởng cao, xác suất thấp.
- File ghi âm xử lý thất bại hoặc job Transcribe lỗi: Ảnh hưởng trung bình, xác suất trung bình.
- SES vẫn ở Sandbox nên giới hạn khả năng gửi email: Ảnh hưởng trung bình, xác suất trung bình.
- Log ứng dụng EC2 chưa được đẩy lên CloudWatch Logs bằng CloudWatch Agent: Ảnh hưởng trung bình, xác suất trung bình.

#### Chiến lược giảm thiểu

- **Chi phí:** Chỉ triển khai hạ tầng trong thời gian kiểm thử và trình bày, sau đó xóa tài nguyên bằng Infrastructure as Code.
- **EC2:** Giới hạn Auto Scaling Group tối đa một instance trong demo, nhưng có thể mở rộng nhiều EC2 khi triển khai thực tế.
- **RDS:** Sử dụng Single-AZ để tiết kiệm chi phí trong demo; nâng cấp Multi-AZ khi cần tính sẵn sàng cao.
- **Transcribe:** Dùng Amazon SQS và DLQ để quản lý job, giảm mất mát tác vụ khi xử lý lỗi.
- **SES:** Sử dụng trong phạm vi sandbox khi demo; xin SES Production Access nếu triển khai thật.
- **Giám sát:** CloudWatch hiện thu thập metrics và RDS logs; bổ sung CloudWatch Agent và SNS Alarm trong giai đoạn nâng cấp.

#### Kế hoạch dự phòng

- Nếu hệ thống cloud gặp lỗi, nhóm có thể kiểm tra lại tài nguyên bằng Infrastructure as Code và triển khai lại cùng một kiến trúc.
- Nếu Transcribe gặp lỗi, job có thể được đưa vào DLQ để kiểm tra và xử lý lại.
- Nếu cần giảm chi phí, nhóm có thể xóa các tài nguyên tốn phí như NAT Gateway, ALB, WAF, EC2 và RDS sau khi hoàn thành kiểm thử.
- Nếu SES chưa được cấp Production Access, nhóm chỉ demo chức năng gửi email trong phạm vi sandbox.

---

### 8. Kết quả kỳ vọng

#### Cải tiến kỹ thuật

VDCMS cung cấp hệ thống quản lý báo cáo có giao diện web, cơ sở dữ liệu tập trung và khả năng chuyển giọng nói thành văn bản. Hệ thống giúp người dùng tạo báo cáo thuận tiện hơn, đồng thời hỗ trợ nhóm thực hành triển khai các dịch vụ AWS quan trọng trong một kiến trúc gần với thực tế.

#### Giá trị dài hạn

Kiến trúc hiện tại có thể được dùng làm nền tảng để phát triển thành hệ thống production hoàn chỉnh. Trong tương lai, nhóm có thể nâng cấp lên hai NAT Gateway cho hai Availability Zone, Auto Scaling nhiều EC2, Amazon ElastiCache Redis cho Socket.IO, RDS Multi-AZ, VPC Endpoint cho S3 và các dịch vụ AWS, CloudWatch Agent, SNS Alarm, Cognito làm hệ thống xác thực chính và SES Production Access.

#### Khả năng vận hành

Nhờ sử dụng Infrastructure as Code, hệ thống có thể được triển khai lại khi cần chấm điểm hoặc kiểm thử. Sau khi hoàn tất trình bày, nhóm có thể xóa toàn bộ tài nguyên để tránh phát sinh chi phí. Đây là hướng tiếp cận phù hợp với môi trường đồ án vì cân bằng được giữa tính bảo mật, khả năng mở rộng và chi phí vận hành.
