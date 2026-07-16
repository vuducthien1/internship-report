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

# Private NAT Gateway - Cách United Airlines giải quyết bài toán cạn kiệt IP khi hệ thống cần scale gấp

Trong các hệ thống cloud quy mô lớn, đôi khi vấn đề không nằm ở việc thiếu compute, thiếu container hay thiếu serverless capacity, mà lại nằm ở một thứ rất cơ bản: **địa chỉ IP**.

**United Airlines** là một hãng hàng không lớn tại Mỹ, vận hành hệ thống phục vụ hàng trăm triệu hành khách mỗi năm. Khi xảy ra các sự cố như thời tiết xấu, chuyến bay bị hủy hàng loạt hoặc gián đoạn do kiểm soát không lưu, hệ thống của United cần scale rất nhanh để xử lý nhiều tác vụ cùng lúc: đặt lại vé, cập nhật hành trình, xử lý dữ liệu chuyến bay, điều phối hành lý và phân công lại phi hành đoàn.

Tuy nhiên, trong môi trường **hybrid network** với hàng trăm AWS account kết nối về hệ thống on-premises, United gặp một giới hạn khá khó chịu: **cạn kiệt địa chỉ IPv4 có thể route được**.

---

## Vấn đề: compute scale được, nhưng IP thì không

Trong AWS, nhiều workload khi chạy trong VPC sẽ cần **Elastic Network Interface (ENI)**. Ví dụ:

* Amazon ECS task.
* AWS Glue job.
* AWS Lambda function gắn với VPC.

Mỗi ENI sẽ tiêu thụ một địa chỉ IP trong subnet. Với các doanh nghiệp lớn như United Airlines, dải IP private **RFC 1918** thường được cấp phát rất chặt chẽ để tránh trùng với on-premises, VPC khác hoặc các hệ thống mạng nội bộ.

Ở trạng thái bình thường, lượng IP được cấp có thể đủ dùng. Nhưng khi xảy ra sự cố diện rộng, nhiều workload cùng scale lên một lúc. ECS task tăng, Glue job chạy nhiều hơn, Lambda function fan-out hàng loạt. Tất cả cùng lấy IP từ một pool giới hạn.

Kết quả là hệ thống có thể chạm trần IP đúng lúc cần mở rộng nhất.

Điểm khó là việc xin thêm dải IP routable không thể làm trong vài phút. Nó cần phối hợp với network team, cập nhật routing, firewall rule và kiểm tra tránh overlap. Với một môi trường lớn, quá trình này có thể kéo dài nhiều tuần.

United cần một cách để compute có thể scale nhanh mà không bị phụ thuộc vào số lượng IP routable còn trống.

---

## Vì sao không chỉ xin thêm IP hoặc chuyển sang IPv6?

Trước khi chọn **Private NAT Gateway**, United đã cân nhắc nhiều hướng khác nhau.

**Xin thêm RFC 1918 space** là cách trực tiếp nhất, nhưng không phù hợp với nhu cầu scale đột biến vì mất nhiều thời gian phối hợp.

**IPv6** là hướng giải quyết lâu dài cho bài toán thiếu IPv4. Tuy nhiên, với một doanh nghiệp có hàng trăm account, nhiều hệ thống routing, monitoring và security policy đang dựa trên IPv4, việc chuyển đổi sang IPv6 là một quyết định lớn ở cấp tổ chức, không thể triển khai nhanh chỉ để xử lý một bài toán ngắn hạn.

**AWS PrivateLink** phù hợp khi cần expose một số service cụ thể giữa các VPC, nhưng workload của United cần outbound connectivity đến nhiều nơi: Transit Gateway, on-premises, shared services và nhiều VPC khác.

**Amazon VPC Lattice** phù hợp với mô hình service-to-service rõ ràng, nhưng bài toán của United thiên về general outbound connectivity, tức là workload cần đi đến nhiều đích khác nhau thay vì chỉ gọi một số service đã đăng ký sẵn.

**Network renumbering** có thể giải quyết tận gốc, nhưng với quy mô lớn thì đây là dự án nhiều năm.

