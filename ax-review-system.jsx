import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── 평가 항목 데이터 ───
const EVAL_TYPES = {
  selfDev: {
    label: "자체개발 솔루션",
    sections: [
      {
        name: "개발 계획",
        maxTotal: 30,
        items: [
          { id: "sd1", label: "목적 부합성", desc: "AX 전략 정합성, 목적 명확성, 질환/업무 선정 적절성", max: 10 },
          { id: "sd2", label: "계획 충실성", desc: "개발 목표 명확성, 추진계획 구체성", max: 10 },
          { id: "sd3", label: "기술 구현 가능성", desc: "실현 가능성, 기술 선정 합리성, 인프라·자원 확보", max: 10 },
        ],
      },
      {
        name: "수행 역량",
        maxTotal: 20,
        items: [
          { id: "sd4", label: "협력 체계", desc: "내·외부 전문가/벤더 활용, 이슈 해결 체계", max: 10 },
          { id: "sd5", label: "데이터 확보", desc: "데이터 종류·규모 적정성, 품질·접근 가능성", max: 10 },
        ],
      },
      {
        name: "기대 효과",
        maxTotal: 20,
        items: [
          { id: "sd6", label: "정량 효과", desc: "업무 효율성(시간 단축률), 비용 절감(ROI), 품질 향상", max: 15 },
          { id: "sd7", label: "업무 파급효과", desc: "영향 직원 수·범위, 적용 업무 영역, 병원 기여도", max: 5 },
        ],
      },
      {
        name: "혁신성",
        maxTotal: 15,
        items: [
          { id: "sd8", label: "창의성·도전성", desc: "개발 목표·방법 창의성, 기존 대비 혁신성, 차별성", max: 10 },
          { id: "sd9", label: "AI 기술 적용", desc: "AI/LLM 적용 수준, Agentic AI 활용, 기술적 선진성", max: 5 },
        ],
      },
      {
        name: "미래 가치",
        maxTotal: 15,
        items: [
          { id: "sd10", label: "미래 가치", desc: "병원 미래 전략 연계, 의료 생태계 확장, 중장기 파급", max: 10 },
          { id: "sd11", label: "확산 가능성", desc: "타 부서 적용, 사업화 가능성(IP/로열티), 지속 가능성", max: 5 },
        ],
      },
    ],
  },
  external: {
    label: "외부 솔루션 도입",
    sections: [
      {
        name: "도입 적합성",
        maxTotal: 30,
        items: [
          { id: "ex1", label: "목적 부합성", desc: "도입 목적 명확성, 대상 질환/업무 적절성", max: 10 },
          { id: "ex2", label: "기능 적합성", desc: "업무 프로세스 부합도, 필수 기능, 커스터마이징, 편의성", max: 10 },
          { id: "ex3", label: "시스템 연계성", desc: "OCS·EMR·PACS 연계, 표준 API, 데이터 이관", max: 10 },
        ],
      },
      {
        name: "벤더 신뢰성",
        maxTotal: 20,
        items: [
          { id: "ex4", label: "사업 안정성", desc: "재무 건전성, 사업 지속성, 국내 지원 조직", max: 10 },
          { id: "ex5", label: "레퍼런스", desc: "의료기관 도입 실적, 유사 병원 사례, 다기관 검증", max: 10 },
        ],
      },
      {
        name: "비용 효율성",
        maxTotal: 20,
        items: [
          { id: "ex6", label: "TCO 분석", desc: "자체개발 대비 비용 우위, 라이선스·유지보수 적정성", max: 10 },
          { id: "ex7", label: "기대 효과", desc: "업무 효율성(시간 단축률), ROI(3~5년), 품질 향상", max: 10 },
        ],
      },
      {
        name: "혁신성",
        maxTotal: 15,
        items: [
          { id: "ex8", label: "기술 선진성", desc: "최신 AI/ML 적용, 기존 대비 혁신성, 글로벌 트렌드", max: 10 },
          { id: "ex9", label: "확장 가능성", desc: "기능 확장·업그레이드, 타 부서 적용, 벤더 개발 계획", max: 5 },
        ],
      },
      {
        name: "미래가치",
        maxTotal: 10,
        items: [
          { id: "ex10", label: "미래 가치", desc: "AX 전략 연계, 의료 생태계 확장, 수익 창출 가능성", max: 10 },
        ],
      },
      {
        name: "리스크 관리",
        maxTotal: 5,
        items: [
          { id: "ex11", label: "리스크 관리", desc: "규제·법규 적합성, 식약처 인허가 여부", max: 5 },
        ],
      },
    ],
  },
};

