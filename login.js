const formLogin = document.getElementById("form-login");
const API_URL = "https://gestor-de-tareas-pro.onrender.com";
const emailInput = document.getElementById("login-email");
const passInput = document.getElementById("login-pass");
const errorBox = document.getElementById("login-error");

// Si ya hay token, va directo al gestor
if (localStorage.getItem("token")) {
    window.location.href = "index.html";
}

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorBox.textContent = "";
    errorBox.style.color = "#e74c3c";

    const email = emailInput.value.trim().toLowerCase();
    const password = passInput.value.trim();

    if (!email || !password) {
        errorBox.textContent = "Completá todos los campos.";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorBox.textContent = data.error || "Error al iniciar sesión.";
            return;
        }

        // Guardar token en localStorage
        localStorage.setItem("token", data.token);

        // Redirigir al gestor
        window.location.href = "index.html"; // nombre de tu html principal
        
    } catch (error) {
        errorBox.textContent = "Error de conexión con el servidor.";
    }
});