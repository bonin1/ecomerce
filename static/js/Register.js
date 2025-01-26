const form = document.getElementById('registerForm');
const password = document.getElementById("input-check");
const confirmPassword = document.getElementById("input-check2");
const showHide = document.querySelector(".show_hide");
const ShowHide = document.querySelector(".Show_Hide");
const confirmMsg = document.getElementById("confirmMsg");
const colorD = document.getElementById("color-div");
const colorD2 = document.getElementById("color-div2");

showHide.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
    showHide.classList.toggle("fa-eye");
    showHide.classList.toggle("fa-eye-slash");
});

ShowHide.addEventListener("click", () => {
    confirmPassword.type = confirmPassword.type === "password" ? "text" : "password";
    ShowHide.classList.toggle("fa-eye");
    ShowHide.classList.toggle("fa-eye-slash");
});

function validatePassword() {
    const val = password.value;
    const confirmVal = confirmPassword.value;
    
    let hasLetter = /[a-zA-Z]/.test(val);
    let hasNumber = /[0-9]/.test(val);
    let isLongEnough = val.length >= 8;

    if (val.length === 0) {
        colorD.style.borderColor = "#A6A6A6";
        showHide.style.color = "#A6A6A6";
    } else if (hasLetter && hasNumber && isLongEnough) {
        colorD.style.borderColor = "#22C32A";
        showHide.style.color = "#22C32A";
    } else if (hasLetter && hasNumber) {
        colorD.style.borderColor = "#cc8500";
        showHide.style.color = "#cc8500";
    } else {
        colorD.style.borderColor = "#FF6333";
        showHide.style.color = "#FF6333";
    }

    if (confirmVal.length === 0) {
        confirmMsg.textContent = "";
        colorD2.style.borderColor = "#A6A6A6";
    } else if (val === confirmVal) {
        confirmMsg.textContent = "Passwords match";
        confirmMsg.style.color = "#22C32A";
        colorD2.style.borderColor = "#22C32A";
        ShowHide.style.color = "#22C32A";
    } else {
        confirmMsg.textContent = "Passwords do not match";
        confirmMsg.style.color = "#FF6333";
        colorD2.style.borderColor = "#FF6333";
        ShowHide.style.color = "#FF6333";
    }
}

password.addEventListener("input", validatePassword);
confirmPassword.addEventListener("input", validatePassword);

form.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const val = password.value;
    const confirmVal = confirmPassword.value;
    
    if (val.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
    }
    
    if (!/[a-zA-Z]/.test(val) || !/[0-9]/.test(val)) {
        alert("Password must contain both letters and numbers");
        return;
    }
    
    if (val !== confirmVal) {
        alert("Passwords do not match");
        return;
    }
    
    this.submit();
});

const messageElement = document.getElementById('message');
if (messageElement) {
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}