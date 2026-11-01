# Pin Tabs from Bookmarks

A Chrome extension that resets your pinned tabs from a bookmarks folder.

- **Clear & re-pin tabs** closes the pinned tabs in the current window, then pins every URL in the chosen folder (subfolders included, in order).
- **Close all & re-pin tabs** closes *every* tab in the current window, then does the same. It asks you to click twice to confirm.
- **Alt+Shift+P** runs "Clear & re-pin" with the last folder you chose.

New tabs are opened before old ones are closed, so the window (and browser session) never closes. If the folder is empty, nothing is closed.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.

After pulling changes, click the reload icon on the extension's card.
