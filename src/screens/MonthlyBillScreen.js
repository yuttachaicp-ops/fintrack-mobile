import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator, Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = "https://sugartanny.duckdns.org";
const LINE_USER_ID = "U8214e2476d608c95d4e2a542720c069c";

export default function MonthlyBillScreen() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", amount: "", dueDay: "", note: "" });

  useEffect(() => { loadBills(); }, []);

  const loadBills = async () => {
    try {
      const res = await fetch(`${API_URL}/api/monthly-bill?lineUserId=${LINE_USER_ID}`);
      setBills(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addBill = async () => {
    if (!form.name || !form.amount || !form.dueDay) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบ"); return;
    }
    try {
      await fetch(`${API_URL}/api/monthly-bill`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lineUserId: LINE_USER_ID }),
      });
      setAddModal(false);
      setForm({ name: "", amount: "", dueDay: "", note: "" });
      loadBills();
    } catch { Alert.alert("เกิดข้อผิดพลาด"); }
  };

  const saveEdit = async () => {
    try {
      await fetch(`${API_URL}/api/monthly-bill/${editItem.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditModal(false);
      loadBills();
    } catch { Alert.alert("เกิดข้อผิดพลาด"); }
  };

  const payBill = async (bill) => {
    Alert.alert("ยืนยันการชำระ", `จ่าย ${bill.name}\n${bill.amount.toLocaleString()} ฿`, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "จ่ายแล้ว", onPress: async () => {
        try {
          await fetch(`${API_URL}/api/monthly-bill/${bill.id}/pay`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lineUserId: LINE_USER_ID }),
          });
          Alert.alert("✅ บันทึกการชำระแล้ว");
          loadBills();
        } catch { Alert.alert("เกิดข้อผิดพลาด"); }
      }}
    ]);
  };

  const deleteBill = async (id) => {
    Alert.alert("ลบรายการ", "ต้องการลบรายการนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: async () => {
        await fetch(`${API_URL}/api/monthly-bill/${id}`, { method: "DELETE" });
        loadBills();
      }}
    ]);
  };

  const openEdit = (bill) => {
    setEditItem(bill);
    setForm({ name: bill.name, amount: String(bill.amount), dueDay: String(bill.dueDay), note: bill.note || "" });
    setEditModal(true);
  };

  const today = new Date().getDate();
  const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = bills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;
  const overdue = bills.filter(b => !b.isPaid && b.dueDay < today);
  const upcoming = bills.filter(b => !b.isPaid && b.dueDay >= today && b.dueDay <= today + 3);

  const getDueDayColor = (bill) => {
    if (bill.isPaid) return "#00C49A";
    const diff = bill.dueDay - today;
    if (diff < 0) return "#FF3B4E";
    if (diff <= 3) return "#FFA500";
    return "#8A9BB0";
  };

  const getDueDayText = (bill) => {
    if (bill.isPaid) return "✅ ชำระแล้ว";
    const diff = bill.dueDay - today;
    if (diff < 0) return `เกินกำหนด ${Math.abs(diff)} วัน`;
    if (diff === 0) return "❗ ครบกำหนดวันนี้";
    if (diff <= 3) return `⚠️ อีก ${diff} วัน`;
    return `ครบกำหนดวันที่ ${bill.dueDay}`;
  };

  const FormFields = () => (
    <>
      {[
        ["ชื่อรายการ", "name", "เช่น ค่าเช่า ค่าไฟ", "default"],
        ["ยอดเงิน (฿)", "amount", "0", "numeric"],
        ["วันที่ครบกำหนด (1-31)", "dueDay", "เช่น 5", "numeric"],
        ["หมายเหตุ", "note", "ไม่บังคับ", "default"],
      ].map(([lbl, key, ph, kb]) => (
        <View key={key}>
          <Text style={s.label}>{lbl}</Text>
          <View style={s.inputBox}>
            <TextInput
              style={[s.input, { fontSize: key === "name" || key === "note" ? 16 : 24 }]}
              value={form[key]}
              onChangeText={v => setForm({ ...form, [key]: v })}
              keyboardType={kb}
              placeholder={ph}
              placeholderTextColor="#3A4558"
            />
          </View>
        </View>
      ))}
    </>
  );

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#00C49A" /></View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <LinearGradient colors={["#0D1117", "#1A1F2E"]} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>📋 ค่าใช้จ่ายประจำเดือน</Text>
            <Text style={s.headerSub}>วันที่ {today} ของเดือน</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => { setForm({ name: "", amount: "", dueDay: "", note: "" }); setAddModal(true); }}>
            <Text style={s.addBtnText}>+ เพิ่ม</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.section}>

          {/* Summary */}
          <View style={s.summaryRow}>
            <View style={s.sumBox}>
              <Text style={[s.sumVal, { color: "#FF3B4E" }]}>{unpaidAmount.toLocaleString()}</Text>
              <Text style={s.sumLab}>ยังไม่จ่าย ฿</Text>
            </View>
            <View style={s.sumBox}>
              <Text style={[s.sumVal, { color: "#00C49A" }]}>{paidAmount.toLocaleString()}</Text>
              <Text style={s.sumLab}>จ่ายแล้ว ฿</Text>
            </View>
            <View style={s.sumBox}>
              <Text style={[s.sumVal, { color: "#FFA500" }]}>{totalAmount.toLocaleString()}</Text>
              <Text style={s.sumLab}>รวมทั้งหมด ฿</Text>
            </View>
          </View>

          {/* Alerts */}
          {overdue.length > 0 && (
            <View style={[s.alertBox, { borderColor: "#FF3B4E44", backgroundColor: "#FF3B4E11" }]}>
              <Text style={[s.alertText, { color: "#FF3B4E" }]}>❗ เกินกำหนด {overdue.length} รายการ: {overdue.map(b => b.name).join(", ")}</Text>
            </View>
          )}
          {upcoming.length > 0 && (
            <View style={[s.alertBox, { borderColor: "#FFA50044", backgroundColor: "#FFA50011" }]}>
              <Text style={[s.alertText, { color: "#FFA500" }]}>⚠️ ใกล้ครบกำหนด {upcoming.length} รายการ: {upcoming.map(b => b.name).join(", ")}</Text>
            </View>
          )}

          {/* Bill List */}
          {bills.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>ยังไม่มีรายการ</Text>
              <Text style={s.emptySub}>กด + เพิ่ม เพื่อเพิ่มรายการครับ</Text>
            </View>
          ) : bills.map(bill => (
            <View key={bill.id} style={[s.billCard, { borderColor: bill.isPaid ? "#00C49A33" : getDueDayColor(bill) + "33" }]}>
              <View style={s.billHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.billName, { color: bill.isPaid ? "#8A9BB0" : "#FFFFFF" }]}>{bill.name}</Text>
                  <Text style={[s.billDue, { color: getDueDayColor(bill) }]}>{getDueDayText(bill)}</Text>
                </View>
                <Text style={[s.billAmount, { color: bill.isPaid ? "#8A9BB0" : "#FFFFFF" }]}>
                  {bill.amount.toLocaleString()} ฿
                </Text>
              </View>
              {bill.note ? <Text style={s.billNote}>📝 {bill.note}</Text> : null}
              {bill.isPaid && bill.paidAt && (
                <Text style={s.paidAt}>ชำระเมื่อ {new Date(bill.paidAt).toLocaleDateString("th-TH")}</Text>
              )}
              <View style={s.billActions}>
                {!bill.isPaid && (
                  <TouchableOpacity style={s.payBtn} onPress={() => payBill(bill)}>
                    <LinearGradient colors={["#00C49A", "#00A882"]} style={s.payBtnInner}>
                      <Text style={s.payBtnText}>💳 จ่ายแล้ว</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(bill)}>
                  <Text style={s.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => deleteBill(bill.id)}>
                  <Text style={s.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>➕ เพิ่มรายการ</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormFields />
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: "#252D3D" }]} onPress={() => setAddModal(false)}>
                <Text style={[s.modalBtnText, { color: "#8A9BB0" }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: "#00C49A" }]} onPress={addBill}>
                <Text style={[s.modalBtnText, { color: "#0D1117" }]}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>✏️ แก้ไขรายการ</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormFields />
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: "#252D3D" }]} onPress={() => setEditModal(false)}>
                <Text style={[s.modalBtnText, { color: "#8A9BB0" }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: "#00C49A" }]} onPress={saveEdit}>
                <Text style={[s.modalBtnText, { color: "#0D1117" }]}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D1117" },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "#8A9BB0", marginTop: 4 },
  addBtn: { backgroundColor: "#00C49A", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: "#0D1117", fontWeight: "800", fontSize: 15 },
  section: { paddingHorizontal: 24, paddingTop: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  sumBox: { flex: 1, backgroundColor: "#1A1F2E", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#252D3D" },
  sumVal: { fontSize: 16, fontWeight: "800" },
  sumLab: { fontSize: 10, color: "#8A9BB0", marginTop: 4, textAlign: "center" },
  alertBox: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  alertText: { fontSize: 13, fontWeight: "600", wrap: true },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, color: "#8A9BB0", fontWeight: "600" },
  emptySub: { fontSize: 13, color: "#3A4558", marginTop: 8 },
  billCard: { backgroundColor: "#1A1F2E", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  billHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  billName: { fontSize: 16, fontWeight: "700" },
  billDue: { fontSize: 12, marginTop: 4 },
  billAmount: { fontSize: 18, fontWeight: "800" },
  billNote: { fontSize: 12, color: "#8A9BB0", marginTop: 6 },
  paidAt: { fontSize: 11, color: "#00C49A", marginTop: 4 },
  billActions: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  payBtn: { flex: 1, borderRadius: 10, overflow: "hidden" },
  payBtnInner: { paddingVertical: 10, alignItems: "center" },
  payBtnText: { color: "#0D1117", fontWeight: "800", fontSize: 14 },
  editBtn: { padding: 10, backgroundColor: "#FFA50022", borderRadius: 8 },
  editBtnText: { fontSize: 16 },
  delBtn: { padding: 10, backgroundColor: "#FF3B4E22", borderRadius: 8 },
  delBtnText: { fontSize: 16 },
  label: { fontSize: 12, color: "#8A9BB0", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#0D1117", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#252D3D" },
  input: { flex: 1, color: "#fff", paddingVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#1A1F2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "#252D3D" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 8 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  modalBtnText: { fontSize: 16, fontWeight: "800" },
});
