# SPIDEY Tracker — Backend

Yeh backend Instagram/Twitter post ke views/likes ko **24/7** track karta hai —
chahe browser band ho ya laptop band ho, Render server pe yeh background me
chalta rehta hai aur MySQL database me data save karta rehta hai.

## Kaise kaam karta hai

1. Frontend (`spidey-tracker_13_24.html`) ek baar token + post ID backend ko
   bhejta hai (`/api/start`).
2. Backend andar hi `setInterval` se har 60 second (configurable) platform
   API ko khud call karta hai — isko "poller" bolte hain.
3. Har snapshot MySQL me save hota hai.
4. Frontend jab bhi khula ho, `/api/data/:trackerId` se latest data poll
   karke graph update karta hai. Browser band ho jaye to bhi backend chalta
   rehta hai aur data collect karta rehta hai — jab dobara browser kholo,
   saara history wahi mil jayega.

## Step 1 — MySQL database banao (freesqldatabase.com)

1. https://www.freesqldatabase.com/account/ pe login karo.
2. "Create Database" karo (ya jo already hai use karo).
3. Yeh 5 details note karo:
   - Database host (e.g. `sqlXXX.freesqldatabase.com`)
   - Database name
   - Database username
   - Database password
   - Port (usually `3306`)

## Step 2 — Is code ko GitHub pe daalo

Naya repo banao (e.g. `spidey-tracker-backend`), phir:

```bash
cd spidey-backend
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/<your-username>/spidey-tracker-backend.git
git push -u origin main
```

`.env` file kabhi commit nahi hogi (`.gitignore` me already excluded hai) —
secrets GitHub pe nahi jaate, yeh sahi hai.

## Step 3 — Render pe deploy karo

1. https://dashboard.render.com pe jao (already login hai).
2. **New +** → **Web Service**.
3. Apna GitHub repo (`spidey-tracker-backend`) connect karo.
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. **Environment Variables** (yahi pe `.env` ki values daalo):

   | Key | Value |
   |---|---|
   | `DB_HOST` | freesqldatabase se mila host |
   | `DB_PORT` | `3306` |
   | `DB_USER` | freesqldatabase username |
   | `DB_PASSWORD` | freesqldatabase password |
   | `DB_NAME` | freesqldatabase database name |
   | `POLL_INTERVAL_SECONDS` | `60` |
   | `APP_SECRET` | koi bhi random string, e.g. `mySecret123` |

6. **Create Web Service** click karo. Render build karke deploy kar dega.
7. Deploy hone ke baad ek URL milega jaise:
   `https://spidey-tracker-backend.onrender.com`

## Step 4 — UptimeRobot se 24/7 zinda rakho

Render free tier 15 min inactivity ke baad sleep ho jaata hai. Isko rokne ke
liye:

1. UptimeRobot me **Add New Monitor**.
2. Monitor Type: **HTTP(s)**.
3. URL: `https://spidey-tracker-backend.onrender.com/` (root route, jo
   `{status: "ok"}` return karta hai).
4. Monitoring Interval: **5 minutes**.
5. Save karo.

Ab UptimeRobot har 5 min me server ko ping karega, jisse woh sote nahi
(sleep) aur poller continuously chalta rehta hai.

## Step 5 — Frontend ko backend se connect karo

`spidey-tracker_13_24.html` me ek chhota change chahiye hoga — token/postId
seedha Instagram/Twitter ko bhejne ke jagah, ab backend ko bhejega:

- Tracking start: `POST https://spidey-tracker-backend.onrender.com/api/start`
  body: `{ "platform": "instagram", "token": "...", "postId": "...", "secret": "mySecret123" }`
- Data poll: `GET https://spidey-tracker-backend.onrender.com/api/data/<trackerId>`

Iska updated frontend code chahiye to bata dena, woh bhi bana dunga.

## API Reference

| Method | Route | Kaam |
|---|---|---|
| GET | `/` | Health check (UptimeRobot ke liye) |
| POST | `/api/start` | Naya tracker shuru karo |
| POST | `/api/stop` | Tracker roko |
| GET | `/api/data/:trackerId` | Saved snapshots history |
| GET | `/api/trackers` | Sab trackers ki list |

## Local testing (optional)

```bash
cp .env.example .env
# .env me apni MySQL details daal do
npm install
npm start
```
