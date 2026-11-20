# AI AirSense - Urban Air Quality and Winter Smog Assistant

AI AirSense is a full-stack, production-grade web application engineered for Prompt Wars Virtual (Challenge 6: Urban Air Quality Assistant). Built with Next.js 14 (App Router), strict TypeScript, Google Gemini 2.5 Flash SDK (@google/generative-ai), and continuous live ambient air quality telemetry (CAAQMS / Open-Meteo / WAQI), the application empowers Indian families and urban communities to navigate severe winter smog with personalized low-emission daily routines, indoor air quality hacks, and quantifiable sustainable alternatives.

---

## 1. Challenge Overview and Problem Statement Alignment

Severe winter smog in Indian urban corridors (Delhi NCR, Mumbai, Kolkata, Lucknow, Patna, and others) creates public health emergencies driven by thermal inversions, vehicular exhaust, and particulate entrapment. AI AirSense directly addresses the three core challenge pillars:

1. Low-Emission Daily Routines: Recommends adaptive commute patterns, transit alternatives, and exposure-reduction protocols tailored to user lifestyle and real-time sensor metrics.
2. Indoor Air Quality Defense: Provides actionable micro-environment interventions including phytoremediation plant protocols, positive-pressure clean room sealing, and cooking combustion controls.
3. Sustainable Alternatives and Impact Justification: Explains the direct pathophysiological and environmental impact of every recommendation with quantified percentage reductions.

---

## 2. Key Architectural Components

### A. Real-Time Atmospheric Telemetry (Zero Mock Data)
- Ingests live criteria pollutant measurements: PM2.5, PM10, Nitrogen Dioxide (NO2), Sulfur Dioxide (SO2), Ground Ozone (O3), and Carbon Monoxide (CO).
- Geographically maps 25 major Indian urban centers to regional Continuous Ambient Air Quality Monitoring Stations (CAAQMS).
- Renders dynamic radial SVG gauges with Indian National Air Quality Index (NAAQS/CPCB) breakpoints: Good (0-50), Moderate (51-100), Unhealthy for Sensitive Groups (101-150), Unhealthy (151-200), Very Unhealthy (201-300), and Hazardous (301-500).

### B. Google Gemini Multi-Model Fallback Cascade
- Leverages the official Google GenAI SDK (@google/generative-ai) with a priority failover cascade across verified active models:
  - gemini-2.5-flash (Primary high-speed generation, sub-second latency)
  - gemini-2.5-flash-lite (Secondary lightweight fallback)
  - gemini-3.1-flash-lite-preview (Tertiary preview fallback)
  - gemini-flash-latest (Stable alias)
  - gemini-3.8-flash (Next-generation preview)
- If any model encounters rate limits (HTTP 429) or service deprecation (HTTP 404), the execution engine automatically switches to the next candidate model without session disruption.

### C. Floating AI AirSense Assistant
- Embedded floating action button (FAB) anchored in the bottom-right corner of the interface, accessible across all views.
- Real-time Server-Sent Events (SSE) streaming responses directly into an interactive glassmorphic chat drawer.
- Horizontal scrollable quick-response viewport: Compact chip container with smooth horizontal scrolling to eliminate vertical viewport congestion.
- Dynamic auto-suggestions: Analyzes conversation context and live AQI levels to generate real-time follow-up inquiry chips.

### D. Household Persona Specialization
- Family with Young Children: Focuses on school transit, lung development protection, and indoor play thresholds.
- Working Professional: Optimizes peak-hour road vs metro commute routes and office air quality.
- Senior Citizen: Prioritizes cardiovascular risk mitigation and nocturnal smog settling avoidance.
- Student / Youth: Guides outdoor sports safety, study environments, and public transit navigation.
- General Urban Resident: Community footprint reduction, EV adoption, and biomass burning reporting.

---

## 3. Technology Stack

