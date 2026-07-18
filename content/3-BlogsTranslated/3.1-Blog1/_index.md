---
title: "Blog 1"
date: 2024-07-07
weight: 1
chapter: false
pre: " <b> 3.1. </b> "
---

📌 **Infor:** Blog 1 - Amazon VPC Lattice

# Amazon VPC Lattice - When microservices no longer have to take a long detour to communicate with each other

Hello everyone, today I will quickly share a case study from AWS about how **Insurance Australia Group (IAG)** used **Amazon VPC Lattice** to improve communication between services in a serverless architecture.

IAG is a large insurance company in Australia and New Zealand, operating many customer-facing systems such as insurance purchasing, policy management, and related services. They built their platform on AWS using a serverless approach with many microservices running on **AWS Lambda**. As the number of services increased, service-to-service communication began to create performance and complexity issues.

---

## Previous problem

In the old architecture, when one Lambda called another service, the request did not go directly. Instead, it had to go through multiple layers such as **Transit Gateway**, **Egress VPC**, proxy, the Internet, and then finally to **API Gateway** and the destination service.

Although the services were still inside AWS, the request had to take a relatively long route. This increased latency, made the architecture more complex, and made it harder to manage. When one service continued calling multiple other services, the latency accumulated even more. In addition, endpoints were often hardcoded, making changes less flexible.

---

## What is Amazon VPC Lattice?

**Amazon VPC Lattice** helps simplify service connectivity within AWS. Instead of manually handling multiple networking layers, services can communicate with each other through a shared connection layer that is more secure and easier to manage.

In this case, IAG used **Lattice Services** to expose Lambda functions, allowing services to communicate directly within the AWS network without going through the Internet.

---

## New architecture

IAG implemented VPC Lattice by creating separate **Service Networks** for each environment, such as **Development**, **Staging**, and **Production**. These networks are centrally managed and shared with the corresponding accounts.

This approach clearly separates environments while still keeping them easy to manage. At the same time, they used **Auth Policy** to allow traffic only from valid VPCs, adding another layer of security control.

---

## New communication flow

After using VPC Lattice, requests between services became much shorter. Lambda only needs to call an internal domain, **Route 53** maps it to the Lattice service, and then the request is forwarded directly to the Lambda function of the destination service.

As a result, traffic no longer needs to go through the Internet or multiple intermediary layers, helping reduce latency and improve security.

---

## Results

After implementation, IAG recorded a reduction in service-to-service latency from **46% to 83%**, with **P95 latency** improving from **15% to 92%**. This is a significant improvement, especially for systems with many services calling each other.

In addition, the architecture also became cleaner, easier to operate, and less dependent on complex networking components.

---

## Main benefits

VPC Lattice helps significantly reduce latency, simplify network architecture, and improve security because traffic does not need to go out to the Internet. Environment separation also becomes clearer, making it suitable for multi-account systems. In particular, it fits very well with serverless architectures using Lambda.

The main benefits can be summarized as follows:

- Reduces latency when services communicate with each other.
- Simplifies the network architecture between microservices.
- Limits the need for traffic to go through the Internet.
- Improves security control with Auth Policy.
- Fits systems with multiple environments and multiple AWS accounts.
- Provides good support for serverless architectures using AWS Lambda.

---

## A few notes

Currently, IAG is still using **Auth Policy** at the Service Network level, which means control is based on VPC. In the future, they want to control access in more detail at the individual service level.

In addition, the event format from VPC Lattice is different from API Gateway, so teams need to update their handlers to process it correctly.

---

## Conclusion

Amazon VPC Lattice helps IAG solve a common problem in microservices: faster, simpler, and more secure communication. Instead of having to go through multiple network layers, services can call each other directly within AWS, significantly reducing latency and making the architecture cleaner.

If you are building a serverless or microservices system on AWS, especially when the number of services starts to grow, VPC Lattice is a very worthwhile option to consider.

---

## Reference link

[How IAG accelerated service-to-service communication with Amazon VPC Lattice](https://aws.amazon.com/vi/blogs/networking-and-content-delivery/how-iag-accelerated-service-to-service-communication-with-amazon-vpc-lattice/)

---
![](https://hoaithoai.github.io/images/Blog/blog1-1.png)![](https://hoaithoai.github.io/images/Blog/blog1-2.png)