function getVerdict(score) {
  if (score >= 85) return { text: "승인 (즉시 착수)", color: "#0ea5e9", bg: "#f0f9ff", short: "승인" };
  if (score >= 70) return { text: "보완 후 재심의", color: "#f59e0b", bg: "#fffbeb", short: "보완" };
  return { text: "불승인 (반려)", color: "#ef4444", bg: "#fef2f2", short: "반려" };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Storage helpers (Supabase) ───
// 필드명 변환: snake_case ↔ camelCase
function projectToDb(project) {
  return {
    id: project.id,
    name: project.name,
    dept: project.dept,
    eval_type: project.evalType,
    desc: project.desc,
    status: project.status,
    created_at: project.createdAt || project.created_at,
  };
}

function projectFromDb(dbProject) {
  return {
    id: dbProject.id,
    name: dbProject.name,
    dept: dbProject.dept,
    evalType: dbProject.eval_type,
    desc: dbProject.desc,
    status: dbProject.status,
    createdAt: dbProject.created_at,
  };
}

function submissionToDb(sub, projectId) {
  return {
    id: sub.id,
    project_id: projectId,
    name: sub.name,
    scores: sub.scores,
    total: sub.total,
    comment: sub.comment,
    submitted_at: sub.submittedAt || sub.submitted_at,
  };
}

function submissionFromDb(dbSub) {
  return {
    id: dbSub.id,
    name: dbSub.name,
    scores: dbSub.scores,
    total: dbSub.total,
    comment: dbSub.comment,
    submittedAt: dbSub.submitted_at,
  };
}

async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(projectFromDb);
  } catch (e) { 
    console.error('프로젝트 로드 실패:', e);
    return []; 
  }
}

async function saveProjects(projects) {
  try {
    // 기존 데이터 삭제 후 전체 재삽입 (간단한 방식)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (deleteError) throw deleteError;
    
    if (projects.length > 0) {
      const dbProjects = projects.map(projectToDb);
      const { error: insertError } = await supabase
        .from('projects')
        .insert(dbProjects);
      
      if (insertError) throw insertError;
    }
  } catch (e) { 
    console.error('프로젝트 저장 실패:', e); 
  }
}

async function loadSubmissions(projectId) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(submissionFromDb);
  } catch (e) { 
    console.error('평가 로드 실패:', e);
    return []; 
  }
}

async function saveSubmissions(projectId, subs) {
  try {
    // 기존 데이터 삭제 후 전체 재삽입
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('project_id', projectId);
    
    if (deleteError) throw deleteError;
    
    if (subs.length > 0) {
      const dbSubs = subs.map(sub => submissionToDb(sub, projectId));
      const { error: insertError } = await supabase
        .from('submissions')
        .insert(dbSubs);
      
      if (insertError) throw insertError;
    }
  } catch (e) { 
    console.error('평가 저장 실패:', e); 
  }
}

async function deleteSubmissions(projectId) {
  try {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('project_id', projectId);
    
    if (error) throw error;
  } catch (e) {
    console.error('평가 삭제 실패:', e);
  }
}

