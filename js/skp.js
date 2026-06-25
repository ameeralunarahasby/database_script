const APPS_SCRIPT_URL = "ISI_URL_APPS_SCRIPT_ANDA_DISINI"; 
let listPegawai = [];

window.onload = () => { ambilDataPegawai(); };

async function ambilDataPegawai() {
    let resp = await fetch(APPS_SCRIPT_URL + "?action=getPegawai");
    let res = await resp.json();
    if (res.status === 'success') {
        listPegawai = res.data;
        let list = document.getElementById('daftar_pegawai');
        list.innerHTML = '';
        listPegawai.forEach(p => { list.innerHTML += `<option value="${p.nama} (${p.nik})">`; });
    }
}

function cariPegawai() {
    let val = document.getElementById('input_pegawai').value;
    let peg = listPegawai.find(p => `${p.nama} (${p.nik})` === val);
    if (peg) {
        document.getElementById('id_pegawai').value = peg.id_pegawai;
        document.getElementById('nik').value = peg.nik;
        document.getElementById('nama').value = peg.nama;
    }
}

function bukaForm(mode) { 
    document.getElementById('mode_form').value = mode;
    document.getElementById('modal-form').style.display = 'block'; 
}

async function simpanData() {
    let payload = {
        action: 'create_skp',
        id_pegawai: document.getElementById('id_pegawai').value,
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        tahun_skp: document.getElementById('tahun_skp').value,
        predikat_kinerja_pegawai: document.getElementById('predikat_kinerja_pegawai').value
    };
    let resp = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
    let res = await resp.json();
    alert(res.message);
}
