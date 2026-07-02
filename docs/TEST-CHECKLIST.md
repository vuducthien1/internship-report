# Checklist kiểm thử toàn bộ hệ thống VDCMS

Ngày lập: **02/07/2026**  
Phạm vi: Guest, Admin, Manager, Engineer, realtime chat, file upload, bảo mật và AWS.

## 1. Cách sử dụng

- Đánh dấu `[x]` khi kết quả thực tế đúng với cột **Kết quả mong đợi**.
- Nếu lỗi, ghi mã test, ảnh chụp, request/response và log backend vào mục **Ghi nhận lỗi** cuối tài liệu.
- Chạy bộ **Local** trước; các test có nhãn **AWS** chỉ chạy sau khi stack AWS đã được triển khai.
- Không dùng dữ liệu production thật. File kiểm thử phải là dữ liệu giả.

## 2. Dữ liệu chuẩn bị

| Mã | Dữ liệu |
|---|---|
| ACC-ADMIN | Một tài khoản Admin active |
| ACC-MANAGER-A | Manager active, quản lý Project A |
| ACC-MANAGER-B | Manager active, không quản lý Project A |
| ACC-ENGINEER-A | Engineer active, được giao Task A thuộc Project A |
| ACC-ENGINEER-B | Engineer active, không thuộc Project A |
| ACC-PENDING | Engineer chưa xác minh email hoặc đang pending |
| PROJECT-A | Dự án planning/ongoing có Manager A |
| TASK-A | Công việc của Engineer A, có checklist và hạn hoàn thành |
| FILE-VALID | JPG, PNG, WEBP, PDF, DOCX, XLSX, TXT và DWG hợp lệ |
| FILE-INVALID | EXE đổi đuôi, file rỗng, file MIME giả và file vượt giới hạn |
| AUDIO-VALID | WEBM/OGG/WAV/MP3/M4A có âm thanh thật |

Mật khẩu hợp lệ dùng khi test: bắt đầu bằng chữ hoa, dài 8–20 ký tự, có số và ký tự đặc biệt; ví dụ `Test@1234`.

## 3. Smoke test và khởi động

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | SMK-001 | Chạy MySQL rồi `npm start` trong `BE` | Backend khởi động một lần, kết nối DB thành công, không lỗi migration |
| [ ] | SMK-002 | Mở `GET http://localhost:5000/health` | HTTP 200, `database=reachable` |
| [ ] | SMK-003 | Chạy `npm run dev` trong `FE` | Vite chạy tại cổng cấu hình, không lỗi biên dịch |
| [ ] | SMK-004 | Mở `http://localhost:5173/` | Trang giới thiệu hiển thị, không có lỗi console nghiêm trọng |
| [ ] | SMK-005 | Refresh trực tiếp một route sâu như `/engineer/tasks` | SPA vẫn mở đúng route nếu đã đăng nhập |
| [ ] | SMK-006 | Chạy `npm test` trong `BE` | Toàn bộ test tự động đạt |
| [ ] | SMK-007 | Chạy `npm run lint` trong `FE` | Không có lỗi ESLint |
| [ ] | SMK-008 | Chạy `npm run build` trong `FE` | Build production thành công |
| [ ] | SMK-009 | Chạy backend lần hai khi cổng 5000 đang dùng | Báo rõ `EADDRINUSE`, không crash khó hiểu |
| [ ] | SMK-010 | Tắt MySQL rồi gọi `/health` | HTTP 503, `database=unreachable` |

