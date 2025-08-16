// controllers/rolesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cafe24 = require('../services/cafe24Client');

// 문자열(customer_id)이 오면 Cafe24 Admin API로 member_no 조회
async function resolveMemberNo({ mall_id, rawId, id_type }) {
  // 숫자면 그대로
  if (/^\d+$/.test(String(rawId))) return Number(rawId);

  // access token
  const tok = await cafe24.getAccessToken(mall_id, 1); // shop_no가 필요하면 인자 추가
  const isEmail = id_type === 'email' || /@/.test(String(rawId));
  const qs = new URLSearchParams({ limit: '1' });

  if (isEmail) qs.set('member_email', String(rawId));
  else qs.set('member_id', String(rawId));

  // Cafe24 Customers 검색 (v2 기준)
  const data = await cafe24.apiGet(mall_id, `/api/v2/customers?${qs.toString()}`, tok.access_token);
  const item = data?.customers?.[0];
  if (!item?.member_no) throw new Error('member_no_not_found');
  return Number(item.member_no);
}

// POST /api/roles/apply-with-id
async function applyWithId(req, res) {
  try {
    const { mall_id, shop_no } = req.body || {};
    let { customer_id, id_type, channels } = req.body || {};

    if (!mall_id || !customer_id) {
      return res.status(400).json({ ok:false, error: 'missing mall_id/customer_id' });
    }
    channels = Array.isArray(channels) ? channels : [];

    // 🔁 핵심: 문자 ID/이메일 → member_no 숫자로 통일
    const memberNo = await resolveMemberNo({ mall_id, rawId: customer_id, id_type });

    // 여기서부터는 기존 로직(신청 저장) 그대로 사용
    // 예시 구현:
    const now = new Date();
    await prisma.influencerApplication.upsert({
      where: { mallId_memberNo: { mallId: String(mall_id), memberNo } },
      create: {
        mallId: String(mall_id),
        shopNo: Number(shop_no || 1),
        memberNo,
        status: 'PENDING',
        channelsJson: JSON.stringify(channels),
        createdAt: now, updatedAt: now,
      },
      update: {
        channelsJson: JSON.stringify(channels),
        updatedAt: now,
      }
    });

    return res.json({ ok: true, status: 'pending', member_no: memberNo });
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (msg === 'member_no_not_found') {
      return res.status(404).json({ ok:false, error:'member not found on Cafe24 (by id/email)' });
    }
    console.error('apply-with-id error:', e);
    return res.status(400).json({ ok:false, error: msg });
  }
}

module.exports = { applyWithId };
