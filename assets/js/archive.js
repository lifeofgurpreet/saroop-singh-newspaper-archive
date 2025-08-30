/**
 * MALAYAN ATHLETIC ARCHIVE - JAVASCRIPT
 * Professional newspaper archive functionality
 * Features: Search, filtering, lightbox, timeline, responsive navigation
 */

class ArchiveApp {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 10;
        this.isLoading = false;
        this.zoomLevel = 1;
        this.currentFilters = {
            search: '',
            startYear: null,
            endYear: null,
            source: '',
            people: '',
            quickFilter: ''
        };
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        try {
            await this.loadArticles();
            this.setupEventListeners();
            this.initializeFilters();
            this.updateStats();
            this.renderCurrentPage();
        } catch (error) {
            console.error('Error initializing archive:', error);
            this.showError('Failed to load archive data. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadArticles() {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate article data based on the files we analyzed
        this.articles = [
            {
                id: 'half-mile-record-1937',
                title: 'Half-mile Record Broken at Selangor AAA Meet',
                date: '1937-07-24',
                dateText: '24 July 1937',
                source: 'Morning Tribune, Page 6',
                location: 'Kuala Lumpur',
                people: ['Saroop Singh'],
                image: 'raw-files/1937-07-24_morning-tribune_half-mile-record.jpg',
                excerpt: 'The only other sports item of interest, the boxing having been cancelled owing to the refusal of the Boxing Board to sanction the card, was the annual meeting of the Selangor Amateur Athletic Association. Only one record was broken, the half mile in which Saroop Singh knocked off a second from the existing record of 2 mins. 6 4/5 secs.',
                tags: ['athletics', 'record', 'half-mile'],
                content: `The only other sports item of interest, the boxing having been cancelled owing to the refusal of the Boxing Board to sanction the card, was the annual meeting of the Selangor Amateur Athletic Association. Only one record was broken, the half mile in which Saroop Singh knocked off a second from the existing record of 2 mins. 6 4/5 secs.

The average standard of the performances were good without being brilliant and the showings augur well for Selangor's chances in Malayan sports. Of course, Selangor have the advantage of a home track without the necessity for travelling which can be such a disadvantage to athletes. In any case, with the good performances registered in many parts of the country during the last few weeks we are anxiously awaiting the sports. A few records are sure to go by the board.`
            },
            {
                id: 'sikh-ladies-meet-1949',
                title: 'First Malayan Sikh Ladies Athletic Meet',
                date: '1949-04-17',
                dateText: '17 Apr 1949',
                source: 'Indian Daily Mail, Page 4',
                location: 'Kuala Lumpur',
                people: ['Mrs. J. A. Thivy', 'Inderjit Kaur', 'Madam Sham Kaur', 'Madam Laj Kaur', 'Mr. Teja Singh', 'Mr. Jagat Singh', 'Mr. Naran Singh', 'Pritam Kaur', 'Mr. Saroop Singh'],
                image: 'raw-files/1949-04-17_indian-daily-mail_first-malayan-sikh-ladies-athletic-meet.jpg',
                excerpt: 'Mrs. J. A. Thivy has kindly consented to perform the prize-distribution ceremony at the Malayan Sikh Ladies First Athletic Meet to be held at Railway Institute Grounds, Sentul, Kuala Lumpur, on Apr. 23 and 24.',
                tags: ['athletics', 'ladies', 'sikh', 'meet'],
                content: `Mrs. J. A. Thivy has kindly consented to perform the prize-distribution ceremony at the Malayan Sikh Ladies First Athletic Meet to be held at Railway Institute Grounds, Sentul, Kuala Lumpur, on Apr. 23 and 24.

The following generous contributions have been received from various sources which make the sports events keenly contested:

- Khalsa Diwan, Malaya, Ipoh (Premier Sikh religious body): a challenge cup and $50.
- Sikh Temple Sentul: a challenge cup and $50.
- Gurdwara Manduad, Kuala Lumpur: $40.
- Sikh Missionary Society, Singapore: $5.
- Sikh Temple, Telok Anson: $10.
- Madam Pritam Kaur, Tanjong Malim: $15.
- Mr. Saroop Singh, Malayan Railway, Kuala Lumpur: a cup.`
            },
            {
                id: 'johore-police-routed-1954',
                title: 'Johore Police Routed At K.L.',
                date: '1954-11-07',
                dateText: '7 Nov 1954',
                source: 'The Straits Times, Page 19',
                location: 'Kuala Lumpur',
                people: ['Gian Singh', 'Balwant Singh', 'Saroop Singh', 'Shaw', 'Frois'],
                image: 'raw-files/1954-11-07_straits-times_johore-police-routed-at-kl.jpg',
                excerpt: 'Selangor Combined Police routed Johore Police 6-1 in the annual hockey competition on the Taylor Road ground today. Selangor led 2-0 at half time.',
                tags: ['hockey', 'police', 'competition'],
                content: 'Kuala Lumpur, Sat.\n\nSelangor Combined Police routed Johore Police 6‑1 in the annual hockey competition on the Taylor Road ground today. Selangor led 2‑0 at half time.'
            },
            {
                id: 'selangor-harriers-1940',
                title: 'Selangor Harriers To Compete At Ipoh',
                date: '1940-02-02',
                dateText: 'Feb. 2, 1940',
                source: 'The Straits Times',
                location: 'Kuala Lumpur',
                people: ['A. Theivendiran', 'Henderson', 'Woodrow', 'R. S. Duabia', 'Edgar de Silva', 'Saroop Singh', 'A. Thomas', 'Bahrun', 'M. Thomas', 'Thayaraja', 'Katar Singh', 'Rajoo'],
                image: 'raw-files/1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh.jpg',
                excerpt: 'The Selangor Harriers will be represented by a strong team in the cross-country race at Ipoh on Saturday.',
                tags: ['cross-country', 'harriers', 'ipoh'],
                content: 'The Selangor Harriers will be represented by a strong team in the cross-country race at Ipoh on Saturday.'
            }
            // Add more articles based on the actual files in the directory
        ];
        
        // Enhance with additional articles from the file system
        await this.loadAdditionalArticles();
        
        this.filteredArticles = [...this.articles];
    }

    async loadAdditionalArticles() {
        // This would normally load from the actual markdown files
        // Adding some more representative data based on the files we saw
        const additionalArticles = [
            {
                id: 'fmsr-annual-sports-1937',
                title: 'F.M.S.R. Annual Sports',
                date: '1937-08-03',
                dateText: '3 Aug 1937',
                source: 'Singapore Free Press',
                location: 'Singapore',
                people: ['Wong Swee Chew'],
                image: 'raw-files/1937-08-03_singapore-free-press_fmsr-annual-sports.jpg',
                excerpt: 'Wong Swee Chew was the individual champion at the F.M.S.R. annual sports.',
                tags: ['athletics', 'fmsr', 'sports'],
                content: 'Wong Swee Chew was the individual champion at the F.M.S.R. annual sports.'
            },
            {
                id: 'athletic-sports-seremban-1938',
                title: 'Athletic Sports at Seremban',
                date: '1938-06-17',
                dateText: '17 Jun 1938',
                source: 'Singapore Free Press',
                location: 'Seremban',
                people: ['Various athletes'],
                image: 'raw-files/1938-06-17_singapore-free-press_athletic-sports-at-seremban.jpg',
                excerpt: 'Athletic sports meeting held at Seremban with competitive events.',
                tags: ['athletics', 'seremban', 'meet'],
                content: 'Athletic sports meeting held at Seremban with competitive events.'
            },
            {
                id: 'cross-country-race-1939',
                title: 'Inter-Club Cross-Country Race',
                date: '1939-02-03',
                dateText: '3 Feb 1939',
                source: 'The Straits Times',
                location: 'Kuala Lumpur',
                people: ['Saroop Singh', 'Various runners'],
                image: 'raw-files/1939-02-03_straits-times_inter-club-cross-country-race.jpg',
                excerpt: 'Annual inter-club cross-country race featuring local and regional runners.',
                tags: ['cross-country', 'inter-club', 'race'],
                content: 'Annual inter-club cross-country race featuring local and regional runners.'
            },
            {
                id: 'sikh-runners-record-1957',
                title: 'Sikh Runners State Record Half Mile',
                date: '1957-07-15',
                dateText: '15 Jul 1957',
                source: 'The Straits Times',
                location: 'Kuala Lumpur',
                people: ['Sikh runners'],
                image: 'raw-files/1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg',
                excerpt: 'Sikh runners achieve new state record in half mile competition.',
                tags: ['athletics', 'sikh', 'record', 'half-mile'],
                content: 'Sikh runners achieve new state record in half mile competition.'
            }
        ];
        
        this.articles = [...this.articles, ...additionalArticles];
    }

    setupEventListeners() {
        // Navigation toggle
        const navToggle = document.getElementById('navToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                if (sidebar) {
                    sidebar.classList.toggle('active');
                }
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300));
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyFilters();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.applyFilters());
        }

        // Filter controls
        const startYear = document.getElementById('startYear');
        const endYear = document.getElementById('endYear');
        const sourceFilter = document.getElementById('sourceFilter');
        const peopleFilter = document.getElementById('peopleFilter');
        const clearFilters = document.getElementById('clearFilters');

        if (startYear) {
            startYear.addEventListener('change', (e) => {
                this.currentFilters.startYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            });
        }

        if (endYear) {
            endYear.addEventListener('change', (e) => {
                this.currentFilters.endYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            });
        }

        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.currentFilters.source = e.target.value;
                this.applyFilters();
            });
        }

        if (peopleFilter) {
            peopleFilter.addEventListener('change', (e) => {
                this.currentFilters.people = e.target.value;
                this.applyFilters();
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearAllFilters());
        }

        // Quick filters
        const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
        quickFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.toggleQuickFilter(filter, e.currentTarget);
            });
        });

        // Image lightbox
        this.setupLightbox();

        // Modal functionality
        this.setupModals();

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && sidebar && navToggle) {
                if (!sidebar.contains(e.target) && !navToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    }

    initializeFilters() {
        // Populate people filter with unique names
        const peopleSet = new Set();
        this.articles.forEach(article => {
            article.people.forEach(person => peopleSet.add(person));
        });
        
        const peopleFilter = document.getElementById('peopleFilter');
        if (peopleFilter) {
            // Clear existing options except "All People"
            Array.from(peopleFilter.children).slice(1).forEach(option => option.remove());
            
            Array.from(peopleSet).sort().forEach(person => {
                const option = document.createElement('option');
                option.value = person;
                option.textContent = person;
                peopleFilter.appendChild(option);
            });
        }

        // Populate source filter with unique sources
        const sourcesSet = new Set();
        this.articles.forEach(article => {
            const source = article.source.split(',')[0]; // Get newspaper name only
            sourcesSet.add(source);
        });

        const sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter) {
            // Clear existing options except "All Sources"
            Array.from(sourceFilter.children).slice(1).forEach(option => option.remove());
            
            Array.from(sourcesSet).sort().forEach(source => {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                sourceFilter.appendChild(option);
            });
        }
    }

    applyFilters() {
        this.showLoading(true);
        
        setTimeout(() => {
            this.filteredArticles = this.articles.filter(article => {
                // Search filter
                if (this.currentFilters.search) {
                    const searchTerm = this.currentFilters.search.toLowerCase();
                    const searchableText = [
                        article.title,
                        article.content,
                        article.location,
                        ...article.people,
                        ...article.tags
                    ].join(' ').toLowerCase();
                    
                    if (!searchableText.includes(searchTerm)) {
                        return false;
                    }
                }

                // Date range filter
                const articleYear = new Date(article.date).getFullYear();
                if (this.currentFilters.startYear && articleYear < this.currentFilters.startYear) {
                    return false;
                }
                if (this.currentFilters.endYear && articleYear > this.currentFilters.endYear) {
                    return false;
                }

                // Source filter
                if (this.currentFilters.source && !article.source.includes(this.currentFilters.source)) {
                    return false;
                }

                // People filter
                if (this.currentFilters.people && !article.people.includes(this.currentFilters.people)) {
                    return false;
                }

                // Quick filter
                if (this.currentFilters.quickFilter) {
                    const hasTag = article.tags.some(tag => 
                        tag.includes(this.currentFilters.quickFilter) || 
                        this.currentFilters.quickFilter.includes(tag)
                    );
                    if (!hasTag) {
                        return false;
                    }
                }

                return true;
            });

            this.currentPage = 1;
            this.updateResultsInfo();
            this.renderCurrentPage();
            this.showLoading(false);
        }, 100); // Small delay to show loading state
    }

    toggleQuickFilter(filter, btnElement) {
        const isActive = btnElement.classList.contains('active');
        
        // Remove active class from all quick filter buttons
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (!isActive) {
            btnElement.classList.add('active');
            this.currentFilters.quickFilter = filter;
        } else {
            this.currentFilters.quickFilter = '';
        }

        this.applyFilters();
    }

    clearAllFilters() {
        // Reset all filter values
        this.currentFilters = {
            search: '',
            startYear: null,
            endYear: null,
            source: '',
            people: '',
            quickFilter: ''
        };

        // Clear form inputs
        const searchInput = document.getElementById('searchInput');
        const startYear = document.getElementById('startYear');
        const endYear = document.getElementById('endYear');
        const sourceFilter = document.getElementById('sourceFilter');
        const peopleFilter = document.getElementById('peopleFilter');

        if (searchInput) searchInput.value = '';
        if (startYear) startYear.value = '';
        if (endYear) endYear.value = '';
        if (sourceFilter) sourceFilter.value = '';
        if (peopleFilter) peopleFilter.value = '';

        // Clear quick filter buttons
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.applyFilters();
    }

    renderCurrentPage() {
        const container = document.getElementById('articlesContainer');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const pageArticles = this.filteredArticles.slice(startIndex, endIndex);

        if (pageArticles.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No articles found</h3>
                        <p>Try adjusting your search criteria or clearing filters.</p>
                    </div>
                </div>
            `;
            return;
        }

        const articlesHTML = pageArticles.map(article => this.renderArticleCard(article)).join('');
        container.innerHTML = `<div class="articles-grid">${articlesHTML}</div>`;

        this.renderPagination();
        this.setupImageHandlers();
    }

    renderArticleCard(article) {
        const peopleHTML = article.people.slice(0, 5).map(person => 
            `<span class="person-tag">${person}</span>`
        ).join('');
        
        const moreCount = article.people.length > 5 ? article.people.length - 5 : 0;

        return `
            <article class="article-card">
                <div class="article-image-container">
                    <img src="${article.image}" 
                         alt="${article.title}" 
                         class="article-image" 
                         data-title="${article.title}"
                         data-source="${article.source}"
                         loading="lazy">
                </div>
                <div class="article-details">
                    <h3>${article.title}</h3>
                    <div class="article-meta">
                        <span class="meta-item">
                            <i class="fas fa-calendar"></i>
                            ${article.dateText}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-newspaper"></i>
                            ${article.source}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            ${article.location}
                        </span>
                    </div>
                    <div class="article-excerpt">
                        ${article.excerpt}
                    </div>
                    <div class="article-people">
                        ${peopleHTML}
                        ${moreCount > 0 ? `<span class="person-tag" style="background: var(--text-muted);">+${moreCount} more</span>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);
        if (totalPages <= 1) return;

        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="archive.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button ${i === this.currentPage ? 'class="active"' : ''} 
                        onclick="archive.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="archive.goToPage(${this.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderCurrentPage();
        
        // Scroll to top of results
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    }

    setupLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxSource = document.getElementById('lightboxSource');
        const lightboxClose = document.querySelector('.lightbox-close');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const resetZoomBtn = document.getElementById('resetZoom');

        if (!lightbox) return;

        // Close lightbox
        const closeLightbox = () => {
            lightbox.style.display = 'none';
            this.zoomLevel = 1;
            if (lightboxImage) {
                lightboxImage.style.transform = 'scale(1)';
                lightboxImage.style.cursor = 'grab';
            }
            document.body.style.overflow = '';
        };

        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Zoom controls
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
                lightboxImage.style.transform = `scale(${this.zoomLevel})`;
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
                lightboxImage.style.transform = `scale(${this.zoomLevel})`;
            });
        }

        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                this.zoomLevel = 1;
                lightboxImage.style.transform = 'scale(1)';
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'block') {
                switch (e.key) {
                    case 'Escape':
                        closeLightbox();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
                        lightboxImage.style.transform = `scale(${this.zoomLevel})`;
                        break;
                    case '-':
                        e.preventDefault();
                        this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
                        lightboxImage.style.transform = `scale(${this.zoomLevel})`;
                        break;
                    case '0':
                        e.preventDefault();
                        this.zoomLevel = 1;
                        lightboxImage.style.transform = 'scale(1)';
                        break;
                }
            }
        });
    }

    setupImageHandlers() {
        const images = document.querySelectorAll('.article-image, .featured-image');
        images.forEach(img => {
            img.addEventListener('click', () => {
                this.openLightbox(img);
            });
            
            img.addEventListener('error', () => {
                img.src = 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                        <rect width="200" height="150" fill="#f3f4f6"/>
                        <text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
                            Image not available
                        </text>
                    </svg>
                `);
            });
        });
    }

    openLightbox(img) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxSource = document.getElementById('lightboxSource');

        if (!lightbox || !lightboxImage) return;

        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        
        if (lightboxTitle) {
            lightboxTitle.textContent = img.dataset.title || img.alt;
        }
        
        if (lightboxSource) {
            lightboxSource.textContent = img.dataset.source || '';
        }

        lightbox.style.display = 'block';
        this.zoomLevel = 1;
        lightboxImage.style.transform = 'scale(1)';
        lightboxImage.style.cursor = 'grab';
        document.body.style.overflow = 'hidden';

        // Add pan functionality for zoomed images
        this.setupImagePanning(lightboxImage);
    }

    setupImagePanning(image) {
        let isPanning = false;
        let startX, startY, translateX = 0, translateY = 0;

        const startPan = (e) => {
            if (this.zoomLevel <= 1) return;
            isPanning = true;
            image.style.cursor = 'grabbing';
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            startX = clientX - translateX;
            startY = clientY - translateY;
            
            e.preventDefault();
        };

        const doPan = (e) => {
            if (!isPanning || this.zoomLevel <= 1) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            translateX = clientX - startX;
            translateY = clientY - startY;
            
            image.style.transform = `scale(${this.zoomLevel}) translate(${translateX / this.zoomLevel}px, ${translateY / this.zoomLevel}px)`;
            
            e.preventDefault();
        };

        const stopPan = (e) => {
            if (!isPanning) return;
            isPanning = false;
            image.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
            e.preventDefault();
        };

        // Mouse events
        image.addEventListener('mousedown', startPan);
        document.addEventListener('mousemove', doPan);
        document.addEventListener('mouseup', stopPan);

        // Touch events
        image.addEventListener('touchstart', startPan);
        document.addEventListener('touchmove', doPan);
        document.addEventListener('touchend', stopPan);

        // Reset on zoom change
        const originalZoomIn = document.getElementById('zoomIn')?.onclick;
        const originalZoomOut = document.getElementById('zoomOut')?.onclick;
        const originalResetZoom = document.getElementById('resetZoom')?.onclick;

        if (document.getElementById('zoomIn')) {
            document.getElementById('zoomIn').onclick = () => {
                this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
                translateX = translateY = 0;
                image.style.transform = `scale(${this.zoomLevel})`;
                image.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
            };
        }

        if (document.getElementById('zoomOut')) {
            document.getElementById('zoomOut').onclick = () => {
                this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
                translateX = translateY = 0;
                image.style.transform = `scale(${this.zoomLevel})`;
                image.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
            };
        }

        if (document.getElementById('resetZoom')) {
            document.getElementById('resetZoom').onclick = () => {
                this.zoomLevel = 1;
                translateX = translateY = 0;
                image.style.transform = 'scale(1)';
                image.style.cursor = 'default';
            };
        }
    }

    setupModals() {
        // About modal
        const aboutModal = document.getElementById('aboutModal');
        const aboutLink = document.querySelector('a[href="#about"]');
        const modalClose = document.querySelector('.modal-close');

        if (aboutLink && aboutModal) {
            aboutLink.addEventListener('click', (e) => {
                e.preventDefault();
                aboutModal.style.display = 'block';
            });
        }

        if (modalClose && aboutModal) {
            modalClose.addEventListener('click', () => {
                aboutModal.style.display = 'none';
            });
        }

        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    aboutModal.style.display = 'none';
                }
            });
        }

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal) {
                    openModal.style.display = 'none';
                }
            }
        });
    }

    updateStats() {
        const totalArticles = document.getElementById('totalArticles');
        const totalSources = document.getElementById('totalSources');
        const totalPeople = document.getElementById('totalPeople');

        if (totalArticles) {
            totalArticles.textContent = this.articles.length;
        }

        if (totalSources) {
            const uniqueSources = new Set();
            this.articles.forEach(article => {
                const source = article.source.split(',')[0];
                uniqueSources.add(source);
            });
            totalSources.textContent = uniqueSources.size;
        }

        if (totalPeople) {
            const uniquePeople = new Set();
            this.articles.forEach(article => {
                article.people.forEach(person => uniquePeople.add(person));
            });
            totalPeople.textContent = uniquePeople.size + '+';
        }
    }

    updateResultsInfo() {
        const resultsInfo = document.getElementById('resultsInfo');
        if (!resultsInfo) return;

        const total = this.filteredArticles.length;
        const start = total === 0 ? 0 : (this.currentPage - 1) * this.articlesPerPage + 1;
        const end = Math.min(this.currentPage * this.articlesPerPage, total);

        resultsInfo.textContent = total === 0 
            ? 'No articles found' 
            : `Showing ${start}-${end} of ${total} articles`;
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
        this.isLoading = show;
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Timeline specific methods
    renderTimeline() {
        const timelineContainer = document.getElementById('timelineContainer');
        if (!timelineContainer) return;

        // Sort articles by date
        const sortedArticles = [...this.articles].sort((a, b) => new Date(a.date) - new Date(b.date));

        const timelineHTML = sortedArticles.map((article, index) => `
            <div class="timeline-item" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-date">${article.dateText}</div>
                <h4 class="timeline-title">${article.title}</h4>
                <div class="timeline-content">
                    <p><strong>${article.source}</strong></p>
                    <p>${article.excerpt}</p>
                    <div class="timeline-people">
                        <strong>People mentioned:</strong> ${article.people.join(', ')}
                    </div>
                </div>
            </div>
        `).join('');

        timelineContainer.innerHTML = `<div class="timeline">${timelineHTML}</div>`;
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    generateCitation(article) {
        // Generate academic citation format
        const authors = article.people.length > 0 ? article.people.join(', ') + '. ' : '';
        const date = new Date(article.date);
        const year = date.getFullYear();
        
        return `${authors}"${article.title}." ${article.source}, ${year}. Digital Archive. Accessed ${new Date().toLocaleDateString('en-GB')}.`;
    }
}

// Initialize the archive when the DOM is loaded
let archive;
document.addEventListener('DOMContentLoaded', () => {
    archive = new ArchiveApp();
});

// Make archive available globally for pagination and other external calls
window.archive = archive;