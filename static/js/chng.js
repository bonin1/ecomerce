const input = document.getElementById("input-check"),
showHide = document.querySelector(".show_hide"),
indicator = document.querySelector(".indicator"),
colorD = document.getElementById("color-div")

showHide.addEventListener("click", ()=>{
    if(input.type === "password"){
        input.type = "text";
        showHide.classList.replace("fa-eye-slash","fa-eye");
    }else {
        input.type = "password";
        showHide.classList.replace("fa-eye","fa-eye-slash");
    }
});

const inputA = document.getElementById("input-check2"),
ShowHide = document.querySelector(".Show_Hide"),
Indicator = document.querySelector(".indicator"),
colorDi = document.getElementById("color-div")

ShowHide.addEventListener("click", ()=>{
    if(inputA.type === "password"){
        inputA.type = "text";
        ShowHide.classList.replace("fa-eye-slash","fa-eye");
    }else {
        inputA.type = "password";
        ShowHide.classList.replace("fa-eye","fa-eye-slash");
    }
});