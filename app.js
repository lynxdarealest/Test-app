const SITE_ORIGIN = "https://kemono.cr";
const API_ORIGINS = ["https://kemono.cr", "https://kemono.su"];
const API_TIMEOUT_MS = 15_000;

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

function postCard(post, siteOrigin = SITE_ORIGIN) {
  const title = post.title?.trim() || "(Không có tiêu đề)";
  const excerpt = (post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  const attachment = post.attachments?.[0]?.path;
  const attachmentLink = attachment ? `${siteOrigin}${attachment}` : null;

  return `
    <article class="card">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(excerpt || "Không có nội dung mô tả.")}</p>
      ${attachmentLink ? `<p><a href="${attachmentLink}" target="_blank" rel="noopener noreferrer">Mở tệp đính kèm</a></p>` : ""}
    </article>
  `;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function toConnectionError(error, origin) {
  if (error?.name === "AbortError") {
    return `${origin}: Hết thời gian chờ ${Math.round(API_TIMEOUT_MS / 1000)}s`;
  }

  if (error?.name === "TypeError") {
    return `${origin}: Không thể kết nối (DNS/CORS/mạng)`;
  }

  return `${origin}: ${error?.message || "Lỗi không xác định"}`;
}

async function loadPosts(service, creatorId) {
  setStatus("Đang tải...");
  postsRoot.innerHTML = "";

  const endpointPath = `/api/v1/${encodeURIComponent(service)}/user/${encodeURIComponent(creatorId)}?o=0`;
  const connectionErrors = [];
  let data = null;
  let selectedOrigin = SITE_ORIGIN;

  for (const origin of API_ORIGINS) {
    const endpoint = `${origin}${endpointPath}`;

    try {
      const response = await fetchWithTimeout(endpoint, { mode: "cors" });
      if (!response.ok) {
        if (response.status >= 500) {
          connectionErrors.push(`${origin}: API lỗi ${response.status}`);
          continue;
        }

        throw new Error(`API trả về lỗi ${response.status}.`);
      }

      data = await response.json();
      selectedOrigin = origin;
      break;
    } catch (error) {
      if (error.message?.startsWith("API trả về lỗi")) {
        throw error;
      }
      connectionErrors.push(toConnectionError(error, origin));
    }
  }

  if (data === null) {
    throw new Error(
      `Không thể kết nối máy chủ. Đã thử: ${connectionErrors.join(" | ")}`
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    setStatus("Không có bài viết nào.");
    return;
  }

  postsRoot.innerHTML = data.slice(0, 20).map((post) => postCard(post, selectedOrigin)).join("");
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
