(function () {
  const professors = [
    { name: "Eslam Badr", department: "Computer Science", status: "No ratings yet", course: "CSCE 1101", group: "A-F", bio: "Eslam Badr earned his PhD from UAB before joining AUC. His work focuses on algebraic geometry and arithmetic, including plane curves, moduli spaces, automorphism groups, twisting theory, quadratic points, and Weierstrass points.", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785248610/ChatGPT_Image_Jul_28_2026_05_23_19_PM_xfec1d.png" },
    { name: "Ehab ElSawy", department: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "A-F", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249148/Ehab_ElSawy_ifg2np.png" },
    { name: "Nageh Allam", department: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249240/Nageh_Allam_wfaser.png" },
    { name: "Tamer Shoeib", department: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785249461/Tamer_Shoeib_qmcccs.png" },
    { name: "Hassan Azazy", department: "Sciences", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785286932/Hassan_Azazy_frfg0s.png" },
    { name: "Ibrahim Abotaleb", department: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785287149/Ibrahim_Abotaleb_awad4c.png" },
    { name: "Arthur Bos", department: "Business", status: "No ratings yet", course: "CSCE 1101", group: "A-F", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288244/Arthur_Bos_tegujk.png" },
    { name: "Walid Fouad", department: "Business", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288250/Walid_Fouad_khxyvf.png" },
    { name: "Mohamed Badran", department: "Engineering", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288787/Mohamed_Badran_ssh771.png" },
    { name: "Ahmed Abdellatif", department: "Business", status: "No ratings yet", course: "CSCE 1101", group: "A-F", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785288910/Ahmed_Abdellatif_elvz21.png" },
    { name: "Wafik Lotfallah", department: "Business", status: "No ratings yet", course: "CSCE 1101", group: "N-Z", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785326069/Wafik_Lotfallah_to4w8v.png" },
    { name: "Laila ElSerty", department: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344850/Laila_ElSerty_gf6bkr.png" },
    { name: "Mariah Fairley", department: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Mariah_Fairley_h9ykwv.png" },
    { name: "Gretchen McCullough", department: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344851/Gretchen_McCullough_ktotfl.png" },
    { name: "Kathleen Saville", department: "Rhetoric & Writing", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Kathleen_Saville_hz1cgi.png" },
    { name: "Iman Baza", department: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Iman_Baza_ohxkad.png" },
    { name: "Fikry Boutros", department: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "A-F", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344856/Fikry_Boutros_gbqnkt.png" },
    { name: "Alexander Lewko", department: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "A-F", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344860/Alexander_Lewko_dexjfc.png" },
    { name: "Mariam Osman", department: "Humanities", status: "No ratings yet", course: "CSCE 1101", group: "G-M", image: "https://res.cloudinary.com/hpsuzs6q/image/upload/v1785344867/Mariam_Osman_rmlqxj.png" }
  ];

  const style = document.createElement("style");
  style.textContent = `
    .professors-browser {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }

    .filters-panel {
      position: sticky;
      top: 120px;
      padding: 14px;
      border-radius: 26px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 22px 55px rgba(42, 32, 20, 0.1);
      display: grid;
      gap: 8px;
    }

    .filters-heading {
      padding: 10px 14px 6px;
      color: rgba(192, 154, 92, 0.84);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .filter-toggle {
      width: 100%;
      min-height: 48px;
      padding: 0 16px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: rgba(23, 23, 23, 0.62);
      font-family: inherit;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .filter-toggle:hover,
    .filter-item.open .filter-toggle {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .chevron {
      width: 9px;
      height: 9px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg);
      transition: transform 0.2s ease;
      font-size: 0;
    }

    .filter-content {
      display: grid;
      gap: 8px;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      padding: 0 8px;
      transition: max-height 0.42s ease, opacity 0.28s ease, padding 0.42s ease;
    }

    .filter-item.open .filter-content {
      max-height: 560px;
      opacity: 1;
      padding: 10px 8px 12px;
    }

    .filter-item.open .chevron {
      transform: rotate(225deg);
    }

    .filter-content label {
      position: relative;
      min-height: 40px;
      padding: 0 12px 0 22px;
      border-radius: 14px;
      color: rgba(23, 23, 23, 0.62);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .filter-content input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .filter-content label:hover,
    .filter-content label:has(input:checked) {
      background: rgba(192, 154, 92, 0.12);
      color: #171717;
    }

    .professors-search-box {
      margin-bottom: 18px;
    }

    .professors-search-box input {
      width: 100%;
      min-height: 52px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.78);
      color: #171717;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      outline: none;
    }

    .professors-search-box input:focus {
      border-color: rgba(192, 154, 92, 0.58);
      box-shadow: 0 0 0 4px rgba(192, 154, 92, 0.12);
    }

    .professors-result-count {
      margin-bottom: 18px;
      color: rgba(23, 23, 23, 0.58);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .professors-empty {
      padding: 28px;
      border-radius: 24px;
      border: 1px solid rgba(23, 23, 23, 0.1);
      background: rgba(255, 255, 255, 0.72);
      color: rgba(23, 23, 23, 0.62);
      font-size: 15px;
      font-weight: 700;
    }

    @media (max-width: 980px) {
      .professors-browser {
        grid-template-columns: 1fr;
      }

      .filters-panel {
        position: static;
      }
    }
  `;
  document.head.appendChild(style);

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function getCheckedValues(group) {
    return Array.from(document.querySelectorAll('[data-filter-group="' + group + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function professorMatches(professor) {
    const query = normalize(document.getElementById("professor-search-input").value);
    const departments = getCheckedValues("department");
    const statuses = getCheckedValues("status");
    const groups = getCheckedValues("group");

    const searchableText = normalize([professor.name, professor.department, professor.status, professor.course, professor.bio, professor.group].join(" "));
    const matchesSearch = !query || searchableText.includes(query);
    const matchesDepartment = !departments.length || departments.includes(professor.department);
    const matchesStatus = !statuses.length || statuses.includes(professor.status);
    const matchesGroup = !groups.length || groups.includes(professor.group);

    return matchesSearch && matchesDepartment && matchesStatus && matchesGroup;
  }

  function renderProfessors() {
    const grid = document.getElementById("professors-grid");
    const visibleProfessors = professors.filter(professorMatches);

    grid.innerHTML = visibleProfessors.map(function (professor) {
      return `
        <article class="professor-card">
          <div class="professor-card-image">
            <img src="${professor.image}" alt="${professor.name}">
          </div>
          <div class="professor-card-body">
            <h2>${professor.name}</h2>
            <div class="professor-meta">
              <span>${professor.department}</span>
              <span>${professor.reviewCount || 0} ${(professor.reviewCount || 0) === 1 ? "Review" : "Reviews"}</span>
              <span>${professor.averageStars || "No Stars Yet"}</span>
            </div>
            <p class="professor-bio">${professor.bio || "Bio coming soon."}</p>
          </div>
        </article>
      `;
    }).join("");

    if (!visibleProfessors.length) {
      grid.innerHTML = '<p class="professors-empty">No professors match those filters.</p>';
    }
  }

  function setupProfessorFilters() {
    document.querySelectorAll(".filter-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        button.closest(".filter-item").classList.toggle("open");
      });
    });

    document.querySelectorAll("#professor-filters input").forEach(function (input) {
      input.addEventListener("change", renderProfessors);
    });

    document.getElementById("professor-search-input").addEventListener("input", renderProfessors);
    renderProfessors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupProfessorFilters);
  } else {
    setupProfessorFilters();
  }
})();
