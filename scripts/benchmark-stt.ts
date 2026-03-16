/// <reference types="node" />
/**
 * MNSC STT Benchmark — Singlish Speech-to-Text accuracy evaluation.
 *
 * Usage:
 *   npx tsx scripts/benchmark-stt.ts
 *   npx tsx scripts/benchmark-stt.ts --json
 *   npx tsx scripts/benchmark-stt.ts --threshold 0.1
 */

interface TestCase {
  id: string;
  category: "daily" | "medical" | "emotional" | "campus" | "colloquial";
  expected: string;
  /**
   * Simulated STT output. In a real pipeline this comes from an STT engine;
   * here we hard-code plausible outputs so the framework validates end-to-end.
   */
  actual: string;
}

interface CaseResult {
  id: string;
  category: TestCase["category"];
  expected: string;
  actual: string;
  wer: number;
  substitutions: number;
  insertions: number;
  deletions: number;
}

interface BenchmarkSummary {
  totalCases: number;
  averageWER: number;
  medianWER: number;
  bestCases: CaseResult[];
  worstCases: CaseResult[];
  byCategory: Record<string, { count: number; averageWER: number }>;
  results: CaseResult[];
}

const TEST_CASES: TestCase[] = [
  {
    id: "daily-01",
    category: "daily",
    expected: "Cannot walk already lah",
    actual: "Cannot walk already lah",
  },
  {
    id: "daily-02",
    category: "daily",
    expected: "Got fall last month",
    actual: "Got fall last month",
  },
  {
    id: "daily-03",
    category: "daily",
    expected: "Take medicine already",
    actual: "Take medicine already",
  },
  {
    id: "daily-04",
    category: "daily",
    expected: "Very pain one, the knee",
    actual: "Very pain one the knee",
  },
  {
    id: "daily-05",
    category: "daily",
    expected: "Everyday must use wheelchair",
    actual: "Every day must use wheelchair",
  },
  {
    id: "daily-06",
    category: "daily",
    expected: "Cannot bathe by herself",
    actual: "Cannot bathe by herself",
  },

  {
    id: "med-01",
    category: "medical",
    expected: "She got dementia",
    actual: "She got dementia",
  },
  {
    id: "med-02",
    category: "medical",
    expected: "Need physiotherapy",
    actual: "Need physiotherapy",
  },
  {
    id: "med-03",
    category: "medical",
    expected: "Go polyclinic every month",
    actual: "Go polyclinic every month",
  },
  {
    id: "med-04",
    category: "medical",
    expected: "Doctor say must do blood test",
    actual: "Doctor say must do blood test",
  },
  {
    id: "med-05",
    category: "medical",
    expected: "Her sugar level very high",
    actual: "Her sugar level very high",
  },
  {
    id: "med-06",
    category: "medical",
    expected: "Take insulin two times a day",
    actual: "Take insulin two times a day",
  },
  {
    id: "med-07",
    category: "medical",
    expected: "Need to go specialist at SGH",
    actual: "Need to go specialist at SGH",
  },

  {
    id: "emo-01",
    category: "emotional",
    expected: "Aiyo, stress ah, take care of mother",
    actual: "I you stress are take care of mother",
  },
  {
    id: "emo-02",
    category: "emotional",
    expected: "Very tiring one, nobody help me",
    actual: "Very tiring one nobody help me",
  },
  {
    id: "emo-03",
    category: "emotional",
    expected: "She keep forgetting things already",
    actual: "She keep forgetting things already",
  },
  {
    id: "emo-04",
    category: "emotional",
    expected: "I scared she fall again",
    actual: "I scared she fall again",
  },
  {
    id: "emo-05",
    category: "emotional",
    expected: "Don't know how to cope sometimes",
    actual: "Don't know how to cope sometimes",
  },

  {
    id: "campus-01",
    category: "campus",
    expected: "Where is the library ah",
    actual: "Where is the library",
  },
  {
    id: "campus-02",
    category: "campus",
    expected: "Can go canteen by which way",
    actual: "Can go canteen by which way",
  },
  {
    id: "campus-03",
    category: "campus",
    expected: "The lecture hall very far leh",
    actual: "The lecture hall very far",
  },

  {
    id: "coll-01",
    category: "colloquial",
    expected: "Wah, this one damn jialat sia",
    actual: "Wah this one damn jialat sia",
  },
  {
    id: "coll-02",
    category: "colloquial",
    expected: "Auntie say pain pain go away",
    actual: "Auntie say pain pain go away",
  },
  {
    id: "coll-03",
    category: "colloquial",
    expected: "Confirm plus chop must rest more",
    actual: "Confirm plus chop must rest more",
  },
  {
    id: "coll-04",
    category: "colloquial",
    expected: "Walao eh, wait so long for appointment",
    actual: "While I wait so long for appointment",
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

interface EditDistanceResult {
  distance: number;
  substitutions: number;
  insertions: number;
  deletions: number;
}

/**
 * Minimum edit distance on word tokens, tracking substitution/insertion/deletion
 * counts separately for detailed WER breakdown.
 */
function editDistance(ref: string[], hyp: string[]): EditDistanceResult {
  const n = ref.length;
  const m = hyp.length;

  const dp: { cost: number; subs: number; ins: number; del: number }[][] = [];

  for (let i = 0; i <= n; i++) {
    dp[i] = [];
    for (let j = 0; j <= m; j++) {
      dp[i][j] = { cost: 0, subs: 0, ins: 0, del: 0 };
    }
  }

  for (let i = 1; i <= n; i++) {
    dp[i][0] = { cost: i, subs: 0, ins: 0, del: i };
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = { cost: j, subs: 0, ins: j, del: 0 };
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (ref[i - 1] === hyp[j - 1]) {
        dp[i][j] = { ...dp[i - 1][j - 1] };
      } else {
        const sub = dp[i - 1][j - 1].cost + 1;
        const ins = dp[i][j - 1].cost + 1;
        const del = dp[i - 1][j].cost + 1;
        const min = Math.min(sub, ins, del);

        if (min === sub) {
          dp[i][j] = {
            cost: sub,
            subs: dp[i - 1][j - 1].subs + 1,
            ins: dp[i - 1][j - 1].ins,
            del: dp[i - 1][j - 1].del,
          };
        } else if (min === ins) {
          dp[i][j] = {
            cost: ins,
            subs: dp[i][j - 1].subs,
            ins: dp[i][j - 1].ins + 1,
            del: dp[i][j - 1].del,
          };
        } else {
          dp[i][j] = {
            cost: del,
            subs: dp[i - 1][j].subs,
            ins: dp[i - 1][j].ins,
            del: dp[i - 1][j].del + 1,
          };
        }
      }
    }
  }

  const result = dp[n][m];
  return {
    distance: result.cost,
    substitutions: result.subs,
    insertions: result.ins,
    deletions: result.del,
  };
}

function calculateWER(expected: string, actual: string): EditDistanceResult & { wer: number } {
  const ref = tokenize(expected);
  const hyp = tokenize(actual);

  if (ref.length === 0) {
    return {
      wer: hyp.length === 0 ? 0 : 1,
      distance: hyp.length,
      substitutions: 0,
      insertions: hyp.length,
      deletions: 0,
    };
  }

  const result = editDistance(ref, hyp);
  return {
    ...result,
    wer: result.distance / ref.length,
  };
}

function runBenchmark(cases: TestCase[]): BenchmarkSummary {
  const results: CaseResult[] = cases.map((tc) => {
    const wer = calculateWER(tc.expected, tc.actual);
    return {
      id: tc.id,
      category: tc.category,
      expected: tc.expected,
      actual: tc.actual,
      wer: wer.wer,
      substitutions: wer.substitutions,
      insertions: wer.insertions,
      deletions: wer.deletions,
    };
  });

  const wers = results.map((r) => r.wer);
  const sorted = [...wers].sort((a, b) => a - b);
  const averageWER = wers.reduce((sum, w) => sum + w, 0) / wers.length;
  const medianWER =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const sortedResults = [...results].sort((a, b) => a.wer - b.wer);
  const bestCases = sortedResults.slice(0, 5);
  const worstCases = sortedResults.slice(-5).reverse();

  const byCategory: Record<string, { count: number; averageWER: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { count: 0, averageWER: 0 };
    }
    byCategory[r.category].count++;
    byCategory[r.category].averageWER += r.wer;
  }
  for (const key of Object.keys(byCategory)) {
    byCategory[key].averageWER = byCategory[key].averageWER / byCategory[key].count;
  }

  return { totalCases: cases.length, averageWER, medianWER, bestCases, worstCases, byCategory, results };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function printTable(summary: BenchmarkSummary): void {
  const divider = "─".repeat(90);

  console.log("\n" + divider);
  console.log("  MNSC STT Benchmark Results");
  console.log(divider);

  console.log(`\n  Total test cases : ${summary.totalCases}`);
  console.log(`  Average WER      : ${formatPercent(summary.averageWER)}`);
  console.log(`  Median WER       : ${formatPercent(summary.medianWER)}`);

  console.log(`\n  WER by Category:`);
  for (const [cat, data] of Object.entries(summary.byCategory).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`    ${cat.padEnd(12)} ${formatPercent(data.averageWER).padStart(6)}  (${data.count} cases)`);
  }

  console.log(`\n  ${divider}`);
  console.log(
    `  ${"ID".padEnd(12)} ${"WER".padStart(6)}  ${"S".padStart(2)} ${"I".padStart(2)} ${"D".padStart(2)}  Expected → Actual`
  );
  console.log(`  ${divider}`);

  for (const r of summary.results) {
    const mark = r.wer === 0 ? "✓" : "✗";
    const line =
      `  ${mark} ${r.id.padEnd(12)} ${formatPercent(r.wer).padStart(6)}  ` +
      `${String(r.substitutions).padStart(2)} ${String(r.insertions).padStart(2)} ${String(r.deletions).padStart(2)}  ` +
      `"${r.expected}"` +
      (r.wer > 0 ? ` → "${r.actual}"` : "");
    console.log(line);
  }

  console.log(`\n  Worst 5 Cases:`);
  for (const r of summary.worstCases) {
    console.log(`    ${r.id.padEnd(12)} WER ${formatPercent(r.wer).padStart(6)}  "${r.expected}" → "${r.actual}"`);
  }

  console.log(`\n  Best 5 Cases:`);
  for (const r of summary.bestCases) {
    console.log(`    ${r.id.padEnd(12)} WER ${formatPercent(r.wer).padStart(6)}  "${r.expected}"`);
  }

  console.log("\n" + divider + "\n");
}

function main(): void {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const thresholdIdx = args.indexOf("--threshold");
  const threshold = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1]) : null;

  const summary = runBenchmark(TEST_CASES);

  if (jsonMode) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printTable(summary);
  }

  if (threshold !== null) {
    if (summary.averageWER > threshold) {
      console.error(
        `\n  ✗ FAIL: Average WER ${formatPercent(summary.averageWER)} exceeds threshold ${formatPercent(threshold)}\n`
      );
      process.exit(1);
    } else {
      console.log(
        `\n  ✓ PASS: Average WER ${formatPercent(summary.averageWER)} within threshold ${formatPercent(threshold)}\n`
      );
    }
  }
}

main();
