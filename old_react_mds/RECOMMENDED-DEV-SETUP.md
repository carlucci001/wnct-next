# Recommended Development Setup for Visual AI Workflow

## The Problem with AI Studio

AI Studio is **great for simple projects**, but struggles with:
- React projects with many dependencies
- Large TypeScript codebases
- Real-time preview rendering in browser

**Your project** (~40 files, React 19, TypeScript, Vite) hits all these limitations.

---

## Best Alternative: Cursor IDE

### What is Cursor?

Cursor is a **VS Code fork** built specifically for AI-assisted development. It gives you the **exact workflow you want**:

1. **Chat with AI** → Request changes
2. **AI edits code** → See changes in real-time
3. **Live preview** → localhost:3000 auto-refreshes
4. **Iterate** → Continue refining via chat

### Why Cursor is Perfect for Your Workflow

✅ **Visual feedback** - Split screen: code + browser preview
✅ **AI chat interface** - Just like AI Studio
✅ **Multi-file editing** - AI can edit multiple files at once
✅ **Fast** - Native performance, no browser limitations
✅ **Gemini integration** - Use your own API key
✅ **Git integration** - Commit directly from IDE

### Setup Instructions

#### 1. Download Cursor
- **Website:** https://cursor.sh
- **Free tier:** 50 AI requests/month
- **Pro tier:** $20/month unlimited

#### 2. Install Cursor
```bash
# Download installer for Windows
# Install like any application
```

#### 3. Open Your Project
```bash
# In Cursor: File → Open Folder
# Navigate to: c:\dev\wnc-times-clone
```

#### 4. Configure Gemini API
```
1. Cursor Settings (Ctrl+,)
2. Search: "AI Provider"
3. Add Gemini API key from your .env file
4. Select model: gemini-1.5-pro or gemini-2.0-flash
```

#### 5. Start Development Server
```bash
# In Cursor terminal (Ctrl+`)
npm run dev
```

#### 6. Open Preview
```
1. Open browser to: http://localhost:3000
2. Split screen: Cursor (left) + Browser (right)
3. Changes auto-refresh via Vite HMR
```

#### 7. Start Using AI Chat
```
Press: Ctrl+K (quick edit)
Or: Ctrl+L (chat sidebar)

Example requests:
- "Make the breaking news ticker scroll faster"
- "Add a dark mode toggle to the header"
- "Change the admin sidebar background to light blue"
```

---

## Free Alternative: Continue.dev

If you don't want to pay for Cursor, use **Continue.dev** extension in VS Code.

### Setup Instructions

#### 1. Install VS Code Extensions
```
1. Open VS Code
2. Install "Continue" extension
3. Install "Live Server" extension (optional)
```

#### 2. Configure Continue with Gemini
```
1. Open Continue settings (gear icon in Continue sidebar)
2. Add provider: Google Gemini
3. Paste your API key from .env
4. Select model: gemini-1.5-pro
```

#### 3. Development Workflow
```bash
# Terminal 1: Start dev server
npm run dev

# Browser: Open localhost:3000

# VS Code: Use Continue chat (Ctrl+L)
"Move the weather widget to the right"

# Browser auto-refreshes with changes
```

**Cost:** FREE (uses your Gemini API key - ~$0.01 per request)

---

## Comparison Table

| Feature | AI Studio | Cursor | Continue.dev | VS Code Copilot |
|---------|-----------|--------|--------------|-----------------|
| **Visual Preview** | ✅ Built-in | ✅ Via browser | ✅ Via browser | ✅ Via browser |
| **AI Chat** | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Multi-file Editing** | ✅ | ✅ | ✅ | ✅ |
| **Performance** | ❌ Slow for React | ✅ Fast | ✅ Fast | ✅ Fast |
| **Cost** | Free | $20/month | Free | $10/month |
| **AI Provider** | Google | Multiple | Gemini/Claude/GPT | OpenAI |
| **Git Integration** | ❌ Limited | ✅ Full | ✅ Full | ✅ Full |
| **Local File Access** | ❌ Clones repo | ✅ Direct | ✅ Direct | ✅ Direct |

---

## Your Ideal Workflow

### Morning Setup
```bash
# 1. Open Cursor
cursor c:\dev\wnc-times-clone

# 2. Start dev server
npm run dev

# 3. Open browser
# Navigate to: http://localhost:3000

# 4. Arrange windows
# Left: Cursor (50% width)
# Right: Browser (50% width)
```

### Making Changes
```
You: "Add a search icon to the header navigation"

