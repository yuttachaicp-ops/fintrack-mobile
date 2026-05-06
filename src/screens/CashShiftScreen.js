import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart } from "react-native-chart-kit";

const API_URL = "https://sugartanny.duckdns.org";
const LINE_USER_ID = "U8214e2476d608c95d4e2a542720c069c";
const W = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "transparent",
  backgroundGradientFrom: "#1A1F2E",
  backgroundGradientTo: "#1A1F2E",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 196, 154, ${opacity})`,
  labelColor: () => "#8A9BB0",
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#00C49A" },
};

export default function CashShiftScreen() {
  const [tab, setTab] = useState("shift");
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startCash, setStartCash] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [note, setNote] = useState("");
  const [endCash, setEndCash] = useState("");
  const [appIncome, setAppIncome] = useState("");
  const [fuelCost, setFuelCost] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSession(), loadHistory()]);
    setLoading(false);
  };

  const loadSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cash-shift/current?lineUserId=${LINE_USER_ID}`);
      setSession(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cash-shift/history?lineUserId=${LINE_USER_ID}`);
      setHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  const startShift = async () => {
    if (!startCash) { Alert.alert("กรุณาใส่เงินเริ่มต้น"); return; }
    try {
      const res = await fetch(`${API_URL}/api/cash-shift/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: LINE_USER_ID, startCash: parseFloat(startCash), fuelLevel, note }),
      });
      if (res.ok) { Alert.alert("✅ เริ่มงานแล้ว!"); setStartCash(""); setFuelLevel(""); setNote(""); loadAll(); }
      else { const d = await res.json(); Alert.alert("❌ " + d.error); }
    } catch { Alert.alert("เกิดข้อผิดพลาด"); }
  };

  const endShift = async () => {
    if (!endCash || !appIncome || !fuelCost) { Alert.alert("กรุณากรอกข้อมูลให้ครบ"); return; }
    const ec = parseFloat(endCash), ai = parseFloat(appIncome), fc = parseFloat(fuelCost);
    const total = (ec - session.startCash) + ai;
    const profit = total - fc;
    Alert.alert("ยืนยันจบงาน",
      `รายรับรวม: ${total.toLocaleString()} ฿\nกำไรสุทธิ: ${profit.toLocaleString()} ฿`,
      [{ text: "ยกเลิก", style: "cancel" },
       { text: "จบงาน", style: "destructive", onPress: async () => {
         try {
           await fetch(`${API_URL}/api/cash-shift/end`, {
             method: "POST", headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ lineUserId: LINE_USER_ID, endCash: ec, appIncome: ai, fuelCost: fc }),
           });
           setEndCash(""); setAppIncome(""); setFuelCost("");
           Alert.alert("✅ จบงานแล้ว!"); loadAll();
         } catch { Alert.alert("เกิดข้อผิดพลาด"); }
       }}]);
  };

  const elapsed = session ? Math.round((Date.now() - new Date(session.startedAt)) / 60000) : 0;
  const previewTotal = endCash && appIncome && session ? (parseFloat(endCash) - session.startCash) + parseFloat(appIncome) : 0;
  const previewProfit = previewTotal - parseFloat(fuelCost || 0);

  // Chart data from history
  const last7 = [...history].reverse().slice(-7);
  const chartLabels = last7.map(h => { const d = new Date(h.startedAt); return `${d.getDate()}/${d.getMonth()+1}`; });
  const profitData = last7.map(h => Math.max(0, h.netProfit || 0));
  const incomeData = last7.map(h => h.totalIncome || 0);

  const totalProfit = history.reduce((s, h) => s + (h.netProfit || 0), 0);
  const totalIncome = history.reduce((s, h) => s + (h.totalIncome || 0), 0);
  const avgProfit = history.length > 0 ? totalProfit / history.length : 0;

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#00C49A" /></View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <LinearGradient colors={["#0D1117", "#1A1F2E"]} style={s.header}>
        <Text style={s.headerTitle}>💰 Cash Shift</Text>
        <Text style={s.headerSub}>บันทึกรายได้ต่อกะ</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabRow}>
        {["shift","history","chart"].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab===t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab===t && s.tabActiveText]}>
              {t==="shift" ? "💰 กะงาน" : t==="history" ? "📋 ประวัติ" : "📊 กราฟ"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── TAB: SHIFT ── */}
        {tab === "shift" && (
          <View style={s.section}>
            {!session ? (
              <View style={s.card}>
                <Text style={s.cardTitle}>🚀 เริ่มงาน</Text>
                <View style={s.divider} />
                <Text style={s.label}>เงินสดเริ่มต้น (฿)</Text>
                <View style={s.inputBox}>
                  <Text style={s.prefix}>฿</Text>
                  <TextInput style={s.input} value={startCash} onChangeText={setStartCash} keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
                </View>
                <Text style={s.label}>น้ำมันคงเหลือ (%)</Text>
                <View style={s.inputBox}>
                  <TextInput style={s.input} value={fuelLevel} onChangeText={setFuelLevel} keyboardType="numeric" placeholder="80" placeholderTextColor="#3A4558" />
                  <Text style={s.suffix}>%</Text>
                </View>
                <Text style={s.label}>หมายเหตุ</Text>
                <View style={s.inputBox}>
                  <TextInput style={[s.input, {fontSize:16}]} value={note} onChangeText={setNote} placeholder="วันนี้ฝนตก..." placeholderTextColor="#3A4558" />
                </View>
                <TouchableOpacity onPress={startShift}>
                  <LinearGradient colors={["#00C49A","#00A882"]} style={s.btn}>
                    <Text style={s.btnText}>🚀 เริ่มงานเลย</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <LinearGradient colors={["#00C49A33","#1A1F2E"]} style={s.activeCard}>
                  <Text style={s.activeTitle}>⚡ กำลังทำงานอยู่</Text>
                  <View style={s.statsRow}>
                    <View style={s.statItem}>
                      <Text style={s.statVal}>{session.startCash.toLocaleString()}</Text>
                      <Text style={s.statLab}>เงินเริ่มต้น ฿</Text>
                    </View>
                    <View style={s.statItem}>
                      <Text style={[s.statVal,{color:"#FFA500"}]}>
                        {Math.floor(elapsed/60)>0 ? `${Math.floor(elapsed/60)}ชม.${elapsed%60}น.` : `${elapsed} นาที`}
                      </Text>
                      <Text style={s.statLab}>เวลาทำงาน</Text>
                    </View>
                    {session.fuelLevel && (
                      <View style={s.statItem}>
                        <Text style={s.statVal}>{session.fuelLevel}</Text>
                        <Text style={s.statLab}>น้ำมัน</Text>
                      </View>
                    )}
                  </View>
                  {session.note ? <Text style={s.noteText}>📝 {session.note}</Text> : null}
                </LinearGradient>

                <View style={s.card}>
                  <Text style={s.cardTitle}>🛑 จบงาน</Text>
                  <View style={s.divider} />
                  {[
                    ["เงินสดหลังจบ (฿)", endCash, setEndCash, "฿", ""],
                    ["เงินในแอพ (฿)", appIncome, setAppIncome, "฿", ""],
                    ["ค่าน้ำมัน (฿)", fuelCost, setFuelCost, "฿", ""],
                  ].map(([lbl, val, set, pre]) => (
                    <View key={lbl}>
                      <Text style={s.label}>{lbl}</Text>
                      <View style={s.inputBox}>
                        <Text style={s.prefix}>{pre}</Text>
                        <TextInput style={s.input} value={val} onChangeText={set} keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
                      </View>
                    </View>
                  ))}

                  {endCash && appIncome && fuelCost && (
                    <View style={s.preview}>
                      <View style={s.previewRow}>
                        <Text style={s.previewLab}>📈 รายรับรวม</Text>
                        <Text style={s.previewVal}>{previewTotal.toLocaleString()} ฿</Text>
                      </View>
                      <View style={s.previewRow}>
                        <Text style={s.previewLab}>🔥 กำไรสุทธิ</Text>
                        <Text style={[s.previewVal,{color: previewProfit>=0?"#00C49A":"#FF3B4E"}]}>{previewProfit.toLocaleString()} ฿</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity onPress={endShift}>
                    <LinearGradient colors={["#FF3B4E","#C0392B"]} style={s.btn}>
                      <Text style={s.btnText}>🛑 จบงาน</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── TAB: HISTORY ── */}
        {tab === "history" && (
          <View style={s.section}>
            {/* Summary strip */}
            <View style={s.summaryRow}>
              <View style={s.sumBox}>
                <Text style={s.sumVal}>{history.length}</Text>
                <Text style={s.sumLab}>กะทั้งหมด</Text>
              </View>
              <View style={s.sumBox}>
                <Text style={[s.sumVal,{color:"#00C49A"}]}>{totalIncome.toLocaleString()}</Text>
                <Text style={s.sumLab}>รายรับรวม ฿</Text>
              </View>
              <View style={s.sumBox}>
                <Text style={[s.sumVal,{color: totalProfit>=0?"#00C49A":"#FF3B4E"}]}>{totalProfit.toLocaleString()}</Text>
                <Text style={s.sumLab}>กำไรรวม ฿</Text>
              </View>
            </View>

            {history.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>ยังไม่มีประวัติการทำงาน</Text>
                <Text style={s.emptySub}>เริ่มงานแล้วจบงานเพื่อดูประวัติ</Text>
              </View>
            ) : history.map((h) => {
              const d = new Date(h.startedAt);
              const date = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
              const startTime = d.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
              const endTime = h.endedAt ? new Date(h.endedAt).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}) : "-";
              const el = h.endedAt ? Math.round((new Date(h.endedAt)-new Date(h.startedAt))/60000) : 0;
              return (
                <View key={h.id} style={s.histCard}>
                  <View style={s.histHead}>
                    <Text style={s.histDate}>📅 {date}</Text>
                    <Text style={s.histTime}>{startTime} — {endTime} ({Math.floor(el/60)>0?`${Math.floor(el/60)}ชม.`:""}{el%60}น.)</Text>
                  </View>
                  {h.note ? <Text style={s.histNote}>📝 {h.note}</Text> : null}
                  <View style={s.histStats}>
                    {[
                      ["เริ่มต้น", h.startCash, "#8A9BB0"],
                      ["หลังจบ", h.endCash, "#FFFFFF"],
                      ["แอพ", h.appIncome, "#00C49A"],
                      ["น้ำมัน", h.fuelCost, "#FF4757"],
                    ].map(([lbl,val,col]) => (
                      <View key={lbl} style={s.hStat}>
                        <Text style={[s.hStatVal,{color:col}]}>{(val||0).toLocaleString()}</Text>
                        <Text style={s.hStatLab}>{lbl} ฿</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.histFoot}>
                    <View style={s.profBox}>
                      <Text style={s.profLab}>📈 รายรับรวม</Text>
                      <Text style={s.profVal}>{(h.totalIncome||0).toLocaleString()} ฿</Text>
                    </View>
                    <View style={[s.profBox,{backgroundColor:(h.netProfit||0)>=0?"#00C49A22":"#FF3B4E22"}]}>
                      <Text style={s.profLab}>🔥 กำไรสุทธิ</Text>
                      <Text style={[s.profVal,{color:(h.netProfit||0)>=0?"#00C49A":"#FF3B4E"}]}>{(h.netProfit||0).toLocaleString()} ฿</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── TAB: CHART ── */}
        {tab === "chart" && (
          <View style={s.section}>
            {last7.length < 2 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>ต้องการข้อมูลอย่างน้อย 2 กะ</Text>
                <Text style={s.emptySub}>เพื่อแสดงกราฟ</Text>
              </View>
            ) : (
              <>
                {/* Stat cards */}
                <View style={s.summaryRow}>
                  <View style={s.sumBox}>
                    <Text style={[s.sumVal,{color:"#00C49A"}]}>{avgProfit.toFixed(0)}</Text>
                    <Text style={s.sumLab}>เฉลี่ย/กะ ฿</Text>
                  </View>
                  <View style={s.sumBox}>
                    <Text style={[s.sumVal,{color:"#FFA500"}]}>{Math.max(...profitData).toLocaleString()}</Text>
                    <Text style={s.sumLab}>สูงสุด ฿</Text>
                  </View>
                  <View style={s.sumBox}>
                    <Text style={[s.sumVal,{color:"#FF4757"}]}>{Math.min(...profitData).toLocaleString()}</Text>
                    <Text style={s.sumLab}>ต่ำสุด ฿</Text>
                  </View>
                </View>

                {/* Bar Chart - กำไรสุทธิ */}
                <View style={s.chartCard}>
                  <Text style={s.chartTitle}>🔥 กำไรสุทธิรายกะ</Text>
                  <BarChart
                    data={{ labels: chartLabels, datasets: [{ data: profitData }] }}
                    width={W - 48} height={200}
                    chartConfig={chartConfig} style={s.chart} fromZero showValuesOnTopOfBars
                  />
                </View>

                {/* Line Chart - รายรับ vs กำไร */}
                <View style={s.chartCard}>
                  <Text style={s.chartTitle}>📈 รายรับ vs กำไร</Text>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [
                        { data: incomeData, color: () => "#00C49A", strokeWidth: 2 },
                        { data: profitData, color: () => "#FFA500", strokeWidth: 2 },
                      ],
                      legend: ["รายรับ", "กำไรสุทธิ"],
                    }}
                    width={W - 48} height={220}
                    chartConfig={chartConfig} style={s.chart} bezier fromZero
                  />
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D1117" },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 14, color: "#8A9BB0", marginTop: 4 },
  tabRow: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: "#1A1F2E", borderWidth: 1, borderColor: "#252D3D" },
  tabActive: { backgroundColor: "#00C49A", borderColor: "#00C49A" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#8A9BB0" },
  tabActiveText: { color: "#0D1117" },
  section: { paddingHorizontal: 24 },
  card: { backgroundColor: "#1A1F2E", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#252D3D", marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  divider: { height: 1, backgroundColor: "#252D3D", marginVertical: 12 },
  label: { fontSize: 12, color: "#8A9BB0", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#0D1117", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#252D3D" },
  input: { flex: 1, fontSize: 24, fontWeight: "800", color: "#fff", paddingVertical: 12 },
  prefix: { fontSize: 20, color: "#8A9BB0", marginRight: 8 },
  suffix: { fontSize: 16, color: "#8A9BB0", marginLeft: 4 },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 16 },
  btnText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  activeCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#00C49A44" },
  activeTitle: { fontSize: 18, fontWeight: "800", color: "#00C49A", marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: { flex: 1, alignItems: "center", backgroundColor: "#0D1117", borderRadius: 12, padding: 12 },
  statVal: { fontSize: 16, fontWeight: "800", color: "#fff" },
  statLab: { fontSize: 10, color: "#8A9BB0", marginTop: 4, textAlign: "center" },
  noteText: { fontSize: 13, color: "#8A9BB0", marginTop: 10 },
  preview: { backgroundColor: "#0D1117", borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#252D3D" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  previewLab: { fontSize: 15, color: "#8A9BB0", fontWeight: "600" },
  previewVal: { fontSize: 15, fontWeight: "800", color: "#00C49A" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  sumBox: { flex: 1, backgroundColor: "#1A1F2E", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#252D3D" },
  sumVal: { fontSize: 18, fontWeight: "800", color: "#FFA500" },
  sumLab: { fontSize: 10, color: "#8A9BB0", marginTop: 4, textAlign: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#8A9BB0", fontWeight: "600" },
  emptySub: { fontSize: 13, color: "#3A4558", marginTop: 8 },
  histCard: { backgroundColor: "#1A1F2E", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#252D3D" },
  histHead: { marginBottom: 4 },
  histDate: { fontSize: 15, fontWeight: "800", color: "#fff" },
  histTime: { fontSize: 12, color: "#8A9BB0", marginTop: 2 },
  histNote: { fontSize: 12, color: "#8A9BB0", marginTop: 4, marginBottom: 8 },
  histStats: { flexDirection: "row", gap: 6, marginVertical: 10 },
  hStat: { flex: 1, alignItems: "center", backgroundColor: "#0D1117", borderRadius: 8, padding: 8 },
  hStatVal: { fontSize: 13, fontWeight: "800" },
  hStatLab: { fontSize: 9, color: "#8A9BB0", marginTop: 2, textAlign: "center" },
  histFoot: { flexDirection: "row", gap: 8 },
  profBox: { flex: 1, backgroundColor: "#00C49A22", borderRadius: 10, padding: 10, alignItems: "center" },
  profLab: { fontSize: 11, color: "#8A9BB0" },
  profVal: { fontSize: 15, fontWeight: "800", color: "#00C49A", marginTop: 2 },
  chartCard: { backgroundColor: "#1A1F2E", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#252D3D", overflow: "hidden" },
  chartTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },
  chart: { borderRadius: 12, marginLeft: -8 },
});
