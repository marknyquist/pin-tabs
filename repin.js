// Shared logic used by both the popup and the keyboard shortcut.

// Collect every bookmark URL under a folder, including nested subfolders, in order.
function collectUrls(node, out = []) {
  for (const child of node.children ?? []) {
    if (child.url) out.push(child.url);
    else collectUrls(child, out);
  }
  return out;
}

export async function getFolderUrls(folderId) {
  const [folder] = await chrome.bookmarks.getSubTree(folderId);
  return collectUrls(folder);
}

// Closes all pinned tabs in the window (or every tab, with closeAll) and
// replaces them with the folder's URLs as pinned tabs.
// New tabs are created before the old ones are removed so the window never
// ends up empty (which would close the window, and with it possibly the
// browser session). An empty folder is rejected before anything is closed.
export async function repin(folderId, { windowId, closeAll = false } = {}) {
  const urls = await getFolderUrls(folderId);
  if (urls.length === 0) throw new Error("That folder has no bookmarks.");

  const win = windowId ?? (await chrome.windows.getLastFocused({ windowTypes: ["normal"] })).id;
  const oldTabs = await chrome.tabs.query(closeAll ? { windowId: win } : { windowId: win, pinned: true });

  const created = [];
  for (const [i, url] of urls.entries()) {
    created.push(await chrome.tabs.create({ windowId: win, url, pinned: true, active: false, index: i }));
  }

  // Focus a new tab first so Chrome doesn't have to pick one as tabs disappear.
  if (closeAll) await chrome.tabs.update(created[0].id, { active: true });

  if (oldTabs.length) await chrome.tabs.remove(oldTabs.map((t) => t.id));
  return urls.length;
}

export async function getSavedFolderId() {
  const { folderId } = await chrome.storage.sync.get("folderId");
  return folderId;
}