Vì vậy, United chọn Private NAT Gateway vì có thể triển khai trong vài tuần, không cần thay đổi hệ thống đích và vẫn dùng được hạ tầng IPv4 hiện tại.

---

## Ý tưởng chính của giải pháp

Thay vì đặt tất cả workload vào các subnet dùng IP routable khan hiếm, United chuyển compute workload sang dải `100.64.0.0/10`.

Đây là dải **Carrier-Grade NAT** theo **RFC 6598**. Các địa chỉ này không được route trong corporate network của United, nên có thể dùng cho compute subnet mà không cần xin cấp phát từ pool IPv4 routable truyền thống.

Nhưng có một vấn đề: workload chạy trên dải `100.64.x.x` không thể tự giao tiếp ra ngoài VPC, chẳng hạn đến on-premises, shared services hoặc VPC khác qua Transit Gateway.

Đây là lúc **Private NAT Gateway** phát huy tác dụng.

Private NAT Gateway được đặt trong subnet routable. Khi workload từ subnet `100.64.x.x` gửi traffic ra ngoài, Private NAT Gateway sẽ dịch source IP từ địa chỉ non-routable sang địa chỉ routable của gateway. Sau đó traffic có thể đi tiếp qua Transit Gateway đến các hệ thống cần truy cập.

Nói đơn giản:

* Compute dùng IP non-routable để không bị thiếu địa chỉ.
* Private NAT Gateway đứng giữa để dịch traffic ra IP routable.
* Hệ thống đích không cần thay đổi gì.

---

## Kiến trúc hoạt động như thế nào?

Mô hình của United có thể hiểu theo ba phần chính.

Phần đầu tiên là **non-routable compute subnets** dùng dải `100.64.0.0/10`. Đây là nơi chạy ECS tasks, AWS Glue jobs và Lambda functions gắn với VPC.

Phần thứ hai là **routable subnets**. Các subnet này vẫn dùng dải IP có thể route trong corporate network. Private NAT Gateway, load balancer hoặc các thành phần cần được truy cập trực tiếp sẽ nằm ở đây.

Phần thứ ba là **Transit Gateway** để kết nối đến các VPC khác, shared services và hệ thống on-premises.

Luồng traffic sẽ như sau:

1. Workload trong subnet `100.64.x.x` gửi request ra ngoài VPC.
2. Route table của non-routable subnet trỏ traffic mặc định về Private NAT Gateway.
3. Private NAT Gateway dịch source IP sang IP routable của gateway.
4. Traffic đi tiếp qua Transit Gateway đến hệ thống đích.
5. Response quay lại Private NAT Gateway.
6. Gateway dịch ngược về IP ban đầu của workload.

Workload phía trong không cần biết quá trình NAT đang diễn ra. Nó vẫn gửi request như bình thường.

---

## Route table cần cấu hình ra sao?

Về cơ bản, United dùng hai loại route table.

Với **subnet non-routable**, các traffic nội bộ trong VPC vẫn đi local. Các dịch vụ như S3 hoặc DynamoDB có thể đi qua VPC endpoint. Còn traffic khác sẽ đi qua Private NAT Gateway.

Với **subnet routable**, traffic mặc định có thể đi qua Transit Gateway để đến mạng doanh nghiệp, on-premises hoặc các VPC khác.

Cách cấu hình này giúp tách rõ vai trò:

* Non-routable subnet dành cho compute scale lớn.
* Routable subnet dành cho các thành phần cần kết nối mạng rộng hơn.
* Private NAT Gateway làm lớp dịch địa chỉ giữa hai vùng.

---

## Kết quả đạt được

Sau khi dùng Private NAT Gateway, United Airlines có thể tách việc scale compute khỏi giới hạn IP routable.

Trước đây, khi xảy ra **IRROPS**, task hoặc function có thể fail vì subnet hết IP. Sau khi chuyển sang mô hình này, compute workload có thể scale trên non-routable subnets mà không còn bị giới hạn bởi pool IP routable khan hiếm.

Thời gian bổ sung capacity cũng thay đổi đáng kể. Thay vì phải chờ nhiều tuần để xin thêm IP và cập nhật firewall, các team có thể mở rộng workload trong vài phút trên dải `100.64.0.0/10`.

