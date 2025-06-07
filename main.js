// OPTCG Card List Main JS
// ...existing code from <script>...</script> in index.html...
// All JS code from your <script> tag goes here, starting from:

const cardContainer = document.querySelector(".card-container");
const allCards = [];
var filteredCards = [];
let currentDeck = [];
const deckMiniatures = document.querySelector(".deck-miniatures");
const deckSelect = document.querySelector('select[name="deck-select"]');
const deckNameInput = document.querySelector('input[name="deck-name"]');
const saveDeckBtn = document.querySelector('button[name="save-deck"]');
const loadDeckBtn = document.querySelector('button[name="load-deck"]');
const deleteDeckBtn = document.querySelector('button[name="delete-deck"]');
const exportDeckBtn = document.querySelector('button[name="export-deck"]');
const deckCounters = document.querySelector(".deck-counters");

function renderDeckCounters() {
  const typeCounts = {};
  let total = 0;
  let count1000 = 0;
  let count2000 = 0;
  currentDeck.forEach((card) => {
    const type = (card.category || "Unknown").toLowerCase();
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    total++;
    if (card.counter == 1000) count1000++;
    if (card.counter == 2000) count2000++;
  });
  let html = `<span><b>Total:</b> ${total}</span>`;
  for (const [type, count] of Object.entries(typeCounts)) {
    html += `<span><b>${
      type.charAt(0).toUpperCase() + type.slice(1)
    }:</b> ${count}</span>`;
  }
  html += `<span><b>1000 Counters:</b> ${count1000}</span>`;
  html += `<span><b>2000 Counters:</b> ${count2000}</span>`;
  deckCounters.innerHTML = html;
}

function renderDeckMiniatures() {
  deckMiniatures.innerHTML = "";
  const cardCount = {};
  currentDeck.forEach((card) => {
    const key = card.code;
    if (!cardCount[key]) cardCount[key] = { card, count: 0 };
    cardCount[key].count++;
  });
  // Sort: leaders first, then by code
  const sorted = Object.values(cardCount).sort((a, b) => {
    const aIsLeader =
      a.card.category && a.card.category.toLowerCase() === "leader";
    const bIsLeader =
      b.card.category && b.card.category.toLowerCase() === "leader";
    if (aIsLeader && !bIsLeader) return -1;
    if (!aIsLeader && bIsLeader) return 1;
    return a.card.code.localeCompare(b.card.code);
  });
  sorted.forEach(({ card, count }) => {
    const wrapper = document.createElement("div");
    wrapper.className = "deck-miniature";
    const img = document.createElement("img");
    img.src = card.backup_image;
    img.alt = card.name;
    img.title = card.name;
    wrapper.appendChild(img);
    const countSpan = document.createElement("span");
    countSpan.className = "deck-miniature-count";
    countSpan.textContent = count;
    wrapper.appendChild(countSpan);
    const controls = document.createElement("div");
    controls.className = "deck-miniature-controls";
    const btnMinus = document.createElement("button");
    btnMinus.type = "button";
    btnMinus.innerHTML = "−";
    btnMinus.title = "Remove one";
    btnMinus.style.color = "#b00";
    btnMinus.onclick = (e) => {
      e.stopPropagation();
      const idx = currentDeck.findIndex((c) => c.code === card.code);
      if (idx !== -1) {
        currentDeck.splice(idx, 1);
        renderDeckMiniatures();
        renderDeckCounters();
      }
    };
    const btnPlus = document.createElement("button");
    btnPlus.type = "button";
    btnPlus.innerHTML = "+";
    btnPlus.title = "Add one";
    btnPlus.style.color = "#080";
    btnPlus.onclick = (e) => {
      e.stopPropagation();
      const currentCount = currentDeck.filter(
        (c) => c.code === card.code
      ).length;
      if (card.category && card.category.toLowerCase() === "leader") {
        if (currentCount >= 1) {
          alert("You can only have 1 Leader card in your deck.");
          return;
        }
      } else if (currentCount >= 4) {
        alert("You can only have up to 4 copies of a card in your deck.");
        return;
      }
      if (currentDeck.length >= 51) {
        showToast("Deck is full (51 cards).");
        return;
      }
      const cardObj = allCards.find((c) => c.code === card.code);
      if (cardObj) {
        currentDeck.push(cardObj);
        renderDeckMiniatures();
        renderDeckCounters();
      }
    };
    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.innerHTML = '<span style="font-size:1.1em;color:#555;">🗑️</span>';
    btnClear.title = "Remove all";
    btnClear.onclick = (e) => {
      e.stopPropagation();
      currentDeck = currentDeck.filter((c) => c.code !== card.code);
      renderDeckMiniatures();
      renderDeckCounters();
    };
    controls.appendChild(btnMinus);
    controls.appendChild(btnPlus);
    controls.appendChild(btnClear);
    wrapper.appendChild(controls);
    deckMiniatures.appendChild(wrapper);
  });
  renderDeckCounters();
  updateSaveButtonState();
}

