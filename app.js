const apiBase = document.documentElement.dataset.apiBase || "";
const demoContent = {
  announcements: [
    { title: "Welcome to the Smart Campus preview", body: "This noticeboard will carry public university announcements when the campus pilot launches.", published_at: "2026-10-28" },
    { title: "Student and Faculty portals are in preview", body: "Portal sign-in will be connected as part of the institutional pilot.", published_at: "2026-10-24" },
    { title: "Campus stories and activities", body: "Explore a preview of the updates and campus activities planned for this space.", published_at: "2026-10-20" },
  ],
  news: [
    { headline: "Ideas grow when campus comes together", image_url: "assets/campus-ideas.webp", body: "A glimpse of the conversations and collaborations that bring a campus to life.", published_at: "2026-10-27" },
    { headline: "A new chapter for campus coordination", image_url: "assets/campus-workshop.webp", body: "The Smart Campus pilot brings campus updates into one clear, shared space.", published_at: "2026-10-22" },
    { headline: "Making space for the next big idea", image_url: "assets/campus-ideas.webp", body: "Student ideas, faculty guidance, and a campus ready to make things happen.", published_at: "2026-10-18" },
  ],
  activities: [
    { title: "IET TechSphere", image_url: "assets/campus-ideas.webp", description: "A demo glimpse of student-led technology, teamwork, and ideas in motion." },
    { title: "Campus, in celebration", image_url: "assets/campus-fest.webp", description: "A demo moment from the colour and energy of a campus gathering." },
    { title: "Learn by making", image_url: "assets/campus-workshop.webp", description: "A demo look at collaborative workshops and hands-on campus learning." },
  ],
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showStatus(type, message) {
  const status = document.querySelector(`[data-status="${type}"]`);
  status.textContent = message;
  status.hidden = false;
}

async function loadCollection(type, limit) {
  const endpoint = `${apiBase}/public/${type}?limit=${limit}`;
  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, credentials: "omit" });
    if (!response.ok) throw new Error(`Public content request failed (${response.status})`);
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : payload.items;
    if (!Array.isArray(records)) throw new Error("Unexpected public content response");
    return { records: records.slice(0, limit), demo: false };
  } catch {
    showStatus(type, "Preview mode: public content is not connected yet. The items below are demo content.");
    return { records: demoContent[type], demo: true };
  }
}

function appendDemoBadge(parent) {
  parent.append(makeElement("span", "demo-badge", "Demo content"));
}

function renderAnnouncements(records, demo) {
  const list = document.querySelector("#announcement-list");
  list.replaceChildren();
  list.setAttribute("aria-busy", "false");
  if (!records.length) {
    list.append(makeElement("p", "empty-state", "Abhi koi notice nahi."));
    return;
  }
  for (const record of records.slice(0, 5)) {
    const item = makeElement("article", "notice-item");
    item.append(makeElement("time", "notice-date", formatDate(record.published_at)));
    const title = makeElement("h3", "notice-title", record.title || "Campus update");
    if (demo) {
      const titleWrap = makeElement("div", "notice-title-wrap");
      titleWrap.append(title);
      appendDemoBadge(titleWrap);
      item.append(titleWrap);
    } else item.append(title);
    item.append(makeElement("p", "notice-summary", record.body || ""));
    item.append(makeElement("span", "notice-arrow", "↗"));
    list.append(item);
  }
}

function renderNews(records, demo) {
  const list = document.querySelector("#news-list");
  list.replaceChildren();
  list.setAttribute("aria-busy", "false");
  if (!records.length) {
    list.append(makeElement("p", "empty-state", "No campus stories yet."));
    return;
  }
  for (const record of records.slice(0, 6)) {
    const card = makeElement("article", "news-card");
    const link = makeElement("a", "news-card-link");
    link.href = "#news";
    link.dataset.storyIndex = String(records.indexOf(record));
    link.setAttribute("aria-label", record.headline || "Campus story");
    const imageWrap = makeElement("div", "news-image-wrap");
    if (record.image_url) {
      const image = makeElement("img", "news-image");
      image.src = record.image_url;
      image.alt = record.headline || "Campus news story";
      image.loading = "lazy";
      image.decoding = "async";
      imageWrap.append(image);
    }
    link.append(imageWrap);
    link.append(makeElement("p", "news-meta", formatDate(record.published_at)));
    link.append(makeElement("h3", "", record.headline || "Campus story"));
    if (demo) appendDemoBadge(link);
    card.append(link);
    list.append(card);
  }
}

