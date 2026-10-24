# FanIQ — AI-Powered Intelligent Fan Automation 🌬️

### AtomQuest 2026 | Track 1 — Fan | Team Alpha Fire

**FanIQ** is a software-first intelligent fan management platform designed to simulate how ambient temperature, humidity, occupancy, and user comfort feedback can be used to recommend suitable fan operating settings automatically.

The project aims to demonstrate a smarter approach to fan management through rule-based automation, user preference adaptation, and simulated energy-use analytics. Its initial prototype focuses on a virtual room and fan environment, allowing the proposed automation logic to be demonstrated and tested without requiring physical hardware.

> **Project status:** Working software prototype. This repository includes a persistent FastAPI backend, deterministic rule engine, SQLite history, energy estimates, automated tests, and a responsive React dashboard. It does not directly control a physical fan.

## ✅ Run the implemented project

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API and interactive documentation are available at `http://localhost:8000` and `http://localhost:8000/docs`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard uses `http://localhost:8000` by default. Set `VITE_API_BASE_URL` before starting Vite when the API is hosted elsewhere. Run backend tests with `PYTHONPATH=backend python -m pytest backend/tests -q` and create a production bundle with `npm run build --prefix frontend`.

### Implemented API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service health check |
| POST | `/api/recommendations` | Validate conditions, evaluate rules, and persist a recommendation |
| GET | `/api/history` | Retrieve recent decisions |
| DELETE | `/api/history` | Clear local decision history |
| POST | `/api/energy` | Calculate scenario estimates from stated power assumptions |

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Proposed Solution](#-proposed-solution)
4. [Objectives](#-objectives)
5. [Key Features](#-key-features)
6. [System Architecture](#-system-architecture)
7. [How FanIQ Works](#-how-faniq-works)
8. [Technology Stack](#-technology-stack)
9. [Project Structure](#-project-structure)
10. [Functional Requirements](#-functional-requirements)
11. [Non-Functional Requirements](#-non-functional-requirements)
12. [Performance Targets](#-performance-targets)
13. [Implementation Roadmap](#-implementation-roadmap)
14. [Testing and Validation](#-testing-and-validation)
15. [Installation and Setup](#-installation-and-setup)
16. [Safety, Limitations and Assumptions](#-safety-limitations-and-assumptions)
17. [Future Scope](#-future-scope)
18. [Team Alpha Fire](#-team-alpha-fire)
19. [AtomQuest Alignment](#-atomquest-alignment)
20. [License](#-license)

---

## 🌟 Project Overview

FanIQ explores the use of intelligent automation to make fan operation more responsive to changing indoor conditions.

Traditional fan operation generally requires users to adjust the speed manually. However, the preferred setting can change with temperature, humidity, occupancy, and individual comfort preferences.

FanIQ proposes an automation layer that evaluates these inputs and recommends an appropriate fan state.

The software prototype includes:

- A virtual room where environmental conditions can be configured.
- A simulated fan with multiple operating states.
- A rule engine that recommends fan settings.
- User feedback to explore comfort-based personalization.
- A dashboard showing environmental inputs and automation decisions.
- Decision logs for transparency and debugging.
- Simulated energy-use comparisons under explicitly stated assumptions.

The central idea is to make fan-setting decisions more **responsive, explainable, testable, and potentially energy-aware**.

## 🎯 Problem Statement

Many fan systems rely on manual speed selection or basic controls. These approaches may not adapt automatically when room conditions change.

For example:

- A room may become warmer during the afternoon.
- Humidity may change the user's perceived comfort.
- A room may become unoccupied while the fan remains switched on.
- A user may prefer quieter operation during sleeping hours.
- A fixed speed may not suit every environmental scenario.

These situations motivate a system that can evaluate environmental inputs and make consistent recommendations.

FanIQ addresses this problem by simulating temperature- and humidity-based fan automation, with occupancy and comfort feedback as additional inputs.

The prototype will investigate whether a transparent software rule engine can generate appropriate, repeatable recommendations across predefined scenarios.

## 💡 Proposed Solution

FanIQ uses a web interface connected to a backend decision engine. Users configure room temperature, relative humidity, occupancy, and optional comfort feedback. The backend validates the inputs, evaluates configurable rules, and returns one of five simulated fan states: **Off, Low, Medium, High, or Maximum**.

Each decision is recorded so users can understand which conditions influenced the recommendation. A bounded feedback mechanism can adjust future recommendations according to responses such as “too warm,” “comfortable,” or “too cool.” The dashboard can also compare simulated operating scenarios using configurable power assumptions and operating durations.

The first version is software-only. Any environmental readings are simulated or manually entered, and estimated energy figures are not equivalent to measurements from a real fan.

## 🎯 Objectives

1. Develop a working software prototype for intelligent fan-setting recommendations.
2. Implement temperature- and humidity-based automation rules.
3. Include occupancy and user comfort feedback as configurable inputs.
4. Provide an understandable explanation for each recommendation.
5. Store decision history and user feedback.
6. Compare rule-based and feedback-enabled behaviour using identical test scenarios.
7. Measure API response time and rule-engine correctness.
8. Explore energy-use scenarios without presenting estimates as measured savings.

---

## 🚀 Key Features

### 1. Virtual Room Simulator

Users can set environmental conditions to simulate different room scenarios.

Possible inputs:

- Temperature in degrees Celsius.
- Relative humidity as a percentage.
- Occupancy status.
- Quiet-hours status.
- Optional user comfort feedback.

These inputs make it possible to test the proposed automation logic without physical sensors.

### 2. Intelligent Fan Recommendation Engine

The backend evaluates the current inputs and recommends one of five simulated operating states.

| Fan state | Intended behaviour |
|---|---|
| Off | Recommend no operation when configured conditions permit |
| Low | Recommend gentle operation |
| Medium | Recommend moderate operation |
| High | Recommend stronger operation |
| Maximum | Recommend the highest available simulated setting |

The precise thresholds and priorities will be configurable and documented during implementation. These settings are initial design choices, not experimentally validated comfort standards.

### 3. Temperature and Humidity Triggers

FanIQ focuses on the Track 1 smart-home exploration area: ambient temperature and humidity-based triggers.

The system evaluates both variables against configurable rules. Temperature and humidity should not be treated as interchangeable measurements; the prototype can evaluate their combined effect using an explicitly defined rule set.

### 4. Occupancy-Aware Recommendations

An occupancy input allows the prototype to demonstrate how recommendations might differ between occupied and unoccupied rooms.

For example, the configured rules may recommend switching the simulated fan off when a room is empty, subject to manual overrides and the selected operating policy.

This feature demonstrates a possible automation policy; its energy benefits must be tested rather than assumed.

### 5. Comfort Feedback

Users can provide feedback such as:

- **Too warm:** the current recommendation may be insufficient.
- **Comfortable:** the current recommendation appears suitable.
- **Too cool:** the recommendation may be stronger than desired.

A bounded adjustment mechanism can use this feedback to explore personalization. Feedback should not override safety limits, user controls, or explicitly configured quiet-hour policies.

### 6. Energy-Use Scenario Analysis

The dashboard can estimate energy use using a configurable assumed power value and simulated operating duration.

A basic estimate is:

\[
E_{\mathrm{kWh}}=\frac{P_{\mathrm{W}}\times t_{\mathrm{hours}}}{1000}
\]

For example, if a hypothetical fan power assumption is 60 W and the simulated operating duration is 5 hours:

\[
E=\frac{60\times5}{1000}=0.30\text{ kWh}
\]

This example is illustrative only. The actual fan power rating, speed-dependent consumption, and operating duration must be measured or obtained from reliable specifications before making real-world claims.

### 7. Decision History and Explainability

For each recommendation, the application can record:

- Input temperature and humidity.
- Occupancy and quiet-hours status.
- Previous and recommended fan states.
- The rule that triggered the recommendation.
- User feedback, if provided.
- Timestamp and test scenario identifier.

This helps developers verify decisions and explain system behaviour.

### 8. Dashboard and Visualisation

The interface can display:

- Current simulated room conditions.
- Recommended fan state.
- Explanation of the decision.
- Feedback controls.
- Recent decision history.
- Comparisons between predefined scenarios.
- Estimated energy-use charts with clearly stated assumptions.

---

## 🏗️ System Architecture

The proposed architecture separates the user interface, automation logic, and data persistence.

```text
┌──────────────────────────────────┐
│       React + Tailwind CSS       │
│                                  │
│ Virtual Room • Fan Controls      │
│ Feedback • Dashboard • History   │
└────────────────┬─────────────────┘
                 │ REST API
                 ▼
┌──────────────────────────────────┐
│          FastAPI Backend         │
│                                  │
│ Input Validation                 │
│ Rule-Based Decision Engine       │
│ Bounded Feedback Adjustment      │
│ Decision Explanations            │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│        Database Layer            │
│                                  │
│ SQLite for Local Development     │
│ PostgreSQL for Deployment        │
│                                  │
│ Preferences • Scenarios • Logs   │
└──────────────────────────────────┘
```

### Architecture Components

**Frontend:** React and Tailwind CSS provide the virtual room controls, fan-state display, feedback inputs, and analytics dashboard.

**Backend:** FastAPI receives requests, validates values, executes the rule engine, and returns structured recommendations.

**Decision engine:** A deterministic rule set maps environmental and contextual inputs to an allowed fan state. A separate bounded feedback component can be evaluated after the baseline rules work reliably.

**Database:** SQLite is suitable for an initial local prototype. PostgreSQL is an option for a deployed or multi-user version.

**Visualisation:** Dashboard charts display simulated inputs, decisions, and estimated energy-use scenarios.

---

## ⚙️ How FanIQ Works

### Step 1: Input Environmental Conditions

The user enters or selects simulated temperature, humidity, occupancy, and quiet-hours status.

### Step 2: Validate Inputs

The backend checks that the supplied values are valid and within configured ranges. Invalid requests are rejected with a clear error.

### Step 3: Evaluate Automation Rules

The rule engine evaluates the conditions and chooses an allowed fan state.

An illustrative rule table might look like this:

| Condition | Example recommendation |
|---|---|
| Room unoccupied | Off, unless a configured override applies |
| Occupied and relatively cool | Low |
| Occupied and moderately warm | Medium |
| Occupied and warm | High |
| Occupied and very warm | Maximum, subject to configured limits |

The exact temperature and humidity thresholds must be selected and tested during implementation. This table illustrates the mechanism rather than defining final control thresholds.

### Step 4: Apply User Preferences

If feedback is available, the optional personalization layer evaluates whether a bounded adjustment is appropriate.

The system retains explainable rules rather than allowing unrestricted changes to the fan state.

### Step 5: Return the Recommendation

The API returns the recommended state and a brief explanation of the rules that influenced the result.

### Step 6: Save the Decision

The backend stores the inputs and decision so the result can be reviewed and tested later.

### Step 7: Display Analytics

The frontend displays the recommendation, recent decisions, and optional simulated energy-use comparisons.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React | Interactive frontend |
| Tailwind CSS | Responsive interface styling |
| Vite | Frontend development server and build tool |
| Python | Backend implementation |
| FastAPI | REST API and request validation |
| SQLite | Initial local database |
| PostgreSQL | Optional production database |
| Chart.js or Recharts | Dashboard charts |
| Git and GitHub | Version control and collaboration |
| Pytest | Backend and rule-engine tests |
| Vitest / React Testing Library | Optional frontend tests |

The charting and testing libraries are proposed choices and can be finalised during implementation.

---

## 📁 Project Structure

A suggested repository structure is:

```text
FanIQ/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RoomControls.jsx
│   │   │   ├── FanStatus.jsx
│   │   │   ├── FeedbackPanel.jsx
│   │   │   ├── DecisionHistory.jsx
│   │   │   └── EnergyChart.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── rules.py
│   │   ├── feedback.py
│   │   ├── database.py
│   │   └── routes/
│   │       ├── recommendations.py
│   │       └── history.py
│   ├── tests/
│   │   ├── test_rules.py
│   │   ├── test_api.py
│   │   └── test_history.py
│   └── requirements.txt
│
├── docs/
│   ├── architecture.md
│   ├── test-plan.md
│   └── demo-scenarios.md
│
├── .gitignore
├── LICENSE
└── README.md
```

This is a proposed structure. Files should be added as their corresponding features are implemented.

---

## 📋 Functional Requirements

The prototype should support the following functions:

- **FR-01:** Accept simulated temperature and humidity values.
- **FR-02:** Accept occupancy and quiet-hours inputs.
- **FR-03:** Validate environmental and contextual inputs.
- **FR-04:** Return one of the five permitted fan states.
- **FR-05:** Provide an explanation for each recommendation.
- **FR-06:** Accept optional comfort feedback.
- **FR-07:** Store and retrieve decision history.
- **FR-08:** Display recommendations and history on the dashboard.
- **FR-09:** Generate energy-use estimates from explicitly stated assumptions.
- **FR-10:** Compare baseline and feedback-enabled rules using the same test scenarios.

## 🔒 Non-Functional Requirements

- **Reliability:** Identical inputs and rule configurations should produce repeatable results.
- **Performance:** API response time should be measured under a documented test environment.
- **Usability:** Users should understand the current inputs and resulting recommendation.
- **Maintainability:** Rule logic should be separate from the frontend and database code.
- **Transparency:** Recommendations should include a reason or triggered rule.
- **Data integrity:** Invalid inputs should not silently produce misleading recommendations.
- **Safety:** Simulated outputs must not be presented as commands to a connected physical device.

---

## 📊 Performance Targets

The following are **proposed acceptance targets**, not measured achievements.

| Metric | Target | Validation method |
|---|---|---|
| Rule-engine correctness | 100% of expected outputs in the defined test suite | Automated scenario tests |
| API response time | Under 1 second under ordinary local test conditions | Timed API requests |
| Persistence | All saved records remain after an application restart | Restart and database verification |
| Invalid input handling | Invalid values rejected clearly | Boundary and malformed-input tests |
| Recommendation traceability | Each recommendation includes a reason | Inspect API response and decision log |
| Energy estimate | Calculation matches the stated formula and assumptions | Unit tests using known inputs |

Results should be reported only after the corresponding tests have been run.

---

## 🛠️ Implementation Roadmap

### Phase 1 — Requirements and Rule Design

- Define the input variables and their valid ranges.
- Write a table of conditions and expected fan states.
- Define rule priority and override behaviour.
- Create repeatable test scenarios.

### Phase 2 — Frontend Development

- Create the React application.
- Build virtual room controls.
- Display the simulated fan state.
- Add feedback controls and a decision-history view.

### Phase 3 — Backend Development

- Create the FastAPI application.
- Define request and response schemas.
- Implement input validation.
- Implement the deterministic rule engine.
- Add API endpoints for recommendations.

### Phase 4 — Data Persistence

- Configure SQLite.
- Save recommendations and feedback.
- Add a history endpoint.
- Verify that records survive application restarts.

### Phase 5 — Feedback and Analytics

- Add a bounded preference-adjustment mechanism.
- Compare feedback-enabled and baseline recommendations.
- Add estimated energy-use calculations.
- Label assumptions and simulated values on all relevant charts.

### Phase 6 — Testing and Demonstration

- Run rule-engine and API tests.
- Test invalid and boundary inputs.
- Measure API response times.
- Test history persistence.
- Prepare a live demonstration using predefined scenarios.
- Record actual results and document any known limitations.

---

## 🧪 Testing and Validation

Testing should establish whether the software behaves as designed, not assume that the proposed approach already improves comfort or efficiency.

### 1. Rule-Engine Testing

Create scenarios that cover:

- Low, moderate, and high temperatures.
- Low and high humidity.
- Occupied and unoccupied rooms.
- Quiet-hours conditions.
- Conflicting inputs.
- Manual overrides.
- Boundary values.

For each scenario, define the expected output before executing the test.

### 2. API Testing

Verify that:

- Valid requests return a permitted fan state.
- Missing fields produce a clear validation error.
- Invalid data is rejected.
- Response structures remain consistent.
- Requests complete within the proposed performance target under the stated test conditions.

### 3. Persistence Testing

Save a decision, restart the backend, and confirm that the decision remains available.

### 4. Feedback Testing

Run the same scenarios with feedback adjustment enabled and disabled. Compare the resulting recommendations against a defined evaluation criterion.

Do not claim that personalization is better unless the results support that conclusion.

### 5. Energy Calculation Testing

Use known input values to verify the calculation. Clearly distinguish:

- Hypothetical power assumptions.
- Simulated operating duration.
- Calculated energy estimates.
- Actual energy measurements, if hardware validation is added in the future.

---

## 💻 Installation and Setup

The following instructions describe a proposed development setup. They assume the repository has been implemented with the structure shown above.

### Prerequisites

Install:

- Node.js and npm.
- Python 3.10 or a compatible version supported by the selected dependencies.
- Git.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd FanIQ
```

Replace the placeholder with the repository's actual URL.

### 2. Set Up the Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install dependencies after creating `requirements.txt`:

```bash
pip install -r requirements.txt
```

Start the API after `app/main.py` has been implemented:

```bash
uvicorn app.main:app --reload
```

The local API should then be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is normally available at:

```text
http://127.0.0.1:8000/docs
```

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

After the Vite application has been implemented, start it:

```bash
npm run dev
```

Use the local URL printed by Vite in the terminal.

### 4. Configure the API URL

Create a frontend environment file if needed:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Read this setting in the frontend API service and configure backend CORS to allow the development frontend origin.

**Important:** These commands provide the intended setup workflow. They will work only after the repository files, dependencies, API endpoints, and frontend components have been created.

---

## ⚠️ Safety, Limitations and Assumptions

### Software-Only Prototype

The initial version does not contain physical sensors, a connected fan, a power meter, or a sound meter. Environmental values are simulated or manually entered.

### No Direct Hardware Control

FanIQ's recommendations do not switch a real fan on or off. Any future hardware integration would require compatible equipment, secure interfaces, manual overrides, fail-safe behaviour, and appropriate electrical and product-safety review.

### Energy Estimates Are Not Measurements

Energy-use charts use configurable assumptions. They cannot prove actual energy savings without a defined baseline and measurements from real operating equipment.

### Comfort Is Individual

Temperature and humidity alone do not establish whether a person is comfortable. Personal preferences, air movement, clothing, activity, and other conditions can influence comfort.

### Rule Thresholds Require Validation

Thresholds are configurable design choices. They should be tested and documented rather than described as universally optimal settings.

### Competition Eligibility

The proposed project targets the Track 1 smart-home exploration area. Because the concept is software-only, the team should confirm that a simulator-only demonstration satisfies the organisers' working-prototype requirements.

---

## 🔮 Future Scope

Possible future extensions include:

1. **Physical sensor integration:** Read temperature and humidity from compatible sensors.
2. **Smart-home connectivity:** Integrate with supported smart plugs or fan controllers after safety and compatibility checks.
3. **Measured energy analysis:** Compare actual power consumption across baseline and automated operating modes.
4. **Comfort personalisation:** Evaluate bounded preference models using structured user feedback.
5. **Multi-room management:** Extend the system to multiple virtual rooms and independently configured policies.
6. **Scheduling:** Introduce user-configurable schedules and quiet hours.
7. **Advanced analytics:** Compare recommendation accuracy, response time, and energy estimates across scenarios.
8. **Offline operation:** Explore local decision-making where network availability is limited.
9. **Accessibility improvements:** Add accessible controls, clear labels, keyboard navigation, and high-contrast dashboard options.
10. **Hardware safety validation:** If the project expands to physical control, introduce a separate engineering and safety validation stage before real-world use.

These are future possibilities, not features already implemented.

---

## 👥 Team Alpha Fire

**Institution:** Thapar Institute of Engineering & Technology, Patiala, Punjab, India

| Team member | Responsibility suggestion |
|---|---|
| Tanveer Singh | Team leadership, backend integration, and project coordination |
| Harleen Kaur | Frontend and dashboard development |
| Harjas Kaur | Rule-engine scenarios and testing |
| Simerose Kaur | Documentation, analytics, and demonstration preparation |

Responsibilities are suggested allocations and can be adjusted according to the team's actual contributions.

## 🏆 AtomQuest Alignment

FanIQ aligns with the **Track 1 — Fan** exploration area:

> Fan as an enabler for smart home — ambient temperature and humidity-based triggers to control connected devices.

The proposed prototype explores the decision logic behind environmental automation through a virtual room and simulated fan states. Occupancy, feedback, and energy-use analytics are additional proposed capabilities.

The project aims to demonstrate a testable software concept while being transparent about what has and has not been validated. The software simulator should not be presented as a connected-device implementation.

## 📄 Suggested Repository Deliverables

A complete submission repository should include:

- [ ] Source code for the frontend and backend.
- [ ] README and setup instructions.
- [ ] Architecture diagram.
- [ ] Defined automation rules and test scenarios.
- [ ] Automated test results.
- [ ] Screenshots or a demonstration video.
- [ ] Known limitations and validation results.
- [ ] A list of dependencies and their licences.

## 📜 License

Choose and add an appropriate open-source licence, such as the MIT License, if the team intends to distribute the code under those terms. Do not describe the repository as MIT-licensed until the licence file has been added.

---

**FanIQ — Smarter fan-setting decisions through explainable automation.**

*Built by Team Alpha Fire for AtomQuest 2026 Track 1.*