## 4. Guest, đăng ký và xác thực

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | AUTH-001 | Xem trang chủ bằng Guest | Xem được giới thiệu, tính năng, quy trình, liên hệ, đăng nhập/đăng ký |
| [ ] | AUTH-002 | Chuyển Sáng/Tối trên trang Guest | Nền/chữ đổi đúng, lựa chọn được lưu khi refresh |
| [ ] | AUTH-003 | Chuyển Việt/Anh | Nội dung đổi ngôn ngữ, lựa chọn được lưu |
| [ ] | AUTH-004 | Gửi form liên hệ hợp lệ | Hiện thành công và tạo contact request |
| [ ] | AUTH-005 | Gửi form liên hệ thiếu/sai email | Không gửi, hiển thị lỗi validation |
| [ ] | AUTH-006 | Mở Điều khoản và Chính sách bảo mật | Hai trang hiển thị đúng và quay lại được |
| [ ] | AUTH-007 | Đăng ký Engineer với dữ liệu hợp lệ | Tạo tài khoản engineer, không thể tự chọn manager/admin |
| [ ] | AUTH-008 | Username ngắn, có dấu cách hoặc ký tự đặc biệt | Bị từ chối đúng thông báo |
| [ ] | AUTH-009 | Họ tên chứa số | Bị từ chối |
| [ ] | AUTH-010 | Số điện thoại không đủ 10 số hoặc sai đầu số | Bị từ chối |
| [ ] | AUTH-011 | Mật khẩu yếu hoặc xác nhận không khớp | Bị từ chối |
| [ ] | AUTH-012 | Đăng ký trùng username/email | Không tạo user trùng |
| [ ] | AUTH-013 | Xác minh email bằng token hợp lệ | Tài khoản được kích hoạt/xác minh |
| [ ] | AUTH-014 | Xác minh bằng token sai hoặc hết hạn | Không kích hoạt, thông báo phù hợp |
| [ ] | AUTH-015 | Gửi lại email xác minh | Email/outbox được tạo; không lộ việc email không tồn tại |
| [ ] | AUTH-016 | Đăng nhập bằng username + mật khẩu đúng | Nhận token và chuyển đúng dashboard theo role |
| [ ] | AUTH-017 | Đăng nhập bằng email + mật khẩu đúng nếu UI hỗ trợ | Vào đúng dashboard |
| [ ] | AUTH-018 | Đăng nhập sai mật khẩu | HTTP 401/Thông báo chung, không lộ mật khẩu |
| [ ] | AUTH-019 | Đăng nhập tài khoản pending/inactive/suspended | Bị chặn và có hướng dẫn liên hệ/xác minh |
| [ ] | AUTH-020 | Quên mật khẩu với email hợp lệ | Gửi email/outbox đặt lại mật khẩu |
| [ ] | AUTH-021 | Reset bằng token hợp lệ và mật khẩu mạnh | Đổi mật khẩu; token không dùng lại được |
| [ ] | AUTH-022 | Reset bằng token sai/hết hạn/mật khẩu yếu | Bị từ chối, mật khẩu cũ còn hiệu lực |
| [ ] | AUTH-023 | Đăng xuất | Xóa token/user local, quay về trang Guest |
| [ ] | AUTH-024 | Dùng token hết hạn gọi API | HTTP 403 và yêu cầu đăng nhập lại |

## 5. Phân quyền và route 403

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ACL-001 | Engineer mở `/admin/dashboard` | Hiện trang 403, không lộ dữ liệu Admin |
| [ ] | ACL-002 | Engineer mở `/manager/dashboard` | Hiện trang 403 |
| [ ] | ACL-003 | Manager mở `/admin/users` | Hiện trang 403 |
| [ ] | ACL-004 | Admin mở route Engineer/Manager không thuộc role | Chuyển 403 hoặc dashboard Admin theo thiết kế |
| [ ] | ACL-005 | Guest mở route `/admin/*`, `/manager/*`, `/engineer/*` | Chuyển về đăng nhập |
| [ ] | ACL-006 | Gọi API Admin bằng token Engineer | HTTP 403 |
| [ ] | ACL-007 | Gọi API không token | HTTP 401 |
| [ ] | ACL-008 | Sửa role trong localStorage nhưng giữ token cũ | Backend vẫn chặn theo role trong DB |
| [ ] | ACL-009 | Admin đổi Engineer thành Manager khi người đó đang đăng nhập | Request tiếp theo dùng quyền mới từ DB |
| [ ] | ACL-010 | Admin khóa/xóa mềm user đang đăng nhập | API tiếp theo bị chặn; Socket.IO không tiếp tục thao tác trái phép |