// ─── UI Components ───
function ScoreSlider({ value, max, onChange }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const hue = pct < 50 ? 0 + pct * 0.8 : 40 + (pct - 50) * 2.8;
  const color = `hsl(${hue}, 72%, 48%)`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
      <input type="range" min={0} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1, height: 6, appearance: "none", WebkitAppearance: "none",
          background: `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)`,
          borderRadius: 99, outline: "none", cursor: "pointer",
        }}
      />
      <div style={{
        minWidth: 52, textAlign: "center", fontWeight: 700, fontSize: 15,
        fontFamily: "'JetBrains Mono', monospace", color,
        background: `${color}15`, padding: "3px 8px", borderRadius: 6,
      }}>
        {value}/{max}
      </div>
    </div>
  );
}

function EvalCard({ item, value, onChange }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", letterSpacing: -0.3 }}>{item.label}</span>
        <span style={{
          fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace",
          background: "#f8fafc", padding: "2px 8px", borderRadius: 4,
        }}>배점 {item.max}</span>
      </div>
      <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>{item.desc}</p>
      <ScoreSlider value={value} max={item.max} onChange={onChange} />
    </div>
  );
}

function SectionGroup({ section, scores, onScoreChange }) {
  const sectionTotal = section.items.reduce((s, item) => s + (scores[item.id] || 0), 0);
  const pct = section.maxTotal > 0 ? Math.round((sectionTotal / section.maxTotal) * 100) : 0;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 0.8 }}>{section.name}</h3>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          color: pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626",
        }}>{sectionTotal}/{section.maxTotal}</div>
      </div>
      {section.items.map((item) => (
        <EvalCard key={item.id} item={item} value={scores[item.id] || 0} onChange={(v) => onScoreChange(item.id, v)} />
      ))}
    </div>
  );
}

// ─── 위원 평가 화면 ───
function ReviewerEvalScreen({ project, onBack, onSubmitted }) {
  const [name, setName] = useState("");
  const [scores, setScores] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const sections = EVAL_TYPES[project.evalType].sections;
  const allItems = sections.flatMap((s) => s.items);
  const total = allItems.reduce((s, item) => s + (scores[item.id] || 0), 0);
  const verdict = getVerdict(total);
  const allScored = allItems.every((item) => scores[item.id] !== undefined && scores[item.id] > 0);

  const handleSubmit = async () => {
    if (!name.trim()) { alert("평가위원 이름을 입력해 주세요."); return; }
    if (!allScored) { alert("모든 항목에 점수를 입력해 주세요. (0점 항목이 있습니다)"); return; }
    const sub = { id: genId(), name: name.trim(), scores, total, comment, submittedAt: new Date().toISOString() };
    const existing = await loadSubmissions(project.id);
    existing.push(sub);
    await saveSubmissions(project.id, existing);
    setSubmitted(true);
    if (onSubmitted) onSubmitted();
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 8, textAlign: "center" }}>평가가 제출되었습니다</h2>
        <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
          {name} 위원님의 평가가 정상적으로 저장되었습니다.<br />총점: <strong style={{ color: verdict.color }}>{total}점</strong> ({verdict.short})
        </p>
        <button onClick={onBack} style={{
          marginTop: 24, padding: "12px 32px", borderRadius: 12, border: "none",
          background: "#1e3a5f", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>과제 목록으로</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(135deg, #0c2340 0%, #1e3a5f 50%, #2563eb 100%)",
        padding: "24px 20px 20px", borderRadius: "0 0 24px 24px", position: "relative",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
          padding: "6px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 12,
        }}>← 과제 목록</button>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, marginBottom: 4 }}>
          {EVAL_TYPES[project.evalType].label} 심의
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{project.name}</h1>
        {project.dept && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{project.dept}</div>}
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* 이름 입력 */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>평가위원</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 입력"
            style={{
              flex: 1, border: "none", borderBottom: "2px solid #e2e8f0", padding: "6px 4px",
              fontSize: 15, fontWeight: 700, color: "#0f172a", outline: "none", background: "transparent",
            }}
          />
        </div>

        {/* 실시간 총점 */}
        <div style={{
          background: verdict.bg, border: `1.5px solid ${verdict.color}30`, borderRadius: 14,
          padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>현재 총점</div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: verdict.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1, marginTop: 2,
            }}>
              {total}<span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>/100</span>
            </div>
          </div>
          <div style={{
            background: `${verdict.color}18`, color: verdict.color, fontWeight: 800, fontSize: 12,
            padding: "5px 12px", borderRadius: 8,
          }}>{verdict.text}</div>
        </div>

        {/* 평가 항목 */}
        {sections.map((section) => (
          <SectionGroup key={section.name} section={section} scores={scores}
            onScoreChange={(id, val) => setScores((p) => ({ ...p, [id]: val }))} />
        ))}

        {/* 의견 */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1e3a5f", letterSpacing: 0.8, marginBottom: 8 }}>종합 의견 (선택)</h3>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="보완사항, 특이사항 등 의견을 작성해 주세요"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
              border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none",
              background: "#fff", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5,
            }}
          />
        </div>

        {/* 제출 */}
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, #0c2340, #2563eb)", color: "#fff",
          fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 40,
          boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
        }}>평가 제출하기</button>
      </div>
    </div>
  );
}

