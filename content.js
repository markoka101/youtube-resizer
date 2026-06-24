(function() {
  const isWatchPage = globalThis.location.pathname.includes('/watch');

  if (isWatchPage) {
    handleWatchPageLayout();
  } else {
    handleHomePageLayout();
  }

  // WATCH PAGE LOGIC

  function handleWatchPageLayout() {
    const sidebar = document.querySelector('#secondary.ytd-watch-flexy');
    const primary = document.querySelector('#primary.ytd-watch-flexy');

    if (!sidebar || !primary) {
      alert("Make sure you are on an open video watch page!");
      return;
    }

    const currentWidth = getComputedStyle(sidebar).width;
    const targetWidth = prompt("Enter tighter sidebar width (e.g., 280px):", currentWidth);
    if (targetWidth === null) return;

    applySidebarStyles(sidebar, targetWidth);
    applyPrimaryPlayerStyles(primary);
    forceVideoPlayerResize();
  }

  function applySidebarStyles(sidebar, targetWidth) {
    sidebar.style.setProperty('width', targetWidth, 'important');
    sidebar.style.setProperty('min-width', targetWidth, 'important');
    sidebar.style.setProperty('max-width', targetWidth, 'important');

    const innerElements = sidebar.querySelectorAll('ytd-compact-video-renderer, ytd-item-section-renderer');
    innerElements.forEach(el => {
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
    });
  }

  function applyPrimaryPlayerStyles(primary) {
    primary.style.setProperty('flex-grow', '1', 'important');
    primary.style.setProperty('max-width', 'none', 'important');

    const watchFlexy = document.querySelector('ytd-watch-flexy');
    if (watchFlexy) {
      watchFlexy.style.setProperty('max-width', '100%', 'important');
      watchFlexy.style.setProperty('width', '100%', 'important');
    }
  }

  function forceVideoPlayerResize() {
    // Target video sizing nodes that lock onto hard pixel values
    const playerSelectors = [
      '#player-container', 
      '.html5-video-container', 
      '.html5-main-video', 
      '#ytd-player'
    ];

    playerSelectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('height', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
    });

    // Force aspect-ratio rules on standard fluid wrappers
    const container = document.querySelector('.html5-video-container');
    if (container) {
      container.style.setProperty('aspect-ratio', '16 / 9', 'important');
    }

    globalThis.dispatchEvent(new Event('resize'));
  }


  // HOME PAGE LOGIC
  function handleHomePageLayout() {
    const videoGrid = document.querySelector('ytd-rich-grid-renderer');
    if (!videoGrid) {
      alert("Make sure you are on the YouTube Home Page grid!");
      return;
    }

    const videoCount = prompt("How many standard videos per row? (e.g., 5 or 6):", "5");
    if (videoCount !== null && !Number.isNaN(videoCount)) {
      videoGrid.style.setProperty('--ytd-rich-grid-items-per-row', videoCount, 'important');
    }

    const shortsCount = prompt("How many Shorts items per row? (e.g., 6 or 8):", "6");
    if (shortsCount !== null && !Number.isNaN(shortsCount)) {
      applyShortsRowStyles(shortsCount);
    }

    expandHomeMainContent();
  }

  function applyShortsRowStyles(shortsCount) {
    const shortsShelves = document.querySelectorAll('ytd-rich-shelf-renderer[is-shorts]');
    shortsShelves.forEach(shelf => {
      shelf.style.setProperty('--ytd-rich-shelf-items-per-row', shortsCount, 'important');
    });
  }

  function expandHomeMainContent() {
    const wrapper = document.querySelector('#content.ytd-page-manager');
    if (wrapper) {
      wrapper.style.setProperty('max-width', '100%', 'important');
      wrapper.style.setProperty('padding', '0 24px', 'important');
    }
    globalThis.dispatchEvent(new Event('resize'));
  }
})();
