

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


document.addEventListener('DOMContentLoaded', function() {
    const cartCountElement = document.querySelector('.cart-count');

    document.addEventListener('click', e => {
        if (e.target.classList.contains('add-to-cart')) {
            const isLoggedIn = e.target.getAttribute('data-is-logged-in') === 'true';
            if (!isLoggedIn) {
                return window.location.href = '/login';
            }
            const itemId = e.target.getAttribute('data-id');
            
            fetch('/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: itemId, quantity: 1 })
            })
            .then(response => {
                if (response.status === 200) {
                    console.log('Item added to cart');
                    updateCartCount();
                } else {
                    console.error('Error adding item to cart');
                }
            })
            .catch(error => {
                console.error('Network error:', error);
            });
        }
    });

    function updateCartCount() {
        fetch('/cart/count')
        .then(response => response.json())
        .then(data => {
            const cartCount = data.count;
            cartCountElement.innerHTML = cartCount;
        })
        .catch(error => {
            console.error('Error fetching cart count:', error);
        });
    }

    updateCartCount();
});







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



document.addEventListener('DOMContentLoaded', function() {
    let slideIndex = 1;
    const slides = document.getElementsByClassName("mySlides");
    const dots = document.getElementsByClassName("dot");
    
    showSlides(slideIndex);

    function plusSlides(n) {
        showSlides(slideIndex += n);
    }

    function currentSlide(n) {
        showSlides(slideIndex = n);
    }

    function showSlides(n) {
        if (n > slides.length) {slideIndex = 1}    
        if (n < 1) {slideIndex = slides.length}
        
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";  
        }
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        
        slides[slideIndex-1].style.display = "block";  
        dots[slideIndex-1].className += " active";
    }

    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");
    
    prevButton.addEventListener("click", function() {
        plusSlides(-1);
    });

    nextButton.addEventListener("click", function() {
        plusSlides(1);
    });

    const dotIndicators = document.querySelectorAll(".dot");
    
    dotIndicators.forEach(function(dot, index) {
        dot.addEventListener("click", function() {
            currentSlide(index + 1);
        });
    });
});
