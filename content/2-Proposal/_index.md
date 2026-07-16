---
title: "Proposal"
date: 2026-06-22
weight: 2
chapter: false
pre: " <b> 2. </b> "
---

{{% notice note %}}
📌 **Info:** VDCMS project proposal — a content management system integrated with speech-to-text on AWS.
{{% /notice %}}

# VDCMS - Voice-Driven Content Management System

## AWS solution for a content management system integrated with speech-to-text

---

### 1. Executive Summary

VDCMS is a content management system that supports users in creating, storing, and managing reports through a modern web interface. The highlight of the system is the integration of a speech-to-text workflow using Amazon Transcribe, allowing users to record content and convert it into text for the report creation process.

The system is designed for a demo/MVP environment with the assumption of approximately 50 users, around 100 reports per month, and about 30 minutes of audio recording per month. The architecture uses AWS services such as Amazon CloudFront, Amazon S3, AWS WAF, Application Load Balancer, Amazon EC2, Amazon RDS MySQL, Amazon SQS, Amazon Transcribe, Amazon SES, Amazon Cognito, AWS Secrets Manager, AWS Systems Manager, and Amazon CloudWatch.

The objective of the project is to build a three-tier web architecture that is secure, operationally stable, capable of asynchronous task processing, and suitable for the scope of the project. Thanks to deployment using Infrastructure as Code, the team can delete all resources after testing to save costs and redeploy the same architecture when needed for grading.

---

### 2. Problem Statement

#### Current Problem

During the process of creating and managing reports, users often have to enter content manually, which can easily be time-consuming when reports contain many ideas or when quick notes need to be recorded from presentations, group meetings, or narrations. Without a centralized system, report data can be scattered, difficult to manage, difficult to track in terms of editing history, and difficult to expand with additional functions such as email sending, user authentication, or audio file processing.

In addition, regular web systems, if deployed without a clear architecture, may face many limitations such as insufficient security, difficulty in access control, difficulty in tracking system errors, and difficulty in optimizing costs when running on the cloud.

#### Solution

VDCMS is proposed as a content management system deployed on AWS, combining a three-tier web model with an asynchronous event-processing workflow. The frontend SPA is stored on Amazon S3 and distributed through Amazon CloudFront. Requests from users are protected by AWS WAF and routed through Application Load Balancer to Amazon EC2, where the backend and Transcribe worker run.

The system's relational data is stored in Amazon RDS MySQL. Audio files and temporary files used for Amazon Transcribe are stored on Amazon S3. When users submit an audio file, the system sends the job to Amazon SQS for asynchronous processing, then the worker on EC2 calls Amazon Transcribe to convert speech into text. Amazon SES is used to send emails, Amazon Cognito serves user authentication, AWS Secrets Manager manages sensitive information, and Amazon CloudWatch supports system monitoring.

#### Benefits and Return on Investment (ROI)

The solution helps reduce manual data entry when creating reports, supports users in converting recorded content into text more quickly, and centralizes data in a unified management system. The architecture also helps the team practice deploying important components of a real cloud system such as security, load balancing, storage, database, queue, asynchronous processing, monitoring, and secret management.

For the project scope, the main benefit is not only the low operating cost in the demo/MVP environment, but also the ability to demonstrate a complete AWS architecture design mindset. The team can deploy, test, present, and delete resources after completion to avoid unnecessary costs.

---

### 3. Solution Architecture

VDCMS applies a three-tier web architecture combined with asynchronous processing. The presentation layer includes Amazon S3 and Amazon CloudFront to serve the frontend SPA. The application layer includes AWS WAF, Application Load Balancer, and Amazon EC2 to protect, route, and process requests. The data layer includes Amazon RDS MySQL, Amazon S3, and supporting processing services such as Amazon SQS, Amazon Transcribe, Amazon SES, Amazon Cognito, AWS Secrets Manager, AWS Systems Manager, and Amazon CloudWatch.

![VDCMS Architecture](/images/2-Proposal/vdcms_architecture.png)

#### AWS Services Used

* **Amazon CloudFront:** Distributes the frontend SPA, caches static assets, and reduces load on the backend.
* **Amazon S3:** Stores the frontend, audio files, temporary Transcribe files, and related data.
* **AWS WAF:** Protects the web application with WebACL and Managed Rule Groups.
* **Application Load Balancer:** Routes requests from users to the EC2 backend.
* **Amazon EC2:** Runs the backend and Transcribe worker.
* **Amazon RDS MySQL:** Stores the system's relational data.
* **Amazon SQS:** Acts as a queue for Transcribe processing jobs and DLQ.
* **Amazon Transcribe:** Converts audio files into text.
* **Amazon SES:** Sends emails from the system.
* **Amazon Cognito:** Supports user authentication.
* **AWS Secrets Manager:** Manages sensitive information such as credentials and secrets.
* **AWS Systems Manager:** Supports secure EC2 administration and operations.
* **Amazon CloudWatch:** Collects metrics, sampled requests, RDS logs, and basic metrics from AWS services.
* **IAM:** Manages access permissions between services according to the principle of least privilege.

