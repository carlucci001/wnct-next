# Fix: GitHub Copilot "image media type is required" Error

## Error Message
```
Sorry, your request failed. Please try again.
Reason: Request Failed: 400 {"error":{"message":"image media type is required","code":"invalid_request_body"}}
```

## What Happened
GitHub Copilot tried to process an image file and failed because it doesn't properly support images yet.

## Quick Fix (Choose One)

### Solution 1: Close Image Files
1. In VS Code, close all tabs showing images (.png, .jpg, .svg, etc.)
2. Make sure you have a **code file** open (.tsx, .ts, .js)
3. Click the Copilot chat icon again
4. Try your request

### Solution 2: Clear Copilot Cache
1. Press `Ctrl+Shift+P` (Command Palette)
2. Type: `Copilot: Reset`
3. Select "GitHub Copilot: Reset Chat"
4. Try your request again

### Solution 3: Restart VS Code
1. Close VS Code completely (File → Exit)
2. Reopen VS Code
3. Open your project: `c:\dev\wnc-times-clone`
4. Open a code file (like `components/Header.tsx`)
5. Try Copilot chat again

### Solution 4: Disable Image Context
1. Press `Ctrl+,` (Settings)
2. Search: "copilot image"
3. Uncheck "Include images in context"
4. Restart VS Code

## How to Prevent This Error

**Don't do this:**
- Ask Copilot about images
- Have image files selected when using chat
- Use screenshots in Copilot chat

**Do this instead:**
- Keep code files (.ts, .tsx, .js) active
- If you need to discuss images, describe them in text
- Close Preview panes before using Copilot

## If Error Persists

### Check Copilot Status
1. Look at bottom-right of VS Code
2. Should say "Copilot: Ready"
3. If it says "Copilot: Error", click it to see details

### Reinstall Copilot Extension
1. Go to Extensions (Ctrl+Shift+X)
2. Search: "GitHub Copilot"
3. Click "Uninstall"
4. Click "Install"
5. Reload VS Code

### Check Your Subscription
1. Go to: https://github.com/settings/copilot
2. Make sure your subscription is active
3. Check if "Copilot Chat" is enabled

## Alternative: Use Continue.dev Extension

If Copilot keeps failing, try Continue.dev (free, uses Gemini):

1. **Install Continue Extension**
   - Extensions → Search "Continue"
   - Install "Continue - Codegen, Chat, and more"

2. **Configure with Gemini**
   - Open Continue sidebar (Ctrl+L)
   - Click gear icon → Settings
   - Add provider: "Google Gemini"
   - Paste your Gemini API key from `.env`

3. **Use Continue Instead**
   - Press Ctrl+L to open chat
   - Ask your coding questions
   - No more image errors!

## Understanding the Error

### Why This Happens
GitHub Copilot recently added experimental image support, but it's buggy. The error occurs when:
- VS Code thinks you want to attach an image
- Copilot doesn't know how to handle it
- The request fails with a 400 error

### Why It's Confusing
- You probably didn't even TRY to send an image
- VS Code might auto-select images in your workspace
- Copilot's image detection is overly sensitive

### Microsoft's Response
This is a known bug. Microsoft is working on a fix, but it's not available yet.

## Workaround Workflow

**When using Copilot Chat:**

1. ✅ Open a CODE file first (e.g., `Header.tsx`)
2. ✅ Make sure cursor is in the code editor
3. ✅ Click Copilot chat icon
4. ✅ Type your question
5. ❌ Don't have image files open in other tabs
6. ❌ Don't paste screenshots
7. ❌ Don't select image files in file explorer

## Test If It's Fixed

Try this in Copilot chat:
```
"Add a console.log statement to the Header component"
```

**If it works:** Error is fixed!
**If it fails:** Try Solution 3 (Restart VS Code)

## Still Not Working?

If none of these solutions work:

### Option A: Use Terminal AI
Instead of Copilot chat, use inline suggestions:
1. Just start typing code
2. Copilot will suggest completions
3. Press Tab to accept

### Option B: Switch to Cursor
1. Download: https://cursor.sh
2. Install (it's like VS Code but better)
3. Configure with Gemini API key
4. Never see this error again

### Option C: Use Gemini API Directly
Create a file: `ask-gemini.js`
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function ask(question) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent(question);
  console.log(result.response.text());
}

ask("How do I add a button to my React component?");
```

Run: `node ask-gemini.js`

## Summary

**The error means:** Copilot is confused about images
**Quick fix:** Close image files, restart VS Code
**Long-term fix:** Switch to Cursor or Continue.dev
**Cost:** Free (Continue.dev) or $20/month (Cursor)

## Need More Help?

- **GitHub Copilot Support:** https://support.github.com/contact
- **Cursor Discord:** https://discord.gg/cursor
- **Continue.dev Docs:** https://continue.dev/docs

---

**Bottom Line:** This is a GitHub Copilot bug, not your fault. The fixes above should resolve it. If not, consider switching to Cursor (much more reliable).