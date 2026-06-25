const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

let listPegawai = [], filteredPegawai = [];
let currentPage = 1, rowsPerPage = 25;

const ALL_KEYS = [
    'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
    'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
    'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
    'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
    'ruangan','tmt_nota','bpjs_kesehatan','ketenagakerjaan_taspen','npwp'
];

window.onload = async function() {
    await ambilDataPegawai();
    document.getElementById('search-box').addEventListener('input', jalankanPenyaringan);
    document.getElementById('fltr-status').addEventListener('change', jalankanPenyaringan);
    document.getElementById('fltr-kelompok-peg').addEventListener('change', jalankanPenyaringan);
};

async function ambilDataPegawai() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getPegawai");
        let result = await response.json();
        if (result.status === 'success') {
            listPegawai = result.data;
            document.getElementById('lbl-total').innerText = listPegawai.length;
            document.getElementById('lbl-aktif').innerText = listPegawai.filter(p => p.status_pegawai === 'Aktif').length;
            document.getElementById('lbl-pensiun').innerText = listPegawai.filter(p => p.status_pegawai && p.status_pegawai.includes('Pensiun')).length;
            document.getElementById('lbl-mutasi').innerText = listPegawai.filter(p => p.status_pegawai === 'Mutasi').length;
            jalankanPenyaringan();
            
            let dp = await fetch(APPS_SCRIPT_URL + "?action=getDropdown");
            let dpr = await dp.json();
            if (dpr.status === 'success') {
                isiDrop(document.getElementById('golongan'), dpr.data.golongan);
                isiDrop(document.getElementById('jabatan'), dpr.data.jabatan);
                isiDrop(document.getElementById('ruangan'), dpr.data.ruangan);
            }
        }
    } catch (err) { console.error("Gagal", err); }
}

function isiDrop(el, arr) {
    if(!el || !arr) return;
    el.innerHTML = '<option value="">Pilih...</option>';
    arr.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`);
}

function jalankanPenyaringan() {
    let q = document.getElementById('search-box').value.toLowerCase().trim();
    let fStatus = document.getElementById('fltr-status').value;
    let fKelPeg = document.getElementById('fltr-kelompok-peg').value;
    
    filteredPegawai = listPegawai.filter(p => {
        let matchQuery = !q || (p.nama && p.nama.toLowerCase().includes(q)) || (p.nik && p.nik.toString().includes(q));
        let mStat = !fStatus || p.status_pegawai === fStatus;
        let mKel = !fKelPeg || p.kelompok_pegawai === fKelPeg;
        return matchQuery && mStat && mKel;
    });
    
    currentPage = 1;
    tampilkanTabel();
}

function tampilkanTabel() {
    let tbody = document.getElementById('pegawai-table-body');
    tbody.innerHTML = "";
    
    if (filteredPegawai.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tidak ada data yang cocok.</td></tr>`;
        document.getElementById('pagination-controls').innerHTML = "";
        return;
    }
    
    let startIndex = (currentPage - 1) * rowsPerPage;
    let pageData = filteredPegawai.slice(startIndex, startIndex + rowsPerPage);
    
    pageData.forEach(p => {
        tbody.innerHTML += `<tr>
            <td><b>${p.nik || '-'}</b><div class="sub-text">${p.nip || '-'}</div></td>
            <td><b>${p.nama || '-'}</b><div class="sub-text">${p.ruangan || '-'}</div></td>
            <td>${p.golongan || '-'}<div class="sub-text">${p.tmt_pangkat || '-'}</div></td>
            <td>${p.jabatan || '-'}<div class="sub-text">${p.tmt_jabatan || '-'}</div></td>
            <td>${p.masuk_rs || '-'}<div class="sub-text">${p.masa_kerja || '-'}</div></td>
            <td>${p.bup || '-'} Thn<div class="sub-text">${p.tmt_pensiun || '-'}</div></td>
            <td>
                <button class="btn-action btn-view" onclick="bukaView('${p.id_pegawai}')">View</button>
                <button class="btn-action btn-edit" onclick="bukaEdit('${p.id_pegawai}')">Edit</button>
            </td>
        </tr>`;
    });
    
    renderKontrolNavigasi();
}

