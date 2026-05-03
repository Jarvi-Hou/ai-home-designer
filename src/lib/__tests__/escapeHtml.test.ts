import { escapeHtml } from '../utils';

describe('escapeHtml', () => {
  // □ script 标签 → 转义
  it('<script>alert(1)</script> → 转义', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  // □ 双引号 → &quot;
  it('"hello" → &quot;hello&quot;', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  // □ 单引号 → &#39;
  it("it's → it&#39;s", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  // □ & 符号 → &amp;
  it('a & b → a &amp; b', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  // □ null/undefined → ''
  it('null → 空字符串', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('undefined → 空字符串', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  // □ 普通中文字符串 → 原样返回
  it('普通中文字符串 → 原样返回', () => {
    expect(escapeHtml('奶油风装修方案')).toBe('奶油风装修方案');
  });

  // □ 综合：多个特殊字符混合
  it('多个特殊字符混合', () => {
    expect(escapeHtml('Tom & Jerry\'s "house" <home>')).toBe(
      'Tom &amp; Jerry&#39;s &quot;house&quot; &lt;home&gt;'
    );
  });
});
