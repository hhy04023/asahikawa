import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const pageUrl = "https://www.road-info-prvs.mlit.go.jp/roadinfo/sp/spTukokisei_81_1.html";
const outputPath = resolve("data/road-status.json");
const meshes = (process.env.ROAD_MESHES || "6542").split(",").map(value => value.trim()).filter(Boolean);
const fetchJson = async url => {
  const response = await fetch(url, { headers: { "User-Agent": "ASAHIKAWA-road-summary/1.0" } });
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.json();
};
const fetchText = async url => {
  const response = await fetch(url, { headers: { "User-Agent": "ASAHIKAWA-road-summary/1.0" } });
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.text();
};
const restrictionLabel = icon => ({
  "icon_stop.png": "通行止",
  "icon_stop_kouji.png": "工事通行止",
  "icon_stop_ogata.png": "大型車通行止",
  "icon_stop_winter.png": "冬期通行止",
  "icon_kisei_shasen.png": "車線規制",
  "icon_kisei_katagawa.png": "片側交互通行",
  "icon_kisei_idou.png": "移動規制",
  "icon_kisei_chain.png": "チェーン規制",
  "icon_shidou_chain.png": "チェーン指導"
}[icon] || "其他道路規制");

const pageHtml = await fetchText(pageUrl);
const bootstrapMatch = pageHtml.match(/src="([^\"]*backup\/[^\"]+\.js)"/);
if (!bootstrapMatch) throw new Error("Could not locate the official data bootstrap script.");
const bootstrapUrl = new URL(bootstrapMatch[1], pageUrl);
const bootstrap = await fetchText(bootstrapUrl);
const baseMatch = bootstrap.match(/const CREATE_JSON_PATH\s*=\s*["']([^"']+)["']/);
if (!baseMatch) throw new Error("Could not locate the official JSON data path.");
const jsonBase = new URL(baseMatch[1], pageUrl);
const updateMatch = pageHtml.match(/id="updateTime">\s*([^<]+)</);
const officialUpdatedAt = updateMatch?.[1]?.replace(/\s+/g, " ").trim() || null;

const rawItems = (await Promise.all(meshes.flatMap(mesh => ["TukoKisei", "TokiTuko"].map(async collection => {
  try { return await fetchJson(new URL(`${collection}/${mesh}.json`, jsonBase)); }
  catch (error) { console.warn(`Unable to read ${collection}/${mesh}.json: ${error.message}`); return []; }
})))).flat();
const uniqueItems = [...new Map(rawItems.filter(item => item?.same_tukokisei_info_id).map(item => [item.same_tukokisei_info_id, item])).values()];
const items = await Promise.all(uniqueItems.map(async item => {
  let detail = {};
  try {
    detail = await fetchJson(new URL(`Details/detail_t_${item.same_tukokisei_info_id}_jp.json`, jsonBase));
  } catch (error) {
    console.warn(`Unable to read detail for ${item.same_tukokisei_info_id}: ${error.message}`);
  }
  const icon = item.iconData?.icon_name || "";
  return {
    id: item.same_tukokisei_info_id,
    type: restrictionLabel(icon),
    road: detail.rosen_name || null,
    from: detail.kisei_kaishi_chiten || null,
    to: detail.kisei_syuryo_chiten || null,
    starts_at: item.kisei_kaishi_nichiji || null,
    icon
  };
}));
const closures = items.filter(item => /通行止/.test(item.type)).length;
const chains = items.filter(item => /チェーン/.test(item.type)).length;
const status = closures ? "通行止資訊あり" : items.length ? "道路規制を確認" : "大きな規制情報なし";
const summary = closures
  ? `旭川周邊目前有 ${closures} 件通行止資訊，出發前請開啟官方地圖確認區間。`
  : items.length
    ? `旭川周邊目前有 ${items.length} 件道路規制資訊${chains ? `（含 ${chains} 件鏈條相關規制）` : ""}，請查看官方完整地圖。`
    : "目前未讀取到旭川網格的道路規制項目；出發前仍請查看官方完整地圖。";
const output = {
  source_name: "國土交通省 道路情報提供系統",
  source_url: `${pageUrl}?page=10&zoom=9&ido=43.770&keido=142.365`,
  fetched_at: new Date().toISOString(),
  official_updated_at: officialUpdatedAt,
  meshes,
  status: { label: status, summary, restrictions: items.length, closures, chains },
  items
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath} with ${items.length} restrictions.`);
