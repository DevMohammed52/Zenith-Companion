# Zenith Companion Suite

A live dashboard for IdleMMO that provides real-time market analytics, profit calculations, and combat/dungeon tracking.

## Key Features
- **Live Market Scraper:** Automatically fetches the latest item prices from the IdleMMO API.
- **Alchemy Profitability:** Calculates net profit, daily profit, and ROI for all alchemy recipes.
- **Combat & Dungeon Analytics:** Tracks gold-per-hour and expected value (EV) for enemies and dungeons.
- **World Boss Schedule:** Predictive timers and spawn locations for world bosses.
- **Fully Responsive:** Optimized for both desktop and mobile devices.

## How it Works
The project uses **GitHub Actions** to run a background scraper every 4 hours. This scraper updates the price data in the repository, which triggers a **Vercel** redeploy, ensuring the dashboard always shows fresh market information.

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DevMohammed52/Zenith-Companion.git
   cd Zenith-Companion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file and add your IdleMMO API Key:
   ```env
   IDLEMMO_API_KEY=your_key_here
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

## Tech Stack
- **Frontend:** Next.js, React, TypeScript
- **Styling:** Custom CSS (Royal Theme)
- **Icons:** Lucide React
- **Hosting:** Vercel
- **Automation:** GitHub Actions
