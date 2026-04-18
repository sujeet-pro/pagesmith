const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function initSidebarModal(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-sidebar-toggle]");
  const modal = document.querySelector<HTMLDialogElement>("[data-sidebar-modal]");
  if (!toggle || !modal) return;

  const closeTargets = modal.querySelectorAll<HTMLElement>("[data-sidebar-close]");
  const panel = modal.querySelector<HTMLElement>(".doc-sidebar-modal-panel");
  if (!panel || closeTargets.length === 0) return;

  const toggleButton = toggle;
  const modalDialog = modal;
  const modalPanel = panel;

  const syncExpandedState = () => {
    toggleButton.setAttribute("aria-expanded", modalDialog.open ? "true" : "false");
  };

  const syncBodyScroll = () => {
    document.body.style.overflow = modalDialog.open ? "hidden" : "";
  };

  function openModal(): void {
    if (!modalDialog.open) {
      if (typeof modalDialog.showModal === "function") {
        modalDialog.showModal();
      } else {
        modalDialog.setAttribute("open", "");
      }
    }

    syncExpandedState();
    syncBodyScroll();
    window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(modalPanel);
      (firstFocusable ?? modalPanel).focus();
    });
  }

  function closeModal(restoreFocus = true): void {
    if (modalDialog.open && typeof modalDialog.close === "function") {
      modalDialog.close();
    } else {
      modalDialog.removeAttribute("open");
    }

    syncExpandedState();
    syncBodyScroll();
    if (restoreFocus) {
      toggleButton.focus();
    }
  }

  toggleButton.addEventListener("click", () => {
    if (modalDialog.open) {
      closeModal();
    } else {
      openModal();
    }
  });

  closeTargets.forEach((closeTarget) => {
    closeTarget.addEventListener("click", () => closeModal());
  });

  modalDialog.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeModal(false);
    }
  });

  modalDialog.addEventListener("close", () => {
    syncExpandedState();
    syncBodyScroll();
  });

  modalDialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(modalPanel);
    if (focusableElements.length === 0) {
      event.preventDefault();
      modalPanel.focus();
      return;
    }

    const firstElement = focusableElements[0]!;
    const lastElement = focusableElements[focusableElements.length - 1]!;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  syncExpandedState();
}