Cursor AI:
- Opens components/Header.tsx
- Adds import for Search icon
- Adds search button to navigation
- Shows you the diff

You: "Make it bigger and gold colored"

Cursor AI:
- Updates className
- Adds text-brand-gold
- Increases icon size

Browser: Auto-refreshes, shows changes instantly
```

### Committing Changes
```bash
# In Cursor terminal
git add .
git commit -m "Add search icon to header"
git push origin dev
```

---

## Why This is Better Than AI Studio

### AI Studio Limitations:
1. **Slow** - Compiles code in browser (heavy)
2. **Limited preview** - iframe restrictions
3. **No direct file access** - Must clone repo
4. **Browser memory limits** - Can crash on large projects
5. **Network dependent** - Slow uploads/downloads

### Cursor/Continue Advantages:
1. **Fast** - Native Node.js, no browser overhead
2. **Full control** - Direct file system access
3. **Better debugging** - Chrome DevTools, console.log works
4. **Larger context** - Can analyze entire codebase
5. **Git integration** - Commit/push directly
6. **Extensions** - Use any VS Code extension

---

## Installation Steps (Quick Start)

### Option 1: Cursor (Recommended)

```bash
# 1. Download
https://cursor.sh

# 2. Install application

# 3. Open project
cursor c:\dev\wnc-times-clone

# 4. Configure Gemini
Settings → AI → Add API Key

# 5. Start coding
npm run dev
Ctrl+L (open chat)
```

### Option 2: Continue.dev (Free)

```bash
# 1. Open VS Code
code c:\dev\wnc-times-clone

# 2. Install Continue extension
Ctrl+Shift+X → Search "Continue" → Install

# 3. Configure
Continue Settings → Add Gemini provider

# 4. Start coding
npm run dev
Ctrl+L (open chat)
```

---

## Example Session with Cursor

```
Session Goal: Redesign admin dashboard sidebar

1. You: "Show me the admin sidebar code"
   → Cursor opens pages/AdminDashboard.tsx

2. You: "Add icons to each menu item"
   → Cursor adds import and updates JSX

3. You: "Make the active tab background blue"
   → Cursor updates className

4. Browser auto-refreshes → You see changes

5. You: "Actually make it purple"
   → Cursor updates color

6. Browser refreshes → Perfect!

7. Cursor: "git add . && git commit -m 'Update sidebar styling'"
   → Changes committed
```

---

## Troubleshooting

### Issue: Cursor not showing AI responses
**Solution:** Check API key in Settings → AI → Models

### Issue: Browser not auto-refreshing
**Solution:** Make sure Vite dev server is running (`npm run dev`)

### Issue: Changes not appearing
**Solution:** Hard refresh browser (Ctrl+Shift+R)

### Issue: Cursor feels slow
**Solution:** Close other applications, restart Cursor

---

## Cost Analysis

### AI Studio
- **Cost:** Free
- **Performance:** Poor for your project
- **Frustration:** High (spinning, crashes)

### Cursor Pro
- **Cost:** $20/month
- **Performance:** Excellent
- **Time saved:** ~10 hours/month
- **Value:** $2/hour (worth it!)

### Continue.dev
- **Cost:** Free + Gemini API (~$5/month)
- **Performance:** Excellent
- **Best for:** Budget-conscious developers

### Recommendation
Start with **Continue.dev** (free) to test the workflow. If you love it, upgrade to **Cursor** for better AI features.

---

## Next Steps

1. **Install Cursor or Continue.dev** (30 minutes)
2. **Configure Gemini API** (5 minutes)
3. **Test with simple request** (10 minutes)
4. **Build muscle memory** (1 week)
5. **Never go back to AI Studio** (forever 😄)

---

## Support & Resources

### Cursor
- **Docs:** https://cursor.sh/docs
- **Discord:** https://discord.gg/cursor
- **YouTube:** Search "Cursor IDE tutorial"

### Continue.dev
- **Docs:** https://continue.dev/docs
- **GitHub:** https://github.com/continuedev/continue
- **Discord:** https://discord.gg/continue

### Your Project
- **Local dev:** http://localhost:3000
- **Admin panel:** http://localhost:3000/#/admin
- **Repository:** https://github.com/carlucci001/gwnct-core

---

**Bottom Line:** Cursor (or Continue.dev) gives you the **exact AI Studio workflow** you want, but **100x faster** and with **better AI capabilities**. You'll never look back.