const express = require('express');
const router = express.Router();
const { ensureAccessToken, callCafe24 } = require('../../utils/cafe24Client');

// ✅ 토큰 확인
router.get('/test', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    const token = await ensureAccessToken(mall_id);
    return res.json({ ok: true, mall_id, shop_no, has_token: !!token });
  } catch (err) {
    return res.status(500).json({ error: '토큰 확인 실패', detail: err.message });
  }
});

// ✅ 상품 목록 조회
router.get('/products', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);
    const data = await callCafe24(mall_id, '/api/v2/admin/products', {
      method: 'GET',
      params: { limit, page },
      shopNo: shop_no,
    });
    return res.json({ ok: true, mall_id, shop_no, count: data?.products?.length || 0, data });
  } catch (err) {
    return res.status(500).json({ error: '상품 목록 조회 실패', detail: err.response?.data || err.message });
  }
});

// ===== 상품 동기화 (증분/전체) =====
const { getCache, setCache } = require('../../utils/cache');
const { loadState, saveState } = require('../../utils/syncState');

// updated_at 파싱 유틸 (필드 이름이 조금씩 다를 수 있어 안전 처리)
function getUpdatedAt(p) {
  return new Date(
    p.updated_date || p.updated_at || p.modified_date || p.modified_at || p.created_date || p.created_at || 0
  ).getTime();
}

/**
 * GET /api/cafe24/shop/sync
 * params:
 *  - mall_id (필수)
 *  - shop_no (기본 1)
 *  - mode=inc|full (기본 inc)
 *  - limit (기본 200)
 *  - max_pages (기본 1000)
 *  - ttl=캐시초(기본 90)
 * 동작:
 *  - inc: last_synced_at 이후만 필터링해서 반환(클라이언트 필터, 조기 종료 휴리스틱)
 *  - full: 전 페이지 스캔 (상한/타임박스 적용)
 */
router.get('/sync', async (req, res) => {
  const startedAt = Date.now();
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  const mode = (req.query.mode || 'inc').toLowerCase(); // 'inc' | 'full'
  const limit = Math.min(Number(req.query.limit || 200), 500);
  const maxPages = Math.min(Number(req.query.max_pages || 1000), 2000);
  const ttl = Math.min(Math.max(Number(req.query.ttl || 90), 30), 300); // 30~300
  const TIMEBOX_MS = 60 * 1000; // 전체 작업 60s 타임박스

  if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

  const cacheKey = `sync:${mall_id}:${shop_no}:${mode}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json({ ...cached, _cache: true });

  try {
    const state = loadState(mall_id, shop_no);
    const lastSyncedAt = state?.last_synced_at ? new Date(state.last_synced_at).getTime() : 0;
    let page = state?.last_success_page && mode === 'inc' ? state.last_success_page : 1;

    const items = [];
    let newestSeen = 0;
    let pagesDone = 0;
    let hadOlderOnlyPages = 0;

    while (page <= maxPages) {
      // 타임박스
      if (Date.now() - startedAt > TIMEBOX_MS) {
        saveState(mall_id, shop_no, { last_success_page: page, newest_seen_at: new Date(newestSeen || 0).toISOString() });
        const payload = { ok: true, partial: true, reason: 'timeboxed', count: items.length, next_page: page };
        setCache(cacheKey, payload, ttl);
        return res.json(payload);
      }

      // 페이지 호출
      const data = await callCafe24(mall_id, '/api/v2/admin/products', {
        method: 'GET',
        params: { limit, page },
        shopNo: shop_no,
      });

      const list = Array.isArray(data?.products) ? data.products : [];
      pagesDone++;

      // 증분 모드면 last_synced_at 이후만 필터
      let pageItems = list;
      if (mode === 'inc' && lastSyncedAt) {
        pageItems = list.filter(p => getUpdatedAt(p) >= lastSyncedAt);
      }

      // 최신/최저 갱신시간 파악
      if (list.length) {
        const pageNewest = Math.max(...list.map(getUpdatedAt));
        const pageOldest = Math.min(...list.map(getUpdatedAt));
        if (pageNewest > newestSeen) newestSeen = pageNewest;

        // 증분: 한 페이지 전체가 lastSyncedAt 이전이면 카운트
        if (mode === 'inc' && lastSyncedAt && pageNewest < lastSyncedAt && pageOldest < lastSyncedAt) {
          hadOlderOnlyPages++;
          // 연속 2페이지 모두 이전 데이터만이면 조기 종료 (휴리스틱)
          if (hadOlderOnlyPages >= 2) break;
        } else {
          hadOlderOnlyPages = 0;
        }
      }

      items.push(...pageItems);

      // 다음 페이지 조건
      if (list.length < limit) break;
      page++;

      // 마지막 성공 페이지 저장 (이어받기 대비)
      saveState(mall_id, shop_no, { last_success_page: page });
    }

    // 동기화 완료 시간 기록(증분 기준점 갱신)
    const syncedAt = new Date().toISOString();
    saveState(mall_id, shop_no, {
      last_synced_at: syncedAt,
      last_success_page: 1,
      newest_seen_at: newestSeen ? new Date(newestSeen).toISOString() : null,
      pages_done: pagesDone,
    });

    const payload = {
      ok: true,
      mode,
      mall_id,
      shop_no,
      limit,
      pages_done: pagesDone,
      count: items.length,
      synced_at: syncedAt,
    };
    setCache(cacheKey, payload, ttl);
    return res.json(payload);
  } catch (err) {
    // 실패 시 상태 저장(이어받기용)
    saveState(mall_id, shop_no, { last_error: err.response?.data || err.message });
    return res.status(500).json({ error: '동기화 실패', detail: err.response?.data || err.message });
  }
});

module.exports = router;
