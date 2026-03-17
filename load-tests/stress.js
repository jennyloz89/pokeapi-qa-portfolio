import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');

// ─── Config ───────────────────────────────────────────────────
export const options = {
    stages: [
        { duration: '30s', target: 10 }, // normal load
        { duration: '30s', target: 20 }, // push beyond normal
        { duration: '30s', target: 30 }, // stress point
        { duration: '30s', target: 40 }, // beyond limit
        { duration: '30s', target: 0  }, // recovery
    ],

    thresholds: {
 'http_req_duration{expected_response:true}': ['p(95)<5000'],
    http_req_failed: ['rate<0.20'],
    },
};

const BASE_URL = 'https://pokeapi.co/api/v2';

export default function () {
    const res = http.get(`${BASE_URL}/pokemon/pikachu`);

    const success = check(res, {
        'status is 200':       (r) => r.status === 200,
        'responds under 5s':   (r) => r.timings.duration < 5000,
    });

    errorRate.add(!success);
    sleep(1);
}

export function handleSummary(data) {
    const duration = data.metrics.http_req_duration;
    const failed = data.metrics.http_req_failed;

    if (duration && duration.values) {
        console.log('\n=== STRESS TEST RESULTS ===');
        console.log(`avg: ${duration.values.avg.toFixed(0)}ms`);
        console.log(`p95: ${duration.values['p(95)'].toFixed(0)}ms`);
        console.log(`p99: ${duration.values['p(99)'] ? duration.values['p(99)'].toFixed(0) : 'N/A'}ms`);
        console.log(`error rate: ${failed ? (failed.values.rate * 100).toFixed(2) : '0.00'}%`);
    }

    return {
        'reports/stress-summary.json': JSON.stringify(data, null, 2),
    };
}