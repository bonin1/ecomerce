//ADD TO CART
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
//ADD TO CART

document.addEventListener('DOMContentLoaded', function() {
    const scrollProgress = document.getElementById("progress");
    const progressValue = document.getElementById("progress-value");
    const calcScrollValue = () => {
        const pos = document.documentElement.scrollTop;
        const calcHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollValue = Math.round((pos * 100) / calcHeight);
        if (pos > 100) {
            scrollProgress.style.display = "grid";
        } else {
            scrollProgress.style.display = "none";
        }
        const sanitizedScrollValue = Math.max(0, Math.min(100, scrollValue));
        scrollProgress.style.background = `conic-gradient(#0f4c5c ${sanitizedScrollValue}%, #d7d7d7 ${sanitizedScrollValue}%)`;
    };
    scrollProgress.addEventListener("click", () => {
        document.documentElement.scrollTop = 0;
    });
    window.addEventListener('scroll', calcScrollValue);
    calcScrollValue();
});

        //NAVBAR

        // search bar
        const searchForm = document.getElementById('search-form')
        const searchInput = document.getElementById('search-input')
        const recommendations = document.getElementById('recommendations')
        const searchSubmit = document.querySelector('.search-submit');

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
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && recommendations.firstElementChild) {
                    const itemId = recommendations.firstElementChild.getAttribute('data-id');
                    window.location.href = '/produkt/' + itemId;
                }
            });
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (recommendations.firstElementChild) {
                    const itemId = recommendations.firstElementChild.getAttribute('data-id');
                    window.location.href = '/produkt/' + itemId;
                }
            });
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
        //search bar



        var modal = document.getElementById("Price_Modal");
        var btn = document.getElementById("myBtn");
        var span = document.getElementsByClassName("closeButton_Icon")[0];
        
        btn.onclick = function() {
            modal.style.display = "flex";
        }
        
        span.onclick = function() {
            modal.style.display = "none";
        }
        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

//shopping icona
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

const filterButtons = document.querySelectorAll('.filter-button');
filterButtons.forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault(); 
        const selectedCategory = button.getAttribute('data-value');
        window.history.pushState(
        {},
        '',
        `${window.location.origin}${window.location.pathname}?category=${selectedCategory}`
        );
        
        filterProducts(selectedCategory);
    });
});
//shopping icona
// KATEGORTE
const urlParams = new URLSearchParams(window.location.search);
const selectedCategory = urlParams.get('category');

filterProducts(selectedCategory || '');

function filterProducts(category) {
    const products = document.querySelectorAll('.card1');
    products.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        if (category === '' || category === productCategory) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

const form = document.querySelector('form');
const target = document.querySelector('#target');
const minRange = form.querySelector('#minPrice');
const maxRange = form.querySelector('#maxPrice');
const minOutput = form.querySelector('#minPriceOutput');
const maxOutput = form.querySelector('#maxPriceOutput');

minRange.addEventListener('input', (event) => {
    minOutput.value = `$ ${event.target.value}`;
    console.log('Min Price:', event.target.value);
});

maxRange.addEventListener('input', (event) => {
    maxOutput.value = `$ ${event.target.value}`;
    console.log('Max Price:', event.target.value);
});

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const url = form.getAttribute('data-url');

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then((response) => response.text())
    .then((html) => {
        target.innerHTML = html;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
//KATEGORITE




