

const searchForm = document.getElementById('search-form')
const searchInput = document.getElementById('search-input')
const recommendations = document.getElementById('recommendations')

searchInput.addEventListener('input', function() {
    if (this.value === '') {
        recommendations.innerHTML = ''
    } else {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/search?q=' + this.value, true)
        xhr.send()
        xhr.onload = function() {
            if (this.status === 200) {
                const results = JSON.parse(this.responseText);
                recommendations.innerHTML = ''
                for (let i = 0; i < 4; i++) {  
                    const result = results[i];
                    if (!result) break; 
                    const li = document.createElement('li')
                    li.className = 'rcmn-li'
                    li.textContent = result.emri_produktit
                    li.setAttribute('data-id', result.id)
                    recommendations.appendChild(li)
                }
            }
        }
    }
    recommendations.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const itemId = e.target.getAttribute('data-id')
            window.location.href = '/produkt/' + itemId
        }
    })
})
searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
});


const addToCartButtons = document.querySelectorAll('.add-to-cart');
addToCartButtons.forEach(button => {
    button.addEventListener('click', e => {
        const isLoggedIn = e.target.getAttribute('data-is-logged-in') === 'true';
        if (!isLoggedIn) {
            return window.location.href = '/login';
        }
        const itemId = e.target.getAttribute('data-id');
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/cart', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ id: itemId, quantity: 1 }));
        xhr.onload = function() {
            if (this.status === 200) {
                console.log('Item added to cart');
            } else {
                console.error('Error adding item to cart');
            }
        }
    });
});



const xhr = new XMLHttpRequest();
xhr.open('GET', '/cart/count', true);
xhr.send();
xhr.onload = function() {
    if (this.status === 200) {
        const cartCount = JSON.parse(this.responseText).count;
        const cartCountElement = document.querySelector('.cart-count');
        cartCountElement.innerHTML = cartCount;
    } else {
        console.error('Error fetching cart count');
    }
}
let calcScrollValue = () => {
let scrollProgress = document.getElementById("progress");
let progressValue = document.getElementById("progress-value");
let pos = document.documentElement.scrollTop;
let calcHeight =
document.documentElement.scrollHeight -
document.documentElement.clientHeight;
let scrollValue = Math.round((pos * 100) / calcHeight);
if (pos > 100) {
scrollProgress.style.display = "grid";
} else {
scrollProgress.style.display = "none";
}
scrollProgress.addEventListener("click", () => {
document.documentElement.scrollTop = 0;
});
scrollProgress.style.background = `conic-gradient(#0f4c5c ${scrollValue}%, #d7d7d7 ${scrollValue}%)`;
};

window.onscroll = calcScrollValue;
window.onload = calcScrollValue;



window.onload = function () {

// SLIDERI
var slider = document.getElementsByClassName("sliderBlock_items");
var slides = document.getElementsByClassName("sliderBlock_items__itemPhoto");
var next = document.getElementsByClassName("sliderBlock_controls__arrowForward")[0];
var previous = document.getElementsByClassName("sliderBlock_controls__arrowBackward")[0];
var items = document.getElementsByClassName("sliderBlock_positionControls")[0];
var currentSlideItem = document.getElementsByClassName("sliderBlock_positionControls__paginatorItem");

var currentSlide = 0;
var slideInterval = setInterval(nextSlide, 5000);  // 5 SEC

function nextSlide() {
goToSlide(currentSlide + 1);
}

function previousSlide() {
goToSlide(currentSlide - 1);
}


function goToSlide(n) {
slides[currentSlide].className = 'sliderBlock_items__itemPhoto';
items.children[currentSlide].className = 'sliderBlock_positionControls__paginatorItem';
currentSlide = (n + slides.length) % slides.length;
slides[currentSlide].className = 'sliderBlock_items__itemPhoto sliderBlock_items__showing';
items.children[currentSlide].className = 'sliderBlock_positionControls__paginatorItem sliderBlock_positionControls__active';
}


next.onclick = function () {
nextSlide();
};
previous.onclick = function () {
previousSlide();
};


function goToSlideAfterPushTheMiniBlock() {
for (var i = 0; i < currentSlideItem.length; i++) {
currentSlideItem[i].onclick = function (i) {
    var index = Array.prototype.indexOf.call(currentSlideItem, this);
    goToSlide(index);
}
}
}

goToSlideAfterPushTheMiniBlock();



///// FUSHA E SPECIFIKIMIT


var buttonFullSpecification = document.getElementsByClassName("block_specification")[0];
var buttonSpecification = document.getElementsByClassName("block_specification__specificationShow")[0];
var buttonInformation = document.getElementsByClassName("block_specification__informationShow")[0];

var blockCharacteristiic = document.querySelector(".block_descriptionCharacteristic");
var activeCharacteristic = document.querySelector(".block_descriptionCharacteristic__active");


buttonFullSpecification.onclick = function () {

console.log("OK");


buttonSpecification.classList.toggle("hide");
buttonInformation.classList.toggle("hide");


blockCharacteristiic.classList.toggle("block_descriptionCharacteristic__active");


};


// SASIA

var up = document.getElementsByClassName('block_quantity__up')[0],
down = document.getElementsByClassName('block_quantity__down')[0],
input = document.getElementsByClassName('block_quantity__number')[0];

function getValue() {
return parseInt(input.value);
}

up.onclick = function (event) {
input.value = getValue() + 1;
};
down.onclick = function (event) {
if (input.value <= 1) {
return 1;
} else {
input.value = getValue() - 1;
}

}
};

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
event.preventDefault();
const formData = new FormData(form);
const id = formData.get('id');
const rating = formData.get('rating');
const product_id = formData.get('product_id');
const userId = formData.get('userId');
const comment = formData.get('comment');

$.ajax({
type: 'POST',
url: `/produkt/${id}`,
data: JSON.stringify({ rating, product_id, userId, comment }),
contentType: 'application/json',
success: function(data) {
    console.log("Successfully submitted form");
},
error: function(error) {
    console.log(error);
}
});
});

