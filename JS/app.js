const lista = document.getElementById("lista-tareas");
const API_URL = "https://gestor-de-tareas-pro.onrender.com";
const form = document.getElementById("form-tarea");
const buscador = document.getElementById("buscador");
const btnBorrarCompletadas = document.getElementById("btn-borrar-completadas");
const filtroBtns = document.querySelectorAll(".filtro-btn");
const btnLogout = document.getElementById("btn-logout");


// Modal edición
const modal = document.getElementById("modal-editar");
const formEditar = document.getElementById("form-editar");
const inputEditarTitulo = document.getElementById("editar-titulo");
const inputEditarDescripcion = document.getElementById("editar-descripcion");
const inputEditarPrioridad = document.getElementById("editar-prioridad");
const inputEditarCompletada = document.getElementById("editar-completada");
const btnCerrarModal = document.getElementById("btn-cerrar-modal");

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html"; // Si no hay token, mando al login
}

// Estado en memoria
let tareasGlobal = [];
let filtroActual = { texto: "", prioridad: "Todas" };
let tareaEditando = null;
let idArrastrando = null;

// ====================
// FORMATEAR FECHA
// ====================
function formatearFecha(fecha) {
    const d = new Date(fecha);
    return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ====================
// LOGOUT
// ====================

if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
}

// 🔵 1. Cargar tareas al iniciar
if (token) {
    obtenerTareas();
}
// ---------- funciones principales ----------

async function obtenerTareas() {
    try {
        const res = await fetch(`${API_URL}/api/tareas`, {
            headers: {
                "Content-Type": "application/json",
                "x-auth-token": token
            }
        });

        if (!res.ok) {
            localStorage.removeItem("token");
            return window.location.href = "login.html";
        }

        const tareas = await res.json();
        tareasGlobal = tareas;
        renderizarTareas();
    } catch (err) {
        alert("Error al conectar con el servidor.");
    }
}


// ===================
// RENDERIZAR LISTA
// ===================
function renderizarTareas() {
    lista.innerHTML = "";

    let visibles = tareasGlobal.filter((t) => {
        if (filtroActual.prioridad !== "Todas" && t.prioridad !== filtroActual.prioridad) 
            return false;
        
        if (filtroActual.texto.trim()) {
            const texto = filtroActual.texto.toLowerCase();
            const enTitulo = t.titulo.toLowerCase().includes(texto);
            const enDescripcion = (t.descripcion || "").toLowerCase().includes(texto);
            if (!enTitulo && !enDescripcion) return false;
        }

        return true;
    });
    
    visibles.forEach((t) => {
        const li = document.createElement("li");
        li.className = "tarea";
        li.classList.add(`prioridad-${t.prioridad.toLowerCase()}`);
        if (t.completada) li.classList.add("completada");

        li.dataset.id = t._id;
        li.draggable = true;

        li.innerHTML = `
            <div class="contenido-tarea">
                <span>
                    <strong>${t.titulo}</strong> <br>
                    ${t.descripcion || ""}
                    <br><small>Prioridad: ${t.prioridad}</small>
                </span>
            </div>

            <div class="tooltip-fechas">
                <p><strong>Creada:</strong> ${formatearFecha(t.createdAt)}</p>
                <p><strong>Editada:</strong> ${formatearFecha(t.updatedAt)}</p>
            </div>

            <div class="tarea-botones">
                <button onclick="marcarCompletada('${t._id}', ${!t.completada})">✓</button>
                <button onclick="abrirEditar('${t._id}')">✏️</button>
                <button class="danger" onclick="eliminarTarea('${t._id}')">🗑️</button>
            </div>
        `;

        // drag & drop
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragend", handleDragEnd);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("drop", handleDrop);

        lista.appendChild(li);
    });
}

// 🔵 2. Agregar tarea
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevaTarea = {
        titulo: document.getElementById("titulo").value,
        descripcion: document.getElementById("descripcion").value,
        prioridad: document.getElementById("prioridad").value
    };

    const res = await fetch(`${API_URL}/api/tareas`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-auth-token": token
        },
        body: JSON.stringify(nuevaTarea)
    });

    if (!res.ok){
        alert("Error al crear tarea.");
        return;
    }

    form.reset();
    obtenerTareas();
});

