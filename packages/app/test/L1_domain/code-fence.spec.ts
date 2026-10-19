import { describe, expect, it } from 'vitest';
import { languageName, splitCode } from '../../src/L1_domain/code-fence';

const FENCE = '```';

describe('splitCode', () => {
  it('takes fenced code out of the prose, with its language', () => {
    const raw =
      'I replaced the client:\n' + FENCE + 'ts\nconst a = 1;\nconst b = 2;\n' + FENCE + '\nDone.';
    expect(splitCode(raw)).toEqual([
      { kind: 'text', text: 'I replaced the client:' },
      { kind: 'code', language: 'ts', code: 'const a = 1;\nconst b = 2;' },
      { kind: 'text', text: 'Done.' },
    ]);
  });

  it('leaves prose without a fence as one piece', () => {
    expect(splitCode('just `inline` code')).toEqual([{ kind: 'text', text: 'just `inline` code' }]);
  });

  it('reads the language before any info after it, and a fence indented in a list', () => {
    const raw = '1. Run:\n   ' + FENCE + 'sh title=run\n   npm test\n   ' + FENCE;
    expect(splitCode(raw)).toEqual([
      { kind: 'text', text: '1. Run:' },
      { kind: 'code', language: 'sh', code: '   npm test' },
    ]);
  });

  it('drops blank prose between two blocks', () => {
    const raw = FENCE + '\na\n' + FENCE + '\n  \n' + FENCE + '\nb\n' + FENCE;
    expect(splitCode(raw).map((p) => p.kind)).toEqual(['code', 'code']);
  });

  it('keeps a fence still being written as code to the end, with no language', () => {
    expect(splitCode(FENCE + '\nnpm test')).toEqual([
      { kind: 'code', language: '', code: 'npm test' },
    ]);
  });
});

describe('languageName', () => {
  it('names a code block by its language, spelled out, and plain code when the fence names none', () => {
    expect(languageName('ts')).toBe('typescript');
    expect(languageName('TSX')).toBe('tsx');
    expect(languageName('js')).toBe('javascript');
    expect(languageName('py')).toBe('python');
    expect(languageName('sh')).toBe('shell');
    expect(languageName('rust')).toBe('rust');
    expect(languageName('')).toBe('code');
  });
});
