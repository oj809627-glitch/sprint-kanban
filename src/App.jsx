// ================================
// Sprint Kanban - 完整版
// ✅ Feature 拖曳功能
// ✅ 日期時間選擇器
// ✅ 唯讀模式 + 密碼保護
// ✅ localStorage 自動保存
// ✅ Telegram 通知功能
// ================================

import { useState, useRef, useEffect } from "react";
import { motion, Reorder } from "framer-motion";

const cardStyle = {
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  width: "400px",           // 桌面固定寬度
  minWidth: "400px",        // 最小寬度
  maxWidth: "400px",        // 最大寬度
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s, box-shadow 0.3s",
  wordWrap: "break-word",   // 長單詞自動換行
  overflowWrap: "break-word", // 確保內容換行
};

// 移動裝置卡片樣式
const mobileCardStyle = {
  ...cardStyle,
  width: "calc(100vw - 48px)",  // 移動裝置寬度適應螢幕
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

const draggingItemStyle = {
  opacity: 0.6,
  cursor: "grabbing",
  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
  transform: "scale(1.05)",
};

const uid = () => Math.random().toString(36).slice(2, 9);
const FEATURE_TYPES = ["Main", "Optimize", "Bug", "Hotfix"];
const STORAGE_KEY = "sprint-kanban-data";

// Telegram 設定
const TELEGRAM_BOT_TOKEN = "8248762164:AAHk7Rf_qITMK9C8M6ZD5c0mPHnqJ_iYjto";
const TELEGRAM_CHAT_IDS = [
  "-1003629189994",  // 群組 1
  "-1003548454222"   // 群組 2
];

const initialSprints = [
  {
    id: "s1",
    name: "Sprint 12",
    uatDate: "2026-01-07 14:00",
    prodDate: "2026-01-09 18:00",
    maintenanceStart: "",  // 維運開始時間
    maintenanceEnd: "",    // 維運結束時間
    notes: "",             // 備註
    items: [
      { id: "f1", title: "Login Flow", type: "Main" },
      { id: "f2", title: "Token Refresh", type: "Optimize" },
    ],
  },
];

// 從 localStorage 載入資料
const loadSprintsFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('✅ 從 localStorage 載入資料:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('❌ 載入資料失敗:', error);
  }
  console.log('📝 使用初始資料');
  return initialSprints;
};

