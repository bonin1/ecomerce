
        
    const input = document.getElementById('P_Input')
    const ShowHide = document.querySelector('.Show_Hide'),
    indicator = document.querySelector(".indicator")

    ShowHide.addEventListener('click',()=>{
        if(input.type === 'password'){
            input.type = 'text'
            ShowHide.classList.replace("fa-eye-slash","fa-eye");
        }
        else{
            input.type = 'password'
            ShowHide.classList.replace("fa-eye","fa-eye-slash");
        }
    })

    let alphabet = /[a-zA-Z]/,
        numbers = /[0-9]/, 
        scharacters = /[!,@,#,$,%,^,&,*,?,_,(,),-,+,=,~]/;

        input.addEventListener("keyup", ()=>{
            indicator.classList.add("active");

            let val = input.value;
            if(val.match(alphabet) || val.match(numbers) || val.match(scharacters)){
                input.style.borderColor = "#FF6333";
                showHide.style.color = "#FF6333";
            }
            if(val.match(alphabet) && val.match(numbers) && val.length >= 6){
                input.style.borderColor = "#cc8500";
                showHide.style.color = "#cc8500";
            }
            if(val.match(alphabet) && val.match(numbers) && val.match(scharacters) && val.length >= 8){
                input.style.borderColor = "#22C32A";
                showHide.style.color = "#22C32A";
            }

            if(val == ""){
                indicator.classList.remove("active");
                input.style.borderColor = "#A6A6A6";
                showHide.style.color = "#A6A6A6";
            }
        });