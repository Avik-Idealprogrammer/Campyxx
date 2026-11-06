const form = document.querySelector("#admin-login-form");
const status = document.querySelector("#admin-login-status");
const submitButton = document.querySelector("#admin-login-submit");

const params = new URLSearchParams(window.location.search);
const reason = params.get("reason");
if (reason && status) {
  status.textContent = decodeURIComponent(reason);
}

// Auto-check existing session
(async function checkExistingAdminSession() {
  try {
    const session = await CampusApi.session();
    if (session?.user?.role === "admin") {
      window.location.href = "../../admin-portal.html";
    }
  } catch {
    // No active session
  }
})();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submitButton.disabled = true;
  status.textContent = "Verifying administrator account…";
  try {
    const result = await CampusApi.login(form.elements.email.value.trim(), form.elements.password.value);
    if (result.user.role !== "admin") {
      await CampusApi.logout();
      throw new Error("This account does not have administrator privileges.");
    }
    status.textContent = "Authorized. Loading administrative workspace…";
    window.location.href = "../../admin-portal.html";
  } catch (error) {
    status.textContent = error.message || "Sign-in failed. Check your connection and account details.";
  } finally {
    submitButton.disabled = false;
  }
});
