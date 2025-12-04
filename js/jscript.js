`// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCrdGHXxVKQ2BiU6___9fOqVDwIECLq8pk",
    authDomain: "jejak-mufassir.firebaseapp.com",
    databaseURL: "https://jejak-mufassir-default-rtdb.firebaseio.com",
    projectId: "jejak-mufassir",
    storageBucket: "jejak-mufassir.appspot.com",
    messagingSenderId: "469253249038",
    appId: "1:469253249038:web:32f85e975d23225bc9c45f",
    measurementId: "G-TXMEYE5MR8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Variabel slider unik untuk produk 1234
let product1234Slider = {
    currentSlide: 0,
    totalSlides: 0,
    images: [],
    startX: 0,
    endX: 0
};

// Fungsi untuk mengambil produk ID dari span
function getProductIdFromSpan() {
    const productSpan = document.getElementById('produk');
    return productSpan ? productSpan.textContent.trim() : null;
}

// Fungsi untuk mengambil affiliate ID dari URL (jika ada)
function getAffiliateIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('affid');
}

// Fungsi utama untuk memuat data produk
function loadProductData() {
    const sku = getProductIdFromSpan();
    const affId = getAffiliateIdFromUrl();

    console.log("Loading product data for SKU:", sku);

    if (sku) {
        // Simpan affiliate ID di cookie jika ada
        if (affId) {
            document.cookie = `affId=${affId}; path=/`;
        }

        // Lanjutkan dengan memuat data produk
        const productsRef = database.ref('sellers');
        productsRef.once('value', (snapshot) => {
            let productFound = false;
            snapshot.forEach((sellerSnapshot) => {
                const sellerId = sellerSnapshot.key;
                sellerSnapshot.child('products').forEach((productSnapshot) => {
                    const product = productSnapshot.val();
                    if (product.sku === sku) {
                        productFound = true;
                        console.log("Product found:", product);
                        fetchSellerInfo(sellerId);

                        // Load product images - MODIFIKASI UNTUK SLIDER UNIK
                        const imageSlider = document.getElementById('product-1234-slider');
                        product1234Slider.images = [];
                        imageSlider.innerHTML = '';

                        const imageUrlsRef = database.ref(`sellers/${sellerId}/products/${productSnapshot.key}/imageUrls`);
                        imageUrlsRef.once('value', (imageUrlsSnapshot) => {
                            const imageUrlsData = imageUrlsSnapshot.val();
                            if (imageUrlsData) {
                                // Reset array
                                product1234Slider.images = [];

                                // Urutkan berdasarkan key (0, 1, 2, ...)
                                const sortedUrls = Object.entries(imageUrlsData)
                                    .sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB))
                                    .map(([_, url]) => url);

                                sortedUrls.forEach((imageUrl, index) => {
                                    if (imageUrl) {
                                        product1234Slider.images.push(imageUrl);
                                        const img = document.createElement('img');
                                        img.src = imageUrl;
                                        img.classList.add('product-1234-slider-image');
                                        img.alt = `Product image ${index + 1}`;
                                        img.loading = "lazy";
                                        imageSlider.appendChild(img);
                                    }
                                });

                                product1234Slider.totalSlides = product1234Slider.images.length;
                                console.log(`Loaded ${product1234Slider.totalSlides} images for product 1234 slider`);

                                if (product1234Slider.totalSlides > 0) {
                                    // Setup image popup untuk slider images
                                    setupSliderImageClickEvents();

                                    // Setup slider navigation
                                    setupProduct1234Slider();

                                    // Update slider buttons
                                    updateProduct1234SliderButtons();
                                }
                            }
                        });

                        // Set product information
                        if (product.jenisproduk) {
                            document.getElementById('jenisproduk').textContent = `Jenis Produk: ${product.jenisproduk}`;
                            document.getElementById('jenisproduk').classList.remove('hidden');
                            document.getElementById('jenisproduk').parentElement.classList.remove('hidden');
                        }

                        if (product.berat) {
                            document.getElementById('berat').textContent = `Berat Produk: ${product.berat}`;
                            document.getElementById('berat').classList.remove('hidden');
                            document.getElementById('berat').parentElement.classList.remove('hidden');
                        }

                        document.getElementById('product-name').textContent = product.name;

                        // Set product description
                        const productDescription = document.getElementById('product-description');
                        const formattedDescription = formatDescription(product.description);
                        productDescription.innerHTML = `
                            <div class="description-container">
                                <div class="fade-out"></div>
                                <div class="description-content">${formattedDescription}</div>
                            </div>
                            <div class="read-more-container">
                                <span class="read-more">Selengkapnya . . .</span>
                            </div>
                        `;

                        const readMoreBtn = productDescription.querySelector('.read-more');
                        const descriptionContainer = productDescription.querySelector('.description-container');
                        const fadeOutElement = productDescription.querySelector('.fade-out');

                        readMoreBtn.addEventListener('click', function() {
                            descriptionContainer.classList.toggle('expanded');
                            fadeOutElement.classList.toggle('hidden');
                            this.textContent = descriptionContainer.classList.contains('expanded') ? 'Sembunyikan' : 'Selengkapnya . . .';
                        });

                        setTimeout(checkDescriptionHeight, 0);
                        window.addEventListener('resize', checkDescriptionHeight);

                        // Set product price
                        let basePrice = product.price || 0;
                        const currentPriceElement = document.getElementById('current-price');
                        const originalPriceElement = document.getElementById('original-price');

                        if (basePrice === 0 && product.discount === 100) {
                            currentPriceElement.innerHTML = '<span style="color: red;">Gratis</span>';
                            originalPriceElement.style.display = 'none';
                        } else {
                            currentPriceElement.textContent = `Rp ${basePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
                            const originalPrice = calculateOriginalPrice(basePrice, product.discount || 0);
                            originalPriceElement.textContent = `Rp ${originalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
                            originalPriceElement.style.display = 'block';
                        }

                        const soldValue = product.sold !== undefined && product.sold !== "" ? `+${product.sold} Terjual` : "";
                        document.getElementById('sold').textContent = soldValue;

                        // Update discount badge
                        if (product.discount && product.discount > 0) {
                            document.getElementById('product-1234-discount-badge').textContent = `-${product.discount}%`;
                            document.getElementById('product-1234-discount-badge').style.display = 'block';
                        }

                        // Load seller city
                        const cityRef = database.ref(`users/${sellerId}/city`);
                        cityRef.once('value', (citySnapshot) => {
                            const fullCity = citySnapshot.val();
                            if (fullCity) {
                                const cityParts = fullCity.split(', ');
                                const cityName = cityParts.length > 1 ? cityParts[1] : fullCity;
                                const cityElement = document.getElementById('city');
                                cityElement.innerHTML = ` ${cityName}`;
                                cityElement.dataset.fullCity = fullCity;
                            }
                        });

                        // Load seller name
                        const nameRef = database.ref(`users/${sellerId}/name`);
                        nameRef.once('value', (nameSnapshot) => {
                            const sellerName = nameSnapshot.val();
                            if (sellerName) {
                                const nameElement = document.getElementById('seller-name');
                                nameElement.textContent = sellerName;
                                nameElement.dataset.sellerName = sellerName;
                            }
                        });

                        // Load seller coordinates
                        const koordinatLokasiRef = database.ref(`users/${sellerId}/koordinatLokasi`);
                        koordinatLokasiRef.once('value', (koordinatLokasiSnapshot) => {
                            const koordinatLokasi = koordinatLokasiSnapshot.val();
                            if (koordinatLokasi) {
                                const koordinatLokasiElement = document.getElementById('koordinatLokasi');
                                koordinatLokasiElement.textContent = koordinatLokasi;
                                koordinatLokasiElement.dataset.koordinatLokasi = koordinatLokasi;
                            }
                        });

                        // Setup shop link
                        document.getElementById('shop-link').onclick = () =>
                            location.href = `https://www.jejakmufassir.my.id/p/informasi-pengguna.html?id=${product.userID}`;

                        // Setup chat link
                        document.getElementById('chatseller-link').onclick = () =>
                            location.href = `https://jejakmufassir.my.id/p/chat.html?id=${product.userID}`;

                        // Calculate and update average rating
                        calculateAndUpdateAverageRating(sku, sellerId, productSnapshot.key);

                        // Load reviews
                        getReviewData(sku);

                        // Initialize cart and share buttons
                        initializeCartButton();
                        initializeShareButton();

                        // Load product variations
                        const variationsRef = database.ref(`sellers/${sellerId}/products/${productSnapshot.key}/variations`);
                        variationsRef.once('value', (variationsSnapshot) => {
                            const variations = variationsSnapshot.val();
                            if (variations) {
                                product.variations = variations;
                            }

                            // Setup click handler untuk tombol beli
                            document.getElementById('beli-sekarang').onclick = () => {
                                showQuantityPopup({...product, imageUrls: product1234Slider.images});
                            };
                        });
                    }
                });
            });
            if (!productFound) {
                console.warn('Produk tidak ditemukan!');
            }
        });
    } else {
        console.error('ID produk tidak ditemukan!');
    }
}

