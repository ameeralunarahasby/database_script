const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

window.onload = async function() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getDropdown");
        let result = await response.json();
        if (result.status === 'success') {
            populateDropdown('golongan', result.data.golongan);
            populateDropdown('jabatan', result.data.jabatan);
            populateDropdown('ruangan', result.data.ruangan);
        }
    } catch (error) { console.error("Gagal menarik data", error); }
};

function populateDropdown(id, dataArray) {
    let select = document.getElementById(id);
    if (!select || !dataArray) return;
    select.innerHTML = '<option value="">Pilih...</option>';
    dataArray.forEach(item => {
        let opt = document.createElement('option');
        opt.value = item; opt.innerText = item;
        select.appendChild(opt);
    });
}

// LOGIKA KONDISIONAL
document.getElementById('jml_anak').addEventListener('change', function() {
    let val = parseInt(this.value) || 0;
    document.getElementById('wrap_anak1').style.display = val >= 1 ? 'block' : 'none';
    document.getElementById('wrap_anak2').style.display = val >= 2 ? 'block' : 'none';
    document.getElementById('wrap_anak3').style.display = val >= 3 ? 'block' : 'none';
});

document.getElementById('kelompok_pegawai').addEventListener('change', function() {
    let isASN = (this.value === 'ASN');
    document.getElementById('wrap_nip').style.display = isASN ? 'block' : 'none';
    document.getElementById('wrap_tmt_pangkat').style.display = isASN ? 'block' : 'none';
    document.getElementById('wrap_tmt_cpns').style.display = isASN ? 'block' : 'none';
});

document.getElementById('nip').addEventListener('input', function() {
    let nipClean = this.value.replace(/\s+/g, ''); 
    if (nipClean.length >= 14) {
        let yyyy = nipClean.substring(8, 12);
        let mm = nipClean.substring(12, 14);
        if(parseInt(mm) >= 1 && parseInt(mm) <= 12) document.getElementById('tmt_cpns').value = `${yyyy}-${mm}-01`;
    }
});

function hitungTmtPensiun() {
    let tglLahir = document.getElementById('tanggal_lahir').value;
    let bup = document.getElementById('bup').value;
    if (tglLahir && bup) {
        let birth = new Date(tglLahir);
        let pensiunDate = new Date(birth.getFullYear() + parseInt(bup), birth.getMonth() + 1, 1);
        let y = pensiunDate.getFullYear();
        let m = String(pensiunDate.getMonth() + 1).padStart(2, '0');
        let d = String(pensiunDate.getDate()).padStart(2, '0');
        document.getElementById('tmt_pensiun').value = `${y}-${m}-${d}`;
    }
}
document.getElementById('tanggal_lahir').addEventListener('input', hitungTmtPensiun);
document.getElementById('bup').addEventListener('change', hitungTmtPensiun);

document.getElementById('masuk_rs').addEventListener('input', function() {
    let startDate = new Date(this.value); let endDate = new Date();
    if (startDate > endDate || isNaN(startDate)) { document.getElementById('masa_kerja').value = ""; return; }
    
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    if (days < 0) { months--; days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    document.getElementById('masa_kerja').value = `${years} Tahun ${months} Bulan ${days} Hari`;
});

// WIZARD
let currentTab = 0;
showTab(currentTab);

function showTab(n) {
    let tabs = document.getElementsByClassName("tab");
    tabs[n].style.display = "block";
    document.getElementById("prevBtn").style.display = (n == 0) ? "none" : "inline-block";
    
    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Simpan Data";
        document.getElementById("nextBtn").style.backgroundColor = "#28a745";
    } else {
        document.getElementById("nextBtn").innerHTML = "Selanjutnya";
        document.getElementById("nextBtn").style.backgroundColor = "#007BFF";
    }
    
    let steps = document.getElementsByClassName("step");
    for (let i = 0; i < steps.length; i++) steps[i].className = steps[i].className.replace(" active", "");
    steps[n].className += " active";
}

function nextPrev(n) {
    let tabs = document.getElementsByClassName("tab");
    if (n == 1 && !validateForm()) return false;
    tabs[currentTab].style.display = "none";
    currentTab = currentTab + n;
    
    if (currentTab >= tabs.length) {
        submitData();
        currentTab = currentTab - n; 
        tabs[currentTab].style.display = "block";
        return false;
    }
    showTab(currentTab);
}

function validateForm() {
    let tabs = document.getElementsByClassName("tab"), valid = true;
    let inputs = tabs[currentTab].querySelectorAll("input[required], select[required]");
    inputs.forEach(el => {
        if (el.closest('.form-group').style.display !== 'none' && el.value === "") {
            el.classList.add("invalid"); valid = false;
        } else { el.classList.remove("invalid"); }
    });
    if (valid) document.getElementsByClassName("step")[currentTab].className += " finish";
    return valid;
}

async function submitData() {
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.innerText = "Mengirim..."; nextBtn.disabled = true;

    const textIds = [
        'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
        'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
        'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
        'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
        'ruangan','tmt_nota','bpjs_kesehatan','ketenagakerjaan_taspen','npwp'
    ];
    
    let payload = {};
    textIds.forEach(id => { let el = document.getElementById(id); if(el) payload[id] = el.value; });

    const fileIds = ['file_foto','file_ktp','file_kk','file_ijazah','file_pangkat','file_jabatan'];
    
    for (let id of fileIds) {
        let fileInput = document.getElementById(id);
        if (fileInput && fileInput.files.length > 0) {
            let file = fileInput.files[0];
            payload[id] = await new Promise(resolve => {
                let reader = new FileReader();
                reader.onload = () => resolve({base64: reader.result.split(',')[1], mimeType: file.type});
                reader.readAsDataURL(file);
            });
        }
    }

    try {
        let response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        let result = await response.json();
        alert(result.message);
        if(result.status === 'success') window.location.href = "pegawai.html";
    } catch(err) { alert("Gagal mengirim data: " + err); } 
    finally { nextBtn.innerText = "Simpan Data"; nextBtn.disabled = false; }
}
