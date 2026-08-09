# Render Deployment Guide - Recruitment Email Automation System

This guide explains how to deploy your **Recruitment Email Automation System** to [Render](https://render.com) for free in just a few simple steps.

---

## 🛠️ Step-by-Step Deployment Instructions

### Method 1: Render Web Service (Recommended & Easiest)

#### 1. Push Your Code to GitHub
Make sure your project repository is pushed to a GitHub or GitLab repository:
```bash
git init
git add .
git commit -m "Initial commit - Recruitment Email Automation System"
git remote add origin https://github.com/YOUR_USERNAME/recruitment-email-automation.git
git push -u origin main
```

---

#### 2. Create a Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> Select **Web Service**.
3. Connect your GitHub repository (`recruitment-email-automation`).
4. Configure the Web Service settings:
   - **Name:** `recruitment-email-automation`
   - **Language / Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

---

#### 3. Set Environment Variables on Render
Scroll down to **Environment Variables** on the Render setup page and add the following keys:

| Key | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode & static asset hosting |
| `JWT_SECRET` | *(Random 32-char secret)* | Secret key for JWT auth tokens |
| `DB_TYPE` | `sqlite` | Database engine (`sqlite` or `mysql`) |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP Server Host |
| `SMTP_PORT` | `587` | SMTP Port |
| `SMTP_SECURE` | `false` | STARTTLS (587) |
| `SENDER_EMAIL` | `your_email@gmail.com` | Sender email address |
| `SMTP_USER` | `your_email@gmail.com` | SMTP Login Username |
| `SMTP_PASS` | *(Your Gmail App Password)* | 16-character Gmail App Password |
| `COMPANY_NAME` | `TechVision Global Inc.` | Default company name |

---

#### 4. Deploy!
Click **Create Web Service**. Render will automatically:
1. Run `npm run build` (install backend & frontend dependencies, build Vite production bundle).
2. Run `npm start` (initialize database & seed default HR admin `admin@hr.com` / `admin123`).
3. Issue an SSL certificate and provide your live application URL (e.g. `https://recruitment-email-automation.onrender.com`).

---

### Method 2: Render Blueprint (`render.yaml`)

1. Connect your repository to Render using **New +** -> **Blueprint**.
2. Select your repository. Render will automatically detect [`render.yaml`](file:///C:/Users/selva/.gemini/antigravity/scratch/recruitment-email-automation/render.yaml).
3. Set your `SMTP_PASS` value and click **Apply**.