// Navigasi Pagination Sesuai Format "Sebelumnya || page : X || Selanjutnya"
function renderKontrolNavigasi() {
    let container = document.getElementById('pagination-controls');
    let totalPages = Math.ceil(filteredPegawai.length / rowsPerPage) || 1;
    
    let btnPrev = `<button onclick="ubahPage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>`;
    let textPage = `<span style="margin: 0 20px;">|| page : ${currentPage} ||</span>`;
    let btnNext = `<button onclick="ubahPage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Selanjutnya</button>`;
    
    container.innerHTML = btnPrev + textPage + btnNext;
}

function ubahPage(offset) {
    currentPage += offset;
    tampilkanTabel();
}

function tutupModal(id) { document.getElementById(id).style.display = 'none'; }

// TAMPILAN VIEW MODERN (Grid)
function bukaView(id) {
    let p = listPegawai.find(x => x.id_pegawai === id);
    if(!p) return;
    
    const dGroup = (title, keys) => {
        let html = `<div class="view-card"><h4>${title}</h4>`;
        keys.forEach(k => {
            html += `<div class="view-row"><div class="view-label">${k.label}</div><div class="view-value">${p[k.key] || '-'}</div></div>`;
        });
        return html + `</div>`;
    };
    
    let html = dGroup('Data Pribadi', [
        {label: 'ID / NIK', key: 'nik'}, {label: 'Nama Lengkap', key: 'nama'},
        {label: 'Tempat, Tgl Lahir', key: 'tempat_lahir'}, {label: 'No HP', key: 'no_hp'},
        {label: 'Status Keluarga', key: 'status_keluarga'}
    ]);
    
    html += dGroup('Data Kepegawaian', [
        {label: 'NIP', key: 'nip'}, {label: 'Status Pegawai', key: 'status_pegawai'},
        {label: 'Golongan', key: 'golongan'}, {label: 'Jabatan', key: 'jabatan'},
        {label: 'Ruangan', key: 'ruangan'}
    ]);
    
    document.getElementById('view-detail-content').innerHTML = html;
    document.getElementById('modal-view').style.display = 'block';
}

// EDIT WIZARD LOGIC
let editCurrentTab = 0;
function bukaEdit(id) {
    let p = listPegawai.find(x => x.id_pegawai === id);
    if (!p) return;
    ALL_KEYS.forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = p[key] || ""; });
    
    editCurrentTab = 0;
    showEditTab(editCurrentTab);
    document.getElementById('modal-edit').style.display = 'block';
}

function showEditTab(n) {
    let tabs = document.getElementsByClassName("edit-tab");
    for(let i = 0; i < tabs.length; i++) tabs[i].style.display = "none";
    tabs[n].style.display = "block";
    
    document.getElementById("prevBtnEdit").style.display = (n == 0) ? "none" : "inline-block";
    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtnEdit").innerHTML = "Update Data";
        document.getElementById("nextBtnEdit").style.backgroundColor = "#28a745";
    } else {
        document.getElementById("nextBtnEdit").innerHTML = "Selanjutnya";
        document.getElementById("nextBtnEdit").style.backgroundColor = "#007BFF";
    }
    
    let steps = document.getElementsByClassName("edit-step");
    for (let i = 0; i < steps.length; i++) steps[i].className = steps[i].className.replace(" active", "");
    steps[n].className += " active";
}

function nextPrevEdit(n) {
    let tabs = document.getElementsByClassName("edit-tab");
    tabs[editCurrentTab].style.display = "none";
    editCurrentTab = editCurrentTab + n;
    
    if (editCurrentTab >= tabs.length) {
        submitEditData(); 
        editCurrentTab = editCurrentTab - n; 
        tabs[editCurrentTab].style.display = "block";
        return;
    }
    showEditTab(editCurrentTab);
}

async function submitEditData() {
    let payload = { action: 'update' };
    ALL_KEYS.forEach(k => { if(document.getElementById(k)) payload[k] = document.getElementById(k).value; });
    
    document.getElementById('nextBtnEdit').innerText = "Menyimpan...";
    try {
        let resp = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        let res = await resp.json();
        alert(res.message);
        if(res.status === 'success') { tutupModal('modal-edit'); ambilDataPegawai(); }
    } catch(err) { alert(err); }
    finally { document.getElementById('nextBtnEdit').innerText = "Update Data"; }
}
