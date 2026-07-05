const fromText = document.querySelector(".from-text");
const toText = document.querySelector(".to-text");
const exchangeIcon = document.querySelector(".exchange");
const selectTag = document.querySelectorAll("select");
const icons = document.querySelectorAll(".icons i");
const translateBtn = document.querySelector(".translate-btn");
const charCounter = document.getElementById("char-counter");
const clearSourceBtn = document.getElementById("clear-source");

// MENAMBAH PILIHAN NEGARA (Add country choices)
selectTag.forEach((tag, id) => {
  for (let country_code in countries) {
    let selected =
      id == 0
        ? country_code == "en-GB"
          ? "selected"
          : ""
        : country_code == "id-ID"
        ? "selected"
        : "";
    let option = `<option ${selected} value="${country_code}">${countries[country_code]}</option>`;
    tag.insertAdjacentHTML("beforeend", option);
  }
});

// Swap languages, texts, and re-translate if text is present
exchangeIcon.addEventListener("click", () => {
  let tempText = fromText.value;
  let tempLang = selectTag[0].value;
  
  fromText.value = toText.value;
  toText.value = tempText;
  
  selectTag[0].value = selectTag[1].value;
  selectTag[1].value = tempLang;
  
  updateCharCount();
  
  if (fromText.value.trim()) {
    translateText();
  }
});

// Live character counter
function updateCharCount() {
  const currentLength = fromText.value.length;
  charCounter.textContent = `${currentLength} / 2000`;
}

fromText.addEventListener("input", () => {
  updateCharCount();
  if (!fromText.value.trim()) {
    toText.value = "";
  }
});

// Clear input field button
clearSourceBtn.addEventListener("click", () => {
  fromText.value = "";
  toText.value = "";
  updateCharCount();
  fromText.focus();
});

// Translation fetch logic
function translateText() {
  let text = fromText.value.trim();
  let translateFrom = selectTag[0].value;
  let translateTo = selectTag[1].value;

  if (!text) return;
  
  const originalBtnContent = translateBtn.innerHTML;
  translateBtn.disabled = true;
  translateBtn.innerHTML = `<span class="spinner"></span> <span>Translating...</span>`;
  toText.setAttribute("placeholder", "Translating text...");

  let apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${translateFrom}|${translateTo}`;
  
  fetch(apiUrl)
    .then((res) => {
      if (!res.ok) throw new Error("API response error");
      return res.json();
    })
    .then((data) => {
      let translation = data.responseData.translatedText;
      if (data.matches && data.matches.length > 0) {
        data.matches.forEach((match) => {
          if (match.id === 0 || match.id === "0") {
            translation = match.translation;
          }
        });
      }
      toText.value = translation;
      toText.setAttribute("placeholder", "Translation");
    })
    .catch((err) => {
      console.error(err);
      toText.setAttribute("placeholder", "Translation failed. Try again.");
    })
    .finally(() => {
      translateBtn.disabled = false;
      translateBtn.innerHTML = originalBtnContent;
    });
}

translateBtn.addEventListener("click", translateText);

// Volume (TTS) and Copy handlers
icons.forEach((icon) => {
  icon.addEventListener("click", ({ target }) => {
    const isFrom = target.id === "from";
    const textToProcess = isFrom ? fromText.value.trim() : toText.value.trim();
    
    if (!textToProcess) return;

    // COPY TO CLIPBOARD
    if (target.classList.contains("fa-copy")) {
      navigator.clipboard.writeText(textToProcess)
        .then(() => {
          const originalClass = target.className;
          target.className = "fas fa-check copied";
          target.setAttribute("data-tooltip", "Copied!");
          
          setTimeout(() => {
            target.className = originalClass;
            target.setAttribute("data-tooltip", isFrom ? "Copy text" : "Copy translation");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
    
    // TEXT TO SPEECH
    if (target.classList.contains("fa-volume-up")) {
      let utterance = new SpeechSynthesisUtterance(textToProcess);
      utterance.lang = isFrom ? selectTag[0].value : selectTag[1].value;
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  });
});
