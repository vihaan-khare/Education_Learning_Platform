/**
 * AdminDashboard.tsx — Premium Admin Control Panel
 *
 * Access: role:'admin' in Firestore user doc
 * Theme:  Deep slate/indigo — visually distinct from student UI
 *
 * Sections:
 *   Overview   → KPI cards + profile distribution chart
 *   Users      → Searchable student table
 *   Activity   → Live global feed
 *   Upload     → AI-categorised course/game uploader
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import {
  getAllUsers,
  getGlobalActivity,
  type AdminUser,
  type GlobalActivityEntry,
} from '../../services/activityService';
import { visualWords, adhdWords, autismWords, physicalWords, dyslexiaWords } from '../../utils/symptoms';

// ─── constants ────────────────────────────────────────────────────────────────

type Profile = 'visual' | 'learning' | 'adhd' | 'autism' | 'physical';
type Section = 'overview' | 'users' | 'activity' | 'upload';

const PROFILE_LABEL: Record<string, string> = {
  adhd: 'ADHD', autism: 'Autism', learning: 'Dyslexia',
  visual: 'Visual Impairment', physical: 'Physical', unset: 'Unassigned',
};
const PROFILE_COLOR: Record<string, string> = {
  adhd: '#f97316', autism: '#a78bfa', learning: '#38bdf8',
  visual: '#34d399', physical: '#f87171', unset: '#475569',
};
const PROFILE_ICON: Record<string, string> = {
  adhd: '🧠', autism: '✨', learning: '📖',
  visual: '👁️', physical: '♿', unset: '❓',
};

// ─── Gemini classification (mirrors Onboarding.tsx keyword logic) ─────────────
async function classifyCourse(title: string, desc: string): Promise<{ profile: Profile; reason: string }> {
  const txt = (title + ' ' + desc).toLowerCase();
  const hit = (words: string[]) => words.filter(w => txt.includes(w)).length;

  const scores: Record<Profile, number> = {
    visual: hit(visualWords),
    adhd: hit(adhdWords),
    autism: hit(autismWords),
    physical: hit(physicalWords),
    learning: hit(dyslexiaWords),
  };

  const best = (Object.entries(scores) as [Profile, number][]).sort((a, b) => b[1] - a[1])[0];
  const REASONS: Record<Profile, string> = {
    visual: 'Visual impairment keywords detected.',
    adhd: 'ADHD / attention keywords detected.',
    autism: 'Autism spectrum keywords detected.',
    physical: 'Physical / motor keywords detected.',
    learning: 'Dyslexia / learning keywords detected.',
  };

  if (best[1] > 0) return { profile: best[0], reason: REASONS[best[0]] };

  // Gemini fallback
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (key && key !== 'your-gemini-api-key') {
    try {
      const prompt = `Classify this educational content into ONE disability profile:
visual|adhd|autism|physical|learning

Title: "${title}"
Description: "${desc}"

Reply with ONLY valid JSON (no markdown):
{"profile":"<one profile>","reason":"<one short sentence>"}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] }) }
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = raw.replace(/```json|```/g,'').trim();
        const parsed = JSON.parse(cleaned);
        const valid: Profile[] = ['visual','learning','adhd','autism','physical'];
        if (valid.includes(parsed.profile)) return { profile: parsed.profile, reason: parsed.reason };
      }
    } catch { /* fall through */ }
  }
  return { profile: 'learning', reason: 'No clear match — defaulted to Dyslexia.' };
}

