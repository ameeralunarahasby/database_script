const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

let listSertifikat = [], filteredSertifikat = [], listPegawai = [];
let currentPage = 1, rowsPerPage = 25;

const SERTIF_KEYS = [
    'id_pegawai','nik','nama','judul_kegiatan','no_sertifikat',
    'jenis_pelatihan','tanggal_mulai','tanggal_selesai','jpl','nilai_skp'
];

window.onload = async function() {
    await ambilDataPegawai();
    await ambilDataSertifikat();
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

async function ambilDataSertifikat() {
    try {
        // Asumsi action API untuk menarik data adalah 'getSertifikat'
        let response = await fetch(APPS_SCRIPT_URL + "?action=getSertifikat");
        let result = await response.json();
        if (result.status === 'success') {
            listSertifikat = result.data || [];
            jalankanPenyaringan();
        }
    } catch (err) { 
        document.getElementById('sertifikat-table-body').innerHTML = `<tr><td colspan="6" style="text-align:center;">Data Kosong / Gagal memuat.</td></tr>`;
    }
}

// --- LOGIKA FORM & RELASI DATA ---
function pilihPegawai() {
    let id_peg = document.getElementById('id_pegawai').value;
    let peg = listPegawai.find(p => p.id_pegawai.toString() === id_peg.toString());
    if (peg) {
        document.getElementById('nik').value = peg.nik || "";
        document.getElementById('nama').value = peg.nama || "";
    } else {
        document.getElementById('nik').value = ""; document.getElementById('nama').value = "";
    }
}

function bukaForm(mode, noSertifikat = null) {
    document.getElementById('mode_form').value = mode;
    document.getElementById('modal-title').innerText = mode === 'create' ? "➕ Tambah Sertifikat" : "✏️ Edit Sertifikat";
    document.getElementById('formSertifikat').reset();
    
    if (mode === 'edit' && noSertifikat) {
        // ID Pencarian di table sertifikat disesuaikan dengan key unique (contoh: berdasarkan no_sertifikat)
        let data = listSertifikat.find(x => x.no_sertifikat === noSertifikat);
        if (data) {
            SERTIF_KEYS.forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = data[k] || ""; });
        }
    }
    document.getElementById('modal-form').style.display = 'block';
}

function tutupModal(id) { document.getElementById(id).style.display = 'none'; }

async function simpanData() {
    let reqEl = document.querySelectorAll("#formSertifikat input[required], #formSertifikat select[required]");
    for (let el of reqEl) { if(!el.value) return alert("Harap isi field wajib: Pegawai & Judul Kegiatan"); }

    const btn = document.getElementById('btnSimpan');
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    let mode = document.getElementById('mode_form').value;
    let payload = { action: mode === 'create' ? 'create_sertifikat' : 'update_sertifikat' }; 
    
    SERTIF_KEYS.forEach(k => { if(document.getElementById(k)) payload[k] = document.getElementById(k).value; });

    let fileInput = document.getElementById('file_sertifikat');
    if (fileInput && fileInput.files.length > 0) {
        let file = fileInput.files[0];
        payload['file_sertifikat'] = await new Promise(resolve => {
            let reader = new FileReader();
            reader.onload = () => resolve({base64: reader.result.split(',')[1], mimeType: file.type});
            reader.readAsDataURL(file);
        });
    }

    try {
        let resp = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        let res = await resp.json();
        alert(res.message);
        if(res.status === 'success') { tutupModal('modal-form'); ambilDataSertifikat(); }
    } catch(err) { alert("Error: " + err); }
    finally { btn.innerText = "Simpan Data"; btn.disabled = false; }
}

// --- TABEL & PAGINATION ---
function jalankanPenyaringan() {
    let q = document.getElementById('search-box').value.toLowerCase().trim();
    filteredSertifikat = listSertifikat.filter(p => {
        return !q || (p.nama && p.nama.toLowerCase().includes(q)) || (p.judul_kegiatan && p.judul_kegiatan.toLowerCase().includes(q));
    });
    currentPage = 1;
    tampilkanTabel();
}

function tampilkanTabel() {
    let tbody = document.getElementById('sertifikat-table-body');
    tbody.innerHTML = "";
    
    if (filteredSertifikat.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Tidak ada data sertifikat.</td></tr>`;
        document.getElementById('pagination-controls').innerHTML = "";
        return;
    }
    
    let startIndex = (currentPage - 1) * rowsPerPage;
    let pageData = filteredSertifikat.slice(startIndex, startIndex + rowsPerPage);
    
    pageData.forEach(p => {
        tbody.innerHTML += `<tr>
            <td><b>${p.nama || '-'}</b><div class="sub-text">NIK: ${p.nik || '-'}</div></td>
            <td>${p.judul_kegiatan || '-'}</td>
            <td><b>${p.no_sertifikat || '-'}</b><div class="sub-text">${p.jenis_pelatihan || '-'}</div></td>
            <td>${p.tanggal_mulai || '-'} s/d ${p.tanggal_selesai || '-'}</td>
            <td>JPL: ${p.jpl || '0'}<div class="sub-text">SKP: ${p.nilai_skp || '0'}</div></td>
            <td>
                <button class="btn-action btn-edit" onclick="bukaForm('edit', '${p.no_sertifikat}')">Edit</button>
            </td>
        </tr>`;
    });
    
    renderKontrolNavigasi();
}

function renderKontrolNavigasi() {
    let container = document.getElementById('pagination-controls');
    let totalPages = Math.ceil(filteredSertifikat.length / rowsPerPage) || 1;
    
    let btnPrev = `<button onclick="ubahPage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>`;
    let textPage = `<span style="margin: 0 20px;">|| page : ${currentPage} ||</span>`;
    let btnNext = `<button onclick="ubahPage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Selanjutnya</button>`;
    
    container.innerHTML = btnPrev + textPage + btnNext;
}

function ubahPage(offset) { currentPage += offset; tampilkanTabel(); }
