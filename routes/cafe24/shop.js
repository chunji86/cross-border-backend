// routes/cafe24/shop.js
const express = require('express');
const router = express.Router();
const { ensureAccessToken, callCafe24 } = require('../../utils/cafe24Client');
const { getCache, setCache } = require('../../utils/cache');
const { loadState, saveState } = require('../../utils/syncState');

/* -------------------- 1) 토큰 테스트 -------------------- */
router.get('/test', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    await ensureAccessToken(mall_id, shop_no);
    return res.json({ ok: true, mall_id, shop_no, has_token: true });
  } catch (err) {
    return res.status(500).json({ error: '토큰 확인 실패', detail: err.message || err });
  }
});

/* -------------------- 2) 상품 목록 -------------------- */
router.get('/products', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const raw = Number(req.query.limit);
    const limit = Number.isFinite(raw) ? Math.max(1, Math.min(raw, 100)) : 100; // 1~100
    const page = Math.max(1, Number(req.query.page || 1));

    const data = await callCafe24(mall_id, '/api/v2/admin/products', {
      method: 'GET',
      params: { limit, page },
      shopNo: shop_no,
    });

    return res.json({ ok: true, mall_id, shop_no, limit, page, count: data?.products?.length || 0, data });
  } catch (err) {
    return res.status(500).json({ error: '상품 목록 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 3) 상품 상세 -------------------- */
router.get('/product/:product_no', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    if (!product_no) return res.status(400).json({ error: 'product_no 파라미터가 필요합니다.' });

    const data = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
      method: 'GET',
      shopNo: shop_no,
    });

    return res.json({ ok: true, mall_id, shop_no, product_no, data });
  } catch (err) {
    return res.status(500).json({ error: '상품 상세 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 4) 옵션/변형(variants) 목록 -------------------- */
// 공식 엔드포인트: GET /api/v2/admin/products/{product_no}/variants  :contentReference[oaicite:0]{index=0}
router.get('/product/:product_no/variants', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const data = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}/variants`, {
      method: 'GET',
      shopNo: shop_no,
    });

    return res.json({ ok: true, mall_id, shop_no, product_no, count: data?.variants?.length || 0, data });
  } catch (err) {
    return res.status(500).json({ error: '옵션 목록 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 5) 특정 변형 재고(inventories) 조회 -------------------- */
// 공식 엔드포인트: GET /api/v2/admin/products/{product_no}/variants/{variant_code}/inventories  :contentReference[oaicite:1]{index=1}
router.get('/product/:product_no/variants/:variant_code/inventories', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    const variant_code = req.params.variant_code;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const data = await callCafe24(
      mall_id,
      `/api/v2/admin/products/${product_no}/variants/${encodeURIComponent(variant_code)}/inventories`,
      { method: 'GET', shopNo: shop_no }
    );

    return res.json({ ok: true, mall_id, shop_no, product_no, variant_code, data });
  } catch (err) {
    return res.status(500).json({ error: '재고 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 6) 상세 + 옵션/재고 한번에(embed) -------------------- */
// embed=variants,inventories 지원  :contentReference[oaicite:2]{index=2}
router.get('/product/:product_no/with', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const data = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
      method: 'GET',
      params: { embed: 'variants,inventories' },
      shopNo: shop_no,
    });

    const variants = data?.variants || data?.product?.variants || [];
    const inventories = data?.inventories || data?.product?.inventories || [];
    return res.json({
      ok: true, mall_id, shop_no, product_no,
      variants_count: Array.isArray(variants) ? variants.length : 0,
      inventories_count: Array.isArray(inventories) ? inventories.length : 0,
      data
    });
  } catch (err) {
    return res.status(500).json({ error: '상세+옵션+재고 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 7) 증분/전체 동기화 -------------------- */
function getUpdatedAt(p) {
  return new Date(
    p.updated_date || p.updated_at || p.modified_date || p.modified_at || p.created_date || p.created_at || 0
  ).getTime();
}

router.get('/sync', async (req, res) => {
  const startedAt = Date.now();
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  const mode = (req.query.mode || 'inc').toLowerCase(); // inc | full
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : 100; // 1~100
  const maxPages = Math.min(Number(req.query.max_pages || 1000), 2000);
  const ttl = Math.min(Math.max(Number(req.query.ttl || 90), 30), 300); // 30~300
  const TIMEBOX_MS = 60 * 1000;

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
      if (Date.now() - startedAt > TIMEBOX_MS) {
        saveState(mall_id, shop_no, {
          last_success_page: page,
          newest_seen_at: newestSeen ? new Date(newestSeen).toISOString() : null,
        });
        const payload = { ok: true, partial: true, reason: 'timeboxed', count: items.length, next_page: page };
        setCache(cacheKey, payload, ttl);
        return res.json(payload);
      }

      const data = await callCafe24(mall_id, '/api/v2/admin/products', {
        method: 'GET',
        params: { limit, page },
        shopNo: shop_no,
      });

      const list = Array.isArray(data?.products) ? data.products : [];
      pagesDone++;

      let pageItems = list;
      if (mode === 'inc' && lastSyncedAt) {
        pageItems = list.filter(p => getUpdatedAt(p) >= lastSyncedAt);
      }

      if (list.length) {
        const pageNewest = Math.max(...list.map(getUpdatedAt));
        const pageOldest = Math.min(...list.map(getUpdatedAt));
        if (pageNewest > newestSeen) newestSeen = pageNewest;

        if (mode === 'inc' && lastSyncedAt && pageNewest < lastSyncedAt && pageOldest < lastSyncedAt) {
          hadOlderOnlyPages++;
          if (hadOlderOnlyPages >= 2) break; // 조기 종료
        } else {
          hadOlderOnlyPages = 0;
        }
      }

      items.push(...pageItems);

      if (list.length < limit) break;
      page++;
      saveState(mall_id, shop_no, { last_success_page: page });
    }

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
    saveState(mall_id, shop_no, { last_error: err.data || err.response?.data || err.message });
    return res.status(500).json({ error: '동기화 실패', detail: err.data || err.response?.data || err.message });
  }
});

// 상세+옵션+재고를 가볍게 가공해서 리턴
router.get('/product/:product_no/lean', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    // embed 한 번 호출
    const raw = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
      method: 'GET',
      params: { embed: 'variants,inventories' },
      shopNo: shop_no,
    });

    const product = raw.product || raw; // 일부 응답은 product 루트에 있음
    const variants = product.variants || raw.variants || [];
    const inventories = product.inventories || raw.inventories || [];

    // variant_code 기준으로 재고 묶기(필드명이 몰마다 다를 수 있어 안전하게 처리)
    const invByVariant = {};
    for (const inv of Array.isArray(inventories) ? inventories : []) {
      const vcode = inv.variant_code || inv.variantId || inv.variant || inv.code;
      if (!vcode) continue;
      (invByVariant[vcode] ||= []).push({
        warehouse: inv.warehouse_code || inv.warehouseId || inv.warehouse || null,
        qty: Number(inv.quantity ?? inv.stock ?? inv.available ?? 0),
      });
    }

    const lean = variants.map(v => {
      const vcode = v.variant_code || v.code || v.id;
      const options = [
        v.option_value1, v.option_value2, v.option_value3,
        v.option_value4, v.option_value5,
      ].filter(Boolean);
      const invList = invByVariant[vcode] || [];
      const totalQty = invList.reduce((s, i) => s + (Number.isFinite(i.qty) ? i.qty : 0), 0);

      return {
        variant_code: vcode,
        sku: v.sku || v.custom_variant_code || null,
        options,
        price: Number(v.price ?? v.selling_price ?? v.retail_price ?? 0),
        use_inventory: v.use_inventory ?? null,
        inventory_total: totalQty,
        inventory_by_warehouse: invList,
      };
    });

    res.json({
      ok: true,
      mall_id, shop_no, product_no,
      product: {
        product_no: product.product_no,
        product_code: product.product_code,
        name: product.product_name || product.name || null,
        price: Number(product.price ?? product.retail_price ?? 0),
      },
      variants: lean,
      counts: { variants: lean.length, inventories: inventories.length || 0 },
    });
  } catch (err) {
    res.status(500).json({ error: 'lean 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});


module.exports = router;
