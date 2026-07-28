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

      <div class="site-footer-column">
        <h3>Explore</h3>
        <ul class="site-footer-links">
          <li><a href="courses.html">Courses</a></li>
          <li><a href="professors.html">Professors</a></li>
          <li><a href="index.html#contribute">Contribute</a></li>
        </ul>
      </div>

      <div class="site-footer-column">
        <h3>Account</h3>
        <ul class="site-footer-links">
          <li><a href="login.html">Login</a></li>
          <li><a href="signup.html">Create Account</a></li>
          <li><a href="account.html">My Account</a></li>
        </ul>
      </div>
    </div>

    <div class="site-footer-bottom">
      <p>&copy; 2026 AUC Atlas. All rights reserved.</p>
    </div>
  </div>
</footer>
  `;
})();