## 6. Chức năng dùng chung

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | COM-001 | Thu/mở sidebar ở desktop | Bố cục không tràn, trạng thái điều hướng rõ |
| [ ] | COM-002 | Mở web ở 1440 px, 1024 px, 768 px và 375 px | Không có thanh cuộn ngang ngoài ý muốn; chức năng chính dùng được |
| [ ] | COM-003 | Chế độ Sáng | Nền sáng, chữ tối, nút/badge đủ tương phản |
| [ ] | COM-004 | Chế độ Tối | Nền tối, chữ sáng, bảng/modal/input đọc rõ |
| [ ] | COM-005 | Chuyển ngôn ngữ ở trang đã đăng nhập | Menu, nhãn và thông báo chính đổi Việt/Anh |
| [ ] | COM-006 | DataTable tìm kiếm | Lọc đúng dữ liệu, ô tìm kiếm không vỡ icon/chữ |
| [ ] | COM-007 | DataTable sắp xếp từng cột | Tăng/giảm đúng, không mất filter |
| [ ] | COM-008 | Đổi số dòng và chuyển trang | Đúng số bản ghi, không vượt trang |
| [ ] | COM-009 | Trang không có dữ liệu | Hiện empty state, không hiện bảng lỗi |
| [ ] | COM-010 | Mất mạng rồi có mạng lại | Hiện trạng thái offline/online, không treo giao diện |
| [ ] | COM-011 | Cài PWA từ build production | Service worker đăng ký; shell mở được theo thiết kế |
| [ ] | COM-012 | Mở nhiều tab cùng tài khoản | Token/theme/language nhất quán sau refresh |

## 7. Quản lý tài khoản và cài đặt

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ACC-001 | Mở Quản lý tài khoản | Hiện đúng thông tin user hiện tại |
| [ ] | ACC-002 | User sửa số điện thoại, bio, avatar URL | Lưu được trường cho phép |
| [ ] | ACC-003 | User cố sửa role, username, mã nhân viên qua request | Backend bỏ qua/từ chối trường không được phép |
| [ ] | ACC-004 | Nhập avatar không phải URL HTTP(S) | Bị từ chối |
| [ ] | ACC-005 | Đổi mật khẩu với mật khẩu hiện tại đúng | Đổi thành công, mật khẩu cũ không đăng nhập được |
| [ ] | ACC-006 | Đổi mật khẩu với mật khẩu hiện tại sai | Không đổi |
| [ ] | ACC-007 | Mật khẩu mới yếu/xác nhận sai | Bị từ chối |
| [ ] | ACC-008 | Bật/tắt tự động chuyển giọng nói thành văn bản | Lưu lựa chọn sau refresh |
| [ ] | ACC-009 | Đăng xuất từ nút trong sidebar/profile | Token bị xóa và không Back vào trang bảo vệ được |

## 8. Admin

### 8.1 Dashboard và vận hành

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-001 | Mở `/admin/dashboard` | KPI dự án/công việc/báo cáo đúng DB |
| [ ] | ADM-002 | Dùng từng nút thao tác nhanh | Điều hướng đúng, chữ/nền đủ tương phản ở hai theme |
| [ ] | ADM-003 | Kiểm tra danh sách cần xử lý | Số liệu pending/overdue khớp trang chi tiết |
| [ ] | ADM-004 | Refresh dashboard | Không nhân đôi request/dữ liệu hoặc mất layout |

### 8.2 Dự án

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-005 | Tạo dự án đầy đủ Manager/ngày | Tạo thành công và xuất hiện trong bảng |
| [ ] | ADM-006 | End date trước start date | Bị từ chối |
| [ ] | ADM-007 | Sửa tên, địa điểm, Manager, trạng thái | Dữ liệu cập nhật đúng |
| [ ] | ADM-008 | Xóa dự án không có ràng buộc cản trở | Xóa theo nghiệp vụ, bảng cập nhật |
| [ ] | ADM-009 | Mở project workspace | Hiện task, engineer, report, incident, document đúng dự án |