function showToast(message) {
  let toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "1.2em";
  toast.style.right = "1.5em";
  toast.style.left = "";
  toast.style.transform = "";
  toast.style.background = "rgba(40,40,40,0.95)";
  toast.style.color = "#fff";
  toast.style.padding = "0.7em 1.5em";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "1.1em";
  toast.style.zIndex = 9999;
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.4s";
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 400);
  }, 1200);
}

function saveDeckToLocalStorage() {
  const name = deckNameInput.value.trim();
  if (!name) {
    alert("Please enter a deck name.");
    return;
  }
  if (currentDeck.length !== 51) {
    showToast("Deck must have exactly 51 cards to save.");
    return;
  }
  const decks = JSON.parse(localStorage.getItem("op_decks") || "{}");
  decks[name] = currentDeck.map((card) => card.code + "|" + card.art_variant);
  localStorage.setItem("op_decks", JSON.stringify(decks));
  updateDeckDropdown();
  showToast("Deck saved!");
  updateSaveButtonState();
}

function updateDeckDropdown() {
  const decks = JSON.parse(localStorage.getItem("op_decks") || "{}");
  deckSelect.innerHTML = '<option value="">(Select deck)</option>';
  Object.keys(decks).forEach((deckName) => {
    const opt = document.createElement("option");
    opt.value = deckName;
    opt.textContent = deckName;
    deckSelect.appendChild(opt);
  });
}

function loadDeckFromLocalStorage() {
  const selected = deckSelect.value;
  if (!selected) return;
  const decks = JSON.parse(localStorage.getItem("op_decks") || "{}");
  const deckArr = decks[selected] || [];
  currentDeck = deckArr
    .map((key) => {
      const [code, art_variant] = key.split("|");
      return allCards.find(
        (card) => card.code === code && String(card.art_variant) === art_variant
      );
    })
    .filter(Boolean);
  deckNameInput.value = selected;
  deckSelect.value = selected;
  renderDeckMiniatures();
  renderDeckCounters();
  showToast("Deck loaded!");
  updateSaveButtonState();
}

function deleteSelectedDeck() {
  const selected = deckSelect.value;
  if (!selected) {
    showToast("No deck selected.");
    return;
  }
  if (!confirm(`Delete deck '${selected}'? This cannot be undone.`)) return;
  const decks = JSON.parse(localStorage.getItem("op_decks") || "{}");
  delete decks[selected];
  localStorage.setItem("op_decks", JSON.stringify(decks));
  updateDeckDropdown();
  deckSelect.value = "";
  deckNameInput.value = "";
  currentDeck = [];
  renderDeckMiniatures();
  renderDeckCounters();
  showToast("Deck deleted!");
  updateSaveButtonState();
}

deckNameInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    saveDeckToLocalStorage();
  }
});

