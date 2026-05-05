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

  const MAIN_ZONES = ["central rama 2","rama 2","the bright","lotus rama 2","ekachai","bangbon","เซ็นทรัล พระราม 2","พระราม 2","เอกชัย","บางบอน","โลตัส พระราม 2","อนามัยงามเจริญ","ท่าข้าม","บางขุนเทียน"];
  const RISK_ZONES = ["mahachai","samut sakhon","มหาชัย","สมุทรสาคร","ซอยลึก","นิคม"];
  const endZoneLower = (endZone || "").toLowerCase();
  const isMainZone = MAIN_ZONES.some(z => endZoneLower.includes(z.toLowerCase()));
  const isRiskZone = RISK_ZONES.some(z => endZoneLower.includes(z.toLowerCase()));

  let score = 50;
  let reasons = [];
  let warnings = [];

  // THB/km scoring
  if (thbPerKm >= 15) { score += 30; reasons.push("ราคาต่อ km สูงมาก"); }
  else if (thbPerKm >= 12) { score += 20; reasons.push("ราคาต่อ km ดี"); }
  else if (thbPerKm >= 10) { score += 5; }
  else if (thbPerKm >= 8) { score -= 15; warnings.push("ราคาต่อ km ต่ำ"); }
  else { score -= 30; warnings.push("ราคาต่อ km ต่ำมาก ไม่คุ้มน้ำมัน"); }

  // Distance scoring
  if (distanceKm <= 5) { score += 15; reasons.push("ระยะสั้น ดีมาก"); }
  else if (distanceKm <= 10) { score += 8; }
  else if (distanceKm <= 20) { score += 0; }
  else if (distanceKm <= 25) { score -= 10; warnings.push("ระยะไกล ตรวจโซนด้วย"); }
  else if (distanceKm <= 30) { score -= 20; warnings.push("ระยะไกลมาก"); }
  else { score -= 35; warnings.push("ระยะอันตราย 30+ km"); }

  // Zone scoring
  if (isMainZone) { score += 20; reasons.push("จบในโซนดี"); }
  else if (isRiskZone) { score -= 25; warnings.push("จบในโซนเสี่ยง หางานต่อยาก"); }
  else if (endZone) { warnings.push("ตรวจสอบโซนปลายทาง"); }

  // Batch scoring
  if (jobType === "batch") {
    if (price >= 300 && distanceKm <= 25) { score += 10; reasons.push("Batch คุ้มค่า"); }
    else if (price < 300) { score -= 15; warnings.push("Batch ราคาต่ำเกินไป"); }
    else if (distanceKm > 30) { score -= 25; warnings.push("Batch ระยะไกลเกินไป"); }
  }

  // Net profit check
  if (netProfit < 50) { score -= 20; warnings.push(`กำไรสุทธิต่ำมาก (${netProfit.toFixed(0)} บาท)`); }
  else if (netProfit < 100) { warnings.push(`กำไรสุทธิ ${netProfit.toFixed(0)} บาท`); }

  score = Math.max(0, Math.min(100, score));

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

  // Batch label
  let batchLabel = null;
  if (jobType === "batch") {
    if (score >= 70) batchLabel = "Batch ทองคำ";
    else if (score >= 50) batchLabel = "Batch พอได้";
    else if (score >= 30) batchLabel = "Batch หลอกตา";
    else batchLabel = "Batch พัง";
  }

  const jobsNeeded = profitPerHour > 0 ? Math.ceil(remainingTarget / netProfit) : 0;

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
    remainingTarget,
    jobsNeeded,
  };
}

