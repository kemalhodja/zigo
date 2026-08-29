// k6 Load Test for ZIGO
// Run: k6 run e2e/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = Trend('api_latency');
const pageLoadTime = Trend('page_load_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm up
    { duration: '1m', target: 100 },   // Normal load
    { duration: '2m', target: 300 },   // High load
    { duration: '1m', target: 500 },   // Peak load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.01'],
  },
  ext: {
    loadimpact: {
      projectID: '',
      name: 'ZIGO Load Test',
    },
  },
};

// Test data
const BASE_URL = 'https://zigo.app';
const TEST_USERS = [
  { email: 'loadtest1@zigo.test', password: 'LoadTest123!' },
  { email: 'loadtest2@zigo.test', password: 'LoadTest123!' },
  { email: 'loadtest3@zigo.test', password: 'LoadTest123!' },
];

function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Cookie': `sb-access-token=${token}`,
  };
}

export function setup() {
  // Pre-create test users if needed
  // This would call a setup API
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const user = getRandomUser();
  const startTime = Date.now();
  
  // 1. Sign in
  const loginRes = http.post(`${data.baseUrl}/api/auth/sign-in`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has session': (r) => r.json('session') !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  apiLatency.add(loginRes.timings.duration);
  
  if (!loginSuccess) {
    sleep(1);
    return;
  }
  
  const token = loginRes.json('session.access_token');
  const headers = getAuthHeaders(token);
  
  // 2. Get home feed
  const feedStart = Date.now();
  const feedRes = http.get(`${BASE_URL}/api/feed`, { headers });
  pageLoadTime.add(Date.now() - feedStart);
  
  const feedSuccess = check(feedRes, {
    'feed status 200': (r) => r.status === 200,
    'feed has posts': (r) => Array.isArray(r.json('data')) || r.json('posts').length > 0,
  });
  
  errorRate.add(!feedSuccess);
  apiLatency.add(feedRes.timings.duration);
  
  // 3. Get profile
  const profileRes = http.get(`${BASE_URL}/api/profile`, { headers });
  check(profileRes, { 'profile status 200': (r) => r.status === 200 });
  apiLatency.add(profileRes.timings.duration);
  
  // 4. Get learn content
  const learnRes = http.get(`${BASE_URL}/api/learn`, { headers });
  check(learnRes, { 'learn status 200': (r) => r.status === 200 });
  apiLatency.add(learnRes.timings.duration);
  
  // 5. Get games check-limit
  const limitRes = http.get(`${BASE_URL}/api/games/check-limit`, { headers });
  check(limitRes, { 'limit status 200': (r) => r.status === 200 });
  apiLatency.add(limitRes.timings.duration);
  
  // 6. Simulate quiz attempt
  if (Math.random() < 0.3) {
    const quizRes = http.post(`${BASE_URL}/api/learn/quiz`, JSON.stringify({
      quizId: 'test-quiz-id',
      selectedOption: 0,
    }), { headers });
    check(quizRes, { 'quiz submit': (r) => [200, 201].includes(r.status) });
    apiLatency.add(quizRes.timings.duration);
  }
  
  // 7. Simulate video complete
  if (Math.random() < 0.2) {
    const videoRes = http.post(`${BASE_URL}/api/learn/video`, JSON.stringify({
      postId: 'test-post-id',
      secondsWatched: 60,
    }), { headers });
    check(videoRes, { 'video complete': (r) => [200, 201].includes(r.status) });
    apiLatency.add(videoRes.timings.duration);
  }
  
  // 8. Simulate game check-limit
  if (Math.random() < 0.2) {
    const gameLimitRes = http.get(`${BASE_URL}/api/games/check-limit`, { headers });
    check(gameLimitRes, { 'game limit': (r) => r.status === 200 });
    apiLatency.add(gameLimitRes.timings.duration);
  }
  
  // Total iteration time
  const totalTime = Date.now() - startTime;
  pageLoadTime.add(totalTime);
  
  sleep(Math.random() * 2 + 1); // 1-3 seconds between iterations
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
    'summary.html': htmlReport(data),
  };
}

// Helper to generate text summary
function textSummary(data, options) {
  const colors = options.enableColors ? {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
  } : { green: '', red: '', yellow: '', reset: '' };
  
  const metrics = data.metrics;
  let output = '\n=== LOAD TEST SUMMARY ===\n';
  
  output += `\n${colors.green}HTTP Requests:${colors.reset}\n`;
  output += `  Total: ${metrics.http_reqs.values.count}\n`;
  output += `  Failed: ${metrics.http_req_failed.values.passes} (${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%)\n`;
  output += `  Duration (avg): ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `  Duration (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `  Duration (p99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  
  output += `\n${colors.green}Custom Metrics:${colors.reset}\n`;
  output += `  Errors Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  output += `  API Latency (avg): ${metrics.api_latency.values.avg.toFixed(2)}ms\n`;
  output += `  Page Load Time (avg): ${metrics.page_load_time.values.avg.toFixed(2)}ms\n`;
  
  output += `\n${colors.green}Thresholds:${colors.reset}\n`;
  for (const [name, threshold] of Object.entries(data.thresholds)) {
    const passed = threshold.ok;
    output += `  ${name}: ${passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`}\n`;
  }
  
  return output;
}

function htmlReport(data) {
  return `<!DOCTYPE html>
<html><head><title>Load Test Report</title></head>
<body><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
}