export function analyzeJob({
  price, distanceKm, stops, endZone, jobType,
  trafficLevel = "medium", fuelCostPerKm = 1.5,
  dailyTarget = 900, currentDailyEarned = 0
}) {
  const thbPerKm = distanceKm > 0 ? price / distanceKm : 0;
  const fuelCost = distanceKm * fuelCostPerKm;
  const netProfit = price - fuelCost;
  const trafficMult = trafficLevel === "low" ? 1 : trafficLevel === "medium" ? 1.3 : 1.7;
  const estimatedMinutes = Math.round(distanceKm * 3 * trafficMult + stops * 5);
  const profitPerHour = estimatedMinutes > 0 ? Math.round((netProfit / estimatedMinutes) * 60) : 0;
  const remainingTarget = Math.max(0, dailyTarget - currentDailyEarned);

  // Zone A - โซนทอง (+40)
  const ZONE_A = [
    "the bright","the bright rama 2","ท่าข้าม","วัดหัวกระบือ",
    "อนามัยงามเจริญ","พระราม 2 ซอย","หมู่บ้านท่าข้าม",
  ];
  // Zone B - เอกชัย/บางบอนต้นๆ (+18)
  const ZONE_B = [
    "เอกชัย","บางบอน 1","บางบอน 3","บางบอน",
    "กาญจนาภิเษก","สะแกงาม","เทียนทะเล",
  ];
  // Zone C - พระราม 2 หลัก (+15)
  const ZONE_C = [
    "พระราม 2","rama 2","central rama 2","เซ็นทรัล พระราม 2",
    "โลตัส พระราม 2","central","เซ็นทรัล","บางมด","พุทธบูชา","สุขสวัสดิ์",
  ];
  // Blacklist zones (-50)
  const RISK_ZONES = [
    "มหาชัย","หนองแขม","เพชรเกษมลึก","เพชรเกษม",
    "บางบอนปลาย","โรงงาน","ชายทะเลลึก","ชายทะเล",
    "mahachai","samut sakhon","สมุทรสาคร","พื้นที่โล่ง",
  ];

  const endZoneLower = (endZone || "").toLowerCase();
  const isZoneA = ZONE_A.some(z => endZoneLower.includes(z.toLowerCase()));
  const isZoneB = ZONE_B.some(z => endZoneLower.includes(z.toLowerCase()));
  const isZoneC = ZONE_C.some(z => endZoneLower.includes(z.toLowerCase()));
  const isRiskZone = RISK_ZONES.some(z => endZoneLower.includes(z.toLowerCase()));

  let score = 50;
  let reasons = [];
  let warnings = [];

  // ── THB/km scoring ──
  if (thbPerKm >= 15) { score += 30; reasons.push("ราคา/km สูงมาก ✨"); }
  else if (thbPerKm >= 12) { score += 20; reasons.push("ราคา/km ดี"); }
  else if (thbPerKm >= 10) { score += 5; }
  else if (thbPerKm >= 8) { score -= 15; warnings.push("ราคา/km ต่ำ"); }
  else { score -= 30; warnings.push("ราคา/km ต่ำมาก ไม่คุ้มน้ำมัน"); }

  // ── Distance scoring (อิง prompt) ──
  if (distanceKm <= 8) { score += 20; reasons.push("ระยะ PERFECT 2-8 km"); }
  else if (distanceKm <= 12) { score += 10; reasons.push("ระยะ Acceptable"); }
  else if (distanceKm <= 15) { score -= 5; warnings.push("ระยะเริ่มไกล ตรวจโซนด้วย"); }
  else if (distanceKm <= 20) { score -= 15; warnings.push("ระยะไกล 15+ km ไม่แนะนำ"); }
  else if (distanceKm <= 25) { score -= 25; warnings.push("ระยะไกลมาก ต้องราคาดีมาก"); }
  else if (distanceKm <= 30) { score -= 35; warnings.push("ระยะอันตราย ตีรถเปล่ากลับสูง"); }
  else { score -= 50; warnings.push("🚨 ระยะ 30+ km ควรทิ้งเลย"); }

  // ── Zone scoring ──
  if (isZoneA) {
    score += 40; reasons.push("🏆 โซนทอง! งานต่อเยอะ กลับ HUB ง่าย");
  } else if (isZoneB) {
    score += 18; reasons.push("✅ โซนดี เอกชัย/บางบอน มีหมู่บ้านเยอะ");
  } else if (isZoneC) {
    score += 15; reasons.push("✅ โซนพระราม 2 HUB หลัก");
  } else if (isRiskZone) {
    score -= 50; warnings.push("🔴 โซนเสี่ยง! งานต่อหาย กลับ HUB ยาก");
  } else if (endZone) {
    warnings.push("⚠️ ตรวจสอบโซนปลายทาง");
  }

  // ── Traffic penalty ──
  if (trafficLevel === "high") { score -= 15; warnings.push("รถติดหนัก เสียเวลา"); }
  else if (trafficLevel === "medium") { score -= 5; }

  // ── Batch scoring ──
  if (jobType === "batch") {
    if (price >= 300 && distanceKm <= 25) { score += 10; reasons.push("Batch ราคาดี"); }
    else if (price < 300) { score -= 15; warnings.push("Batch ราคาต่ำเกินไป"); }
    else if (distanceKm > 30) { score -= 30; warnings.push("Batch ระยะ 30+ km อันตราย"); }
    if (stops > 5) { score -= 10; warnings.push("จุดส่งเยอะ เสี่ยงหมดเวลา"); }
  }

  // ── Net profit check ──
  if (netProfit < 50) { score -= 20; warnings.push(`กำไรสุทธิต่ำมาก (${netProfit.toFixed(0)} บาท)`); }
  else if (netProfit < 100) { warnings.push(`กำไรสุทธิ ${netProfit.toFixed(0)} บาท`); }

  score = Math.max(0, Math.min(100, score));

  // ── Decision ──
  let decision, color, mainText, subText;
  if (score >= 65) {
    decision = "ACCEPT"; color = "#00C49A";
    mainText = "รับเลย!"; subText = "คุ้มมาก";
  } else if (score >= 40) {
    decision = "CONSIDER"; color = "#FFA500";
    mainText = "คิดก่อน"; subText = "รับได้ถ้างานเงียบ";
  } else {
    decision = "REJECT"; color = "#FF3B4E";
    mainText = "ทิ้งงานนี้"; subText = "ไม่คุ้ม";
  }

  // ── Zone label ──
  let zoneLabel = null;
  if (isZoneA) zoneLabel = "🏆 Zone A โซนทอง";
  else if (isZoneB) zoneLabel = "✅ Zone B เอกชัย/บางบอน";
  else if (isZoneC) zoneLabel = "✅ Zone C พระราม 2";
  else if (isRiskZone) zoneLabel = "🔴 Blacklist Zone";
  else if (endZone) zoneLabel = "⚠️ ตรวจสอบโซน";

  // ── Batch label ──
  let batchLabel = null;
  if (jobType === "batch") {
    if (score >= 70) batchLabel = "Batch ทองคำ 🏆";
    else if (score >= 50) batchLabel = "Batch พอได้";
    else if (score >= 30) batchLabel = "Batch หลอกตา";
    else batchLabel = "Batch พัง 💀";
  }

  // ── Smart suggestion ──
  let suggestion = null;
  if (decision === "REJECT") {
    if (thbPerKm < 10) suggestion = `💡 รองาน >${Math.ceil(distanceKm * 12)} ฿ หรือระยะ <${Math.ceil(price / 12)} km`;
    else if (isRiskZone) suggestion = "💡 รอโซนพระราม 2 หรือท่าข้ามดีกว่า";
    else if (distanceKm > 15) suggestion = "💡 รองานระยะ 8-12 km ดีกว่า";
  }

  const jobsNeeded = netProfit > 0 ? Math.ceil(remainingTarget / netProfit) : 0;

  return {
    thbPerKm: +thbPerKm.toFixed(2),
    fuelCost: +fuelCost.toFixed(2),
    netProfit: +netProfit.toFixed(2),
    estimatedMinutes,
    profitPerHour,
    score,
    decision,
    color,
    mainText,
    subText,
    reasons,
    warnings,
    batchLabel,
    zoneLabel,
    suggestion,
    remainingTarget,
    jobsNeeded,
  };
}
