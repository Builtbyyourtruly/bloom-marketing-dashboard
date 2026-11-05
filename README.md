<h1 align="center">🌸 Bloom</h1>

<p align="center">
  <i>A cute little marketing analytics dashboard for seeing what's growing, what's blooming and what needs a little water.</i>
  <br/>
  <sub>✧･ﾟ: *✧･ﾟ:* &nbsp; React · TypeScript · Recharts · Python &nbsp; *:･ﾟ✧*:･ﾟ✧</sub>
</p>

<br/>

Bloom turns campaign CSVs into friendly charts, tidy comparisons and shareable reports. Drop in your exports from Meta, Google Ads, TikTok or your email tool, and Bloom (the little flower in the corner) will tell you how your garden is growing. 🌿

<p align="center">🌿 ─────────── ୨୧ ─────────── 🌿</p>

<h3 align="center">✿ What it does ✿</h3>

- 👀 **The big numbers:** impressions, reach, clicks and engagement, on cards shaped like little seed packets
- 🎯 **Rates that matter:** click-through rate, conversion rate and ROI, plus cost per click and cost per conversion
- 🌤️ **Trends over time:** day-by-day (or week-by-week) charts you can save as PNGs
- 🌼 **Campaign comparisons:** a sortable table, head-to-head bars, side-by-side trends and a radar "vibe check"
- 🧮 **Calculators:** CTR, conversion rate and ROI calculators that compare your numbers with your own averages
- 🎁 **Downloadable reports:** a pretty HTML report (print it to PDF), a campaign summary CSV and a cleaned-up copy of your data
- 🧺 **CSV upload:** drag and drop one or many files; columns are detected automatically and Australian dates (dd/mm/yyyy) just work
- 📝 **Garden notes:** plain-English insights, like your star campaign and which one needs some love
- 🌙 **Light and dark mode**, keyboard friendly, and calm for anyone with reduced motion turned on

<br/>

<h3 align="center">⋆｡°✩ Getting started ✩°｡⋆</h3>

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the link it prints (usually http://localhost:5173). No data handy? Click **🌱 Plant sample seeds**.

To build a production version into `dist/`:

```bash
npm run build
```

<br/>

<h3 align="center">🌸 Your CSV 🌸</h3>

Bloom looks for these columns. Only one of Impressions, Clicks or Spend is required, but the more you include, the more Bloom can tell you.

| Column | Also recognised as |
|:---|:---|
| Campaign | Campaign name, Ad set name, Ad name |
| Channel | Platform, Network, Source, Medium |
| Date | Day, Reporting starts, Start date, Week |
| Impressions | Impr., Views |
| Reach | Unique reach, People reached |
| Clicks | Link clicks, All clicks, Taps |
| Engagement | Post engagement, Interactions, Reactions |
| Conversions | Results, Purchases, Leads, Sign ups |
| Spend | Amount spent (AUD), Cost |
| Revenue | Conversion value, Purchase value, Sales |

Money symbols, commas and shorthand like `3.2k` are all fine. "Total" rows are skipped automatically. There's a template to download in the app, and a full example in [`sample-data/campaigns.csv`](sample-data/campaigns.csv).

<br/>

<h3 align="center">🐍 The Python toolkit 🐍</h3>

`python/bloom_tools.py` is a little helper for preparing data outside the browser. It only uses the Python standard library, so there's nothing to install.

```bash
# make a fresh sample dataset
python python/bloom_tools.py sample sample-data/campaigns.csv

# merge messy ad-platform exports into one tidy CSV that Bloom loves
python python/bloom_tools.py clean meta-export.csv google-ads.csv -o clean.csv

# print a summary table, and optionally save it as Markdown
python python/bloom_tools.py summary clean.csv --markdown summary.md
```

Run the tests with:

```bash
pip install -r requirements-dev.txt
pytest
```

<br/>

<h3 align="center">✧ Putting it online ✧</h3>

This repo includes a GitHub Actions workflow that publishes Bloom to GitHub Pages every time you push to `main`.

1. Push the repo to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push a change (or run the workflow from the **Actions** tab). Your dashboard will appear at `https://<your-username>.github.io/<repo-name>/`.

<br/>

<h3 align="center">♡ Your data stays with you</h3>

Everything happens in your browser. Files are never uploaded anywhere, and your data is only saved in your own browser's local storage so it's still there next time. **Clear garden** wipes it.

<br/>

<h3 align="center">🌿 How it's organised</h3>

```
src/
  App.tsx              the app shell, tabs and data handling
  components/          Overview, Compare, Calculators, Reports, Bloom the mascot and friends
  lib/                 CSV parsing, metric maths, insights and report building
python/bloom_tools.py  the Python data toolkit
tests/                 tests for the toolkit
sample-data/           an example dataset
```

<p align="center">
  <br/>
  <b>Built with curiosity, a little creativity and an unreasonable number of side quests.</b>
  <br/><br/>
  ✿ &nbsp; ♡ &nbsp; ⋆｡°✩ &nbsp; ୨୧ &nbsp; ✧ &nbsp; ♡ &nbsp; ✿
</p>
