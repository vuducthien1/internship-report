---
title: "Translated Blogs"
date: 2024-01-01
weight: 3
chapter: false
pre: " <b> 3. </b> "
---

{{% notice note %}}
📌 **Infor:** A collection of 4 AWS technical blogs translated during the internship, covering networking, database, storage, and container topics.
{{% /notice %}}


---

### [Blog 1 - Amazon VPC Lattice: Accelerating Microservice-to-Microservice Communication](3.1-Blog1/)

This post summarizes a case study by **Insurance Australia Group (IAG)** using **Amazon VPC Lattice** to solve high-latency issues when Lambda functions call each other in a serverless architecture. With VPC Lattice, traffic no longer routes through the Internet but travels directly within the AWS network, reducing P95 latency by **15% to 92%**.

---

### [Blog 2 - Logical Replication Improvements in Amazon RDS for PostgreSQL 18](3.2-Blog2/)

This post covers key enhancements to **logical replication** in **PostgreSQL 18** on Amazon RDS: support for replicating STORED generated columns, improved conflict visibility via `pg_stat_subscription_stats`, parallel streaming enabled by default to reduce replication lag, flexible two-phase commit changes, and automatic invalidation of idle replication slots.

---

### [Blog 3 - Private NAT Gateway: How United Airlines Solved IP Exhaustion](3.3-Blog3/)

This post analyzes how **United Airlines** used **Private NAT Gateway** to address IPv4 exhaustion in a hybrid AWS environment when workloads needed to scale rapidly. By moving compute workloads to the `100.64.0.0/10` (RFC 6598) range and using Private NAT Gateway as the address translation layer, United decoupled compute scaling from routable IP availability without requiring changes to destination systems.

---

### [Blog 4 - Amazon EKS Version Rollbacks: Kubernetes Upgrades Without the One-Way Door](3.4-Blog4/)

This post introduces **Kubernetes Version Rollbacks** on **Amazon EKS** — allowing control plane upgrade reversals within 7 days if compatibility issues are detected. This feature helps operations teams upgrade Kubernetes versions with confidence, eliminating the "one-way door" risk that previously forced lengthy validation processes, especially in tightly regulated production environments.