function addCardToDeck(card) {
  const count = currentDeck.filter((c) => c.code === card.code).length;
  if (card.category && card.category.toLowerCase() === "leader") {
    if (count >= 1) {
      return;
    }
    if (
      currentDeck.some(
        (c) => c.category && c.category.toLowerCase() === "leader"
      )
    ) {
      return;
    }
  } else if (count >= 4) {
    return;
  }
  if (currentDeck.length >= 51) {
    showToast("Deck is full (51 cards).");
    return;
  }
  currentDeck.push(card);
  renderDeckMiniatures();
  renderDeckCounters();
}

function setupCardClickHandlers() {
  document.querySelectorAll(".card").forEach((cardDiv, idx) => {
    cardDiv.classList.remove("left-edge", "right-edge");
    const rect = cardDiv.getBoundingClientRect();
    const padding = 60;
    if (rect.left < padding) {
      cardDiv.classList.add("left-edge");
    } else if (window.innerWidth - rect.right < padding) {
      cardDiv.classList.add("right-edge");
    }
    const cardData = filteredCards[idx];
    const isLeader =
      cardData.category && cardData.category.toLowerCase() === "leader";
    cardDiv.onmouseenter = cardDiv.onmousemove = function () {
      cardDiv.classList.remove("left-edge", "right-edge");
      const rect = cardDiv.getBoundingClientRect();
      if (rect.left < padding) {
        cardDiv.classList.add("left-edge");
      } else if (window.innerWidth - rect.right < padding) {
        cardDiv.classList.add("right-edge");
      }
      const count = currentDeck.filter((c) => c.code === cardData.code).length;
      const maxCount = isLeader ? 1 : 4;
      if (count >= maxCount || currentDeck.length >= 51) {
        cardDiv.classList.add("maxed");
        cardDiv.style.cursor = "not-allowed";
      } else {
        cardDiv.classList.remove("maxed");
        cardDiv.style.cursor = "pointer";
      }
    };
    cardDiv.onmouseleave = function () {
      cardDiv.classList.remove("maxed");
      cardDiv.style.cursor = "pointer";
    };
    cardDiv.onclick = (e) => {
      const count = currentDeck.filter((c) => c.code === cardData.code).length;
      const maxCount = isLeader ? 1 : 4;
      if (count >= maxCount || currentDeck.length >= 51) return;
      addCardToDeck(cardData);
    };
    cardDiv.oncontextmenu = (e) => {
      e.preventDefault();
      const count = currentDeck.filter((c) => c.code === cardData.code).length;
      const maxCount = isLeader ? 1 : 4;
      if (count >= maxCount || currentDeck.length >= 51) return;
      const toAdd = Math.min(maxCount - count, 51 - currentDeck.length);
      for (let i = 0; i < toAdd; i++) {
        addCardToDeck(cardData);
      }
    };
  });
}

