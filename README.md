# AI AirSense - Urban Air Quality and Winter Smog Assistant

AI AirSense is a production-grade web application engineered for Prompt Wars Virtual (Challenge 6: Urban Air Quality Assistant). Powered by Next.js 14 (App Router), strict TypeScript, Google Gemini 2.5 Flash SDK (@google/generative-ai), an enterprise edge proxy layer, and real-time live ambient air quality telemetry (CAAQMS / WAQI / Open-Meteo), the application equips Indian households and urban communities with quantified exposure reduction strategies, adaptive daily schedules, and indoor air defense protocols during severe winter smog episodes.

---

## 1. Chosen Vertical

- Domain: Urban Air Quality, Meteorological Inversion Mitigation, and Community Environmental Health.
- Geographic Focus: Indian metropolitan regions, particularly the Indo-Gangetic Plain (Delhi NCR, Lucknow, Patna, Kolkata) and major industrial and coastal urban centers (Mumbai, Bengaluru, Hyderabad, Chennai, Ahmedabad).
- Core Challenge: Annual winter air pollution crises triggered by seasonal agricultural crop residue burning, post-Diwali particulate surges, vehicular cold-start exhaust, industrial emissions, and meteorological temperature inversions trapping PM2.5 and PM10 within the planetary boundary layer.
- Target Beneficiaries: Families with young children, daily commuters, elderly residents with respiratory or cardiovascular sensitivity, students, and general urban citizens seeking actionable, culturally relevant interventions.

---

## 2. Approach and Logic

The architecture is founded on a direct Sensor-to-Intelligence pipeline designed to convert complex atmospheric chemistry into prioritized, quantifiable human actions:

1. Real-Time Physical Grounding: The system strictly prohibits static mock data. Every recommendation, health alert, and conversational response is dynamically conditioned on live sensor telemetry (AQI, PM2.5, PM10, NO2, SO2, CO, O3) pulled from local CAAQMS stations.
2. Diurnal Boundary-Layer Intelligence: Urban smog varies dramatically throughout a 24-hour cycle. Ground cooling overnight creates thermal inversions between 6:00 AM and 10:00 AM, trapping toxic particulates at breathing level. Solar heating between 11:00 AM and 3:30 PM lifts the planetary boundary layer, creating a dispersion window. The application structures user routines around these physical atmospheric windows.
3. Multi-Persona Calibration: A single AQI reading impacts demographics differently. Five distinct household profiles tailor advice to physiological vulnerability and mobility patterns.
4. Resilient Proxy Architecture: Outbound and inbound traffic flows through secure, cached proxy layers:
   - Inbound Edge Proxy (proxy.ts / middleware.ts): Intercepts requests to inject security headers, enforce rate limits, and provide distributed tracing.
   - Outbound Resilient Proxy (lib/proxy.ts): Enforces SSRF prevention via an authorized domain allowlist, incorporates request timeouts, and provides in-memory LRU/TTL caching.
5. Dynamic Model Fallback Cascade: Utilizes Google AI Studio's generative model cascade with primary generation on gemini-2.5-flash and automated failover across secondary models to guarantee zero downtime.

---

## 3. How the Solution Works

### Step 1: Atmospheric Telemetry Ingestion
- When a user selects any of the 25 supported Indian urban centers, the server queries the WAQI and Continuous Ambient Air Quality Monitoring Station (CAAQMS) networks using an authenticated API token.
- If a station feed is offline or reporting incomplete iaqi sub-indices, the proxy layer falls back to Open-Meteo European atmospheric satellite and surface station models.
- Criteria pollutants are evaluated against Indian National Ambient Air Quality Standards (NAAQS) and categorized across six standard CPCB tiers: Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, and Hazardous.

