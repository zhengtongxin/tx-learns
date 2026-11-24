/* copilot.js, loaded on every dashboard page (Step 1) */
(function () {
  var side = document.createElement("aside");
  side.id = "copilot";
  side.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:320px;background:#fff;color:#111;border-left:1px solid #ccc;padding:8px;overflow:auto;z-index:50";
  side.innerHTML = '<button id="cp-tab" aria-expanded="true">Copilot</button>' +
    '<div id="cp-body"><ol id="cp-log"></ol><input id="cp-q" placeholder="Ask in plain English"><button id="cp-go">Ask</button></div>';
  document.body.appendChild(side);

  var tab = document.getElementById("cp-tab"), body = document.getElementById("cp-body");
  function setOpen(open) {
    body.style.display = open ? "" : "none";
    side.style.width = open ? "320px" : "auto";
    tab.setAttribute("aria-expanded", open);
    try { localStorage.setItem("copilot-open", open ? "1" : "0"); } catch (e) {}   // added: a blocked store must not break the page
  }
  var saved = null;
  try { saved = localStorage.getItem("copilot-open"); } catch (e) {}
  setOpen(saved !== "0");     // the first visit starts open
  tab.onclick = function () { setOpen(body.style.display === "none"); };

  document.getElementById("cp-go").onclick = async function () {
    var q = document.getElementById("cp-q").value;
    var reply = await fetch("/copilot/ask", {
      method: "POST",
      headers: {"Authorization": "Bearer " + sessionStorage.getItem("token"), "Content-Type": "application/json"},
      body: JSON.stringify({question: q})
    });
    var data = await reply.json();
    var li = document.createElement("li");
    li.textContent = data.answer || data.error;               // textContent, never innerHTML
    document.getElementById("cp-log").appendChild(li);
    if (data.steps && data.steps.length) {                    // added: show the steps the copilot took
      var small = document.createElement("small");
      small.style.display = "block";
      small.textContent = "Steps: " + data.steps.slice(-3).join(" | ");
      li.appendChild(small);
    }
    (data.pending || []).forEach(function (p) {                  // one Confirm button per payment the copilot asked about
      var b = document.createElement("button");
      b.textContent = "Confirm: pay S$" + p.amount + " on " + p.claim_id;
      b.onclick = function () {
        fetch("/copilot/confirm", {method: "POST",
          headers: {"Authorization": "Bearer " + sessionStorage.getItem("token"), "Content-Type": "application/json"},
          body: JSON.stringify(p)}).then(function (r) { return r.json(); })
          .then(function (out) { b.textContent = JSON.stringify(out); });
      };
      li.appendChild(b);
    });
  };
})();
