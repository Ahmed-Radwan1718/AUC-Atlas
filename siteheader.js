(function () {
  const headerRoot = document.getElementById("site-header-root");

  if (!headerRoot) {
    return;
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function activeAttribute(pageName) {
    return currentPage === pageName ? ' aria-current="page"' : "";
  }

  headerRoot.outerHTML = `
<header class="site-header">
  <a href="index.html" class="site-header-logo">AUC Atlas</a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="courses.html"${activeAttribute("courses.html")}>Courses</a>
    <a href="professors.html"${activeAttribute("professors.html")}>Professors</a>
    <a href="index.html#contribute">Contribute</a>
  </nav>

  <div class="site-header-actions">
    <a href="index.html" class="site-header-action"${activeAttribute("index.html")}>Home</a>
  </div>
</header>
`;
})();
