import OpenAI from 'openai';
import { z } from 'zod';
import { analyzeStatically } from '../utils/staticAnalyzer.js';

const FindingSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['bug', 'security', 'unused-code', 'duplicate-code', 'performance', 'readability', 'maintainability']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  line: z.number().int().positive(),
  endLine: z.number().int().positive().optional(),
  title: z.string(),
  message: z.string(),
  suggestedFix: z.string().default(''),
  snippet: z.string().default('')
});

const ReviewSchema = z.object({
  summary: z.string(),
  findings: z.array(FindingSchema),
  scores: z.object({
    security: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    performance: z.number().min(0).max(100),
    maintainability: z.number().min(0).max(100),
    overall: z.number().min(0).max(100)
  })
});

export async function reviewCode({ code, language, filename }) {
  const fallback = analyzeStatically(code);

  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ...fallback, model: 'static-fallback' };
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-5.2';
    const response = await client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are a senior application security and performance code reviewer. Return only strict JSON matching the requested schema. Review for bugs, security vulnerabilities, unused code, duplicate code, performance issues, readability, maintainability, and concrete fixes.'
        },
        {
          role: 'user',
          content: `Review this ${language} file named ${filename}. Use 1-based line numbers. JSON schema: { "summary": string, "findings": [{ "type": "bug|security|unused-code|duplicate-code|performance|readability|maintainability", "severity": "low|medium|high|critical", "line": number, "endLine": number optional, "title": string, "message": string, "suggestedFix": string, "snippet": string }], "scores": { "security": number, "readability": number, "performance": number, "maintainability": number, "overall": number } }\n\n${code}`
        }
      ],
      text: { format: { type: 'json_object' } }
    });

    const text = response.output_text || response.output?.[0]?.content?.[0]?.text;
    const parsed = ReviewSchema.parse(JSON.parse(text));
    parsed.findings = mergeFindings(parsed.findings, fallback.findings);

    return {
      ...parsed,
      findings: parsed.findings.map((finding, index) => ({
        ...finding,
        id: finding.id || `${finding.type}-${finding.line}-${index}`
      })),
      model
    };
  } catch (error) {
    console.error('OpenAI review failed, using static fallback:', error.message);
    return { ...fallback, model: 'static-fallback' };
  }
}

function mergeFindings(aiFindings, staticFindings) {
  const seen = new Set(aiFindings.map((finding) => `${finding.type}:${finding.line}:${finding.title}`));
  const merged = [...aiFindings];

  staticFindings.forEach((finding) => {
    const key = `${finding.type}:${finding.line}:${finding.title}`;
    if (!seen.has(key)) merged.push(finding);
  });

  return merged.slice(0, 80);
}
