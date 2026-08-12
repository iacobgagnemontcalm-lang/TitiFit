import { BENCHMARK_TABLES } from '@/data/benchmarks/tables';
import type { BenchmarkDistribution, BenchmarkProvider, Sex, TestId } from '@/types';

/**
 * Default provider, backed by the hand-built simulated tables.
 *
 * Swap it at app start with any other implementation of `BenchmarkProvider`
 * (Supabase, REST, on-device SQLite …) — nothing above this layer changes.
 */
export class MockBenchmarkProvider implements BenchmarkProvider {
  readonly id = 'mock-simulated-v1';

  private readonly index = new Map<string, BenchmarkDistribution>();

  constructor(distributions: BenchmarkDistribution[] = BENCHMARK_TABLES) {
    for (const d of distributions) this.index.set(`${d.testId}:${d.sex}`, d);
  }

  getDistribution(testId: TestId, sex: Sex): BenchmarkDistribution | undefined {
    if (sex !== 'other') return this.index.get(`${testId}:${sex}`);
    return this.blended(testId);
  }

  /**
   * `other` is ranked against a 50/50 blend of both curves. This is a
   * placeholder policy — with real data we would build a dedicated pool.
   */
  private blended(testId: TestId): BenchmarkDistribution | undefined {
    const male = this.index.get(`${testId}:male`);
    const female = this.index.get(`${testId}:female`);
    if (!male || !female) return male ?? female;

    return {
      testId,
      sex: 'other',
      anchors: male.anchors.map((a, i) => ({
        percentile: a.percentile,
        value: (a.value + (female.anchors[i]?.value ?? a.value)) / 2,
      })),
      referenceAge: male.referenceAge,
      referenceBodyWeightKg:
        (male.referenceBodyWeightKg + female.referenceBodyWeightKg) / 2,
      source: { ...male.source, label: `${male.source.label} (mixte)` },
    };
  }
}
