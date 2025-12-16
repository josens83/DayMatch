/**
 * Commitlint 설정
 * Conventional Commits 규칙 적용
 * https://www.conventionalcommits.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 타입 규칙
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새로운 기능
        'fix',      // 버그 수정
        'docs',     // 문서 변경
        'style',    // 코드 스타일 (포맷팅 등)
        'refactor', // 리팩토링
        'perf',     // 성능 개선
        'test',     // 테스트 추가/수정
        'build',    // 빌드 시스템 변경
        'ci',       // CI 설정 변경
        'chore',    // 기타 변경사항
        'revert',   // 커밋 되돌리기
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // 제목 규칙
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0], // 한글 커밋 메시지 허용

    // 본문 규칙
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // 푸터 규칙
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],

    // 헤더 규칙
    'header-max-length': [2, 'always', 100],
  },
  // 도움말 URL
  helpUrl:
    'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