#### Component Design

* **Frontend:** The SPA application is built and stored on Amazon S3, then distributed through Amazon CloudFront. Users access the system through CloudFront to increase page loading speed and reduce load on the backend.
* **Edge Security:** AWS WAF is attached to the web access flow to filter abnormal requests, collect sampled requests, and reduce the risk of common attacks.
* **Request Routing:** Application Load Balancer receives valid requests and forwards them to the EC2 backend.
* **Backend:** EC2 runs the backend application, handling main business logic such as user management, report management, file upload, AWS service calls, and returning results to the frontend.
* **Database:** Amazon RDS MySQL stores user data, reports, audio file metadata, and processing status.
* **Audio Processing:** Audio files are stored in S3, then jobs are sent to SQS. The worker on EC2 pulls jobs from SQS, calls Amazon Transcribe, and updates the results back to the system.
* **Email Sending:** Amazon SES is used to send notification emails or emails related to system functions.
* **Authentication:** Amazon Cognito is oriented to serve as the main authentication system for users.
* **Secret Management:** AWS Secrets Manager stores necessary secrets to avoid hard-coding sensitive information in the source code.
* **Monitoring:** CloudWatch collects metrics from WAF, RDS, and AWS services. EC2 application logs are currently stored in the systemd journal.

---

### 4. Technical Implementation

#### Implementation Phases

The project is implemented through the following main phases:

* **Requirement Analysis and Architecture Design:** Define the VDCMS system scope, number of demo users, number of reports, audio recording needs, and suitable AWS services.
* **Building Infrastructure with Infrastructure as Code:** Declare resources such as VPC, EC2, RDS, S3, SQS, WAF, ALB, CloudFront, and Secrets Manager so that the same architecture can be redeployed when needed.
* **Frontend and Backend Deployment:** Build the frontend SPA, upload it to S3, configure CloudFront; deploy the backend and Transcribe worker on EC2.
* **Asynchronous Processing Integration:** Configure S3, SQS, and Amazon Transcribe to process audio files, convert them into text, and update results back to the system.
* **Security and Operations Configuration:** Set up IAM Role, Secrets Manager, Systems Manager, WAF, RDS logs, and CloudWatch metrics.
* **Testing and Cost Optimization:** Test user flows, report creation flow, audio upload, Transcribe processing, email sending, and delete resources after completion to avoid incurring costs.

#### Technical Requirements

* **Frontend:** SPA application deployed through Amazon S3 and Amazon CloudFront.
* **Backend:** Application running on Amazon EC2 t3.small, simultaneously handling the roles of backend and Transcribe worker.
* **Database:** Amazon RDS MySQL db.t3.micro, 20 GB gp3, Single-AZ.
* **Networking:** The architecture uses NAT Gateway, Application Load Balancer, and suitable subnets for the demo/MVP environment.
* **Asynchronous Processing:** Amazon SQS manages the Transcribe job queue and DLQ to support error handling.
* **Speech-to-text:** Amazon Transcribe processes about 30 minutes of audio recording per month.
* **Email:** Amazon SES sends about 200 emails per month.
* **Authentication:** Amazon Cognito supports about 50 MAU within the Free Tier.
* **Security:** AWS WAF, IAM, AWS Secrets Manager, and Systems Manager support access control and system protection.
* **Monitoring:** Amazon CloudWatch collects metrics, sampled requests, and logs from RDS.

---

### 5. Roadmap & Implementation Milestones

* **Phase 1 - Preparation:** Define system requirements, main functions, user scope, number of reports, and audio processing needs.
* **Phase 2 - Architecture Design:** Design the AWS architecture including frontend, backend, database, storage, queue, speech-to-text, email, security, and monitoring.
* **Phase 3 - Infrastructure Deployment:** Use Infrastructure as Code to create the necessary AWS resources.
* **Phase 4 - Application Development:** Complete the frontend, backend, RDS connection, file upload, report creation, and Transcribe processing.
* **Phase 5 - Testing:** Test access through CloudFront, requests through WAF/ALB, backend connection, database, SQS, Transcribe, and SES.
* **Phase 6 - Presentation and Optimization:** Present the system, collect results, and delete resources after testing to save costs.
* **After Deployment:** Upgrade the system toward production if needed, including Multi-AZ, multiple EC2 instances, Redis Adapter, CloudWatch Agent, SNS Alarm, and SES Production Access.

