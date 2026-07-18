---
title: "Real-world Business Flow Testing Scenario"
date: 2024-01-01
weight: 6
chapter: false
pre: " <b> 5.6. </b> "
---

#### Mục đích
Kiểm thử tính đúng đắn của toàn bộ luồng chức năng phần mềm, quy trình phân phối dữ liệu và khả năng tích hợp các dịch vụ hạ tầng AWS thông qua giao diện ứng dụng công khai được cấu hình bởi CloudFront.

#### Các bước triển khai và Kịch bản kiểm thử chi tiết

**1. Kiểm tra giao diện tổng quan và Cấu hình tài khoản**

- Truy cập vào liên kết phân phối CloudFront. Hệ thống hiển thị trang giới thiệu với thông tin về giải pháp Quản lý công trường tích hợp xử lý giọng nói (VDCMS).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6.png)
- Kiểm tra chức năng chuyển đổi ngôn ngữ (VI/EN) và chuyển đổi giao diện hiển thị (Dark/Light mode) để đảm bảo các tài nguyên tĩnh hoạt động chính xác.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-1.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-2.png)
- Đăng nhập với tài khoản Admin đã lấy được trước đó
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-34.png)
- Truy cập mục **Quản lý tài khoản**: Thực hiện thử nghiệm cập nhật thông tin cá nhân, thay đổi mật khẩu và tải lên ảnh đại diện để xác thực luồng ghi nhận dữ liệu người dùng.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-3.png)
---
**2. Khởi tạo tài khoản Kỹ sư (Engineer) qua AWS Systems Manager Session Manager**

Do yêu cầu bảo mật nghiêm ngặt đối với tài khoản kỹ sư thực địa, luồng khởi tạo này được thực hiện trực tiếp thông qua việc truy cập máy chủ Backend thay vì đăng ký tự do trên UI.

- Mở **AWS CloudShell** hoặc môi trường dòng lệnh có quyền quản trị, thực hiện lệnh khởi chạy session kết nối trực tiếp vào máy chủ EC2 mà không cần mở cổng SSH công khai:

```
aws ssm start-session --target "$INSTANCE_ID" --region ap-southeast-1
```

- Sau khi truy cập thành công vào phiên làm việc của máy chủ, thực thi đoạn mã script Node.js sau để bóc tách biến môi trường, thiết lập kết nối SSL an toàn đến cơ sở dữ liệu RDS và chèn trực tiếp thông tin kỹ sư đã được xác thực mã hóa:

```
cd /opt/vdcms/BE && sudo node -e "
const mysql = require('/opt/vdcms/BE/node_modules/mysql2/promise');
const bcrypt = require('/opt/vdcms/BE/node_modules/bcryptjs');
const fs = require('fs');

async function add() {
  const env = fs.readFileSync('/opt/vdcms/BE/.env', 'utf8');
  const get = (k) => env.match(new RegExp(k + '=(.+)'))?.[1]?.trim();

  const conn = await mysql.createConnection({
    host: get('DB_HOST'),
    user: get('DB_USER'),
    password: get('DB_PASSWORD'),
    database: 'smartconstruction',
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('/opt/vdcms/global-bundle.pem', 'utf8')
    }
  });

  const hash = await bcrypt.hash('Engineer1!', 10);

  await conn.execute(
    `INSERT INTO users 
      (username, fullname, email, password, role, status, email_verified_at, department, job_title)
     VALUES 
      (?, ?, ?, ?, 'engineer', 'active', NOW(), 'Kỹ thuật', 'Kỹ sư công trình')`,
    ['engineer1', 'Kỹ Sư Một', 'engineer1@vdcms.local', hash]
  );

  console.log('Tạo tài khoản engineer1 thành công và email đã được verify');
  await conn.end();
}

add().catch(console.error);
"
```

![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-4.png)
- Nhập lệnh `exit` để thoát phiên làm việc an toàn. Tài khoản kiểm thử được xác lập: `engineer1` / `Engineer1!`.

---
**3. Luồng Đăng ký & Phê duyệt cấp Quản lý (Manager)**

