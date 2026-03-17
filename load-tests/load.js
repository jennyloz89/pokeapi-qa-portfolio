import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom metrics ───────────────────────────────────────────
const errorRate    = new Rate('error_rate');
const successCount = new Counter('successful_requests');

// ─── Config ───────────────────────────────────────────────────
export const options = {
    stages: [
        { duration: '30s', target: 5  }, // ramp up to 5 users
        { duration: '1m',  target: 10 }, // hold at 10 users
        { duration: '30s', target: 0  }, // ramp down
    ],

    thresholds: {
    'http_req_duration{expected_response:true}': ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
    error_rate:      ['rate<0.05'],
    },
};

const BASE_URL = 'https://pokeapi.co/api/v2';

// ─── Scenarios ────────────────────────────────────────────────
const ENDPOINTS = [
    { url: `${BASE_URL}/pokemon/pikachu`,        weight: 40 },
    { url: `${BASE_URL}/pokemon?limit=20`,        weight: 30 },
    { url: `${BASE_URL}/type/fire`,               weight: 15 },
    { url: `${BASE_URL}/ability/blaze`,           weight: 15 },
];

function pickEndpoint() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const endpoint of ENDPOINTS) {
        cumulative += endpoint.weight;
        if (rand < cumulative) return endpoint.url;
    }
    return ENDPOINTS[0].url;
}

export default function () {
    const url = pickEndpoint();
    const res = http.get(url);

    const success = check(res, {
        'status is 200':         (r) => r.status === 200,
        'response time < 2000ms':(r) => r.timings.duration < 2000,
        'body is not empty':     (r) => r.body.length > 0,
    });

    errorRate.add(!success);
    if (success) successCount.add(1);

    sleep(Math.random() * 2 + 1); // random sleep 1-3s (realistic user behavior)
}

export function handleSummary(data) {
    return {
        'reports/load-summary.json': JSON.stringify(data, null, 2),
    };
}