// services/rcMatcher.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * rc 코드로 인플루언서 userId 반환
 * - rc 형식: inf-<member_id> (관리자 승인 시 부여/유지)
 * - 없거나 잘못되면 null
 */
async function resolveInfluencerIdFromRc(rc) {
  if (!rc || typeof rc !== 'string') return null;
  // rc가 inf-12345 형태라고 가정
  const m = rc.match(/^inf-(\d+)$/i);
  if (!m) return null;
  const memberId = parseInt(m[1], 10);
  if (Number.isNaN(memberId)) return null;

  // User 테이블에서 member_id로 찾거나, roles 테이블에서 찾아 매핑
  // 아래는 예시: User에 cafe24MemberId가 있다고 가정. 없으면 roles 테이블로 대체하세요.
  const user = await prisma.user.findFirst({
    where: {
      role: 'INFLUENCER',
      cafe24MemberId: memberId,
    },
    select: { id: true },
  });
  return user?.id ?? null;
}

module.exports = { resolveInfluencerIdFromRc };
