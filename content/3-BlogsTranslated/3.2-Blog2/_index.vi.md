---
title: "Blog 2"
date: 2026-07-08
weight: 2
chapter: false
pre: " <b> 3.2. </b> "
---

📌 **Infor:** Blog 2 - Logical Replication trong Amazon RDS for PostgreSQL 18

# Logical Replication trong Amazon RDS for PostgreSQL 18 - Những cải tiến đáng chú ý

**Logical replication** là một tính năng khá quen thuộc trong **PostgreSQL**, cho phép sao chép dữ liệu từ database nguồn sang database đích ở mức logic. Thay vì copy toàn bộ dữ liệu như **physical replication**, bạn có thể chọn bảng, publication và subscription để đồng bộ linh hoạt hơn.

Trong thực tế, logical replication thường được dùng để đồng bộ dữ liệu giữa hệ thống chính và hệ thống đọc phụ, migrate database, hoặc đẩy dữ liệu sang hệ thống phân tích. Tuy nhiên, ở các phiên bản PostgreSQL trước, khi chạy production thì vẫn có vài điểm hơi khó chịu như: **generated column không replicate được**, **conflict khó debug**, hoặc **replication slot bị bỏ quên giữ WAL quá lâu**.

**PostgreSQL 18** đã cải thiện khá nhiều vấn đề này. Trên **Amazon RDS for PostgreSQL 18**, việc vận hành logical replication trở nên dễ theo dõi và ổn định hơn.

---

## Logical replication hoạt động như thế nào?

Trong mô hình này, database nguồn gọi là **publisher**, còn database nhận dữ liệu là **subscriber**.

Publisher tạo **publication** để xác định dữ liệu nào sẽ được gửi đi. Subscriber tạo **subscription** để kết nối và nhận dữ liệu thay đổi thông qua **WAL stream**.

> *Hình 1. Logical replication giữa Publisher và Subscriber trên Amazon RDS for PostgreSQL 18.*

Mô hình này rất phù hợp khi cần đồng bộ dữ liệu giữa các PostgreSQL instance khác nhau, đặc biệt trong môi trường **RDS** hoặc **Aurora**.

---

## Những hạn chế trước đây

Trước PostgreSQL 18, logical replication có một số điểm hạn chế:

- **Generated columns không được replicate** → dễ gây thiếu dữ liệu ở subscriber.
- **Conflict khó theo dõi** → phải đọc log và tự suy luận nguyên nhân.
- **Replication slot bị bỏ quên** → giữ WAL lâu, làm tăng dung lượng storage.
- **Two-phase commit khó thay đổi** → đôi khi phải drop subscription và sync lại từ đầu.

PostgreSQL 18 giải quyết gần như toàn bộ các vấn đề này.

---

## Replicate được STORED generated columns

Một cải tiến đáng chú ý là giờ có thể replicate **STORED generated columns**.

Ví dụ bạn có cột `final_price` được tính từ `base_price`, `discount_rate`, `tax_rate`. Trước đây cột này không được gửi sang subscriber, nhưng giờ có thể bật:

```sql
WITH (publish_generated_columns = stored)
```

Khi bật, các generated column sẽ được replicate như cột bình thường.

Lưu ý nhỏ: phía subscriber nên định nghĩa cột này là **cột thường**, không phải generated column, nếu không sẽ lỗi khi apply dữ liệu.

---

## Theo dõi conflict rõ ràng hơn

PostgreSQL 18 bổ sung thêm **conflict counters** trong view `pg_stat_subscription_stats`.

Bạn có thể biết rõ các loại lỗi như:

- `INSERT` bị trùng key.
- `UPDATE`/`DELETE` vào row không tồn tại.
- Conflict do replication origin.
- Vi phạm nhiều unique constraint.

Ví dụ nếu `confl_insert_exists` tăng, nghĩa là subscriber đã có dữ liệu trùng với dữ liệu publisher gửi sang.

Điểm này giúp debug nhanh hơn rất nhiều so với việc chỉ đọc log như trước.

---

## Parallel streaming mặc định

