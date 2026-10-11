# Migration lên Aiven

```powershell
cd D:\TalentHub\apps\api
# Sửa .env: DATABASE_URL + mật khẩu Aiven (Reveal password)

npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

Lần đầu trên DB trống dùng `migrate deploy` (áp dụng SQL trong `prisma/migrations/`).

Kiểm tra:

```powershell
npx prisma db execute --stdin <<< "SELECT 1"
# hoặc mở health: GET /api/v1/health
```
