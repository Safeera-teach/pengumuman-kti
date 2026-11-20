/**
 * ============================================================================
 * KONFIGURASI DATABASE GOOGLE SHEETS (APPS SCRIPT)
 * ============================================================================
 * Tempel URL Web App (/exec) dari Google Apps Script Anda di bawah ini.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbx2KQWxHMkDzXMwQb_i0IBiDvrKq46PaRls1-lGZ8qVE1fwpwleoeuXyA6MZ5yrOh8/exec";

/**
 * ============================================================================
 * WARNA, UCAPAN & INFORMASI TAMBAHAN BERDASARKAN STATUS KELULUSAN
 * ============================================================================
 */
function getStatusConfig(status) {
  const normalized = status.trim().toUpperCase();

  if (
    normalized === "CUMLAUDE (DENGAN PUJIAN)" ||
    normalized === "LULUS (SANGAT MEMUASKAN)" ||
    normalized === "LULUS (MEMUASKAN)" ||
    normalized === "LULUS"
  ) {
    return {
      style: "bg-[#DFF3E4] border-[#8FD1A4] text-[#1E5C35]",
      ucapan: "Selamat Atas Usaha Kamu!",
      infoList: []
    };
  }

  if (normalized === "LULUS BERSYARAT") {
    return {
      style: "bg-[#FFF0CC] border-[#F2C36B] text-[#855410]",
      ucapan: "Selamat, Ayo Segera Tuntaskan Syaratnya!",
      infoBoxStyle: "bg-[#FFF6DF] border-[#F2C36B]",
      infoTitleStyle: "text-[#9A6312]",
      infoTextStyle: "text-[#6E450B]",
      infoList: [
        "Kumpulkan Buku Pedoman Senin, 23 Nov 2026",
        "Lembar Persetujuan Penulisan (bagi yang belum upload ke google classroom)",
        "Selesaikan Revisi dari Penguji.",
        "Temui zah Fira di Hari Senin, 23 Nov 2026"
      ]
    };
  }

  if (normalized === "PRESENTASI ULANG") {
    return {
      style: "bg-[#FDE2E2] border-[#F29C9C] text-[#A62626]",
      ucapan: "Ayo, Manfaatkan Kesempatan Remedial Ini\nDengan Baik!",
      infoBoxStyle: "bg-[#FDE4E4] border-[#F4B4B4]",
      infoTitleStyle: "text-[#B02E2E]",
      infoTextStyle: "text-[#7D2222]",
      infoList: [
        "Mengumpulkan Lembar Persetujuan ACC",
        "Menyelesaikan Revisi KTI dari Penguji",
        "Presentasi Ulang : Rabu, 9 Desember 2026"
      ]
    };
  }

  return {
    style: "bg-[#F5EBE1] border-[#DECBB9] text-[#4E3F36]",
    ucapan: "",
    infoList: []
  };
}

/**
 * ============================================================================
 * LOGIKA INTERAKSI, FETCH GOOGLE SHEETS, POP-UP & LOADING 5 DETIK
 * ============================================================================
 */
const searchForm = document.getElementById("search-form");
const inputNisn = document.getElementById("input-nisn");
const btnSubmit = document.getElementById("btn-submit");
const errorAlert = document.getElementById("error-alert");
const errorMessage = document.getElementById("error-message");

// Elemen Pop-up (Modal)
const resultModal = document.getElementById("result-modal");
const modalLoading = document.getElementById("modal-loading");
const modalResult = document.getElementById("modal-result");
const countdownNumber = document.getElementById("countdown-number");
const loadingSubtitle = document.getElementById("loading-subtitle");
const loadingBar = document.getElementById("loading-bar");

// Elemen Kartu Hasil
const statusBox = document.getElementById("status-box");
const resStatus = document.getElementById("res-status");
const resUcapan = document.getElementById("res-ucapan");
const resNama = document.getElementById("res-nama");
const resNisn = document.getElementById("res-nisn");
const infoTambahanBox = document.getElementById("info-tambahan-box");
const infoTambahanTitle = document.getElementById("info-tambahan-title");
const resInfoTambahan = document.getElementById("res-info-tambahan");

const btnCloseModal = document.getElementById("btn-close-modal");

