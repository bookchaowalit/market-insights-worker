# insights-worker

Cloudflare Worker (`solo-empire-insights`) ที่เสิร์ฟหน้า insights ที่สร้างอัตโนมัติจาก repo `bookchaowalit/market-insights-web`.

ที่มา: ย้ายมาจาก `solo-empire/infra/services/insights-worker/` (2026-10-11) พร้อมประวัติ git. Deploy ด้วย Wrangler ต้องได้รับอนุมัติจากเจ้าของเท่านั้น; state ที่ generate แล้วถูก ignore.

สถานะ ณ 2026-10-22: ยังไม่ live (workers.dev ตอบ 1042). `src/worker.ts` ห่อ `worker.js` ด้วย Sentry (ตั้ง secret `SENTRY_DSN`; ไม่ตั้ง = ปิด). รายละเอียดดู `PRODUCT.md`; ทดสอบ: `npm ci && npm test && npm run build`.
