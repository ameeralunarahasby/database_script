function toggleSidebar() {
    let sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    let logo = document.getElementById('logo');
    if(sidebar.classList.contains('collapsed')) {
        logo.innerText = "HR";
        // Tutup semua submenu saat disembunyikan
        document.querySelectorAll('.submenu').forEach(el => el.classList.remove('show'));
    } else {
        logo.innerText = "SI-PEG";
    }
}

function toggleSubmenu(id) {
    let sidebar = document.getElementById('sidebar');
    if(sidebar.classList.contains('collapsed')) {
        toggleSidebar(); 
    }
    let el = document.getElementById(id);
    el.classList.toggle('show');
}

function loadPage(url) {
    document.getElementById('contentFrame').src = url;
}
