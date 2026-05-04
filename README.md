# Ledger — Household Budget Tracker

A polished, real-time budget tracking web app for individuals and couples. Two
users can collaborate on a shared **household** budget while keeping their own
**personal** workspace separate. Every change is attributed: you can see who
added an expense, who last edited it, and when.

Built with **React + Vite**, **Tailwind CSS**, **Firebase Auth**, **Firestore**,
**Recharts**, and **Framer Motion**.

---

## Features

- 🔐 **Email/password auth** with protected routes
- 👤 **Personal + Joint workspaces** — switch with a click
- 🤝 **Invite a partner by email** — they accept on next sign-in
- 💸 **Expense tracking** with category, paid-by, notes, and full audit trail
  (createdBy / updatedBy / timestamps)
- 📊 **Dashboard** — income, spent, remaining, savings, weekly bars, monthly
  trend line, category pie
- 📅 **Monthly budget planning** with planned-vs-actual progress bars and
  over/under indicators
- 📜 **Activity log** — every action across every workspace, grouped by date
- 🔍 **Search + filters** on expenses (scope, category, month, paid-by)
- 📤 **CSV export** of filtered expenses
- 💡 **Insights** — "Dining is up this week", "Under budget for groceries", etc.
- 🌗 **Dark mode** with localStorage persistence
- 📱 **Fully responsive** — mobile drawer nav, mobile expense cards
- ✨ Smooth animations, soft shadows, custom display font (Fraunces)

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to <https://console.firebase.google.com> and create a new project.
2. In the project, click the **Web** icon (`</>`) to register a web app.
   Copy the `firebaseConfig` values shown.
3. In **Build → Authentication → Sign-in method**, enable
   **Email/Password**.
4. In **Build → Firestore Database**, click **Create database** and start in
   **production mode** (we'll deploy security rules below).

### 3. Configure environment variables

Copy `.env.example` to `.env` and paste your Firebase config:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Deploy the security rules

The included `firestore.rules` file enforces:

- Workspaces are readable only by their `memberIds`
- Only the **owner** can remove members or delete a workspace
- Members can leave a workspace (remove themselves only)
- A user can join only via a pending invite addressed to their email
- `createdByUserId` and `createdAt` are immutable after creation
- `updatedByUserId` must match the signed-in user on every write
- Activity logs are append-only
- Invites are readable to the inviter and the invited email; only the invitee
  can accept (pending → accepted)

Install the Firebase CLI once and deploy:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # pick your project, accept firestore.rules -> overwrite? no
firebase deploy --only firestore:rules
```

> ⚠️ Without these rules, your data is unprotected. Don't skip this step.

### 5. Run the dev server

```bash
npm run dev
```

Open <http://localhost:5173> and sign up.

### 6. Build for production

```bash
npm run build
npm run preview   # preview the built bundle locally
```

---

## Using the app

1. **Sign up** with your email and a display name. A personal workspace is
   created automatically.
2. **Add expenses** from the Expenses tab or the dashboard.
3. **Plan a monthly budget** in the Budget tab — set income and per-category
   amounts. The actual column updates in real time as you log expenses.
4. **Create a household** from the Household tab and invite your partner by
   email. They'll see the invite next time they sign in.
5. Use the **workspace switcher** in the sidebar to switch between Personal
   and your shared household. The dashboard, expenses, and budget all scope to
   the active workspace.

---

## Project structure

```
src/
  components/        Reusable UI (Modal, ConfirmModal, Sidebar, ExpenseForm, …)
  context/           AuthContext, WorkspaceContext, ThemeContext
  hooks/             useExpenses, useBudgets, useActivityLog, useInvites
  lib/firebase.js    Firebase initialization
  pages/             LoginPage, DashboardPage, ExpensesPage, BudgetPage,
                     HouseholdPage, ActivityPage
  services/          Firestore writes — expenses, budgets, workspaces, activity
  utils/             categories, format, csv, insights
  App.jsx            Router
  main.jsx           App bootstrap (providers + Toaster)
firestore.rules      Security rules
```

---

## Firestore data model

```
users/{userId}
  email, displayName, createdAt

workspaces/{workspaceId}
  name, type ('personal' | 'joint'), ownerId, memberIds[], createdAt

  expenses/{expenseId}
    workspaceId, workspaceType, date, category, subcategory,
    amount, notes, paidByUserId, paidByName,
    createdByUserId, createdByName, createdAt,
    updatedByUserId, updatedByName, updatedAt

  budgets/{monthKey}              // doc id is "YYYY-MM"
    monthKey, income, categories: { [category]: amount },
    updatedByUserId, updatedByName, updatedAt

  activityLogs/{logId}
    action, userId, userName, detail?, expenseId?, createdAt

invites/{inviteId}
  householdId, householdName, invitedEmail (lowercase),
  invitedByUserId, invitedByName,
  status ('pending' | 'accepted' | 'rejected'), createdAt,
  acceptedAt?, acceptedByUserId?, rejectedAt?
```

---

## Deploying

### Vercel

1. Push this repo to GitHub.
2. Go to <https://vercel.com>, **Import Project**, pick the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output dir:
   `dist`.
4. Under **Environment Variables**, add every `VITE_FIREBASE_*` value from
   your `.env`.
5. Deploy. Vercel will give you a `*.vercel.app` URL.

### Netlify

1. Push to GitHub.
2. Go to <https://app.netlify.com>, **Add new site → Import existing project**.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Under **Site settings → Environment variables**, add the `VITE_FIREBASE_*`
   values.
5. Add a `_redirects` file in `public/` (or a `netlify.toml`) so client-side
   routing works:
   ```
   /*  /index.html  200
   ```
6. Deploy.

### Firebase Hosting (alternative)

```bash
firebase init hosting        # public dir: dist, single-page app: yes
npm run build
firebase deploy --only hosting
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and bundle for production into `dist/` |
| `npm run preview` | Preview the production bundle locally |

---

## Troubleshooting

- **"Missing Firebase config" warning on boot** — your `.env` is missing or
  the dev server needs a restart after editing it.
- **"Missing or insufficient permissions"** — your security rules aren't
  deployed yet. Run `firebase deploy --only firestore:rules`.
- **Invites don't show up for the partner** — the invitee's email must match
  exactly (case-insensitive). Check that they signed in with the same email
  you typed in the invite form.
- **Workspace switcher shows nothing** — sign out and back in. The personal
  workspace is created on first sign-in.

---

## License

MIT — do whatever you like.
