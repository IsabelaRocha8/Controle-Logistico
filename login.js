document.getElementById("loginForm").addEventListener("submit", function(e){

    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value.trim();

    const usuarios = {
        adm: "123",
        logistica: "123"
    };

    if(usuarios[usuario] === senha){

        localStorage.setItem("usuarioLogado", usuario);

        if(usuario === "adm"){
            localStorage.setItem("nivelAcesso","adm");
        }

        if(usuario === "logistica"){
            localStorage.setItem("nivelAcesso","logistica");
        }

        /* 🔥 VERIFIQUE O NOME DA SUA PÁGINA AQUI */
        window.location.href = "dashboard.html";

    } else {
        document.getElementById("erro").innerHTML = "Usuário ou senha incorretos";
    }

});