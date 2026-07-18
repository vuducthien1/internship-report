---
title: "Resource Cleanup and Decommissioning Process"
date: 2024-01-01
weight: 7
chapter: false
pre: " <b> 5.7. </b> "
---

#### Mục đích
Xóa bỏ triệt để hạ tầng thử nghiệm sau khi hoàn tất quá trình kiểm thử luồng hệ thống nhằm tối ưu hóa chi phí và tránh phát sinh hóa đơn ngoài ý muốn trên AWS.

#### Các bước tiến hành cụ thể qua AWS CloudShell
Người thực hiện mở cửa sổ tiện ích **AWS CloudShell** và lần lượt thực thi các giai đoạn dọn dẹp hạ tầng tự động sau:

**Bước 1 — Tắt tính năng RDS Deletion Protection và xóa dữ liệu trong S3 Buckets**

```
# Lấy DB Instance Identifier
DB_ID=$(aws rds describe-db-instances --region ap-southeast-1 \
  --query 'DBInstances[?contains(DBInstanceIdentifier,`vdcms`)].DBInstanceIdentifier' \
  --output text)

# Tắt tính năng Deletion Protection
aws rds modify-db-instance \
  --db-instance-identifier "$DB_ID" \
  --no-deletion-protection \
  --apply-immediately \
  --region ap-southeast-1 > /dev/null

echo "Chờ RDS apply (~2 phút)..."
aws rds wait db-instance-available \
  --db-instance-identifier "$DB_ID" --region ap-southeast-1

# Lấy tên các buckets từ CloudFormation Outputs
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

DATA_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name vdcms-prod --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DataBucketName`].OutputValue' \
  --output text)

# Xóa đệ quy toàn bộ dữ liệu bên trong bucket
aws s3 rm "s3://$FRONTEND_BUCKET" --recursive
aws s3 rm "s3://$DATA_BUCKET" --recursive

echo "=== BƯỚC 1 XONG ==="
```

![](https://hoaithoai.github.io/images/5-Workshop/5.7-Cleanup/5-7.png)

**Bước 2 — Xóa bỏ CloudFormation Stack**

```
aws cloudformation delete-stack \
  --stack-name vdcms-prod --region ap-southeast-1

echo "Đang xóa stack, chờ 10–15 phút..."
aws cloudformation wait stack-delete-complete \
  --stack-name vdcms-prod --region ap-southeast-1

echo "=== STACK ĐÃ XÓA ==="
```

![](https://hoaithoai.github.io/images/5-Workshop/5.7-Cleanup/5-7-4.png)

**Bước 3 — Xóa bỏ các thông tin cấu hình nhạy cảm trên Secrets Manager**

```
for ARN in $(aws secretsmanager list-secrets --region ap-southeast-1 \
  --query 'SecretList[?contains(Name,`Secret`)].ARN' --output text); do
  aws secretsmanager delete-secret \
    --secret-id "$ARN" \
    --force-delete-without-recovery \
    --region ap-southeast-1
  echo "Đã xóa secret: $ARN"
done

echo "=== DỌN SẠCH XONG ==="
```

![](https://hoaithoai.github.io/images/5-Workshop/5.7-Cleanup/5-7-3.png)

---
#### Hậu kiểm và dọn dẹp thủ công trên AWS Console
Sau khi hoàn tất luồng lệnh tự động, người thực hiện truy cập vào **AWS Management Console** để rà soát, kiểm tra và xử lý dứt điểm các tài nguyên độc lập hoặc bản lưu vết tự sinh theo danh mục hướng dẫn dưới đây:

| Dịch vụ | Vị trí thao tác | Hành động yêu cầu |
|:--|:--|:--|
| S3 buckets còn lại | S3 → Buckets | Thực hiện **Empty** dữ liệu và nhấn **Delete** lần lượt đối với từng bucket còn sót lại |
| RDS Snapshots | RDS → Snapshots | Nhấp chọn 2 bản snapshot tự động sinh ra trong quá trình xóa hạ tầng → **Actions** → **Delete** |

![](https://hoaithoai.github.io/images/5-Workshop/5.7-Cleanup/5-7-1.png)![](https://hoaithoai.github.io/images/5-Workshop/5.7-Cleanup/5-7-2.png)
