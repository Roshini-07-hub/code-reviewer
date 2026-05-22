const securityPatterns = [
  { regex: /eval\s*\(/, title: 'Avoid eval', message: 'eval can execute attacker-controlled code.' },
  { regex: /innerHTML\s*=/, title: 'Unsafe HTML assignment', message: 'innerHTML can introduce XSS if content is not sanitized.' },
  { regex: /password\s*[:=]\s*['"][^'"]+['"]/i, title: 'Hard-coded secret', message: 'Secrets should come from a secure environment or vault.' },
  { regex: /document\.write\s*\(/, title: 'Avoid document.write', message: 'document.write can introduce XSS vulnerabilities and break content security policies.' },
  { regex: /\balert\s*\(/, title: 'Avoid alert()', message: 'alert() is disruptive and not suitable for production workflows.' }
];

const stylePatterns = [
  { regex: /\bvar\s+/, type: 'maintainability', severity: 'medium', title: 'Avoid var', message: 'var is function-scoped and can lead to subtle bugs; use let or const instead.' },
  { regex: /==\s*[^=]/, type: 'bug', severity: 'medium', title: 'Use strict equality', message: 'Loose equality can create unexpected type coercion.' },
  { regex: /!=\s*[^=]/, type: 'bug', severity: 'medium', title: 'Use strict inequality', message: 'Loose inequality can create unexpected type coercion.' }
];

export function analyzeLocally(code) {
  const lines = code.split('\n');
  const findings = [];
  const seen = new Map();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    securityPatterns.forEach((pattern) => {
      if (pattern.regex.test(line)) {
        findings.push(makeFinding('security', 'high', lineNumber, pattern.title, pattern.message, 'Use safer APIs and sanitize external input.', line));
      }
    });

    stylePatterns.forEach((pattern) => {
      if (pattern.regex.test(line)) {
        findings.push(makeFinding(pattern.type, pattern.severity, lineNumber, pattern.title, pattern.message, pattern.suggestedFix || 'Use a safer or more modern pattern.', line));
      }
    });

    if (/console\.log\s*\(/.test(line)) {
      findings.push(makeFinding('readability', 'low', lineNumber, 'Debug logging left in code', 'Console logs can leak data and add noise in production.', 'Use a structured logger with environment-aware log levels.', line));
    }

    if (/for\s*\(.+\.length/.test(line)) {
      findings.push(makeFinding('performance', 'medium', lineNumber, 'Repeated length lookup in loop', 'Repeated property lookups inside tight loops can be avoided.', 'Cache the collection length before the loop when performance matters.', line));
    }

    if (/TODO|FIXME/.test(line)) {
      findings.push(makeFinding('maintainability', 'low', lineNumber, 'Outstanding maintenance marker', 'TODO/FIXME comments should be tracked or resolved before merge.', 'Move the work into an issue or complete it now.', line));
    }

    if (trimmed.length > 15) {
      const previous = seen.get(trimmed);
      if (previous) {
        findings.push(makeFinding('duplicate-code', 'medium', lineNumber, 'Duplicate code line', `This line duplicates line ${previous}.`, 'Extract shared behavior or remove the duplicate statement.', line));
      } else {
        seen.set(trimmed, lineNumber);
      }
    }

    const unusedMatch = trimmed.match(/^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (unusedMatch) {
      const name = unusedMatch[2];
      const occurrences = code.match(new RegExp(`\\b${name}\\b`, 'g')) || [];
      if (occurrences.length === 1) {
        findings.push(makeFinding('unused-code', 'low', lineNumber, `Unused variable ${name}`, 'Declared values that are never read increase maintenance cost.', 'Remove the variable or use it intentionally.', line));
      }
    }
  });

  return {
    summary: findings.length ? `Found ${findings.length} local issues.` : 'No obvious local issues were found.',
    findings,
    scores: calculateScores(findings),
    model: 'local-static'
  };
}

function makeFinding(type, severity, line, title, message, suggestedFix, snippet) {
  return {
    id: `${type}-${line}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    line,
    title,
    message,
    suggestedFix,
    snippet: snippet.trim()
  };
}

function calculateScores(findings) {
  const penalty = { low: 3, medium: 7, high: 13, critical: 22 };
  const buckets = {
    security: 100,
    readability: 100,
    performance: 100,
    maintainability: 100
  };

  let totalPenalty = 0;
  findings.forEach((finding) => {
    const hit = penalty[finding.severity] || 5;
    totalPenalty += hit;
    if (finding.type === 'security') buckets.security -= hit;
    if (finding.type === 'readability' || finding.type === 'unused-code' || finding.type === 'duplicate-code') buckets.readability -= hit;
    if (finding.type === 'performance') buckets.performance -= hit;
    if (finding.type === 'maintainability' || finding.type === 'bug') buckets.maintainability -= hit;
  });

  Object.keys(buckets).forEach((key) => {
    buckets[key] = Math.max(0, Math.min(100, Math.round(buckets[key])));
  });

  const categoryAverage = Math.round((buckets.security + buckets.readability + buckets.performance + buckets.maintainability) / 4);
  const penaltyScore = Math.max(0, 100 - totalPenalty);

  return {
    ...buckets,
    overall: Math.round((categoryAverage + penaltyScore) / 2)
  };
}
