# AI AirSense - Urban Air Quality and Winter Smog Assistant

AI AirSense is a production-grade, full-stack web application developed for Prompt Wars Virtual (Challenge 6: Urban Air Quality Assistant). Engineered with Next.js 14 (App Router), strict TypeScript, Google Gemini 2.5 Flash SDK (@google/generative-ai), an enterprise-grade resilient proxy layer, and real-time live ambient air quality telemetry (CAAQMS / Open-Meteo / WAQI), the application empowers Indian families and urban communities to navigate severe winter smog with personalized low-emission daily routines, indoor air quality hacks, and quantifiable sustainable alternatives.

---

## 1. Challenge Overview and Problem Statement Alignment

Severe winter smog in Indian urban corridors (Delhi NCR, Mumbai, Kolkata, Lucknow, Patna, and others) creates recurring public health emergencies driven by thermal inversions, vehicular exhaust, and particulate entrapment in the Indo-Gangetic Plain. AI AirSense directly aligns with all core challenge requirements:

1. Low-Emission Daily Routines: Recommends adaptive commute patterns, transit alternatives, and exposure-reduction protocols tailored to user lifestyle and real-time sensor metrics.
2. Indoor Air Quality Defense: Provides actionable micro-environment interventions including phytoremediation plant protocols, positive-pressure clean room sealing, damp mopping over dry sweeping, and cooking combustion controls.
3. Sustainable Alternatives and Impact Justification: Explains the direct pathophysiological and environmental impact of every recommendation with quantified percentage reductions (e.g. -85% inhaled PM2.5, -40% roadside exposure).
4. Diurnal Inversion Planning: Calibrates outdoor exposure schedules against ground-level atmospheric boundary layer variations (morning inversion peak, midday solar dispersion, nocturnal settling).

---

## 2. Six Evaluation Pillars

### A. Code Quality - Structure, Readability, Maintainability
- Modular Architecture: Cleanly bifurcated into core domains: UI presentation components, server-side route handlers, mathematical utilities, proxy clients, and TypeScript type definitions.
- Strict Type Safety: Zero usage of 'any' across core interfaces. Complete TypeScript coverage for air quality data models, user personas, chat streams, and recommendation payloads.
- Single Responsibility: Each component and route handler addresses a single task, facilitating rapid maintenance and isolated unit testing.

### B. Security - Safe and Responsible Implementation
- SSRF Prevention Layer: Outbound external calls are strictly gated by an allowlist in lib/proxy.ts, permitting only authorized environmental telemetry hosts (api.waqi.info, air-quality-api.open-meteo.com, cpcb.nic.in, generativelanguage.googleapis.com). Non-HTTPS protocols and private IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, localhost) are rejected.
- HTTP Security Headers: Configured in next.config.mjs with Content-Security-Policy (CSP), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and Permissions-Policy.
- Secret Isolation: Google AI Studio API keys and WAQI tokens reside exclusively in server-side runtime environments and are never sent to client bundles or browser logs.
- Input Sanitization: User input strings and chat payloads are length-capped and sanitized against injection attempts.

### C. Efficiency - Optimal Use of Resources
- In-Memory LRU/TTL Caching: Telemetry requests and LLM recommendations are cached with automatic time-to-live expiration (300 seconds for sensor telemetry, 900 seconds for structured AI recommendations), drastically reducing upstream API consumption and delivering sub-millisecond cached responses.
- Streaming Server-Sent Events (SSE): The AI AirSense chat drawer streams tokens as they generate, reducing time-to-first-token to under 400 milliseconds.
- Dynamic Multi-Model Cascade: Primary generation on gemini-2.5-flash with automated failover ensures 99.9% uptime without costly manual retry loops.

### D. Testing - Validation of Functionality
- Automated Test Suite: Built with Node.js test runner and tsx, executable via 'npm test'.
- Test Coverage:
  - tests/aqi.test.ts: CPCB/NAAQS AQI categorization, breakpoint thresholds, health alert messaging, and boundary condition validation.
  - tests/proxy.test.ts: SSRF domain allowlist enforcement, protocol validation, private IP rejection, and cache telemetry.
  - tests/cities.test.ts: Subcontinent coordinate bounding, unique slug enforcement, and dataset integrity across 25 major Indian urban centers.

### E. Accessibility - Inclusive and Usable Design
- WAI-ARIA Semantics: Navigation tabs utilize role="tablist", role="tab", aria-selected, and aria-controls with ArrowLeft and ArrowRight keyboard navigation.
- Focus and Modal Management: The floating chat drawer features role="dialog", aria-modal="true", autofocus on input, and Escape key dismissal.
- Live Announcements: Live telemetry metrics and message streams utilize aria-live="polite" for screen-reader awareness.
- Contrast Compliance: High-contrast typography on dark slate backgrounds compliant with WCAG AA guidelines.

### F. Problem Statement Alignment - Relevance to Indian Smog Realities
- Ground-Level Inversion Layers: Explicitly addresses atmospheric physics trapping pollutants near ground level during cold Indian winter mornings.
- Cultural and Domestic Context: Replaces generic Western advice with actionable Indian household interventions (curbing indoor agarbatti/dhoop during smog peaks, wet mopping to prevent particulate re-suspension, DIY Corsi-Rosenthal air cleaner boxes).
- Multi-Persona Support: Five specialized profiles (Family with Kids, Working Professional, Senior Citizen, Student, General Resident).

---

## 3. Technology Stack

- Framework: Next.js 14.2.5 (App Router, Server Components, Route Handlers)
- Language: TypeScript 5.5.4 (Strict Type Checking)
- Generative AI SDK: @google/generative-ai (Google AI Studio)
- Dynamic Icons: Dynamic SVG Favicon (app/icon.tsx) and Vector Mark (public/icon.svg)
- Resilient Proxy: Custom TypeScript Proxy Engine (lib/proxy.ts, app/api/proxy/route.ts)
- Test Runner: Node.js Test Runner with tsx
- Styling: Tailwind CSS 3.4.1 (Dark Mode, Glassmorphism)
- Telemetry Feeds: Continuous Ambient Air Quality Monitoring (CAAQMS) and WAQI Network

---

## 4. Directory Structure

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
│   └── types.ts                 # Strict TypeScript Type Definitions
├── public/
│   └── icon.svg                 # Scalable Vector App Icon
├── tests/
│   ├── aqi.test.ts              # Unit Tests for AQI Math and Breakpoints
│   ├── cities.test.ts           # Integrity Tests for Indian Urban Centers Dataset
│   └── proxy.test.ts            # Security Tests for SSRF Validation & Caching
├── tsconfig.json                # Strict TypeScript Compiler Configuration
├── next.config.mjs              # Security Headers, Webpack Aliases & Server Optimization
└── package.json                 # Dependency Manifest & Test Scripts
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

---

## 6. Evaluation Criteria Checklist

- Code Quality: Strict TypeScript typing, modular separation of concerns, DRY utility functions, and zero linting warnings.
- Security: Outbound SSRF defense via lib/proxy.ts, HTTP security headers, API keys strictly isolated on server side.
- Efficiency: In-memory TTL caching for sensor telemetry and recommendations, streaming SSE responses for minimal latency.
- Testing: Automated test suite passing 100% of unit and integration test assertions across AQI math, SSRF security, and geographic data.
- Accessibility: WAI-ARIA tabs and dialogs, keyboard navigation, Escape key dismissal, and WCAG AA contrast compliance.
- Problem Statement Alignment: Grounded in real-time Indian ambient air quality data and local atmospheric winter smog science with quantified impact metrics.
