# Chứng chỉ SSL Aiven (MySQL)

1. Vào Aiven Console → service MySQL → **Connection information**.
2. Mục **CA certificate** → **Download** (file `.pem`).
3. Lưu tại đây với tên: `aiven-ca.pem`

Không commit file `.pem` (đã gitignore).

Sau đó trong `apps/api/.env`:

```env
DATABASE_SSL_CA=./certs/aiven-ca.pem
DATABASE_URL=mysql://avnadmin:MAT_KHAU@mysql-91c72f0-talenthubdb-0e88.d.aivencloud.com:19052/defaultdb?sslaccept=strict
```

Nếu Prisma báo lỗi SSL trên Windows, thử tạm:

```env
DATABASE_URL=...?sslaccept=accept_invalid_certs
```

(hoặc đặt biến môi trường `NODE_EXTRA_CA_CERTS` trỏ tới đường dẫn tuyệt đối của `aiven-ca.pem`).