function updateFilteredCards() {
  const tag_map = {
    atk: "When Attacking",
    don: "DON!! x",
    oatk: "On Your Opponent's Attack",
    opt: "Once Per Turn",
    opl: "On Play",
    rsh: "Rush",
    blk: "Blocker",
    onblk: "On Block",
    main: "Activate: Main",
    trg: "Trigger",
    ctr: "Counter",
    end: "End of Your Turn",
    oko: "On K.O.",
    trn: "Your Turn",
    bsh: "Banish",
    dbl: "Double Attack",
  };
  const searchFilter = document.querySelector(
    ".search input[type='text']"
  ).value;
  const colorFilter = Array.from(
    document.querySelectorAll("input[name='color']")
  )
    .map(({ value, checked }) => checked && value)
    .filter((value) => !!value);
  const categoryFilter = Array.from(
    document.querySelectorAll("input[name='category']")
  )
    .map(({ value, checked }) => checked && value)
    .filter((value) => !!value);
  const counterFilter = Array.from(
    document.querySelectorAll("input[name='counter']")
  )
    .map(({ value, checked }) => checked && value)
    .filter((value) => !!value);
  const alternateArtFilter = Array.from(
    document.querySelectorAll("input[name='hide_alternate_art']")
  )
    .map(({ value, checked }) => checked && value)
    .filter((value) => !!value);
  const sortCriteria = document.querySelector(".sort select").value;
  // Keywords filter (multi-select)
  const keywordsSelect = document.getElementById("keywordsSelect");
  let tagCriteria = [];
  if (keywordsSelect) {
    tagCriteria = Array.from(keywordsSelect.selectedOptions).map(
      (opt) => opt.value
    );
  } else {
    // fallback for legacy checkboxes (should not be needed)
    tagCriteria = Array.from(document.querySelectorAll("input[name='tag']"))
      .map(({ value, checked }) => checked && value)
      .filter((value) => !!value);
  }
  filteredCards = allCards;
  if (searchFilter) {
    const terms = searchFilter
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    filteredCards = filteredCards.filter(
      ({ name, type, effect, trigger, code, original_text }) => {
        const searchableFields = [
          name,
          type,
          effect,
          trigger,
          code,
          original_text.name,
          original_text.type,
          original_text.effect,
          original_text.trigger,
        ].map((f) => (f || "").toLowerCase());
        return terms.every((term) =>
          searchableFields.some((field) => field.includes(term))
        );
      }
    );
  }
  if (colorFilter.length > 0)
    filteredCards = filteredCards.filter(({ color, category }) => {
      return color
        .split(" ")
        .every((c) => colorFilter.includes(c.toLowerCase()));
    });
  if (categoryFilter.length > 0)
    filteredCards = filteredCards.filter(({ category }) =>
      categoryFilter.includes(category.toLowerCase())
    );
  if (counterFilter.length > 0)
    filteredCards = filteredCards.filter(({ counter }) =>
      counterFilter.includes(counter.toString())
    );
  if (alternateArtFilter.length > 0)
    filteredCards = filteredCards.filter(
      ({ art_variant }) => art_variant === 0
    );
  if (tagCriteria.length > 0)
    filteredCards = filteredCards.filter(({ tags }) => {
      if (!tags) return false;
      const tagSet = new Set(tags.split(","));
      return tagCriteria.every((element) => tagSet.has(element));
    });
  filteredCards.sort((a, b) => {
    if (sortCriteria === "code") return a.code.localeCompare(b.code);
    else if (sortCriteria === "costASC") return a.cost - b.cost;
    else if (sortCriteria === "costDESC") return b.cost - a.cost;
  });
  displayFilteredCards();
}

function imageErrorHandler(element) {
  console.log(element);
  element.onerror = null;
  element.parentNode.children[0].srcset =
    element.parentNode.children[1].srcset = element.src;
}

function displayFilteredCards() {
  cardContainer.innerHTML = "";
  filteredCards.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("card");
    const image = document.createElement("picture");
    image.classList.add("card-image");
    preferredSource = document.createElement("source");
    preferredSource.setAttribute("srcset", item.image);
    backupSource = document.createElement("source");
    backupSource.setAttribute("srcset", item.backup_image);
    fallbackImage = document.createElement("img");
    fallbackImage.src = item.backup_image;
    fallbackImage.loading = "lazy";
    fallbackImage.onerror = function () {
      this.onerror = null;
      this.parentNode.children[0].srcset = this.parentNode.children[1].srcset =
        this.src;
      return true;
    };
    image.appendChild(preferredSource);
    image.appendChild(backupSource);
    image.appendChild(fallbackImage);
    card.appendChild(image);
    cardContainer.appendChild(card);
  });
  setupCardClickHandlers();
}

function isDeckEqual(deckA, deckB) {
  if (!Array.isArray(deckA) || !Array.isArray(deckB)) return false;
  if (deckA.length !== deckB.length) return false;
  const aSorted = [...deckA].sort();
  const bSorted = [...deckB].sort();
  for (let i = 0; i < aSorted.length; i++) {
    if (aSorted[i] !== bSorted[i]) return false;
  }
  return true;
}

