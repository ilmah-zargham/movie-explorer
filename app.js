const API = "https://www.omdbapi.com/";
const KEY = "f7b4f805"; // OMDb key

const elQ = document.getElementById("q");
const elResults = document.getElementById("results");
const elStatus = document.getElementById("status");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeBtn = document.getElementById("close");
const themeBtn = document.getElementById("theme");

/* ======================
   SEARCH (with fallback)
====================== */
let timer;
elQ.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => search(elQ.value.trim()), 350);
});

async function search(q) {
  if (!q) { elResults.innerHTML = ""; elStatus.textContent = ""; return; }
  elStatus.textContent = "Loading…";
  try {
    // 1) Try search endpoint
    let res = await fetch(`${API}?apikey=${KEY}&s=${encodeURIComponent(q)}`);
    let data = await res.json();

    // 2) If that failed, try exact title
    if (data.Response === "False") {
      res = await fetch(`${API}?apikey=${KEY}&t=${encodeURIComponent(q)}`);
      data = await res.json();

      if (data.Response === "True") {
        // wrap single result so UI still works
        data.Search = [data];
      }
    }

    if (data.Response === "False") throw new Error(data.Error || "No results");
    elResults.innerHTML = data.Search.map(card).join("");
    elStatus.textContent = `${data.Search.length} result(s)`;
    bindCards(data.Search);
  } catch (e) {
    elResults.innerHTML = "";
    elStatus.textContent = e.message;
  }
}

function card(m) {
  const poster = (m.Poster && m.Poster !== "N/A")
    ? m.Poster
    : "https://via.placeholder.com/300x450?text=No+Poster";
  return `
    <article class="card" data-imdb="${m.imdbID || ""}" tabindex="0" aria-label="${m.Title} (${m.Year || ""})">
      <img loading="lazy" src="${poster}" alt="${m.Title} poster" />
      <div class="pad">
        <span class="badge">${m.Year || ""}</span>
        <h3>${m.Title}</h3>
        <p>${m.Type || ""}</p>
      </div>
    </article>`;
}

function bindCards(list){
  list.forEach(m=>{
    if (!m.imdbID) return;
    const node = document.querySelector(`[data-imdb="${m.imdbID}"]`);
    node?.addEventListener("click", ()=> openDetails(m.imdbID));
    node?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") openDetails(m.imdbID) });
  });
}

/* ======================
   DETAILS MODAL
====================== */
async function openDetails(id){
  modalBody.innerHTML = "Loading…";
  modal.showModal();
  try{
    const res = await fetch(`${API}?apikey=${KEY}&plot=short&i=${id}`);
    const d = await res.json();
    modalBody.innerHTML = `
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <img src="${(d.Poster && d.Poster !== "N/A") ? d.Poster : "https://via.placeholder.com/300x450"}"
             alt="${d.Title} poster"
             style="width:220px;aspect-ratio:2/3;object-fit:cover;border-radius:10px" />
        <div>
          <h2 style="margin:.2rem 0">${d.Title} (${d.Year})</h2>
          <p>${d.Plot || "No plot available."}</p>
          <p><strong>Genre:</strong> ${d.Genre || "-"}</p>
          <p><strong>IMDB:</strong> ${d.imdbRating || "-"}</p>
        </div>
      </div>`;
  }catch(e){
    modalBody.textContent = "Failed to load details.";
  }
}
closeBtn.addEventListener("click", ()=> modal.close());

/* ======================
   THEME TOGGLE
====================== */
function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.classList.toggle('light', isLight);
  themeBtn.setAttribute('aria-pressed', String(isLight));
  themeBtn.textContent = isLight ? '☀️' : '🌙';
}

const saved = localStorage.getItem('theme');
const systemPrefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
applyTheme(saved ?? (systemPrefersLight ? 'light' : 'dark'));

themeBtn.addEventListener('click', () => {
  const nowLight = !document.documentElement.classList.contains('light');
  const next = nowLight ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

/* ======================
   DEFAULT SEARCH ON LOAD
====================== */
window.addEventListener("DOMContentLoaded", ()=>{
  elQ.value = "batman";
  search("batman");
});