(function () {
  const params = new URLSearchParams(window.location.search);
  let currentRole = params.get("role") === "faculty" ? "faculty" : "student";
  let currentMode = params.get("mode") === "register" ? "register" : "login";
  const reason = params.get("reason");

  const roleLabel = document.querySelector("#login-role-label");
  const loginTitle = document.querySelector("#login-title");
  const loginIntro = document.querySelector("#login-intro");
  const demoLink = document.querySelector("#open-portal-demo");

  const loginForm = document.querySelector("#portal-login-form");
  const loginStatus = document.querySelector("#login-status");
  const loginButton = document.querySelector("#login-submit");

  const registerForm = document.querySelector("#portal-register-form");
  const registerStatus = document.querySelector("#register-status");
  const registerButton = document.querySelector("#register-submit");

  const studentRegFields = document.querySelector("#student-reg-fields");
  const facultyRegFields = document.querySelector("#faculty-reg-fields");

  const roleTabStudent = document.querySelector("#role-tab-student");
  const roleTabFaculty = document.querySelector("#role-tab-faculty");
  const tabLogin = document.querySelector("#tab-login");
  const tabRegister = document.querySelector("#tab-register");

  function setStatus(element, message, isSuccess = false) {
    if (!element) return;
    element.textContent = message || "";
    element.className = `login-status ${isSuccess ? "is-success" : "is-error"}`;
  }

  function updateRoleUI() {
    const isFaculty = currentRole === "faculty";
    roleTabStudent.classList.toggle("is-active", !isFaculty);
    roleTabStudent.setAttribute("aria-selected", String(!isFaculty));
    roleTabFaculty.classList.toggle("is-active", isFaculty);
    roleTabFaculty.setAttribute("aria-selected", String(isFaculty));

    roleLabel.textContent = isFaculty ? "FACULTY PORTAL" : "STUDENT PORTAL";
    demoLink.href = `${currentRole}-portal.html?demo=1`;
    demoLink.textContent = isFaculty ? "Open fictional faculty demo" : "Open fictional student demo";

    studentRegFields.hidden = isFaculty;
    facultyRegFields.hidden = !isFaculty;

    if (currentMode === "login") {
      loginTitle.textContent = isFaculty ? "Faculty sign in" : "Student sign in";
      loginIntro.textContent = isFaculty
        ? "Access the room coordination and lecture scheduling system."
        : "View your verified class schedule, examination venues, and official notices.";
    } else {
      loginTitle.textContent = isFaculty ? "Create faculty profile" : "Create student account";
      loginIntro.textContent = isFaculty
        ? "Register an academic faculty account to request spaces and manage sessions."
        : "Register with your university roll number to sync with your class schedule.";
    }

    registerButton.querySelector(".btn-text").textContent = isFaculty
      ? "Create Faculty Account"
      : "Create Student Account";
  }

  function updateModeUI() {
    const isLogin = currentMode === "login";
    tabLogin.classList.toggle("is-active", isLogin);
    tabLogin.setAttribute("aria-selected", String(isLogin));
    tabRegister.classList.toggle("is-active", !isLogin);
    tabRegister.setAttribute("aria-selected", String(!isLogin));

    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;

    setStatus(loginStatus, "");
    setStatus(registerStatus, "");
    updateRoleUI();
  }

  // Handle Role Switching
  roleTabStudent.addEventListener("click", () => {
    currentRole = "student";
    updateRoleUI();
  });

  roleTabFaculty.addEventListener("click", () => {
    currentRole = "faculty";
    updateRoleUI();
  });

  // Handle Mode Switching
  tabLogin.addEventListener("click", () => {
    currentMode = "login";
    updateModeUI();
  });

  tabRegister.addEventListener("click", () => {
    currentMode = "register";
    updateModeUI();
  });

  // Display initial error reason if present in URL
  if (reason) {
    setStatus(loginStatus, decodeURIComponent(reason));
  }

  // Populate dynamic branches if available
  async function loadBranches() {
    try {
      const branches = await CampusApi.getBranches();
      if (Array.isArray(branches) && branches.length > 0) {
        const studentSelect = document.querySelector("#student-branch-select");
        const facultySelect = document.querySelector("#faculty-dept-select");

        const optionsHtml = branches.map((b) => `<option value="${b.code}">${b.name} (${b.code})</option>`).join("");
        if (studentSelect) studentSelect.innerHTML = optionsHtml;
        if (facultySelect) facultySelect.innerHTML = optionsHtml;
      }
    } catch {
      // Keep static default options on network error or offline demo
    }
  }

  // Auto-check active session
  async function checkExistingSession() {
    try {
      const session = await CampusApi.session();
      if (session?.user?.role) {
        // Redirect directly to correct dashboard
        if (session.user.role === "admin") {
          window.location.href = "admin-portal.html";
        } else {
          window.location.href = `${session.user.role}-portal.html`;
        }
      }
    } catch {
      // No active session; user stays on login screen
    }
  }

  // Sign In Form Submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;

    if (!email || !password) {
      setStatus(loginStatus, "Please provide both email and password.");
      return;
    }

    loginButton.disabled = true;
    setStatus(loginStatus, "Verifying credentials with server…");

    try {
      const result = await CampusApi.login(email, password);
      const user = result.user;

      if (user.role === "admin") {
        setStatus(loginStatus, "Signed in as administrator. Redirecting to admin workspace…", true);
        window.location.href = "admin-portal.html";
        return;
      }

      if (user.role !== currentRole) {
        // User authenticated, but registered role is different.
        // Redirect to their actual role portal per requirement:
        // "Redirect authenticated users to their correct dashboard."
        setStatus(loginStatus, `Signed in as ${user.role}. Redirecting to your dashboard…`, true);
        window.location.href = `${user.role}-portal.html`;
        return;
      }

      setStatus(loginStatus, "Signed in successfully. Redirecting…", true);
      window.location.href = `${currentRole}-portal.html`;
    } catch (error) {
      setStatus(loginStatus, error.message || "Invalid credentials. Please verify your details.");
    } finally {
      loginButton.disabled = false;
    }
  });

  // Registration Form Submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = registerForm.elements.display_name.value.trim();
    const email = registerForm.elements.email.value.trim();
    const password = registerForm.elements.password.value;
    const confirmPassword = registerForm.elements.confirm_password.value;

    if (!displayName || !email || !password) {
      setStatus(registerStatus, "Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setStatus(registerStatus, "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus(registerStatus, "Passwords do not match.");
      return;
    }

    registerButton.disabled = true;
    setStatus(registerStatus, "Creating your campus account…");

    try {
      if (currentRole === "student") {
        const rollNumber = registerForm.elements.roll_number.value.trim();
        const branchCode = registerForm.elements.branch_code.value;
        const academicYear = Number(registerForm.elements.academic_year.value);
        const batchYear = Number(registerForm.elements.batch_year.value);
        const section = registerForm.elements.section.value.trim() || null;

        if (!rollNumber) {
          throw new Error("Student roll number is required.");
        }

        await CampusApi.registerStudent({
          email,
          password,
          display_name: displayName,
          roll_number: rollNumber,
          branch_code: branchCode,
          academic_year: academicYear,
          batch_year: batchYear,
          section,
        });

        setStatus(registerStatus, "Registration complete! Loading student dashboard…", true);
        window.location.href = "student-portal.html";
      } else {
        const departmentCode = registerForm.elements.department_code.value;

        await CampusApi.registerFaculty({
          email,
          password,
          display_name: displayName,
          department_code: departmentCode,
        });

        setStatus(registerStatus, "Registration complete! Loading faculty dashboard…", true);
        window.location.href = "faculty-portal.html";
      }
    } catch (error) {
      setStatus(registerStatus, error.message || "Registration failed. Please check your details.");
      registerButton.disabled = false;
    }
  });

  updateModeUI();
  loadBranches();
  checkExistingSession();
})();
