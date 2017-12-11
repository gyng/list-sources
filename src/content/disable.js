(function disable() {
  const containers = document.querySelectorAll(".__list-sources-container");

  if (containers) {
    containers.forEach(c => {
      c.parentNode.removeChild(c);
    });
  }
}());