// Setup slider untuk produk 1234
function setupProduct1234Slider() {
    const prevBtn = document.getElementById('product-1234-prev');
    const nextBtn = document.getElementById('product-1234-next');
    
    if (prevBtn && nextBtn) {
        // Hapus event listener sebelumnya jika ada
        prevBtn.removeEventListener('click', handlePrevClick);
        nextBtn.removeEventListener('click', handleNextClick);
        
        // Tambah event listener baru
        prevBtn.addEventListener('click', handlePrevClick);
        nextBtn.addEventListener('click', handleNextClick);
        
        console.log("Product 1234 slider setup complete");
    }
    
    // Setup touch events
    const slider = document.getElementById('product-1234-slider');
    if (slider) {
        slider.addEventListener('touchstart', handleProduct1234TouchStart, false);
        slider.addEventListener('touchmove', handleProduct1234TouchMove, false);
        slider.addEventListener('touchend', handleProduct1234TouchEnd, false);
    }
}

function handlePrevClick() {
    changeProduct1234Slide(-1);
}

function handleNextClick() {
    changeProduct1234Slide(1);
}

function updateProduct1234SliderButtons() {
    const prevBtn = document.getElementById('product-1234-prev');
    const nextBtn = document.getElementById('product-1234-next');
    const slides = document.querySelectorAll('.product-1234-slider-image');
    
    if (slides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }
    
    if (prevBtn) {
        prevBtn.style.display = 'flex';
        prevBtn.disabled = product1234Slider.currentSlide === 0;
        prevBtn.style.opacity = product1234Slider.currentSlide === 0 ? '0.3' : '0.7';
    }
    
    if (nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.disabled = product1234Slider.currentSlide === slides.length - 1;
        nextBtn.style.opacity = product1234Slider.currentSlide === slides.length - 1 ? '0.3' : '0.7';
    }
}

function changeProduct1234Slide(n) {
    const slides = document.querySelectorAll('.product-1234-slider-image');
    if (slides.length === 0) return;
    
    product1234Slider.currentSlide += n;
    
    // Cek batasan slide
    if (product1234Slider.currentSlide < 0) {
        product1234Slider.currentSlide = slides.length - 1;
    } else if (product1234Slider.currentSlide >= slides.length) {
        product1234Slider.currentSlide = 0;
    }
    
    console.log(`Product 1234 - Changing to slide: ${product1234Slider.currentSlide + 1}/${slides.length}`);
    updateProduct1234Slider();
    updateProduct1234SliderButtons();
}

function updateProduct1234Slider() {
    const slider = document.getElementById('product-1234-slider');
    const slides = document.querySelectorAll('.product-1234-slider-image');
    
    if (!slider || slides.length === 0) return;
    
    const slideWidth = slider.parentElement.clientWidth;
    const translateX = -product1234Slider.currentSlide * slideWidth;
    
    console.log(`Product 1234 - Slide ${product1234Slider.currentSlide + 1}, TranslateX: ${translateX}px`);
    
    slider.style.transform = `translateX(${translateX}px)`;
}

function handleProduct1234TouchStart(e) {
    product1234Slider.startX = e.touches[0].clientX;
}

function handleProduct1234TouchMove(e) {
    if (!product1234Slider.startX) return;
    product1234Slider.endX = e.touches[0].clientX;
}

function handleProduct1234TouchEnd() {
    if (!product1234Slider.startX || !product1234Slider.endX) return;
    
    const diffX = product1234Slider.startX - product1234Slider.endX;
    if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
            changeProduct1234Slide(1);
        } else {
            changeProduct1234Slide(-1);
        }
    }
    product1234Slider.startX = null;
    product1234Slider.endX = null;
}

// Setup image click events untuk slider
function setupSliderImageClickEvents() {
    const sliderImages = document.querySelectorAll('.product-1234-slider-image');
    
    sliderImages.forEach((img, index) => {
        img.style.cursor = 'pointer';
        // Hapus event listener sebelumnya jika ada
        img.removeEventListener('click', handleSliderImageClick);
        // Tambah event listener baru
        img.addEventListener('click', handleSliderImageClick);
    });
}

function handleSliderImageClick(e) {
    openFullscreen(e.target.src);
}

// Fungsi untuk menghitung harga asli
function calculateOriginalPrice(currentPrice, discountPercent) {
    return Math.round(currentPrice / (1 - (discountPercent / 100)));
}

