#!/usr/bin/env node
/* global console, process */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DEPLOYMENTS_FILE = join(process.cwd(), ".deployments.json");

function loadDeployments() {
  if (!existsSync(DEPLOYMENTS_FILE)) {
    return { current: null, previous: null, history: [] };
  }
  return JSON.parse(readFileSync(DEPLOYMENTS_FILE, "utf8"));
}

function saveDeployments(data) {
  writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(data, null, 2));
}

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: "inherit", ...options });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const deployments = loadDeployments();

  switch (command) {
    case "list": {
      console.log("=== Deployment History ===");
      if (deployments.history.length === 0) {
        console.log("No deployments recorded");
      } else {
        deployments.history.forEach((d, i) => {
          const marker = d.sha === deployments.current?.sha ? " <- CURRENT" : "";
          const prevMarker = d.sha === deployments.previous?.sha ? " <- PREVIOUS" : "";
          console.log(`${i + 1}. ${d.timestamp} | ${d.sha.slice(0, 7)} | ${d.env} | ${d.status}${marker}${prevMarker}`);
          console.log(`   Message: ${d.message}`);
        });
      }
      break;
    }

    case "current": {
      if (!deployments.current) {
        console.log("No current deployment");
        process.exit(1);
      }
      console.log(`Current: ${deployments.current.sha.slice(0, 7)} (${deployments.current.env})`);
      console.log(`Deployed: ${deployments.current.timestamp}`);
      console.log(`Message: ${deployments.current.message}`);
      break;
    }

    case "previous": {
      if (!deployments.previous) {
        console.log("No previous deployment to rollback to");
        process.exit(1);
      }
      console.log(`Previous: ${deployments.previous.sha.slice(0, 7)} (${deployments.previous.env})`);
      console.log(`Deployed: ${deployments.previous.timestamp}`);
      console.log(`Message: ${deployments.previous.message}`);
      break;
    }

    case "record": {
      const env = args[1] || "production";
      const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
      const message = execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
      const timestamp = new Date().toISOString();

      const deployment = { sha, env, message, timestamp, status: "success" };

      deployments.previous = deployments.current;
      deployments.current = deployment;
      deployments.history.unshift(deployment);
      deployments.history = deployments.history.slice(0, 50);

      saveDeployments(deployments);
      console.log(`Recorded deployment: ${sha.slice(0, 7)} (${env})`);
      break;
    }

    case "rollback": {
      if (!deployments.previous) {
        console.error("No previous deployment to rollback to");
        process.exit(1);
      }

      console.log(`Rolling back to: ${deployments.previous.sha.slice(0, 7)}`);
      console.log(`Current was: ${deployments.current.sha.slice(0, 7)}`);

      // Git checkout previous
      run(`git checkout ${deployments.previous.sha} -- .`);

      // Rebuild and redeploy
      run("npm run build:safe");

      // Deploy based on environment
      if (deployments.previous.env === "production") {
        run("npx vercel --prod --token=$VERCEL_TOKEN");
      } else if (deployments.previous.env === "staging") {
        run("npx vercel --token=$VERCEL_TOKEN");
      }

      // Update deployment record
      const rolledBack = { ...deployments.previous, timestamp: new Date().toISOString(), status: "rollback" };
      deployments.previous = deployments.current;
      deployments.current = rolledBack;
      deployments.history.unshift(rolledBack);
      saveDeployments(deployments);

      console.log("Rollback completed successfully");
      break;
    }

    case "blue-green": {
      // Blue-green deployment for Hetzner
      console.log("Starting blue-green deployment...");
      const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
      const timestamp = new Date().toISOString();

      // Build new version
      run("npm run build:safe");

      // Deploy to blue (inactive) environment
      console.log("Deploying to blue environment...");
      run("docker-compose -f docker-compose.yml -f docker-compose.blue.yml up -d --build");

      // Health check blue
      console.log("Health checking blue...");
      await healthCheck("blue");

      // Switch nginx to blue
      console.log("Switching traffic to blue...");
      run("docker-compose exec nginx nginx -s reload");

      // Health check after switch
      await healthCheck("production");

      // Decommission green
      console.log("Decommissioning green...");
      run("docker-compose -f docker-compose.yml -f docker-compose.green.yml down");

      // Record
      const deployment = { sha, env: "production", message: "Blue-green deployment", timestamp, status: "success" };
      deployments.previous = deployments.current;
      deployments.current = deployment;
      deployments.history.unshift(deployment);
      saveDeployments(deployments);

      console.log("Blue-green deployment completed");
      break;
    }

    case "verify": {
      const env = args[1] || "production";
      const url = env === "production" ? "https://zigo.app" : "https://staging.zigo.app";

      console.log(`Verifying deployment at ${url}...`);
      const health = await fetch(`${url}/health`);
      if (health.ok) {
        console.log("✅ Health check passed");
      } else {
        console.error("❌ Health check failed");
        process.exit(1);
      }
      break;
    }

    default:
      console.log(`
Usage: node scripts/deploy-rollback.mjs <command>

Commands:
  list           - List deployment history
  current        - Show current deployment
  previous       - Show previous deployment
  record <env>   - Record current deployment (production|staging)
  rollback       - Rollback to previous deployment
  blue-green     - Run blue-green deployment (Hetzner)
  verify <env>   - Verify deployment health
      `);
  }
}

async function healthCheck(env) {
  const url = env === "blue" ? "http://localhost:3001/health" : "https://zigo.app/health";
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`Health check passed for ${env}`);
        return;
      }
    } catch {
      // ignore
    }
    attempts++;
    console.log(`Health check attempt ${attempts}/${maxAttempts}...`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Health check failed for ${env}`);
}

main().catch(console.error);