Điều này đặc biệt quan trọng với hàng không, vì chỉ một sự cố khiến hệ thống rebooking không scale kịp cũng có thể ảnh hưởng đến hàng chục nghìn hành khách trong thời gian ngắn.

---

## Một vài bài học khi vận hành

Có một số điểm đáng chú ý khi triển khai Private NAT Gateway ở quy mô lớn.

Thứ nhất, cần triển khai NAT Gateway phù hợp theo **Availability Zone**. Khi traffic tăng mạnh, NAT Gateway sẽ chịu tải lớn. Một gateway có giới hạn rất cao, nhưng với hàng nghìn Lambda invocation ngắn hạn cùng gọi đến một endpoint, vẫn có thể gặp vấn đề về **port exhaustion**. Vì vậy cần theo dõi các chỉ số như `ErrorPortAllocation` trên CloudWatch.

Thứ hai, không phải tài nguyên nào cũng nên chuyển sang non-routable subnet. Các thành phần cần được truy cập trực tiếp từ corporate network như load balancer, NAT Gateway hoặc một số interface đặc biệt vẫn nên nằm trong routable subnet.

Thứ ba, NAT sẽ che mất IP gốc của workload. Hệ thống đích sẽ thấy source IP là Private NAT Gateway thay vì IP của container hoặc Lambda. Để truy vết, có thể dùng **VPC Flow Logs** với custom format để ghi lại cả địa chỉ trước NAT và sau NAT.

Thứ tư, với **Amazon EKS**, United có thể dùng custom networking để pod nhận IP non-routable. Nhưng với **ECS**, **Glue** và **Lambda**, các dịch vụ này gắn ENI trực tiếp vào subnet được cấu hình, nên Private NAT Gateway là cách phù hợp hơn để xử lý outbound connectivity.

---

## Khi nào nên dùng mô hình này?

Private NAT Gateway phù hợp với các doanh nghiệp đang gặp tình trạng thiếu IPv4 trong môi trường hybrid network, đặc biệt khi:

* Có nhiều AWS account kết nối với on-premises.
* RFC 1918 space được cấp phát hạn chế.
* Workload serverless hoặc container cần scale đột biến.
* Việc xin thêm IP mất nhiều thời gian.
* Hệ thống vẫn phụ thuộc nhiều vào IPv4.
* Cần outbound connectivity đến nhiều VPC, shared services hoặc on-premises.

Đây không phải là giải pháp thay thế hoàn toàn cho IPv6 trong dài hạn, nhưng là một cách thực tế để xử lý bài toán scale trong hạ tầng hiện tại.

---

## Kết luận

Câu chuyện của United Airlines cho thấy một vấn đề rất thực tế trong cloud networking: đôi khi hệ thống không bị giới hạn bởi compute, mà bị giới hạn bởi địa chỉ IP.

Bằng cách đưa workload sang subnet non-routable `100.64.0.0/10` và dùng Private NAT Gateway để dịch traffic ra mạng routable, United đã loại bỏ giới hạn IP khỏi quá trình scale. Các workload như ECS, AWS Glue và Lambda có thể mở rộng nhanh hơn trong những thời điểm áp lực cao mà không cần chờ cấp phát thêm IP từ network team.

Theo mình, điểm đáng giá nhất của giải pháp này là tính thực dụng. Nó không yêu cầu thay đổi lớn ở hệ thống đích, không cần tái kiến trúc mạng trong nhiều năm và có thể triển khai trên hạ tầng IPv4 hiện tại.

Với các tổ chức lớn đang gặp bài toán thiếu IP trong môi trường hybrid AWS, Private NAT Gateway là một hướng hay đáng cân nhắc.

---

## Nguồn tham khảo

https://aws.amazon.com/vi/blogs/networking-and-content-delivery/how-united-airlines-solved-ip-exhaustion-with-private-nat-gateway/

---
<img src="/images/Blog/blog3-3.png" style="max-width:100%; margin-bottom:16px;" />
<img src="/images/Blog/blog3-2.png" style="max-width:100%; margin-bottom:16px;" />
<img src="/images/Blog/blog3-1.png" style="max-width:100%; margin-bottom:16px;" />