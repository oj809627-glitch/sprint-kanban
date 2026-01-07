// ================================
// Sprint Kanban (Horizontal Sprints) + Editable + Deletable + UAT/Prod + Telegram Notify
// Pure CSS version with enhanced styling to closely match Canvas preview
// ✅ 修正：Feature 數量現在會正確更新
// ✅ 新增：原生日期時間選擇器（無需安裝套件）
// ================================

import { useState, useRef } from "react";
import { motion } from "framer-motion";

const cardStyle = {
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
  minWidth: "360px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s, box-shadow 0.3s",
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

const initialSprints = [
  {
    id: "s1",
    name: "Sprint 12",
    uatDate: "2026-01-07 14:00",
    prodDate: "2026-01-09 18:00",
    items: [
      { id: "f1", title: "Login Flow", type: "Main" },
      { id: "f2", title: "Token Refresh", type: "Optimize" },
    ],
  },
];

export default function SprintKanban({ readOnly: readOnlyProp = true, adminPassword = "admin123" }) {
  const [sprints, setSprints] = useState(initialSprints);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOverSprintId, setDragOverSprintId] = useState(null);
  const [newSprint, setNewSprint] = useState({ name: "", uatDate: "", prodDate: "" });
  const [newItem, setNewItem] = useState({ title: "", type: "Main" });
  
  // 內部狀態控制唯讀模式（預設為 true = 唯讀）
  const [readOnly, setReadOnly] = useState(readOnlyProp);
  
  // 處理切換到編輯模式（需要密碼驗證）
  const handleToggleEditMode = () => {
    if (readOnly) {
      // 從唯讀切換到編輯：需要密碼
      const inputPassword = prompt('🔐 請輸入管理員密碼以切換到編輯模式：');
      
      if (inputPassword === null) {
        // 使用者按取消
        return;
      }
      
      if (inputPassword === adminPassword) {
        setReadOnly(false);
        alert('✅ 密碼正確！已切換到編輯模式');
      } else {
        alert('❌ 密碼錯誤！無法切換到編輯模式');
      }
    } else {
      // 從編輯切換到唯讀：不需要密碼
      setReadOnly(true);
    }
  };

  // 輔助函數：將 "YYYY-MM-DD HH:mm" 轉換為 "YYYY-MM-DDTHH:mm" (datetime-local 格式)
  const toDatetimeLocal = (dateStr) => {
    console.log('📅 toDatetimeLocal 輸入:', dateStr);
    if (!dateStr) return "";
    const result = dateStr.replace(" ", "T");
    console.log('📅 toDatetimeLocal 輸出:', result);
    return result;
  };

  // 輔助函數：將 "YYYY-MM-DDTHH:mm" 轉換為 "YYYY-MM-DD HH:mm" (顯示格式)
  const fromDatetimeLocal = (dateStr) => {
    console.log('📅 fromDatetimeLocal 輸入:', dateStr);
    if (!dateStr) return "";
    const result = dateStr.replace("T", " ");
    console.log('📅 fromDatetimeLocal 輸出:', result);
    return result;
  };

  const addSprint = () => {
    if (!newSprint.name) return;
    // 確保日期格式正確（已經在 onChange 時轉換過了，直接使用）
    setSprints([...sprints, { 
      id: uid(), 
      name: newSprint.name,
      uatDate: newSprint.uatDate,
      prodDate: newSprint.prodDate,
      items: [] 
    }]);
    setNewSprint({ name: "", uatDate: "", prodDate: "" });
  };

  const updateSprint = (id, field, value) => {
    console.log('🔄 updateSprint 被呼叫:', { id, field, value });
    setSprints(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, [field]: value } : s));
      console.log('📊 更新後的 sprints:', updated);
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
    console.log('🔄 moveItem 被呼叫:', { fromId, toId, itemId: item.id });
    
    setSprints(prev => {
      console.log('📊 移動前的 sprints:', prev.map(s => ({ id: s.id, itemCount: s.items.length })));
      
      // 先從來源 sprint 移除 item
      const updatedSprints = prev.map(s => {
        if (s.id === fromId) {
          const newItems = s.items.filter(i => i.id !== item.id);
          console.log(`  🗑️ 從 ${fromId} 移除，剩餘 ${newItems.length} items`);
          return { ...s, items: newItems };
        }
        return s;
      });
      
      // 再將 item 加到目標 sprint
      const finalSprints = updatedSprints.map(s => {
        if (s.id === toId) {
          const newItems = [...s.items, item];
          console.log(`  ➕ 加到 ${toId}，現在有 ${newItems.length} items`);
          return { ...s, items: newItems };
        }
        return s;
      });
      
      console.log('📊 移動後的 sprints:', finalSprints.map(s => ({ id: s.id, itemCount: s.items.length })));
      return finalSprints;
    });
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
    const message = `🎉 ${sprint.name}（${env}）已上版\n📅 ${date}`;

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    alert("Telegram 通知已送出");
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
    
    console.log('🎯 開始拖曳:', { sprintId, itemId });
    
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
        console.log('📍 懸停在:', foundSprintId);
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
    console.log('🏁 結束拖曳:', { 
      fromSprintId, 
      targetSprintId: dragOverSprintIdRef.current,
      itemId: item.id,
      itemTitle: item.title
    });
    
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
      console.log('✅ 執行移動:', { from: fromSprintId, to: targetSprintId });
      moveItem(fromSprintId, targetSprintId, item);
    } else {
      console.log('❌ 未執行移動:', { targetSprintId, fromSprintId, same: targetSprintId === fromSprintId });
    }
    
    // 清除拖曳狀態
    dragOverSprintIdRef.current = null;
    setDraggingItemId(null);
    setDragOverSprintId(null);
  };

  return (
    <div 
      style={{ padding: '36px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Sprint Kanban</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {readOnly && (
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#dc2626', 
              backgroundColor: '#fee2e2', 
              padding: '6px 12px', 
              borderRadius: '6px' 
            }}>
              🔒 唯讀模式
            </span>
          )}
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: readOnly ? '#16a34a' : '#dc2626',
              marginRight: 0
            }}
            onClick={handleToggleEditMode}
          >
            {readOnly ? '🔓 切換到編輯模式' : '🔒 切換到唯讀模式'}
          </button>
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
            <button style={buttonStyle} onClick={addSprint}>+ 新增 Sprint</button>
          </div>
        </div>
      )}

      {/* Horizontal Sprints */}
      <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px' }}>
        {sprints.map((sprint, idx) => (
          // 🔧 修正 1: 加入 items.length 到 key，確保 React 在 items 改變時重新渲染
          <div key={`${sprint.id}-${sprint.items.length}`} style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            {/* Sprint Header */}
            {editingSprintId === sprint.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  style={inputStyle}
                  value={sprint.name} 
                  onChange={e => updateSprint(sprint.id, "name", e.target.value)}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.uatDate)} 
                  onChange={e => updateSprint(sprint.id, "uatDate", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
                <input 
                  type="datetime-local"
                  style={inputStyle}
                  value={toDatetimeLocal(sprint.prodDate)} 
                  onChange={e => updateSprint(sprint.id, "prodDate", fromDatetimeLocal(e.target.value))}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ) : (
              <>
                <h2 style={{ fontWeight: '700', fontSize: '22px', marginBottom: '8px', color: '#1f2937' }}>{sprint.name}</h2>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>📅 UAT: {sprint.uatDate || '未設定'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>🚀 Prod: {sprint.prodDate || '未設定'}</div>
              </>
            )}

            {/* Separator */}
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            {/* Sprint Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button style={buttonStyle} onClick={() => notifyTG(sprint, "UAT")}>通知 UAT</button>
              <button style={buttonStyle} onClick={() => notifyTG(sprint, "Prod")}>通知 Prod</button>
              {!readOnly && (
                editingSprintId === sprint.id ? (
                  <button style={buttonStyle} onClick={() => setEditingSprintId(null)}>儲存</button>
                ) : (
                  <>
                    <button style={secondaryButtonStyle} onClick={() => setEditingSprintId(sprint.id)}>編輯</button>
                    <button style={dangerButtonStyle} onClick={() => deleteSprint(sprint.id)}>刪除</button>
                  </>
                )
              )}
            </div>

            {/* Separator */}
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

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
                    <button style={buttonStyle} onClick={() => addItem(sprint.id)}>+ 新增 Feature</button>
                  </div>
                </div>

                {/* Separator */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />
              </>
            )}

            {/* Items List */}
            <div>
              {/* 🔧 修正 2: Feature 數量會從最新的 sprint.items.length 讀取 */}
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Features ({sprint.items.length})
              </h3>
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
                {sprint.items.length === 0 ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: dragOverSprintId === sprint.id ? '#1d4ed8' : '#9ca3af', 
                    fontSize: '14px',
                    fontWeight: dragOverSprintId === sprint.id ? '600' : '400',
                  }}>
                    {dragOverSprintId === sprint.id ? '⬇️ 放開以移動 Feature' : '尚無 Features'}
                  </div>
                ) : (
                  sprint.items.map(item => {
                    const itemEditKey = `${sprint.id}-${item.id}`;
                    const isEditing = editingItemId === itemEditKey;
                    const isDragging = draggingItemId === itemEditKey;
                    
                    return (
                      <motion.div 
                        key={item.id} 
                        drag={!isEditing && !readOnly}
                        dragMomentum={false}
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
                          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                          zIndex: isDragging ? 1000 : 1,
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
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
