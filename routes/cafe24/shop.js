// routes/cafe24/shop.js
const express = require('express');
const router = express.Router();
const { ensureAccessToken, callCafe24 } = require('../../utils/cafe24Client');
const { getCache, setCache } = require('../../utils/cache');
const { loadState, saveState } = require('../../utils/syncState');

const WRITE_ENABLED = process.env.WRITE_ENABLED === '1';

/* -------------------- helpers -------------------- */
function clampLimit(n, def = 100) {
  const raw = Number(n);
  return Number.isFinite(raw) ? Math.max(1, Math.min(raw, 100)) : def; // 1~100
}
function isNoApiFound(err) {
  const msg = err?.data?.error?.message || err?.response?.data?.error?.message || err?.message || '';
  return (err?.status === 404) && /No API found/i.test(msg);
}
async function getVariantsAdmin(mall_id, product_no, shop_no) {
  return await callCafe24(mall_id, `/api/v2/admin/products/${product_no}/variants`, {
    method: 'GET', shopNo: shop_no,
  });
}
async function getVariantsFront(mall_id, product_no, shop_no) {
  return await callCafe24(mall_id, `/api/v2/products/${product_no}/variants`, {
    method: 'GET', shopNo: shop_no,
  });
}
async function getInventoryAdmin(mall_id, product_no, variant_code, shop_no) {
  return await callCafe24(
    mall_id,
    `/api/v2/admin/products/${product_no}/variants/${encodeURIComponent(variant_code)}/inventories`,
    { method: 'GET', shopNo: shop_no }
  );
}
async function getInventoryFront(mall_id, product_no, variant_code, shop_no) {
  return await callCafe24(
    mall_id,
    `/api/v2/products/${product_no}/variants/${encodeURIComponent(variant_code)}/inventories`,
    { method: 'GET', shopNo: shop_no }
  );
}
function getUpdatedAt(p) {
  return new Date(
    p.updated_date || p.updated_at || p.modified_date || p.modified_at || p.created_date || p.created_at || 0
  ).getTime();
}

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

    const limit = clampLimit(req.query.limit, 100);
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

/* -------------------- 4) 옵션(variants) 목록 (Admin→Front 폴백) -------------------- */
router.get('/product/:product_no/variants', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    try {
      const data = await getVariantsAdmin(mall_id, product_no, shop_no);
      return res.json({ ok: true, source: 'admin', data });
    } catch (e) {
      if (!isNoApiFound(e)) throw e;
      const data = await getVariantsFront(mall_id, product_no, shop_no); // ← 폴백
      return res.json({ ok: true, source: 'front', data });
    }
  } catch (err) {
    return res.status(500).json({ error: '옵션 목록 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 5) 특정 변형 재고 조회 (Admin→Front→없으면 빈배열) -------------------- */
router.get('/product/:product_no/variants/:variant_code/inventories', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const { product_no, variant_code } = req.params;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    try {
      const data = await getInventoryAdmin(mall_id, product_no, variant_code, shop_no);
      return res.json({ ok: true, source: 'admin', data });
    } catch (e) {
      if (isNoApiFound(e) || e.status === 404) {
        try {
          const data = await getInventoryFront(mall_id, product_no, variant_code, shop_no);
          return res.json({ ok: true, source: 'front', data });
        } catch (e2) {
          if (isNoApiFound(e2) || e2.status === 404) {
            return res.json({
              ok: true,
              source: 'none',
              mall_id, shop_no, product_no, variant_code,
              inventories: [],
              note: 'inventory disabled or not available for this variant'
            });
          }
          throw e2;
        }
      }
      throw e;
    }
  } catch (err) {
    return res.status(500).json({ error: '재고 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 6) 상세 + 옵션 + 재고(embed) -------------------- */
router.get('/product/:product_no/with', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    try {
      const data = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
        method: 'GET', params: { embed: 'variants,inventories' }, shopNo: shop_no,
      });
      return res.json({ ok: true, source: 'admin-embed', data });
    } catch (e) {
      if (!isNoApiFound(e)) throw e;
      const detail = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
        method: 'GET', shopNo: shop_no,
      });
      let variants, source = 'admin';
      try {
        variants = await getVariantsAdmin(mall_id, product_no, shop_no);
      } catch (ve) {
        if (!isNoApiFound(ve)) throw ve;
        variants = await getVariantsFront(mall_id, product_no, shop_no);
        source = 'front';
      }
      return res.json({ ok: true, source: `detail+variants(${source})`, detail, variants });
    }
  } catch (err) {
    return res.status(500).json({ error: '상세+옵션+재고 조회 실패', detail: err.data || err.response?.data || err.message });
  }
});

/* -------------------- 7) lean (상세+옵션+재고 가공) -------------------- */
router.get('/product/:product_no/lean', async (req, res) => {
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const product_no = req.params.product_no;
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const raw = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
      method: 'GET',
      params: { embed: 'variants,inventories' },
      shopNo: shop_no,
    });

    const product = raw.product || raw;
    const variants = product.variants || raw.variants || [];
    const inventories = product.inventories || raw.inventories || [];

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

