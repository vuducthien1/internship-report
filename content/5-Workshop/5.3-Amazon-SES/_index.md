---
title : "Detailed Email Authentication Configuration"
date : 2024-01-01
weight : 3
chapter : false
pre : " <b> 5.3. </b> "
---

#### Purpose
Ensure the system has a trusted communication channel to automatically send signup notifications or approval reminders.

#### Detailed procedure

1. Open the AWS Management Console in the Singapore region (`ap-southeast-1`) and navigate to Amazon Simple Email Service (SES).
2. In the left-hand menu select **Identities** and click **Create Identity**.
3. Choose **Email address** as the Identity type. Enter the address **admin.vdcms@gmail.com** in the input field and click **Create Identity**. The new Identity will initially show **Verification pending**.
4. Log in to the Gmail inbox for that address, open the email from Amazon Web Services titled "Email Address Verification Request" and click the verification URL (valid for 24 hours) to complete verification.
5. Return to the SES Console and refresh the page — the **Identity status** should change to the green **Verified** state.

![SES verification](/images/5-Workshop/5.3-Amazon-SES/5-3.png)
