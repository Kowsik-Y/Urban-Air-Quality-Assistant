# 🌬️ AirSense — Urban Air Quality & Winter Smog Assistant

**AirSense** is a full-stack, production-grade Next.js 14 application built with strict **TypeScript (`.ts`/`.tsx`)**, **Google Gemini 1.5 Flash SDK (`@google/generative-ai`)**, and **Continuous Ambient Air Quality Monitoring (CAAQMS / WAQI / CPCB)** live feeds. It is designed to empower Indian families, students, professionals, and senior citizens with real-time smog navigation, low-emission daily routines, indoor air purification hacks, and measurable community impact.

---

## 🌟 Key Capabilities & Innovation

### 1. 📡 Real-Time Live Environmental Sensor Integrations
- **Zero Fake / Hardcoded Data**: Streams live criteria pollutant measurements ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{O}_3$, $\text{CO}$) from official CPCB & international station monitors across Indian metros (Delhi NCR, Mumbai, Kolkata, Bengaluru, Chennai, Hyderabad, Pune, Lucknow, Patna, etc.).
- **CPCB / NAAQS Index Gauge**: Renders dynamic radial SVG gauges with Indian National Air Quality Index breakpoints (Good, Moderate, Unhealthy for Sensitive, Unhealthy, Very Unhealthy, Hazardous).

### 2. 🤖 Google Gemini 1.5 Flash Generative AI Engine
- **Targeted Household Personas**: Generates medically aligned strategies tailored to:
  - 👨‍👩‍👧 **Families with Young Children** (respiratory growth defense, school hours, outdoor play thresholds)
  - 💼 **Working Professionals** (traffic corridor exposure reduction, metro/feeder transit, office microclimates)
  - 🧓 **Senior Citizens** (cardiovascular protection, nocturnal inversion windows)
  - 🎓 **Students / Youth** (transit, sports timing)
  - 👤 **General Residents**
- **Quantified Direct Impact**: Every recommendation provides a clear, measurable outcome (e.g., *"Cuts inhaled particulate mass by ~40%"*, *"Lowers indoor VOCs by 30%"*).
- **Diurnal Smog Daily Planner**: Hour-by-hour strategies accounting for winter thermal inversion trapping (morning smog vs afternoon solar dispersion vs evening traffic peaks).

### 3. 💬 Real-Time Streaming AirSense Copilot
- Conversational chat powered by Gemini 1.5 Flash using Server-Sent Events (SSE) streaming via Next.js Route Handlers.
- Injects live city sensor concentrations and user profiles directly into the agent context for grounded, reliable guidance.

### 4. 🏠 Indoor Air Quality (IAQ) Defense Architecture
- Phytoremediation plant protocols (Snake plant, Money plant, Areca palm with NASA CAM mechanics).
- Clean room positive pressure techniques & True-HEPA run protocols.
- Cooking combustion mitigation (avoiding unventilated tadka/sautéing, eliminating indoor incense burning).

---

## 🛠️ Architecture & Tech Stack

```
Urban Air Quality Assistant/
├── app/
│   ├── api/
│   │   ├── aqi/route.ts         # Live CAAQMS / WAQI Feed Fetcher & Parser
│   │   ├── chat/route.ts        # Gemini 1.5 Flash Streaming Chatbot (SSE)
│   │   ├── cities/route.ts      # Indian Metros Directory
│   │   └── recommend/route.ts   # Structured GenAI Lifestyle & Impact Synthesizer
│   ├── error.tsx                # Next.js Error Boundary
│   ├── globals.css              # Custom Tailwind Glassmorphism & Animations
│   ├── layout.tsx               # Root App Router Layout & Typography
│   ├── loading.tsx              # Fallback Sensor Connection Loader
│   └── page.tsx                 # High-Performance Server Component Shell
├── components/
│   ├── AppShell.tsx             # Interactive State & Sensor Hub
│   ├── AQIDashboard.tsx         # Live Radial Gauge & CAAQMS Pollutant Grid
│   ├── ChatAssistant.tsx        # Streaming Copilot with Quick Inquiry Chips
│   ├── DailyPlanner.tsx         # Inversion-Calibrated Timeline Blocks
│   ├── Header.tsx               # City & Persona Selectors + Live Status
│   ├── IndoorGuide.tsx          # Engineering Hacks & Biological Defense
│   ├── LoadingState.tsx         # Skeleton Placeholders
│   ├── RecommendationCards.tsx  # Low-Emission Routines & Sustainable Alternatives
│   └── TabNav.tsx               # Smooth Horizontal Navigation
├── lib/
│   ├── aqi.ts                   # CPCB AQI Calculation & Pollutant Thresholds
│   ├── cities.ts                # Indian Urban Regions & States
│   ├── gemini.ts                # Google Generative AI Client Initializer
│   └── types.ts                 # Strict TypeScript Type Definitions
├── tsconfig.json                # Strict TypeScript Compiler Config
└── next.config.mjs              # Optimized Next.js Config
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-link>
cd "Urban Air Quality Assistant"
npm install
```

### 2. Configure Environment Variables
Create or edit `.env.local`:
```env
# Free API key from Google AI Studio (https://aistudio.google.com)
GEMINI_API_KEY=AIzaSy...

# Optional: WAQI Token (defaults to 'demo' token for major Indian cities)
# WAQI_TOKEN=your_token_here
```

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🏆 Hack2Skill Prompt Wars Virtual — Challenge 6 Checklist

- [x] **Strict TypeScript & React 18**: Complete type safety with zero type errors.
- [x] **Next.js 14 App Router**: Layouts, Error boundaries, Streaming Routes, and Server Components.
- [x] **Zero Hardcoded Data**: Real-time atmospheric metrics from live station feeds.
- [x] **GenAI-Powered Personalization**: Deeply contextualized routines based on location, lifestyle, and live AQI.
- [x] **Direct Impact Quantification**: Transparent explanations of how each choice reduces exposure and emissions.
