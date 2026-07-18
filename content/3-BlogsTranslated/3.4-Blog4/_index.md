---
title: "Blog 4"
date: 2026-07-09
weight: 4
chapter: false
pre: " <b> 3.4. </b> "
---

📌 **Infor:** Blog 4 - Amazon EKS Version Rollbacks

# Amazon EKS Version Rollbacks - Say goodbye to the fear of "cluster crashes" every time Kubernetes is upgraded

Hello everyone, today I will quickly share a new and extremely helpful feature from AWS for those operating Kubernetes: **Kubernetes Version Rollbacks** for **Amazon EKS**. This feature promises to help DevOps teams sleep better whenever cluster upgrade season comes around.

---

## Previous problem: A risky "one-way door"

Until now, upgrading the **control plane** in open-source Kubernetes has always been a "no turning back" decision. By nature, K8s does not support downgrading the control plane, meaning once you press the upgrade button, there is no way to roll back.

This limitation forces enterprises to create extremely complicated testing processes on their own: from setting up **bake periods**, staggering deployment groups, to approval cycles that can last for months.

With Kubernetes releasing 3 **minor versions** each year, teams managing hundreds of clusters — especially in highly regulated finance and banking environments — often choose to delay upgrades because they are afraid the system may crash and cannot be restored.

As a result, clusters get stuck on old versions, miss security patches, and reach **End of Support**.

---

## Solution: The magical "Undo" button from Amazon EKS

To solve this painful problem, AWS has officially released the **version rollbacks** feature for **Amazon EKS**. This is the "safety net" that helps teams reverse the upgrade process within **7 days** if any conflict or compatibility issue is found, bringing the cluster back to its previous stable state immediately.

Unlike community **emulated versions**, which only keep the cluster in a temporary transitional state, EKS rollback brings the system back to the real previous version that was fully validated and had been running stably in production.

For example, if upgrading from version `1.34` to `1.35` causes a compatibility issue, teams only need to roll back to `1.34`. There is no need to rebuild the cluster from scratch or rush to fix bugs under time pressure.

---

## Smart operating mechanism

**Automatic safety assessment:** Before allowing a rollback, EKS uses the **cluster insights** feature to automatically scan the system and flag warnings if there are any issues with node versions or add-on dependencies. If the team has already checked everything and wants to proceed quickly, the `--force` flag can be used to skip this step.

**Fast execution time:** The control plane rollback process takes about **20 minutes**, equivalent to a standard upgrade, and the cluster continues operating normally during this time.

---

## Special note for EKS Auto Mode

For teams using **EKS Auto Mode**, meaning the infrastructure is fully managed, this feature is even better because it automatically rolls back both the control plane and the managed nodes together.

However, because node rollback must respect the **Pod Disruption Budgets - PDB** configuration to ensure the application does not go down, this process may take longer.

To optimize the experience, AWS has added a **cancel API** that allows teams to actively stop the node rollback process at any time to adjust the PDB or change the handling strategy.

---

## Cost and availability

**COMPLETELY FREE:** This feature is included by default. Teams only pay the normal EKS and compute costs, with no additional charges for rollback.

Currently, this feature is available in all commercial **AWS Regions**, supporting both EKS clusters under **standard support** and **extended support**.

---

## Conclusion

The **Kubernetes Version Rollbacks** feature on **Amazon EKS** has thoroughly solved one of the biggest fears for operations teams: failed upgrades with no way back. Maintaining security and keeping systems updated to newer versions is now much safer and easier.

---

## Detailed article link

[Upgrade Amazon EKS clusters with confidence using Kubernetes version rollbacks](https://aws.amazon.com/blogs/aws/upgrade-amazon-eks-clusters-with-confidence-using-kubernetes-version-rollbacks/)

---
![](https://hoaithoai.github.io/images/Blog/blog4.png)
