# Final Project FullStack

אפליקציית פול-סטאק: צד לקוח ב-React + Vite, צד שרת ב-Node/Express עם MongoDB. כולל אימות JWT + Refresh Tokens, פרופיל משתמש, פוסטים עם תמונות, תגובות ולייקים, בקשות, וחיפוש סמנטי מקומי (AI).

**מבנה הפרויקט**
- `client/` אפליקציית React (Vite + TypeScript).
- `server/` שרת Express (TypeScript) + MongoDB + Swagger.
- `server/uploads/` קבצי העלאה (תמונות פרופיל ופוסטים).

**דרישות**
- Node.js + npm.
- MongoDB.

**התקנה והרצה מקומית (Dev)**
1. התקנת תלויות שרת: `npm install` בתוך `server/`.
2. יצירת `.env` לשרת: להעתיק `server/.env.example` אל `server/.env` ולעדכן ערכים.
3. התקנת תלויות קליינט: `npm install` בתוך `client/`.
4. יצירת `.env` לקליינט לפי הצורך (ראו למטה).
5. הרצת שרת: `npm run dev` בתוך `server/`.
6. הרצת קליינט: `npm run dev` בתוך `client/`.

**משתני סביבה - שרת (`server/.env`)**
- `NODE_ENV` לדוגמה `development` או `production`.
- `PORT` פורט להרצת השרת.
- `DATABASE_URL` או `MONGO_URI` כתובת MongoDB.
- `JWT_SECRET` מפתח לחתימת access tokens.
- `REFRESH_TOKEN_SECRET` אופציונלי (אם לא מוגדר, משתמשים ב-`JWT_SECRET`).
- `JWT_EXPIRES_IN` אופציונלי (ברירת מחדל `1h`).
- `REFRESH_EXPIRES_IN` אופציונלי (ברירת מחדל `7d`).
- `CORS_ORIGIN` רשימת Origins מופרדת בפסיקים. אם ריק, כל ה-Origin יחסם.
- `PUBLIC_BASE_URL` אופציונלי.
- `SSL_KEY_PATH` ו-`SSL_CERT_PATH` אופציונלי (HTTPS בסביבת פיתוח בלבד).

**משתני סביבה - קליינט (`client/.env`)**
- `VITE_API_URL` כתובת ה-API (ללא סלאש בסוף). בדוגמה פרודקשן: `https://your-domain.example`.
- `VITE_GOOGLE_CLIENT_ID` אופציונלי להפעלת Google OAuth.

**תיעוד API**
- Swagger UI: `http://localhost:<PORT>/api-docs`
- Swagger JSON: `http://localhost:<PORT>/api-docs.json`

**סקריפטים שימושיים**
- שרת: `npm run dev`, `npm run build`, `npm start`, `npm test` בתוך `server/`.
- קליינט: `npm run dev`, `npm run build`, `npm run preview` בתוך `client/`.

**פרודקשן (PM2 + Nginx)**
1. בניית השרת: `npm install` ואז `npm run build` בתוך `server/`.
2. בניית הקליינט: `npm install` ואז `npm run build` בתוך `client/`.
3. הפעלת השרת עם PM2: `pm2 start server/ecosystem.config.cjs --env production`.
4. הפעלת Nginx: `sudo systemctl start nginx`.

**הפעלה/כיבוי בשרת ההרצה (קיצור)**
כיבוי:
- `pm2 stop server`
- `sudo systemctl stop nginx`

הפעלה:
- `cd ~/apps/Final-Project-FullStack/server`
- `pm2 start ecosystem.config.cjs --env production`
- `sudo systemctl start nginx`

בדיקה מהירה:
- `pm2 status`
- `curl -I http://node81.cs.colman.ac.il`
- `curl -I http://node81.cs.colman.ac.il/api-docs.json`

אם יש עדכוני קוד:
- `cd ~/apps/Final-Project-FullStack`
- `git pull`
- `cd server`
- `npm install`
- `npm run build`
- `cd ../client`
- `npm install`
- `npm run build`
- `pm2 restart server --update-env`
- `sudo systemctl reload nginx`

**הערות HTTPS**
HTTPS כרגע לא פעיל. כדי להפעיל HTTPS צריך שהמכללה תפתח גישה ל-Let’s Encrypt ואז להריץ `certbot`.