export default function SprintKanban({ 
  readOnly: readOnlyProp = true, 
  adminPassword = "admin123"
}) {
  const [sprints, setSprints] = useState(loadSprintsFromStorage());
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOverSprintId, setDragOverSprintId] = useState(null);
  const [newSprint, setNewSprint] = useState({ 
    name: "", 
    uatDate: "", 
    prodDate: "", 
    maintenanceStart: "", 
    maintenanceEnd: "", 
    notes: "" 
  });
  const [newItem, setNewItem] = useState({ title: "", type: "Main" });
  
  // 內部狀態控制唯讀模式（預設為 true = 唯讀）
  const [readOnly, setReadOnly] = useState(readOnlyProp);
  
  // 偵測是否為移動裝置
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 處理切換到編輯模式（需要密碼驗證）
  const handleToggleEditMode = () => {
    if (readOnly) {
      const inputPassword = prompt('🔐 請輸入管理員密碼以切換到編輯模式：');
      
      if (inputPassword === null) {
        return;
      }
      
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

  // 每次 sprints 改變時，自動保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints));
      console.log('💾 資料已保存到 localStorage');
    } catch (error) {
      console.error('❌ 保存資料失敗:', error);
    }
  }, [sprints]);

  // 輔助函數：將 "YYYY-MM-DD HH:mm" 轉換為 "YYYY-MM-DDTHH:mm" (datetime-local 格式)
  const toDatetimeLocal = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.replace(" ", "T");
  };

  // 輔助函數：將 "YYYY-MM-DDTHH:mm" 轉換為 "YYYY-MM-DD HH:mm" (顯示格式)
  const fromDatetimeLocal = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.replace("T", " ");
  };

  const addSprint = () => {
    if (!newSprint.name) return;
    setSprints([...sprints, { 
      id: uid(), 
      name: newSprint.name,
      uatDate: newSprint.uatDate,
      prodDate: newSprint.prodDate,
      maintenanceStart: newSprint.maintenanceStart,
      maintenanceEnd: newSprint.maintenanceEnd,
      notes: newSprint.notes,
      items: [] 
    }]);
    setNewSprint({ 
      name: "", 
      uatDate: "", 
      prodDate: "", 
      maintenanceStart: "", 
      maintenanceEnd: "", 
      notes: "" 
    });
  };

  const updateSprint = (id, field, value) => {
    setSprints(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, [field]: value } : s));
      return updated;
    });
  };

  const deleteSprint = (id) => {
    if (confirm('確定要刪除這個 Sprint 嗎？')) {
      setSprints(prev => prev.filter(s => s.id !== id));
    }
  };

  const addItem = sprintId => {
    if (!newItem.title) return;
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, items: [...s.items, { id: uid(), ...newItem }] } : s));
    setNewItem({ title: "", type: "Main" });
  };

  const moveItem = (fromId, toId, item) => {
    setSprints(prev => {
      // 先從來源 sprint 移除 item
      const updatedSprints = prev.map(s => {
        if (s.id === fromId) {
          const newItems = s.items.filter(i => i.id !== item.id);
          return { ...s, items: newItems };
        }
        return s;
      });
      
      // 再將 item 加到目標 sprint
      const finalSprints = updatedSprints.map(s => {
        if (s.id === toId) {
          const newItems = [...s.items, item];
          return { ...s, items: newItems };
        }
        return s;
      });
      
      return finalSprints;
    });
  };

  // 在同一個 Sprint 內重新排序 items
  const reorderItems = (sprintId, newOrderedItems) => {
    setSprints(prev => prev.map(sprint => 
      sprint.id === sprintId ? { ...sprint, items: newOrderedItems } : sprint
    ));
  };

  const updateItem = (sprintId, itemId, field, value) => {
    setSprints(prev => prev.map(s => 
      s.id === sprintId 
        ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : s
    ));
  };

  const deleteItem = (sprintId, itemId) => {
    if (confirm('確定要刪除這個 Feature 嗎？')) {
      setSprints(prev => prev.map(s => 
        s.id === sprintId 
          ? { ...s, items: s.items.filter(i => i.id !== itemId) }
          : s
      ));
    }
  };

  const notifyTG = async (sprint, env) => {
    const date = env === "UAT" ? sprint.uatDate : sprint.prodDate;
    const featureCount = sprint.items.length;
    const features = sprint.items.map(item => `  • ${item.title} (${item.type})`).join('\n');
    
    const message = `🎉 <b>${sprint.name}（${env}）已上版</b>

📅 時間：${date}
📦 功能數量：${featureCount}

<b>功能清單：</b>
${features || '  無'}`;

    try {
      console.log('📤 發送 Telegram 通知到多個群組:', TELEGRAM_CHAT_IDS);
      
      // 發送到所有群組
      const promises = TELEGRAM_CHAT_IDS.map(chatId => 
        fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "HTML"
            }),
          }
        ).then(res => res.json())
      );

      const results = await Promise.all(promises);
      
      // 檢查結果
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;
      
      console.log(`✅ 成功發送: ${successCount} 個群組`);
      if (failCount > 0) {
        console.log(`❌ 失敗: ${failCount} 個群組`);
        results.forEach((r, i) => {
          if (!r.ok) {
            console.error(`群組 ${TELEGRAM_CHAT_IDS[i]} 發送失敗:`, r);
          }
        });
      }
      
      if (successCount > 0) {
        alert(`✅ Telegram 通知已送出到 ${successCount} 個群組${failCount > 0 ? `（${failCount} 個失敗）` : ''}`);
      } else {
        alert('❌ 所有群組發送失敗，請檢查設定');
      }
    } catch (error) {
      console.error('❌ 發送 Telegram 通知失敗:', error);
      alert("❌ 發送失敗，請檢查網路連線");
    }
  };

  // Prod 上版前提醒
  const notifyProdReminder = async (sprint) => {
    const maintenanceTime = sprint.maintenanceStart && sprint.maintenanceEnd 
      ? `${sprint.maintenanceStart} ~ ${sprint.maintenanceEnd}`
      : '未設定';
    
    const message = `⚠️ <b>${sprint.name} (Prod) 上版提醒</b>

📅 時間：${sprint.prodDate || '未設定'}
🔧 維運時間：${maintenanceTime}
📝 注意事項：${sprint.notes || '無'}`;

    try {
      console.log('📤 發送 Prod 上版提醒到多個群組:', TELEGRAM_CHAT_IDS);
      
      const promises = TELEGRAM_CHAT_IDS.map(chatId => 
        fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "HTML"
            }),
          }
        ).then(res => res.json())
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        alert(`✅ Prod 上版提醒已送出到 ${successCount} 個群組${failCount > 0 ? `（${failCount} 個失敗）` : ''}`);
      } else {
        alert('❌ 所有群組發送失敗，請檢查設定');
      }
    } catch (error) {
      console.error('❌ 發送 Prod 上版提醒失敗:', error);
      alert("❌ 發送失敗，請檢查網路連線");
    }
  };

  // 使用 ref 來儲存每個 sprint 的 drop zone 元素
  const sprintDropZonesRef = useRef({});

  // 使用 ref 來追蹤是否正在拖曳（避免閉包問題）
  const isDraggingRef = useRef(false);
  const dragOverSprintIdRef = useRef(null);

  const handleDragStart = (sprintId, itemId) => {
    const dragKey = `${sprintId}-${itemId}`;
    setDraggingItemId(dragKey);
    isDraggingRef.current = true;
    
    // 添加全局 mousemove 監聽器來追蹤拖曳位置
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      
      const x = e.clientX;
      const y = e.clientY;
      
      let foundSprintId = null;
      
      // 直接檢查每個 drop zone 的位置
      for (const [sprintIdKey, dropZoneElement] of Object.entries(sprintDropZonesRef.current)) {
        if (!dropZoneElement) continue;
        
        const rect = dropZoneElement.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          foundSprintId = sprintIdKey;
          break;
        }
      }
      
      // 更新 dragOverSprintId
      if (foundSprintId && foundSprintId !== dragOverSprintIdRef.current) {
        dragOverSprintIdRef.current = foundSprintId;
        setDragOverSprintId(foundSprintId);
      } else if (!foundSprintId && dragOverSprintIdRef.current) {
        dragOverSprintIdRef.current = null;
        setDragOverSprintId(null);
      }
    };
    
    // 添加監聽器
    document.addEventListener('mousemove', handleMouseMove);
    
    // 儲存清理函數（在 dragEnd 時使用）
    window._dragMouseMoveHandler = handleMouseMove;
  };

  const handleDragEnd = (fromSprintId, item) => {
    // 移除全局 mousemove 監聽器
    if (window._dragMouseMoveHandler) {
      document.removeEventListener('mousemove', window._dragMouseMoveHandler);
      window._dragMouseMoveHandler = null;
    }
    
    isDraggingRef.current = false;
    
    // 使用 ref 中的值來判斷目標（確保是最新的）
    const targetSprintId = dragOverSprintIdRef.current;
    
    // 只要有目標 sprint 且與來源不同，就執行移動
    if (targetSprintId && targetSprintId !== fromSprintId) {
      moveItem(fromSprintId, targetSprintId, item);
    }
    
    // 清除拖曳狀態
    dragOverSprintIdRef.current = null;
    setDraggingItemId(null);
    setDragOverSprintId(null);
  };

  return (
    <div 
      style={{ 
        padding: isMobile ? '16px' : '36px', 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5' 
      }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        marginBottom: '24px',
        gap: isMobile ? '12px' : '0'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '24px' : '34px', 
          fontWeight: '700', 
          margin: 0, 
          color: '#1f2937' 
        }}>Sprint Kanban</h1>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: '12px',
          width: isMobile ? '100%' : 'auto'
        }}>
          {readOnly && (
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#dc2626', 
              backgroundColor: '#fee2e2', 
              padding: '6px 12px', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              🔒 唯讀模式
            </span>
          )}
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: readOnly ? '#16a34a' : '#dc2626',
              marginRight: 0,
              width: isMobile ? '100%' : 'auto'
            }}
            onClick={handleToggleEditMode}
          >
            {readOnly ? '🔓 切換到編輯模式' : '🔒 切換到唯讀模式'}
          </button>
          {!readOnly && (
            <button 
              style={{
                ...dangerButtonStyle,
                marginRight: 0,
                width: isMobile ? '100%' : 'auto'
              }}
              onClick={() => {
                if (confirm('⚠️ 確定要清除所有資料嗎？此操作無法復原！')) {
                  localStorage.removeItem(STORAGE_KEY);
                  setSprints(initialSprints);
                  alert('✅ 已清除所有資料並重置為初始狀態');
                }
              }}
            >
              🗑️ 清除所有資料
            </button>
          )}
        </div>
      </div>

      {/* Add Sprint */}
      {!readOnly && (
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>新增 Sprint</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Sprint 名稱</label>
              <input 
                style={inputStyle} 
                placeholder="例如: Sprint 13" 
                value={newSprint.name} 
                onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>UAT 日期</label>
              <input 
                type="datetime-local"
                style={inputStyle} 
                value={toDatetimeLocal(newSprint.uatDate)} 
                onChange={e => setNewSprint({ ...newSprint, uatDate: fromDatetimeLocal(e.target.value) })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Prod 日期</label>
              <input 
                type="datetime-local"
                style={inputStyle} 
                value={toDatetimeLocal(newSprint.prodDate)} 
                onChange={e => setNewSprint({ ...newSprint, prodDate: fromDatetimeLocal(e.target.value) })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>維運開始時間</label>
              <input 
                type="datetime-local"
                style={inputStyle} 
                value={toDatetimeLocal(newSprint.maintenanceStart)} 
                onChange={e => setNewSprint({ ...newSprint, maintenanceStart: fromDatetimeLocal(e.target.value) })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>維運結束時間</label>
              <input 
                type="datetime-local"
                style={inputStyle} 
                value={toDatetimeLocal(newSprint.maintenanceEnd)} 
                onChange={e => setNewSprint({ ...newSprint, maintenanceEnd: fromDatetimeLocal(e.target.value) })}
                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: '1 1 100%', minWidth: '200px' }}>
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

      {/* Horizontal Sprints */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '24px', 
        overflowX: isMobile ? 'visible' : 'auto', 
        paddingBottom: '24px' 
      }}>
        {sprints.map((sprint, idx) => (
          <div 
            key={`${sprint.id}-${sprint.items.length}`} 
            style={isMobile ? mobileCardStyle : cardStyle} 
            onMouseEnter={e => !isMobile && (e.currentTarget.style.transform='scale(1.03)')} 
            onMouseLeave={e => !isMobile && (e.currentTarget.style.transform='scale(1)')}
          >
            {/* Sprint Header */}
            {editingSprintId === sprint.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Sprint 名稱</label>
                <input 
                  style={inputStyle}
                  value={sprint.name} 
                  onChange={e => updateSprint(sprint.id, "name", e.target.value)}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>UAT 日期</label>
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.uatDate)} 
                  onChange={e => updateSprint(sprint.id, "uatDate", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Prod 日期</label>
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.prodDate)} 
                  onChange={e => updateSprint(sprint.id, "prodDate", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>維運開始時間</label>
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.maintenanceStart)} 
                  onChange={e => updateSprint(sprint.id, "maintenanceStart", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>維運結束時間</label>
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.maintenanceEnd)} 
                  onChange={e => updateSprint(sprint.id, "maintenanceEnd", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
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
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '22px', 
                  marginBottom: '8px', 
                  color: '#1f2937',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>{sprint.name}</h2>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>📅 UAT: {sprint.uatDate || '未設定'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>🚀 Prod: {sprint.prodDate || '未設定'}</div>
                {sprint.maintenanceStart && sprint.maintenanceEnd && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    🔧 維運: {sprint.maintenanceStart} ~ {sprint.maintenanceEnd}
                  </div>
                )}
                {sprint.notes && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    marginTop: '8px', 
                    padding: '8px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',  // 保留換行符號
                    maxHeight: '120px',      // 最大高度
                    overflowY: 'auto'        // 超過高度顯示捲軸
                  }}>
                    📝 {sprint.notes}
                  </div>
                )}
              </>
            )}

            {/* Separator */}
            {!readOnly && <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />}

            {/* Sprint Actions */}
            {!readOnly && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button style={buttonStyle} onClick={() => notifyTG(sprint, "UAT")}>通知 UAT</button>
                  <button style={buttonStyle} onClick={() => notifyTG(sprint, "Prod")}>通知 Prod</button>
                  <button 
                    style={{ ...buttonStyle, backgroundColor: '#ea580c' }} 
                    onClick={() => notifyProdReminder(sprint)}
                  >
                    ⚠️ Prod 上版前提醒
                  </button>
                  {editingSprintId === sprint.id ? (
                    <button style={buttonStyle} onClick={() => setEditingSprintId(null)}>儲存</button>
                  ) : (
                    <>
                      <button style={secondaryButtonStyle} onClick={() => setEditingSprintId(sprint.id)}>編輯</button>
                      <button style={dangerButtonStyle} onClick={() => deleteSprint(sprint.id)}>刪除</button>
                    </>
                  )}
                </div>

                {/* Separator */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
              </>
            )}

            {/* Add Feature */}
            {!readOnly && (
              <>
                {/* Separator */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
                
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
                    <button style={buttonStyle} onClick={() => addItem(sprint.id)}>+ 新增 Feature</button>
                  </div>
                </div>

                {/* Separator */}
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
                  ref={(el) => {
                    if (el) {
                      sprintDropZonesRef.current[sprint.id] = el;
                    } else {
                      delete sprintDropZonesRef.current[sprint.id];
                    }
                  }}
                  data-sprint-id={sprint.id}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px',
                    minHeight: '60px',
                    padding: dragOverSprintId === sprint.id ? '8px' : '0',
                    ...(dragOverSprintId === sprint.id ? dropZoneActiveStyle : {}),
                  }}
                >
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: dragOverSprintId === sprint.id ? '#1d4ed8' : '#9ca3af', 
                    fontSize: '14px',
                    fontWeight: dragOverSprintId === sprint.id ? '600' : '400',
                  }}>
                    {dragOverSprintId === sprint.id ? '⬇️ 放開以移動 Feature' : '尚無 Features'}
                  </div>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={sprint.items}
                  onReorder={(newOrder) => !readOnly && reorderItems(sprint.id, newOrder)}
                  ref={(el) => {
                    if (el) {
                      sprintDropZonesRef.current[sprint.id] = el;
                    } else {
                      delete sprintDropZonesRef.current[sprint.id];
                    }
                  }}
                  data-sprint-id={sprint.id}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px',
                    minHeight: '60px',
                    padding: dragOverSprintId === sprint.id ? '8px' : '0',
                    ...(dragOverSprintId === sprint.id ? dropZoneActiveStyle : {}),
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                  }}
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
                        data-dragging-item={isDragging ? 'true' : undefined}
                        style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '10px', 
                          backgroundColor: isEditing ? '#f9fafb' : '#ffffff', 
                          cursor: readOnly ? 'default' : (isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab')),
                          boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.08)',
                          transition: isDragging ? 'none' : 'all 0.2s',
                          opacity: isDragging ? 0.6 : 1,
                          zIndex: isDragging ? 1000 : 1,
                          marginBottom: '10px',
                        }}
                        onMouseEnter={e => {
                          if (!isEditing && !isDragging) {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isEditing && !isDragging) {
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
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
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button style={buttonStyle} onClick={() => setEditingItemId(null)}>儲存</button>
                              <button style={secondaryButtonStyle} onClick={() => setEditingItemId(null)}>取消</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: '#1f2937', marginBottom: '4px' }}>{item.title}</div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#6b7280',
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: item.type === 'Main' ? '#dbeafe' : 
                                                  item.type === 'Optimize' ? '#fef3c7' :
                                                  item.type === 'Bug' ? '#fee2e2' : '#f3e8ff',
                                  color: item.type === 'Main' ? '#1e40af' : 
                                         item.type === 'Optimize' ? '#92400e' :
                                         item.type === 'Bug' ? '#991b1b' : '#6b21a8',
                                }}>
                                  {item.type}
                                </div>
                              </div>
                              {!readOnly && (
                                <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                                  <button 
                                    style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: '12px', marginRight: '0' }}
                                    onClick={() => setEditingItemId(itemEditKey)}
                                  >
                                    編輯
                                  </button>
                                  <button 
                                    style={{ ...dangerButtonStyle, padding: '6px 12px', fontSize: '12px', marginRight: '0' }}
                                    onClick={() => deleteItem(sprint.id, item.id)}
                                  >
                                    刪除
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
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