### 8.3 Giao việc và quản lý giao việc

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-010 | Chuyển giữa view Giao việc/Quản lý giao việc | Hai view tách rõ, không mất dữ liệu form |
| [ ] | ADM-011 | Giao Task A cho Engineer A | Task xuất hiện phía Admin và Engineer |
| [ ] | ADM-012 | Thêm checklist khi giao việc | Tạo đủ item, không quá 30 item |
| [ ] | ADM-013 | Giao việc với priority critical/urgent | Badge và sắp xếp đúng |
| [ ] | ADM-014 | Sửa engineer, deadline, priority, status với lý do | Cập nhật và ghi timeline/audit |
| [ ] | ADM-015 | Sửa task mà không nhập lý do | Bị từ chối |

### 8.4 Báo cáo, yêu cầu và sự cố

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-016 | Xem tất cả báo cáo | DataTable, filter và file minh chứng hoạt động |
| [ ] | ADM-017 | Duyệt báo cáo | Trạng thái thành approved, Engineer nhận thông báo |
| [ ] | ADM-018 | Từ chối báo cáo với lý do ≥5 ký tự | Trạng thái rejected, lưu lý do |
| [ ] | ADM-019 | Từ chối không có lý do | Bị từ chối |
| [ ] | ADM-020 | Duyệt/từ chối yêu cầu gia hạn | Cập nhật trạng thái; duyệt gia hạn cập nhật deadline phù hợp |
| [ ] | ADM-021 | Duyệt/từ chối báo vướng mắc | Lưu quyết định và thông báo Engineer |
| [ ] | ADM-022 | Chuyển sự cố open → investigating → resolved | Lưu người phụ trách, hạn, nguyên nhân và biện pháp |
| [ ] | ADM-023 | Upload minh chứng xử lý sự cố | Ảnh hợp lệ hiển thị; file giả bị chặn |

### 8.5 Người dùng và xóa mềm

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-024 | Tìm kiếm/lọc danh sách user | Kết quả đúng, không mất phân trang |
| [ ] | ADM-025 | Sửa hồ sơ công ty của user | Sửa fullname/email/phone/mã NV/phòng ban/chức danh |
| [ ] | ADM-026 | Cố sửa username qua hồ sơ Admin | Username không đổi |
| [ ] | ADM-027 | Nâng Engineer → Manager | Role đổi; menu/quyền mới có hiệu lực |
| [ ] | ADM-028 | Hạ Manager → Engineer | Role đổi; không còn quyền Manager |
| [ ] | ADM-029 | Cố đổi user thành Admin qua API role | Bị từ chối |
| [ ] | ADM-030 | Active/inactive/suspend user | Trạng thái và quyền đăng nhập thay đổi đúng |
| [ ] | ADM-031 | Admin xóa mềm user trực tiếp với lý do | User biến khỏi danh sách active nhưng dữ liệu lịch sử còn trong DB |
| [ ] | ADM-032 | Mở danh sách user đã xóa | Hiện người xóa, lý do, thời gian và thông tin user |
| [ ] | ADM-033 | Khôi phục user đã xóa | User trở lại đúng trạng thái cho phép |
| [ ] | ADM-034 | Duyệt yêu cầu xóa từ Manager | User bị xóa mềm và request approved |
| [ ] | ADM-035 | Từ chối yêu cầu xóa với lý do | User không bị xóa, Manager nhận trạng thái rejected |

