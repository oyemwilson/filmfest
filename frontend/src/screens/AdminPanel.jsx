import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Video, Award, Users, Image, LogOut, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
  const navigate = useNavigate();

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [videoInput, setVideoInput] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [partnerFiles, setPartnerFiles] = useState([]);
  const [partnerPreview, setPartnerPreview] = useState([]);
  // award form used for editing a slot; category when editing is readonly
  const [awardForm, setAwardForm] = useState({ category: '', role: 'winner', name: '', photo: null });
  // create category input
  const [newCategoryName, setNewCategoryName] = useState('');
  // control whether the award-form is being used to edit a slot
  const [editingSlot, setEditingSlot] = useState(false);

  const isAuthenticated = !!authToken && !!currentUser;

  // coerce null/undefined/"null" -> empty string for safe display/editing
  const sanitize = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && v.toLowerCase() === 'null') return '';
    return v;
  };

  const saveAuth = (t) => {
    setAuthToken(t || '');
    if (t) localStorage.setItem('auth_token', t);
    else localStorage.removeItem('auth_token');
  };
  const api = async (path, opts = {}) => {
    const headers = opts.headers || {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    if (opts.json) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        setMessage('Session expired. Please login again.');
        saveAuth('');
        setCurrentUser(null);
      } else setMessage(j.message || `Error ${res.status}`);
      throw { ok: false, status: res.status, body: j };
    }
    return j;
  };

  // delete whole category
  const deleteAwardCategory = async (category) => {
    if (!window.confirm(`Delete entire category "${category}"? This will remove all three slots.`)) return;
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try {
      const j = await api(`/api/content/${year}/awards/${encodeURIComponent(category)}`, { method: 'DELETE' });
      setContent(j);
      setMessage(`Category "${category}" deleted`);
    } catch (e) {
      console.error('Delete category error', e);
    } finally {
      setLoading(false);
    }
  };

  // rename category (tries PUT — if backend doesn't support this you can switch to fallback)
  const renameCategory = async (oldCategory) => {
    const newName = window.prompt('Rename category', oldCategory);
    if (!newName || newName.trim() === '' || newName.trim() === oldCategory) return;
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try {
      const j = await api(`/api/content/${year}/awards/${encodeURIComponent(oldCategory)}`, {
        method: 'PUT',
        json: true,
        body: JSON.stringify({ newCategory: newName.trim() }),
      });
      setContent(j);
      setMessage(`Category renamed to "${newName.trim()}"`);
    } catch (e) {
      console.error('Rename category error', e);
      setMessage('Rename failed (server may not support PUT on that route).');
    } finally {
      setLoading(false);
    }
  };

  // quick-edit: populate award form to edit any slot in a category (slot-level edit)
  const startEditCategory = (category, role, person = {}) => {
    setAwardForm({
      category: category || '',
      role: role || 'winner',
      name: sanitize(person?.name),
      photo: null,
    });
    setEditingSlot(true);
    // scroll to the form
    const el = document.querySelector('#award-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelEdit = () => {
    setAwardForm({ category: '', role: 'winner', name: '', photo: null });
    setEditingSlot(false);
  };

  /* ---------- auth ---------- */
  useEffect(() => { if (authToken) (async () => { try { const j = await api('/api/auth/me'); setCurrentUser(j.user || j); } catch(e){} })(); }, [authToken]);
  const handleLogin = async (e) => {
    e?.preventDefault();
    setMessage(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const j = await res.json();
      if (!res.ok) return setMessage(j.message || 'Login failed');
      saveAuth(j.token); setCurrentUser(j.user || null); setMessage('Logged in');
    } catch (err) { setMessage(err.message || 'Login error'); }
    finally { setLoading(false); }
  };
  const handleLogout = () => { saveAuth(''); setCurrentUser(null); setMessage('Logged out'); navigate('/'); };

  /* ---------- content fetch & year ---------- */
  const fetchContent = async () => {
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true); setMessage('');
    try {
      const j = await api(`/api/content/${year}`);
      setContent(j); setVideoInput(j.videoLink || '');
    } catch (e) {
      if (e.status === 404) { setContent(null); setMessage(`No content for ${year}. Create one.`); }
    } finally { setLoading(false); }
  };
  const createYear = async () => {
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try { const j = await api(`/api/content/${year}`, { method: 'POST', json: true }); setContent(j); setMessage('Created content'); }
    catch (e) {} finally { setLoading(false); }
  };

  /* ---------- video ---------- */
  const updateVideo = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try { const j = await api(`/api/content/${year}/video`, { method: 'PUT', json: true, body: JSON.stringify({ videoLink: videoInput }) }); setContent(j); setMessage('Video updated'); }
    catch (e) { console.error('updateVideo', e); } finally { setLoading(false); }
  };

  /* ---------- photos & partners (upload/delete) ---------- */
  const handleFiles = (files, setFiles, setPreview) => {
    const arr = Array.from(files);
    setFiles(arr);
    setPreview(arr.map(f => URL.createObjectURL(f)));
  };
  const uploadFiles = async (endpoint, files, clearFn) => {
    if (!isAuthenticated) return setMessage('Login required');
    if (!files.length) return setMessage('Choose at least one file');
    const fd = new FormData();
    files.forEach(f => fd.append(endpoint.includes('photos') ? 'photos' : 'logos', f));
    setLoading(true);
    try { const j = await api(`/api/content/${year}/${endpoint}`, { method: 'POST', body: fd }); setContent(j); clearFn(); setMessage('Uploaded'); }
    catch (e) { console.error('uploadFiles', e); } finally { setLoading(false); }
  };
  const deleteResource = async (type, id) => {
    if (!window.confirm('Delete?')) return;
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try { const j = await api(`/api/content/${year}/${type}/${id}`, { method: 'DELETE' }); setContent(j); setMessage('Deleted'); }
    catch (e) { console.error('deleteResource', e); } finally { setLoading(false); }
  };

  /* ---------- delete selected photos ---------- */
  const deleteSelectedPhotos = async () => {
    if (!selectedPhotos.length) return setMessage('Select photos to delete');
    if (!window.confirm(`Delete ${selectedPhotos.length} photo(s)?`)) return;
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    let count = 0;
    for (const id of selectedPhotos) {
      try { await api(`/api/content/${year}/photos/${id}`, { method: 'DELETE' }); count++; }
      catch (e) { break; }
    }
    setSelectedPhotos([]); setMessage(`Deleted ${count}`); setLoading(false); fetchContent();
  };

  /* ---------- awards ---------- */
  // Create a new category (no name/slot required)
  const createCategory = async (e) => {
    e?.preventDefault();
    const category = (newCategoryName || '').trim();
    if (!category) return setMessage('Category name required');
    if (!isAuthenticated) return setMessage('Login required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', category);
      fd.append('role', 'winner');
      fd.append('name', ''); // empty winner placeholder
      const j = await api(`/api/content/${year}/awards`, { method: 'POST', body: fd });
      setContent(j);
      setNewCategoryName('');
      setMessage(`Category "${category}" created`);
    } catch (e) {
      console.error('Create category error', e);
    } finally {
      setLoading(false);
    }
  };

  // Add or update a single slot in a category (used when editing a slot)
  const addAward = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) return setMessage('Login required');
    if (!editingSlot) return setMessage('Use the Create Category action to add new categories');
    const fd = new FormData();
    fd.append('category', awardForm.category);
    fd.append('role', awardForm.role);
    fd.append('name', awardForm.name);
    if (awardForm.photo) fd.append('photo', awardForm.photo);
    setLoading(true);
    try {
      const j = await api(`/api/content/${year}/awards`, { method: 'POST', body: fd });
      setContent(j);
      setAwardForm({ category: '', role: 'winner', name: '', photo: null });
      setEditingSlot(false);
      setMessage('Award updated');
    } catch (e) {
      console.error('Add/update award error', e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- file queue helpers ---------- */
  const removeFromQueue = (idx, files, previews, setFiles, setPreview) => {
    setFiles(files.filter((_, i) => i !== idx));
    setPreview(previews.filter((_, i) => i !== idx));
  };

  /* ---------- photo selection ---------- */
  const togglePhotoSelection = (id) => setSelectedPhotos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAllPhotos = () => content?.photos && setSelectedPhotos(content.photos.map(p => p.public_id));
  const deselectAllPhotos = () => setSelectedPhotos([]);

  /* ---------- effects ---------- */
  useEffect(() => { if (year && isAuthenticated) fetchContent(); }, [year, isAuthenticated]);
  useEffect(() => { if (authToken) fetchContent(); }, []); // attempt load on mount when token exists
  useEffect(() => {
    return () => {
      photoPreview.forEach(URL.revokeObjectURL);
      partnerPreview.forEach(URL.revokeObjectURL);
    };
  }, [photoPreview, partnerPreview]);

  /* ---------- UI render ---------- */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-slate-600 mb-4">Please sign in</p>
          {message && <div className="mb-4 p-3 bg-amber-50 rounded">{message}</div>}
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" required placeholder="admin@example.com" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full p-3 border rounded" />
            <input type="password" required placeholder="Password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full p-3 border rounded" />
            <button className="w-full py-3 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={()=>navigate('/')} className="text-blue-600">← Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  const getAward = (a, k) => (a && a[k]) ? a[k] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
  <div className="w-full md:w-auto text-center md:text-left">
    <h1 className="text-2xl md:text-4xl font-bold">Event Admin Panel</h1>
    <p className="text-slate-600 text-sm md:text-base">Manage event content</p>
  </div>

  <div className="w-full md:w-auto flex flex-col sm:flex-row items-center md:items-center justify-center md:justify-end gap-3">
    <div className="text-center sm:text-right">
      <div className="text-sm text-slate-600">Signed in as</div>
      <div className="font-semibold text-sm truncate max-w-[180px]">{currentUser?.email || currentUser}</div>
    </div>

    <button
      onClick={handleLogout}
      className="w-full sm:w-auto px-4 py-2 bg-slate-600 text-white rounded flex items-center justify-center gap-2"
      aria-label="Logout"
    >
      <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
    </button>
  </div>
</header>


        {/* Year controls */}
<div className="bg-white rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
  {/* Year Input */}
  <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
    <div>
      <label className="block text-sm text-slate-700 mb-1">Event Year</label>
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="p-3 border rounded w-full sm:w-40"
      />
    </div>

    {/* Buttons Group */}
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button
        onClick={fetchContent}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded text-sm sm:text-base"
      >
        Load Content
      </button>
      <button
        onClick={createYear}
        className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        <Plus className="w-4" />
        Create Year
      </button>
    </div>
  </div>

  {/* Status Indicator */}
  <div className="text-center sm:text-right text-sm">
    {loading ? (
      <span className="text-blue-600">Loading…</span>
    ) : (
      <span className="text-green-600">● Ready</span>
    )}
  </div>
</div>


        {message && <div className="mb-6 p-4 bg-amber-50 rounded">{message}</div>}

        {/* Top panels: video & photos */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <section className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4"><Video className="w-5 h-5 text-purple-600"/> <h2 className="text-xl font-semibold">Event Video</h2></div>
            {content?.videoLink ? (
              <>
                <div className="aspect-video rounded overflow-hidden mb-3 bg-slate-100"><iframe src={content.videoLink} title="Event Video" className="w-full h-full" frameBorder="0" allowFullScreen /></div>
                <p className="text-xs text-slate-500 truncate">Current: {content.videoLink}</p>
              </>
            ) : <div className="p-8 bg-slate-50 rounded text-center">No video set for {year}</div>}
            <form onSubmit={updateVideo} className="mt-3 space-y-2">
              <input value={videoInput} onChange={e=>setVideoInput(e.target.value)} placeholder="YouTube link or embed URL" className="w-full p-3 border rounded" />
              <button className="w-full py-3 bg-purple-600 text-white rounded flex items-center justify-center gap-2"><Upload className="w-4" />Update Video</button>
            </form>
          </section>

          <section className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Image className="w-5 h-5 text-pink-600"/><h2 className="text-xl font-semibold">Event Photos</h2></div>
              {content?.photos?.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={selectAllPhotos} className="text-xs px-3 py-1 bg-slate-200 rounded">Select All</button>
                  {selectedPhotos.length > 0 && <>
                    <button onClick={deselectAllPhotos} className="text-xs px-3 py-1 bg-slate-200 rounded">Deselect</button>
                    <button onClick={deleteSelectedPhotos} className="text-xs px-3 py-1 bg-red-500 text-white rounded flex items-center gap-1"><Trash2 className="w-3 h-3"/>Delete ({selectedPhotos.length})</button>
                  </>}
                </div>
              )}
            </div>

            {content?.photos?.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-4 max-h-100 overflow-y-auto">
                {content.photos.map(p => (
                  <div key={p.public_id} className={`relative group border-2 rounded overflow-hidden cursor-pointer ${selectedPhotos.includes(p.public_id) ? 'border-pink-500 ring-2' : 'border-slate-200'}`} onClick={() => togglePhotoSelection(p.public_id)}>
                    <img src={p.url} alt={p.caption || ''} className="w-full h-28 object-cover" />
                    {selectedPhotos.includes(p.public_id) && <div className="absolute inset-0 bg-pink-500 bg-opacity-30 flex items-center justify-center"><div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold">✓</div></div>}
                    <button onClick={(e)=>{e.stopPropagation(); deleteResource('photos', p.public_id);}} className="absolute top-1 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3" /></button>
                  </div>
                ))}
              </div>
            ) : <div className="mb-4 p-8 bg-slate-50 rounded text-center">No photos uploaded</div>}

            {photoPreview.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2">Ready to upload ({photoFiles.length}):</p>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {photoPreview.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <img src={preview} alt={`Preview ${idx+1}`} className="w-full h-20 object-cover rounded border-2" />
                      <button onClick={() => removeFromQueue(idx, photoFiles, photoPreview, setPhotoFiles, setPhotoPreview)} className="absolute -top-0 -right-2 p-1 bg-red-500 text-white rounded-full shadow"><X className="w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={(e)=>{e.preventDefault(); uploadFiles('photos', photoFiles, ()=>{setPhotoFiles([]); setPhotoPreview([]);})}} className="space-y-3">
              <label className="block">
                <input multiple type="file" accept="image/*" onChange={(e)=>handleFiles(e.target.files, setPhotoFiles, setPhotoPreview)} className="block w-full text-sm cursor-pointer" />
              </label>
              <button disabled={!photoFiles.length} className="w-full py-3 bg-pink-600 text-white rounded flex items-center justify-center gap-2"><Upload className="w-4"/>Upload Photos ({photoFiles.length})</button>
            </form>
          </section>
        </div>

        {/* Awards & Partners */}
        <section className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-semibold">Awards</h2>
          </div>

          {content?.awards?.length > 0 ? (
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {content.awards.map((a) => (
                <div key={a.category} className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{a.category}</h3>
                    <div className="flex items-center gap-2">
                      {/* Rename category (not slot edit) */}
                      {/* <button
                        type="button"
                        onClick={() => renameCategory(a.category)}
                        className="px-2 py-1 text-xs bg-amber-600 text-white rounded"
                      >
                        Edit Category
                      </button> */}
                      <button
                        type="button"
                        onClick={() => deleteAwardCategory(a.category)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                      >
                        Delete Category
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {['winner','firstRunnerUp','secondRunnerUp'].map((role) => {
                      const person = getAward(a, role);
                      const label = role === 'winner' ? 'Winner' : role === 'firstRunnerUp' ? '1st Runner Up' : '2nd Runner Up';
                      return (
                        <div key={role} className="bg-white rounded-lg overflow-hidden shadow-sm border flex flex-col">
                          <div className="w-full h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                            {person?.photo?.url ? (
                              <img src={person.photo.url} alt={sanitize(person?.name) || label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-slate-300 flex flex-col items-center">
                                <Award className="w-8 h-8" />
                                <div className="text-xs mt-1">No image</div>
                              </div>
                            )}
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="text-sm font-medium text-slate-800">{sanitize(person?.name) || '—'}</div>
                              <div className="text-xs text-slate-500 mt-1">{label}</div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditCategory(a.category, role, person)}
                                className="px-3 py-1 text-xs bg-amber-600 text-white rounded"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6 p-8 bg-slate-50 rounded text-center">No awards added yet</div>
          )}

          {/* NEW: Create Category form (only asks for category name) */}
          <form onSubmit={createCategory} className="mb-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Create new category (e.g., Best Picture)"
                className="flex-1 p-3 border rounded"
              />
              <button type="submit" className="px-4 py-3 bg-green-600 text-white rounded flex items-center gap-2">
                <Plus className="w-4" />
                Create Category
              </button>
            </div>
            <div className="text-xs text-slate-500">Creating a category adds an empty slot set. Use the slot "Edit" to add name/photo later.</div>
          </form>

          {/* Slot editor form — only shown when editing a slot */}
          <form id="award-form" onSubmit={addAward} className="space-y-3">
            <input
              value={awardForm.category}
              readOnly
              placeholder="Category (select a slot to edit)"
              className="w-full p-3 border rounded bg-slate-50"
            />
            <select
              value={awardForm.role}
              onChange={(e) => setAwardForm({ ...awardForm, role: e.target.value })}
              className="w-full p-3 border rounded"
              disabled={!editingSlot}
            >
              <option value="winner">Winner</option>
              <option value="firstRunnerUp">1st Runner Up</option>
              <option value="secondRunnerUp">2nd Runner Up</option>
            </select>
            <input
              value={awardForm.name}
              onChange={(e) => setAwardForm({ ...awardForm, name: e.target.value })}
              placeholder="Name (movie / person)"
              className="w-full p-3 border rounded"
              disabled={!editingSlot}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAwardForm({ ...awardForm, photo: e.target.files[0] })}
              className="block w-full text-sm cursor-pointer"
              disabled={!editingSlot}
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-600 text-white rounded"
                disabled={!editingSlot}
              >
                {editingSlot ? 'Update Slot' : 'Select a slot to edit'}
              </button>
              {editingSlot && (
                <button type="button" onClick={cancelEdit} className="py-3 px-4 bg-slate-200 rounded">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Partners & Sponsors */}
        <section className="bg-white rounded-xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-indigo-600"/><h2 className="text-xl font-semibold">Partners & Sponsors</h2></div>

          {content?.partners?.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 mb-4 max-h-80 overflow-y-auto">
              {content.partners.map(p => (
                <div key={p.public_id} className="relative group border rounded overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img src={p.url} alt="Partner logo" className="w-full h-24 object-contain p-3 bg-transparent" style={{ maxWidth: '180px' }} />
                  <button onClick={()=>deleteResource('partners', p.public_id)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3" /></button>
                </div>
              ))}
            </div>
          ) : <div className="mb-4 p-8 bg-slate-50 rounded text-center">No partner logos uploaded</div>}

          {partnerPreview.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-2">Ready to upload ({partnerFiles.length}):</p>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {partnerPreview.map((preview, idx) => (
                  <div key={idx} className="relative flex items-center justify-center bg-slate-100 rounded">
                    <img src={preview} alt={`Preview ${idx+1}`} className="w-full h-20 object-contain rounded border-2 bg-transparent p-2" />
                    <button onClick={()=>removeFromQueue(idx, partnerFiles, partnerPreview, setPartnerFiles, setPartnerPreview)} className="absolute -top-0 -right-2 p-1 bg-red-500 text-white rounded-full"><X className="w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e)=>{e.preventDefault(); uploadFiles('partners', partnerFiles, ()=>{setPartnerFiles([]); setPartnerPreview([]);})}} className="space-y-3">
            <label className="block">
              <input multiple type="file" accept="image/*" onChange={(e)=>handleFiles(e.target.files, setPartnerFiles, setPartnerPreview)} className="block w-full text-sm cursor-pointer" />
            </label>
            <button disabled={!partnerFiles.length} className="w-full py-3 bg-indigo-600 text-white rounded flex items-center justify-center gap-2"><Upload className="w-4"/>Upload Logos ({partnerFiles.length})</button>
          </form>
        </section>

      </div>
    </div>

  );
}
