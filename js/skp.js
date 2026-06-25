const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

let listSKP = [], filteredSKP = [], listPegawai = [];
let currentPage = 1, rowsPerPage = 25;

const SKP_KEYS = [
    'id_pegawai','nik','nama','nip','tahun_skp','jabatan','pejabat_penilai',
    'atasan_pejabat','capaian_kinerja_orientasi','predikat_kinerja_pegawai','catatan'
];

window.onload = async function() {
    await ambilDataPegawai();
    await ambilDataSKP();
    document.getElementById('search-box').addEventListener('input', jalankanPenyaringan);
};

// --- FETCH DATA ---
async function ambilDataPegawai() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getPegawai");
        let result = await response.json();
        if (result.status === 'success') {
            listPegawai = result.data;
            let sel = document.getElementById('id_pegawai');
            sel.innerHTML = '<option value="">-- Pilih Pegawai --</option>';
            listPegawai.forEach(p => { sel.innerHTML += `<option value="${p.id_pegawai}">${p.nama} (${p.nik})</option>`; });
        }
    } catch (err) { console.error("Gagal load pegawai", err); }
}

async function ambilDataSKP() {
    try {
        // Asumsi action untuk mengambil data SKP adalah 'getSKP'
        let response = await fetch(APPS_SCRIPT_URL + "?action=getSKP");
        let result = await response.json();
        if (result.status === 'success') {
            listSKP = result.data || [];
            jalankanPenyaringan();
        }
    } catch (err) { 
        document.getElementById('skp-table-body').innerHTML = `<tr><td colspan="6" style="text-align:center;">Data SKP kosong / Gagal memuat.</td></tr>`;
    }
}

// --- LOGIKA FORM & RELASI DATA ---
function pilihPegawai() {
    let id_peg = document.getElementById('id_pegawai').value;
    let peg = listPegawai.find(p => p.id_pegawai.toString() === id_peg.toString());
    if (peg) {
        document.getElementById('nik').value = peg.nik || "";
        document.getElementById('nama').value = peg.nama || "";
        document.getElementById('nip').value = peg.nip || "";
    } else {
        document.getElementById('nik').value = ""; document.getElementById('nama').value = ""; document.getElementById('nip').value = "";
    }
}

function bukaForm(mode, idPegawai = null) {
    document.getElementById('mode_form').value = mode;
    document.getElementById('modal-title').innerText = mode === 'create' ? "➕ Tambah Data SKP" : "✏️ Edit Data SKP";
    document.getElementById('formSKP').reset();
    
    if (mode === 'edit' && idPegawai) {
        // Mencari data SKP berdasarkan ID Pegawai (atau ID spesifik SKP jika ada)
        let data = listSKP.find(x => x.id_pegawai === idPegawai);
        if (data) {
            SKP_KEYS.forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = data[k] || ""; });
        }
    }
    document.getElementById('modal-form').style.display = 'block';
}

function tutupModal(id) { document.getElementById(id).style.display = 'none'; }

async function simpanData() {
    let reqEl = document.querySelectorAll("#formSKP input[required], #formSKP select[required]");
    for (let el of reqEl) { if(!el.value) return alert("Harap isi semua field bertanda *"); }

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    let mode = document.getElementById('mode_form').value;
    let payload = { action: mode === 'create' ? 'create_skp' : 'update_skp' }; // Sesuaikan dengan Apps Script
    
    SKP_KEYS.forEach(k => { if(document.getElementById(k)) payload[k] = document.getElementById(k).value; });

    let fileInput = document.getElementById('file_skp');
    if (fileInput && fileInput.files.length > 0) {
        let file = fileInput.files[0];
        payload['file_skp'] = await new Promise(resolve => {
            let reader = new FileReader();
            reader.onload = () => resolve({base64: reader.result.split(',')[1], mimeType: file.type});
            reader.readAsDataURL(file);
        });
    }

    try {
        let resp = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        let res = await resp.json();
        alert(res.message);
        if(res.status === 'success') { tutupModal('modal-form'); ambilDataSKP(); }
    } catch(err) { alert("Error: " + err); }
    finally { btn.innerText = "Simpan Data"; btn.disabled = false; }
}

// --- TABEL & PAGINATION ---
function jalankanPenyaringan() {
    let q = document.getElementById('search-box').value.toLowerCase().trim();
    filteredSKP = listSKP.filter(p => {
        return !q || (p.nama && p.nama.toLowerCase().includes(q)) || (p.nip && p.nip.toString().includes(q));
    });
    currentPage = 1;
    tampilkanTabel();
}

function tampilkanTabel() {
    let tbody = document.getElementById('skp-table-body');
    tbody.innerHTML = "";
    
    if (filteredSKP.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Tidak ada data SKP.</td></tr>`;
        document.getElementById('pagination-controls').innerHTML = "";
        return;
    }
    
    let startIndex = (currentPage - 1) * rowsPerPage;
    let pageData = filteredSKP.slice(startIndex, startIndex + rowsPerPage);
    
    pageData.forEach(p => {
        tbody.innerHTML += `<tr>
            <td><b>${p.nama || '-'}</b><div class="sub-text">NIK: ${p.nik || '-'}</div></td>
            <td><b>${p.nip || '-'}</b><div class="sub-text">${p.jabatan || '-'}</div></td>
            <td>${p.tahun_skp || '-'}</td>
            <td>${p.pejabat_penilai || '-'}</td>
            <td>${p.predikat_kinerja_pegawai || '-'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="bukaForm('edit', '${p.id_pegawai}')">Edit</button>
            </td>
        </tr>`;
    });
    
    renderKontrolNavigasi();
}

function renderKontrolNavigasi() {
    let container = document.getElementById('pagination-controls');
    let totalPages = Math.ceil(filteredSKP.length / rowsPerPage) || 1;
    
    let btnPrev = `<button onclick="ubahPage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>`;
    let textPage = `<span style="margin: 0 20px;">|| page : ${currentPage} ||</span>`;
    let btnNext = `<button onclick="ubahPage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Selanjutnya</button>`;
    
    container.innerHTML = btnPrev + textPage + btnNext;
}

function ubahPage(offset) { currentPage += offset; tampilkanTabel(); }
