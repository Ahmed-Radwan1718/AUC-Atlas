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
  <a href="index.html" class="site-header-logo"><span class="site-header-logo-accent">AUC</span> Atlas</a>

  <nav class="site-header-nav" aria-label="Main navigation">
    <a href="courses.html"${activeAttribute("courses.html")}>Courses</a>
    <a href="professors.html"${activeAttribute("professors.html")}>Professors</a>
    <a href="index.html#contribute">Contribute</a>
  </nav>

  <div class="site-header-actions">
    <div class="site-header-account" id="site-header-account">
      <button class="site-header-user-icon" id="site-header-account-button" type="button" aria-label="Open account menu" aria-expanded="false">
        <img src="user.png" alt="" id="site-header-account-photo">
      </button>

      <div class="site-header-account-menu" id="site-header-account-menu" hidden>
        <a href="login.html" class="site-header-account-link" id="site-header-login-link">Login</a>
        <a href="account.html" class="site-header-account-link" id="site-header-account-link" hidden>Account</a>
        <button class="site-header-account-link site-header-logout-button" id="site-header-logout-button" type="button" hidden>Log out</button>
      </div>
    </div>
  </div>
</header>
`;

  const accountWidget = document.getElementById("site-header-account");
  const accountButton = document.getElementById("site-header-account-button");
  const accountPhoto = document.getElementById("site-header-account-photo");
  const accountMenu = document.getElementById("site-header-account-menu");
  const loginLink = document.getElementById("site-header-login-link");
  const accountLink = document.getElementById("site-header-account-link");
  const logoutButton = document.getElementById("site-header-logout-button");

  if (accountWidget && accountButton && accountPhoto && accountMenu && loginLink && accountLink && logoutButton) {
    function setAccountMenu(open) {
      accountMenu.hidden = !open;
      accountButton.setAttribute("aria-expanded", String(open));
    }

    function setAccountPhoto(photoURL) {
      const safePhotoURL = String(photoURL || "").trim();

      if (safePhotoURL) {
        accountPhoto.src = safePhotoURL;
        accountPhoto.alt = "Account profile photo";
        accountPhoto.classList.add("has-profile-photo");
        return;
      }

      accountPhoto.src = "user.png";
      accountPhoto.alt = "";
      accountPhoto.classList.remove("has-profile-photo");
    }

    function showLoggedOutAccountState() {
      loginLink.hidden = false;
      accountLink.hidden = true;
      logoutButton.hidden = true;
      logoutButton.disabled = false;
      logoutButton.textContent = "Log out";
      setAccountPhoto("");
    }

    function showLoggedInAccountState(user) {
      loginLink.hidden = true;
      accountLink.hidden = false;
      logoutButton.hidden = false;
      logoutButton.disabled = false;
      logoutButton.textContent = "Log out";
      setAccountPhoto(user && user.photoURL ? user.photoURL : "");
    }

    async function logoutServerSession() {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }).catch(function () {});
    }

    async function loadAccountHeaderState() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (response.ok && data.sessionRevoked) {
          await logoutServerSession();
          showLoggedOutAccountState();
          return;
        }

        if (response.ok && (data.loggedIn || data.signedIn || data.authenticated) && data.user) {
          showLoggedInAccountState(data.user);
          return;
        }
      } catch (error) {}

      showLoggedOutAccountState();
    }

    accountButton.addEventListener("click", function (event) {
      event.stopPropagation();
      setAccountMenu(accountMenu.hidden);
    });

    loginLink.addEventListener("click", function () {
      setAccountMenu(false);
    });

    accountLink.addEventListener("click", function () {
      setAccountMenu(false);
    });

    logoutButton.addEventListener("click", async function () {
      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      await logoutServerSession();

      setAccountMenu(false);
      showLoggedOutAccountState();
      window.location.href = "login.html";
    });

    document.addEventListener("click", function (event) {
      if (!accountWidget.contains(event.target)) {
        setAccountMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setAccountMenu(false);
      }
    });

    loadAccountHeaderState();
  }
})();
