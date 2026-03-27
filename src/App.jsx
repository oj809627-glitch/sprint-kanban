// ================================
// Sprint Kanban - Firebase 版本
// ✅ Firebase Firestore 即時同步
// ✅ 所有瀏覽器即時更新
// ✅ 重整後資料不消失
// ✅ Feature 拖曳功能
// ✅ Feature 超連結欄位
// ✅ 日期時間選擇器
// ✅ 唯讀模式 + 密碼保護
// ✅ Telegram 通知功能
// ================================

import { useState, useRef, useEffect } from "react";
import { Reorder } from "framer-motion";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCH4x5i7O0s44LnfHb6inNtrC5LC36NB7I",
  authDomain: "sprint-kanban.firebaseapp.com",
  projectId: "sprint-kanban",
  storageBucket: "sprint-kanban.firebasestorage.app",
  messagingSenderId: "1018029999962",
  appId: "1:1018029999962:web:146d258efa47e27d52d563"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const KANBAN_DOC = doc(db, "kanban", "sprints");

const cardStyle = {
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  width: "400px",
  minWidth: "400px",
  maxWidth: "400px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s, box-shadow 0.3s",
  wordWrap: "break-word",
  overflowWrap: "break-word",
};

const mobileCardStyle = {
  ...cardStyle,
  width: "calc(100vw - 48px)",
  minWidth: "280px",
  maxWidth: "calc(100vw - 48px)",
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  backgroundColor: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  marginRight: "6px",
  fontWeight: "500",
  transition: "background-color 0.2s, transform 0.2s",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6b7280",
};

const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#dc2626",
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const inputFocusStyle = {
  borderColor: "#1d4ed8",
  boxShadow: "0 0 0 3px rgba(29, 78, 216, 0.1)",
};

const dropZoneActiveStyle = {
  border: "2px dashed #1d4ed8",
  backgroundColor: "#eff6ff",
  borderRadius: "10px",
  transition: "all 0.2s",
};

const uid = () => Math.random().toString(36).slice(2, 9);
const FEATURE_TYPES = ["Main", "Optimize", "Bug", "Hotfix"];

const TELEGRAM_BOT_TOKEN = "8248762164:AAHk7Rf_qITMK9C8M6ZD5c0mPHnqJ_iYjto";
const TELEGRAM_CHAT_IDS = [
  "-1003629189994",
  "-1003548454222"
];

const initialSprints = [
  {
    id: "s1",
    name: "Sprint 12",
    uatDate: "2026-01-07 14:00",
    prodDate: "2026-01-09 18:00",
    maintenanceStart: "",
    maintenanceEnd: "",
    notes: "",
    items: [
      { id: "f1", title: "Login Flow", type: "Main", url: "" },
      { id: "f2", title: "Token Refresh", type: "Optimize", url: "" },
    ],
  },
];

