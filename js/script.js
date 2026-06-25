// --- MASUKKAN URL WEB APP ANDA DI SINI ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

window.onload = async function() {
    // 1. Ambil Dropdown
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getDropdown");
        let result = await response.json();
        // ... (Logika Dropdown Anda Tetap Sama)
    } catch (error) {
        console.error("Gagal menarik data pengaturan", error);
    }

    // 2. CEK APAKAH INI MODE EDIT
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    
    if (editId) {
        document.getElementById('formTitle').innerText = "Edit Data Pegawai";
        document.getElementById('id_pegawai').value = editId;
        
        try {
            // Tarik data lalu filter berdasarkan ID Edit
            let res = await fetch(APPS_SCRIPT_URL + "?action=getPegawai");
            let json = await res.json();
            if (json.status === 'success') {
                let p = json.data.find(x => x.id_pegawai === editId);
                if (p) {
                    // Isi form secara otomatis!
                    Object.keys(p).forEach(key => {
                        let el = document.getElementById(key);
                        if (el && el.type !== 'file') {
                            // Format kalender jika tipenya Date
                            if (el.type === 'date' && p[key]) {
                                let d = new Date(p[key]);
                                if (!isNaN(d.getTime())) {
                                    el.value = d.toISOString().split('T')[0];
                                }
                            } else {
                                el.value = p[key];
                            }
                        }
                    });
                    
                    // Trigger logika kondisional form agar muncul
                    document.getElementById('jml_anak').dispatchEvent(new Event('change'));
                    document.getElementById('kelompok_pegawai').dispatchEvent(new Event('change'));
                }
            }
        } catch (e) {
            console.log("Gagal mengambil data edit", e);
        }
    }
};

// ... (KODE KONDISIONAL & WIZARD NAVIGATION ANDA TETAP SAMA) ...

// DI DALAM FUNGSI submitData():
async function submitData() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    nextBtn.disabled = true; 
    prevBtn.disabled = true;
    nextBtn.innerText = "Mengirim...";

    const textIds = [
        'id_pegawai', 'nik', 'nama' // ... (Sama seperti punya Anda)
    ];
    
    let payload = {};
    textIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) payload[id] = el.value;
    });

    // ... (Logika Konversi Foto/File ke Base64 Anda Sama Saja) ...

    try {
        let response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        let result = await response.json();
        alert(result.message);
        
        if(result.status === 'success') {
            // KEMBALI KE HALAMAN TABEL SETELAH BERHASIL SIMPAN / EDIT
            window.location.href = 'pegawai.html';
        }
    } catch(err) {
        alert("Gagal mengirim data: " + err);
    } finally {
        nextBtn.disabled = false; 
        prevBtn.disabled = false;
        nextBtn.innerText = "Simpan Data";
    }
}
