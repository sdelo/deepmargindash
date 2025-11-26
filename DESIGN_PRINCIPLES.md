# DeepBook Margin Dashboard - Design Principles

## Core Philosophy
Build interfaces that are immediately understandable, credible, and actionable. Every element should serve a clear purpose. Users should know what the product does, who it's for, and why they should trust it within seconds.

---

## 1. Immediate Clarity & Hero Content
**The Problem**: Users need to understand what they're looking at immediately.

**The Solution**:
- **Strong Hero Section**: Get users to "get something" from the page right away
- **Clear Value Proposition**: Say the product name upfront and explain what it does
- **No Jargon**: The user should know what things mean without needing a crypto dictionary
- **Defined Audience**: Make the target audience clear right away
- **Progressive Information Architecture**:
  - Headers → Sub-titles → Visual info → Detailed explanations
  - As users scroll, they gradually learn more about the product
  - Most important things at the top with quick filters if needed

**Application**:
- Landing page: Immediately show what DeepBook Margin is and its core benefit
- Dashboard: Show critical metrics (Your Position, APY, Balance) before complex data
- Any page: User should understand the page's purpose within 5 seconds

---

## 2. Credibility & Trust
**The Problem**: Users need to know if this is legitimate and if it works.

**The Solution**:
- **Social Proof**: Show credibility signals (TVL, users, backed by trusted entities)
- **Transparency**: Explain how things work (e.g., "Where yield comes from: Paid by borrowers")
- **Risk Context**: Use tooltips to explain ambiguous metrics
  - "Utilization Rate: 90%" → Add color coding (green/yellow/red) and tooltip explaining the tradeoff
- **Clear Messaging**: People will only read subheadlines if intrigued by the main headline

**Application**:
- Don't just show numbers, interpret them
- Use health bars for critical metrics
- Always provide context for technical terms

---

## 3. Action-Oriented Design
**The Problem**: Users need to know what to do and why they should do it.

**The Solution**:
- **One CTA Per Section**: Avoid overwhelming users with too many actions
- **Primary Actions Prominent**: Deposit, Withdraw, Trade should stand out
- **Feedback on Actions**: Show projected outcomes ("Deposit 1,000 USDC → Earn ~0.2 USDC/day")
- **Say How You Can Help**: Don't ask for money immediately, show value first
- **Try Before Buy**: Let people explore the product before committing

**Application**:
- Make clickable elements obvious (don't hide interactive elements)
- Show user's current position relative to the system
- Provide immediate calculation feedback on inputs

---

## 4. Visual Design Standards

### Typography
- **Hierarchy Is Critical**: APY should be huge, labels should be subtle
- **Readability**: Clean, scannable text that guides the eye

### Color Palette
- **Semantic Colors**: 
  - Green = Safe/Good Yield/Success
  - Red = Danger/High Risk/Alert
  - Neutral tones for data
- **NO PURPLE GRADIENTS**: Avoid AI-default aesthetics and massive shadows
- **Subtle Backgrounds**: Let content be the focus

### Icons & Graphics
- **NO GENERIC AI SLOP ICONS**: Use distinctive, custom, or high-quality icon sets
- **Consistent Icon System**: Icons should be consistent across all pages, not a mix of styles
- **Purpose-Driven**: Every icon should have clear meaning

### Spacing & Layout
- **Don't Scroll-Jack**: Let users control their scrolling
- **Whitespace**: Keep it simple and plain
- **Little Punch Points**: As users scroll, reveal information through clean visual moments
- **No Density Overload**: Prefer clean layouts over cramming information

---

## 5. Interaction Patterns

### Hover States
- **Consistent Hovers**: All interactive elements should have the same hover treatment
- **Contextual Information**: Hovers should provide helpful context, not just visual feedback

### Progressive Disclosure
- **Start Simple**: Show core information first
- **Details On-Demand**: Hide complex details (Interest Rate Parameters, Contract IDs) behind "Details" or "Advanced" toggles
- **Smooth Transitions**: Make revealing information feel natural

### Feedback
- **Immediate Response**: Inputs should calculate and show results immediately
- **Loading States**: Always show what's happening during async operations
- **Error Handling**: Clear, actionable error messages

---

## 6. Content Strategy

### Writing Guidelines
- **Be Direct**: Say what things are, don't be clever or vague
- **Explain Technical Terms**: Don't assume crypto knowledge
- **Focus Benefits**: Lead with what users get, not how it works technically
- **Short Paragraphs**: Break up text for scannability

### Information Architecture
- **Context Over Data**: The dashboard is part of an ecosystem (DeepBook)
- **Show Relationships**: Connect the "Pool" to the "Trade" to show how assets are used
- **User-Centric Flow**: Organize around user goals, not system architecture

---

## Implementation Checklist

### For Every Page:
- [ ] User understands the page purpose in 5 seconds
- [ ] Primary action is obvious
- [ ] Technical terms are explained (tooltips, labels)
- [ ] Icons are distinctive and consistent
- [ ] No purple gradients or AI-default styling
- [ ] Color is used semantically (green/red have meaning)
- [ ] Interactive elements are obviously clickable
- [ ] One clear CTA per section
- [ ] Hover states are consistent

### For Data Display:
- [ ] Most important metrics shown first
- [ ] Numbers are interpreted (health bars, color coding)
- [ ] Projections/outcomes are shown for actions
- [ ] User's position/state is always visible
- [ ] Complex data is behind toggles/progressive disclosure

### For Content:
- [ ] No jargon without explanation
- [ ] Social proof and credibility signals present
- [ ] Clear target audience
- [ ] Benefits before features
- [ ] Subheadlines that intrigue and inform