// ─── component ───────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('overview');
  const [authorized, setAuthorized] = useState<boolean|null>(null);
  const [dbErr, setDbErr] = useState<string|null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<GlobalActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // upload form
  const [form, setForm] = useState<{
    title: string; description: string; url: string; 
    contentType: 'game_url' | 'video_url' | 'text_content' | 'external_link'; 
    targetProfile: string; assignments: string[];
  }>({ title:'', description:'', url:'', contentType:'game_url', targetProfile: 'auto', assignments: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<null|'success'|'error'>(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [classifiedProfile, setClassifiedProfile] = useState<Profile|null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // ─── auth check ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists() || snap.data()?.role !== 'admin') {
          setAuthorized(false);
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setDbErr(e?.message ?? 'Firestore unreachable');
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      try {
        const [u, a] = await Promise.all([getAllUsers(), getGlobalActivity()]);
        setUsers(u);
        setActivity(a);
      } catch (e: any) {
        setDbErr(e?.message);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── upload handler ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setUploading(true); setUploadStatus(null);
    
    let profile: Profile;
    let reason: string;
    
    if (form.targetProfile === 'auto') {
      const classification = await classifyCourse(form.title, form.description);
      profile = classification.profile;
      reason = classification.reason;
    } else {
      profile = form.targetProfile as Profile;
      reason = 'Manually categorized by Admin';
    }
    
    setClassifiedProfile(profile);
    try {
      await addDoc(collection(db, 'courses', profile, 'items'), {
        title: form.title, description: form.description,
        url: form.url, contentType: form.contentType,
        profile, uploadedAt: Date.now(),
        uploadedBy: auth.currentUser?.email ?? 'admin',
        classifiedReason: reason,
        assignments: form.assignments.filter(a => a.trim() !== ''),
      });
      setUploadStatus('success');
      setUploadMsg(`Saved to "${PROFILE_LABEL[profile]}" — ${reason}`);
      setForm({ title:'', description:'', url:'', contentType:'game_url', targetProfile: 'auto', assignments: [] });
    } catch (e: any) {
      setUploadStatus('error');
      setUploadMsg(e?.message ?? 'Upload failed. Check Firestore rules.');
    }
    setUploading(false);
    setTimeout(() => uploadRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
  };

  // ─── derived stats ───────────────────────────────────────────────────────
  const totalUsers = users.length;
  const profileCounts: Record<string,number> = {};
  users.forEach(u => {
    const p = u.disabilityProfile || 'unset';
    profileCounts[p] = (profileCounts[p] || 0) + 1;
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.disabilityProfile || '').toLowerCase().includes(search.toLowerCase())
  );

  const actionBadge = (a: string) => ({ 
    lesson_complete:'📗 Lesson', assignment_complete:'✏️ Assignment',
    course_complete:'🎉 Course', page_visit:'👀 Visit'
  }[a] ?? a);

  // ─── loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={C.center}>
      <div style={C.spin}/>
      <p style={C.muted}>Verifying admin access…</p>
    </div>
  );

  // ─── access denied ───────────────────────────────────────────────────────
  if (!authorized) return (
    <div style={C.center}>
      <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🔒</div>
      <h2 style={{color:'#f87171',margin:'0 0 0.5rem'}}>Access Denied</h2>
      <p style={{...C.muted,maxWidth:420,textAlign:'center',marginBottom:'1.5rem'}}>
        Admin privileges required.{' '}
        {dbErr
          ? <>Firestore error: <code style={C.code}>{dbErr}</code>. Fix rules in Firebase Console.</>
          : <>Set <code style={C.code}>role: "admin"</code> on your Firestore user document.</>}
      </p>
      <button style={C.ghostBtn} onClick={handleLogout}>Sign Out</button>
    </div>
  );

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div style={C.shell}>

      {/* ── SIDEBAR ── */}
      <aside style={C.sidebar}>
        <div style={C.logo}>
          <span style={C.logoIcon}>⚙️</span>
          <span style={C.logoText}>Admin</span>
        </div>

        <nav style={{flex:1}}>
          {([
            ['overview',  '📊', 'Overview'],
            ['users',     '👤', 'Users'],
            ['activity',  '🌐', 'Activity'],
            ['upload',    '📤', 'Upload Content'],
          ] as [Section,string,string][]).map(([id,icon,label]) => (
            <button key={id} style={{...C.navBtn, ...(section===id ? C.navActive : {})}}
              onClick={() => setSection(id)}>
              <span style={{fontSize:'1.1rem'}}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button style={{...C.ghostBtn, marginTop:'auto', width:'100%', borderColor: '#ef4444', color: '#f87171'}}
          onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={C.main}>

        {/* ── OVERVIEW ── */}
        {section === 'overview' && (
          <div>
            <PageHeader title="Overview" subtitle="Platform at a glance" />

            {dbErr && <Banner type="error" text={`Firestore: ${dbErr} — Check Firebase Console rules.`}/>}

            {/* KPI row */}
            <div style={C.kpiRow}>
              {[
                { icon:'👥', val: totalUsers,      label:'Total Students' },
                { icon:'📈', val: activity.length,  label:'Recent Events'  },
                { icon:'🏷️', val: Object.keys(profileCounts).filter(k=>k!=='unset').length, label:'Active Profiles' },
                { icon:'🎯', val: activity.filter(a=>a.action==='lesson_complete').length, label:'Lessons Logged' },
              ].map(k => (
                <div key={k.label} style={C.kpiCard}>
                  <div style={C.kpiIcon}>{k.icon}</div>
                  <div style={C.kpiVal}>{k.val}</div>
                  <div style={C.kpiLabel}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Profile distribution */}
            <Card title="🧩 Profile Distribution" subtitle="Students per disability category">
              {Object.keys(profileCounts).length === 0
                ? <Empty text="No student data yet."/>
                : <div style={C.distGrid}>
                    {Object.entries(profileCounts).map(([k, n]) => (
                      <div key={k} style={C.distItem}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                          <span style={{color:'#cbd5e1',fontWeight:600,fontSize:'0.875rem'}}>
                            {PROFILE_ICON[k]} {PROFILE_LABEL[k] ?? k}
                          </span>
                          <span style={{color:PROFILE_COLOR[k]??'#64748b',fontWeight:800,fontSize:'0.875rem'}}>
                            {n} / {totalUsers}
                          </span>
                        </div>
                        <div style={C.bar}>
                          <div style={{...C.barFill, width:`${totalUsers?Math.round(n/totalUsers*100):0}%`,
                            backgroundColor: PROFILE_COLOR[k] ?? '#64748b'}}/>
                        </div>
                        <div style={{color:'#475569',fontSize:'0.75rem',marginTop:'0.3rem'}}>
                          {totalUsers ? Math.round(n/totalUsers*100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </Card>
          </div>
        )}

        {/* ── USERS ── */}
        {section === 'users' && (
          <div>
            <PageHeader title="Users" subtitle={`${totalUsers} registered student${totalUsers!==1?'s':''}`} />

            <Card title="👤 Student Directory" subtitle="All registered accounts">
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
                <input
                  placeholder="Search by name, email or profile…"
                  value={search} onChange={e=>setSearch(e.target.value)}
                  style={C.searchInput}
                />
              </div>
              <div style={C.tableWrap}>
                <table style={C.table}>
                  <thead>
                    <tr>
                      {['Student','Email','Profile','Age'].map(h=>(
                        <th key={h} style={C.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u=>(
                      <tr key={u.uid} style={C.tr}>
                        <td style={C.td}>
                          <div style={{fontWeight:700,color:'#e2e8f0'}}>{u.name}</div>
                        </td>
                        <td style={{...C.td,color:'#64748b',fontSize:'0.85rem'}}>{u.email}</td>
                        <td style={C.td}>
                          <span style={{...C.badge,
                            backgroundColor:`${PROFILE_COLOR[u.disabilityProfile||'unset']}22`,
                            color: PROFILE_COLOR[u.disabilityProfile||'unset'],
                            border:`1px solid ${PROFILE_COLOR[u.disabilityProfile||'unset']}44`,
                          }}>
                            {PROFILE_ICON[u.disabilityProfile||'unset']}{' '}
                            {PROFILE_LABEL[u.disabilityProfile||'unset']}
                          </span>
                        </td>
                        <td style={{...C.td,color:'#64748b'}}>{u.age??'—'}</td>
                      </tr>
                    ))}
                    {filteredUsers.length===0 && (
                      <tr><td colSpan={4}><Empty text="No students match your search."/></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {section === 'activity' && (
          <div>
            <PageHeader title="Activity Feed" subtitle="Recent events across all students" />

            <Card title="🌐 Live Activity" subtitle="Last 50 events platform-wide">
              {activity.length === 0 ? <Empty text="No activity recorded yet."/> :
                <div>
                  {activity.map((e,i)=>(
                    <div key={i} style={C.feedRow}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',minWidth:0}}>
                        <div style={C.avatar}>{e.userName[0]?.toUpperCase()??'?'}</div>
                        <div style={{minWidth:0}}>
                          <div style={{color:'#e2e8f0',fontWeight:700,fontSize:'0.875rem',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {e.userName}
                          </div>
                          <div style={{color:'#64748b',fontSize:'0.78rem',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {e.courseName} — {e.section}
                          </div>
                        </div>
                      </div>
                      <span style={{...C.badge,
                        backgroundColor:'#1e293b',color:'#94a3b8',
                        border:'1px solid #334155',whiteSpace:'nowrap',flexShrink:0}}>
                        {actionBadge(e.action)}
                      </span>
                    </div>
                  ))}
                </div>
              }
            </Card>
          </div>
        )}

        {/* ── UPLOAD ── */}
        {section === 'upload' && (
          <div>
            <PageHeader title="Upload Content" subtitle="Categorize content automatically via AI, or assign it manually" />

            <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1.5rem',alignItems:'start'}}>

              {/* Form */}
              <Card title="📤 Course / Game Details" subtitle="Fill in the details — Gemini will classify it automatically">
                <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

                  <Field label="Title *" hint="Be descriptive — this drives the AI categorization">
                    <input placeholder="e.g. Phonics Blending Game for Early Readers"
                      value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                      style={C.input}/>
                  </Field>

                  <Field label="Description *" hint="What does it teach? Who is it for? What skills does it build?">
                    <textarea placeholder="Describe the learning objectives, target audience and activities…"
                      value={form.description}
                      onChange={e=>setForm({...form,description:e.target.value})}
                      style={{...C.input,height:'8rem',resize:'vertical'}}/>
                  </Field>

                  <Field label="URL / Embed Link" hint="Direct game URL, YouTube embed, or external link (optional)">
                    <input type="url" placeholder="https://…"
                      value={form.url} onChange={e=>setForm({...form,url:e.target.value})}
                      style={C.input}/>
                  </Field>

                  <Field label="Target Profile" hint="Force this content into a specific profile, or let the AI decide">
                    <select value={form.targetProfile}
                      onChange={e=>setForm({...form,targetProfile:e.target.value})}
                      style={C.input}>
                      <option value="auto">✨ Auto-categorize (Gemini AI)</option>
                      <option value="learning">Dyslexia</option>
                      <option value="autism">Autism Spectrum</option>
                      <option value="adhd">ADHD</option>
                      <option value="visual">Visual Impairment</option>
                      <option value="physical">Physical Accessibility</option>
                    </select>
                  </Field>

                  <Field label="Content Type" hint="How should this content be displayed to students?">
                    <select value={form.contentType}
                      onChange={e=>setForm({...form,contentType:e.target.value as any})}
                      style={C.input}>
                      <option value="game_url">🎮 Game (iframe embed)</option>
                      <option value="video_url">🎬 Video</option>
                      <option value="text_content">📄 Article / Text</option>
                      <option value="external_link">🔗 External Link</option>
                    </select>
                  </Field>

                  <Field label="Assignments (Optional)" hint="Add assignment tasks for this section">
                    {form.assignments.map((assignment, index) => (
                      <div key={index} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        <input 
                          value={assignment} 
                          onChange={e => {
                            const newAssignments = [...form.assignments];
                            newAssignments[index] = e.target.value;
                            setForm({...form, assignments: newAssignments});
                          }}
                          placeholder={`Assignment ${index + 1}`}
                          style={C.input}
                        />
                        <button 
                          onClick={() => {
                            const newAssignments = form.assignments.filter((_, i) => i !== index);
                            setForm({...form, assignments: newAssignments});
                          }}
                          style={{...C.ghostBtn, padding: '0.5rem', border: 'none'}}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setForm({...form, assignments: [...form.assignments, '']})}
                      style={{...C.ghostBtn, marginTop: '0.5rem', width: '100%'}}
                    >
                      + Add Assignment
                    </button>
                  </Field>

                  <button style={{
                    ...C.primaryBtn,
                    opacity: uploading||!form.title.trim()||!form.description.trim() ? 0.5 : 1,
                    cursor:  uploading||!form.title.trim()||!form.description.trim() ? 'not-allowed':'pointer',
                  }}
                    disabled={uploading||!form.title.trim()||!form.description.trim()}
                    onClick={handleUpload}>
                    {uploading ? '⏳ Classifying & Saving…' : form.targetProfile === 'auto' ? '✨ Upload & Auto-Categorize' : '📤 Upload Content'}
                  </button>

                  {/* Result */}
                  {uploadStatus && <div ref={uploadRef}>
                    <Banner
                      type={uploadStatus}
                      text={uploadStatus==='success'
                        ? `✅ Saved to "${PROFILE_LABEL[classifiedProfile??'learning']}" — ${uploadMsg}`
                        : `❌ ${uploadMsg}`}
                    />
                  </div>}
                </div>
              </Card>

              {/* Sidebar guide */}
              <div>
                <Card title="🤖 How It Works" subtitle="">
                  <ol style={{margin:0,padding:'0 0 0 1.25rem',color:'#64748b',fontSize:'0.875rem',lineHeight:1.8}}>
                    <li>You provide a title and description</li>
                    <li>Keywords are scored against 5 disability profiles</li>
                    <li>Gemini AI is used if no clear match</li>
                    <li>Content is saved under the matched profile</li>
                    <li>Students see it in their learning environment</li>
                  </ol>
                </Card>

                <div style={{marginTop:'1rem'}}>
                  <Card title="🏷️ Profile Keywords" subtitle="">
                    {(['adhd','autism','learning','visual','physical'] as Profile[]).map(p=>(
                      <div key={p} style={{marginBottom:'0.75rem'}}>
                        <div style={{color:PROFILE_COLOR[p],fontWeight:700,fontSize:'0.8rem',marginBottom:'0.2rem'}}>
                          {PROFILE_ICON[p]} {PROFILE_LABEL[p]}
                        </div>
                        <div style={{color:'#475569',fontSize:'0.75rem',lineHeight:1.5}}>
                          {{
                            adhd:     'focus, attention, hyperactivity, reward, fidget, distraction',
                            autism:   'sensory, routine, calming, predictable, stimming, spectrum',
                            learning: 'reading, spelling, phonics, dyslexia, letters, literacy',
                            visual:   'blind, vision, contrast, screen reader, braille, tts',
                            physical: 'motor, wheelchair, mobility, dexterity, adaptive, switch',
                          }[p]}
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ─── sub-components ────────────────────────────────────────────────────────────

const PageHeader: React.FC<{title:string;subtitle:string}> = ({title,subtitle}) => (
  <div style={{marginBottom:'1.75rem'}}>
    <h1 style={{fontSize:'1.75rem',fontWeight:800,color:'#f1f5f9',margin:0}}>{title}</h1>
    <p style={{color:'#475569',fontSize:'0.9rem',margin:'0.25rem 0 0'}}>{subtitle}</p>
  </div>
);

const Card: React.FC<{title:string;subtitle:string;children:React.ReactNode}> = ({title,subtitle,children}) => (
  <div style={C.card}>
    <div style={{marginBottom:'1.25rem'}}>
      <h2 style={{fontSize:'1.05rem',fontWeight:700,color:'#e2e8f0',margin:0}}>{title}</h2>
      {subtitle && <p style={{color:'#475569',fontSize:'0.82rem',margin:'0.2rem 0 0'}}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Field: React.FC<{label:string;hint:string;children:React.ReactNode}> = ({label,hint,children}) => (
  <div>
    <label style={{display:'block',fontWeight:700,color:'#94a3b8',fontSize:'0.78rem',
      textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.4rem'}}>{label}</label>
    {children}
    {hint && <p style={{color:'#334155',fontSize:'0.75rem',margin:'0.3rem 0 0'}}>{hint}</p>}
  </div>
);

const Banner: React.FC<{type:'success'|'error'|'info';text:string}> = ({type,text}) => {
  const cfg = {
    success:{bg:'#052e16',border:'#16a34a',color:'#86efac'},
    error:  {bg:'#2d0a0a',border:'#dc2626',color:'#fca5a5'},
    info:   {bg:'#0c1a33',border:'#3b82f6',color:'#93c5fd'},
  }[type];
  return (
    <div style={{backgroundColor:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:'0.6rem',
      padding:'0.875rem 1rem',color:cfg.color,fontSize:'0.875rem',lineHeight:1.6}}>
      {text}
    </div>
  );
};

const Empty: React.FC<{text:string}> = ({text}) => (
  <div style={{textAlign:'center',padding:'2.5rem 1rem',color:'#334155',fontSize:'0.9rem'}}>
    {text}
  </div>
);

// ─── styles ────────────────────────────────────────────────────────────────────
const C: Record<string,React.CSSProperties> = {
  // layout
  shell: { display:'flex', minHeight:'100vh', backgroundColor:'#0a0f1e',
    fontFamily:"'Inter',system-ui,sans-serif", color:'#e2e8f0' },
  sidebar: { width:220, backgroundColor:'#0d1526', borderRight:'1px solid #1e293b',
    padding:'1.5rem 1rem', display:'flex', flexDirection:'column', gap:'0.5rem',
    position:'sticky' as const, top:0, height:'100vh', flexShrink:0 },
  main: { flex:1, padding:'2rem', overflowY:'auto' as const, minWidth:0 },

  // logo
  logo: { display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'2rem',
    padding:'0 0.5rem' },
  logoIcon: { fontSize:'1.5rem' },
  logoText: { fontSize:'1.2rem', fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.02em' },

  // nav
  navBtn: { display:'flex', alignItems:'center', gap:'0.75rem', width:'100%',
    padding:'0.65rem 0.75rem', background:'transparent', border:'none',
    borderRadius:'0.6rem', color:'#475569', fontSize:'0.875rem', fontWeight:600,
    cursor:'pointer', transition:'all 0.15s', textAlign:'left' as const },
  navActive: { backgroundColor:'#1e293b', color:'#a5b4fc' },

  // loading/center
  center: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', backgroundColor:'#0a0f1e', color:'#e2e8f0',
    fontFamily:"'Inter',system-ui,sans-serif", padding:'2rem', textAlign:'center' as const },
  spin: { width:'2.5rem', height:'2.5rem', border:'3px solid #1e293b',
    borderTopColor:'#818cf8', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  muted: { color:'#475569', marginTop:'1rem' },
  code: { backgroundColor:'#1e293b', padding:'0.15rem 0.4rem', borderRadius:'0.3rem',
    fontFamily:'monospace', fontSize:'0.85rem', color:'#a5b4fc' },
  ghostBtn: { padding:'0.55rem 1.1rem', backgroundColor:'transparent', border:'1px solid #334155',
    borderRadius:'0.5rem', color:'#94a3b8', fontSize:'0.875rem', fontWeight:600, cursor:'pointer' },

  // kpi
  kpiRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
    gap:'1rem', marginBottom:'1.75rem' },
  kpiCard: { backgroundColor:'#0d1526', borderRadius:'0.875rem', padding:'1.5rem',
    border:'1px solid #1e293b', textAlign:'center' as const },
  kpiIcon: { fontSize:'2rem', marginBottom:'0.5rem' },
  kpiVal:  { fontSize:'2.25rem', fontWeight:800, color:'#f1f5f9', lineHeight:1 },
  kpiLabel:{ fontSize:'0.72rem', color:'#475569', fontWeight:600,
    textTransform:'uppercase' as const, letterSpacing:'0.06em', marginTop:'0.4rem' },

  // card
  card: { backgroundColor:'#0d1526', borderRadius:'0.875rem', padding:'1.5rem',
    border:'1px solid #1e293b', marginBottom:'1.5rem' },

  // distribution
  distGrid: { display:'flex', flexDirection:'column' as const, gap:'1rem' },
  distItem: {},
  bar: { height:6, backgroundColor:'#1e293b', borderRadius:999 },
  barFill: { height:'100%', borderRadius:999, transition:'width 0.4s ease' },

  // table
  tableWrap: { borderRadius:'0.6rem', overflow:'hidden', border:'1px solid #1e293b' },
  table: { width:'100%', borderCollapse:'collapse' as const },
  th: { padding:'0.65rem 1rem', textAlign:'left' as const, fontSize:'0.7rem', fontWeight:700,
    color:'#334155', textTransform:'uppercase' as const, letterSpacing:'0.06em',
    backgroundColor:'#070c18', borderBottom:'1px solid #1e293b' },
  tr: {},
  td: { padding:'0.75rem 1rem', borderBottom:'1px solid #0f172a', fontSize:'0.875rem' },
  badge: { display:'inline-flex', alignItems:'center', gap:'0.3rem',
    padding:'0.2rem 0.65rem', borderRadius:'2rem', fontSize:'0.75rem', fontWeight:600 },

  // search
  searchInput: { padding:'0.5rem 1rem', borderRadius:'2rem', border:'1px solid #1e293b',
    backgroundColor:'#070c18', color:'#e2e8f0', fontSize:'0.875rem', outline:'none',
    width:260, fontFamily:"'Inter',system-ui,sans-serif" },

  // activity
  feedRow: { display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'0.75rem 0', borderBottom:'1px solid #0f172a', gap:'1rem' },
  avatar: { width:34, height:34, borderRadius:'50%', backgroundColor:'#312e81',
    color:'#a5b4fc', fontWeight:800, fontSize:'0.875rem',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  // form
  input: { width:'100%', padding:'0.65rem 0.9rem', backgroundColor:'#070c18',
    border:'1px solid #1e293b', borderRadius:'0.5rem', color:'#e2e8f0',
    fontSize:'0.9rem', fontFamily:"'Inter',system-ui,sans-serif", outline:'none',
    boxSizing:'border-box' as const },
  primaryBtn: { padding:'0.875rem', backgroundColor:'#4f46e5', color:'#fff',
    border:'none', borderRadius:'0.65rem', fontWeight:700, fontSize:'0.95rem',
    width:'100%', transition:'opacity 0.2s' },
};

export default AdminDashboard;
