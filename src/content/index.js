(function listSources() {
  const getSource = el => {
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
      if (
        background &&
        (background.startsWith("url(data:image") ||
          background.startsWith('url("data:image'))
      ) {
        background = background.replace(/(url\("?|"?\).*)/g, "");
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
  list.style = "text-wrap: none;";

  const seen = {};

  const createRows = (sources, type) => {
    const row = document.createElement("div");

    const colors = {
      img: "#45a1ff",
      audio: "#30e60b",
      video: "#ff0039"
    };

    row.style = `
      width: 100%;
      display: flex;
      flex-direction: column;
      flex-align: flex-start;
      margin: 4px 0;
      border-left: solid 4px ${colors[type]};
    `;

    sources.sources.forEach(s => {
      if (seen[s.src]) {
        return;
      }

      seen[s.src] = true;
      const preview = document.createElement(type);
      preview.setAttribute("preload", "none");
      preview.style = "display: none;";
      if (type === "audio" || type === "video") {
        preview.appendChild(s);
      } else {
        preview.setAttribute("src", s.src);
      }

      const link = document.createElement("a");
      const linkStyle = `
        width: 100%;
        white-space: nowrap;
        margin: 2px;
        display: flex;
        flex-direction: column;
        font-size: 13px;
        font-family: Segoe UI, San Francisco, sans-serif;
        font-height: 1;
        max-height: 30vh;
      `;

      link.style = linkStyle;
      link.target = "_blank";
      link.title = s.src;
      link.href = s.src;
      link.textContent = s.src;

      link.addEventListener("mouseover", () => {
        preview.style = `
        display: unset;
        align-self: flex-start;
        max-width: 100%;
        border: solid 1px ${colors[type]}
      `;
        sources.el.style.outline = "5px solid #ff0039"; // eslint-disable-line

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

      link.appendChild(preview);
      row.appendChild(link);
    });

    if (row.children.length === 0) {
      return document.createElement("span");
    }

    return row;
  };

  const createSection = (name, sources, type) => {
    if (!sources || sources.length === 0) {
      return document.createElement("div");
    }

    const section = document.createElement("div");
    const heading = document.createElement("div");
    heading.textContent = name;
    heading.style =
      "font-family: Segoe UI, San Francisco, sans-serif; font-size: 17px; font-weight: 700; margin: 12px 0 8px;";
    section.appendChild(heading);
    const rows = sources.map(s => createRows(s, type));
    rows.forEach(r => {
      section.appendChild(r);
    });
    return section;
  };

  list.appendChild(createSection("🎥 Videos", allSources.video, "video"));
  list.appendChild(createSection("📻 Audio", allSources.audio, "audio"));
  list.appendChild(createSection("🖼 Images", allSources.image, "img"));

  const container = document.createElement("div");
  container.id = "__list-sources-container";
  container.style = `
  z-index: 9999999;
  position: fixed;
  top: 0;
  right: 0;
  width: 40vw;
  max-width: 1024px;
  height: 100vh;
  box-shadow: -4px 0 16px #0c0c0d16;
  overflow: scroll;
  background-color: #ededf0;
  padding: 12px 0 0 12px;
`;
  container.appendChild(list);

  document.body.appendChild(container);
})();
