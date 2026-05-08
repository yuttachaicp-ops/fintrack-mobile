import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  Dimensions, TouchableOpacity, StatusBar, ActivityIndicator,
  TextInput, Alert, FlatList,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import RiderScreen from "./src/screens/RiderScreen";
import CashShiftScreen from "./src/screens/CashShiftScreen";

const API_URL = "https://sugartanny.duckdns.org";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const Tab = createBottomTabNavigator();

// =================== DASHBOARD SCREEN ===================
function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#00D4AA" />
      <Text style={s.loadingText}>กำลังโหลด...</Text>
    </View>
  );

  const isBehind = data?.is_behind_target;
  const weekDays = (data?.weekly_data || []).map((d) => {
    const date = new Date(d.date);
    return ["อา","จ","อ","พ","พฤ","ศ","ส"][date.getDay()];
  });
  const chartConfig = {
    backgroundColor: "transparent", backgroundGradientFrom: "#1A1F2E", backgroundGradientTo: "#1A1F2E",
    decimalPlaces: 0, color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`,
    labelColor: () => "#8A9BB0", propsForDots: { r: "4", strokeWidth: "2", stroke: "#00D4AA" },
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#00D4AA" />}>
        <LinearGradient colors={["#0D1117","#1A1F2E"]} style={s.header}>
          <Text style={s.headerTitle}>บันทึกการเงิน 💰</Text>
          <Text style={s.headerDate}>{new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>
        </LinearGradient>
        <LinearGradient colors={isBehind ? ["#FF4757","#C0392B"] : ["#00D4AA","#00B894"]} style={s.riderCard}>
          <Text style={s.riderLabel}>{isBehind ? "⚠️ ต้องเร่งหาเงิน!" : "✅ ยอดเยี่ยม!"}</Text>
          <Text style={s.riderAmount}>{(data?.required_today || 0).toLocaleString()}</Text>
          <Text style={s.riderUnit}>บาท / วันนี้</Text>
          <Text style={s.riderStatus}>{isBehind ? `ยังขาดอีก ${(data?.remaining||0).toLocaleString()} บาท` : `เหลืออีก ${data?.days_left||0} วัน`}</Text>
        </LinearGradient>
        <View style={s.section}>
          <Text style={s.sectionTitle}>สรุปวันนี้</Text>
          <View style={s.row}>
            <StatCard label="รายรับ" value={data?.today_income||0} color="#00D4AA" icon="arrow-up-circle" />
            <StatCard label="รายจ่าย" value={data?.today_expense||0} color="#FF4757" icon="arrow-down-circle" />
            <StatCard label="คงเหลือ" value={data?.net_balance||0} color={(data?.net_balance||0)>=0?"#FFA502":"#FF4757"} icon="wallet" />
          </View>
        </View>
        {data?.weekly_data && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>รายรับ 7 วัน</Text>
            <View style={s.chartCard}>
              <BarChart data={{ labels: weekDays, datasets: [{ data: data.weekly_data.map(d => d.income||0) }] }}
                width={SCREEN_WIDTH-48} height={200} chartConfig={chartConfig} style={s.chart} fromZero showValuesOnTopOfBars />
            </View>
          </View>
        )}
        {data?.weekly_data && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>แนวโน้ม 7 วัน</Text>
            <View style={s.chartCard}>
              <LineChart data={{ labels: weekDays, datasets: [
                  { data: data.weekly_data.map(d => d.income||0), color: () => "#00D4AA", strokeWidth: 2 },
                  { data: data.weekly_data.map(d => d.expense||0), color: () => "#FF4757", strokeWidth: 2 },
                ], legend: ["รายรับ","รายจ่าย"] }}
                width={SCREEN_WIDTH-48} height={200} chartConfig={chartConfig} style={s.chart} bezier fromZero />
            </View>
          </View>
        )}
        <View style={s.section}>
          <Text style={s.sectionTitle}>สรุปเดือนนี้</Text>
          <View style={s.monthCard}>
            <View style={s.monthRow}><View style={[s.dot,{backgroundColor:"#00D4AA"}]}/><Text style={s.monthLabel}>รายรับรวม</Text><Text style={[s.monthValue,{color:"#00D4AA"}]}>+{(data?.monthly_summary?.income||0).toLocaleString()} บาท</Text></View>
            <View style={s.monthRow}><View style={[s.dot,{backgroundColor:"#FF4757"}]}/><Text style={s.monthLabel}>รายจ่ายรวม</Text><Text style={[s.monthValue,{color:"#FF4757"}]}>-{(data?.monthly_summary?.expense||0).toLocaleString()} บาท</Text></View>
            <View style={s.divider}/>
            <View style={s.monthRow}><View style={[s.dot,{backgroundColor:"#FFA502"}]}/><Text style={[s.monthLabel,{fontWeight:"700"}]}>กำไร/ขาดทุน</Text>
              <Text style={[s.monthValue,{color:(data?.monthly_summary?.profit||0)>=0?"#00D4AA":"#FF4757",fontSize:18}]}>
                {(data?.monthly_summary?.profit||0)>=0?"+":""}{(data?.monthly_summary?.profit||0).toLocaleString()} บาท</Text></View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
      <Text style={[s.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// =================== ADD SCREEN ===================
function AddScreen() {
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const CATS = type === "income"
    ? ["วิ่งงาน","โบนัส","ทิป","เงินเดือน","อื่นๆ"]
    : ["อาหาร","เชื้อเพลิง","โทรศัพท์","ที่พัก","อุปกรณ์","อื่นๆ"];

  const submit = async () => {
    if (!amount || !category) { setMsg("กรุณากรอกจำนวนเงินและหมวดหมู่"); return; }
    setLoading(true);
    try {
      await fetch(`${API_URL}/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: parseFloat(amount), category, note }),
      });
      setMsg("✅ บันทึกแล้ว!");
      setAmount(""); setNote(""); setCategory("");
    } catch { setMsg("❌ ไม่สามารถบันทึกได้"); }
    finally { setLoading(false); setTimeout(() => setMsg(""), 3000); }
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#0D1117","#1A1F2E"]} style={s.header}>
          <Text style={s.headerTitle}>เพิ่มรายการ</Text>
        </LinearGradient>
        <View style={s.section}>
          <View style={s.toggle}>
            <TouchableOpacity style={[s.toggleBtn, type==="income" && { backgroundColor: "#00D4AA" }]} onPress={() => { setType("income"); setCategory(""); }}>
              <Text style={[s.toggleText, type==="income" && { color: "#0D1117" }]}>💰 รายรับ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, type==="expense" && { backgroundColor: "#FF4757" }]} onPress={() => { setType("expense"); setCategory(""); }}>
              <Text style={[s.toggleText, type==="expense" && { color: "#fff" }]}>💸 รายจ่าย</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.label}>จำนวนเงิน (บาท)</Text>
          <View style={s.amountBox}>
            <Text style={s.currency}>฿</Text>
            <Text style={s.amountInput}>{amount || "0"}</Text>
          </View>
          <View style={s.numpad}>
            {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(k => (
              <TouchableOpacity key={k} style={[s.key, k==="✓" && { backgroundColor: type==="income"?"#00D4AA":"#FF4757" }]}
                onPress={() => {
                  if (k==="⌫") setAmount(a => a.slice(0,-1));
                  else if (k==="✓") submit();
                  else setAmount(a => a+k);
                }}>
                <Text style={[s.keyText, k==="✓" && { color:"#fff", fontSize:20 }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.label}>หมวดหมู่</Text>
          <View style={s.catGrid}>
            {CATS.map(c => (
              <TouchableOpacity key={c} style={[s.catBtn, category===c && { backgroundColor:"#00D4AA", borderColor:"#00D4AA" }]} onPress={() => setCategory(c)}>
                <Text style={[s.catText, category===c && { color:"#0D1117" }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// =================== HISTORY SCREEN ===================
function HistoryScreen() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);

  const loadData = useCallback(async () => {
    try {
      let url = `${API_URL}/transactions?limit=100`;
      if (filter === "income") url += "&type=income";
      if (filter === "expense") url += "&type=expense";
      if (filter === "today") url += "&period=today";
      if (filter === "month") url += "&period=month";
      const res = await fetch(url);
      const json = await res.json();
      setTxns(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); loadData(); }, [filter]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteSingle = async (id) => {
    Alert.alert("ยืนยัน", "ลบรายการนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: async () => {
        await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
        loadData();
      }},
    ]);
  };

  const deleteSelected = async () => {
    if (!selected.length) return;
    Alert.alert("ยืนยัน", `ลบ ${selected.length} รายการ?`, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: async () => {
        await fetch(`${API_URL}/transactions/bulk`, {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selected }),
        });
        setSelected([]);
        loadData();
      }},
    ]);
  };

  const totalIncome = txns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense = txns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

  const FILTERS = [
    { key: "all", label: "ทั้งหมด" },
    { key: "today", label: "วันนี้" },
    { key: "month", label: "เดือนนี้" },
    { key: "income", label: "💰 รับ" },
    { key: "expense", label: "💸 จ่าย" },
  ];

  return (
    <View style={s.container}>
      <LinearGradient colors={["#0D1117","#1A1F2E"]} style={s.header}>
        <Text style={s.headerTitle}>ประวัติรายการ</Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[s.filterBtn, filter===f.key && s.filterBtnActive]} onPress={() => { setFilter(f.key); setSelected([]); }}>
            <Text style={[s.filterText, filter===f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={s.summaryBar}>
        <Text style={[s.summaryText, {color:"#00D4AA"}]}>+{totalIncome.toLocaleString()} ฿</Text>
        <Text style={[s.summaryText, {color:"#8A9BB0"}]}>{txns.length} รายการ</Text>
        <Text style={[s.summaryText, {color:"#FF4757"}]}>-{totalExpense.toLocaleString()} ฿</Text>
      </View>

      {/* Delete Bar */}
      {selected.length > 0 && (
        <View style={s.deleteBar}>
          <Text style={s.deleteBarText}>เลือก {selected.length} รายการ</Text>
          <TouchableOpacity style={s.deleteBarBtn} onPress={deleteSelected}>
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={s.deleteBarBtnText}>ลบที่เลือก</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#00D4AA" /></View>
      ) : (
        <FlatList
          data={txns}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#00D4AA" />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.emptyText}>ไม่มีรายการ</Text>}
          renderItem={({ item }) => {
            const isIncome = item.type === "income";
            const isSelected = selected.includes(item.id);
            const d = new Date(item.createdAt);
            const date = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
            return (
              <TouchableOpacity onPress={() => toggleSelect(item.id)} onLongPress={() => toggleSelect(item.id)}
                style={[s.txnCard, isSelected && s.txnCardSelected]}>
                <View style={[s.txnIcon, { backgroundColor: isIncome?"#00D4AA22":"#FF475722" }]}>
                  <Ionicons name={isIncome?"arrow-up-circle":"arrow-down-circle"} size={24} color={isIncome?"#00D4AA":"#FF4757"} />
                </View>
                <View style={s.txnInfo}>
                  <Text style={s.txnCategory}>{item.category}</Text>
                  <Text style={s.txnDate}>{date}</Text>
                  {item.note ? <Text style={s.txnNote}>{item.note}</Text> : null}
                </View>
                <View style={s.txnRight}>
                  <Text style={[s.txnAmount, { color: isIncome?"#00D4AA":"#FF4757" }]}>
                    {isIncome?"+":"-"}{item.amount.toLocaleString()} ฿
                  </Text>
                  <TouchableOpacity onPress={() => deleteSingle(item.id)} style={s.delBtn}>
                    <Ionicons name="trash-outline" size={18} color="#FF4757" />
                  </TouchableOpacity>
                </View>
                {isSelected && <View style={s.checkmark}><Ionicons name="checkmark-circle" size={22} color="#00D4AA" /></View>}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

// =================== STYLES ===================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D1117" },
  loadingText: { color: "#8A9BB0", marginTop: 12 },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerDate: { fontSize: 13, color: "#8A9BB0", marginTop: 4 },
  riderCard: { marginHorizontal: 24, borderRadius: 20, padding: 28, alignItems: "center", marginBottom: 8 },
  riderLabel: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.9)", marginBottom: 8 },
  riderAmount: { fontSize: 56, fontWeight: "900", color: "#fff", letterSpacing: -2 },
  riderUnit: { fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  riderStatus: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#1A1F2E", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#252D3D" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#8A9BB0", marginTop: 4 },
  chartCard: { backgroundColor: "#1A1F2E", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#252D3D" },
  chart: { borderRadius: 16, marginLeft: -8 },
  monthCard: { backgroundColor: "#1A1F2E", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#252D3D" },
  monthRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  monthLabel: { flex: 1, fontSize: 15, color: "#8A9BB0" },
  monthValue: { fontSize: 15, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#252D3D", marginVertical: 6, marginBottom: 14 },
  toggle: { flexDirection: "row", backgroundColor: "#1A1F2E", borderRadius: 14, padding: 4, borderWidth: 1, borderColor: "#252D3D" },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  toggleText: { fontSize: 16, color: "#8A9BB0", fontWeight: "600" },
  label: { fontSize: 13, color: "#8A9BB0", marginBottom: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  amountBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1F2E", borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: "#252D3D", marginBottom: 16 },
  currency: { fontSize: 28, color: "#8A9BB0", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: "800", color: "#fff", paddingVertical: 16 },
  numpad: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  key: { width: (SCREEN_WIDTH-68)/3, paddingVertical: 18, backgroundColor: "#1A1F2E", borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#252D3D" },
  keyText: { fontSize: 22, color: "#fff", fontWeight: "600" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1A1F2E", borderWidth: 1, borderColor: "#252D3D" },
  catText: { color: "#8A9BB0", fontWeight: "600" },
  msg: { textAlign: "center", color: "#00D4AA", fontSize: 16, marginTop: 8 },
  filterScroll: { maxHeight: 50, marginTop: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#1A1F2E", borderWidth: 1, borderColor: "#252D3D" },
  filterBtnActive: { backgroundColor: "#00D4AA", borderColor: "#00D4AA" },
  filterText: { color: "#8A9BB0", fontWeight: "600", fontSize: 14 },
  filterTextActive: { color: "#0D1117" },
  summaryBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#252D3D" },
  summaryText: { fontSize: 15, fontWeight: "700" },
  deleteBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FF475722", borderWidth: 1, borderColor: "#FF4757", marginHorizontal: 24, marginTop: 8, borderRadius: 12, padding: 12 },
  deleteBarText: { color: "#FF4757", fontWeight: "700" },
  deleteBarBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FF4757", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  deleteBarBtnText: { color: "#fff", fontWeight: "700" },
  txnCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1F2E", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#252D3D" },
  txnCardSelected: { borderColor: "#00D4AA", backgroundColor: "#00D4AA11" },
  txnIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txnInfo: { flex: 1 },
  txnCategory: { fontSize: 16, fontWeight: "700", color: "#fff" },
  txnDate: { fontSize: 12, color: "#8A9BB0", marginTop: 2 },
  txnNote: { fontSize: 12, color: "#8A9BB0", marginTop: 2 },
  txnRight: { alignItems: "flex-end", gap: 8 },
  txnAmount: { fontSize: 16, fontWeight: "800" },
  delBtn: { padding: 4 },
  checkmark: { position: "absolute", top: 8, right: 8 },
  emptyText: { textAlign: "center", color: "#8A9BB0", marginTop: 40, fontSize: 16 },
});

// =================== NAVIGATION ===================
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: "#1A1F2E", borderTopColor: "#252D3D", height: 80, paddingBottom: 20, paddingTop: 10 },
          tabBarActiveTintColor: "#00D4AA",
          tabBarInactiveTintColor: "#8A9BB0",
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Dashboard: focused ? "speedometer" : "speedometer-outline",
              เพิ่มรายการ: focused ? "add-circle" : "add-circle-outline",
              ประวัติ: focused ? "list" : "list-outline",
              "เช็คงาน": focused ? "bicycle" : "bicycle-outline",
              "เงินก่อนเริ่มงาน": focused ? "cash" : "cash-outline",
            };
            return <Ionicons name={icons[route.name]} size={26} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="เพิ่มรายการ" component={AddScreen} />
        <Tab.Screen name="ประวัติ" component={HistoryScreen} />
        <Tab.Screen name="เช็คงาน" component={RiderScreen} />
        <Tab.Screen name="เงินก่อนเริ่มงาน" component={CashShiftScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}








