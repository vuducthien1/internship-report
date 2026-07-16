---
title: "Blog 3"
date: 2026-07-08
weight: 3
chapter: false
pre: " <b> 3.3. </b> "
----------------------

{{% notice note %}}
📌 **Infor:** Blog 3 - Private NAT Gateway
{{% /notice %}}

# Private NAT Gateway - How United Airlines solved IP exhaustion when the system needed to scale urgently

In large-scale cloud systems, sometimes the problem is not a lack of compute, containers, or serverless capacity, but something very basic: **IP addresses**.

**United Airlines** is a major airline in the United States, operating systems that serve hundreds of millions of passengers each year. When incidents occur, such as severe weather, mass flight cancellations, or disruptions caused by air traffic control, United's system needs to scale very quickly to handle many tasks at the same time: rebooking tickets, updating itineraries, processing flight data, coordinating baggage, and reassigning crews.

However, in a **hybrid network** environment with hundreds of AWS accounts connected back to on-premises systems, United encountered a rather frustrating limitation: **exhaustion of routable IPv4 addresses**.

---

## The problem: compute could scale, but IPs could not

In AWS, many workloads running inside a VPC require an **Elastic Network Interface (ENI)**. For example:

* Amazon ECS tasks.
* AWS Glue jobs.
* AWS Lambda functions attached to a VPC.

Each ENI consumes one IP address in the subnet. For large enterprises like United Airlines, private IP ranges under **RFC 1918** are often allocated very carefully to avoid overlap with on-premises networks, other VPCs, or internal network systems.

Under normal conditions, the allocated IP capacity may be enough. But when a widespread incident occurs, many workloads scale up at the same time. ECS tasks increase, Glue jobs run more frequently, and Lambda functions fan out in large numbers. All of them consume IPs from a limited pool.

As a result, the system can hit the IP ceiling exactly when it needs to scale the most.

The difficult point is that requesting additional routable IP ranges cannot be done in a few minutes. It requires coordination with the network team, routing updates, firewall rule changes, and overlap checks. In a large environment, this process can take several weeks.

United needed a way for compute to scale quickly without depending on the remaining number of available routable IP addresses.

---

## Why not simply request more IPs or move to IPv6?

Before choosing **Private NAT Gateway**, United considered several different options.

**Requesting more RFC 1918 space** is the most direct approach, but it is not suitable for sudden scaling needs because it takes a lot of coordination time.

**IPv6** is a long-term solution to the IPv4 shortage problem. However, for an enterprise with hundreds of accounts, many routing systems, monitoring tools, and security policies still based on IPv4, moving to IPv6 is a major organization-level decision. It cannot be implemented quickly just to solve a short-term issue.

**AWS PrivateLink** is suitable when specific services need to be exposed between VPCs, but United's workloads needed outbound connectivity to many destinations: Transit Gateway, on-premises systems, shared services, and multiple other VPCs.

**Amazon VPC Lattice** fits a clear service-to-service model, but United's problem leaned more toward general outbound connectivity, meaning workloads needed to reach many different destinations instead of only calling a few pre-registered services.

**Network renumbering** could solve the problem at the root, but at a large scale, this would be a multi-year project.

Therefore, United chose Private NAT Gateway because it could be implemented within a few weeks, did not require changes to destination systems, and still worked with the existing IPv4 infrastructure.

---

## Main idea of the solution

Instead of placing all workloads in subnets that use scarce routable IPs, United moved compute workloads to the `100.64.0.0/10` range.

This is the **Carrier-Grade NAT** range defined by **RFC 6598**. These addresses are not routed inside United's corporate network, so they can be used for compute subnets without requesting allocation from the traditional routable IPv4 pool.

But there is one issue: workloads running on the `100.64.x.x` range cannot communicate outside the VPC by themselves, such as to on-premises systems, shared services, or other VPCs through Transit Gateway.

This is where **Private NAT Gateway** becomes useful.

Private NAT Gateway is placed in a routable subnet. When a workload from a `100.64.x.x` subnet sends traffic outside, Private NAT Gateway translates the source IP from a non-routable address to the routable address of the gateway. After that, the traffic can continue through Transit Gateway to the systems it needs to access.

Simply put:

* Compute uses non-routable IPs to avoid running out of addresses.
* Private NAT Gateway sits in the middle to translate traffic to a routable IP.
* The destination system does not need to change anything.

---

## How does the architecture work?

United's model can be understood in three main parts.

The first part is the **non-routable compute subnets** using the `100.64.0.0/10` range. This is where ECS tasks, AWS Glue jobs, and VPC-attached Lambda functions run.

The second part is the **routable subnets**. These subnets still use IP ranges that can be routed in the corporate network. Private NAT Gateway, load balancers, or components that need to be accessed directly are placed here.

