// services/rewardEngine.js
/**
 * 금액 * (bps/10000). 예: 500bps => 5%
 * 소수점은 절사(Math.floor)로 통일
 */
function calcByBps(amount, bps) {
  const v = Math.max(0, Number(amount || 0));
  const rate = Math.max(0, Number(bps || 0));
  return Math.floor(v * rate / 10000);
}

/**
 * 상태 버킷 구분: 확정(confirmed) vs 대기(pending)
 * - 지금은 간단 룰: '구매확정/배송완료' 포함시 확정 처리
 */
function bucketByStatus(status) {
  const s = String(status || '').toLowerCase();
  const confirmed = ['delivered', 'completed', 'purchase_confirmed', '구매확정', '배송완료'];
  return confirmed.some(k => s.includes(k)) ? 'CONFIRMED' : 'PENDING';
}

/**
 * 규칙 조회(간단 버전): 우선순위
 *  1) 상품별 오버라이드
 *  2) 공급사 기본률
 *  3) 플랫폼 기본률(예: 5% = 500bps)
 * 실제 규칙은 추후 DB 기반으로 교체 예정.
 */
function resolveBps({ productBps, vendorBps, defaultBps = 500 }) {
  if (Number(productBps) > 0) return Number(productBps);
  if (Number(vendorBps) > 0) return Number(vendorBps);
  return Number(defaultBps);
}

module.exports = { calcByBps, bucketByStatus, resolveBps };
