document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const copyButton = target.closest("[data-copy]");
  if (copyButton) {
    const originalLabel = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy);
      copyButton.textContent = "Copied";
      copyButton.classList.add("is-copied");
      window.setTimeout(() => {
        copyButton.textContent = originalLabel;
        copyButton.classList.remove("is-copied");
      }, 1800);
    } catch (error) {
      console.error("Unable to copy short link:", error);
      copyButton.textContent = "Copy failed";
      window.setTimeout(() => { copyButton.textContent = originalLabel; }, 1800);
    }
  }

  if (target.closest(".notice-close")) {
    target.closest(".notice").remove();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const confirmation = event.submitter?.dataset.confirm || form.dataset.confirm;
  if (confirmation && !window.confirm(confirmation)) {
    event.preventDefault();
    return;
  }

  if (form.id === "bulk-links-form") {
    const selected = document.querySelectorAll('input[form="bulk-links-form"][name="ids"]:checked');
    if (!selected.length) {
      event.preventDefault();
      window.alert("Select at least one link.");
      return;
    }
    if (selected.length > 100) {
      event.preventDefault();
      window.alert("Select no more than 100 links at a time.");
    }
  }
});