### Step 2: Structured GenAI Recommendation Synthesis
- Live telemetry is paired with the user's active household profile and dispatched to Gemini 2.5 Flash via a typed schema prompt with responseMimeType set to application/json.
- The model synthesizes:
  - Urgency and biological exposure warnings.
  - Low-emission daily routines with quantified impact metrics (e.g. -85% inhaled PM2.5 mass).
  - Sustainable transit and lifestyle alternatives.
  - Diurnal smog schedules segmented into morning inversion, afternoon dispersion, and evening settling phases.
  - Dynamic Indoor Clean-Air Guide with 6 practical, low-cost Indian household interventions across source control, filtration, and ventilation.

### Step 3: Interactive Visual Dashboard and WAI-ARIA Navigation
- The client renders a responsive radial SVG gauge with smooth drop-shadow glow and a six-pollutant diagnostic grid.
- A four-tab WAI-ARIA navigation bar allows switching between the Live Monitor, AI Routines, Smog Daily Planner, and Indoor Hacks with keyboard arrow navigation.

### Step 4: Persistent Conversational Assistant (AI AirSense)
- A floating action button (FAB) in the lower-right corner launches the AI AirSense drawer.
- The drawer establishes a Server-Sent Events (SSE) streaming connection, rendering markdown responses in real-time.
- The assistant extracts follow-up suggestions from the LLM stream, rendering horizontal scrollable inquiry chips that allow users to drill deeper into specific mitigation topics.

### Step 5: Browser Session Storage Persistence
- User selections (city, household persona, active tab, drawer state) and conversation history are automatically stored in window.sessionStorage.
- Telemetry and AI recommendations are cached in the browser session, enabling instant 0ms restoration when toggling between cities or refreshing the page.

---

## 4. Assumptions Made

1. Monitoring Station Proximity: CAAQMS telemetry reflects regional urban ambient air. Micro-climates (e.g., living 50 meters from a high-density arterial highway vs. a green residential cantonment) can exhibit localized PM2.5 variances of 15% to 30%.
2. Indian Household Structural Realities: Assumes typical Indian urban dwellings often feature unsealed balcony doors, sliding aluminum windows, and wet kitchens without dedicated HVAC systems. Protocols focus on damp mopping, silicone weatherstripping, and DIY Corsi-Rosenthal filtration rather than central HVAC air handlers.
3. Indoor-to-Outdoor Infiltration Ratio: Without active sealing or mechanical HEPA filtration, indoor PM2.5 concentration in Indian urban homes is assumed to equilibrate at approximately 60% to 75% of ambient outdoor concentrations.
4. Particulate Resuspension: Assumes standard dry sweeping (jharoo) resuspends settled coarse and fine dust into breathing zones, reinforcing the mandatory recommendation for wet microfiber mopping.
5. Telemetry Refresh Frequency: CPCB and WAQI ambient stations publish verified readings on hourly cycles. The application's 5-minute cache TTL balances real-time responsiveness with upstream API conservation.

---

## 5. Evaluation Focus Areas

### A. Code Quality - Structure, Readability, Maintainability
- Modular Architecture: Codebase cleanly divided into presentation components (components/), route handlers (app/api/), mathematical engines (lib/aqi.ts), proxy infrastructure (lib/proxy.ts, proxy.ts), storage utilities (lib/storage.ts), and type contracts (lib/types.ts).
- Strict Type Safety: Zero use of 'any' across core interfaces. Strict TypeScript 5.5 configuration with noImplicitAny and exactOptionalPropertyTypes enabled.
- Single Responsibility: Each component encapsulates one clear visual or logical concern, ensuring maintainability and straightforward debugging.

