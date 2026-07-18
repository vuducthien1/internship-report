---
title: "Post-Deployment Resource Status Validation"
date: 2024-01-01
weight: 5
chapter: false
pre: " <b> 5.5. </b> "
---


#### Purpose
Verify that core services provisioned by CloudFormation have been created according to the expected secure architecture.

#### Actual services to verify on the AWS Dashboard

| Service | Resource name created | Status |
|:--|:--|:--|
| Amazon S3 | `vdcms-prod-frontendbucket-eltg7i7qejwf` (Frontend) & `vdcms-prod-databucket-fd8alu3qezcr` (Data) | Created |
| Amazon EC2 | `vdcms-prod-backend` (t3.small) | Running |
| Amazon RDS | `vdcms-prod-database` (Engine: MySQL Community / Aurora) | Available |
| Amazon CloudFront | Distribution `E1R0G8NW5808J0` | Enabled |
| Amazon SQS | `vdcms-prod-TranscribeQueue` & `vdcms-prod-TranscribeDeadLetterQueue` | Created |
| Amazon Cognito | User pool `vdcms-prod-users` with groups: `admin`, `manager`, `engineer` | Created |
| AWS Secrets Manager | `DatabaseServer-Secret...`, `JwtSecret-...` | Stored securely |
| AWS WAF & Shield | `vdcms-prod-regional-waf` (4 rulesets) | Applied |
| Amazon CloudWatch | Log groups (RDS TLS parameter history) | Available |

- **Amazon S3:** Confirm two buckets exist: `vdcms-prod-frontendbucket-eltg7i7qejwf` contains the static Frontend, and `vdcms-prod-databucket-fd8alu3qezcr` stores audio files and Transcribe artifacts.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-3.png)

- **Amazon EC2:** In the EC2 console, confirm instance `vdcms-prod-backend` (t3.small) is in **Running** state.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5.png)

- **Amazon RDS:** In RDS/Aurora console, verify the database cluster `vdcms-prod-database` (MySQL Community) is **Available**.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-5.png)

- **Amazon CloudFront:** Ensure distribution `E1R0G8NW5808J0` is **Enabled**.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-2.png)

- **Amazon SQS:** Verify queues `vdcms-prod-TranscribeQueue` and `vdcms-prod-TranscribeDeadLetterQueue` exist and are active.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-4.png)

- **Amazon Cognito:** Check the User pool `vdcms-prod-users` and its Groups; confirm `admin`, `manager`, `engineer` exist.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-8.png)

- **AWS Secrets Manager:** Verify secrets such as `DatabaseServer-Secret...` and `JwtSecret-...` are present and stored securely.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-7.png)

- **AWS WAF & Shield:** Confirm regional WAF `vdcms-prod-regional-waf` is applied and the rule groups for bot/IP/DDoS/malware protection are active.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-6.png)

- **Amazon CloudWatch:** Inspect Log groups and review RDS logs for TLS parameter history and other initialization events.
![](https://hoaithoai.github.io/images/5-Workshop/5.5-Multi-Service-Integration/5-5-1.png)