// Fungsi untuk memformat deskripsi
function formatDescription(description) {
    if (!description) return '';
    
    try {
        return decodeURIComponent(description).replace(/\n/g, '<br>');
    } catch (e) {
        let fixedDescription = description.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
        return decodeURIComponent(fixedDescription).replace(/\n/g, '<br>');
    }
}

// Fungsi untuk memeriksa tinggi deskripsi
function checkDescriptionHeight() {
    const container = document.querySelector('.description-container');
    if (container) {
        const content = container.querySelector('.description-content');
        const readMore = container.querySelector('.read-more');

        if (content && readMore) {
            if (content.scrollHeight > container.offsetHeight) {
                readMore.style.display = 'inline';
            } else {
                readMore.style.display = 'none';
            }
        }
    }
}

// Fungsi untuk menghitung dan memperbarui rating rata-rata
function calculateAndUpdateAverageRating(sku, sellerId, productKey) {
    const reviewRef = database.ref(`testimoni/${sku}`);
    reviewRef.once('value').then((snapshot) => {
        const reviews = snapshot.val();
        if (reviews) {
            const reviewArray = Object.values(reviews);
            const totalRating = reviewArray.reduce((sum, review) => sum + (review.rating || 5), 0);
            const averageRating = totalRating / reviewArray.length;
            
            const productRatingRef = database.ref(`sellers/${sellerId}/products/${productKey}/rating`);
            productRatingRef.set(averageRating.toFixed(1)).then(() => {
                console.log("Average rating updated successfully");
            }).catch((error) => {
                console.error("Error updating average rating:", error);
            });

            updateAverageRating(averageRating);
        } else {
            console.log("No reviews found for SKU:", sku);
        }
    }).catch((error) => {
        console.error("Error fetching review data:", error);
    });
}

// Fungsi untuk memperbarui rating rata-rata
function updateAverageRating(rating) {
    const averageRatingElement = document.getElementById("jm-average-rating");
    if (averageRatingElement) {
        averageRatingElement.textContent = rating.toFixed(1);
    }
}

// Fungsi untuk menampilkan popup quantity
function showQuantityPopup(product) {
    const popup = document.createElement('div');
    popup.className = 'quantity-popup';
    
    let popupContent = `
        <div class="popup-content">
            <button id="close-popup" class="close-button">&times;</button>
            <h3>${product.name}</h3>
    `;

    if (product.variations && Object.keys(product.variations).length > 0) {
        const variations = product.variations;
        const colors = [...new Set(Object.values(variations).map(v => v.color))];
        
        popupContent += `
            <div class="variation-selector">
                ${colors.length > 0 ? `
                    <div class="color-selection">
                        <p>Warna:</p>
                        <div class="color-options">
                            ${colors.map(color => `
                                <button class="color-option" data-color="${color}">
                                    ${color}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="size-selection" style="display: none;">
                    <p>Ukuran:</p>
                    <div class="size-options"></div>
                </div>
                
                <div class="variation-image">
                    <img id="variation-img" src="${product.imageUrls[0]}" alt="Product variation">
                </div>
                
                <div class="variation-details">
                    <p>Stok: <span id="variation-stock">-</span></p>
                    <p>Harga: Rp <span id="variation-price">-</span></p>
                </div>
            </div>
        `;
    } else {
        popupContent += `
            <div class="variation-details">
                <p>Harga: Rp <span id="variation-price">${product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span></p>
            </div>
        `;
    }

    popupContent += `
            <div class="quantity-selector">
                <button id="decrease-quantity">-</button>
                <input type="number" id="quantity-input" value="1" min="1" ${product.jenisproduk === 'Digital' ? 'max="1"' : ''}>
                <button id="increase-quantity">+</button>
            </div>
            <button id="create-order" disabled>Buat Pesanan</button>
            <p id="variation-error" style="color: red; text-align: center; margin-top: 10px; display: none;">
                Silakan pilih variasi produk terlebih dahulu
            </p>
        </div>
    `;

    popup.innerHTML = popupContent;
    document.body.appendChild(popup);

    let selectedColor = null;
    let selectedSize = null;
    let selectedVariation = null;
    const createOrderBtn = document.getElementById('create-order');
    const variationError = document.getElementById('variation-error');

    function validateSelection() {
        if (product.variations && Object.keys(product.variations).length > 0) {
            const isValid = selectedColor && selectedSize && selectedVariation;
            createOrderBtn.disabled = !isValid;
            variationError.style.display = isValid ? 'none' : 'block';
            return isValid;
        }
        createOrderBtn.disabled = false;
        variationError.style.display = 'none';
        return true;
    }

    if (product.variations && Object.keys(product.variations).length > 0) {
        const colorButtons = document.querySelectorAll('.color-option');
        const sizeSelection = document.querySelector('.size-selection');
        const sizeOptions = document.querySelector('.size-options');
        const variationImg = document.getElementById('variation-img');
        const variationStock = document.getElementById('variation-stock');
        const variationPrice = document.getElementById('variation-price');

        function updateSizeOptions(color) {
            const availableSizes = Object.values(product.variations)
                .filter(v => v.color === color)
                .map(v => v.size);

            sizeOptions.innerHTML = availableSizes.map(size => `
                <button class="size-option" data-size="${size}">
                    ${size}
                </button>
            `).join('');

            sizeSelection.style.display = 'block';
            selectedSize = null;
            validateSelection();

            document.querySelectorAll('.size-option').forEach(button => {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
                    button.classList.add('selected');
                    selectedSize = button.dataset.size;
                    updateVariationDetails();
                    validateSelection();
                });
            });
        }

        function updateVariationDetails() {
            if (selectedColor && selectedSize) {
                selectedVariation = Object.values(product.variations).find(
                    v => v.color === selectedColor && v.size === selectedSize
                );

                if (selectedVariation) {
                    variationImg.src = selectedVariation.imageUrls[0];
                    variationStock.textContent = selectedVariation.stock;
                    variationPrice.textContent = selectedVariation.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    quantityInput.max = selectedVariation.stock;
                    if (parseInt(quantityInput.value) > selectedVariation.stock) {
                        quantityInput.value = selectedVariation.stock;
                    }
                }
            }
        }

        colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                colorButtons.forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');
                selectedColor = button.dataset.color;
                selectedSize = null;
                updateSizeOptions(selectedColor);
                validateSelection();
            });
        });
    }

    // Quantity controls
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('quantity-input');

    decreaseBtn.addEventListener('click', () => {
        if (quantityInput.value > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
        }
    });

    increaseBtn.addEventListener('click', () => {
        if (product.jenisproduk !== 'Digital') {
            if (selectedVariation) {
                if (parseInt(quantityInput.value) < selectedVariation.stock) {
                    quantityInput.value = parseInt(quantityInput.value) + 1;
                }
            } else {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            }
        }
    });

    quantityInput.addEventListener('change', () => {
        if (product.jenisproduk === 'Digital') {
            quantityInput.value = 1;
        } else if (selectedVariation) {
            if (parseInt(quantityInput.value) > selectedVariation.stock) {
                quantityInput.value = selectedVariation.stock;
            }
            if (parseInt(quantityInput.value) < 1) {
                quantityInput.value = 1;
            }
        }
    });

    // Create order button
    createOrderBtn.addEventListener('click', () => {
        if (!validateSelection()) {
            return;
        }

        const quantity = parseInt(quantityInput.value);
        let orderData;
        if (selectedVariation) {
            orderData = {
                ...product,
                price: selectedVariation.price,
                sku: selectedVariation.sku,
                selectedColor: selectedVariation.color,
                selectedSize: selectedVariation.size,
                selectedImageUrl: selectedVariation.imageUrls[0],
                quantity: quantity
            };
        } else {
            orderData = {
                ...product,
                quantity: quantity
            };
        }
        storeOrderDataInCookies(orderData, quantity);
        window.location.href = 'https://www.jejakmufassir.my.id/p/pesanan.html';
    });

    // Close button
    document.getElementById('close-popup').addEventListener('click', closeQuantityPopup);

    // Show popup with animation
    setTimeout(() => {
        popup.style.transform = 'translateY(0)';
    }, 10);

    // Initial validation
    validateSelection();
}

