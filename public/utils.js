function GET(url, callback) {
  fetch(url).then((response) => {
    response.json().then((data) => callback(data));
  });
}

function id(id) {
  return document.getElementById(id);
}

function askBool(text, callback) {
  let container = document.createElement("div");
  container.id = "popup-container";

  let div = document.createElement("div");
  div.id = "popup-window";
  div.innerHTML = "<div>" + text + "</div>";

  let yesBtn = document.createElement("button");
  yesBtn.innerHTML = "Yes";
  yesBtn.className = "popup-button";

  let noBtn = document.createElement("button");
  noBtn.innerHTML = "No";
  noBtn.className = "popup-button";

  div.append(yesBtn, noBtn);

  yesBtn.onclick = () => {
    container.remove();
    callback(true);
  };

  noBtn.onclick = () => {
    container.remove();
    callback(false);
  };

  container.append(div);
  document.body.append(container);
}

async function POST(url = "", data = {}) {
  // Default options are marked with *

  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      //"Content-Type": "application/x-www-form-urlencoded"
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}
