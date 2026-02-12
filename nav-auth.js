// Adjusts the navigation bar based on teacher login state.
// Include this script on every page, after the <nav> element.
(function () {
  var loggedIn = !!localStorage.getItem("teacherEmail");
  var nav = document.querySelector("nav");
  if (!nav) return;

  var links = nav.querySelectorAll("a");
  links.forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (loggedIn && (href.includes("teacher-login") || href.includes("teacher-signup"))) {
      a.style.display = "none";
    }
  });

  if (loggedIn) {
    var logout = document.createElement("a");
    logout.href = "#";
    logout.textContent = "Log Out";
    logout.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("teacherEmail");
      window.location.href = "index.html";
    });
    nav.appendChild(logout);
  }
})();