/* -------------------- 8) 증분/전체 동기화 -------------------- */
router.get('/sync', async (req, res) => {
  const startedAt = Date.now();
  const mall_id = req.query.mall_id;
  const shop_no = Number(req.query.shop_no || 1);
  const mode = (req.query.mode || 'inc').toLowerCase(); // inc | full
  const limit = clampLimit(req.query.limit, 100);
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

/* =========================================================
   9) ★쓰기 라우트 (WRITE_ENABLED=1일 때만 동작)
   - 재고 조정(variant): add/set
   - 상품 가격 수정
   ========================================================= */

function requireWrite(req, res) {
  if (!WRITE_ENABLED) {
    res.status(403).json({ error: '쓰기 비활성화', detail: '서버 환경변수 WRITE_ENABLED=1 설정 필요' });
    return false;
  }
  return true;
}

/** 재고 조정 (variant)
 * POST /api/cafe24/shop/variant/:variant_code/inventory/adjust?mall_id=...&shop_no=1
 * body: { product_no: number, op: "add"|"set", qty: number }
 * 구현: Admin "Update product variant"로 quantity 세팅(use_inventory=T).  :contentReference[oaicite:3]{index=3}
 *  - add: 현재 수량 조회 후 가감
 *  - set: 절대값 설정
 */
router.post('/variant/:variant_code/inventory/adjust', async (req, res) => {
  if (!requireWrite(req, res)) return;
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const { variant_code } = req.params;
    const { product_no, op, qty } = req.body || {};
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });
    if (!product_no) return res.status(400).json({ error: 'product_no가 필요합니다.' });
    if (!variant_code) return res.status(400).json({ error: 'variant_code가 필요합니다.' });
    if (!['add', 'set'].includes(String(op))) return res.status(400).json({ error: 'op은 add|set 만 허용' });
    const nqty = Number(qty);
    if (!Number.isFinite(nqty)) return res.status(400).json({ error: 'qty는 숫자여야 합니다.' });

    // 1) 현재 변형 조회
    const cur = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}/variants/${encodeURIComponent(variant_code)}`, {
      method: 'GET', shopNo: shop_no
    });

    const beforeQty = Number(cur?.variant?.quantity ?? cur?.quantity ?? 0);
    const nextQty = op === 'add' ? Math.max(0, beforeQty + nqty) : Math.max(0, nqty);

    // 2) 수량 세팅 (use_inventory=T 보정)
    const payload = {
      quantity: nextQty,
      use_inventory: 'T'
    };
    const upd = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}/variants/${encodeURIComponent(variant_code)}`, {
      method: 'PUT', data: payload, shopNo: shop_no
    });

    return res.json({
      ok: true,
      mall_id, shop_no, product_no, variant_code,
      op, beforeQty, nextQty,
      result: upd
    });
  } catch (err) {
    return res.status(500).json({ error: '재고 조정 실패', detail: err.data || err.response?.data || err.message });
  }
});

/** 가격 수정 (product)
 * POST /api/cafe24/shop/product/:product_no/price?mall_id=...&shop_no=1
 * body: { price?: number, selling_price?: number, retail_price?: number }
 * 구현: Admin "Update product"로 가격 필드 전달 (price/retail_price 등).  :contentReference[oaicite:4]{index=4}
 *  - selling_price가 오면 price로 매핑
 */
router.post('/product/:product_no/price', async (req, res) => {
  if (!requireWrite(req, res)) return;
  try {
    const mall_id = req.query.mall_id;
    const shop_no = Number(req.query.shop_no || 1);
    const { product_no } = req.params;
    const { price, selling_price, retail_price } = req.body || {};
    if (!mall_id) return res.status(400).json({ error: 'mall_id 파라미터가 필요합니다.' });

    const body = {};
    if (price !== undefined) {
      if (!Number.isFinite(Number(price))) return res.status(400).json({ error: 'price 숫자 필드' });
      body.price = Number(price);
    }
    if (selling_price !== undefined) {
      if (!Number.isFinite(Number(selling_price))) return res.status(400).json({ error: 'selling_price 숫자 필드' });
      body.price = Number(selling_price); // 문서상 product의 판매가격 필드명은 price 입니다. :contentReference[oaicite:5]{index=5}
    }
    if (retail_price !== undefined) {
      if (!Number.isFinite(Number(retail_price))) return res.status(400).json({ error: 'retail_price 숫자 필드' });
      body.retail_price = Number(retail_price);
    }
    if (!Object.keys(body).length) {
      return res.status(400).json({ error: '가격 필드가 없습니다.', tip: 'price 또는 selling_price 또는 retail_price 중 하나를 보내세요.' });
    }

    const upd = await callCafe24(mall_id, `/api/v2/admin/products/${product_no}`, {
      method: 'PUT', data: body, shopNo: shop_no
    });

    return res.json({ ok: true, mall_id, shop_no, product_no, body, result: upd });
  } catch (err) {
    return res.status(500).json({ error: '가격 수정 실패', detail: err.data || err.response?.data || err.message });
  }
});

module.exports = router;
