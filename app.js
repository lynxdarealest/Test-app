const SITE_ORIGIN = "https://kemono.cr";
const API_BASE = `${SITE_ORIGIN}/api/v1`;
const REQUEST_TIMEOUT_MS = 15000;

const form = document.querySelector("#search-form");
const postsRoot = document.querySelector("#posts");
const statusEl = document.querySelector("#status");

function setStatus(message) {
  statusEl.textContent = message;
}

function escapeHtml(input = "") {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function postCard(post) {
  const title = post.title?.trim() || "(Không có tiêu đề)";
  const excerpt = (post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  const attachment = post.attachments?.[0]?.path;
  const attachmentLink = attachment ? `${SITE_ORIGIN}${attachment}` : null;

  return `
    <article class="card">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(excerpt || "Không có nội dung mô tả.")}</p>
      ${attachmentLink ? `<p><a href="${attachmentLink}" target="_blank" rel="noopener noreferrer">Mở tệp đính kèm</a></p>` : ""}
    </article>
  `;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isConnectionError(error) {
  if (!error) return false;
  return error.name === "AbortError" || error instanceof TypeError;
}

async function loadPosts(service, creatorId) {
  setStatus("Đang tải...");
  postsRoot.innerHTML = "";

  const endpoint = `${API_BASE}/${encodeURIComponent(service)}/user/${encodeURIComponent(creatorId)}?o=0`;
  const response = await fetchWithTimeout(endpoint, { mode: "cors" });

  if (!response.ok) {
    throw new Error(`API lỗi (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    setStatus("Không có bài viết nào.");
    return;
  }

  postsRoot.innerHTML = data.slice(0, 20).map(postCard).join("");
  setStatus(`Đã tải ${Math.min(data.length, 20)} bài viết.`);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = new FormData(form);
  const service = payload.get("service");
  const creatorId = payload.get("creatorId")?.toString().trim();

  if (!service || !creatorId) {
    setStatus("Vui lòng nhập đầy đủ thông tin.");
    return;
  }

  try {
    await loadPosts(service.toString(), creatorId);
  } catch (error) {
    if (isConnectionError(error)) {
      setStatus("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.");
      return;
    }
    setStatus(`Không thể tải dữ liệu: ${error.message}`);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      setStatus(`Không thể bật chế độ offline: ${error.message}`);
    }
  });
}
