# Ảnh minh chứng hồ sơ

Tạo hai thư mục khi bắt đầu chụp ảnh:

```text
images/
├── project/   # Ảnh giao diện sản phẩm đã chạy bằng CloudFront URL
└── workshop/  # Ảnh AWS Console/terminal theo từng bước triển khai
```

Quy tắc:

- Chụp toàn màn hình đủ thấy tên dịch vụ, region và trạng thái thành công.
- Che AWS Account ID, email cá nhân, ARN nhạy cảm, IP nếu cần, token, password, access key và secret.
- Không chụp nội dung Secrets Manager hoặc file `.env`.
- Đặt tên đúng danh sách trong `PROJECT.md` và `WORKSHOP-AWS.md`.
- Dùng PNG, chữ đọc rõ, không nén quá mạnh.