### 8.6 Công việc Manager, tài liệu, log, liên hệ và AWS

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ADM-036 | Giao nhiệm vụ cấp quản lý | Manager nhận assignment và notification |
| [ ] | ADM-037 | Hủy assignment với lý do | Trạng thái cancelled và lưu lý do |
| [ ] | ADM-038 | Upload tài liệu dự án | Tạo version 1; file hợp lệ tải được |
| [ ] | ADM-039 | Upload cùng project + title lần hai | Tạo version tiếp theo trong cùng group |
| [ ] | ADM-040 | Download tài liệu | Đúng tên/nội dung; kiểm tra quyền trước khi tải |
| [ ] | ADM-041 | Xem nhật ký hoạt động | Hiện actor, action, mô tả, thời gian đúng |
| [ ] | ADM-042 | Admin xem chat monitor | Tin nhắn hai bên đối xứng theo người gửi; Admin không gửi thay user |
| [ ] | ADM-043 | Khóa/mở khóa chat | Participant không gửi khi khóa; gửi lại được khi mở |
| [ ] | ADM-044 | Xem yêu cầu liên hệ và đổi trạng thái | Trạng thái cập nhật đúng |
| [ ] | ADM-045 | Mở `/admin/aws` | Hiện S3, SES, Transcribe, SQS, RDS, Cognito, CloudFront |
| [ ] | ADM-046 | Chạy AWS health bằng Admin | Chỉ service đã cấu hình mới được check; không trả secret |

## 9. Manager

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | MGR-001 | Mở dashboard Manager A | Chỉ KPI/dự án/task thuộc Manager A |
| [ ] | MGR-002 | Mở Analytics | KPI đúng dữ liệu, biểu đồ/bảng không tràn |
| [ ] | MGR-003 | Xuất CSV hoặc in/lưu PDF KPI | File có dữ liệu và tiêu đề đúng |
| [ ] | MGR-004 | Xem Project A | Truy cập được workspace đầy đủ |
| [ ] | MGR-005 | Manager B mở Project A bằng URL/API | HTTP 403/404, không lộ dữ liệu |
| [ ] | MGR-006 | Manager A sửa Project A | Sửa trường cho phép, không tự đổi manager_id |
| [ ] | MGR-007 | Manager cố xóa dự án | Bị chặn vì chỉ Admin được xóa |
| [ ] | MGR-008 | Tạo task trong Project A | Thành công |
| [ ] | MGR-009 | Tạo task trong project của Manager B | Bị chặn |
| [ ] | MGR-010 | Giao task cho engineer không hợp lệ/đã xóa | Bị chặn |
| [ ] | MGR-011 | Sửa task có lý do | Timeline/audit lưu đúng |
| [ ] | MGR-012 | Xem lịch deadline | Hiện đúng ngày, task overdue và điều hướng chi tiết |
| [ ] | MGR-013 | Duyệt report thuộc Project A | Thành công và gửi notification |
| [ ] | MGR-014 | Duyệt report project khác | Bị chặn |
| [ ] | MGR-015 | Duyệt task request thuộc Project A | Thành công |
| [ ] | MGR-016 | Quản lý sự cố Project A | Cập nhật được trạng thái và minh chứng |
| [ ] | MGR-017 | Xem/upload tài liệu Project A | Thành công và version đúng |
| [ ] | MGR-018 | Tải tài liệu project không thuộc quyền | Bị chặn |
| [ ] | MGR-019 | Xem assignment Admin giao | Chỉ thấy assignment của chính mình |
| [ ] | MGR-020 | Accepted → in_progress → completed, 0–100% | Cập nhật hợp lệ |
| [ ] | MGR-021 | Nhập progress <0 hoặc >100 | Bị từ chối |
| [ ] | MGR-022 | Gửi yêu cầu xóa Engineer kèm lý do ≥10 ký tự | Tạo pending request và Admin nhận notification |
| [ ] | MGR-023 | Gửi yêu cầu xóa Admin/Manager không thuộc phạm vi | Bị chặn |
| [ ] | MGR-024 | Manager cố xóa user trực tiếp | HTTP 403 |

