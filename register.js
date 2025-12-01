const API_URL = "https://gestor-de-tareas-pro.onrender.com";
const formRegister = document.getElementById("form-register");
const inputNombre = document.getElementById("reg-nombre");
const inputEmail = document.getElementById("reg-email");
const inputPass = document.getElementById("reg-pass");
const regMensaje = document.getElementById("reg-mensaje");

// si ya hay token, mando directo al gestor
if (localStorage.getItem("token")) {
    window.location.href = "index.html";
}

formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    regMensaje.textContent = "";
    regMensaje.style.color = "#c0392b";

    const nombre = inputNombre.value.trim();
    const email = inputEmail.value.trim();
    const password = inputPass.value.trim();

    if (!nombre || !email || !password) {
        regMensaje.textContent = "Completa todos los campos.";
        return;
    }

    if (password.length < 6) {
        regMensaje.textContent = "La contraseña debe tener al menos 6 caracteres.";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                email,
                password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            regMensaje.textContent = data.error || "Error al registrar usuario.";
            return;
        }

        regMensaje.style.color = "#27ae60";
        regMensaje.textContent = "Usuario creado correctamente. Redirigiendo...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        
    } catch (error) {
        regMensaje.textContent = "Error de conexión con el servidor.";
    }
});