### B. Security - Safe and Responsible Implementation
- SSRF Prevention Layer: Outbound external calls are strictly gated by an allowlist in lib/proxy.ts, permitting only authorized hosts (api.waqi.info, air-quality-api.open-meteo.com, cpcb.nic.in, generativelanguage.googleapis.com). Non-HTTPS schemes, loopbacks (127.0.0.1, localhost), and RFC 1918 private IP subnets are blocked.
- Edge Proxy Guard: Root proxy.ts intercepts all inbound requests, applying rate limiting (60 requests/minute/IP) to prevent API route abuse.
- Security Headers: Enforces Content-Security-Policy (CSP), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and Permissions-Policy across all routes.
- Secret Isolation: Google AI Studio API keys and WAQI tokens are confined strictly to server-side execution and never exposed in client bundles.
- Input Sanitization: User messages are capped at 1,000 characters and sanitized before prompt composition to mitigate prompt injection.

### C. Efficiency - Optimal Use of Resources
- Tiered Caching Strategy:
  - In-Memory Server Cache: Outbound proxy queries cached for 300 seconds; structured AI recommendations cached for 900 seconds.
  - Browser Session Cache: Telemetry and recommendations stored in sessionStorage, eliminating network round-trips when toggling between previously viewed cities.
- Sub-400ms Time-to-First-Token: AI AirSense chat uses Server-Sent Events (SSE) streaming for real-time token delivery.
- Low-Latency Model Selection: Primary reliance on gemini-2.5-flash yields sub-second inference times while operating within free-tier rate limits.

### D. Testing - Validation of Functionality
- Automated Test Suite: 27 automated unit and integration tests powered by Node.js native test runner and tsx, executable via 'npm test'.
- Test Coverage:
  - tests/aqi.test.ts: CPCB/NAAQS calculation formulas, category breakpoints (Good through Hazardous), health messaging, and boundary conditions.
  - tests/proxy.test.ts: SSRF domain allowlists, protocol validation, loopback blocking, and in-memory cache telemetry.
  - tests/next-proxy.test.ts: Edge proxy header injection, CORS preflight OPTIONS resolution, and distributed tracing identifiers.
  - tests/cities.test.ts: Dataset integrity, unique slug validation, and geographic bounding across 25 Indian urban centers.
  - tests/storage.test.ts: Browser session storage serialization, fallback handling, corrupt JSON recovery, and prefix-based clearing.

### E. Accessibility - Inclusive and Usable Design
- WAI-ARIA Tab Semantics: TabNav implements role="tablist", role="tab", aria-selected, and aria-controls with full keyboard navigation (ArrowLeft, ArrowRight, Home, End).
- Dialog Semantics and Focus Control: FloatingChatDrawer implements role="dialog", aria-modal="true", aria-labelledby, autofocus on the input element, and Escape key dismissal.
- Live Region Announcements: Live sensor badges and chat message logs use aria-live="polite" to inform screen readers of incoming updates.
- Visual Contrast and Usability: All visual elements meet WCAG AA contrast ratios against dark slate backgrounds, complemented by visible focus rings (focus-visible:ring-2) for keyboard navigators.

### F. Problem Statement Alignment - Relevance to the Stated Problem
- Deep Indian Smog Context: Replaces generic Western guidance with localized realities: Indo-Gangetic meteorology, temperature inversions, seasonal stubble burning, Diwali spikes, and unsealed masonry structures.
- Quantified Pathophysiological Impacts: Every routine and hack provides clear percentage reductions (e.g. -85% inhaled PM2.5 via N95, -60% per-capita emissions via Delhi Metro, -80% particulate resuspension via damp mopping).
- Complete End-to-End Delivery: Live data ingestion, adaptive AI generation, daily planners, indoor defense guides, and persistent chat assistance working in unison.

---

## 6. Technology Stack

- Framework: Next.js 14.2.5 (App Router, Server Components, Route Handlers)
- Language: TypeScript 5.5.4 (Strict Type Checking)
- Generative AI SDK: @google/generative-ai (Google AI Studio)
- Styling: Tailwind CSS 3.4.1 (Dark Mode, Glassmorphic Design)
- Icons: Lucide React and Custom Scalable Vector Mark (public/icon.svg)
- Test Runner: Node.js Native Test Runner with tsx
- Telemetry: CAAQMS Network, WAQI Station Feeds, Open-Meteo Atmospheric Models

