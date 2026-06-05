# NEXUS - Business Intelligence Control Room

> Real-time Business Intelligence Dashboard with Telegram Bot Integration

![NEXUS Dashboard](https://nexus-project1.vercel.app)

## Live Demo
**[nexus-project1.vercel.app](https://nexus-project1.vercel.app)**

---

## What is NEXUS?

NEXUS is a real-time Business Intelligence dashboard that provides live insights into client revenue, industry distribution, conversion funnels, and user engagement. It integrates a Telegram bot for remote data management, n8n for workflow automation, and Excel/Google Sheets as the data backend.

---

## Features

- **Real-Time Dashboard** — Live metrics: Total Revenue, Active Clients, Avg Deal Size, Top Client
- **Revenue Trend Chart** — Cumulative revenue visualization across all clients
- **Industry Distribution** — Donut chart showing revenue by sector
- **Conversion Funnel** — Visual funnel from Leads to Won deals
- **User Engagement** — 24-hour activity chart
- **Performance KPIs** — Conversion, Retention, Engagement, Satisfaction metrics
- **Client Insights Table** — Full client list with sortable data
- **Telegram Bot** — Manage data remotely via Telegram commands
- **n8n Automation** — Automated workflows for data updates and Gmail notifications
- **Excel/Sheets Backend** — No traditional database required

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React + Vite | Frontend Framework |
| TanStack Router | Client-side Routing |
| Tailwind CSS | Styling |
| Recharts | Charts & Visualizations |
| n8n | Backend Workflow Automation |
| Telegram Bot | Remote Management Interface |
| Excel / Google Sheets | Data Storage |
| Vercel | Hosting & Deployment |

---

## How It Works

1. Data is stored in **Google Sheets / Excel** (Client, Amount Paid, Industry, Gmail)
2. React frontend fetches and displays data as real-time charts and tables
3. **Telegram bot** accepts commands to view/update client data
4. **n8n workflows** process commands, update sheets, and send Gmail notifications
5. Dashboard reflects all changes in real time

---

## Telegram Bot Commands

| Command | Action |
|---------|--------|
| `give me all client details` | Returns full client list |
| `change [client] amount to [value]` | Updates client revenue |
| `send gmail to [client] about due amount` | Sends email notification |
| `add new client [details]` | Adds new client record |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/praneethbangari06-hash/nexus-project1.git

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Deployment

Deployed on **Vercel** with automatic deployments from GitHub main branch.

---

## Author

**Praneeth Bangari** — Built with Lovable + Antigravity AI tools

---

## License

MIT License