## 10. Engineer

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | ENG-001 | Mở dashboard Engineer A | Chỉ tổng quan task của chính Engineer A |
| [ ] | ENG-002 | Xem danh sách task | Không thấy task của Engineer B |
| [ ] | ENG-003 | Tìm/lọc task theo status/priority | Kết quả đúng |
| [ ] | ENG-004 | Mở chi tiết Task A | Hiện dự án, deadline, checklist, timeline, báo cáo |
| [ ] | ENG-005 | Mở chi tiết task không được giao bằng URL/API | Bị chặn |
| [ ] | ENG-006 | Gửi cập nhật hiện trường 2–1000 ký tự | Timeline có bản ghi mới |
| [ ] | ENG-007 | Gửi cập nhật rỗng/quá dài | Bị từ chối |
| [ ] | ENG-008 | Tick/untick checklist Task A | Tiến độ checklist cập nhật đúng |
| [ ] | ENG-009 | Sửa checklist task người khác | Bị chặn |
| [ ] | ENG-010 | Soạn báo cáo rồi đóng/mở lại | Bản nháp localStorage được khôi phục |
| [ ] | ENG-011 | Gửi báo cáo manual hợp lệ | Tạo report pending và cập nhật status task theo lựa chọn |
| [ ] | ENG-012 | Gửi report rỗng hoặc >5000 ký tự | Bị từ chối |
| [ ] | ENG-013 | Đính kèm JPG/PNG/WEBP/PDF ≤10 MB | Upload và xem/tải được |
| [ ] | ENG-014 | Đính kèm file sai chữ ký hoặc >10 MB | Bị chặn |
| [ ] | ENG-015 | Ghi giọng nói bằng Web Speech API | Transcript điền vào form nếu trình duyệt hỗ trợ |
| [ ] | ENG-016 | Ghi audio và gửi Amazon Transcribe | Nhận job/transcript hoặc fallback rõ ràng |
| [ ] | ENG-017 | Từ chối quyền microphone | Không crash; báo hướng dẫn cấp quyền |
| [ ] | ENG-018 | Xem lịch công việc | Task xuất hiện đúng deadline và điều hướng |
| [ ] | ENG-019 | Gửi yêu cầu extension có ngày mới + lý do | Tạo pending request |
| [ ] | ENG-020 | Extension thiếu ngày mới | Bị từ chối |
| [ ] | ENG-021 | Gửi blocker với lý do | Tạo pending request, không bắt buộc ngày |
| [ ] | ENG-022 | Báo sự cố với severity và tọa độ hợp lệ | Tạo incident thuộc project/task được giao |
| [ ] | ENG-023 | Dùng nút lấy vị trí | Lấy latitude/longitude hoặc báo lỗi quyền rõ ràng |
| [ ] | ENG-024 | Engineer cố cập nhật trạng thái sự cố | Bị chặn |
| [ ] | ENG-025 | Xem/tải tài liệu dự án có task được giao | Thành công |
| [ ] | ENG-026 | Upload tài liệu bằng Engineer | Bị chặn |

## 11. Chat và thông báo realtime

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | CHAT-001 | Mở danh sách contact | Không hiện chính mình/user đã xóa; role phù hợp |
| [ ] | CHAT-002 | Tạo conversation mới | Không tạo bản trùng cho cùng cặp user |
| [ ] | CHAT-003 | Gửi text | Hai bên nhận realtime và thứ tự đúng |
| [ ] | CHAT-004 | Gửi text rỗng hoặc >4000 ký tự | Bị từ chối |
| [ ] | CHAT-005 | Gửi quá nhanh >10 message/10 giây | Bị rate limit ở Socket |
| [ ] | CHAT-006 | Ghi và gửi voice ≤10 MB | Player phát được ở hai bên |
| [ ] | CHAT-007 | Gửi ảnh chat | Preview và mở ảnh được |
| [ ] | CHAT-008 | Gửi PDF/DOCX/XLSX/TXT/CSV ≤15 MB | File card đúng tên/dung lượng và tải được |
| [ ] | CHAT-009 | Gửi file giả MIME hoặc >15 MB | Bị chặn và file tạm được dọn |
| [ ] | CHAT-010 | User ngoài conversation gọi messages/upload | HTTP 403/404 |
| [ ] | CHAT-011 | Admin monitor tất cả conversation | Xem được, không gửi message với tư cách participant |
| [ ] | CHAT-012 | Admin khóa chat | Hai participant thấy banner và không gửi/upload được |
| [ ] | CHAT-013 | Mất/reconnect Socket.IO | Tự nối lại; reload messages không nhân đôi |
| [ ] | NOTI-001 | Có task/report/request mới | Chuông nhận notification realtime |
| [ ] | NOTI-002 | Đánh dấu một thông báo đã đọc | Badge giảm đúng |
| [ ] | NOTI-003 | Đánh dấu tất cả đã đọc | Badge về 0 và lưu sau refresh |
| [ ] | NOTI-004 | Nhấn notification có link | Điều hướng đúng trang được phép |

