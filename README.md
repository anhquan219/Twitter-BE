# Tài liệu

## File

### routes

- Chứa các file routes cho từng Collection (users, ...)
- Trong các file routes Collection chứa các routes cho Collection đó
- Cấu trúc:
  > usersRouter.post([Path], [Middlewares], [Controllers])

### middlewares

- Chứa các file middlewares cho từng Collection (users, ...)
- Sử dụng để Validate hoặc lọc dữ liệu đầu vào trước khi xử lý logic, service
- VD:
  > Check data nhận từ req.body có dữ liệu hay không để trả về thông báo lỗi trước khi xử lý đến DB (Kiểm tra email, password user đã gửi lên đủ chưa)

### controllers

- Chứa các file xử lý cho từng Collection (users, ...)
- Trong các file chứa các function xử lý login kết quả **"(req, res) => {}"**, gọi đến Services để truyền/nhận liệu trong DB để xử lý

### services

- Chứa file kết nối đến DB và các file xử lý dữ liệu của từng Collection trong DB (users, ...)
- Truy cập vào DB để truyền/nhận dữ liệu và trả về cho controllers xử lý tiếp

### models

- Chứa các cấu trúc schema để khởi tạo Obj của từng Collection (users, ...)

### constant

## Mô hình MVC

User ---> Controller ---> Model ---> View

- User: Thực hiện request
- Controller: Nhận request và xử lý logic
- Model: Xử lý DB
- View: Hiển thị lại cho User
