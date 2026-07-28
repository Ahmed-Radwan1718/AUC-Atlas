(function () {
  const footerRoot = document.getElementById("site-footer-root");

  if (!footerRoot) {
    return;
  }

  footerRoot.outerHTML = `
<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="site-footer-grid">
      <div class="site-footer-column site-footer-brand">
        <h2>AUC Atlas</h2>
        <p>Course-first academic browsing for AUC students.</p>
      </div>
    </div>

    <div class="site-footer-bottom">
      <p>&copy; 2026 AUC Atlas. All rights reserved.</p>
    </div>
  </div>
</footer>
  `;
})();
