#!/usr/bin/env node
/**
 * find-fullurl-in-routes.js
 * - 라우터 정의에 풀 URL이 들어간 경우를 탐지합니다.
 * - 기본 대상: .js 파일 (node_modules, .git 제외)
 * - 패턴: app.use|get|post|put|patch|delete('http...'), router.use|get|post|put|patch|delete('http...')
 * - 옵션:
 *   --fix : 자동 수정(백업 .bak 생성). "https://도메인"을 제거하고 경로만 남깁니다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out']);
const EXTS = new Set(['.js']); // 필요 시 .mjs, .cjs 추가 가능

const routeMethods = ['use','get','post','put','patch','delete'];
const callers = ['app','router'];
const PATTERNS = [];

// (app|router).(method)('http://...'  or  "http://...")
for (const caller of callers) {
  for (const method of routeMethods) {
    PATTERNS.push(new RegExp(
      String.raw`${caller}\s*\.\s*${method}\s*\(\s*['"]https?:\/\/`,
      'i'
    ));
  }
}

const ARG0_CAPTURE = new RegExp(
  // (app|router).(method) (    'http...something'   )
  String.raw`(?:app|router)\s*\.\s*(?:use|get|post|put|patch|delete)\s*\(\s*(['"])(https?:\/\/[^'"]+)([^'"]*)\1`,
  'i'
);

// 옵션
const FIX = process.argv.includes('--fix');

let found = 0;
let fixed = 0;

/** DFS */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext)) scanFile(path.join(dir, e.name));
    }
  }
}

/** 스캔 + (선택) 수정 */
function scanFile(fp) {
  let text;
  try { text = fs.readFileSync(fp, 'utf8'); }
  catch { return; }

  const lines = text.split(/\r?\n/);
  let dirty = false;

  lines.forEach((line, idx) => {
    // 빠른 필터(성능)
    if (!/https?:\/\//i.test(line)) return;

    // 주석 라인 대충 스킵 (완벽하진 않지만 오탐 줄임)
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) return;

    // 패턴 매칭
    for (const rx of PATTERNS) {
      if (rx.test(line)) {
        found++;
        const ln = idx + 1;
        console.log(`\n[!] FULL URL IN ROUTE  ->  ${fp}:${ln}`);
        console.log(`    ${line}`);

        if (FIX) {
          // 첫 번째 인자에서 origin 제거
          const before = line;
          const m = ARG0_CAPTURE.exec(line);
          if (m) {
            const quote = m[1];
            const full = m[2] + m[3]; // "https://domain.tld" + "/path..."
            try {
              const u = new URL(full);
              const onlyPath = u.pathname + (u.search || '') + (u.hash || '');
              const replaced = before.replace(m[0], `${m[0].replace(full, onlyPath)}`);
              if (replaced !== before) {
                lines[idx] = replaced;
                dirty = true;
                fixed++;
                console.log(`    → FIXED: origin 제거 -> 경로만 사용: ${onlyPath}`);
              }
            } catch (e) {
              console.warn('    (skip) URL 파싱 실패, 수동 수정 필요');
            }
          } else {
            console.warn('    (skip) 인자 캡처 실패, 수동 수정 필요');
          }
        }
        break;
      }
    }
  });

  if (FIX && dirty) {
    // 백업 저장
    const bak = fp + '.bak';
    try { fs.copyFileSync(fp, bak, fs.constants.COPYFILE_EXCL); }
    catch { /* 이미 있으면 덮지 않음 */ }
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
  }
}

console.log(`🔎 Scanning ${ROOT} ...`);
walk(ROOT);
console.log(`\n✅ Scan completed. Found: ${found}${FIX ? `, Fixed: ${fixed}` : ''}`);
if (found === 0) {
  console.log('✨ 라우트에 풀 URL 사용 흔적이 없습니다.');
} else if (!FIX) {
  console.log('⚠️ 위 라인들을 "/api/..." 같은 상대 경로로 바꾸세요. (또는 --fix 옵션을 사용)');
}
