# Google Analytics Data API Setup Guide

## Overview
This guide will help you connect your Google Analytics 4 (GA4) property to your dashboard so you can see real visitor data without leaving your admin panel.

**Time Required:** 15-20 minutes (one-time setup)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** dropdown at the top
3. Click **"NEW PROJECT"**
4. Enter project name: `wnctimes-analytics`
5. Click **"CREATE"**
6. Wait for the project to be created (notification will appear)

---

## Step 2: Enable Google Analytics Data API

1. Make sure your new project is selected (top of screen)
2. Go to [APIs & Services](https://console.cloud.google.com/apis/library)
3. Search for: **"Google Analytics Data API"**
4. Click on **"Google Analytics Data API"**
5. Click **"ENABLE"** button
6. Wait for it to enable (takes a few seconds)

---

## Step 3: Create Service Account

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **"+ CREATE SERVICE ACCOUNT"**
3. Enter details:
   - **Service account name:** `analytics-reader`
   - **Service account ID:** (auto-filled, leave as is)
   - **Description:** `Reads Google Analytics data for dashboard`
4. Click **"CREATE AND CONTINUE"**
5. **Grant this service account access to project:**
   - Click "Select a role" dropdown
   - Type "Viewer" and select **"Viewer"**
   - Click **"CONTINUE"**
6. Skip "Grant users access" (click **"DONE"**)

---

## Step 4: Create Service Account Key (JSON)

1. You should now see your service account in the list
2. Click on the **email address** of your service account (looks like `analytics-reader@wnctimes-analytics.iam.gserviceaccount.com`)
3. Click **"KEYS"** tab at the top
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. **IMPORTANT:** A JSON file will download automatically - **SAVE THIS FILE SECURELY**
   - This file contains sensitive credentials
   - Never commit it to git or share publicly

---

## Step 5: Grant Service Account Access to Google Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Admin"** (gear icon, bottom left)
3. In the **Property** column, click **"Property Access Management"**
4. Click **"+"** button (top right) → **"Add users"**
5. Enter the service account email: `analytics-reader@wnctimes-analytics.iam.gserviceaccount.com`
   - (You can copy this from the JSON file you downloaded, it's the `client_email` field)
6. Select role: **"Viewer"**
7. Uncheck **"Notify new users by email"** (it's a service account, not a person)
8. Click **"Add"**

---

## Step 6: Get Your Property ID

1. Still in Google Analytics **Admin** section
2. Look at the **Property** column
3. Click **"Property Settings"**
4. You'll see **"PROPERTY ID"** at the top (looks like: `123456789`)
5. **Copy this number** - you'll need it for the next step

---

## Step 7: Upload Credentials to Your Project

### Option A: Environment Variables (Recommended for Production)

1. Open the JSON file you downloaded in Step 4
2. Copy the entire contents
3. In your project, create a file: `.env.local` (if it doesn't exist)
4. Add these lines:
   ```
   GA_PROPERTY_ID=123456789
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...paste entire JSON here..."}
   ```

### Option B: Direct File (Easier for Testing)

1. Save the JSON file to: `c:\dev\wnct-next\service-account-key.json`
2. Add to `.gitignore`: `service-account-key.json`
3. Add to `.env.local`:
   ```
   GA_PROPERTY_ID=123456789
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```

---

## Step 8: Test the Integration

After completing the setup:
1. Restart your dev server: `npm run dev`
2. Go to your admin dashboard
3. The Google Analytics widget should now show real data!

---

## Troubleshooting

**"Permission denied" error:**
- Make sure you completed Step 5 (granted service account access to GA)
- Wait 5-10 minutes for permissions to propagate

**"Property not found" error:**
- Double-check your Property ID in `.env.local`
- Make sure it's just the numbers, no quotes or extra characters

**"Could not load credentials" error:**
- Check that your JSON file path is correct
- Make sure the JSON is valid (no extra commas or syntax errors)

---

## Security Notes

✅ **DO:**
- Keep your JSON credentials file secure
- Add `service-account-key.json` to `.gitignore`
- Use environment variables for production
- Rotate keys periodically

❌ **DON'T:**
- Commit credentials to git
- Share credentials publicly
- Use same credentials across multiple projects
- Store credentials in client-side code

---

## What Data You'll See

Once set up, your dashboard will show:
- **Active Users Right Now** (realtime)
- **Today's Visitors** vs Yesterday
- **Total Pageviews** (last 7 days)
- **Top 5 Pages** this week
- **Traffic Sources** (Google, Direct, Social, etc.)
- **Bounce Rate** and **Avg. Session Duration**

All updated automatically every 5 minutes!
