# nous-extension
> Chrome extension for nous.

How it's supposed to work
- User clicks on chrome extension and clicks on "Save to Nous"
- The extension gets the active tab's URL, page content of the tab and page title and sends to the backend (FastAPI server)
- The backend server then vectorizes this data and saves it.

---

## to do
- Create a context menu entry to right click and save the page
- Add keyboard shortcut to save the page
- On clicking the "Save to Nous", 
    - if all ok; the text of the button should change to display "Saved!" if it went well.
    - if not; the text should change to display "Error!"
- FIX: `Unchecked runtime.LastError: "Message port closed before a response` from popup.html/js
- 
