# PokéAPI QA Testing Suite

![CI](https://github.com/jennyloz89/pokeapi-qa-portfolio/actions/workflows/api-tests.yml/badge.svg)
![Newman](https://img.shields.io/badge/Newman-CLI-orange)
![Postman](https://img.shields.io/badge/Tested%20with-Postman-FF6C37)
![License](https://img.shields.io/badge/license-MIT-blue)

A professional API testing suite built on [PokéAPI](https://pokeapi.co/) — a public RESTful API.  
This project demonstrates end-to-end QA automation skills including functional testing, regression testing, and CI/CD pipeline integration.

📊 **[View Live Test Report](https://jennyloz89.github.io/pokeapi-qa-portfolio/reports/report.html)**

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Test Strategy](#test-strategy)
- [Test Modules](#test-modules)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [CI/CD Pipeline](#cicd-pipeline)
- [Known API Behaviors](#known-api-behaviors)
- [Author](#author)

---

## Project Overview

This suite tests the PokéAPI REST API across four quality dimensions:

| Dimension | Coverage |
|---|---|
| Functional | Happy paths, negative tests, boundary conditions |
| Regression | Schema contracts, data integrity, stability across runs |
| Automation | Newman CLI runner with HTML reporting |
| Performance | Response time baselines and load behavior |

**API Type:** RESTful, read-only, public, no authentication required  
**Base URL:** `https://pokeapi.co/api/v2`  
**Total test cases:** 18+  
**Endpoints covered:** 5

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Postman | Test design and script authoring |
| Newman | CLI collection runner |
| newman-reporter-htmlextra | HTML report generation |
| GitHub Actions | CI/CD pipeline — runs on every push |
| GitHub Pages | Public test report hosting |
| JSON Schema (tv4) | Contract validation |

---

## Test Strategy

The testing approach follows a **risk-based** model, prioritizing:

1. **Core endpoints first** — Pokémon lookup by name and ID are the most critical user flows.
2. **Negative testing** — Invalid inputs and out-of-range values are explicitly tested to verify error handling.
3. **Contract stability** — Schema validation ensures the API structure doesn't change unexpectedly between runs.
4. **Data integrity** — Known static values (Pikachu's ID, type, base experience) are verified on every execution as regression anchors.

> Tests are designed to be **deterministic and independent** — each test case passes or fails on its own without relying on execution order, except where chaining is explicitly documented.

---

## Test Modules

### Module 1 — Functional Tests

Tests core API behavior across happy paths, negative cases, and boundary conditions.

| # | Request | Test Cases | Type |
|---|---|---|---|
| 1 | `GET /pokemon/pikachu` | Status 200, required fields, data types, known values, sprite URL | Happy path / Schema |
| 2 | `GET /pokemon/pikachu123` | Status 404, no valid Pokémon body returned | Negative |
| 3 | `GET /pokemon/99999` | Status 404, response time acceptable | Negative / Performance |
| 4 | `GET /pokemon?limit=20&offset=0` | Pagination structure, count ≥ 1302, no nulls in results | Happy path / Boundary |
| 5 | `GET /pokemon?limit=20&offset=20` | Page 2 has no overlap with page 1 | Boundary |
| 6 | `GET /pokemon?limit=0` | API behavior with invalid limit parameter | Edge case |
| 7 | `GET /type/fire` | Damage relations schema, business rules (fire → grass, ice, bug, steel) | Business rule |
| 8 | `GET /ability/blaze` | Effect entries in English, correct ID and name | Happy path |

### Module 2 — Regression Tests

Tests API contract stability and data consistency across multiple runs.

| # | Request | What It Validates |
|---|---|---|
| 1 | Schema validation — pikachu | Full JSON Schema contract for `/pokemon/{id}` response |
| 2a | URL check — get sprite | Extracts and saves sprite URL from response |
| 2b | URL check — verify sprite | Sprite URL returns 200 with `Content-Type: image/*` |
| 3 | Pokémon count stability | `count` field never decreases between runs |
| 4a | Equivalence — by name | Fetches Charizard by name, saves key values |
| 4b | Equivalence — by ID | Fetches Charizard by ID (6), asserts identical response |

---

## Project Structure

```
pokeapi-qa-portfolio/
├── collections/
│   └── pokeapi-collection.json       # Postman collection (v2.1)
├── environments/
│   └── pokeapi-environment.json      # Environment variables
├── reports/
│   └── report.html                   # Generated test report
├── .github/
│   └── workflows/
│       └── api-tests.yml             # GitHub Actions workflow
└── README.md
```

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Newman and htmlextra reporter

```bash
npm install -g newman
npm install -g newman-reporter-htmlextra
```

### Run locally

```bash
newman run collections/pokeapi-collection.json \
  --environment environments/pokeapi-environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/report.html \
  --reporter-htmlextra-title "PokéAPI QA Suite"
```

### View the report

Open `reports/report.html` in your browser, or visit the live version:  
🔗 [https://jennyloz89.github.io/pokeapi-qa-portfolio/reports/report.html](https://jennyloz89.github.io/pokeapi-qa-portfolio/reports/report.html)

---

## CI/CD Pipeline

The pipeline runs automatically on:
- Every `push` to `main`
- Every `pull_request` targeting `main`
- Scheduled: Monday–Friday at 8:00 AM UTC (simulating a real monitoring setup)

```
Push to main
    │
    ▼
GitHub Actions
    ├── Install Node.js + Newman
    ├── Run Postman collection
    ├── Generate HTML report
    ├── Upload report as artifact (retained 30 days)
    └── Publish report to GitHub Pages
```

---

## Known API Behaviors

Observations discovered during testing and documented as part of the QA process.

| Endpoint | Parameter | Expected | Actual | Severity | Notes |
|---|---|---|---|---|---|
| `GET /pokemon` | `limit=0` | 0 results | 20 results (default) | Low | API silently ignores invalid `limit` value and falls back to default |
| `GET /pokemon/{id}` | `id=99999` (numeric, out of range) | < 2000ms | ~4100ms | Low | Significantly slower than invalid name lookup (~42ms). Possible full table scan on non-existent numeric IDs |

> These are not blockers — PokéAPI is a public read-only API not under SLA. However, in a production environment these behaviors would be raised as defects for triage.

---

## Author

**Jenny Lozano**  
QA Engineer — API Testing · Test Automation · CI/CD  
[GitHub](https://github.com/jennyloz89)
