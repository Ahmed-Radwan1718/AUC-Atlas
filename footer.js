(function () {
  const footerRoot = document.getElementById("site-footer-root");

  if (!footerRoot) {
    return;
  }

  footerRoot.outerHTML = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-brand">
          <a href="index.html" class="site-footer-logo">AUC Atlas</a>
          <p>Course-first academic browsing for AUC students. Find the class, then compare professors, materials, and reviews in the right context.</p>
        </div>
      </div>

      <div class="site-footer-bottom">
        <span>AUC Atlas</span>
        <span>Built for clearer course decisions.</span>
      </div>
    </footer>
  `;
})();