The third part is **Transit Gateway**, which connects to other VPCs, shared services, and on-premises systems.

The traffic flow works as follows:

1. A workload in the `100.64.x.x` subnet sends a request outside the VPC.
2. The route table of the non-routable subnet sends default traffic to Private NAT Gateway.
3. Private NAT Gateway translates the source IP to the gateway's routable IP.
4. The traffic continues through Transit Gateway to the destination system.
5. The response returns to Private NAT Gateway.
6. The gateway translates it back to the original IP of the workload.

The internal workload does not need to know that NAT is happening. It still sends requests as usual.

---

## How should the route table be configured?

Basically, United used two types of route tables.

For the **non-routable subnet**, internal traffic inside the VPC still goes through the local route. Services such as S3 or DynamoDB can go through VPC endpoints. Other traffic goes through Private NAT Gateway.

For the **routable subnet**, default traffic can go through Transit Gateway to reach the corporate network, on-premises systems, or other VPCs.

This configuration clearly separates responsibilities:

* Non-routable subnets are used for large-scale compute.
* Routable subnets are used for components that need broader network connectivity.
* Private NAT Gateway acts as the address translation layer between the two areas.

---

## Results achieved

After using Private NAT Gateway, United Airlines was able to decouple compute scaling from the limitation of routable IPs.

Previously, during **IRROPS**, tasks or functions could fail because the subnet ran out of IPs. After moving to this model, compute workloads could scale on non-routable subnets without being limited by the scarce routable IP pool.

The time needed to add capacity also changed significantly. Instead of waiting several weeks to request more IPs and update firewalls, teams could expand workloads within minutes on the `100.64.0.0/10` range.

This is especially important in aviation, because even one incident where the rebooking system cannot scale in time can affect tens of thousands of passengers in a short period.

---

## A few operational lessons

There are several important points to note when deploying Private NAT Gateway at a large scale.

First, NAT Gateway should be deployed appropriately by **Availability Zone**. When traffic increases heavily, NAT Gateway handles a large load. A single gateway has very high limits, but with thousands of short-lived Lambda invocations calling the same endpoint, **port exhaustion** can still occur. Therefore, metrics such as `ErrorPortAllocation` should be monitored in CloudWatch.

Second, not every resource should be moved to a non-routable subnet. Components that need to be accessed directly from the corporate network, such as load balancers, NAT Gateway, or certain special interfaces, should still remain in routable subnets.

Third, NAT hides the original IP of the workload. The destination system sees the source IP as the Private NAT Gateway instead of the IP of the container or Lambda function. For tracing, **VPC Flow Logs** with a custom format can be used to record both the pre-NAT and post-NAT addresses.

Fourth, with **Amazon EKS**, United can use custom networking so that pods receive non-routable IPs. But with **ECS**, **Glue**, and **Lambda**, these services attach ENIs directly to the configured subnet, so Private NAT Gateway is a more suitable way to handle outbound connectivity.

---

## When should this model be used?

Private NAT Gateway is suitable for enterprises facing IPv4 shortage in a hybrid network environment, especially when:

* There are many AWS accounts connected to on-premises.
* RFC 1918 space is allocated with strict limitations.
* Serverless or container workloads need to scale suddenly.
* Requesting additional IPs takes a long time.
* The system still depends heavily on IPv4.
* Outbound connectivity is needed to multiple VPCs, shared services, or on-premises systems.

This is not a complete long-term replacement for IPv6, but it is a practical way to solve the scaling problem within the current infrastructure.

---

## Conclusion

The story of United Airlines shows a very real problem in cloud networking: sometimes the system is not limited by compute, but by IP addresses.

By moving workloads to the non-routable `100.64.0.0/10` subnet and using Private NAT Gateway to translate traffic to a routable network, United removed the IP limitation from the scaling process. Workloads such as ECS, AWS Glue, and Lambda can scale faster during high-pressure periods without waiting for additional IP allocation from the network team.

In my opinion, the most valuable point of this solution is its practicality. It does not require major changes to destination systems, does not require years of network re-architecture, and can be deployed on the existing IPv4 infrastructure.

For large organizations facing IP shortage problems in a hybrid AWS environment, Private NAT Gateway is a worthwhile option to consider.

---

## Reference source

https://aws.amazon.com/vi/blogs/networking-and-content-delivery/how-united-airlines-solved-ip-exhaustion-with-private-nat-gateway/

---

<img src="/images/Blog/blog3-3.png" style="max-width:100%; margin-bottom:16px;" />
<img src="/images/Blog/blog3-2.png" style="max-width:100%; margin-bottom:16px;" />
<img src="/images/Blog/blog3-1.png" style="max-width:100%; margin-bottom:16px;" />
