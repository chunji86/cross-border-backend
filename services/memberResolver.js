// Node18+면 내장 fetch 사용. (node-fetch 제거 가능)
const { getAccessToken, apiGet } = require('./cafe24Client');

async function resolveMemberNo({ mall_id, shop_no, rawId, id_type }) {
  const v = String(rawId || '').trim();
  if (!v) throw new Error('empty_identifier');

  // 이미 숫자면 그대로
  if (/^\d+$/.test(v)) return Number(v);

  const tok = await getAccessToken(mall_id, shop_no); // { access_token }
  const isEmail = id_type === 'email' || /@/.test(v);
  const qs = new URLSearchParams({ limit:'1' });
  if (id_type === 'member_no') { return Number(v); }
  if (isEmail) qs.set('member_email', v); else qs.set('member_id', v);

  const data = await apiGet(mall_id, `/api/v2/customers?${qs.toString()}`, tok.access_token);
  const item = data?.customers?.[0];
  if (!item?.member_no) throw new Error('member_no_not_found');
  return Number(item.member_no);
}

module.exports = { resolveMemberNo };
