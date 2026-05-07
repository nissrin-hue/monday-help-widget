import { useState, useEffect } from "react";

const BOARD_ID = "5095581355";

const COL = {
  submitter:   "multiple_person_mm2xtr55",
  helpType:    "single_selectxtrjfvr",
  description: "long_textf6c35riz",
  urgency:     "single_selectzqk5m33",
  status:      "color_mm2xvd7",
};

async function mondayQuery(query) {
  const res = await fetch("/.netlify/functions/monday-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

async function getCurrentUser() {
  const data = await mondayQuery(`query { me { id name email } }`);
  return data.me;
}

async function getMyCases(userId) {
  const data = await mondayQuery(`
    query {
      boards(ids: [${BOARD_ID}]) {
        items_page(limit: 50, query_params: {
          rules: [{ column_id: "${COL.submitter}", compare_value: "person-${userId}", operator: any_of }]
        }) {
          items {
            id
            name
            created_at
            column_values(ids: ["${COL.helpType}", "${COL.urgency}", "${COL.status}"]) {
              id
              text
            }
          }
        }
      }
    }
  `);
  return data.boards[0].items_page.items;
}

async function createItem(user, helpType, description, urgency) {
  const columnValues = JSON.stringify({
    [COL.submitter]:   { personsAndTeams: [{ id: parseInt(user.id), kind: "person" }] },
    [COL.helpType]:    { label: helpType },
    [COL.description]: description,
    [COL.urgency]:     { label: urgency },
    [COL.status]:      { label: "Incoming response" },
  });

  await mondayQuery(`
    mutation {
      create_item(
        board_id: ${BOARD_ID},
        item_name: "IT Request - ${user.name}",
        column_values: ${JSON.stringify(columnValues)}
      ) { id }
    }
  `);
}

const HELP_TYPES = [
  { label: "Technical issue",      icon: "💻", color: "#fdab3d" },
  { label: "Access request",       icon: "🔑", color: "#00c875" },
  { label: "Account/password help",icon: "🔒", color: "#9d50dd" },
  { label: "Other",                icon: "💬", color: "#c4c4c4" },
];

const URGENCY_LEVELS = [
  { label: "Low",      color: "#00c875", bg: "#F0FBF8", desc: "No immediate impact" },
  { label: "Medium",   color: "#fdab3d", bg: "#FFF8F0", desc: "Some impact on my work" },
  { label: "High",     color: "#df2f4a", bg: "#FFF0F3", desc: "Blocking my work" },
  { label: "Critical", color: "#007eb5", bg: "#EEF4FF", desc: "Affecting multiple people" },
];

const STATUS_MAP = {
  "Incoming response": { color: "#8f8f8f", bg: "#F4F4F4" },
  "Working on it":     { color: "#e99729", bg: "#FFF5E6" },
  "Waiting for user":  { color: "#007eb5", bg: "#E6F4FB" },
  "Stuck":             { color: "#df2f4a", bg: "#FFF0F3" },
  "Done":              { color: "#00b461", bg: "#EDFBF4" },
};

function Spinner({ label = "Loading..." }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        display: "inline-block", width: 28, height: 28,
        border: "3px solid #EEF2FF", borderTopColor: "#4F8EF7",
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 12 }}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { color: "#94A3B8", bg: "#F8FAFC" };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}40`,
      borderRadius: 20, padding: "3px 12px", fontSize: 11,
      fontWeight: 700, whiteSpace: "nowrap",
    }}>{status || "Incoming response"}</span>
  );
}

function avatarColor(name) {
  return `hsl(${(name.charCodeAt(0) * 37) % 360}, 55%, 65%)`;
}

function Avatar({ name, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.45,
    }}>{name.charAt(0).toUpperCase()}</div>
  );
}

function LoadingUser({ onLoaded, onError }) {
  useEffect(() => {
    getCurrentUser()
      .then(user => onLoaded(user))
      .catch(() => onError("Could not detect your monday.com profile. Please refresh."));
  }, []);

  return (
    <div style={{ padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: "linear-gradient(135deg, #4F8EF7, #9B8EF7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, margin: "0 auto 18px",
          boxShadow: "0 8px 24px rgba(79,142,247,0.3)",
        }}>🤝</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: "0 0 6px" }}>IT Help Centre</h1>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Dublin Does Good</p>
      </div>
      <Spinner label="Detecting your monday.com profile..." />
    </div>
  );
}

function HomeScreen({ user, onNewRequest, onMyCases }) {
  return (
    <div style={{ padding: "28px 24px" }}>
      <div style={{
        background: "linear-gradient(135deg, #4F8EF7, #9B8EF7)",
        borderRadius: 16, padding: "20px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 4px" }}>Hello,</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "white", margin: 0 }}>{user.name}</h2>
        {user.email && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0" }}>{user.email}</p>}
      </div>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>How can we help you today?</p>
      {[
        { icon: "📝", label: "Submit a Request", sub: "Report an IT issue or need",   color: "#4F8EF7", bg: "#EEF4FF", action: onNewRequest },
        { icon: "📂", label: "My Cases",          sub: "Track your past IT requests", color: "#4FC4A4", bg: "#EDFDF8", action: onMyCases  },
      ].map((item, i) => (
        <button key={i} onClick={item.action} style={{
          background: "white", border: "1.5px solid #F1F5F9", borderRadius: 14,
          padding: "17px 16px", cursor: "pointer", display: "flex", alignItems: "center",
          gap: 14, textAlign: "left", width: "100%", transition: "all 0.15s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10, fontFamily: "inherit",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + "60"; e.currentTarget.style.boxShadow = `0 2px 12px ${item.color}15`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#F1F5F9"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1E293B" }}>{item.label}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{item.sub}</div>
          </div>
          <span style={{ color: "#E2E8F0", fontSize: 20 }}>›</span>
        </button>
      ))}
    </div>
  );
}

function NewRequestScreen({ user, onBack, onDone }) {
  const [helpType,    setHelpType]    = useState("");
  const [description, setDescription] = useState("");
  const [urgency,     setUrgency]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [errors,      setErrors]      = useState({});

  const validate = () => {
    const e = {};
    if (!helpType)           e.helpType    = "Please select a type";
    if (!description.trim()) e.description = "Please describe your issue";
    if (!urgency)            e.urgency     = "Please select urgency";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createItem(user, helpType, description, urgency);
      onDone();
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitting) return (
    <div style={{ padding: 24 }}>
      <Spinner label="Submitting your request to the IT team..." />
    </div>
  );

  return (
    <div style={{ padding: 24, overflowY: "auto", maxHeight: 600 }}>
      <button onClick={onBack} style={backBtn}>Back</button>
      <h2 style={screenTitle}>New IT Request</h2>
      <p style={screenSub}>Fill in the details below and we will get back to you.</p>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Submitting as</label>
        <div style={{
          background: "#F8FAFF", border: "1.5px solid #DBEAFE",
          borderRadius: 10, padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Avatar name={user.name} size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{user.name}</div>
            {user.email && <div style={{ fontSize: 11, color: "#94A3B8" }}>{user.email}</div>}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#4F8EF7", fontWeight: 600 }}>Auto-detected</span>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>What type of IT help do you need? <span style={{ color: "#F76B8A" }}>*</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {HELP_TYPES.map(t => (
            <button key={t.label} onClick={() => { setHelpType(t.label); setErrors(e => ({ ...e, helpType: "" })); }} style={{
              background: helpType === t.label ? t.color + "18" : "white",
              border: `1.5px solid ${helpType === t.label ? t.color : "#E2E8F0"}`,
              borderRadius: 10, padding: "10px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s", textAlign: "left", fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: helpType === t.label ? 600 : 400, color: "#1E293B", lineHeight: 1.3 }}>{t.label}</span>
            </button>
          ))}
        </div>
        {errors.helpType && <p style={errorStyle}>{errors.helpType}</p>}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Please describe the issue or request <span style={{ color: "#F76B8A" }}>*</span></label>
        <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px" }}>
          Include what happened, when it started, any error messages, and what you need help with.
        </p>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setErrors(er => ({ ...er, description: "" })); }}
          placeholder="Describe your issue in as much detail as possible..."
          rows={5}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6, borderColor: errors.description ? "#F76B8A" : "#E2E8F0" }}
        />
        {errors.description && <p style={errorStyle}>{errors.description}</p>}
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={labelStyle}>How urgent is this request? <span style={{ color: "#F76B8A" }}>*</span></label>
        {URGENCY_LEVELS.map(u => (
          <button key={u.label} onClick={() => { setUrgency(u.label); setErrors(e => ({ ...e, urgency: "" })); }} style={{
            background: urgency === u.label ? u.bg : "white",
            border: `1.5px solid ${urgency === u.label ? u.color : "#E2E8F0"}`,
            borderRadius: 10, padding: "10px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
            transition: "all 0.15s", textAlign: "left", width: "100%",
            fontFamily: "inherit", marginBottom: 7,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: urgency === u.label ? u.color : "#E2E8F0",
              transition: "all 0.15s",
            }} />
            <span style={{ fontSize: 13, fontWeight: urgency === u.label ? 600 : 400, color: "#1E293B" }}>{u.label}</span>
            <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 4 }}>— {u.desc}</span>
          </button>
        ))}
        {errors.urgency && <p style={errorStyle}>{errors.urgency}</p>}
      </div>

      <button onClick={submit} style={{ ...btnPrimary, width: "100%" }}>
        Submit Request
      </button>
    </div>
  );
}

function DoneScreen({ onHome }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 18 }}>✅</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: "0 0 10px" }}>Request Submitted</h3>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>Your IT request has been sent to the team.</p>
      <p style={{ color: "#94A3B8", fontSize: 13, margin: "0 0 28px" }}>Track its progress under My Cases.</p>
      <button onClick={onHome} style={{ ...btnPrimary, width: "auto", display: "inline-block", padding: "12px 32px" }}>
        Back to Home
      </button>
    </div>
  );
}

function MyCasesScreen({ user, onBack }) {
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const items = await getMyCases(user.id);
      const mapped = items.map(item => {
        const colMap = {};
        item.column_values.forEach(cv => { colMap[cv.id] = cv.text; });
        return {
          id:       item.id,
          name:     item.name,
          helpType: colMap[COL.helpType]  || "",
          urgency:  colMap[COL.urgency]   || "",
          status:   colMap[COL.status]    || "Incoming response",
          created:  item.created_at ? new Date(item.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" }) : "",
        };
      });
      setCases(mapped);
    } catch {
      setError("Could not load your cases. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack} style={backBtn}>Back</button>
      <h2 style={screenTitle}>My Cases</h2>
      <p style={screenSub}>IT requests submitted by <strong>{user.name}</strong></p>

      {loading && <Spinner label="Loading your cases..." />}

      {error && (
        <div style={{ background: "#FFF0F3", border: "1px solid #F76B8A40", borderRadius: 10, padding: 14, color: "#F76B8A", fontSize: 13 }}>
          {error}
          <button onClick={load} style={{ background: "none", border: "none", color: "#F76B8A", fontWeight: 600, cursor: "pointer", marginLeft: 8, fontFamily: "inherit" }}>Retry</button>
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div style={{ textAlign: "center", padding: "36px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#94A3B8", fontSize: 14 }}>You have not submitted any IT requests yet.</p>
        </div>
      )}

      {!loading && !error && cases.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cases.map(c => {
              const u = URGENCY_LEVELS.find(x => x.label === c.urgency);
              const h = HELP_TYPES.find(x => x.label === c.helpType);
              return (
                <div key={c.id} style={{
                  background: "white", border: "1.5px solid #F1F5F9",
                  borderRadius: 12, padding: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", margin: 0, flex: 1 }}>{c.name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {h && <span style={{ fontSize: 11, color: "#475569", background: "#F1F5F9", borderRadius: 6, padding: "2px 8px" }}>{h.icon} {c.helpType}</span>}
                    {u && <span style={{ fontSize: 11, color: u.color, background: u.color + "12", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{c.urgency}</span>}
                    {c.created && <span style={{ fontSize: 11, color: "#CBD5E1", padding: "2px 4px" }}>{c.created}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={load} style={{
            background: "none", border: "none", color: "#94A3B8",
            fontSize: 13, cursor: "pointer", textAlign: "center",
            display: "block", width: "100%", marginTop: 12, fontFamily: "inherit",
          }}>Refresh</button>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [user,   setUser]   = useState(null);
  const [error,  setError]  = useState("");

  if (error) return (
    <div style={{ fontFamily: "DM Sans, sans-serif", minHeight: "100vh", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 360, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ color: "#475569", fontSize: 14 }}>{error}</p>
        <button onClick={() => { setError(""); setScreen("loading"); }} style={{ ...btnPrimary, marginTop: 16, width: "auto", padding: "10px 24px" }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: "100vh", background: "#F1F5F9",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        width: "100%", maxWidth: 420, background: "white",
        borderRadius: 20, boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
        overflow: "hidden", minHeight: 480,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ flex: 1 }}>
          {screen === "loading"     && <LoadingUser onLoaded={u => { setUser(u); setScreen("home"); }} onError={setError} />}
          {screen === "home"        && <HomeScreen user={user} onNewRequest={() => setScreen("new_request")} onMyCases={() => setScreen("my_cases")} />}
          {screen === "new_request" && <NewRequestScreen user={user} onBack={() => setScreen("home")} onDone={() => setScreen("done")} />}
          {screen === "done"        && <DoneScreen onHome={() => setScreen("home")} />}
          {screen === "my_cases"    && <MyCasesScreen user={user} onBack={() => setScreen("home")} />}
        </div>
        <div style={{ borderTop: "1px solid #F8FAFC", padding: "11px 24px", textAlign: "center" }}>
          <span style={{ color: "#E2E8F0", fontSize: 11 }}>Dublin Does Good · IT Help Centre</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle  = { width: "100%", boxSizing: "border-box", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#1E293B", outline: "none", fontFamily: "inherit", background: "white" };
const btnPrimary  = { background: "linear-gradient(135deg, #4F8EF7, #9B8EF7)", border: "none", borderRadius: 10, padding: "13px", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "block", fontFamily: "inherit" };
const backBtn     = { background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", padding: "0 0 14px", display: "block", fontFamily: "inherit" };
const screenTitle = { fontSize: 19, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" };
const screenSub   = { fontSize: 13, color: "#64748B", margin: "0 0 20px" };
const labelStyle  = { fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 };
const errorStyle  = { color: "#F76B8A", fontSize: 12, margin: "6px 0 0" };