- Trên giao diện Web công khai, chọn mục **Đăng ký tài khoản**. Tiến hành nhập các thông tin cho cấp quản lý bao gồm: Tên đăng nhập (`manager`), Mật khẩu (`Manager1!`), Email (`thoai352004@gmail.com`).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-5.png)
- Sau khi gửi yêu cầu, tài khoản này sẽ rơi vào trạng thái chờ duyệt. Đăng nhập vào hệ thống với tư cách Admin tối cao (`vdcmsadmin`). Truy cập mục **Quản lý người dùng**, hệ thống sẽ hiển thị yêu cầu đăng ký của `manager` với trạng thái **Chờ phê duyệt**. Admin tiến hành nhấn nút **Phê duyệt**.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-6.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-7.png)
- Sau khi được Admin duyệt, người dùng đăng nhập bằng tài khoản `manager`. Hệ thống sẽ yêu cầu xác thực email thông qua một đường dẫn/mã kích hoạt được gửi trực tiếp từ AWS SES về hộp thư `thoai352004@gmail.com`. Người dùng thực hiện kích hoạt để hoàn tất quy trình xác thực.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-8.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-9.png)
---
**4. Luồng Nghiệp vụ Admin (Quản lý dự án, Nhật ký & Kiểm tra dịch vụ)**

- Với quyền **Admin**, truy cập mục **Dự án** và nhấn **Tạo dự án**. Nhập các thông tin kiểm thử: Tên dự án (`bababa`), Địa điểm (`HCM`), Mô tả dự án (`hihi`), và lựa chọn gán quyền phụ trách cho tài khoản Quản lý (`manager`), thiết lập thời gian thực hiện dự án và nhấn **Lưu**.
- Admin tiến hành giao một số nhiệm vụ trọng tâm cho tài khoản Quản lý (`manager`) để điều phối cấp cao.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-10.png)
- Truy cập mục **Dịch vụ AWS**: Kiểm tra trạng thái hiển thị của bảng điều khiển giám sát cấu hình dịch vụ, đảm bảo hệ thống đã nhận diện chính xác các thiết lập kết nối đến AWS SDK và các tài nguyên Cloud liên quan.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-27.png)
- Truy cập mục **Nhật ký hoạt động**: Kiểm tra hệ thống lưu vết log tập trung, đảm bảo mọi hành động như khởi tạo dự án, bàn giao nhiệm vụ hay phê duyệt tài khoản đều được hệ thống ghi nhận minh bạch, phục vụ cho công tác giám sát vận hành.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-35.png)
---
**5. Luồng Nghiệp vụ Quản lý & Điều phối Tác vụ (Manager)**

- Đăng nhập bằng tài khoản Quản lý dự án (`manager`). Truy cập mục dự án để kiểm tra danh sách các dự án đang được gán quyền phụ trách (Xác nhận dự án `bababa` hiển thị chính xác).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-11.png)
- Xem thông tin các nhiệm vụ do Admin giao và tiến hành cập nhật trạng thái tiến độ công việc tương ứng.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-14.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-15.png)
- Thực hiện chức năng điều phối: Chọn dự án `bababa`, chọn chức năng **Giao việc** để thiết lập một nhiệm vụ mới cho kỹ sư (`engineer1`). Nhập thông tin công việc: Tên công việc (`farm`), nội dung mô tả chi tiết và thiết lập hạn chót (Deadline).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-12.png)
- Check báo cáo của kĩ sư và duyệt
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-22.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-23.png)
---
**6. Luồng Kỹ sư Thực địa & Kiểm thử Tích hợp Xử lý Giọng nói (AWS Transcribe + SQS)**

- Đăng nhập bằng tài khoản kỹ sư (`engineer1`). Truy cập mục **Lịch công việc** để kiểm tra trực quan các thời hạn chót của nhiệm vụ được giao trên bảng lịch.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-28.png)
- Truy cập vào tác vụ `farm`, thực hiện tích chọn hoàn thành các đầu mục công việc trong **Checklist** nghiệm thu và cập nhật tiến độ tổng thể lên 100%.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-16.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-36.png)
- **Kiểm thử tích hợp luồng Voice Transcribe:**