## 12. File và dữ liệu

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | FILE-001 | Upload tên file có ký tự đặc biệt/path | Tên được làm sạch, không path traversal |
| [ ] | FILE-002 | Upload file 0 byte | Bị chặn |
| [ ] | FILE-003 | Đổi đuôi EXE thành JPG/PDF | Chữ ký nội dung không hợp lệ nên bị chặn |
| [ ] | FILE-004 | Download document có quyền | Header tên file và MIME đúng |
| [ ] | FILE-005 | Download document không quyền | Không trả file |
| [ ] | FILE-006 | Xóa mềm user từng tạo dữ liệu | Project/task/report/chat lịch sử vẫn truy vấn hợp lệ theo nghiệp vụ |
| [ ] | FILE-007 | Nhập chuỗi Unicode tiếng Việt | Lưu/đọc không lỗi font hoặc mojibake trên giao diện |
| [ ] | FILE-008 | Nhập chuỗi rất dài ở các form | UI và backend chặn theo giới hạn, không làm vỡ bảng |

## 13. AWS sau khi triển khai stack

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | AWS-001 | Deploy CloudFormation với parameter hợp lệ | Stack `CREATE_COMPLETE`/`UPDATE_COMPLETE` |
| [ ] | AWS-002 | Kiểm tra S3 Frontend | Bucket private, Block Public Access và versioning bật |
| [ ] | AWS-003 | Mở CloudFront URL | Trang chủ tải HTTPS; refresh route sâu không 403 từ S3 |
| [ ] | AWS-004 | Gọi `/api/*` qua CloudFront | Đến ALB/backend, không bị cache |
| [ ] | AWS-005 | Kết nối Socket.IO qua CloudFront | Chat/notification realtime hoạt động |
| [ ] | AWS-006 | Kiểm tra ALB target | Target healthy qua `/health` |
| [ ] | AWS-007 | Kiểm tra EC2 | Nằm private subnet, không public IP, quản trị được bằng SSM |
| [ ] | AWS-008 | Kiểm tra RDS | Không public, chỉ App SG vào 3306, kết nối TLS thành công |
| [ ] | AWS-009 | Khởi động từ database rỗng | Migration tạo đủ bảng và bootstrap Admin một lần |
| [ ] | AWS-010 | Upload document/chat media | Object nằm trong S3 Data private và mã hóa SSE-S3 |
| [ ] | AWS-011 | Mở media chat | Dùng presigned URL; URL hết hạn không truy cập được |
| [ ] | AWS-012 | Gửi audio Transcribe | API trả 202 và tạo row `transcription_jobs` + SQS message |
| [ ] | AWS-013 | Worker xử lý message | Job completed, transcript lưu RDS, input tạm bị xóa |
| [ ] | AWS-014 | Cố tình làm job lỗi 3 lần | Message đi vào DLQ |
| [ ] | AWS-015 | Tắt worker rồi gửi audio | API vẫn trả job queued; xử lý tiếp khi worker chạy lại |
| [ ] | AWS-016 | Gửi email xác minh/reset | SES gửi được; From address đã verify |
| [ ] | AWS-017 | Kiểm tra Cognito ID token | Backend xác minh và map đúng local user bằng email/cognito_sub |
| [ ] | AWS-018 | Cognito token sai pool/client/chữ ký | HTTP 403 |
| [ ] | AWS-019 | Gửi request SQLi/XSS phổ biến | WAF/backend chặn hoặc trung hòa; request hợp lệ không bị chặn nhầm |
| [ ] | AWS-020 | Upload multipart hợp lệ qua WAF | Không bị Common Rule chặn vì body lớn; backend vẫn áp dụng limit |
| [ ] | AWS-021 | Xem Secrets Manager | RDS/JWT/Admin secret tồn tại; không xuất hiện trong frontend/log cloud-init |
| [ ] | AWS-022 | Xóa stack thử nghiệm | RDS snapshot và bucket/secret Retain đúng thiết kế |

