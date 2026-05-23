/**
 * All Events Premium Interface JS - BDHT Ticketing Platform
 * Role: Senior Frontend Developer & UI/UX Expert
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Load dynamic header and footer from shared components
    if (window.pageUtils && window.pageUtils.loadHeader) {
        await window.pageUtils.loadHeader();
    }
    
    // Initialize premium components
    initHeroSlider();
    initFeaturedCarousel();
    initAllEventsPagination();

    if (window.pageUtils && window.pageUtils.loadFooter) {
        await window.pageUtils.loadFooter();
    }
});

// ==========================================
// 1. MOCK DATA (28 Premium Events)
// ==========================================
const eventsMockData = [
    {
        id: 1,
        name: "Liveshow HÀ NHI - Người Yêu Cũ Là Tri Kỷ",
        category: "Vé ca nhạc",
        date: "25/07/2026",
        location: "Sky Melody Ecopark, Hà Nội",
        price: "3.100.000đ",
        image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
        featured: true
    },
    {
        id: 2,
        name: "À Ố Show - Nghệ Thuật Xiếc Tre Việt Nam",
        category: "Văn hóa nghệ thuật",
        date: "15/07/2026",
        location: "Nhà Hát Lớn TP. Hồ Chí Minh",
        price: "700.000đ",
        image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800",
        featured: true
    },
    {
        id: 3,
        name: "Lễ Hội EDM - Ravolution Music Festival 2026",
        category: "Vé ca nhạc",
        date: "22/08/2026",
        location: "SECC, Quận 7, TP. HCM",
        price: "950.000đ",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800",
        featured: true
    },
    {
        id: 4,
        name: "Tinh Hoa Bắc Bộ - The Quintessence of Tonkin",
        category: "Văn hóa nghệ thuật",
        date: "12/07/2026",
        location: "Chùa Thầy, Quốc Oai, Hà Nội",
        price: "450.000đ",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800",
        featured: true
    },
    {
        id: 5,
        name: "Concert Đen Vâu - Show Của Đen 2026",
        category: "Vé ca nhạc",
        date: "05/09/2026",
        location: "SVĐ Mỹ Đình, Hà Nội",
        price: "650.000đ",
        image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800",
        featured: true
    },
    {
        id: 6,
        name: "Lễ Hội Âm Nhạc Gió Mùa - Monsoon Festival 2026",
        category: "Vé ca nhạc",
        date: "10/10/2026",
        location: "Hoàng Thành Thăng Long, Hà Nội",
        price: "800.000đ",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
        featured: true
    },
    {
        id: 7,
        name: "Vở Kịch Kinh Điển - Hamlet và Thời Đại",
        category: "Văn hóa nghệ thuật",
        date: "18/07/2026",
        location: "Nhà Hát Lớn Hà Nội",
        price: "350.000đ",
        image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=800",
        featured: false
    },
    {
        id: 8,
        name: "Tour Khám Phá Kỳ Vĩ Động Phong Nha 3 ngày",
        category: "Vé tham quan - du lịch",
        date: "Hàng ngày",
        location: "Vườn Quốc gia Phong Nha Kẻ Bàng",
        price: "2.400.000đ",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
        featured: false
    },
    {
        id: 9,
        name: "Đêm Nhạc Trữ Tình - Lệ Quyên Lỡ Hẹn",
        category: "Vé ca nhạc",
        date: "30/07/2026",
        location: "Phòng trà Không Tên, TP. HCM",
        price: "1.500.000đ",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
        featured: false
    },
    {
        id: 10,
        name: "Triển Lãm Nghệ Thuật Ánh Sáng Van Gogh Art",
        category: "Văn hóa nghệ thuật",
        date: "01/07 - 31/08/2026",
        location: "Gigamall Thủ Đức, TP. HCM",
        price: "300.000đ",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800",
        featured: false
    },
    {
        id: 11,
        name: "Tour Trekking Tà Năng Phan Dũng Cực Đẹp",
        category: "Vé tham quan - du lịch",
        date: "Thứ 6 hàng tuần",
        location: "Lâm Đồng - Bình Thuận",
        price: "3.200.000đ",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800",
        featured: false
    },
    {
        id: 12,
        name: "Vở Cải Lương Kinh Điển - Tiếng Trống Mê Linh",
        category: "Văn hóa nghệ thuật",
        date: "05/08/2026",
        location: "Nhà hát Trần Hữu Trang, TP. HCM",
        price: "250.000đ",
        image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800",
        featured: false
    },
    {
        id: 13,
        name: "Hòa Nhạc Cổ Điển - Symphony Concert No. 9",
        category: "Vé ca nhạc",
        date: "14/08/2026",
        location: "Nhà Hát Lớn Hà Nội",
        price: "600.000đ",
        image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800",
        featured: false
    },
    {
        id: 14,
        name: "Workshop Làm Gốm Thủ Công Nghệ Thuật",
        category: "Workshop",
        date: "Thứ 7 & Chủ Nhật",
        location: "Bát Tràng Hub, Hà Nội",
        price: "350.000đ",
        image: "https://images.unsplash.com/photo-1565192647048-f997ded87958?q=80&w=800",
        featured: false
    },
    {
        id: 15,
        name: "Liveshow Mỹ Tâm - Tri Âm Live Concert",
        category: "Vé ca nhạc",
        date: "25/09/2026",
        location: "SVĐ Quân Khu 7, TP. HCM",
        price: "1.200.000đ",
        image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=800",
        featured: false
    },
    {
        id: 16,
        name: "Vé Tham Quan Sun World Ba Na Hills Đà Nẵng",
        category: "Vé tham quan - du lịch",
        date: "Mở cửa hàng ngày",
        location: "Bà Nà Hills, Đà Nẵng",
        price: "900.000đ",
        image: "https://images.unsplash.com/photo-1524413840003-0507415afb3f?q=80&w=800",
        featured: false
    },
    {
        id: 17,
        name: "Giải Chạy Marathon Quốc Tế Di Sản Hà Nội",
        category: "Thể thao",
        date: "18/10/2026",
        location: "Hồ Hoàn Kiếm, Hà Nội",
        price: "750.000đ",
        image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800",
        featured: false
    },
    {
        id: 18,
        name: "Trải Nghiệm Dù Lượn Ngắm Vịnh Hạ Long",
        category: "Vé tham quan - du lịch",
        date: "Cuối tuần hàng tuần",
        location: "Hạ Long, Quảng Ninh",
        price: "1.800.000đ",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
        featured: false
    },
    {
        id: 19,
        name: "Workshop Vẽ Tranh Màu Nước Căn Bản",
        category: "Workshop",
        date: "Chủ Nhật hàng tuần",
        location: "Art Garden, Quận 3, TP. HCM",
        price: "280.000đ",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800",
        featured: false
    },
    {
        id: 20,
        name: "Show Kịch Nói Đậm Chất Đời - Dạ Cổ Hoài Lang",
        category: "Văn hóa nghệ thuật",
        date: "28/07/2026",
        location: "Sân khấu Kịch IDECAF, TP. HCM",
        price: "300.000đ",
        image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800",
        featured: false
    },
    {
        id: 21,
        name: "Đêm Nhạc Jazz Độc Đáo - Jazz Under The Stars",
        category: "Vé ca nhạc",
        date: "15/08/2026",
        location: "Lotte Sky Lounge, Hà Nội",
        price: "850.000đ",
        image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800",
        featured: false
    },
    {
        id: 22,
        name: "Tour Du Thuyền 5 Sao Ngắm Hoàng Hôn Nha Trang",
        category: "Vé tham quan - du lịch",
        date: "Hàng ngày",
        location: "Cảng Nha Trang, Khánh Hòa",
        price: "1.250.000đ",
        image: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?q=80&w=800",
        featured: false
    },
    {
        id: 23,
        name: "Workshop Pha Chế Cà Phê Specialty Thủ Công",
        category: "Workshop",
        date: "Thứ 7 hàng tuần",
        location: "The Workshop Coffee, TP. HCM",
        price: "450.000đ",
        image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800",
        featured: false
    },
    {
        id: 24,
        name: "Đại Hội Siêu Xe & Motor Thể Thao Việt Nam",
        category: "Thể thao",
        date: "20/09/2026",
        location: "Đại lộ Sala, Quận 2, TP. HCM",
        price: "150.000đ",
        image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
        featured: false
    },
    {
        id: 25,
        name: "Workshop Cắm Hoa Nghệ Thuật Phong Cách Pháp",
        category: "Workshop",
        date: "Thứ Bảy hàng tuần",
        location: "L'Amour Flower, Quận 1, TP. HCM",
        price: "600.000đ",
        image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800",
        featured: false
    },
    {
        id: 26,
        name: "Tour Cắm Trại & Săn Mây Đỉnh Langbiang",
        category: "Vé tham quan - du lịch",
        date: "Thứ 7 hàng tuần",
        location: "Langbiang, Đà Lạt",
        price: "1.450.000đ",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800",
        featured: false
    },
    {
        id: 27,
        name: "Liveshow Acoustic - Vũ. Chill Out Đêm Hè",
        category: "Vé ca nhạc",
        date: "08/08/2026",
        location: "Da Lat Wonder Resort, Đà Lạt",
        price: "900.000đ",
        image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=800",
        featured: false
    },
    {
        id: 28,
        name: "Lễ Hội Văn Hóa Ẩm Thực Việt Nam 2026",
        category: "Văn hóa nghệ thuật",
        date: "02/09 - 06/09/2026",
        location: "Công viên Thống Nhất, Hà Nội",
        price: "Vào cửa tự do",
        image: "https://images.unsplash.com/photo-1505232458627-a72726f5b710?q=80&w=800",
        featured: false
    }
];

// ==========================================
// 2. HERO SLIDER LOGIC
// ==========================================
let currentHeroSlide = 0;
let heroInterval;
const heroSlides = [
    {
        tag: "HOT LIVE CONCERT",
        title: "Liveshow HÀ NHI - Người Yêu Cũ Là Tri Kỷ",
        desc: "Đêm nhạc live hoành tráng giữa lòng thiên nhiên xanh mát Sky Melody Ecopark, đưa bạn qua những cung bậc cảm xúc khó quên.",
        img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1500",
        link: "event-detail.html?id=1",
        colorClass: "bg-orange-500"
    },
    {
        tag: "CULTURE EVENT",
        title: "À Ố Show - Nghệ Thuật Xiếc Tre Việt Nam",
        desc: "Sự kết hợp đầy lôi cuốn giữa xiếc tre truyền thống Việt Nam và nghệ thuật múa đương đại đẳng cấp quốc tế tại Nhà Hát Lớn.",
        img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1500",
        link: "event-detail.html?id=2",
        colorClass: "bg-purple-600"
    },
    {
        tag: "MUSIC FESTIVAL",
        title: "Lễ Hội EDM - Ravolution Music Festival 2026",
        desc: "Hòa mình vào bữa tiệc EDM bùng nổ của âm thanh và ánh sáng đỉnh cao với dàn DJ thuộc Top 100 thế giới tại SECC.",
        img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1500",
        link: "event-detail.html?id=3",
        colorClass: "bg-blue-600"
    }
];

function initHeroSlider() {
    const track = document.getElementById('hero-slider-track');
    const dotsContainer = document.getElementById('hero-dots-container');
    if (!track || !dotsContainer) return;

    // Render slides
    track.innerHTML = heroSlides.map(slide => `
        <div class="w-full h-full flex-shrink-0 relative">
            <img src="${slide.img}" class="w-full h-full object-cover" alt="${slide.title}">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex items-end p-8 md:p-16">
                <div class="max-w-4xl text-white">
                    <span class="${slide.colorClass} text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">${slide.tag}</span>
                    <h2 class="text-3xl md:text-5xl font-black mb-4 leading-tight">${slide.title}</h2>
                    <p class="text-xs md:text-sm font-medium opacity-90 mb-6 max-w-2xl leading-relaxed">${slide.desc}</p>
                    <a href="${slide.link}" class="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-8 py-3.5 rounded-xl transition duration-300 text-xs uppercase tracking-widest inline-block shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5">Mua Vé Ngay</a>
                </div>
            </div>
        </div>
    `).join('');

    // Render dots
    dotsContainer.innerHTML = heroSlides.map((_, idx) => `
        <span onclick="setHeroSlide(${idx})" class="w-2.5 h-2.5 rounded-full bg-white/50 cursor-pointer transition-all duration-300 hero-dot ${idx === 0 ? 'active w-5 bg-orange-500' : ''}"></span>
    `).join('');

    startHeroInterval();
}

function showHeroSlide(idx) {
    const track = document.getElementById('hero-slider-track');
    const dots = document.querySelectorAll('.hero-dot');
    if (!track) return;

    if (idx >= heroSlides.length) currentHeroSlide = 0;
    else if (idx < 0) currentHeroSlide = heroSlides.length - 1;
    else currentHeroSlide = idx;

    track.style.transform = `translateX(-${currentHeroSlide * 100}%)`;

    dots.forEach((dot, index) => {
        if (index === currentHeroSlide) {
            dot.classList.add('active', 'w-5', 'bg-orange-500');
            dot.classList.remove('bg-white/50', 'w-2.5');
        } else {
            dot.classList.remove('active', 'w-5', 'bg-orange-500');
            dot.classList.add('bg-white/50', 'w-2.5');
        }
    });
}

window.moveHeroSlide = function(n) {
    clearInterval(heroInterval);
    currentHeroSlide += n;
    showHeroSlide(currentHeroSlide);
    startHeroInterval();
};

window.setHeroSlide = function(idx) {
    clearInterval(heroInterval);
    currentHeroSlide = idx;
    showHeroSlide(currentHeroSlide);
    startHeroInterval();
};

function startHeroInterval() {
    clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        currentHeroSlide++;
        showHeroSlide(currentHeroSlide);
    }, 4000); // 4 seconds auto-scroll
}

// ==========================================
// 3. FEATURED CAROUSEL LOGIC
// ==========================================
let featuredInterval;
let isFeaturedPaused = false;

function initFeaturedCarousel() {
    const track = document.getElementById('featured-carousel-track');
    if (!track) return;

    // Filter featured items
    const featuredEvents = eventsMockData.filter(e => e.featured);

    track.innerHTML = featuredEvents.map(event => `
        <div class="flex-shrink-0 w-80 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-[400px]">
            <div class="relative w-full h-48 overflow-hidden bg-slate-100">
                <span class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider z-10">${event.category}</span>
                <img src="${event.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" alt="${event.name}">
            </div>
            <div class="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="text-base font-extrabold text-slate-900 group-hover:text-brand-purple transition-colors line-clamp-2 leading-snug tracking-tight mb-2">${event.name}</h3>
                    <p class="text-xs font-semibold text-slate-400 flex items-center gap-1.5"><i class="fas fa-map-marker-alt text-orange-500"></i> ${event.location}</p>
                </div>
                <div class="border-t border-slate-50 pt-4 flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Ngày diễn ra</span>
                        <span class="text-xs font-bold text-slate-600 flex items-center gap-1.5"><i class="far fa-calendar-alt text-brand-purple"></i> ${event.date}</span>
                    </div>
                    <a href="event-detail.html?id=${event.id}" class="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-orange-500/10 transition">Mua vé</a>
                </div>
            </div>
        </div>
    `).join('');

    // Auto-scroll loop
    startFeaturedInterval();

    // Hover listeners
    track.addEventListener('mouseenter', () => { isFeaturedPaused = true; });
    track.addEventListener('mouseleave', () => { isFeaturedPaused = false; });

    // Arrow buttons
    const btnPrev = document.getElementById('featured-prev');
    const btnNext = document.getElementById('featured-next');

    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            clearInterval(featuredInterval);
            track.scrollLeft -= 340;
            startFeaturedInterval();
        });
        btnNext.addEventListener('click', () => {
            clearInterval(featuredInterval);
            track.scrollLeft += 340;
            startFeaturedInterval();
        });
    }
}

function startFeaturedInterval() {
    clearInterval(featuredInterval);
    featuredInterval = setInterval(() => {
        const track = document.getElementById('featured-carousel-track');
        if (!track || isFeaturedPaused) return;

        // Auto-scroll right
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 5) {
            track.scrollLeft = 0; // wrap around smoothly
        } else {
            track.scrollLeft += 2; // pixel-by-pixel micro-scrolling
        }
    }, 25);
}

// ==========================================
// 4. PAGINATION LOGIC (ALL EVENTS SECTION)
// ==========================================
let currentPage = 1;
const itemsPerPage = 16;
let filteredEvents = [...eventsMockData];
let currentCategory = "Tất cả";

function initAllEventsPagination() {
    setupPaginationFilters();
    renderPaginationEvents();
}

function setupPaginationFilters() {
    const chips = document.querySelectorAll('.pagination-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => {
                c.classList.remove('bg-brand-purple', 'text-white', 'border-brand-purple');
                c.classList.add('bg-white', 'text-slate-650', 'border-slate-200');
            });
            chip.classList.add('bg-brand-purple', 'text-white', 'border-brand-purple');
            chip.classList.remove('bg-white', 'text-slate-650', 'border-slate-200');

            currentCategory = chip.getAttribute('data-category');
            currentPage = 1; // Reset to page 1

            filterEvents();
        });
    });

    const searchInput = document.getElementById('all-events-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            filterEvents();
        });
    }
}

function filterEvents() {
    const searchInput = document.getElementById('all-events-search');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    filteredEvents = eventsMockData.filter(event => {
        const matchesCategory = currentCategory === "Tất cả" || event.category === currentCategory;
        const matchesKeyword = event.name.toLowerCase().includes(keyword) || 
                               event.location.toLowerCase().includes(keyword);
        return matchesCategory && matchesKeyword;
    });

    renderPaginationEvents();
}

function renderPaginationEvents() {
    const grid = document.getElementById('all-events-grid');
    const controls = document.getElementById('pagination-controls');
    if (!grid || !controls) return;

    // Slicing math
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredEvents.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16 flex flex-col items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl mb-4 shadow-inner"><i class="fas fa-search"></i></div>
                <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">Không tìm thấy sự kiện nào</h3>
                <p class="text-[10px] text-slate-400 font-bold">Hãy thử thay đổi danh mục hoặc từ khóa tìm kiếm</p>
            </div>
        `;
        controls.innerHTML = '';
        return;
    }

    grid.innerHTML = paginatedItems.map(event => `
        <a href="event-detail.html?id=${event.id}" class="group block bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-purple/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-[360px]">
            <div class="relative w-full h-40 overflow-hidden bg-slate-100 flex-shrink-0">
                <img src="${event.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" alt="${event.name}">
                <div class="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 font-extrabold text-[10px] px-3 py-1.5 rounded-full shadow-sm z-10">${event.price}</div>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-[9px] font-extrabold text-brand-orange uppercase tracking-widest mb-1 inline-block">${event.category}</span>
                    <h3 class="text-xs font-extrabold text-slate-800 group-hover:text-brand-purple transition-colors line-clamp-2 leading-snug tracking-tight">${event.name}</h3>
                </div>
                <div class="border-t border-slate-50 pt-3 mt-3 flex flex-col gap-1.5 text-[10px] font-bold text-slate-400">
                    <span class="flex items-center gap-1.5"><i class="fas fa-map-marker-alt text-slate-300"></i> ${event.location}</span>
                    <span class="flex items-center gap-1.5 text-slate-600"><i class="far fa-calendar-alt text-brand-purple"></i> ${event.date}</span>
                </div>
            </div>
        </a>
    `).join('');

    renderPaginationControls();
}

function renderPaginationControls() {
    const controls = document.getElementById('pagination-controls');
    if (!controls) return;

    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    if (totalPages <= 1) {
        controls.innerHTML = '';
        return;
    }

    let buttonsHTML = '';

    // Prev Button
    buttonsHTML += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-sm">
            <i class="fas fa-chevron-left text-xs"></i>
        </button>
    `;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        buttonsHTML += `
            <button onclick="changePage(${i})" class="w-10 h-10 rounded-full border ${isActive ? 'bg-brand-purple text-white border-brand-purple' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'} font-extrabold text-xs flex items-center justify-center transition shadow-sm">
                ${i}
            </button>
        `;
    }

    // Next Button
    buttonsHTML += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-sm">
            <i class="fas fa-chevron-right text-xs"></i>
        </button>
    `;

    controls.innerHTML = buttonsHTML;
}

window.changePage = function(pageNum) {
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    if (pageNum < 1 || pageNum > totalPages) return;

    currentPage = pageNum;
    renderPaginationEvents();

    // Scroll smoothly to All Events grid top
    const gridEl = document.getElementById('all-events-section-title');
    if (gridEl) {
        gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
