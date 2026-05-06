import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, Vibration, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { analyzeJob } from "../utils/analyzeJob";

const ZONES = ["พระราม 2","เซ็นทรัล พระราม 2","เอกชัย","บางบอน","โลตัส พระราม 2","มหาชัย","สมุทรสาคร","อื่นๆ"];
const PRESETS = [
  { label: "50/3km", price: 50, km: 3 },
  { label: "70/5km", price: 70, km: 5 },
  { label: "170/21km", price: 170, km: 21 },
  { label: "300/20km", price: 300, km: 20 },
  { label: "475/65km", price: 475, km: 65 },
];

export default function RiderScreen() {
  const [price, setPrice] = useState("");
  const [km, setKm] = useState("");
  const [stops, setStops] = useState("1");
  const [endZone, setEndZone] = useState("");
  const [jobType, setJobType] = useState("single");
  const [traffic, setTraffic] = useState("medium");
  const [result, setResult] = useState(null);

  const check = () => {
    if (!price || !km) return;
    const r = analyzeJob({
      price: parseFloat(price),
      distanceKm: parseFloat(km),
      stops: parseInt(stops) || 1,
      endZone,
      jobType,
      trafficLevel: traffic,
    });
    setResult(r);
    Vibration.vibrate(r.decision === "ACCEPT" ? [0,100,50,100] : r.decision === "REJECT" ? [0,500] : [0,200]);
  };

  const reset = () => { setResult(null); setPrice(""); setKm(""); setStops("1"); setEndZone(""); };

  if (result) {
    return (
      <View style={[s.resultContainer, { backgroundColor: result.color + "22" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[result.color + "44", "#0D1117"]} style={s.resultGradient}>
          <ScrollView contentContainerStyle={s.resultScroll}>
            {/* Score Circle */}
            <View style={[s.scoreCircle, { borderColor: result.color }]}>
              <Text style={[s.scoreNum, { color: result.color }]}>{result.score}</Text>
              <Text style={s.scoreLabel}>คะแนน</Text>
            </View>

            {/* Main Decision */}
            <Text style={[s.mainText, { color: result.color }]}>{result.mainText}</Text>
            <Text style={s.subText}>{result.subText}</Text>
            {result.zoneLabel && (
                  <View style={[s.batchBadge, { backgroundColor: result.zoneLabel.includes("A") ? "#FFA500" : result.zoneLabel.includes("B") || result.zoneLabel.includes("C") ? "#00C49A" : "#FF3B4E" }]}>
                    <Text style={s.batchBadgeText}>{result.zoneLabel}</Text>
                  </View>
                )}
                {result.batchLabel && (
              <View style={[s.batchBadge, { backgroundColor: result.color }]}>
                <Text style={s.batchBadgeText}>{result.batchLabel}</Text>
              </View>
            )}

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              <StatBox label="ราคา/km" value={`${result.thbPerKm} ฿`} color={result.thbPerKm >= 12 ? "#00C49A" : result.thbPerKm >= 10 ? "#FFA500" : "#FF3B4E"} />
              <StatBox label="กำไรสุทธิ" value={`${result.netProfit} ฿`} color={result.netProfit > 0 ? "#00C49A" : "#FF3B4E"} />
              <StatBox label="ค่าน้ำมัน" value={`${result.fuelCost} ฿`} color="#FF3B4E" />
              <StatBox label="เวลาโดยประมาณ" value={`${result.estimatedMinutes} นาที`} color="#8A9BB0" />
              <StatBox label="กำไร/ชั่วโมง" value={`${result.profitPerHour} ฿`} color="#FFA500" />
              <StatBox label="งานที่ต้องการ" value={`${result.jobsNeeded} งาน`} color="#8A9BB0" />
            </View>

            {/* Reasons */}
            {result.reasons.length > 0 && (
              <View style={s.reasonBox}>
                <Text style={s.reasonTitle}>✅ ข้อดี</Text>
                {result.reasons.map((r, i) => (
                  <Text key={i} style={s.reasonText}>• {r}</Text>
                ))}
              </View>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <View style={[s.reasonBox, { borderColor: "#FF3B4E33" }]}>
                <Text style={[s.reasonTitle, { color: "#FF3B4E" }]}>⚠️ ข้อเสีย</Text>
                {result.warnings.map((w, i) => (
                  <Text key={i} style={[s.reasonText, { color: "#FF4757" }]}>• {w}</Text>
                ))}
              </View>
            )}

            {result.suggestion && (
                  <View style={[s.reasonBox, { borderColor: "#FFA50033", marginBottom: 12 }]}>
                    <Text style={[s.reasonTitle, { color: "#FFA500" }]}>💡 คำแนะนำ</Text>
                    <Text style={[s.reasonText, { color: "#FFA500" }]}>{result.suggestion}</Text>
                  </View>
                )}
                <TouchableOpacity style={[s.checkBtn, { backgroundColor: "#1A1F2E" }]} onPress={reset}>
              <Text style={[s.checkBtnText, { color: "#FFFFFF" }]}>← เช็คงานใหม่</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#0D1117", "#1A1F2E"]} style={s.header}>
          <Text style={s.headerTitle}>🏍️ Rider Checker</Text>
          <Text style={s.headerSub}>เช็คงานใน 3 วินาที</Text>
        </LinearGradient>

        {/* Presets */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ตัวอย่างด่วน</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity key={i} style={s.presetBtn}
                onPress={() => { setPrice(String(p.price)); setKm(String(p.km)); }}>
                <Text style={s.presetText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Job Type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ประเภทงาน</Text>
          <View style={s.toggle}>
            <TouchableOpacity style={[s.toggleBtn, jobType === "single" && s.toggleActive]}
              onPress={() => setJobType("single")}>
              <Text style={[s.toggleText, jobType === "single" && s.toggleActiveText]}>🛵 งานเดี่ยว</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, jobType === "batch" && s.toggleActive]}
              onPress={() => setJobType("batch")}>
              <Text style={[s.toggleText, jobType === "batch" && s.toggleActiveText]}>📦 Batch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price & KM */}
        <View style={s.section}>
          <View style={s.inputRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>ราคา (฿)</Text>
              <View style={s.inputBox}>
                <Text style={s.inputPrefix}>฿</Text>
                <TextInput style={s.input} value={price} onChangeText={setPrice}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
              </View>
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>ระยะทาง (km)</Text>
              <View style={s.inputBox}>
                <TextInput style={s.input} value={km} onChangeText={setKm}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
                <Text style={s.inputSuffix}>km</Text>
              </View>
            </View>
          </View>
          <View style={s.inputRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>จำนวนจุดส่ง</Text>
              <View style={s.inputBox}>
                <TextInput style={s.input} value={stops} onChangeText={setStops}
                  keyboardType="numeric" placeholder="1" placeholderTextColor="#3A4558" />
                <Text style={s.inputSuffix}>จุด</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Traffic */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>การจราจร</Text>
          <View style={s.toggle}>
            {["low","medium","high"].map(t => (
              <TouchableOpacity key={t} style={[s.toggleBtn, traffic === t && { backgroundColor: t === "low" ? "#00C49A" : t === "medium" ? "#FFA500" : "#FF3B4E" }]}
                onPress={() => setTraffic(t)}>
                <Text style={[s.toggleText, traffic === t && { color: "#fff" }]}>
                  {t === "low" ? "🟢 โล่ง" : t === "medium" ? "🟡 ปานกลาง" : "🔴 ติด"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* End Zone */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>โซนปลายทาง</Text>
          <View style={s.zoneGrid}>
            {ZONES.map(z => (
              <TouchableOpacity key={z} style={[s.zoneBtn, endZone === z && s.zoneBtnActive]}
                onPress={() => setEndZone(endZone === z ? "" : z)}>
                <Text style={[s.zoneText, endZone === z && s.zoneTextActive]}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Check Button */}
        <View style={[s.section, { marginBottom: 40 }]}>
          <TouchableOpacity onPress={check} disabled={!price || !km}>
            <LinearGradient colors={["#00C49A", "#00A882"]}
              style={[s.checkBtn, (!price || !km) && { opacity: 0.4 }]}>
              <Text style={s.checkBtnText}>⚡ เช็คตอนนี้เลย</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  resultContainer: { flex: 1, backgroundColor: "#0D1117" },
  resultGradient: { flex: 1 },
  resultScroll: { padding: 24, alignItems: "center", paddingBottom: 60 },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 14, color: "#8A9BB0", marginTop: 4 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: { fontSize: 14, color: "#8A9BB0", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  toggle: { flexDirection: "row", backgroundColor: "#1A1F2E", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "#252D3D" },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  toggleActive: { backgroundColor: "#00C49A" },
  toggleText: { fontSize: 15, color: "#8A9BB0", fontWeight: "600" },
  toggleActiveText: { color: "#0D1117" },
  inputRow: { flexDirection: "row", gap: 12 },
  inputWrap: { flex: 1 },
  inputLabel: { fontSize: 13, color: "#8A9BB0", marginBottom: 6 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1F2E", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#252D3D" },
  input: { flex: 1, fontSize: 24, fontWeight: "800", color: "#fff", paddingVertical: 12 },
  inputPrefix: { fontSize: 20, color: "#8A9BB0", marginRight: 6 },
  inputSuffix: { fontSize: 14, color: "#8A9BB0", marginLeft: 4 },
  zoneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  zoneBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1A1F2E", borderWidth: 1, borderColor: "#252D3D" },
  zoneBtnActive: { backgroundColor: "#00C49A", borderColor: "#00C49A" },
  zoneText: { color: "#8A9BB0", fontWeight: "600", fontSize: 13 },
  zoneTextActive: { color: "#0D1117" },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1A1F2E", borderWidth: 1, borderColor: "#252D3D" },
  presetText: { color: "#00C49A", fontWeight: "700", fontSize: 13 },
  checkBtn: { borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  checkBtnText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 6, alignItems: "center", justifyContent: "center", marginBottom: 20, marginTop: 20 },
  scoreNum: { fontSize: 56, fontWeight: "900" },
  scoreLabel: { fontSize: 14, color: "#8A9BB0" },
  mainText: { fontSize: 56, fontWeight: "900", letterSpacing: -1 },
  subText: { fontSize: 20, color: "#8A9BB0", marginBottom: 16 },
  batchBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  batchBadgeText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 16, width: "100%" },
  statBox: { flex: 1, minWidth: "45%", backgroundColor: "#1A1F2E", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#252D3D" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#8A9BB0", marginTop: 4, textAlign: "center" },
  reasonBox: { width: "100%", backgroundColor: "#1A1F2E", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#00C49A33" },
  reasonTitle: { fontSize: 15, fontWeight: "700", color: "#00C49A", marginBottom: 8 },
  reasonText: { fontSize: 14, color: "#FFFFFF", marginBottom: 4 },
});