// Fungsi untuk menutup popup quantity
function closeQuantityPopup() {
    const popup = document.querySelector('.quantity-popup');
    if (popup) {
        popup.style.transform = 'translateY(100%)';
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Fungsi untuk menyimpan data pesanan di cookies
function storeOrderDataInCookies(product, quantity) {
    const produkCode = getProductIdFromSpan();
    const affId = getAffiliateIdFromUrl();

    const commissionAmountElement = document.getElementById('commission-amount');
    const commissionAmount = commissionAmountElement ? commissionAmountElement.textContent.replace(/\D/g, '') : '0'; 

    const userIdContainer = document.getElementById('userIdContainer')?.textContent.trim() || '';

    const cookieData = {
        checkout_key: product.userID,
        checkout_sku: product.sku,
        checkout_judul: product.name,
        checkout_harga: product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
        checkout_berat: product.berat,
        checkout_jenisproduk: product.jenisproduk,
        checkout_deskripsi: product.description,
        checkout_city: document.getElementById('city')?.dataset.fullCity || '',
        checkout_sellername: document.getElementById('seller-name')?.dataset.sellerName || '',
        checkout_koordinatLokasi: document.getElementById('koordinatLokasi')?.dataset.koordinatLokasi || '',
        checkout_quantity: quantity,
        checkout_color: product.selectedColor || '',
        checkout_size: product.selectedSize || '',
        checkout_variation_image: product.selectedImageUrl || product.imageUrls[0],
        checkout_produkkode: produkCode,
        checkout_affId: affId,
        checkout_komisi: commissionAmount,
        checkout_currentId: userIdContainer
    };

    // Store image URLs in cookies
    product.imageUrls.forEach((url, index) => {
        cookieData[`checkout_urlgambar${index + 1}`] = url;
    });

    // Set cookies
    Object.entries(cookieData).forEach(([key, value]) => {
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/`;
    });
}

// Cart functionality
function initializeCartButton() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const produkId = getProductIdFromSpan();

    console.log("Initializing cart button for product:", produkId);

    function getUid() {
        return firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
    }

    function createSvgElement(url) {
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '24px';
        img.style.height = '24px';
        return img;
    }

    const svgAddToCartUrl = 'https://res.cloudinary.com/jejak-mufassir/image/upload/v1759384267/Icon-icon/love_c1lymg.svg';
    const svgRemoveFromCartUrl = 'https://res.cloudinary.com/jejak-mufassir/image/upload/v1759384306/Icon-icon/love_red_ejz5d2.svg';

    function updateButtonContent(uid) {
        if (!uid) {
            console.error('User is not authenticated');
            return;
        }

        const cartRef = firebase.database().ref(`carts/${uid}/${produkId}`);
        cartRef.once('value', (snapshot) => {
            addToCartBtn.innerHTML = '';
            if (snapshot.exists()) {
                const currentValue = snapshot.val();
                const svg = createSvgElement(currentValue.status ? svgRemoveFromCartUrl : svgAddToCartUrl);
                addToCartBtn.appendChild(svg);
            } else {
                const svg = createSvgElement(svgAddToCartUrl);
                addToCartBtn.appendChild(svg);
            }
        });
    }

    // Initialize button state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const uid = user.uid;
            updateButtonContent(uid);
        } else {
            const svg = createSvgElement(svgAddToCartUrl);
            addToCartBtn.innerHTML = '';
            addToCartBtn.appendChild(svg);
        }
    });

    // Add click event listener
    addToCartBtn.addEventListener('click', () => {
        const uid = getUid();
        if (!uid) {
            console.error('User is not authenticated');
            showNotification('Silakan login terlebih dahulu untuk menambahkan ke keranjang', false);
            return;
        }

        const cartRef = firebase.database().ref(`carts/${uid}/${produkId}`);
        const productRef = firebase.database().ref(`sellers`);

        productRef.once('value', (snapshot) => {
            let productData;
            snapshot.forEach((sellerSnapshot) => {
                sellerSnapshot.child('products').forEach((productSnapshot) => {
                    const product = productSnapshot.val();
                    if (product.sku === produkId) {
                        productData = product;
                    }
                });
            });

            if (productData) {
                cartRef.once('value', (snapshot) => {
                    if (snapshot.exists()) {
                        cartRef.remove().then(() => {
                            const svg = createSvgElement(svgAddToCartUrl);
                            addToCartBtn.innerHTML = '';
                            addToCartBtn.appendChild(svg);
                            showNotification('Produk dihapus dari keranjang', true);
                        }).catch((error) => {
                            console.error("Error removing from cart:", error);
                            showNotification('Gagal menghapus dari keranjang', false);
                        });
                    } else {
                        const cartData = {
                            sku: produkId,
                            status: true,
                            category: productData.category,
                            discount: productData.discount,
                            name: productData.name,
                            price: productData.price,
                            jenisproduk: productData.jenisproduk,
                            berat: productData.berat,
                            userID: productData.userID,
                            linkproduk: productData.linkproduk,
                            imageUrl: productData.imageUrls ? productData.imageUrls[0] : null
                        };

                        cartRef.set(cartData).then(() => {
                            const svg = createSvgElement(svgRemoveFromCartUrl);
                            addToCartBtn.innerHTML = '';
                            addToCartBtn.appendChild(svg);
                            showNotification('Produk ditambahkan ke keranjang', true);
                        }).catch((error) => {
                            console.error("Error adding to cart:", error);
                            showNotification('Gagal menambahkan ke keranjang', false);
                        });
                    }
                });
            } else {
                console.error('Product not found');
                showNotification('Produk tidak ditemukan', false);
            }
        });
    });
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isSuccess) {
    const notification = document.createElement('div');
    notification.className = `floating-notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    notification.offsetHeight;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Share button functionality
function initializeShareButton() {
    const shareButton = document.getElementById('share-button');
    const svgShareUrl = 'https://res.cloudinary.com/jejak-mufassir/image/upload/v1759384356/Icon-icon/share_ynkrjy.svg';

    console.log("Initializing share button");

    // Format currency function
    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    // Function to get normal URL
    function getNormalUrl(productId) {
        return `https://www.jejakmufassir.my.id/p/belanja.html?produk=${productId}`;
    }

    // Modified short URL generation function
    async function generateShortUrl(productId, affId = '') {
        const shortUrlsRef = firebase.database().ref('shortUrls');
        
        try {
            // First, check if a short URL already exists for this combination
            const existingUrlSnapshot = await shortUrlsRef
                .orderByChild('productId')
                .equalTo(productId)
                .once('value');
            
            const existingUrls = existingUrlSnapshot.val();
            
            if (existingUrls) {
                // For non-authenticated users or no affId, look for existing productId without affId
                if (!affId) {
                    for (const [shortCode, urlData] of Object.entries(existingUrls)) {
                        if (!urlData.affId || urlData.affId === '') {
                            return `https://jejakmufassir.my.id/${shortCode}`;
                        }
                    }
                } else {
                    // For authenticated users, look for matching affId
                    for (const [shortCode, urlData] of Object.entries(existingUrls)) {
                        if (urlData.affId === affId) {
                            return `https://jejakmufassir.my.id/${shortCode}`;
                        }
                    }
                }
            }
            
            // If no existing URL found, create new one
            const shortCode = Math.random().toString(36).substring(2, 8);
            
            const urlData = {
                productId: productId,
                affId: affId,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await shortUrlsRef.child(shortCode).set(urlData);
            return `https://jejakmufassir.my.id/${shortCode}`;
            
        } catch (error) {
            console.error('Error with short URL:', error);
            return getNormalUrl(productId);
        }
    }

    // Updated getShareLink function
    async function getShareLink(productId) {
        const currentUser = firebase.auth().currentUser;

        // If no user is logged in, generate short URL without affId
        if (!currentUser) {
            return await generateShortUrl(productId, '');
        }

        try {
            // Get user's affiliate ID
            const userRef = firebase.database().ref(`users/${currentUser.uid}/id`);
            const userSnapshot = await userRef.once('value');
            const userId = userSnapshot.val();

            if (!userId) {
                return await generateShortUrl(productId, '');
            }

            // Get product seller ID
            const productRef = firebase.database().ref('sellers');
            const productSnapshot = await productRef.once('value');
            let sellerUserId = null;

            productSnapshot.forEach((sellerSnapshot) => {
                sellerSnapshot.child('products').forEach((productSnapshot) => {
                    const product = productSnapshot.val();
                    if (product.sku === productId) {
                        sellerUserId = product.userID;
                    }
                });
            });

            // If user is the seller, generate short URL without affId
            if (userId === sellerUserId) {
                return await generateShortUrl(productId, '');
            }

            // Generate or get existing short URL with affiliate ID
            return await generateShortUrl(productId, currentUser.uid);
        } catch (error) {
            console.error('Error generating share link:', error);
            return await generateShortUrl(productId, '');
        }
    }

    // Initialize share button UI
    const img = document.createElement('img');
    img.src = svgShareUrl;
    img.style.width = '24px';
    img.style.height = '24px';
    shareButton.innerHTML = '';
    shareButton.appendChild(img);

    // Create modal for share functionality
    const modalHTML = `
        <div id="share-modal" class="share-modal">
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <span>Komisi </span>
                    <span id="commission-amount" style="margin-left: 1px;"></span>
                </div>
                <div class="url-display-box" id="share-url-box">
                    <span id="share-url-text">Loading...</span>
                </div>
                <div class="share-link-button">
                    <img src="https://res.cloudinary.com/jejak-mufassir/image/upload/v1759384356/Icon-icon/share_ynkrjy.svg" style="width: 20px; height: 20px; margin-right: 8px;">
                    Bagikan tautan
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('share-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('share-modal');
    const shareLinkButton = modal.querySelector('.share-link-button');
    const commissionAmount = document.getElementById('commission-amount');
    const shareUrlText = document.getElementById('share-url-text');

    // Load commission amount
    const produkId = getProductIdFromSpan();
    if (produkId) {
        const productRef = firebase.database().ref('sellers');
        productRef.once('value', (snapshot) => {
            snapshot.forEach((sellerSnapshot) => {
                sellerSnapshot.child('products').forEach((productSnapshot) => {
                    const product = productSnapshot.val();
                    if (product.sku === produkId) {
                        commissionAmount.textContent = `Rp ${formatCurrency(product.komisi || 0)}`;
                    }
                });
            });
        });
    }

    // Share button click event
    shareButton.addEventListener('click', async () => {
        console.log("Share button clicked");
        modal.classList.add('show');
        const shareLink = await getShareLink(produkId);
        shareUrlText.textContent = shareLink;
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Copy to clipboard function
    async function copyTextToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                textArea.remove();
                return true;
            } catch (err) {
                textArea.remove();
                return false;
            }
        }
    }

    // Share link button click event
    shareLinkButton.addEventListener('click', async () => {
        const displayedLink = shareUrlText.textContent;
        if (!displayedLink || displayedLink === 'Loading...') {
            showNotification('Gagal mendapatkan link', false);
            return;
        }
        
        const success = await copyTextToClipboard(displayedLink);
        
        if (success) {
            showNotification('Link berhasil disalin!', true);
            modal.classList.remove('show');
        } else {
            showNotification('Gagal menyalin link', false);
        }
    });
}

// Function to format time difference
function formatTimeDifference(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
        return `Aktif ${minutes} menit yang lalu`;
    } else if (hours < 24) {
        return `Aktif ${hours} jam yang lalu`;
    } else {
        return `Aktif ${days} hari yang lalu`;
    }
}

// Function to fetch and display seller info
function fetchSellerInfo(sellerId) {
    // Fetch profile picture
    const profileUrlRef = database.ref(`users/${sellerId}/profilurl`);
    profileUrlRef.once('value', (profileUrlSnapshot) => {
        const profileUrl = profileUrlSnapshot.val();
        if (profileUrl) {
            document.getElementById('seller-profile-pic').src = profileUrl;
        }
    });
    
    // Fetch last seen
    const lastSeenRef = database.ref(`users/${sellerId}/lastSeen`);
    lastSeenRef.once('value', (lastSeenSnapshot) => {
        const lastSeen = lastSeenSnapshot.val();
        if (lastSeen) {
            const lastSeenElement = document.getElementById('seller-last-seen');
            const formattedTime = formatTimeDifference(parseInt(lastSeen));
            lastSeenElement.textContent = formattedTime;
            
            // Check if inactive for more than 10 days
            const daysDiff = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60 * 24);
            if (daysDiff > 10) {
                lastSeenElement.classList.add('inactive');
            }
        }
    });
    
    // Fetch seller type
    const sellerTypeRef = database.ref(`users/${sellerId}/tipe-seller`);
    sellerTypeRef.once('value', (sellerTypeSnapshot) => {
        const sellerType = sellerTypeSnapshot.val();
        if (sellerType) {
            const sellerBadgeElement = document.getElementById('seller-badge');
            sellerBadgeElement.textContent = sellerType;
            if (sellerType === 'Star+') {
                sellerBadgeElement.classList.add('star');
            } else if (sellerType === 'Mall') {
                sellerBadgeElement.classList.add('mall');
            } else if (sellerType === 'Terverifikasi') {
                sellerBadgeElement.classList.add('terverifikasi');
            } else {
                sellerBadgeElement.style.display = 'none';
            }
        }
    });
    
    // Count products
    const productsRef = database.ref(`sellers/${sellerId}/products`);
    productsRef.once('value', (productsSnapshot) => {
        const productsCount = productsSnapshot.numChildren();
        document.getElementById('product-count').textContent = `${productsCount} Produk`;
    });
    
    // Setup visit store button
    document.getElementById('visit-store-btn').onclick = () => {
        location.href = `https://www.jejakmufassir.my.id/p/informasi-pengguna.html?id=${sellerId}`;
    };
}

// Reviews functionality
let currentPage = 1;
const reviewsPerPage = 10;
let allReviews = [];

function parseCustomDate(dateString) {
    const [datePart, timePart] = dateString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [time, period] = timePart.split(' ');
    const [hours, minutes, seconds] = time.split(':');
    
    let parsedHours = parseInt(hours);
    if (period.toLowerCase() === 'pm' && parsedHours !== 12) {
        parsedHours += 12;
    } else if (period.toLowerCase() === 'am' && parsedHours === 12) {
        parsedHours = 0;
    }
    
    return new Date(year, month - 1, day, parsedHours, minutes, seconds);
}

function getReviewData(sku) {
    console.log("Mengambil data untuk SKU:", sku);
    const reviewRef = database.ref(`testimoni/${sku}`);
    reviewRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        console.log("Data yang diterima:", data);
        if (data) {
            allReviews = Object.values(data);
            if (allReviews.length > 0) {
                allReviews.sort((a, b) => {
                    const dateA = parseCustomDate(a.timestamp);
                    const dateB = parseCustomDate(b.timestamp);
                    return dateB - dateA;
                });
                updateReviewCount(allReviews.length);
                const averageRating = allReviews.reduce((sum, review) => sum + (review.rating || 5), 0) / allReviews.length;
                updateAverageRating(averageRating);
                renderReviews();
            } else {
                console.log("Tidak ada ulasan untuk SKU:", sku);
                document.getElementById("jm-reviews-list").innerHTML = "<p>Tidak ada review untuk produk ini.</p>";
            }
        } else {
            console.log("Data tidak ditemukan untuk SKU:", sku);
            document.getElementById("jm-reviews-list").innerHTML = "<p>Tidak ada review untuk produk ini.</p>";
        }
    }).catch((error) => {
        console.error("Error saat mengambil data:", error);
    });
}

function renderReviews() {
    const container = document.getElementById("jm-reviews-list");
    container.innerHTML = '';
    
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const reviewsToShow = allReviews.slice(startIndex, endIndex);
    
    reviewsToShow.forEach(review => {
        const reviewData = {
            content: review.content || "",
            author: review.author || "Anonymous",
            rating: review.rating || 5,
            images: review.images ? review.images.split(',').map(img => img.trim()) : [],
            timestamp: review.timestamp || ""
        };
        renderReview(reviewData);
    });
    
    renderPagination();
}

function renderReview(review) {
    const container = document.getElementById("jm-reviews-list");
    const reviewElement = document.createElement("div");
    reviewElement.className = "jm-review";
    reviewElement.innerHTML = `
        <div class="jm-review-content">${review.content}</div>
        <div class="jm-review-meta">
            <div class="jm-stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
            <div>${review.author}</div>
        </div>
        <div class="jm-review-images">
            ${Array.isArray(review.images) ? review.images.map(img => `<img src="${img}" alt="Review image" onclick="openFullscreen('${img}')">`).join("") : ""}
        </div>
        <div class="jm-review-footer">
            <div></div>
            <div class="jm-review-timestamp">${review.timestamp}</div>
        </div>
    `;
    container.appendChild(reviewElement);
}

function renderPagination() {
    const totalPages = Math.ceil(allReviews.length / reviewsPerPage);
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'jm-pagination';
    
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'jm-page-button active' : 'jm-page-button';
        pageButton.onclick = () => {
            currentPage = i;
            renderReviews();
        };
        paginationContainer.appendChild(pageButton);
    }
    
    document.getElementById("jm-reviews-list").appendChild(paginationContainer);
}

function updateReviewCount(count) {
    const reviewCountElement = document.getElementById("jm-review-count");
    reviewCountElement.textContent = `(${count})`;
    reviewCountElement.classList.remove('hidden');
}

function openFullscreen(imgSrc) {
    const overlay = document.getElementById("jm-fullscreen-overlay");
    const fullscreenImg = document.getElementById("jm-fullscreen-image");
    const closeButton = document.querySelector(".jm-close-button");

    fullscreenImg.src = imgSrc;
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    // 🔥 Re-bind close event setiap kali overlay dibuka
    closeButton.onclick = () => closeFullscreen();
    overlay.onclick = (e) => {
        if (e.target === overlay) closeFullscreen();
    };
}

function closeFullscreen() {
    const overlay = document.getElementById("jm-fullscreen-overlay");
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
}

// Setup fullscreen overlay close button
function setupFullscreenOverlay() {
    const closeButton = document.querySelector('.jm-close-button');
    const overlay = document.getElementById('jm-fullscreen-overlay');
    
    if (closeButton) {
        closeButton.addEventListener('click', closeFullscreen);
    }
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeFullscreen();
            }
        });
    }
}

