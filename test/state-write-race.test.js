import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const worker = path.join(__dirname, "fixtures", "state-write-race-worker.mjs");

function runWorker(stateDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker, stateDir]);
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stderr }));
  });
}

test("concurrent writeJsonFile callers never collide on the same tmp path", async () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "backpass-write-race-"));

  const results = await Promise.all([1, 2, 3, 4, 5, 6].map(() => runWorker(stateDir)));

  for (const { code, stderr } of results) {
    assert.equal(code, 0, stderr);
    assert.doesNotMatch(stderr, /ENOENT/);
  }

  const cache = JSON.parse(fs.readFileSync(path.join(stateDir, "scan-cache.json"), "utf8"));
  assert.equal(cache.version, 1);

  const leftoverTmp = fs.readdirSync(stateDir).filter((name) => name.includes(".tmp."));
  assert.deepEqual(leftoverTmp, []);
});
