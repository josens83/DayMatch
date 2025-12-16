/**
 * lint-staged 설정
 * 커밋 시 변경된 파일에만 린터와 포맷터 실행
 */
module.exports = {
  // Backend TypeScript 파일
  'backend/**/*.ts': (filenames) => {
    const files = filenames.join(' ');
    return [
      // ESLint 실행 (자동 수정)
      `cd backend && eslint --fix ${files}`,
      // Prettier 실행
      `cd backend && prettier --write ${files}`,
      // TypeScript 타입 체크 (변경된 파일만)
      'cd backend && tsc --noEmit',
    ];
  },

  // Admin TypeScript/React 파일
  'admin/**/*.{ts,tsx}': (filenames) => {
    const files = filenames.join(' ');
    return [
      `cd admin && eslint --fix ${files}`,
      `cd admin && prettier --write ${files}`,
      'cd admin && tsc --noEmit',
    ];
  },

  // Mobile TypeScript/React Native 파일
  'mobile/**/*.{ts,tsx}': (filenames) => {
    const files = filenames.join(' ');
    return [
      `cd mobile && prettier --write ${files}`,
      'cd mobile && tsc --noEmit',
    ];
  },

  // JSON 파일 (설정 파일 등)
  '*.json': ['prettier --write'],

  // Markdown 파일
  '*.md': ['prettier --write'],

  // YAML 파일 (GitHub Actions 등)
  '*.{yml,yaml}': ['prettier --write'],
};