## 14. Bảo mật và phi chức năng

| Đã test | ID | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| [ ] | SEC-001 | Kiểm tra response header | Có Helmet headers, không có `X-Powered-By` |
| [ ] | SEC-002 | Gọi API từ origin không nằm trong CORS_ORIGINS | Bị chặn CORS |
| [ ] | SEC-003 | Thử brute-force đăng nhập | Rate limiter chặn sau ngưỡng |
| [ ] | SEC-004 | Gửi đăng ký/liên hệ quá ngưỡng | Nhận HTTP 429 |
| [ ] | SEC-005 | Gửi JSON >100 KB | Request bị từ chối |
| [ ] | SEC-006 | Thử SQL injection trong search/form | Không thay đổi query ngoài ý muốn, không lộ stack trace |
| [ ] | SEC-007 | Nhập `<script>` vào text | Không thực thi script khi hiển thị |
| [ ] | SEC-008 | Kiểm tra password trong DB | Chỉ lưu bcrypt hash, không plaintext |
| [ ] | SEC-009 | Kiểm tra API `/api/aws/status` | Không trả access key, secret, DB password hoặc JWT secret |
| [ ] | SEC-010 | Dùng user ID âm/chuỗi ở route | HTTP 400/404, không lỗi 500 |
| [ ] | SEC-011 | Hai user cập nhật cùng bản ghi | Không tạo dữ liệu hỏng hoặc response mâu thuẫn nghiêm trọng |
| [ ] | PERF-001 | DataTable với ít nhất 1.000 bản ghi test | Tìm/sort/page phản hồi chấp nhận được, UI không treo |
| [ ] | PERF-002 | Mở dashboard trên mạng chậm | Có loading state, không nhấp nháy lỗi |
| [ ] | PERF-003 | Upload gần giới hạn | Có trạng thái đang tải và xử lý lỗi timeout rõ ràng |
| [ ] | A11Y-001 | Dùng Tab/Shift+Tab qua form và modal | Focus đi đúng thứ tự; nút chính dùng được bằng bàn phím |
| [ ] | A11Y-002 | Kiểm tra label/alt/contrast | Input có nhãn, ảnh có alt, chữ đủ tương phản hai theme |
| [ ] | COMP-001 | Test Chrome và Edge bản mới | Luồng chính hoạt động tương đương |
| [ ] | COMP-002 | Trình duyệt không hỗ trợ SpeechRecognition | Hiện fallback/ghi âm AWS, không crash |

## 15. Ghi nhận lỗi

| Bug ID | Test ID | Môi trường | Mô tả | Mức độ | Ảnh/log | Trạng thái |
|---|---|---|---|---|---|---|
| BUG-001 |  | Local/AWS |  | Critical/High/Medium/Low |  | Open |

## 16. Tiêu chí chấp nhận trước khi nộp

- [ ] 100% test Critical/High đạt.
- [ ] Không còn lỗi 401/403 sai vai trò.
- [ ] Không còn lỗi console hoặc API 500 trong happy path.
- [ ] Backend test, frontend lint và frontend build đạt.
- [ ] Sơ đồ kiến trúc khớp với cấu hình triển khai.
- [ ] Nếu chưa deploy AWS thật, báo cáo ghi rõ **Infrastructure as Code đã sẵn sàng, chưa provision để tránh chi phí**.
