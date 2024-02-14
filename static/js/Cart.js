
function calculateTotalPrice() {
    let total = 0;
        document.querySelectorAll('.cart-card').forEach( card => {
            const price = parseFloat(card.querySelector('.cmimi-cart').textContent.split(' ')[1]);
            const quantity = parseInt(card.querySelector('.sasia-cart').textContent.split(' ')[1]);
            total += price * quantity;
        });
        const totalPriceEl = document.querySelector('.inside-card');
        if (total === 0) {
            totalPriceEl.textContent = 'No items in the cart';
            totalPriceEl.classList.add('empty-cart');
        } else {
            totalPriceEl.textContent = `Total price: ${total}€`;
            totalPriceEl.classList.add('empty-cart');
        }
    }

  
    document.querySelectorAll('.remove-from-cart').forEach( button => {
        button.addEventListener('click', event => {
            const itemId = event.target.dataset.id;
            fetch(`/cart/${itemId}`, { method: 'DELETE' })
                .then(res => {
                if (res.ok) {
                    event.target.closest('.cart-card').remove();
                    calculateTotalPrice();
                } else {
                    alert('Could not remove item from cart');
                }
                })
            .catch(err => console.error(err));
        });
    });
    
    calculateTotalPrice();





    document.addEventListener("DOMContentLoaded", function() {
    calculateTotalPrice();
    });






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