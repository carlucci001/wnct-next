# Future Enhancement Ideas for WNC Times

## 1. Notification System for Autopilot-Published Articles

**Context:** With autopilot mode enabled, articles can be auto-published even with "caution" or "review_recommended" fact-check status (as long as confidence >= threshold). During vacation mode, editors may want to be notified when such articles are published so they can review them later.

**Proposal:** Repurpose the existing notification icon in the header to serve multiple purposes:

### Notification Types:
1. **Autopilot Review Needed** - Articles published with caution flags during autopilot mode
2. **Fact-Check Warnings** - Articles that need manual review
3. **Comments Pending Moderation** - If community comments enabled
4. **System Alerts** - RSS feed failures, API errors, etc.

### Implementation Ideas:
- Badge on notification icon showing count
- Dropdown menu with notification list
- Filter by type (Review Needed, Comments, Alerts)
- Mark as read functionality
- Link directly to articles needing attention
- Email/SMS digest option (daily summary)

### Priority Levels:
- 🔴 **High**: Articles published with confidence 50-69% (autopilot override)
- 🟡 **Medium**: Articles with expansion ratio > 3.0
- 🟢 **Low**: General informational notifications

### Storage:
- Firestore collection: `notifications`
- Fields: `type`, `priority`, `articleId`, `message`, `createdAt`, `read`, `userId`
- Auto-expire after 30 days

### Benefits:
- Editors can truly "go on vacation" but still have visibility
- Catch potential issues post-publication
- Maintain quality without blocking automation
- Existing icon gets real functionality

**Status:** Not yet implemented (idea from user feedback during autopilot mode discussion)

---

## 2. Analytics Dashboard for Autopilot Performance

Track metrics to optimize confidence thresholds over time:
- Autopilot publish rate (% that auto-published)
- Average confidence scores (trend analysis)
- User edit rate (% of auto-published articles later edited)
- Fact-check status distribution
- Expansion ratio alerts

**Status:** Not yet implemented

---

## 3. A/B Testing Framework for AI Quality

Compare article quality metrics between:
- Gemini-only vs Perplexity+Gemini
- Different temperature settings
- Different confidence thresholds
- With/without web search

**Status:** Partial (metadata tracked, no UI dashboard)

---

## 4. Automated Content Calendar

- AI suggests optimal posting times based on analytics
- Automatic content diversification (ensure balanced categories)
- Holiday/event awareness (adjust content topics)
- Competitor content analysis

**Status:** Not yet implemented

---

## 5. Revenue Optimization

- A/B test ad placements
- Dynamic pricing for directory listings
- Newsletter subscription incentives
- Advertiser performance reports

**Status:** Basic revenue streams in place, optimization not implemented