---

## 7. Directory Structure

```
Urban Air Quality Assistant/
├── app/
│   ├── api/
│   │   ├── aqi/route.ts         # Live CAAQMS Telemetry & Pollutant Normalizer
│   │   ├── chat/route.ts        # Gemini SSE Streaming Chat Route Handler
│   │   ├── cities/route.ts      # Indian Metros Directory Endpoint
│   │   ├── proxy/route.ts       # Secure Proxy API Route with Domain Allowlist
│   │   └── recommend/route.ts   # Structured GenAI Lifestyle & Impact Synthesizer
│   ├── error.tsx                # Client-Side Application Error Boundary
│   ├── globals.css              # Custom Tailwind Glassmorphism & Animations
│   ├── icon.tsx                 # Dynamic High-Resolution App Favicon Generator
│   ├── layout.tsx               # Root Layout with Font & Metadata Configuration
│   ├── loading.tsx              # Fallback Sensor Synchronization Loader
│   └── page.tsx                 # Static Server Component Shell
├── components/
│   ├── AppShell.tsx             # Main Interactive State & Telemetry Coordinator
│   ├── AQIDashboard.tsx         # Live Radial Gauge & Criteria Pollutant Grid
│   ├── DailyPlanner.tsx         # Diurnal Smog Inversion Schedule
│   ├── FloatingChatDrawer.tsx   # Floating AI AirSense Drawer with Horizontal Chips
│   ├── Header.tsx               # City Selector, Persona Dropdown, Live Status
│   ├── IndoorGuide.tsx          # IAQ Engineering Hacks & Clean-Air Protocols
│   ├── LoadingState.tsx         # Skeleton Placeholders for Asynchronous Telemetry
│   ├── RecommendationCards.tsx  # Impact-Quantified Low-Emission Routines
│   └── TabNav.tsx               # Accessible WAI-ARIA 4-Tab Navigation Bar
├── lib/
│   ├── aqi.ts                   # CPCB AQI Calculation & Pollutant Thresholds
│   ├── cities.ts                # 25 Indian Metros with Geographic Coordinates
│   ├── gemini.ts                # Gemini Multi-Model Failover Cascade
│   ├── proxy.ts                 # Resilient HTTP Client, SSRF Guard & In-Memory Cache
│   ├── storage.ts               # SSR-Safe Browser SessionStorage Manager
│   └── types.ts                 # Strict TypeScript Type Definitions
├── middleware.ts                # Next.js 14 Middleware Adapter Re-Exporting proxy.ts
├── proxy.ts                     # Next.js Edge Proxy with Rate Limiting & Tracing
├── public/
│   └── icon.svg                 # Scalable Vector App Icon
├── tests/
│   ├── aqi.test.ts              # Unit Tests for AQI Math and Breakpoints
│   ├── cities.test.ts           # Integrity Tests for Indian Urban Centers Dataset
│   ├── next-proxy.test.ts       # Tests for Next.js Edge Proxy Header Injection
│   ├── proxy.test.ts            # Security Tests for Outbound SSRF & Caching
│   └── storage.test.ts          # Tests for Browser Session Storage Management
├── tsconfig.json                # Strict TypeScript Compiler Configuration
├── next.config.mjs              # Security Headers, Webpack Aliases & Server Optimization
└── package.json                 # Dependency Manifest & Test Scripts
```

---

## 8. Local Setup and Installation

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
# Google AI Studio API Key (Obtain from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# WAQI Token for Real-time Indian CAAQMS Station Feeds
WAQI_TOKEN=your_waqi_token_here

NEXT_PUBLIC_APP_NAME=AI AirSense
```

### Step 4: Run Automated Tests
```bash
npm test
```

### Step 5: Run Development Server
```bash
npm run dev
```
Navigate to http://localhost:3000 in your web browser.

### Step 6: Production Build Verification
```bash
npm run build
npm run start
```