function renderActivities(records, demo) {
  const list = document.querySelector("#activities-list");
  list.replaceChildren();
  list.setAttribute("aria-busy", "false");
  if (!records.length) {
    list.append(makeElement("p", "empty-state", "Campus activities will appear here."));
    return;
  }
  for (const record of records.slice(0, 6)) {
    const card = makeElement("article", "activity-card");
    const imageWrap = makeElement("div", "activity-image-wrap");
    if (record.image_url) {
      const image = makeElement("img", "activity-image");
      image.src = record.image_url;
      image.alt = `${record.title || "Campus activity"} photo`;
      image.loading = "lazy";
      image.decoding = "async";
      imageWrap.append(image);
    }
    const content = makeElement("div", "activity-content");
    content.append(makeElement("h3", "", record.title || "Campus activity"));
    content.append(makeElement("p", "", record.description || ""));
    if (demo) appendDemoBadge(content);
    card.append(imageWrap, content);
    list.append(card);
  }
}

async function populate(type, limit, render) {
  const { records, demo } = await loadCollection(type, limit);
  render(records, demo);
}

const newsState = { records: [], demo: false };
populate("announcements", 5, renderAnnouncements);
loadCollection("news", 6).then(({ records, demo }) => {
  newsState.records = records;
  newsState.demo = demo;
  renderNews(records, demo);
});
populate("activities", 6, renderActivities);

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
const loginDialog = document.querySelector(".login-dialog");
const loginTitle = document.querySelector("#login-dialog-title");
const loginCopy = document.querySelector(".dialog-copy");
const loginAction = document.querySelector("#login-dialog-action");
const loginAuthAction = document.querySelector("#login-dialog-auth-action");
const storyDialog = document.querySelector(".story-dialog");

function updateHeader() {
  header.classList.toggle("is-compact", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuButton.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isExpanded));
  menuButton.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  nav.classList.toggle("is-open", !isExpanded);
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }
});

document.querySelectorAll("[data-login]").forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.login;
    const isStudent = role === "student";
    loginTitle.textContent = isStudent ? "Student demo" : "Faculty demo";
    loginCopy.textContent = isStudent
      ? "This preview uses fictional sample data. It does not authenticate you or create a session."
      : "This preview uses fictional sample data. It does not authenticate you or create a session.";
    loginAction.href = isStudent ? "student-portal.html?demo=1" : "faculty-portal.html?demo=1";
    loginAction.innerHTML = isStudent
      ? "Open student demo <span aria-hidden=\"true\">↗</span>"
      : "Open faculty demo <span aria-hidden=\"true\">↗</span>";
    loginAuthAction.href = `portal-login.html?role=${role}`;
    loginDialog.showModal();
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => loginDialog.close());
loginDialog.addEventListener("click", (event) => {
  if (event.target === loginDialog) loginDialog.close();
});

document.querySelector(".story-close").addEventListener("click", () => storyDialog.close());
storyDialog.addEventListener("click", (event) => {
  if (event.target === storyDialog) storyDialog.close();
});

document.querySelector("#news-list").addEventListener("click", (event) => {
  const link = event.target.closest("[data-story-index]");
  if (!link) return;
  event.preventDefault();
  const record = newsState.records[Number(link.dataset.storyIndex)];
  if (!record) return;
  document.querySelector("#story-dialog-title").textContent = record.headline || "Campus story";
  document.querySelector("#story-dialog-date").textContent = formatDate(record.published_at);
  document.querySelector("#story-dialog-copy").textContent = record.body || "More details will be shared soon.";
  const image = document.querySelector("#story-dialog-image");
  image.src = record.image_url || "";
  image.alt = record.headline || "Campus story";
  image.hidden = !record.image_url;
  document.querySelector("#story-demo-badge").hidden = !newsState.demo;
  storyDialog.showModal();
});

document.querySelectorAll("[data-view-all]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showStatus(link.dataset.viewAll, "This public preview shows the latest items. A full archive will be available in the campus pilot.");
    document.querySelector(`[data-status="${link.dataset.viewAll}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
  });
});