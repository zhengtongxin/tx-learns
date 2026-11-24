/* copilot.js, loaded on every dashboard page (Step 1). Fill in the TODOs. */
(function () {
  var side = document.createElement("aside");
  side.id = "copilot";
  side.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:320px;background:#fff;color:#111;border-left:1px solid #ccc;padding:8px;overflow:auto;z-index:50";
  side.innerHTML = '<button id="cp-tab" aria-expanded="true">Copilot</button>' +
    '<div id="cp-body"><ol id="cp-log"></ol><input id="cp-q" placeholder="Ask in plain English"><button id="cp-go">Ask</button></div>';
  document.body.appendChild(side);

  var tab = document.getElementById("cp-tab"), body = document.getElementById("cp-body");

  function setOpen(open) {
    // TODO: show or hide the body, narrow the sidebar to a thin tab when closed,
    //       set aria-expanded on the tab, and remember the choice in localStorage
    //       (wrap storage in try/catch: a blocked store must not break the page)
  }
  // TODO: read the saved choice; the first visit starts open
  // TODO: clicking the tab toggles it

  document.getElementById("cp-go").onclick = async function () {
    // TODO 1: POST {question} to /copilot/ask with the header
    //         "Authorization: Bearer " + sessionStorage.getItem("token")
    // TODO 2: add one <li> to #cp-log with the answer. Use textContent, never innerHTML.
    // TODO 3: for every item in data.pending, add a "Confirm: pay S$... on ..." button.
    //         Its click POSTs that item to /copilot/confirm and shows the reply on the button.
    //         Only this click may confirm a payment.
  };
})();
