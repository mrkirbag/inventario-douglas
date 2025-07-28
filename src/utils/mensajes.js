export function noRegistros(mensaje) {
    const errorCampo = document.getElementById('mensaje');

    if(mensaje == ""){
        errorCampo.style.display = "none";
    } else {
        errorCampo.style.display = "block"
        errorCampo.textContent = mensaje;
        errorCampo.classList.add('mensaje-error');
    }
}

export function mostrarMensaje(mensaje) {
    const mensajeDiv = document.getElementById('mensaje');

    mensajeDiv.textContent = mensaje;
    mensajeDiv.classList.add('mensaje-exito');

    setTimeout(() => {
        mensajeDiv.textContent = '';
        mensajeDiv.classList.remove('mensaje-exito')
    }, 2000);
}

export function mostrarError(mensaje) {
    const errorDiv = document.getElementById('mensaje');

    errorDiv.textContent = mensaje;
    errorDiv.classList.add('mensaje-error');

    setTimeout(() => {
        errorDiv.textContent = '';
        errorDiv.classList.remove('mensaje-error')
    }, 2000);
}