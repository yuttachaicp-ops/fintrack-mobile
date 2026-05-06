import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://sugartanny.duckdns.org";

export default function CashShiftScreen() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startCash, setStartCash] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [note, setNote] = useState("");
  const [endCash, setEndCash] = useState("");
  const [appIncome, setAppIncome] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const LINE_USER_ID = "U8214e2476d608c95d4e2a542720c069c";

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cash-shift/current?lineUserId=${LINE_USER_ID}`);
      const data = await res.json();
      setSession(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startShift = async () => {
    if (!startCash) { Alert.alert("กรุณาใส่เงินเริ่มต้น"); return; }
    try {
      const res = await fetch(`${API_URL}/api/cash-shift/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: LINE_USER_ID, startCash: parseFloat(startCash), fuelLevel, note }),
      });
      if (res.ok) { Alert.alert("✅ เริ่มงานแล้ว!"); loadSession(); setStartCash(""); setFuelLevel(""); setNote(""); }
      else { const d = await res.json(); Alert.alert("❌ " + d.error); }
    } catch (e) { Alert.alert("เกิดข้อผิดพลาด"); }
  };

  const endShift = async () => {
    if (!endCash || !appIncome || !fuelCost) { Alert.alert("กรุณากรอกข้อมูลให้ครบ"); return; }
    const ec = parseFloat(endCash), ai = parseFloat(appIncome), fc = parseFloat(fuelCost);
    const totalIncome = (ec - session.startCash) + ai;
    const netProfit = totalIncome - fc;
    Alert.alert("ยืนยันจบงาน", `รายรับรวม: ${totalIncome.toLocaleString()} ฿\nกำไรสุทธิ: ${netProfit.toLocaleString()} ฿`, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "จบงาน", style: "destructive", onPress: async () => {
        try {
          const res = await fetch(`${API_URL}/api/cash-shift/end`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId: LINE_USER_ID, endCash: ec, appIncome: ai, fuelCost: fc }),
          });
          if (res.ok) { Alert.alert("✅ จบงานแล้ว!"); loadSession(); setEndCash(""); setAppIncome(""); setFuelCost(""); }
        } catch (e) { Alert.alert("เกิดข้อผิดพลาด"); }
      }},
    ]);
  };

  const elapsed = session ? Math.round((Date.now() - new Date(session.startedAt)) / 60000) : 0;
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#00C49A" /></View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#0D1117", "#1A1F2E"]} style={s.header}>
          <Text style={s.headerTitle}>💰 Cash Shift</Text>
          <Text style={s.headerSub}>บันทึกรายได้ต่อกะ</Text>
        </LinearGradient>

        {!session ? (
          // START SHIFT
          <View style={s.section}>
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
              <Text style={s.label}>หมายเหตุ (ไม่บังคับ)</Text>
              <TextInput style={[s.inputBox, { paddingVertical: 12 }]} value={note} onChangeText={setNote} placeholder="วันนี้ฝนตก..." placeholderTextColor="#3A4558" />
              <TouchableOpacity onPress={startShift}>
                <LinearGradient colors={["#00C49A", "#00A882"]} style={s.btn}>
                  <Text style={s.btnText}>🚀 เริ่มงานเลย</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // END SHIFT
          <View style={s.section}>
            {/* Active Session Info */}
            <LinearGradient colors={["#00C49A33", "#1A1F2E"]} style={s.activeCard}>
              <Text style={s.activeTitle}>⚡ กำลังทำงานอยู่</Text>
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statVal}>{session.startCash.toLocaleString()}</Text>
                  <Text style={s.statLab}>เงินเริ่มต้น ฿</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statVal, { color: "#FFA500" }]}>{hours > 0 ? `${hours}ชม.${mins}น.` : `${mins} นาที`}</Text>
                  <Text style={s.statLab}>เวลาทำงาน</Text>
                </View>
                {session.fuelLevel && (
                  <View style={s.statItem}>
                    <Text style={s.statVal}>{session.fuelLevel}</Text>
                    <Text style={s.statLab}>น้ำมัน</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* End Shift Form */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🛑 จบงาน</Text>
              <View style={s.divider} />
              <Text style={s.label}>เงินสดหลังจบ (฿)</Text>
              <View style={s.inputBox}>
                <Text style={s.prefix}>฿</Text>
                <TextInput style={s.input} value={endCash} onChangeText={setEndCash} keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
              </View>
              <Text style={s.label}>เงินในแอพ (฿)</Text>
              <View style={s.inputBox}>
                <Text style={s.prefix}>฿</Text>
                <TextInput style={s.input} value={appIncome} onChangeText={setAppIncome} keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
              </View>
              <Text style={s.label}>ค่าน้ำมัน (฿)</Text>
              <View style={s.inputBox}>
                <Text style={s.prefix}>฿</Text>
                <TextInput style={s.input} value={fuelCost} onChangeText={setFuelCost} keyboardType="numeric" placeholder="0" placeholderTextColor="#3A4558" />
              </View>

              {/* Preview calculation */}
              {endCash && appIncome && fuelCost && (
                <View style={s.preview}>
                  <View style={s.previewRow}>
                    <Text style={s.previewLab}>📈 รายรับรวม</Text>
                    <Text style={s.previewVal}>{((parseFloat(endCash||0) - session.startCash) + parseFloat(appIncome||0)).toLocaleString()} ฿</Text>
                  </View>
                  <View style={s.previewRow}>
                    <Text style={s.previewLab}>🔥 กำไรสุทธิ</Text>
                    <Text style={[s.previewVal, { color: ((parseFloat(endCash||0) - session.startCash) + parseFloat(appIncome||0) - parseFloat(fuelCost||0)) >= 0 ? "#00C49A" : "#FF3B4E" }]}>
                      {((parseFloat(endCash||0) - session.startCash) + parseFloat(appIncome||0) - parseFloat(fuelCost||0)).toLocaleString()} ฿
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity onPress={endShift}>
                <LinearGradient colors={["#FF3B4E", "#C0392B"]} style={s.btn}>
                  <Text style={s.btnText}>🛑 จบงาน</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 14, color: "#8A9BB0", marginTop: 4 },
  section: { paddingHorizontal: 24, marginTop: 20 },
  card: { backgroundColor: "#1A1F2E", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#252D3D" },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#252D3D", marginVertical: 12 },
  label: { fontSize: 13, color: "#8A9BB0", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#0D1117", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#252D3D", marginBottom: 4 },
  input: { flex: 1, fontSize: 24, fontWeight: "800", color: "#fff", paddingVertical: 12 },
  prefix: { fontSize: 20, color: "#8A9BB0", marginRight: 8 },
  suffix: { fontSize: 16, color: "#8A9BB0", marginLeft: 4 },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 20 },
  btnText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  activeCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#00C49A44" },
  activeTitle: { fontSize: 18, fontWeight: "800", color: "#00C49A", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
  statItem: { flex: 1, alignItems: "center", backgroundColor: "#0D1117", borderRadius: 12, padding: 12 },
  statVal: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLab: { fontSize: 11, color: "#8A9BB0", marginTop: 4, textAlign: "center" },
  preview: { backgroundColor: "#0D1117", borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#252D3D" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  previewLab: { fontSize: 15, color: "#8A9BB0", fontWeight: "600" },
  previewVal: { fontSize: 15, fontWeight: "800", color: "#00C49A" },
});
