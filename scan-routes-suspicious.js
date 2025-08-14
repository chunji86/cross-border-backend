#!/usr/bin/env node
/**
 * scan-routes-suspicious.js
 * - 라우터 정의의 "1번째 인자(경로 문자열)"에 위험 문법이 있는지 찾습니다.
 * - 찾는 패턴:
 *   1) 라우트 첫 인자에 '?' 포함  (쿼리를 경로에 넣은 경우)
 *   2) 잘못된 ':' 사용 (예: '/user/:', '/path/:-id')
 *   3) 괄호 '()' 포함 (정규 옵션 문법을 실수로 문자열에 넣은 경우)
 *   4) '*' 와일드카드 오남용 (문자열 경로에서 광범위 사용)
 * - app|router 의 use/get/post/put/patch/delete/all 대상
 * - node_modules/.git 제외
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out']);
const EXTS = new Set(['.js']);
const CALLERS = ['app','router'];
const METHODS = ['use','get','post','put','patch','delete','all'];

// 1번째 인자로 "문자열"이 들어간 라우트 캡처
const ROUTE_STR_RX = new RegExp(
  String.raw`(?:^|\W)(?:${CALLERS.join('|')})\s*\.\s*(?:${METHODS.join('|')})\s*\(\s*(['"])([^'"]+)\1`,
  'i'
);

let hits = 0;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext)) scanFile(path.join(dir, e.name));
    }
  }
}

function report(fp, ln, line, reason, pathStr) {
  hits++;
  console.log(`\n[!] Suspicious route at ${fp}:${ln}`);
  console.log(`    Reason: ${reason}`);
  console.log(`    Path  : ${pathStr}`);
  console.log(`    Line  : ${line.trim()}`);
}

function scanFile(fp) {
  let text;
  try { text = fs.readFileSync(fp, 'utf8'); } catch { return; }

  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const m = ROUTE_STR_RX.exec(line);
    if (!m) return;

    const routePath = m[2]; // 1번째 인자 문자열
    // 1) 경로에 쿼리문자 '?' 가 들어감 ← 거의 100% 오류
    if (routePath.includes('?')) {
      report(fp, idx+1, line, "Path string contains '?'. Use req.query instead.", routePath);
    }
    // 2) 잘못된 콜론 사용 (콜론 뒤에 이름이 없음, 혹은 특수문자 시작)
    if (/\/:($|[^A-Za-z0-9_])/.test(routePath)) {
      report(fp, idx+1, line, "Bad parameter token after ':'. Example valid: '/user/:id'", routePath);
    }
    // 3) 괄호 포함(문자열 경로에서 ()는 path-to-regexp 문법으로 해석됨 → 실수 많음)
    if (/[()]/.test(routePath)) {
      report(fp, idx+1, line, "Parentheses '( )' in path. Remove or handle in code.", routePath);
    }
    // 4) 광범위 '*'
    if (/\*/.test(routePath)) {
      report(fp, idx+1, line, "Wildcard '*' found. Check if necessary.", routePath);
    }
  });
}

console.log(`🔎 Scanning suspicious route patterns in ${ROOT} ...`);
walk(ROOT);
console.log(`\n✅ Scan finished. Suspicious count: ${hits}`);
if (hits === 0) {
  console.log('✨ No obviously suspicious route patterns found.');
} else {
  console.log('⚠️ Please fix the above paths:');
  console.log("   - Remove '?' from path strings (use req.query)");
  console.log("   - Use '/:name' with a valid name (no bare ':')");
  console.log("   - Avoid parentheses '()' in string paths");
  console.log("   - Review wildcard '*'");
}
