# 🔑 AUTO GAMMA - WhatsApp API Setup Guide

## Complete Guide to Get Phone Number ID and Access Token

This guide will help you get the 2 credentials needed for WhatsApp to work:
1. **WHATSAPP_PHONE_NUMBER_ID** - The unique ID of your business phone
2. **WHATSAPP_ACCESS_TOKEN** - The API key to send messages

---

## PREREQUISITES CHECKLIST

Before starting, make sure you have:

- [ ] Facebook account (or create one at facebook.com)
- [ ] A business phone number (preferably a new number, not your personal WhatsApp)
- [ ] Access to that phone number (you'll need to verify it via SMS)
- [ ] Meta Business Manager account (or we'll create it)
- [ ] A Meta Developer account (or we'll create it)

---

# PART 1: CREATE META BUSINESS MANAGER ACCOUNT

## Step 1.1: Go to Meta Business Manager
1. Open browser and go to: https://business.facebook.com
2. You'll see the login page
3. Click **"Log In"** with your Facebook account
   - If you don't have Facebook account, click **"Create a Facebook account"** first

## Step 1.2: Create Business Account (if you don't have one)
1. Once logged in, you should see "Create a Business Account" button
2. Fill in these details:
   - **Business Name:** Your garage name (e.g., "Auto Gamma")
   - **Your Name:** Your full name
   - **Business Email:** Your business email
   - **Business Phone:** Your business phone number
   - **Country:** Select your country
3. Click **"Create Account"**
4. You'll get a confirmation - click the link in email if prompted

## Step 1.3: Complete Business Setup
1. You're now in Meta Business Manager dashboard
2. Save this URL: https://business.facebook.com (bookmark it)
3. In the bottom left, you should see your **Business Account Name**

---

# PART 2: CREATE META DEVELOPER APP

## Step 2.1: Go to Meta Developers
1. Open new browser tab
2. Go to: https://developers.facebook.com
3. Log in with same Facebook account

## Step 2.2: Create Developer App
1. Click **"My Apps"** in the top right corner
2. Click **"Create App"** button (big blue button)
3. You'll see a popup asking to select app type

## Step 2.3: Select App Type
1. Choose **"Business"** type
2. Click **"Next"**

## Step 2.4: Fill App Details
You'll see a form with these fields:

| Field | What to Enter |
|-------|---------------|
| **App Name** | "Auto Gamma WhatsApp" or "YourBusinessName WhatsApp" |
| **App Contact Email** | Your business email |
| **App Purpose** | Select "Build an app to integrate with existing services" |
| **Business Account** | Select your business account (from Part 1) |

5. Click **"Create App"**
6. Complete any security verification if asked

## Step 2.5: Save Your App ID
1. You're now in your app dashboard
2. Go to **"Settings"** → **"Basic"**
3. Copy your **"App ID"** (you'll need this later)
4. Copy your **"App Secret"** (keep this safe!)

---

# PART 3: ADD WHATSAPP PRODUCT TO YOUR APP

## Step 3.1: Add WhatsApp Product
1. In your app dashboard, look for **"Add Products"** or **"+"** button
2. Search for **"WhatsApp"**
3. Click **"Set Up"** next to WhatsApp
4. Click **"WhatsApp Business Platform"**

## Step 3.2: Complete WhatsApp Setup Wizard
You'll see a setup wizard with several steps:

### Step A: Business Account
1. Choose **"I have a business account"** (from Part 1)
2. Select your business account
3. Click **"Next"**

### Step B: Phone Number
1. You have two options:

**Option 1: If you already have WhatsApp Business number**
- Select **"I already own this phone number"**
- Enter your phone number (format: +91 9876543210 for India)
- Click **"Next"**

**Option 2: If you need a new number**
- Select **"I want a new phone number"**
- Enter details and wait for verification
- This takes 1-2 days

### Step C: Verify Phone Number
1. Meta will send you an SMS or call your number
2. Enter the **verification code** you received
3. Click **"Verify"**

## Step 3.3: See Your Phone Number ID
✅ **FIRST CREDENTIAL FOUND!**

After verification, you'll see:
- **Phone Number ID**: A long number like `120212121212121`
- **Business Account ID**: Another ID for your account

**🔴 IMPORTANT: Copy and save the Phone Number ID somewhere safe!**

---

# PART 4: GET YOUR ACCESS TOKEN

You need to create a **System User** to generate a permanent access token. Follow these steps:

## Step 4.1: Go to Meta Business Manager
1. Open browser tab with: https://business.facebook.com
2. Click **"Settings"** in the bottom left
3. In the left menu, click **"Users"** → **"System Users"**

## Step 4.2: Create System User
1. Click **"Add"** button (top right)
2. You'll see a form:

| Field | What to Enter |
|-------|---------------|
| **Name** | "WhatsApp Bot" or "Auto Gamma WhatsApp Bot" |
| **Role** | Select **"Admin"** from dropdown |

3. Click **"Create System User"**
4. The system user is now created

## Step 4.3: Add App to System User
1. Click on the newly created **"WhatsApp Bot"** user
2. Click **"Add Assets"** button
3. You'll see a list of apps
4. Find your app (created in Part 2) - "Auto Gamma WhatsApp"
5. Click checkbox to select it
6. Click **"Assign"**

## Step 4.4: Assign Permissions
1. After assigning, you'll see the app in the user's assets
2. Click on the app name
3. You'll see a list of permissions:
   - ✅ Check **`whatsapp_business_management`**
   - ✅ Check **`whatsapp_business_messaging`**
   - ✅ Check **`whatsapp_business_manage_events`**
4. Click **"Save"**

## Step 4.5: Generate Access Token
1. Go back to your system user page
2. You should see **"Generate New Token"** button
3. Click it
4. A popup appears:

| Field | What to Select |
|-------|-----------------|
| **Select an app** | Your app ("Auto Gamma WhatsApp") |
| **Token Expiration** | Select **"Never"** (for permanent token) |
| **Permissions** | Should already show the 3 permissions you checked |

5. Click **"Generate Token"**
6. You'll see a long token string

✅ **SECOND CREDENTIAL FOUND!**

**🔴 IMPORTANT: Copy this token immediately! It won't show again!**

The token looks like: `EAAD7VzH5Jo...` (very long string)

---

# PART 5: REGISTER YOUR PHONE NUMBER (OPTIONAL)

This step activates your phone number fully for the API.

## Step 5.1: Open Terminal (or Command Prompt)

### If you're on Windows:
1. Press **Windows Key + R**
2. Type `cmd` and press Enter
3. A black terminal window opens

### If you're on Mac:
1. Press **Command + Space**
2. Type `terminal` and press Enter
3. A terminal window opens

### If you're on Linux:
1. Press **Ctrl + Alt + T**
2. Terminal opens

## Step 5.2: Register the Phone Number

Copy-paste this command into terminal (replace the 3 values):

```bash
curl -X POST \
  'https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/register' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

**Now replace these 3 things:**

| What to Replace | Find It Here |
|-----------------|--------------|
| `YOUR_PHONE_NUMBER_ID` | From Part 3.3 (e.g., `120212121212121`) |
| `YOUR_ACCESS_TOKEN` | From Part 4.5 (the long token string) |
| `"pin": "123456"` | Keep this - it's just 6 digits |

**Example of what it should look like:**
```bash
curl -X POST \
  'https://graph.facebook.com/v21.0/120212121212121/register' \
  -H 'Authorization: Bearer EAAD7VzH5JoBAdlG8q1bXnzZAk7aBhw...' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

Press **Enter** and wait for response. You should see:
```
{"success":true}
```

If you see an error, don't worry - this is optional. Your API will still work without this.

---

# PART 6: VERIFY BOTH CREDENTIALS

Before giving to developer, verify you have both:

## Credential 1: Phone Number ID
- **Key Name:** `WHATSAPP_PHONE_NUMBER_ID`
- **Value:** Looks like: `120212121212121` (all numbers)
- **Where to find:** Part 3.3 or WhatsApp Manager → Settings

## Credential 2: Access Token
- **Key Name:** `WHATSAPP_ACCESS_TOKEN`
- **Value:** Looks like: `EAAD7VzH5Jo...` (long alphanumeric string)
- **Where to find:** Part 4.5

**Create this table and fill it in:**

| Credential | Your Value |
|-----------|-----------|
| WHATSAPP_PHONE_NUMBER_ID | _________________________ |
| WHATSAPP_ACCESS_TOKEN | _________________________ |

---

# PART 7: TEST YOUR CREDENTIALS (OPTIONAL)

To test if your credentials work, use this command:

```bash
curl -X GET \
  'https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID?access_token=YOUR_ACCESS_TOKEN'
```

Replace:
- `YOUR_PHONE_NUMBER_ID`: Your phone number ID
- `YOUR_ACCESS_TOKEN`: Your access token

If successful, you'll get back information about your phone number in JSON format.

---

# IMPORTANT NOTES FOR YOUR SETUP

⚠️ **Phone Number Rules:**
- The phone number must NOT be used on personal WhatsApp app
- It's exclusively for Business API
- If you try to use both, one will disconnect
- You can have this number for WhatsApp Business only

⚠️ **Token Security:**
- Never share your access token publicly
- Don't put it in code or email
- Always use it in "Secrets" only (which your developer will do)
- If leaked, go back to Part 4.5 and generate a new token

⚠️ **Phone Number Verification:**
- After verification, your number is activated
- You can start sending messages immediately (once templates are approved)
- Your number will show as a business account, not a personal chat

---

# SUMMARY OF WHAT YOU'LL GET

After completing all 7 parts, you'll have:

✅ **Meta Business Manager Account** (Part 1)
✅ **Meta Developer App** (Part 2)
✅ **WhatsApp Phone Number ID** (Part 3) - CREDENTIAL #1
✅ **System User Account** (Part 4)
✅ **Access Token** (Part 4) - CREDENTIAL #2
✅ **Registered Phone Number** (Part 5)

**Ready to provide to developer:**
1. `WHATSAPP_PHONE_NUMBER_ID` = Your phone number ID
2. `WHATSAPP_ACCESS_TOKEN` = Your access token

---

# WHAT HAPPENS NEXT

Once you have both credentials:

1. **Provide to Developer:** Give them the 2 credentials
2. **Developer Adds Them:** They add to your app as "Secrets"
3. **Messages Start:** When you change job status, customers get WhatsApp messages
4. **No More Setup:** After this, it works automatically!

---

# TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Can't log into Meta Business | Use same Facebook account. If no account, create at facebook.com first |
| Don't see WhatsApp option | Go to Part 3.1 again. Click "Add Products" and search "WhatsApp" |
| Phone number verification fails | Make sure number is entered correctly with country code (+91 for India) |
| Can't find System Users menu | Go to business.facebook.com → Settings (bottom left) → Users → System Users |
| Token shows as invalid | Make sure you copied the FULL token. If older than 90 days, generate new one |
| Phone registration returns error | This is optional. Skip Part 5 if it fails. API still works without it |

---

# CONTACT SUPPORT

If you get stuck:

1. **Meta WhatsApp Docs:** https://developers.facebook.com/docs/whatsapp
2. **Meta Business Support:** Go to business.facebook.com → Help Center
3. **Contact Your Developer:** Send them the error message you got

---

**You're ready! Once you complete all steps, provide the 2 credentials to your developer.** 🎉