export default function SprintKanban({
  readOnly: readOnlyProp = true,
  adminPassword = "admin123"
}) {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOverSprintId, setDragOverSprintId] = useState(null);
  const [newSprint, setNewSprint] = useState({
    name: "", uatDate: "", prodDate: "",
    maintenanceStart: "", maintenanceEnd: "", notes: ""
  });
  const [newItem, setNewItem] = useState({ title: "", type: "Main", url: "" });
  const [readOnly, setReadOnly] = useState(readOnlyProp);
  const [isMobile, setIsMobile] = useState(false);

  const isLocalUpdate = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(KANBAN_DOC, (snapshot) => {
      if (isLocalUpdate.current) {
        isLocalUpdate.current = false;
        return;
      }
      if (snapshot.exists()) {
        setSprints(snapshot.data().sprints || []);
      } else {
        saveToFirestore(initialSprints);
        setSprints(initialSprints);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore 監聽失敗:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirestore = async (data) => {
    try {
      await setDoc(KANBAN_DOC, { sprints: data });
    } catch (error) {
      console.error("儲存 Firestore 失敗:", error);
      alert("❌ 儲存失敗，請檢查 Firestore 設定");
    }
  };

  const updateSprints = (newSprints) => {
    isLocalUpdate.current = true;
    setSprints(newSprints);
    saveToFirestore(newSprints);
  };

  const handleToggleEditMode = () => {
    if (readOnly) {
      const inputPassword = prompt('🔐 請輸入管理員密碼以切換到編輯模式：');
      if (inputPassword === null) return;
      if (inputPassword === adminPassword) {
        setReadOnly(false);
        alert('✅ 密碼正確！已切換到編輯模式');
      } else {
        alert('❌ 密碼錯誤！無法切換到編輯模式');
      }
    } else {
      setReadOnly(true);
    }
  };

  const toDatetimeLocal = (dateStr) => dateStr ? dateStr.replace(" ", "T") : "";
  const fromDatetimeLocal = (dateStr) => dateStr ? dateStr.replace("T", " ") : "";

  const addSprint = () => {
    if (!newSprint.name) return;
    updateSprints([...sprints, { id: uid(), ...newSprint, items: [] }]);
    setNewSprint({ name: "", uatDate: "", prodDate: "", maintenanceStart: "", maintenanceEnd: "", notes: "" });
  };

  const updateSprint = (id, field, value) => {
    updateSprints(sprints.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSprint = (id) => {
    if (confirm('確定要刪除這個 Sprint 嗎？')) {
      updateSprints(sprints.filter(s => s.id !== id));
    }
  };

  const addItem = (sprintId) => {
    if (!newItem.title) return;
    updateSprints(sprints.map(s =>
      s.id === sprintId ? { ...s, items: [...s.items, { id: uid(), ...newItem }] } : s
    ));
    setNewItem({ title: "", type: "Main", url: "" });
  };

  const moveItem = (fromId, toId, item) => {
    updateSprints(sprints.map(s => {
      if (s.id === fromId) return { ...s, items: s.items.filter(i => i.id !== item.id) };
      if (s.id === toId) return { ...s, items: [...s.items, item] };
      return s;
    }));
  };

  const reorderItems = (sprintId, newOrderedItems) => {
    updateSprints(sprints.map(s =>
      s.id === sprintId ? { ...s, items: newOrderedItems } : s
    ));
  };

  const updateItem = (sprintId, itemId, field, value) => {
    updateSprints(sprints.map(s =>
      s.id === sprintId
        ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : s
    ));
  };

  const deleteItem = (sprintId, itemId) => {
    if (confirm('確定要刪除這個 Feature 嗎？')) {
      updateSprints(sprints.map(s =>
        s.id === sprintId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
      ));
    }
  };

  const notifyTG = async (sprint, env) => {
    const date = env === "UAT" ? sprint.uatDate : sprint.prodDate;
    const features = sprint.items.map(item => `  • ${item.title} (${item.type})`).join('\n');
    const message = `🎉 <b>${sprint.name}（${env}）已上版</b>\n\n📅 時間：${date}\n📦 功能數量：${sprint.items.length}\n\n<b>功能清單：</b>\n${features || '  無'}`;
    try {
      const results = await Promise.all(
        TELEGRAM_CHAT_IDS.map(chatId =>
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
          }).then(res => res.json())
        )
      );
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;
      successCount > 0
        ? alert(`✅ Telegram 通知已送出到 ${successCount} 個群組${failCount > 0 ? `（${failCount} 個失敗）` : ''}`)
        : alert('❌ 所有群組發送失敗，請檢查設定');
    } catch {
      alert("❌ 發送失敗，請檢查網路連線");
    }
  };

  const notifyProdReminder = async (sprint) => {
    const maintenanceTime = sprint.maintenanceStart && sprint.maintenanceEnd
      ? `${sprint.maintenanceStart} ~ ${sprint.maintenanceEnd}` : '未設定';
    const message = `⚠️ <b>${sprint.name} (Prod) 上版提醒</b>\n\n📅 時間：${sprint.prodDate || '未設定'}\n🔧 維運時間：${maintenanceTime}\n📝 注意事項：${sprint.notes || '無'}`;
    try {
      const results = await Promise.all(
        TELEGRAM_CHAT_IDS.map(chatId =>
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
          }).then(res => res.json())
        )
      );
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;
      successCount > 0
        ? alert(`✅ Prod 上版提醒已送出到 ${successCount} 個群組${failCount > 0 ? `（${failCount} 個失敗）` : ''}`)
        : alert('❌ 所有群組發送失敗，請檢查設定');
    } catch {
      alert("❌ 發送失敗，請檢查網路連線");
    }
  };

  const sprintDropZonesRef = useRef({});
  const isDraggingRef = useRef(false);
  const dragOverSprintIdRef = useRef(null);

  const handleDragStart = (sprintId, itemId) => {
    setDraggingItemId(`${sprintId}-${itemId}`);
    isDraggingRef.current = true;
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      let foundSprintId = null;
      for (const [key, el] of Object.entries(sprintDropZonesRef.current)) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          foundSprintId = key;
          break;
        }
      }
      if (foundSprintId && foundSprintId !== dragOverSprintIdRef.current) {
        dragOverSprintIdRef.current = foundSprintId;
        setDragOverSprintId(foundSprintId);
      } else if (!foundSprintId && dragOverSprintIdRef.current) {
        dragOverSprintIdRef.current = null;
        setDragOverSprintId(null);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    window._dragMouseMoveHandler = handleMouseMove;
  };

  const handleDragEnd = (fromSprintId, item) => {
    if (window._dragMouseMoveHandler) {
      document.removeEventListener('mousemove', window._dragMouseMoveHandler);
      window._dragMouseMoveHandler = null;
    }
    isDraggingRef.current = false;
    const targetSprintId = dragOverSprintIdRef.current;
    if (targetSprintId && targetSprintId !== fromSprintId) moveItem(fromSprintId, targetSprintId, item);
    dragOverSprintIdRef.current = null;
    setDraggingItemId(null);
    setDragOverSprintId(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '36px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>

{/* Header */}
<div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '24px', gap: isMobile ? '12px' : '0' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <h1 style={{ fontSize: isMobile ? '24px' : '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Sprint Kanban</h1>
    <button
      style={{ ...buttonStyle, backgroundColor: '#0891b2', marginRight: 0 }}
      onClick={() => window.open('https://jira-webhook-rose.vercel.app/calendar', '_blank')}
    >
      📅 行事曆
    </button>
  </div>
  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
    {readOnly && (
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fee2e2', padding: '6px 12px', borderRadius: '6px', textAlign: 'center' }}>
        🔒 唯讀模式
      </span>
    )}
    <button style={{ ...buttonStyle, backgroundColor: readOnly ? '#16a34a' : '#dc2626', marginRight: 0, width: isMobile ? '100%' : 'auto' }} onClick={handleToggleEditMode}>
      {readOnly ? '🔓 切換到編輯模式' : '🔒 切換到唯讀模式'}
    </button>
    {!readOnly && (
      <>
        <button
          style={{ ...buttonStyle, backgroundColor: '#7c3aed', marginRight: 0, width: isMobile ? '100%' : 'auto' }}
          onClick={() => window.open('https://jira-webhook-rose.vercel.app/tracker', '_blank')}
        >
          📊 Jira 追蹤
        </button>
        <button
          style={{ ...dangerButtonStyle, marginRight: 0, width: isMobile ? '100%' : 'auto' }}
          onClick={() => {
            if (confirm('⚠️ 確定要清除所有資料嗎？此操作無法復原！')) {
              updateSprints(initialSprints);
              alert('✅ 已清除所有資料並重置為初始狀態');
            }
          }}
        >
          🗑️ 清除所有資料
        </button>
      </>
    )}
  </div>
</div>
      {/* Add Sprint */}
      {!readOnly && (
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>新增 Sprint</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            {[
              { label: 'Sprint 名稱', key: 'name', type: 'text', placeholder: '例如: Sprint 13' },
              { label: 'UAT 日期', key: 'uatDate', type: 'datetime-local' },
              { label: 'Prod 日期', key: 'prodDate', type: 'datetime-local' },
              { label: '維運開始時間', key: 'maintenanceStart', type: 'datetime-local' },
              { label: '維運結束時間', key: 'maintenanceEnd', type: 'datetime-local' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>{label}</label>
                <input
                  type={type}
                  style={inputStyle}
                  placeholder={placeholder}
                  value={type === 'datetime-local' ? toDatetimeLocal(newSprint[key]) : newSprint[key]}
                  onChange={e => setNewSprint({ ...newSprint, [key]: type === 'datetime-local' ? fromDatetimeLocal(e.target.value) : e.target.value })}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
            <div style={{ flex: '1 1 100%' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>備註</label>
              <textarea
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                placeholder="注意事項..."
                value={newSprint.notes}
                onChange={e => setNewSprint({ ...newSprint, notes: e.target.value })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button style={buttonStyle} onClick={addSprint}>+ 新增 Sprint</button>
          </div>
        </div>
      )}

      {/* Sprints */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', overflowX: isMobile ? 'visible' : 'auto', paddingBottom: '24px' }}>
        {sprints.map((sprint) => (
          <div
            key={sprint.id}
            style={isMobile ? mobileCardStyle : cardStyle}
            onMouseEnter={e => !isMobile && (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => !isMobile && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {/* Sprint Header */}
            {editingSprintId === sprint.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Sprint 名稱', field: 'name', type: 'text' },
                  { label: 'UAT 日期', field: 'uatDate', type: 'datetime-local' },
                  { label: 'Prod 日期', field: 'prodDate', type: 'datetime-local' },
                  { label: '維運開始時間', field: 'maintenanceStart', type: 'datetime-local' },
                  { label: '維運結束時間', field: 'maintenanceEnd', type: 'datetime-local' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{label}</label>
                    <input
                      type={type}
                      style={{ ...inputStyle, marginTop: '4px' }}
                      value={type === 'datetime-local' ? toDatetimeLocal(sprint[field]) : sprint[field]}
                      onChange={e => updateSprint(sprint.id, field, type === 'datetime-local' ? fromDatetimeLocal(e.target.value) : e.target.value)}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>備註</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={sprint.notes || ''}
                  onChange={e => updateSprint(sprint.id, "notes", e.target.value)}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ) : (
              <>
                <h2 style={{ fontWeight: '700', fontSize: '22px', marginBottom: '8px', color: '#1f2937', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{sprint.name}</h2>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>📅 UAT: {sprint.uatDate || '未設定'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>🚀 Prod: {sprint.prodDate || '未設定'}</div>
                {sprint.maintenanceStart && sprint.maintenanceEnd && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>🔧 維運: {sprint.maintenanceStart} ~ {sprint.maintenanceEnd}</div>
                )}
                {sprint.notes && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                    📝 {sprint.notes}
                  </div>
                )}
              </>
            )}

            {!readOnly && <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />}

            {/* Sprint Actions */}
            {!readOnly && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button style={buttonStyle} onClick={() => notifyTG(sprint, "UAT")}>通知 UAT</button>
                  <button style={buttonStyle} onClick={() => notifyTG(sprint, "Prod")}>通知 Prod</button>
                  <button style={{ ...buttonStyle, backgroundColor: '#ea580c' }} onClick={() => notifyProdReminder(sprint)}>⚠️ Prod 上版前提醒</button>
                  {editingSprintId === sprint.id ? (
                    <button style={buttonStyle} onClick={() => setEditingSprintId(null)}>儲存</button>
                  ) : (
                    <>
                      <button style={secondaryButtonStyle} onClick={() => setEditingSprintId(sprint.id)}>編輯</button>
                      <button style={dangerButtonStyle} onClick={() => deleteSprint(sprint.id)}>刪除</button>
                    </>
                  )}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
              </>
            )}

            {/* Add Feature */}
            {!readOnly && (
              <>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>新增 Feature</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      style={inputStyle}
                      placeholder="Feature 名稱"
                      value={newItem.title}
                      onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <select
                      style={inputStyle}
                      value={newItem.type}
                      onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    >
                      {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      style={inputStyle}
                      placeholder="連結網址（選填）"
                      value={newItem.url}
                      onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button style={buttonStyle} onClick={() => addItem(sprint.id)}>+ 新增 Feature</button>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
              </>
            )}

            {/* Items List */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Features ({sprint.items.length})
              </h3>
              {sprint.items.length === 0 ? (
                <div
                  ref={(el) => { if (el) sprintDropZonesRef.current[sprint.id] = el; else delete sprintDropZonesRef.current[sprint.id]; }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px', padding: dragOverSprintId === sprint.id ? '8px' : '0', ...(dragOverSprintId === sprint.id ? dropZoneActiveStyle : {}) }}
                >
                  <div style={{ padding: '20px', textAlign: 'center', color: dragOverSprintId === sprint.id ? '#1d4ed8' : '#9ca3af', fontSize: '14px', fontWeight: dragOverSprintId === sprint.id ? '600' : '400' }}>
                    {dragOverSprintId === sprint.id ? '⬇️ 放開以移動 Feature' : '尚無 Features'}
                  </div>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={sprint.items}
                  onReorder={(newOrder) => !readOnly && reorderItems(sprint.id, newOrder)}
                  ref={(el) => { if (el) sprintDropZonesRef.current[sprint.id] = el; else delete sprintDropZonesRef.current[sprint.id]; }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px', listStyle: 'none', margin: 0, padding: 0, ...(dragOverSprintId === sprint.id ? dropZoneActiveStyle : {}) }}
                >
                  {sprint.items.map(item => {
                    const itemEditKey = `${sprint.id}-${item.id}`;
                    const isEditing = editingItemId === itemEditKey;
                    const isDragging = draggingItemId === itemEditKey;

                    return (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        drag={!isEditing && !readOnly}
                        dragListener={!isEditing && !readOnly}
                        onDragStart={() => !readOnly && handleDragStart(sprint.id, item.id)}
                        onDragEnd={() => !readOnly && handleDragEnd(sprint.id, item)}
                        style={{
                          padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px',
                          backgroundColor: isEditing ? '#f9fafb' : '#ffffff',
                          cursor: readOnly ? 'default' : (isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab')),
                          boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.08)',
                          transition: isDragging ? 'none' : 'all 0.2s',
                          opacity: isDragging ? 0.6 : 1,
                          zIndex: isDragging ? 1000 : 1,
                          marginBottom: '10px',
                        }}
                        onMouseEnter={e => { if (!isEditing && !isDragging) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = '#d1d5db'; } }}
                        onMouseLeave={e => { if (!isEditing && !isDragging) { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                              style={inputStyle}
                              value={item.title}
                              onChange={e => updateItem(sprint.id, item.id, "title", e.target.value)}
                              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                            />
                            <select
                              style={inputStyle}
                              value={item.type}
                              onChange={e => updateItem(sprint.id, item.id, "type", e.target.value)}
                              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                            >
                              {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input
                              style={inputStyle}
                              placeholder="連結網址（選填）"
                              value={item.url || ""}
                              onChange={e => updateItem(sprint.id, item.id, "url", e.target.value)}
                              onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button style={buttonStyle} onClick={() => setEditingItemId(null)}>儲存</button>
                              <button style={secondaryButtonStyle} onClick={() => setEditingItemId(null)}>取消</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '15px', color: '#1f2937', marginBottom: '4px' }}>
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer' }}
                                  >
                                    {item.title}
                                  </a>
                                ) : (
                                  item.title
                                )}
                              </div>
                              <div style={{
                                fontSize: '12px', display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                                backgroundColor: item.type === 'Main' ? '#dbeafe' : item.type === 'Optimize' ? '#fef3c7' : item.type === 'Bug' ? '#fee2e2' : '#f3e8ff',
                                color: item.type === 'Main' ? '#1e40af' : item.type === 'Optimize' ? '#92400e' : item.type === 'Bug' ? '#991b1b' : '#6b21a8',
                              }}>
                                {item.type}
                              </div>
                            </div>
                            {!readOnly && (
                              <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                                <button style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: '12px', marginRight: '0' }} onClick={() => setEditingItemId(itemEditKey)}>編輯</button>
                                <button style={{ ...dangerButtonStyle, padding: '6px 12px', fontSize: '12px', marginRight: '0' }} onClick={() => deleteItem(sprint.id, item.id)}>刪除</button>
                              </div>
                            )}
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
