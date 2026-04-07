// ============================================
// HEALTUNES — GitHub Storage + Cloudinary
// ============================================

const GH = {
  owner: 'galalemad75-creator',
  repo: 'med-moments-site',
  branch: 'main',
  dataFile: 'data.json',
  token: localStorage.getItem('ht_gh_token') || '',

  setToken(t) {
    this.token = t;
    localStorage.setItem('ht_gh_token', t);
  },

  _headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  },

  async read() {
    try {
      const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${this.dataFile}`;
      const res = await fetch(url + '?t=' + Date.now());
      if (!res.ok) throw new Error('Failed to read data');
      return await res.json();
    } catch (e) {
      console.warn('Read failed:', e.message);
      return null;
    }
  },

  async write(data) {
    if (!this.token) throw new Error('No GitHub token set');
    let sha = null;
    try {
      const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;
      const check = await fetch(apiUrl, { headers: this._headers() });
      if (check.ok) { const info = await check.json(); sha = info.sha; }
    } catch (e) {}

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body = { message: '🎵 Update chapters & songs data', content, branch: this.branch };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`,
      { method: 'PUT', headers: this._headers(), body: JSON.stringify(body) }
    );
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to save'); }
    return true;
  }
};

// ============================================
// CLOUDINARY UPLOAD — kidmom preset (Unsigned)
// ============================================

delete window.uploadFile;

const CLOUDINARY_CLOUD_NAME = 'dse1s0loh';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

window.uploadFile = async function(file, onProgress) {
  const freshToken = localStorage.getItem('ht_gh_token') || '';
  if (GH.token !== freshToken) GH.token = freshToken;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'kidmom');
  formData.append('resource_type', 'auto');
  formData.append('folder', 'healtunes/audio');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve({ url: res.secure_url, publicId: res.public_id });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Upload failed'));
        } catch { reject(new Error('Upload failed: ' + xhr.status)); }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

const uploadToCloudinary = window.uploadFile;

// ============================================
// DATABASE
// ============================================

const DEFAULT_DATA = {
  chapters: [
    { id: 1, name: 'Heart Health', icon: '❤️', songs: [] },
    { id: 2, name: 'Brain & Mind', icon: '🧠', songs: [] },
    { id: 3, name: 'Lungs & Breathing', icon: '🫁', songs: [] },
    { id: 4, name: 'Digestive System', icon: '🫃', songs: [] },
    { id: 5, name: 'Bones & Joints', icon: '🦴', songs: [] },
    { id: 6, name: 'Muscles', icon: '💪', songs: [] },
    { id: 7, name: 'Eyes & Vision', icon: '👁️', songs: [] },
    { id: 8, name: 'Ears & Hearing', icon: '👂', songs: [] },
    { id: 9, name: 'Skin Care', icon: '🧴', songs: [] },
    { id: 10, name: 'Dental Health', icon: '🦷', songs: [] },
    { id: 11, name: 'Immune System', icon: '🛡️', songs: [] },
    { id: 12, name: 'Mental Health', icon: '🧘', songs: [] },
    { id: 13, name: 'Nutrition', icon: '🥗', songs: [] },
    { id: 14, name: 'Sleep & Rest', icon: '😴', songs: [] },
    { id: 15, name: 'Exercise & Fitness', icon: '🏃', songs: [] },
    { id: 16, name: 'First Aid', icon: '🩹', songs: [] }
  ],
  nextId: { chapter: 17, song: 1 },
  admin: {
    email: 'emadh5156@gmail.com',
    password: 'HealTunes2026!'
  }
};

const DB = {
  _cache: null,

  async init() {
    const remote = await GH.read();
    if (remote && remote.chapters) {
      this._cache = remote;
      this._saveLocalCache();
      return remote;
    }
    const local = localStorage.getItem('ht_cache');
    if (local) {
      try { this._cache = JSON.parse(local); return this._cache; } catch (e) {}
    }
    this._cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this._saveLocalCache();
    return this._cache;
  },

  _saveLocalCache() {
    if (!this._cache) return;
    const safe = JSON.parse(JSON.stringify(this._cache));
    if (safe.chapters) {
      safe.chapters.forEach(ch => {
        if (ch.songs) ch.songs.forEach(s => {
          if (s.audio && s.audio.startsWith('data:')) s.audio = '';
          if (s.image && s.image.startsWith('data:')) s.image = '';
        });
      });
    }
    try { localStorage.setItem('ht_cache', JSON.stringify(safe)); }
    catch (e) { localStorage.removeItem('ht_cache'); }
  },

  getData() { return this._cache || DEFAULT_DATA; },
  getChapters() { return this.getData().chapters; },

  async save() {
    this._saveLocalCache();
    try { await GH.write(this._cache); } catch (e) { console.warn('GitHub save:', e.message); }
  },

  addChapter(name, icon) {
    const data = this._cache;
    const ch = { id: data.nextId.chapter++, name, icon, songs: [] };
    data.chapters.push(ch);
    this.save();
    return ch;
  },

  updateChapter(id, updates) {
    const ch = this._cache.chapters.find(c => c.id === id);
    if (ch) { Object.assign(ch, updates); this.save(); }
    return ch;
  },

  deleteChapter(id) {
    this._cache.chapters = this._cache.chapters.filter(c => c.id !== id);
    this.save();
  },

  addSong(chapterId, title, audioUrl, publicId, imageUrl) {
    const ch = this._cache.chapters.find(c => c.id === chapterId);
    if (!ch) return null;
    const song = {
      id: this._cache.nextId.song++,
      title, audio: audioUrl,
      image: imageUrl || '',
      cloudinary_id: publicId,
      created: new Date().toISOString()
    };
    if (!ch.songs) ch.songs = [];
    ch.songs.push(song);
    this.save();
    return song;
  },

  deleteSong(chapterId, songId) {
    const ch = this._cache.chapters.find(c => c.id === chapterId);
    if (ch) { ch.songs = (ch.songs || []).filter(s => s.id !== songId); this.save(); }
  },

  login(email, password) {
    const e = String(email || '').trim();
    const p = String(password || '').trim();
    if (e === 'emadh5156@gmail.com' && p === 'heal2026') return true;
    const admin = this._cache?.admin;
    if (admin && e === String(admin.email || '').trim() && p === String(admin.password || '').trim()) return true;
    return false;
  },

  isLoggedIn() { return !!localStorage.getItem('ht_admin'); },
  setSession(email) { localStorage.setItem('ht_admin', JSON.stringify({ email, ts: Date.now() })); },
  logout() { localStorage.removeItem('ht_admin'); }
};

// ============================================
// SYNC WRAPPER
// ============================================

const SYNC = {
  async loadChapters() { await DB.init(); return DB.getChapters(); },
  async addChapter(name, icon) { return DB.addChapter(name, icon); },
  async updateChapter(id, data) { return DB.updateChapter(id, data); },
  async removeChapter(id) { DB.deleteChapter(id); },
  async addSong(chapterId, title, audioUrl, publicId, imageUrl) { return DB.addSong(chapterId, title, audioUrl, publicId, imageUrl); },
  async removeSong(chapterId, songId) { DB.deleteSong(chapterId, songId); },
  async uploadAudio(file, onProgress) { return await window.uploadFile(file, onProgress); }
};
