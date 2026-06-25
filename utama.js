// Ganti isi seluruh file utama.js dengan kode ini:
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Fungsi Toggle Sidebar
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
        });
    }

    // 2. Fungsi Dropdown Sidebar
    const dropdowns = document.querySelectorAll(".dropdown-btn");
    dropdowns.forEach(btn => {
        btn.addEventListener("click", function() {
            this.classList.toggle("active");
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent.style.display === "block") {
                dropdownContent.style.display = "none";
            } else {
                dropdownContent.style.display = "block";
            }
        });
    });
});