// Digital carousel functionality - MODIFIKASI BESAR DI SINI
(function() {
    const JMDigitalCarousel = {};

    JMDigitalCarousel.config = {
        apiKey: "AIzaSyCrdGHXxVKQ2BiU6___9fOqVDwIECLq8pk",
        authDomain: "jejak-mufassir.firebaseapp.com",
        databaseURL: "https://jejak-mufassir-default-rtdb.firebaseio.com",
        projectId: "jejak-mufassir",
        storageBucket: "jejak-mufassir.appspot.com",
        messagingSenderId: "469253249038",
        appId: "1:469253249038:web:32f85e975d23225bc9c45f",
        measurementId: "G-TXMEYE5MR8"
    };

    // Initialize Firebase only if it hasn't been initialized yet
    if (!firebase.apps.length) {
        firebase.initializeApp(JMDigitalCarousel.config);
    }

    JMDigitalCarousel.database = firebase.database();
    JMDigitalCarousel.products = [];
    JMDigitalCarousel.userCities = {};
    JMDigitalCarousel.targetSellerId = null;

    // Extract product SKU from span
    JMDigitalCarousel.getProductSkuFromSpan = function() {
        return getProductIdFromSpan();
    };

    // Find seller ID by product SKU
    JMDigitalCarousel.findSellerIdByProductSku = async function(productSku) {
        if (!productSku) return null;
        
        const sellersRef = JMDigitalCarousel.database.ref('sellers');
        const snapshot = await sellersRef.once('value');
        
        let foundSellerId = null;
        
        snapshot.forEach((sellerSnapshot) => {
            const sellerId = sellerSnapshot.key;
            const productsRef = sellerSnapshot.child('products');
            
            productsRef.forEach((productSnapshot) => {
                const product = productSnapshot.val();
                if (product.sku === productSku) {
                    foundSellerId = product.userID || sellerId;
                    return true; // Break the loop
                }
            });
            
            if (foundSellerId) return true; // Break the outer loop
        });
        
        return foundSellerId;
    };

    JMDigitalCarousel.getUserCity = function(userId) {
        return new Promise((resolve) => {
            const userCityRef = JMDigitalCarousel.database.ref('users/' + userId + '/city');
            userCityRef.once('value', (snapshot) => {
                const fullLocation = snapshot.val();
                if (fullLocation) {
                    const locationParts = fullLocation.split(', ');
                    JMDigitalCarousel.userCities[userId] = locationParts.length > 1 ? locationParts[1] : locationParts[0];
                } else {
                    JMDigitalCarousel.userCities[userId] = 'Unknown';
                }
                resolve();
            });
        });
    };

    JMDigitalCarousel.getProductImageUrls = function(sellerId, productId) {
        return new Promise((resolve) => {
            const imageUrlsRef = JMDigitalCarousel.database.ref(`sellers/${sellerId}/products/${productId}/imageUrls`);
            imageUrlsRef.once('value', (snapshot) => {
                const imageUrls = snapshot.val();
                if (imageUrls) {
                    resolve(imageUrls[0] || '');
                } else {
                    resolve('');
                }
            });
        });
    };

    // Fungsi baru untuk mendapatkan linkproduk dari Firebase
    JMDigitalCarousel.getProductLink = function(sellerId, productId) {
        return new Promise((resolve) => {
            const linkprodukRef = JMDigitalCarousel.database.ref(`sellers/${sellerId}/products/${productId}/linkproduk`);
            linkprodukRef.once('value', (snapshot) => {
                const linkproduk = snapshot.val();
                resolve(linkproduk || null);
            });
        });
    };

    JMDigitalCarousel.fetchProducts = async function() {
        // Get the product SKU from span
        const productSku = JMDigitalCarousel.getProductSkuFromSpan();
        
        // Find the seller ID for this product
        if (productSku) {
            JMDigitalCarousel.targetSellerId = await JMDigitalCarousel.findSellerIdByProductSku(productSku);
        }
        
        const sellersRef = JMDigitalCarousel.database.ref('sellers');
        const snapshot = await sellersRef.once('value');
        
        JMDigitalCarousel.products = [];
        const productPromises = [];

        snapshot.forEach((sellerSnapshot) => {
            const sellerId = sellerSnapshot.key;
            const productsRef = sellerSnapshot.child('products');
            
            productsRef.forEach((productSnapshot) => {
                const product = productSnapshot.val();
                
                // Only include digital products
                if (product.jenisproduk !== 'Digital') return;
                
                // If we have a target seller ID, only include products from that seller
                if (JMDigitalCarousel.targetSellerId && 
                    (product.userID !== JMDigitalCarousel.targetSellerId)) {
                    return;
                }
                
                product.id = productSnapshot.key;
                product.sellerId = sellerId;
                
                const productPromise = Promise.all([
                    JMDigitalCarousel.getProductImageUrls(sellerId, product.id),
                    JMDigitalCarousel.getUserCity(product.userID || sellerId),
                    JMDigitalCarousel.getProductLink(sellerId, product.id) // Ambil linkproduk
                ]).then(([imageUrl, _, linkproduk]) => {
                    // Hanya tambahkan produk jika memiliki linkproduk
                    if (linkproduk) {
                        product.imageUrl = imageUrl;
                        product.linkproduk = linkproduk; // Simpan linkproduk
                        product.timestamp = product.timestamp || Date.now();
                        JMDigitalCarousel.products.push(product);
                    }
                });

                productPromises.push(productPromise);
            });
        });

        await Promise.all(productPromises);
        JMDigitalCarousel.sortAndRenderProducts();
    };

    JMDigitalCarousel.sortAndRenderProducts = function() {
        const currentDate = new Date();

        // Helper function to check if ad is currently active
        const isAdActive = (product) => {
            if (!product.advertisment?.ad_details) return false;
            
            const adDetails = product.advertisment.ad_details;
            if (adDetails.ad_status !== 'active') return false;
            
            const startDate = new Date(adDetails.start_date);
            const endDate = new Date(adDetails.end_date);
            
            return currentDate >= startDate && currentDate <= endDate;
        };

        // Helper function to get ad score for sorting
        const getAdScore = (product) => {
            if (!isAdActive(product)) return -1;
            
            const adDetails = product.advertisment.ad_details;
            let score = 0;
            
            // Ad price priority (normalized to 0-1000 range assuming max price is 100)
            score += (adDetails.ad_price || 0) * 10;
            
            // Premium type priority
            if (adDetails.ad_type === 'premium') score += 2000;
            else if (adDetails.ad_type === 'basic') score += 1000;
            
            // Top position priority
            if (adDetails.ad_position === 'top') score += 500;
            
            // Start date priority (newer = higher score)
            const startDate = new Date(adDetails.start_date);
            score += startDate.getTime() / 1000000000; // Normalize timestamp
            
            return score;
        };

        // Sort products - prioritize ads first
        JMDigitalCarousel.products.sort((a, b) => {
            const aAdScore = getAdScore(a);
            const bAdScore = getAdScore(b);
            
            // If both are ads, compare their scores
            if (aAdScore >= 0 && bAdScore >= 0) {
                return bAdScore - aAdScore;
            }
            
            // If only one is an ad, prioritize it
            if (aAdScore >= 0) return -1;
            if (bAdScore >= 0) return 1;
            
            // For regular products, sort by rating first (max 5), then by sold count
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            if (aRating !== bRating) {
                return bRating - aRating;
            }
            
            // If ratings are equal, sort by number of sales
            const aSold = a.sold || 0;
            const bSold = b.sold || 0;
            return bSold - aSold;
        });

        JMDigitalCarousel.renderProducts();
    };

    JMDigitalCarousel.formatPrice = function(price) {
        return `Rp ${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    };

    // Function to truncate text with ellipsis and bold
    JMDigitalCarousel.truncateText = function(text, maxLength) {
        if (text.length <= maxLength) return text;
        return `<strong>${text.substring(0, maxLength)}...</strong>`;
    };

    JMDigitalCarousel.renderProducts = function() {
        const scrollContainer = document.getElementById('jmDigitalCarouselProducts');
        scrollContainer.innerHTML = '';

        // Filter only digital products
        const digitalProducts = JMDigitalCarousel.products;
        
        // Add a container title if we have a specific seller
        if (JMDigitalCarousel.targetSellerId && digitalProducts.length > 0) {
            const titleElement = document.createElement('h3');
            titleElement.style.width = '100%';
            titleElement.style.textAlign = 'left';
            titleElement.style.margin = '0 0 10px 10px';
            titleElement.textContent = 'Dari Toko yang Sama';
            scrollContainer.parentElement.insertBefore(titleElement, scrollContainer);
        }

        digitalProducts.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'jm-digital-carousel__product-card';
            
            let ratingContent = product.rating ? `<span class="jm-digital-carousel__star-icon">★</span>${product.rating}` : '';
            let soldContent = product.sold ? `${product.sold}+ terjual` : '';
            let separator = product.rating && product.sold ? ' • ' : '';
            
            // Check if product has active ad
            const isAd = product.advertisment?.ad_details?.ad_status === 'active';
            const adLabel = isAd ? '<div class="jm-digital-carousel__ad-badge">Ad</div>' : '';
            
            // Discount label
            const discountLabel = product.discount && product.discount > 0 ? 
                `<div class="jm-digital-carousel__discount-badge">-${product.discount}%</div>` : '';
            
            // Gunakan linkproduk dari Firebase, bukan URL tetap
            // Jika tidak ada linkproduk, produk tidak akan ditampilkan (karena sudah difilter sebelumnya)
            const productUrl = product.linkproduk;
            
            // Truncate product name (20 characters)
            const truncatedName = JMDigitalCarousel.truncateText(product.name, 20);

            productElement.innerHTML = `
                <div class="jm-digital-carousel__image-container">
                    <a href="${productUrl}" onclick="event.preventDefault(); window.location.href='${productUrl}';">
                        <img src="${product.imageUrl}" alt="${product.name}" class="jm-digital-carousel__product-image">
                    </a>
                    ${adLabel}
                    ${discountLabel}
                </div>
                <div class="jm-digital-carousel__product-details">
                    <div class="jm-digital-carousel__product-title">
                        <a href="${productUrl}" onclick="event.preventDefault(); window.location.href='${productUrl}';" title="${product.name}">${truncatedName}</a>
                    </div>
                    <div class="jm-digital-carousel__product-price">${JMDigitalCarousel.formatPrice(product.price)}</div>
                    <div class="jm-digital-carousel__product-metadata">
                        <div class="jm-digital-carousel__rating">${ratingContent} ${separator} ${soldContent}</div>
                    </div>
                </div>
            `;
            
            scrollContainer.appendChild(productElement);
        });
        
        // If no products found for the seller
        if (JMDigitalCarousel.targetSellerId && digitalProducts.length === 0) {
            const noProductsMsg = document.createElement('div');
            noProductsMsg.style.width = '100%';
            noProductsMsg.style.textAlign = 'center';
            noProductsMsg.style.padding = '20px';
            noProductsMsg.textContent = 'Penjual ini tidak memiliki produk digital lainnya dengan linkproduk.';
            scrollContainer.appendChild(noProductsMsg);
        }
        
        // Tambahkan event listener untuk semua link produk
        const productLinks = scrollContainer.querySelectorAll('a');
        productLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href) {
                    // Redirect ke linkproduk tanpa membuka tab baru
                    window.location.href = href;
                }
            });
        });
    };

    JMDigitalCarousel.initialize = function() {
        JMDigitalCarousel.fetchProducts();
    };

    // Initialize when the document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', JMDigitalCarousel.initialize);
    } else {
        JMDigitalCarousel.initialize();
    }
})();

// Console protection
(function() {
    const warningMessage = 'Kamu dilarang melihat console!';
    
    // Store original console methods
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        clear: console.clear
    };

    // Override console methods
    function secureConsole() {
        console.log = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
        console.info = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
        console.warn = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
        console.error = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
        console.debug = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
        console.clear = function() {
            originalConsole.warn(warningMessage);
            return undefined;
        };
    }

    // Prevent console opening shortcuts
    document.addEventListener('keydown', function(event) {
        // Prevent F12
        if (event.keyCode === 123) {
            event.preventDefault();
        }
        
        // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (event.ctrlKey && event.shiftKey && 
            (event.keyCode === 73 || event.keyCode === 74 || event.keyCode === 67)) {
            event.preventDefault();
        }
        
        // Prevent Ctrl+U
        if (event.ctrlKey && event.keyCode === 85) {
            event.preventDefault();
        }
    });

    // Prevent right click
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    // Apply console protection
    secureConsole();

    // Additional protection for console clearing
    setInterval(function() {
        secureConsole();
    }, 100);

    // Show warning in console
    console.log = function() {
        originalConsole.warn('%c' + warningMessage, 
            'color: red; font-size: 30px; font-weight: bold; text-shadow: 2px 2px 2px black;');
        return undefined;
    };
    console.log();
})();

// Panggil fungsi utama saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing product page");
    loadProductData();
    setupFullscreenOverlay();
});

// Setup slider saat window selesai load
window.addEventListener('load', function() {
    console.log("Window loaded, finalizing slider setup");
    // Pastikan slider diupdate setelah semua gambar dimuat
    setTimeout(() => {
        updateProduct1234Slider();
        updateProduct1234SliderButtons();
    }, 500);
});

// Expose functions to global scope
window.openFullscreen = openFullscreen;
window.closeFullscreen = closeFullscreen;