1. Tại khung tạo báo cáo công việc, nhấn vào biểu tượng **Microphone**. Trình duyệt sẽ yêu cầu và nhận cấp quyền truy cập thiết bị phần cứng.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-17.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-19.png)
1. Kỹ sư bắt đầu đọc nội dung báo cáo thực địa (Ví dụ: *“Hello, hello, hello”*).
2. Quay lại giao diện ứng dụng, đoạn mã văn bản đã dịch tự động bởi dịch vụ **Amazon Transcribe** xuất hiện đầy đủ và chính xác trong nội dung báo cáo mà không cần nhập liệu thủ công.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-20.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-21.png)
- Kỹ sư nhập thêm số liệu khối lượng hoàn thành (`20m`), tải lên tệp ảnh minh chứng hiện trường xây dựng thực tế và thực hiện **Gửi báo cáo**. Ngoài ra, kỹ sư có thể sử dụng tính năng **Xuất dữ liệu CSV** trực tiếp để kết xuất bảng tính báo cáo tiến độ.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-18.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-23.png)
---
**7. Kiểm thử Lưu trữ dữ liệu an toàn & Tài liệu dự án trên Amazon S3**

- Tại mục **Tài liệu dự án**, thực hiện tải lên một tệp tài liệu kỹ thuật định dạng PDF vào kho dữ liệu chung của dự án `bababa` (Dữ liệu sẽ được đẩy trực tiếp vào AWS S3 Data Bucket).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-32.png)
- **Kiểm tra trạng thái lưu trữ trên AWS S3:**

Truy cập **AWS S3 Console**, vào Data Bucket của hệ thống và điều hướng theo đường dẫn thư mục `projects/`.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-33.png)
---
**8. Quản lý Sự cố và Kênh giao tiếp Trực tiếp**

- **Luồng báo cáo sự cố an toàn:** Kỹ sư ở công trường gặp sự cố sẽ truy cập mục **Báo cáo sự cố**, tiến hành nhập tọa độ vị trí thực tế, nội dung vấn đề, lựa chọn mức độ nghiêm trọng và đính kèm hình ảnh minh chứng hiện trường gửi lên hệ thống.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-24.png)
- Đăng nhập lại bằng tài khoản **Admin**, truy cập mục sự cố an toàn để tiếp nhận thông tin. Tiến hành xử lý thông qua biểu mẫu **Kế hoạch xử lý sự cố**: Cập nhật trạng thái giải quyết, chỉ định người chịu trách nhiệm, hạn xử lý, xác định nguyên nhân gốc rễ, đề xuất biện pháp khắc phục/phòng ngừa và tải lên hình ảnh sau khi đã khắc phục xong sự cố để lưu vết.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-25.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-26.png)
- **Kiểm thử tính năng Chat trực tiếp:** Truy cập vào phân hệ Chat giữa Kỹ sư (`engineer1`) và Quản lý (`manager`). Thực hiện gửi các đoạn tin nhắn văn bản, tệp tin đính kèm và file ghi âm qua lại để kiểm tra độ trễ thấp của Socket.IO. Đăng nhập tài khoản Admin để xác nhận Admin có quyền theo dõi tập trung luồng chat hệ thống và thực hiện kích hoạt lệnh khóa/mở khóa kênh chat khi cần thiết (Dữ liệu chat được quản lý và lưu trữ thông qua S3 Data Bucket).
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-29.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-30.png)![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-31.png)
---
**9. Xác thực Lớp Giám sát Tập trung qua Amazon CloudWatch Logs**

- Truy cập vào hệ thống quản trị **AWS CloudWatch Console**, điều hướng đến mục **Log groups**.
- Kiểm tra và truy cập vào nhóm log lưu trữ của cơ sở dữ liệu có tiền tố `/aws/rds/...`.
- Xác nhận các bản ghi log hệ thống, lỗi kết nối và dữ liệu truy vấn chậm (slow query logs) từ Amazon RDS đang được đẩy về liên tục và trực quan, chứng minh hệ thống giám sát và tracking an ninh đang hoạt động ổn định và chính xác theo đúng thiết kế kiến trúc.
![](https://hoaithoai.github.io/images/5-Workshop/5.6-System-Operation-Testing/5-6-37.png)
