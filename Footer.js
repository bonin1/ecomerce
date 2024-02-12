function Footer() {
    return `
    <footer class="text-center text-lg-start text-white" style=" background-color: #05A7BE;">
    <div class="container p-4 pb-0">
        <section>
            <div class="row">
                <div class="col-md-3 col-lg-3 col-xl-3 mx-auto mt-3">
                    <h6 class="text-uppercase mb-4 font-weight-bold">StrikeTech</h6>
                        <p>
                            Our company is the best at selling every brand of technology thinks.
                            Come and get everythink you need to us.
                        </p>
                </div>
                <hr class="w-100 clearfix d-md-none" />
                <div class="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
                    <h6 class=" mb-4 font-weight-bold">PRODUCTS</h6>
                    <p class="plast"><button type="button" class="filter-button fund" data-value="studiodevices">Studio Devices</button></p>
                    <p class="plast"><button type="button" class="filter-button fund" data-value="gaming">Gaming stuff</button></p>
                    <p class="plast p1"><button type="button" class="filter-button fund " data-value="phone&headphones">Phones & Headphones</button></p>
                    <p class="plast p1"><button type="button" class="filter-button fund " data-value="watches&cameras">Watches & Cameras</button></p>
                </div>
            <hr class="w-100 clearfix d-md-none" />
                <div class="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
                    <h6 class="mb-4 font-weight-bold">ACCOUNT</h6>
                    <p><a id="f1">My orders</a></p>
                    <p><a id="f1">My address</a></p>
                    <p><a id="f1">My User</a></p>
                </div>
            <hr class="w-100 clearfix d-md-none" />
                <div class="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
                    <h6 class="mb-4 font-weight-bold">CONTACT</h6>
                    <p><i class="fas fa-envelope mr-3"></i>Striketech.KS@gmail.com</p>
                    <p><i class="fas fa-home mr-3"></i> Kosovë, Pejë, Filan Fisteku 7</p>
                    <p><i class="fas fa-phone mr-3"></i>+383 49 115 898</p>
                    <p><i class="fas fa-print mr-3"></i>+383 49 116 898</p>
                </div>
            </div>
        </section>
    <hr class="my-3">
        <section class="p-3 pt-0">
            <div class="row d-flex align-items-center">
                <div class="col-md-7 col-lg-8 text-center text-md-start">
                    <div class="p-3">
                        © 2023 Copyright:<p class="copy" style="color:  rgb(13, 0, 255)" href="/"> StrikeTech</p>
                    </div>
                </div>
                <div class="col-md-5 col-lg-4 ml-lg-0 text-center text-md-end">
                    <a class="btn btn-outline-primary btn-floating m-1" class="text-white" role="button"><i class="fab fa-facebook-f"></i></a>
                    <a class="btn btn-outline-primary btn-floating m-1" class="text-white" role="button"><i class="fab fa-twitter"></i></a>
                    <a class="btn btn-outline-danger btn-floating m-1" class="text-white" role="button"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
        </section>
    </div>
</footer>
    `;
}

module.exports = Footer;