Trước đây, transaction lớn phải buffer xong mới gửi đi → dễ gây lag.

Giờ PostgreSQL 18 mặc định:

```sql
streaming = parallel
```

Điều này cho phép stream dữ liệu sớm hơn và xử lý song song bằng nhiều worker.

Kết quả là giảm **replication lag**, đặc biệt với workload có transaction lớn.

Bạn cũng có thể tune thêm:

```sql
max_parallel_apply_workers_per_subscription
max_logical_replication_workers
```

---

## Thay đổi two-phase commit linh hoạt hơn

Trước đây muốn bật/tắt **two-phase commit** thường phải drop subscription.

Giờ có thể thay đổi trực tiếp:

```sql
ALTER SUBSCRIPTION sub_orders DISABLE;
ALTER SUBSCRIPTION sub_orders SET (two_phase = true);
ALTER SUBSCRIPTION sub_orders ENABLE;
```

Điểm hay là replication slot vẫn giữ nguyên, nên không cần sync lại dữ liệu từ đầu.

Lưu ý: cần bật `max_prepared_transactions > 0` ở cả publisher và subscriber. Trên RDS, thao tác này cần reboot.

---

## Tự động xử lý replication slot bị idle

Replication slot bị bỏ quên là nguyên nhân phổ biến khiến WAL tăng không kiểm soát.

PostgreSQL 18 thêm tham số:

```sql
idle_replication_slot_timeout
```

Nếu slot idle quá lâu, PostgreSQL sẽ tự invalidate slot đó để giải phóng WAL.

Một số điểm cần chú ý:

- Mặc định = `0`, tức là chưa bật.
- Có thể thay đổi mà không cần reboot.
- Áp dụng khi checkpoint chạy.

Điều này giúp giảm rủi ro đầy disk do slot quên dọn.

---

## Một vài lưu ý

Khi dùng các tính năng mới, nên nhớ:

- Generated column chỉ replicate nếu là **STORED**.
- Subscriber nên dùng cột thường, không phải generated column.
- Một số conflict counters liên quan đến replication origin cần bật `track_commit_timestamp` trên subscriber.
- Các counter khác như `INSERT` trùng key hoặc `UPDATE`/`DELETE` vào row không tồn tại vẫn có thể theo dõi mà không cần bật tham số này.
- Logical replication không sync sequence → cần kiểm tra nếu promote subscriber.
- Nên dùng cùng version PostgreSQL 18 để tận dụng đầy đủ tính năng.

---

## Khi nào nên dùng các cải tiến này?

Các cải tiến này đặc biệt hữu ích khi:

- Đồng bộ dữ liệu sang read replica hoặc hệ thống báo cáo.
- Migrate database.
- Tách workload đọc/ghi.
- Chạy nhiều subscriber cho nhiều mục đích.
- Muốn kiểm soát conflict rõ ràng hơn.
- Tránh tình trạng WAL tăng do slot bị bỏ quên.

Trong môi trường **RDS** hoặc **Aurora**, những cải tiến này giúp logical replication dễ vận hành hơn đáng kể.

---

## Kết luận

PostgreSQL 18 mang lại nhiều nâng cấp thực tế cho logical replication: hỗ trợ generated columns, theo dõi conflict tốt hơn, streaming song song mặc định, thay đổi two-phase commit linh hoạt và tự xử lý replication slot idle.

Điểm đáng giá nhất là giúp việc vận hành production đỡ đau đầu hơn, ít phải debug thủ công, ít rủi ro hơn và dễ kiểm soát hơn.

Nếu bạn đang dùng **Amazon RDS for PostgreSQL** hoặc **Aurora PostgreSQL-Compatible Edition**, đây là phiên bản rất đáng để cân nhắc nâng cấp.

---

## Link bài viết tham khảo

[Logical Replication Improvements in Amazon RDS for PostgreSQL 18](https://aws.amazon.com/vi/blogs/database/logical-replication-improvements-in-amazon-rds-for-postgresql-18/)

---
![](https://hoaithoai.github.io/images/Blog/blog2.png)