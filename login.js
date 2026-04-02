document.getElementById("formLogin").addEventListener("submit", async function(e){

    e.preventDefault();

    const username = document.getElementById("usuario").value.trim();
    const password = document.getElementById("senha").value.trim();
    const errorDiv = document.getElementById("mensagemErro");

    try {
        const user = await window.Auth.login(username, password);
        
        // Redirecionar baseado no perfil
        if(user.role === "OPERADOR"){
            window.location.href = "dashboard-operador.html";
        } else {
            window.location.href = "index.html";
        }
    } catch (err) {
        errorDiv.innerHTML = "Usuário ou senha incorretos";
        console.error("Erro no login:", err);
    }

});