// ─── 위원 과제 목록 화면 ───
function ReviewerProjectList({ projects, onSelect }) {
  const open = projects.filter((p) => p.status === "open");
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{
        background: "linear-gradient(135deg, #0c2340 0%, #1e3a5f 50%, #2563eb 100%)",
        padding: "36px 20px 28px", borderRadius: "0 0 24px 24px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 6 }}>AX 위원회</div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>추진소위원회 심의</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 8 }}>평가할 과제를 선택해 주세요</p>
      </div>
      <div style={{ padding: "20px" }}>
        {open.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14 }}>현재 평가 가능한 과제가 없습니다</p>
          </div>
        ) : (
          open.map((p) => (
            <button key={p.id} onClick={() => onSelect(p)} style={{
              width: "100%", boxSizing: "border-box", display: "block", background: "#fff", borderRadius: 16, padding: "18px 20px",
              marginBottom: 12, border: "1.5px solid #e2e8f0", cursor: "pointer", textAlign: "left",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 4 }}>{p.name}</div>
                  {p.dept && <div style={{ fontSize: 13, color: "#64748b" }}>{p.dept}</div>}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                  background: p.evalType === "selfDev" ? "#eff6ff" : "#f0fdf4",
                  color: p.evalType === "selfDev" ? "#2563eb" : "#059669",
                }}>{EVAL_TYPES[p.evalType].label}</span>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                등록: {new Date(p.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 관리자: 과제 등록 ───
function AdminCreateProject({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [evalType, setEvalType] = useState("selfDev");
  const [desc, setDesc] = useState("");

  const handleSave = () => {
    if (!name.trim()) { alert("과제명을 입력해 주세요."); return; }
    onSave({ id: genId(), name: name.trim(), dept: dept.trim(), evalType, desc: desc.trim(), status: "open", createdAt: new Date().toISOString() });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 20 }}>새 과제 등록</h2>

      <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>과제명 *</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: LLM 기반 외래 진료 효율화"
        style={{
          width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#0f172a", outline: "none",
          background: "#fff", marginBottom: 16,
        }}
      />

      <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>담당 부서</label>
      <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="예: 기획(M.I.T)"
        style={{
          width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none",
          background: "#fff", marginBottom: 16,
        }}
      />

      <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>심의 유형 *</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {Object.entries(EVAL_TYPES).map(([key, val]) => (
          <button key={key} onClick={() => setEvalType(key)} style={{
            flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
            border: evalType === key ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
            background: evalType === key ? "#eff6ff" : "#fff",
            color: evalType === key ? "#2563eb" : "#64748b",
            fontSize: 13, fontWeight: 700,
          }}>{val.label}</button>
        ))}
      </div>

      <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>과제 설명 (선택)</label>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="과제 배경, 주요 내용 등" rows={3}
        style={{
          width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
          border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none",
          background: "#fff", resize: "vertical", fontFamily: "inherit", marginBottom: 24, lineHeight: 1.5,
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #e2e8f0",
          background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>취소</button>
        <button onClick={handleSave} style={{
          flex: 2, padding: "14px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #0c2340, #2563eb)", color: "#fff",
          fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
        }}>과제 등록</button>
      </div>
    </div>
  );
}

// ─── 관리자: 과제별 결과 상세 ───
function AdminProjectDetail({ project, onBack }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const sections = EVAL_TYPES[project.evalType].sections;
  const allItems = sections.flatMap((s) => s.items);

  useEffect(() => {
    loadSubmissions(project.id).then((s) => { setSubs(s); setLoading(false); });
  }, [project.id]);

  const refresh = async () => {
    setLoading(true);
    const s = await loadSubmissions(project.id);
    setSubs(s);
    setLoading(false);
  };

  const deleteSub = async (subId) => {
    if (!confirm("이 평가를 삭제하시겠습니까?")) return;
    const next = subs.filter((s) => s.id !== subId);
    await saveSubmissions(project.id, next);
    setSubs(next);
  };

  const avgTotal = subs.length > 0 ? subs.reduce((s, sub) => s + sub.total, 0) / subs.length : 0;
  const roundedAvg = Math.round(avgTotal * 10) / 10;
  const verdict = getVerdict(roundedAvg);

  const sectionAvgs = sections.map((section) => {
    const avg = subs.length > 0
      ? section.items.reduce((s, item) => s + subs.reduce((ss, sub) => ss + (sub.scores[item.id] || 0), 0) / subs.length, 0)
      : 0;
    return { ...section, avg: Math.round(avg * 10) / 10 };
  });

  return (
    <div style={{ padding: 20, paddingBottom: 40 }}>
      <button onClick={onBack} style={{
        background: "#f1f5f9", border: "none", color: "#475569", fontSize: 13, fontWeight: 600,
        padding: "8px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 16,
      }}>← 과제 목록</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{project.name}</h2>
          {project.dept && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{project.dept}</div>}
        </div>
        <button onClick={refresh} style={{
          background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontSize: 12, fontWeight: 700,
          padding: "6px 12px", borderRadius: 8, cursor: "pointer",
        }}>🔄 새로고침</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>불러오는 중...</div>
      ) : subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 14 }}>아직 제출된 평가가 없습니다</p>
          <p style={{ fontSize: 12 }}>위원들이 평가를 제출하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 종합 결과 */}
          <div style={{
            background: `linear-gradient(135deg, ${verdict.color}08, ${verdict.color}18)`,
            border: `2px solid ${verdict.color}40`, borderRadius: 18,
            padding: "24px 20px", textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, letterSpacing: 1 }}>종합 평균 점수</div>
            <div style={{
              fontSize: 48, fontWeight: 900, color: verdict.color,
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1, margin: "8px 0",
            }}>
              {roundedAvg.toFixed(1)}
            </div>
            <div style={{
              display: "inline-block", background: verdict.color, color: "#fff",
              fontWeight: 800, fontSize: 14, padding: "6px 20px", borderRadius: 99,
            }}>{verdict.text}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>평가위원 {subs.length}인 평균</div>
          </div>

          {/* 영역별 평균 */}
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1e3a5f", letterSpacing: 0.8, marginBottom: 10 }}>영역별 평균</h3>
          {sectionAvgs.map((sec) => {
            const pct = Math.round((sec.avg / sec.maxTotal) * 100);
            return (
              <div key={sec.name} style={{
                background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>{sec.name}</span>
                  <span style={{
                    fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                    color: pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626",
                  }}>{sec.avg}/{sec.maxTotal}</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 99, transition: "width 0.4s ease",
                    background: pct >= 80 ? "linear-gradient(90deg, #059669, #34d399)" : pct >= 60 ? "linear-gradient(90deg, #d97706, #fbbf24)" : "linear-gradient(90deg, #dc2626, #f87171)",
                  }} />
                </div>
              </div>
            );
          })}

          {/* 위원별 상세 */}
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1e3a5f", letterSpacing: 0.8, marginTop: 24, marginBottom: 10 }}>위원별 평가 결과</h3>
          {subs.map((sub) => {
            const v = getVerdict(sub.total);
            return (
              <div key={sub.id} style={{
                background: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{sub.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                      {new Date(sub.submittedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontWeight: 800, fontSize: 20, color: v.color, fontFamily: "'JetBrains Mono', monospace",
                    }}>{sub.total}</span>
                    <span style={{
                      fontSize: 11, color: v.color, fontWeight: 700, background: v.bg,
                      padding: "2px 8px", borderRadius: 4,
                    }}>{v.short}</span>
                  </div>
                </div>
                {/* 항목별 점수 미니 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: sub.comment ? 8 : 0 }}>
                  {sections.map((sec) => {
                    const secTotal = sec.items.reduce((s, item) => s + (sub.scores[item.id] || 0), 0);
                    return (
                      <span key={sec.name} style={{
                        fontSize: 11, color: "#64748b", background: "#f8fafc",
                        padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace",
                      }}>{sec.name} {secTotal}/{sec.maxTotal}</span>
                    );
                  })}
                </div>
                {sub.comment && (
                  <div style={{
                    fontSize: 13, color: "#475569", background: "#f8fafc",
                    padding: "10px 12px", borderRadius: 8, lineHeight: 1.5, marginTop: 4,
                  }}>💬 {sub.comment}</div>
                )}
                <button onClick={() => deleteSub(sub.id)} style={{
                  marginTop: 8, background: "none", border: "none", color: "#cbd5e1",
                  fontSize: 11, cursor: "pointer", padding: 0,
                }}>삭제</button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── 관리자 메인 ───
function AdminPanel({ projects, setProjects, onSwitchMode }) {
  const [view, setView] = useState("list"); // list | create | detail
  const [selectedProject, setSelectedProject] = useState(null);
  const [subCounts, setSubCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      const counts = {};
      for (const p of projects) {
        const subs = await loadSubmissions(p.id);
        counts[p.id] = subs.length;
      }
      setSubCounts(counts);
    };
    loadCounts();
  }, [projects, view]);

  const handleCreateProject = async (proj) => {
    const next = [...projects, proj];
    setProjects(next);
    await saveProjects(next);
    setView("list");
  };

  const handleDeleteProject = async (projId) => {
    if (!confirm("이 과제를 삭제하시겠습니까? 관련 평가 데이터도 모두 삭제됩니다.")) return;
    const next = projects.filter((p) => p.id !== projId);
    setProjects(next);
    await saveProjects(next);
    try { await deleteSubmissions(projId); } catch {}
  };

  const toggleStatus = async (projId) => {
    const next = projects.map((p) =>
      p.id === projId ? { ...p, status: p.status === "open" ? "closed" : "open" } : p
    );
    setProjects(next);
    await saveProjects(next);
  };

  if (view === "create") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
        <AdminCreateProject onSave={handleCreateProject} onCancel={() => setView("list")} />
      </div>
    );
  }

  if (view === "detail" && selectedProject) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
        <AdminProjectDetail project={selectedProject} onBack={() => setView("list")} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc" }}>
      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "32px 20px 24px", borderRadius: "0 0 24px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>AX 위원회</div>
          <button onClick={onSwitchMode} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600,
            padding: "4px 12px", borderRadius: 6, cursor: "pointer",
          }}>위원 화면 →</button>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>전략추진실 관리</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>과제 등록 및 평가 결과 집계</p>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <button onClick={() => setView("create")} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "2px dashed #93c5fd",
          background: "#eff6ff", color: "#2563eb", fontSize: 15, fontWeight: 800,
          cursor: "pointer", marginBottom: 20,
        }}>+ 새 과제 등록</button>

        {projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: 14 }}>등록된 과제가 없습니다</p>
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} style={{
              background: "#fff", borderRadius: 16, padding: "18px 20px", marginBottom: 12,
              border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("detail"); }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{p.name}</div>
                  {p.dept && <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{p.dept}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                    background: p.evalType === "selfDev" ? "#eff6ff" : "#f0fdf4",
                    color: p.evalType === "selfDev" ? "#2563eb" : "#059669",
                  }}>{EVAL_TYPES[p.evalType].label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                    background: p.status === "open" ? "#dcfce7" : "#fee2e2",
                    color: p.status === "open" ? "#16a34a" : "#dc2626",
                  }}>{p.status === "open" ? "진행중" : "마감"}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  제출 <strong style={{ color: "#0f172a" }}>{subCounts[p.id] || 0}</strong>건
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setSelectedProject(p); setView("detail"); }} style={{
                    background: "#f1f5f9", border: "none", color: "#475569", fontSize: 12,
                    fontWeight: 700, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                  }}>상세보기</button>
                  <button onClick={() => toggleStatus(p.id)} style={{
                    background: "none", border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 12,
                    fontWeight: 600, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                  }}>{p.status === "open" ? "마감" : "재개"}</button>
                  <button onClick={() => handleDeleteProject(p.id)} style={{
                    background: "none", border: "1px solid #fecaca", color: "#ef4444", fontSize: 12,
                    fontWeight: 600, padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                  }}>삭제</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 메인 앱 ───
export default function AXReviewSystem() {
  const [mode, setMode] = useState(null); // null | "admin" | "reviewer"
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects().then((p) => { setProjects(p); setLoading(false); });
  }, []);

  // 모드 선택 화면
  if (mode === null) {
    return (
      <div style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32, fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: 20,
          background: "linear-gradient(135deg, #0c2340, #2563eb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
        }}>🏥</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4, textAlign: "center" }}>AX 위원회</h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 36, textAlign: "center" }}>추진소위원회 심의 평가 시스템</p>

        <button onClick={() => setMode("reviewer")} style={{
          width: "100%", padding: "20px", borderRadius: 16, border: "none", marginBottom: 12,
          background: "linear-gradient(135deg, #0c2340, #2563eb)", color: "#fff",
          fontSize: 16, fontWeight: 800, cursor: "pointer", textAlign: "left",
          boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
        }}>
          <div>📝 평가위원 입장</div>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, marginTop: 4 }}>과제를 선택하고 심의 평가를 진행합니다</div>
        </button>

        <button onClick={() => setMode("admin")} style={{
          width: "100%", padding: "20px", borderRadius: 16, marginBottom: 12,
          border: "1.5px solid #e2e8f0", background: "#fff", color: "#0f172a",
          fontSize: 16, fontWeight: 800, cursor: "pointer", textAlign: "left",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div>⚙️ 전략추진실 (관리자)</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginTop: 4 }}>과제 등록, 평가 결과 집계 및 관리</div>
        </button>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
            background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 22px; height: 22px; border-radius: 50%; background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer; border: none;
          }
          input[type="text"]:focus, textarea:focus { border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  // 관리자 모드
  if (mode === "admin") {
    return (
      <div style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <AdminPanel projects={projects} setProjects={setProjects} onSwitchMode={() => setMode("reviewer")} />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
            background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 22px; height: 22px; border-radius: 50%; background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer; border: none;
          }
          input[type="text"]:focus, textarea:focus { border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        `}</style>
      </div>
    );
  }

  // 위원 모드
  if (selectedProject) {
    return (
      <div style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <ReviewerEvalScreen
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onSubmitted={() => {}}
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
            background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 22px; height: 22px; border-radius: 50%; background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer; border: none;
          }
          input[type="text"]:focus, textarea:focus { border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <ReviewerProjectList
        projects={projects}
        onSelect={setSelectedProject}
      />
      <div style={{ padding: "0 20px 32px", maxWidth: 480, margin: "0 auto" }}>
        <button onClick={() => { setMode(null); }} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0",
          background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>← 처음으로</button>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2), 0 0 0 2px rgba(30,58,95,0.15); cursor: pointer; border: none;
        }
        input[type="text"]:focus, textarea:focus { border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      `}</style>
    </div>
  );
}
