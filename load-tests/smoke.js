import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const pokemonDuration = new Trend('pokemon_request_duration');

export const options = {
    vus: 1,
    duration: '30s',

    thresholds: {
        'http_req_duration{expected_response:true}': ['p(95)<3000'],
        http_req_failed: ['rate<0.01'],
        error_rate:      ['rate<0.05'], // más permisivo mientras calibramos
    },
};

const BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON = ['pikachu', 'charizard', 'bulbasaur', 'mewtwo', 'gengar'];

export default function () {
    const pokemon = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    const res = http.get(`${BASE_URL}/pokemon/${pokemon}`);

    pokemonDuration.add(res.timings.duration);

    const body = JSON.parse(res.body);

    const success = check(res, {
        'status is 200':        (r) => r.status === 200,
        'has name field':       () => body.name !== undefined,
        'has types field':      () => body.types.length > 0,
        'content-type is json': (r) => r.headers['Content-Type'].includes('application/json'),
    });

    errorRate.add(!success);
    sleep(1);
}

export function handleSummary(data) {
    return {
        'reports/smoke-summary.json': JSON.stringify(data, null, 2),
    };
}