import { repin, getSavedFolderId } from "./repin.js";

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "repin") return;
  const folderId = await getSavedFolderId();
  if (!folderId) {
    chrome.action.openPopup?.();
    return;
  }
  try {
    await repin(folderId);
  } catch (err) {
    console.error("Re-pin failed:", err);
  }
});

// The popup asks the service worker to do the work, because closing the
// active tab can close the popup and would cut its script off mid-run.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "repin") return;
  repin(msg.folderId, { windowId: msg.windowId, closeAll: msg.closeAll })
    .then((count) => sendResponse({ count }))
    .catch((err) => sendResponse({ error: err.message }));
  return true; // keep the channel open for the async response
});