function updateSaveButtonState() {
  const name = deckNameInput.value.trim();
  const decks = JSON.parse(localStorage.getItem("op_decks") || "{}");
  const savedDeck = decks[name] || [];
  const currentDeckKeys = currentDeck.map(
    (card) => card.code + "|" + card.art_variant
  );
  if (
    currentDeck.length !== 51 ||
    (savedDeck.length > 0 && isDeckEqual(savedDeck, currentDeckKeys))
  ) {
    saveDeckBtn.disabled = true;
  } else {
    saveDeckBtn.disabled = false;
  }
}

["input", "change"].forEach((evt) => {
  deckNameInput.addEventListener(evt, updateSaveButtonState);
  deckSelect.addEventListener(evt, updateSaveButtonState);
});

saveDeckBtn.onclick = saveDeckToLocalStorage;
loadDeckBtn.onclick = loadDeckFromLocalStorage;
deckSelect.onchange = function () {
  if (deckSelect.value) {
    deckNameInput.value = deckSelect.value;
  }
};
document.querySelector('button[name="delete-deck"]').onclick =
  deleteSelectedDeck;

exportDeckBtn.onclick = function () {
  if (currentDeck.length === 0) {
    showToast("Deck is empty.");
    return;
  }
  const cardCount = {};
  currentDeck.forEach((card) => {
    const key = card.code;
    if (!cardCount[key]) cardCount[key] = 0;
    cardCount[key]++;
  });
  const lines = Object.entries(cardCount).map(
    ([code, count]) => `${code} x${count}`
  );
  const text = lines.join("\n");
  navigator.clipboard.writeText(text).then(
    () => {
      showToast("Deck exported to clipboard!");
    },
    () => {
      showToast("Failed to copy deck.");
    }
  );
};

fetch("OPTCG.json")
  .then((response) => response.json())
  .then((data) => {
    allCards.push(
      ...data.cards.map((card) => {
        const translation = data.card_locales.find(
          (translation) =>
            translation.card_code === card.code &&
            translation.art_variant === card.art_variant
        );
        return {
          ...card,
          ...translation,
          original_text: {
            name: card.name,
            type: card.type,
            effect: card.effect,
            trigger: card.trigger,
          },
          backup_image: card.image,
        };
      })
    );
    filteredCards = allCards;
    displayFilteredCards();
    updateDeckDropdown();
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
    const message = document.createElement("p");
    message.textContent = "Error loading card data.";
    cardContainer.appendChild(message);
  });

document.addEventListener("DOMContentLoaded", function () {
  // Keywords modal logic
  const keywordsBtn = document.getElementById("keywordsFilterBtn");
  const keywordsModal = document.getElementById("keywordsModal");
  const closeKeywordsModal = document.getElementById("closeKeywordsModal");
  if (keywordsBtn && keywordsModal && closeKeywordsModal) {
    keywordsBtn.addEventListener("click", () => {
      keywordsModal.style.display = "flex";
    });
    closeKeywordsModal.addEventListener("click", () => {
      keywordsModal.style.display = "none";
    });
    keywordsModal.addEventListener("mousedown", (e) => {
      if (e.target === keywordsModal) {
        keywordsModal.style.display = "none";
      }
    });
  }
  // Initialize MultiSelect for keywords
  const keywordsSelect = document.getElementById("keywordsSelect");
  if (keywordsSelect && typeof MultiSelect !== "undefined") {
    new MultiSelect(keywordsSelect, {
      placeholder: "Select keywords",
      search: false, // Disable search box
      selectAll: true,
      onChange: function () {
        updateFilteredCards();
      },
    });
  }
  const effectsBtn = document.getElementById("effectsFilterBtn");
  const effectsModal = document.getElementById("effectsModal");
  const closeEffectsModal = document.getElementById("closeEffectsModal");
  if (effectsBtn && effectsModal && closeEffectsModal) {
    effectsBtn.addEventListener("click", () => {
      effectsModal.style.display = "flex";
    });
    closeEffectsModal.addEventListener("click", () => {
      effectsModal.style.display = "none";
    });
    // Close modal when clicking outside the modal content
    effectsModal.addEventListener("mousedown", (e) => {
      if (e.target === effectsModal) {
        effectsModal.style.display = "none";
      }
    });
  }
});