---

### 6. Budget Estimation

#### Infrastructure Costs

*(Assumption: 50 users, ~100 reports/month, ~30 minutes of audio recording/month — demo/MVP environment, region ap-southeast-1)*

* **Amazon EC2** (t3.small — backend + Transcribe worker): 15,49 USD/month ($0,021/hour × 730 hours).
* **Amazon RDS MySQL** (db.t3.micro, 20 GB gp3, Single-AZ): 15,62 USD/month ($0,018/hour × 730 hours + 20 GB × $0,115/GB).
* **NAT Gateway:** 32,85 USD/month ($0,045/hour × 730 hours, excluding data transfer).
* **Application Load Balancer:** 16,43 USD/month ($0,008/hour × 730 hours + minimum LCU).
* **AWS WAF** (1 WebACL + 2 Managed Rule Groups): 7,00 USD/month ($5/WebACL + $1/rule group × 2).
* **Amazon CloudFront** (serving frontend SPA, ~5 GB/month): 0,43 USD/month ($0,085/GB × 5 GB).
* **Amazon S3** (2 buckets, ~2 GB data + versioning): 0,05 USD/month ($0,025/GB × 2 GB).
* **Amazon SQS** (Transcribe queue + DLQ, ~100 jobs/month): 0,00 USD/month (within the Free Tier of 1 million requests).
* **Amazon Transcribe** (~30 minutes of audio recording/month): 0,72 USD/month ($0,024/minute × 30 minutes).
* **Amazon SES** (~200 emails/month): 0,02 USD/month ($0,10/1,000 emails × 0,2).
* **Amazon Cognito** (~50 MAU): 0,00 USD/month (within the Free Tier of 50,000 MAU).
* **AWS Secrets Manager** (3 secrets): 1,20 USD/month ($0,40/secret × 3).
* **Amazon CloudWatch** (RDS logs, metrics): 0,50 USD/month (basic metrics + log storage).

Total: ~90,31 USD/month

---

### 7. Risk Assessment

#### Risk Matrix

* NAT Gateway, ALB, WAF, and RDS still incur costs when there are few users: Medium impact, medium probability.
* EC2 fails or becomes overloaded because only one instance is running: High impact, low probability in the demo environment.
* RDS Single-AZ encounters an Availability Zone failure: High impact, low probability.
* Audio file processing fails or a Transcribe job encounters an error: Medium impact, medium probability.
* SES is still in Sandbox, limiting email sending capability: Medium impact, medium probability.
* EC2 application logs have not yet been pushed to CloudWatch Logs using CloudWatch Agent: Medium impact, medium probability.

#### Mitigation Strategies

* **Cost:** Deploy the infrastructure only during testing and presentation, then delete resources using Infrastructure as Code.
* **EC2:** Limit the Auto Scaling Group to a maximum of one instance in the demo, but it can be expanded to multiple EC2 instances in real deployment.
* **RDS:** Use Single-AZ to save costs in the demo; upgrade to Multi-AZ when high availability is required.
* **Transcribe:** Use Amazon SQS and DLQ to manage jobs, reducing task loss when errors occur.
* **SES:** Use within the sandbox scope during the demo; request SES Production Access if deploying for real use.
* **Monitoring:** CloudWatch currently collects metrics and RDS logs; add CloudWatch Agent and SNS Alarm during the upgrade phase.

#### Contingency Plan

* If the cloud system encounters an error, the team can recheck resources using Infrastructure as Code and redeploy the same architecture.
* If Transcribe encounters an error, the job can be sent to the DLQ for checking and reprocessing.
* If cost reduction is needed, the team can delete cost-incurring resources such as NAT Gateway, ALB, WAF, EC2, and RDS after completing testing.
* If SES has not been granted Production Access, the team only demonstrates the email sending function within the sandbox scope.

---

### 8. Expected Outcomes

#### Technical Improvements

VDCMS provides a report management system with a web interface, centralized database, and speech-to-text capability. The system helps users create reports more conveniently, while also supporting the team in practicing the deployment of important AWS services in an architecture close to reality.

#### Long-term Value

The current architecture can be used as a foundation to develop into a complete production system. In the future, the team can upgrade to two NAT Gateways for two Availability Zones, Auto Scaling with multiple EC2 instances, Amazon ElastiCache Redis for Socket.IO, RDS Multi-AZ, VPC Endpoint for S3 and AWS services, CloudWatch Agent, SNS Alarm, Cognito as the main authentication system, and SES Production Access.

#### Operational Capability

Thanks to the use of Infrastructure as Code, the system can be redeployed when needed for grading or testing. After completing the presentation, the team can delete all resources to avoid incurring costs. This is an approach suitable for the project environment because it balances security, scalability, and operating costs.
