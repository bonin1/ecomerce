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

let alphabet = /[a-zA-Z]/,
numbers = /[0-9]/, 
scharacters = /[!,@,#,$,%,^,&,*,?,_,(,),-,+,=,~]/;

input.addEventListener("keyup", ()=>{
    indicator.classList.add("active");

    let val = input.value;
    if(val.match(alphabet) || val.match(numbers) || val.match(scharacters)){
        colorD.style.borderColor = "#FF6333";
        showHide.style.color = "#FF6333";
    }
    if(val.match(alphabet) && val.match(numbers) && val.length >= 6){
        colorD.style.borderColor = "#cc8500";
        showHide.style.color = "#cc8500";
    }
    if(val.match(alphabet) && val.match(numbers) && val.match(scharacters) && val.length >= 8){
        colorD.style.borderColor = "#22C32A";
        showHide.style.color = "#22C32A";
    }

    if(val == ""){
        indicator.classList.remove("active");
        colorD.style.borderColor = "#A6A6A6";
        showHide.style.color = "#A6A6A6";
    }
});
const messageElement = document.getElementById('message');
if (messageElement) {
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}