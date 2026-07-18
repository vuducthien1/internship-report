---
title : "Workshop Overview"
date : 2024-01-01 
weight : 1 
chapter : false
pre : " <b> 5.1. </b> "
---

# Tổng quan Workshop

#### Giới thiệu bài Lab
Workshop này tập trung vào việc tự động hóa toàn bộ quy trình triển khai và vận hành hệ thống VDCMS (Voice-Driven Construction Management System) – giải pháp quản lý tiến độ và an toàn công trường thông qua công nghệ nhận diện giọng nói thông minh. Hệ thống giải quyết bài toán thực tế tại các công trường xây dựng: giúp kỹ sư lập báo cáo nhanh bằng lời thoại, tự động chuyển đổi thành văn bản và đồng bộ hóa dữ liệu lên Cloud để cấp quản lý phê duyệt tức thời.

#### Mục tiêu kỹ thuật

- Xác thực thành công cấu hình giao thức gửi nhận email an toàn trên Cloud thông qua Amazon SES.
- Thực hiện tư duy Hạ tầng dạng mã nguồn (IaC) để triển khai tự động, đồng bộ cụm tài nguyên phức tạp bằng AWS CloudFormation thay vì cấu hình thủ công từng dịch vụ.
- Phân phối ứng dụng Frontend phi máy chủ (Serverless) với hiệu năng cao, độ trễ thấp thông qua sự kết hợp giữa Amazon S3 và Amazon CloudFront.
- Đánh giá tính toàn vẹn của một kiến trúc Cloud Production đa tầng bao gồm: Máy chủ mã nguồn ứng dụng Backend (EC2), Cơ sở dữ liệu quan hệ (RDS Aurora), Quản lý định danh phiên đăng nhập (Cognito), Bảo mật thông tin mã hóa (Secrets Manager), Hàng đợi bất đồng bộ (SQS) và Tường lửa ứng dụng web (WAF).

#### Sơ đồ kiến trúc triển khai hệ thống (Architecture Diagram)

![Sơ đồ kiến trúc](https://hoaithoai.github.io/images/2-Proposal/vdcms_architecture.png)