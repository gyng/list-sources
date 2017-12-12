(function listSources() {
  const getSource = el => {
    if (el.src || el.currentSrc) {
      const source = document.createElement("source");
      source.src = el.src || el.currentSrc;
      return [source];
    }

    const sources = el.querySelectorAll("source");
    return sources;
  };

  const getMediaSources = els => {
    if (!els) {
      return [];
    }

    let sources = [];
    els.forEach(el => {
      sources = sources.concat({
        el,
        sources: getSource(el)
      });
    });
    return sources;
  };

  const getImgSources = els => {
    const sources = [];

    els.forEach(el => {
      const inlineStyle = el.style && el.style.backgroundImage;
      let computedStyle = window.getComputedStyle(el, false).backgroundImage;

      computedStyle = computedStyle === "none" ? null : computedStyle;
      let background = inlineStyle || computedStyle;
      if (background && background.startsWith("url(")) {
        background = background.replace(/(url\("?|"?\).*)/g, "");
      } else {
        background = null;
      }

      if (el.tagName.toLowerCase() === "img") {
        sources.push({
          el,
          sources: [{ src: el.src }]
        });
      } else if (background && background !== "none") {
        sources.push({
          el,
          sources: [{ src: background.replace(/(url\("?|"?\).*)/g, "") }]
        });
      }
    });

    return sources;
  };

  const audio = document.querySelectorAll("audio");
  const video = document.querySelectorAll("video");
  const all = document.querySelectorAll("*");

  const allSources = {
    audio: getMediaSources(audio),
    video: getMediaSources(video),
    image: getImgSources(all)
  };

  const list = document.createElement("div");
  list.style = `
    text-wrap: none;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
  `;

  const seen = {};

  const createRows = (sources, type) => {
    const row = document.createElement("div");

    const colors = {
      img: "#45a1ff",
      audio: "#30e60b",
      video: "#ff0039",
      scanned: "cyan"
    };

    row.style = `
      width: 100%;
      display: flex;
      flex-direction: column;
      flex-align: flex-start;
      margin: 4px 0;
    `;

    sources.sources.forEach(s => {
      if (seen[s.src]) {
        return;
      }

      seen[s.src] = true;

      const preview = document.createElement(type);
      const thumb = document.createElement(type);

      preview.setAttribute("preload", "metadata");
      preview.setAttribute("controls", "controls");
      thumb.setAttribute("preload", "metadata");
      thumb.removeAttribute("controls");

      thumb.style = `
        height: 32px;
        width: 32px;
        min-height: 32px;
        min-width: 32px;
        object-fit: contain;
        margin: 0 4px;
      `;

      preview.style = "display: none;";
      if (type === "audio" || type === "video") {
        const source = s.cloneNode ? s : document.createElement("source");
        if (!s.cloneNode) {
          source.src = s.src;
        }

        preview.appendChild(source.cloneNode());

        if (Object.keys(seen).length < 150) {
          thumb.appendChild(source.cloneNode());
        }
      } else {
        preview.setAttribute("src", s.src);

        if (Object.keys(seen).length < 150) {
          thumb.setAttribute("src", s.src);
        }
      }

      const link = document.createElement("div");
      link.style = `
        width: 100%;
        white-space: nowrap;
        margin: 0;
        display: flex;
        flex-direction: row;
        font-size: 13px;
        font-family: Segoe UI, San Francisco, sans-serif;
        font-height: 1;
      `;

      const linkText = document.createElement("a");
      linkText.style = `
        display: flex;
        flex-direction: column;
        text-decoration: none;
        margin-left: 4px;
        color: #0060df !important;
      `;
      linkText.target = "_blank";
      linkText.title = s.src;
      linkText.href = s.src;
      linkText.textContent = s.src;

      const toolRow = document.createElement("div");
      toolRow.style = `
        display: flex;
        flex-direction: row;
      `;

      const linkMetadata = document.createElement("div");
      linkMetadata.style = `
        color: #737373 !important;
      `;

      const scrollIntoView = document.createElement("div");
      scrollIntoView.style = `
        margin-right: 4px;
        pointer: cursor;
      `;
      scrollIntoView.textContent = "👁";
      scrollIntoView.onclick = e => {
        e.preventDefault();
        sources.el.scrollIntoView({ behavior: "smooth" });
      };

      const downloadLink = document.createElement("a");
      downloadLink.style = `
        margin-right: 4px;
        pointer: cursor;
      `;
      downloadLink.textContent = "💾";
      downloadLink.setAttribute("href", s.src);
      downloadLink.setAttribute("download", s.src);
      downloadLink.setAttribute("target", "_blank");
      downloadLink.onclick = e => {
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: "download",
          src: s.src
        });
        return null;
      };

      toolRow.appendChild(scrollIntoView);
      toolRow.appendChild(downloadLink);
      toolRow.appendChild(linkMetadata);
      linkText.appendChild(toolRow);
      link.appendChild(linkText);

      link.addEventListener("mouseover", e => {
        preview.style = `
          position: absolute;
          left: -320px;
          top: ${e.clientY}px;
          bottom: unset;
          right: unset;
          width: 340px;
          height: 200px;
          padding: 10px;
          object-fit: contain;
          border: solid 1px ${colors[type]};
          background-color: #222222;
          box-shadow: -4px 0 16px #0c0c0d16;
          opacity: 1;
        `;
        // It's ok to dirty the page
        sources.el.style.transitionTimingFunction = "ease-in"; // eslint-disable-line
        sources.el.style.transition = "all 0.1s"; // eslint-disable-line
        sources.el.style.outline = "5px solid #ff0039"; // eslint-disable-line
        sources.el.style.outlineOffset = "-5px"; // eslint-disable-line

        if (preview.play) {
          preview.setAttribute("controls", true);
          preview.play();
        }
      });

      link.addEventListener("mouseout", () => {
        preview.style = "display: none;";
        sources.el.style.outline = "unset"; // eslint-disable-line

        if (preview.pause) {
          preview.removeAttribute("controls");
          preview.pause();
        }
      });

      if (type !== "img") {
        thumb.onloadedmetadata = m => {
          if (!m || !m.target) {
            return;
          }

          let text = m.target.duration
            ? `${Math.round(m.target.duration)}s`
            : "";

          text = m.target.videoHeight
            ? `${text} · ${m.target.videoWidth}×${m.target.videoHeight}`
            : text;

          if (m && m.target && m.target.duration) {
            linkMetadata.textContent = text;
          }
        };
      } else {
        thumb.onload = m => {
          linkMetadata.textContent = `${m.target.naturalWidth}×${
            m.target.naturalHeight
          }`;
        };
      }

      const decorator = document.createElement("div");
      decorator.textContent = " ";
      decorator.style = `
        border: solid 2px ${colors[type] || "black"};
        border-radius: 2px;
        margin: 0 4px;
      `;

      link.prepend(thumb);
      link.prepend(decorator);
      link.appendChild(preview);
      row.appendChild(link);
    });

    if (row.children.length === 0) {
      return document.createElement("span");
    }

    return row;
  };

  const createSection = (name, sources, type) => {
    if (type !== "scanned" && (!sources || sources.length === 0)) {
      return document.createElement("div");
    }

    const section = document.createElement("div");
    const heading = document.createElement("div");
    heading.textContent = name;
    heading.style = `
      font-family: Segoe UI, San Francisco, sans-serif;
      font-size: 17px;
      font-weight: 700;
      margin: 12px 0 8px;
      color: #0c0c0d !important;
    `;
    section.appendChild(heading);
    section.id = `__list-sources-${type}`;

    const rows = sources.map(s => createRows(s, type));
    rows.forEach(r => {
      section.appendChild(r);
    });
    return section;
  };

  list.appendChild(createSection("🔎 Scanned", [], "scanned"));
  list.appendChild(createSection("🎥 Videos", allSources.video, "video"));
  list.appendChild(createSection("📻 Audio", allSources.audio, "audio"));
  list.appendChild(createSection("📷 Images", allSources.image, "img"));

  const container = document.createElement("div");
  container.className = "__list-sources-container";
  container.style = `
    z-index: 99999999;
    position: fixed;
    top: 0;
    right: 0;
    width: 40vw;
    max-width: 1024px;
    height: 100vh;
    box-shadow: -4px 0 16px #0c0c0d16;
    background-color: #ededf0;
    padding: 12px 0 0 12px;
  `;
  container.appendChild(list);

  document.body.appendChild(container);

  chrome.runtime.onMessage.addListener(request => {
    if (!seen[request.url]) {
      const scanned = document.querySelector("#__list-sources-scanned");
      const rows = createRows(
        { el: document.body, sources: [{ src: request.info.url }] },
        request.type
      );
      scanned.appendChild(rows);
    }
  });
})();