// 🔵 3. Marcar tarea como completada
async function marcarCompletada(id, estado) {
    const res = await fetch(`${API_URL}/api/tareas/${id}`, { 
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "x-auth-token": token
         },
        body: JSON.stringify({ completada: estado })
    }); 

    if (!res.ok) {
        alert("Error al actualizar tarea.");
        return;
    }

    obtenerTareas();
}

// 🔵 4. Eliminar tarea individual
async function eliminarTarea(id) {
    const res = await fetch(`${API_URL}/api/tareas/${id}`, { 
        method: "DELETE",
        headers: { 
            "x-auth-token": token 
        }  
    });

    if (!res.ok) { 
        alert("Error al eliminar.");
        return; 
    }

    obtenerTareas();
}

// 🔵 5. Eliminar tareas completadas
btnBorrarCompletadas.addEventListener("click", async () => {
    const res = await fetch(`${API_URL}/api/tareas/completadas`, { 
        method: "DELETE",
        headers: { 
            "x-auth-token": token 
        }
    });

    if (!res.ok) {
        alert("Error al eliminar completadas.");
        return; 
    }

    obtenerTareas();
});

// -------------- Buscador y filtros ---------------  
buscador.addEventListener("input", (e) => {
    filtroActual.texto = e.target.value.toLowerCase();
    renderizarTareas();
});

filtroBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filtroBtns.forEach((b) => b.classList.remove("activo"));
        btn.classList.add("activo");
        filtroActual.prioridad = btn.dataset.filtro;
        renderizarTareas();
    });
});

// ----------------- Modal de edición -----------------
function abrirEditar(id) {
    const tarea = tareasGlobal.find((t) => t._id === id); 
    if (!tarea) return;

    tareaEditando = tarea;

    inputEditarTitulo.value = tarea.titulo;
    inputEditarDescripcion.value = tarea.descripcion || "";
    inputEditarPrioridad.value = tarea.prioridad;
    inputEditarCompletada.checked = tarea.completada;

    modal.classList.remove("oculto");
}

btnCerrarModal.addEventListener("click", () => {
    modal.classList.add("oculto");
    tareaEditando = null;
});

formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!tareaEditando) return;

    const cambios = {
        titulo: inputEditarTitulo.value,
        descripcion: inputEditarDescripcion.value,
        prioridad: inputEditarPrioridad.value,
        completada: inputEditarCompletada.checked
    };

    const res = await fetch(`${API_URL}/api/tareas/${tareaEditando._id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": token
        },
        body: JSON.stringify(cambios)
    });

    if (!res.ok) {
        alert("Error al editar.");
        return; 
    }

    modal.classList.add("oculto");
    tareaEditando = null;
    obtenerTareas();
}); 

// --------------- Drag & Drop ----------------
function handleDragStart(e) {
    idArrastrando = this.dataset.id;
    this.classList.add("dragging");
}

function handleDragEnd(e) {
    this.classList.remove("dragging");
    lista.querySelectorAll(".tarea").forEach((el) => el.classList.remove("drag-over"));
}

function handleDragOver(e) {
    e.preventDefault();
    lista.querySelectorAll(".tarea").forEach((el) => el.classList.remove("drag-over"));
    this.classList.add("drag-over");
}

function handleDrop(e) {
    e.preventDefault();
    const idDestino = this.dataset.id;

    if (idArrastrando || idArrastrando === idDestino) return;

    // Reordenar en memoria
    const origenIndex = tareasGlobal.findIndex((t) => t._id === idArrastrando);
    const destinoIndex = tareasGlobal.findIndex((t) => t._id === idDestino);

    if (origenIndex === -1 || destinoIndex === -1) return;

    const [movida] = tareasGlobal.splice(origenIndex, 1);
    tareasGlobal.splice(destinoIndex, 0, movida);

    renderizarTareas();
    guardarOrdenEnServidor();
}

async function guardarOrdenEnServidor() {
    const ordenIds = tareasGlobal.map((t) => t._id);

    await fetch(`${API_URL}/api/tareas/reordenar`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "x-auth-token": token
        },
        body: JSON.stringify({ orden: ordenIds })
    });
}

// Exponer funciones globales para los onclick del HTML
window.marcarCompletada = marcarCompletada;
window.eliminarTarea = eliminarTarea;
window.abrirEditar = abrirEditar;