// Pesan singkat selama 5 detik loading untuk efek surprise
const loadingMessages = {
  5: "Menyiapkan data kelulusan kamu...",
  4: "Memeriksa hasil karya tulis ilmiah...",
  3: "Tarik napas dulu, sebentar lagi...",
  2: "Hampir siap dibuka...",
  1: "Siap-siap melihat hasilnya!"
};

let countdownInterval = null;
let revealTimeout = null;

function showError(message) {
  errorMessage.textContent = message;
  errorAlert.classList.remove("hidden");
}

function hideError() {
  errorAlert.classList.add("hidden");
  errorMessage.textContent = "";
}

function populateResult(siswa) {
  const config = getStatusConfig(siswa.status);

  statusBox.className = `soft-pill p-5 text-center border-2 space-y-1.5 ${config.style}`;
  resStatus.textContent = siswa.status;
  resUcapan.textContent = config.ucapan;

  resNama.textContent = siswa.nama;
  resNisn.textContent = siswa.nisn;

  // Tampilkan daftar Informasi Tambahan jika ada (LULUS BERSYARAT / PRESENTASI ULANG)
  if (config.infoList && config.infoList.length > 0) {
    infoTambahanBox.className = `rounded-2xl border-2 p-4 space-y-2 ${config.infoBoxStyle}`;
    infoTambahanTitle.className = `text-xs font-bold uppercase tracking-wider ${config.infoTitleStyle}`;
    resInfoTambahan.className = `list-disc pl-5 space-y-1.5 text-sm font-semibold leading-relaxed ${config.infoTextStyle}`;

    resInfoTambahan.innerHTML = "";
    config.infoList.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      resInfoTambahan.appendChild(li);
    });

    infoTambahanBox.classList.remove("hidden");
  } else {
    infoTambahanBox.classList.add("hidden");
  }
}

function openSurpriseModal(siswa) {
  clearInterval(countdownInterval);
  clearTimeout(revealTimeout);

  populateResult(siswa);

  modalResult.classList.add("hidden");
  modalLoading.classList.remove("hidden");
  resultModal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  // Reset animasi progress bar 5 detik
  loadingBar.classList.remove("animate-progress-5s");
  void loadingBar.offsetWidth;
  loadingBar.classList.add("animate-progress-5s");

  let sisaDetik = 5;
  countdownNumber.textContent = sisaDetik;
  loadingSubtitle.textContent = loadingMessages[sisaDetik];

  countdownInterval = setInterval(function () {
    sisaDetik -= 1;
    if (sisaDetik >= 1) {
      countdownNumber.textContent = sisaDetik;
      loadingSubtitle.textContent = loadingMessages[sisaDetik];
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);

  revealTimeout = setTimeout(function () {
    clearInterval(countdownInterval);
    modalLoading.classList.add("hidden");
    modalResult.classList.remove("hidden");
  }, 5000);
}

function closeModal() {
  clearInterval(countdownInterval);
  clearTimeout(revealTimeout);
  resultModal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  inputNisn.value = "";
  hideError();
  inputNisn.focus();
}

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideError();

  const query = inputNisn.value.trim();

  if (!query) {
    showError("Silakan masukkan NISN Anda");
    inputNisn.focus();
    return;
  }

  if (API_URL === "TEMPEL_URL_GOOGLE_APPS_SCRIPT_ANDA_DI_SINI" || !API_URL.startsWith("http")) {
    showError("URL Database Google Sheets belum diatur di file script.js.");
    return;
  }

  const teksAsli = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "Memeriksa data...";

  try {
    const response = await fetch(`${API_URL}?nisn=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (!result.found) {
      showError("Data tidak ditemukan. Pastikan NISN yang dimasukkan benar atau hubungi panitia.");
      return;
    }

    openSurpriseModal(result.data);
  } catch (error) {
    showError("Gagal terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = teksAsli;
  }
});

inputNisn.addEventListener("input", hideError);
btnCloseModal.addEventListener("click", closeModal);

// Tutup pop-up jika klik area gelap di luar kotak (hanya setelah hasil terbuka)
resultModal.addEventListener("click", function (event) {
  if (event.target === resultModal && !modalResult.classList.contains("hidden")) {
    closeModal();
  }
});