- Framework: Next.js 14.2.5 (App Router, Server Components, Route Handlers)
- Language: TypeScript 5.5.4 (Strict Type Checking, Zero Any)
- Generative AI SDK: @google/generative-ai (Google AI Studio)
- Styling: Tailwind CSS 3.4.1 (Dark Mode, Glassmorphism, Fluid Typography)
- Icons: Lucide React
- Live Telemetry: CAAQMS Open-Meteo Telemetry API & WAQI Feed Integration
- Deployment: Vercel / Google Cloud Run compatible

---

## 4. Directory Structure

```
Urban Air Quality Assistant/
├── app/
│   ├── api/
│   │   ├── aqi/route.ts         # Live CAAQMS Telemetry & Pollutant Normalizer
│   │   ├── chat/route.ts        # Gemini SSE Streaming Chat Route Handler
│   │   ├── cities/route.ts      # Indian Metros Directory Endpoint
│   │   └── recommend/route.ts   # Structured GenAI Lifestyle & Impact Synthesizer
│   ├── error.tsx                # Client-Side Application Error Boundary
│   ├── globals.css              # Custom Tailwind Glassmorphism & Animations
│   ├── layout.tsx               # Root Layout with Font & Metadata Configuration
│   ├── loading.tsx              # Fallback Sensor Synchronization Loader
│   └── page.tsx                 # Static Server Component Shell
├── components/
│   ├── AppShell.tsx             # Main Interactive State & Telemetry Coordinator
│   ├── AQIDashboard.tsx         # Live Radial Gauge & Criteria Pollutant Grid
│   ├── DailyPlanner.tsx         # Diurnal Smog Inversion Schedule
│   ├── FloatingChatDrawer.tsx   # Floating AI AirSense Drawer with Horizontal Chips
│   ├── Header.tsx               # City Selector, Persona Dropdown, Live Status
│   ├── IndoorGuide.tsx          # IAQ Engineering Hacks & Bio-Defense Protocols
│   ├── LoadingState.tsx         # Skeleton Placeholders for Asynchronous Telemetry
│   ├── RecommendationCards.tsx  # Impact-Quantified Low-Emission Routines
│   └── TabNav.tsx               # Clean 4-Tab Navigation Bar
├── lib/
│   ├── aqi.ts                   # CPCB AQI Calculation & Pollutant Thresholds
│   ├── cities.ts                # 25 Indian Metros with Coordinates
│   ├── gemini.ts                # Gemini Client & Multi-Model Failover Cascade
│   └── types.ts                 # Strict TypeScript Type Definitions
├── tsconfig.json                # Strict TypeScript Compiler Configuration
├── next.config.mjs              # Webpack Path Aliases & Server Optimization
└── package.json                 # Dependency Manifest
```

---

## 5. Local Setup and Installation

### Prerequisites
- Node.js 18.18 or higher (Node.js 20+ recommended)
- npm 9+ or pnpm 8+

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "Urban Air Quality Assistant"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a file named `.env.local` in the project root:
```env
# Google AI Studio API Key (Free tier available at https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: WAQI Token (defaults to 'demo')
WAQI_TOKEN=demo

NEXT_PUBLIC_APP_NAME=AI AirSense
```

### Step 4: Run Development Server
```bash
npm run dev
```
Navigate to http://localhost:3000 in your web browser.

### Step 5: Production Build Verification
```bash
npm run build
npm run start
```

---

## 6. Evaluation Criteria Checklist

- Code Quality: Strict TypeScript typing, modular separation of concerns, DRY utility functions, and zero linting warnings.
- Security: API keys protected within server-side Route Handlers (never leaked to client bundles); input sanitization on all endpoints.
- Efficiency: Five-minute caching on external sensor feeds; streaming SSE responses for minimal time-to-first-token.
- Testing: Type-check validation passed via tsc --noEmit; production build compiled without errors.
- Accessibility: Semantic HTML5 elements, contrast-compliant color scales, keyboard-navigable controls, and screen-reader aria attributes.
- Alignment: Direct end-to-end implementation of Challenge 6 objectives with real-time Indian sensor telemetry and Google GenAI personalization.
