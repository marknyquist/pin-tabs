import { getSavedFolderId } from "./repin.js";

const select = document.getElementById("folder");
const button = document.getElementById("go");
const buttonAll = document.getElementById("goAll");
const buttons = [button, buttonAll];
const status = document.getElementById("status");

function setStatus(text, isError = false) {
  status.textContent = text;
  status.className = isError ? "error" : "";
}

// Flatten the bookmark tree into folder options, indented by depth.
function addFolders(node, depth) {
  for (const child of node.children ?? []) {
    if (child.url) continue;
    const option = document.createElement("option");
    option.value = child.id;
    option.textContent = "  ".repeat(depth) + (child.title || "(untitled)");
    select.append(option);
    addFolders(child, depth + 1);
  }
}

async function init() {
  const [root] = await chrome.bookmarks.getTree();
  addFolders(root, 0);
  const saved = await getSavedFolderId();
  if (saved && select.querySelector(`option[value="${saved}"]`)) select.value = saved;
}

select.addEventListener("change", () => {
  chrome.storage.sync.set({ folderId: select.value });
});

const ALL_LABEL = buttonAll.textContent;
let armed = false;
let armTimer;

// Two-step confirm inside the popup; window.confirm() can dismiss the popup on macOS.
function disarm() {
  clearTimeout(armTimer);
  armed = false;
  buttonAll.textContent = ALL_LABEL;
  buttonAll.classList.remove("armed");
}

async function run(closeAll) {
  const win = await chrome.windows.getCurrent();
  if (closeAll && !armed) {
    const open = await chrome.tabs.query({ windowId: win.id });
    armed = true;
    buttonAll.textContent = `Click again to close ${open.length} tabs`;
    buttonAll.classList.add("armed");
    armTimer = setTimeout(disarm, 4000);
    return;
  }
  disarm();

  buttons.forEach((b) => (b.disabled = true));
  setStatus("Working…");
  try {
    await chrome.storage.sync.set({ folderId: select.value });
    const res = await chrome.runtime.sendMessage({
      type: "repin",
      folderId: select.value,
      windowId: win.id,
      closeAll,
    });
    if (res.error) throw new Error(res.error);
    setStatus(`Pinned ${res.count} tab${res.count === 1 ? "" : "s"}.`);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

button.addEventListener("click", () => run(false));
buttonAll.addEventListener("click", () => run(true));

init();
