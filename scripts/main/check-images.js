(function () {
  const existing = document.getElementById('image-checker-overlay');
  if (existing) {
    existing.remove();
    document.removeEventListener('keydown', window.handleImageAuditEsc);
  }

  const detectedAssets = [];
  const seenPaths = new Set();
  const videoExtensions = /\.(mp4|webm|ogg|mov|m4v)$/i;
  
  const damPrefix = "https://prod-cloud-author.aem.ibm.net/assetdetails.html";
  
  const blockedDomains = [
    'bat.bing.com',
    'videoamp.com',
    'google-analytics.com',
    'doubleclick.net',
    'facebook.com/tr',
    't.co'
  ];

  function processElement(el, type) {
    if (el.closest('#image-checker-overlay') || el.id === 'floating-zoom-container') return;

    let src = '';
    let alt = '';

    if (el.tagName === 'IMG') {
      src = el.currentSrc || el.src || el.getAttribute('data-src');
      alt = el.getAttribute('alt');
    } else {
      const bgImg = window.getComputedStyle(el).backgroundImage;
      const match = bgImg.match(/url\(["']?([^"']+)["']?\)/);
      src = match ? match[1] : '';
      alt = el.getAttribute('aria-label') || '[CSS Background]';
    }

    const isBlocked = blockedDomains.some(domain => src.includes(domain));

    if (src && src.startsWith('http') && !videoExtensions.test(src.split('?')[0]) && !isBlocked) {
      try {
        const urlObj = new URL(src);
        const cleanPath = urlObj.pathname;
        
        if (!seenPaths.has(cleanPath)) {
          seenPaths.add(cleanPath);

          let damLink = src;
          if (cleanPath.includes('/content/dam/')) {
              damLink = `${damPrefix}${cleanPath}`;
          }

          detectedAssets.push({
            previewUrl: src,
            damUrl: damLink,
            alt: (alt && alt.trim() !== "") ? alt : null,
            type: type
          });
        }
      } catch (e) {}
    }
  }

  function findImages(root) {
    root.querySelectorAll('img').forEach(img => processElement(img, 'Img Tag'));
    root.querySelectorAll('*').forEach(el => {
      if (['VIDEO', 'SCRIPT', 'STYLE'].includes(el.tagName)) return;
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') processElement(el, 'CSS BG');
      if (el.shadowRoot) findImages(el.shadowRoot);
    });
  }

  findImages(document);

  const overlay = document.createElement('div');
  overlay.id = 'image-checker-overlay';
  overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:2147483647; display:flex; align-items:center; justify-content:center; font-family:sans-serif;";

  const container = document.createElement('div');
  container.style = "background:#fff; width:85%; max-width:1100px; height:85vh; border-radius:12px; display:flex; flex-direction:column; box-shadow:0 10px 40px rgba(0,0,0,0.4); overflow:hidden;";

  const header = document.createElement('div');
  header.style = "padding:15px 25px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f9f9f9;";
  header.innerHTML = `
    <div style="display:flex; align-items:baseline; gap:10px;">
      <h3 style="margin:0; font-size:1.1rem; color:#161616;">AEM Image Audit</h3>
      <span style="font-size:0.75rem; color:#6f6f6f;">${detectedAssets.length} assets</span>
    </div>
    <button id="close-img-checker" style="cursor:pointer; background:#161616; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-weight:500;">Close (esc)</button>
  `;

  const scrollArea = document.createElement('div');
  scrollArea.style = "flex:1; overflow-y:auto; padding:20px 25px;";

  const grid = document.createElement('div');
  grid.style = "display:flex; flex-direction:column; gap:12px;";

  detectedAssets.forEach(item => {
    const isError = !item.alt || item.alt === '[CSS Background]';
    const card = document.createElement('div');
    card.style = "display:grid; grid-template-columns:240px 1fr 100px; background:#fff; border:1px solid #e8e8e8; border-radius:8px; overflow:hidden; min-height:140px; position:relative;";
    
    card.innerHTML = `
      <div class="zoom-trigger" style="background:#f4f4f4; display:flex; align-items:center; justify-content:center; padding:12px; border-right:1px solid #eee; cursor:pointer;">
        <img src="${item.previewUrl}" style="max-width:100%; max-height:140px; object-fit:contain; pointer-events:none;">
      </div>
      <div style="padding:15px 20px; display:flex; flex-direction:column; justify-content:center; min-width:0;">
        <div style="font-size:0.6rem; color:#999; text-transform:uppercase; margin-bottom:4px; font-weight:bold;">${item.type}</div>
        <div style="font-size:1rem; color:${isError ? '#da1e28' : '#24a148'}; font-weight:500; margin-bottom:12px; word-break:break-word;">
          ${item.alt || '[Missing Alt Text]'}
        </div>
        <a href="${item.damUrl}" target="_blank" style="font-size:0.75rem; color:#0f62fe; text-decoration:none; word-break:break-all; font-family:monospace; display:inline-block; width:fit-content; max-width:100%; overflow:hidden; text-overflow:ellipsis;">
          ${item.damUrl}
        </a>
      </div>
      <div style="display:flex; align-items:center; justify-content:center; border-left:1px solid #eee; font-size:0.75rem; font-weight:bold; color:${isError ? '#da1e28' : '#24a148'}; background:#fafafa; text-align:center;">
        ${isError ? 'REVIEW' : 'OK'}
      </div>
    `;

    const trigger = card.querySelector('.zoom-trigger');
    trigger.onmouseenter = () => {
      const zoom = document.createElement('div');
      zoom.id = 'floating-zoom-container';
      zoom.style = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2147483648; background:#fff; padding:15px; border-radius:8px; box-shadow:0 20px 60px rgba(0,0,0,0.7); display:flex; flex-direction:column; align-items:center; max-width:650px; pointer-events:none; border:1px solid #ddd;`;
      zoom.innerHTML = `
        <img src="${item.previewUrl}" style="max-width:100%; max-height:400px; object-fit:contain; border-radius:4px;">
        <div style="margin-top:15px; padding:12px; background:#f4f4f4; width:100%; border-radius:4px; box-sizing:border-box; text-align:center;">
          <div style="font-size: 0.65rem; color: #888; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; text-align: center;">Alt-Text Content:</div>
          <div style="font-size: 0.95rem; color: ${isError ? '#da1e28' : '#24a148'}; font-weight: 500; line-height: 1.4; text-align: center; word-break: break-word;">
            ${item.alt || '[Missing Alt Text]'}
          </div>
        </div>`;
      document.body.appendChild(zoom);
    };

    trigger.onmouseleave = () => {
      const zoom = document.getElementById('floating-zoom-container');
      if (zoom) zoom.remove();
    };

    grid.appendChild(card);
  });

  scrollArea.appendChild(grid);
  container.appendChild(header);
  container.appendChild(scrollArea);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const closePanel = () => {
    overlay.remove();
    const zoom = document.getElementById('floating-zoom-container');
    if (zoom) zoom.remove();
    document.removeEventListener('keydown', window.handleImageAuditEsc);
  };

  document.getElementById('close-img-checker').onclick = closePanel;
  window.handleImageAuditEsc = (e) => { if (e.key === 'Escape') closePanel(); };
  document.addEventListener('keydown', window.handleImageAuditEsc);
})();