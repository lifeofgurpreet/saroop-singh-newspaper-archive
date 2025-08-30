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
        this.isMobile = window.innerWidth <= 768;
        this.scrollThreshold = 100;
        this.currentFilters = {
            search: '',
            startYear: null,
            endYear: null,
            source: '',
            people: '',
            quickFilter: ''
        };
        
        this.initModernFeatures();
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        try {
            await this.loadArticles();
            this.setupEventListeners();
            this.setupModernInteractions();
            this.initializeFilters();
            this.updateStats();
            this.renderCurrentPage();
            this.initScrollAnimations();
        } catch (error) {
            console.error('Error initializing archive:', error);
            this.showError('Failed to load archive data. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    initModernFeatures() {
        // Modern browser feature detection
        this.hasIntersectionObserver = 'IntersectionObserver' in window;
        this.hasBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
        this.hasTouch = 'ontouchstart' in window;
        
        // Set up responsive handlers
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Initialize modern scroll features
        
        // Update mobile visibility on initialization
        this.updateMobileFilterVisibility();
        
        // Initialize scroll to top
        this.initScrollToTop();
    }

    setupModernInteractions() {
        this.setupFloatingFilterButton();
        this.setupMobileFilterSheet();
        this.setupAdvancedSearch();
        this.setupSmoothAnimations();
        this.setupTouchGestures();
    }

    setupFloatingFilterButton() {
        const floatingBtn = document.getElementById('floatingFilterBtn');
        const mobileSheet = document.getElementById('mobileFilterSheet');
        const overlay = document.getElementById('mobileFilterOverlay');
        
        if (floatingBtn && mobileSheet && overlay) {
            floatingBtn.addEventListener('click', () => {
                mobileSheet.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                this.populateMobileFilters();
            });
            
            const closeBtn = document.getElementById('sheetCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeMobileFilterSheet();
                });
            }
            
            overlay.addEventListener('click', () => {
                this.closeMobileFilterSheet();
            });
        }
    }

    setupMobileFilterSheet() {
        // Mobile filter sheet is handled in setupFloatingFilterButton
        // Update visibility based on screen size
        this.updateMobileFilterVisibility();
    }

    setupAdvancedSearch() {
        // Enhanced search functionality is already handled in setupEventListeners
        // This method can be used for future advanced search features
        console.log('Advanced search features initialized');
    }

    setupSmoothAnimations() {
        // Add CSS classes for smooth animations if not already present
        if (!document.querySelector('#smooth-animations-style')) {
            const style = document.createElement('style');
            style.id = 'smooth-animations-style';
            style.textContent = `
                .smooth-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .fade-in { opacity: 0; animation: fadeInAnimation 0.5s ease forwards; }
                @keyframes fadeInAnimation { to { opacity: 1; } }
                .slide-up { transform: translateY(20px); opacity: 0; animation: slideUpAnimation 0.5s ease forwards; }
                @keyframes slideUpAnimation { to { transform: translateY(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
        }
    }

    setupTouchGestures() {
        // Add touch gesture support for mobile devices
        if (this.hasTouch) {
            document.addEventListener('touchstart', (e) => {
                // Handle touch start for better mobile UX
                const target = e.target.closest('.modern-filter-pill, .btn, .article-image');
                if (target) {
                    target.style.transform = 'scale(0.98)';
                }
            });

            document.addEventListener('touchend', (e) => {
                // Handle touch end
                const target = e.target.closest('.modern-filter-pill, .btn, .article-image');
                if (target) {
                    setTimeout(() => {
                        target.style.transform = '';
                    }, 150);
                }
            });
        }
    }

    closeMobileFilterSheet() {
        const mobileSheet = document.getElementById('mobileFilterSheet');
        const overlay = document.getElementById('mobileFilterOverlay');
        
        if (mobileSheet) mobileSheet.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    populateMobileFilters() {
        const mobileContent = document.getElementById('mobileFiltersContent');
        if (!mobileContent) return;

        // Clone desktop filters into mobile sheet
        const sidebarContent = document.querySelector('.sidebar-content');
        if (sidebarContent) {
            mobileContent.innerHTML = sidebarContent.innerHTML;
        }
    }

    updateMobileFilterVisibility() {
        const floatingBtn = document.getElementById('floatingFilterBtn');
        if (floatingBtn) {
            floatingBtn.style.display = this.isMobile ? 'flex' : 'none';
        }
    }

    initScrollToTop() {
        const scrollButton = document.getElementById('scrollToTop');
        if (!scrollButton) return;
        
        const toggleScrollButton = () => {
            if (window.pageYOffset > this.scrollThreshold) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', this.debounce(toggleScrollButton, 100));
        
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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
                image: '/raw-files/1937-07-24_morning-tribune_half-mile-record.jpg',
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
                image: '/raw-files/1949-04-17_indian-daily-mail_first-malayan-sikh-ladies-athletic-meet.jpg',
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
                image: '/raw-files/1954-11-07_straits-times_johore-police-routed-at-kl.jpg',
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
                image: '/raw-files/1940-02-02_straits-times_selangor-harriers-to-compete-at-ipoh.jpg',
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
                image: '/raw-files/1937-08-03_singapore-free-press_fmsr-annual-sports.jpg',
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
                image: '/raw-files/1938-06-17_singapore-free-press_athletic-sports-at-seremban.jpg',
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
                image: '/raw-files/1939-02-03_straits-times_inter-club-cross-country-race.jpg',
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
                image: '/raw-files/1957-07-15_straits-times_sikh-runners-state-record-half-mile.jpg',
                excerpt: 'Sikh runners achieve new state record in half mile competition.',
                tags: ['athletics', 'sikh', 'record', 'half-mile'],
                content: 'Sikh runners achieve new state record in half mile competition.'
            }
        ];
        
        this.articles = [...this.articles, ...additionalArticles];
    }

    setupEventListeners() {
        // Navigation toggle with modern animations
        const navToggle = document.getElementById('navToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (navToggle) {
            navToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar(sidebar);
            });
        }

        // Enhanced search functionality
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                const value = e.target.value;
                this.currentFilters.search = value;
                this.updateClearSearchVisibility(value);
                this.applyFiltersWithAnimation();
            }, 300));
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyFiltersWithAnimation();
                }
            });
            
            // Focus animations
            searchInput.addEventListener('focus', () => {
                searchInput.closest('.search-input-container')?.classList.add('focused');
            });
            
            searchInput.addEventListener('blur', () => {
                searchInput.closest('.search-input-container')?.classList.remove('focused');
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Enhanced filter controls with animations
        const startYear = document.getElementById('startYear');
        const endYear = document.getElementById('endYear');
        const sourceFilter = document.getElementById('sourceFilter');
        const peopleFilter = document.getElementById('peopleFilter');
        const clearFilters = document.getElementById('clearFilters');

        if (startYear) {
            startYear.addEventListener('change', (e) => {
                this.currentFilters.startYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFiltersWithAnimation();
                this.addFilterAnimation(e.target);
            });
        }

        if (endYear) {
            endYear.addEventListener('change', (e) => {
                this.currentFilters.endYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFiltersWithAnimation();
                this.addFilterAnimation(e.target);
            });
        }

        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.currentFilters.source = e.target.value;
                this.applyFiltersWithAnimation();
                this.addFilterAnimation(e.target);
            });
        }

        if (peopleFilter) {
            peopleFilter.addEventListener('change', (e) => {
                this.currentFilters.people = e.target.value;
                this.applyFiltersWithAnimation();
                this.addFilterAnimation(e.target);
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearAllFiltersWithAnimation());
        }

        // Modern quick filters with enhanced interactions
        const quickFilterBtns = document.querySelectorAll('.modern-filter-pill');
        quickFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.toggleModernQuickFilter(filter, e.currentTarget);
            });
            
            // Add hover sound effect (optional)
            if (this.hasTouch) {
                btn.addEventListener('touchstart', () => {
                    btn.style.transform = 'scale(0.95)';
                });
                btn.addEventListener('touchend', () => {
                    btn.style.transform = '';
                });
            }
        });

        // Image lightbox
        this.setupLightbox();

        // Modal functionality
        this.setupModals();

        // Modern sidebar interactions
        document.addEventListener('click', (e) => {
            if (this.isMobile && sidebar && navToggle) {
                if (!sidebar.contains(e.target) && !navToggle.contains(e.target)) {
                    this.closeSidebar(sidebar);
                }
            }
        });

        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar(sidebar);
                this.closeMobileFilterSheet();
                this.closeAnyOpenModals();
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

    applyFiltersWithAnimation() {
        this.showLoadingWithPulse(true);
        
        // Add skeleton loading to results area
        this.showSkeletonLoading();
        
        setTimeout(() => {
            this.filteredArticles = this.articles.filter(article => {
                // Search filter with fuzzy matching
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
            this.updateFilterCounts();
            this.updateActiveFiltersDisplay();
            this.renderCurrentPage();
            this.showLoadingWithPulse(false);
        }, 300); // Slightly longer delay for better UX
    }

    toggleModernQuickFilter(filter, btnElement) {
        const isActive = btnElement.classList.contains('active');
        
        // Remove active class from all filter pills with animation
        document.querySelectorAll('.modern-filter-pill').forEach(btn => {
            btn.classList.remove('active');
            btn.style.transform = '';
        });

        if (!isActive) {
            btnElement.classList.add('active');
            this.currentFilters.quickFilter = filter;
            // Add bounce animation
            btnElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                btnElement.style.transform = '';
            }, 200);
        } else {
            this.currentFilters.quickFilter = '';
        }

        this.applyFiltersWithAnimation();
        this.addRippleEffect(btnElement);
    }

    clearAllFiltersWithAnimation() {
        // Add clearing animation
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                clearBtn.style.transform = '';
            }, 150);
        }

        // Reset all filter values
        this.currentFilters = {
            search: '',
            startYear: null,
            endYear: null,
            source: '',
            people: '',
            quickFilter: ''
        };

        // Clear form inputs with animations
        const searchInput = document.getElementById('searchInput');
        const startYear = document.getElementById('startYear');
        const endYear = document.getElementById('endYear');
        const sourceFilter = document.getElementById('sourceFilter');
        const peopleFilter = document.getElementById('peopleFilter');

        const clearWithAnimation = (element) => {
            if (element) {
                element.style.transition = 'all 0.3s ease';
                element.style.transform = 'scale(0.98)';
                element.value = '';
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            }
        };

        clearWithAnimation(searchInput);
        clearWithAnimation(startYear);
        clearWithAnimation(endYear);
        clearWithAnimation(sourceFilter);
        clearWithAnimation(peopleFilter);

        // Clear quick filter buttons with stagger animation
        document.querySelectorAll('.modern-filter-pill').forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.remove('active');
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 100);
            }, index * 50);
        });

        this.updateClearSearchVisibility('');
        this.applyFiltersWithAnimation();
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

        const articlesHTML = pageArticles.map((article, index) => {
            const cardHTML = this.renderArticleCard(article);
            return `<div class="article-wrapper" style="animation-delay: ${index * 0.1}s">${cardHTML}</div>`;
        }).join('');
        
        container.innerHTML = `<div class="articles-grid fade-in">${articlesHTML}</div>`;

        // Add smooth animations to cards
        setTimeout(() => {
            const cards = container.querySelectorAll('.article-wrapper');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('slide-up');
                }, index * 100);
            });
        }, 100);

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

    showLoadingWithPulse(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
            if (show) {
                loadingOverlay.classList.add('pulse-animation');
            } else {
                loadingOverlay.classList.remove('pulse-animation');
            }
        }
        this.isLoading = show;
    }

    showSkeletonLoading() {
        const container = document.getElementById('articlesContainer');
        if (container) {
            const skeletonHTML = Array.from({length: 3}, () => `
                <div class="modern-card skeleton-card">
                    <div class="skeleton-image skeleton"></div>
                    <div class="card-content">
                        <div class="skeleton-title skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text skeleton" style="width: 60%;"></div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = `<div class="grid-3">${skeletonHTML}</div>`;
        }
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

    // Enhanced utility methods
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

    // Modern UI Helper Methods
    addRippleEffect(element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 600ms linear;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    addFilterAnimation(element) {
        element.classList.add('filter-changed');
        setTimeout(() => {
            element.classList.remove('filter-changed');
        }, 300);
    }

    updateClearSearchVisibility(value) {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            if (value.trim()) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.currentFilters.search = '';
            this.updateClearSearchVisibility('');
            this.applyFiltersWithAnimation();
            searchInput.focus();
        }
    }

    updateFilterCounts() {
        // Update quick filter counts
        const pillCounts = {
            'athletics': this.articles.filter(a => a.tags.some(tag => tag.includes('athletic'))).length,
            'hockey': this.articles.filter(a => a.tags.some(tag => tag.includes('hockey'))).length,
            'cross-country': this.articles.filter(a => a.tags.some(tag => tag.includes('cross-country'))).length,
            'record': this.articles.filter(a => a.tags.some(tag => tag.includes('record'))).length
        };
        
        Object.entries(pillCounts).forEach(([key, count]) => {
            const countElement = document.querySelector(`[data-count="${key}"]`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
        
        // Update main filter count
        const activeFilterCount = this.getActiveFilterCount();
        const filterCountElement = document.getElementById('filterCount');
        const floatingCountElement = document.getElementById('floatingFilterCount');
        
        if (filterCountElement) {
            filterCountElement.textContent = activeFilterCount;
        }
        if (floatingCountElement) {
            floatingCountElement.textContent = activeFilterCount;
        }
    }
    
    getActiveFilterCount() {
        let count = 0;
        if (this.currentFilters.search) count++;
        if (this.currentFilters.startYear) count++;
        if (this.currentFilters.endYear) count++;
        if (this.currentFilters.source) count++;
        if (this.currentFilters.people) count++;
        if (this.currentFilters.quickFilter) count++;
        return count;
    }
    
    updateActiveFiltersDisplay() {
        const activeFiltersContainer = document.getElementById('activeFilters');
        if (!activeFiltersContainer) return;
        
        const activeFilters = [];
        
        if (this.currentFilters.search) {
            activeFilters.push({ type: 'search', value: this.currentFilters.search });
        }
        if (this.currentFilters.startYear) {
            activeFilters.push({ type: 'startYear', value: `From ${this.currentFilters.startYear}` });
        }
        if (this.currentFilters.endYear) {
            activeFilters.push({ type: 'endYear', value: `To ${this.currentFilters.endYear}` });
        }
        if (this.currentFilters.source) {
            activeFilters.push({ type: 'source', value: this.currentFilters.source });
        }
        if (this.currentFilters.people) {
            activeFilters.push({ type: 'people', value: this.currentFilters.people });
        }
        if (this.currentFilters.quickFilter) {
            activeFilters.push({ type: 'quickFilter', value: this.currentFilters.quickFilter });
        }
        
        activeFiltersContainer.innerHTML = activeFilters.map(filter => `
            <span class="active-filter-tag">
                ${filter.value}
                <i class="fas fa-times remove-filter" onclick="archive.removeFilter('${filter.type}')"></i>
            </span>
        `).join('');
    }
    
    removeFilter(filterType) {
        switch (filterType) {
            case 'search':
                this.currentFilters.search = '';
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
                this.updateClearSearchVisibility('');
                break;
            case 'startYear':
                this.currentFilters.startYear = null;
                const startYear = document.getElementById('startYear');
                if (startYear) startYear.value = '';
                break;
            case 'endYear':
                this.currentFilters.endYear = null;
                const endYear = document.getElementById('endYear');
                if (endYear) endYear.value = '';
                break;
            case 'source':
                this.currentFilters.source = '';
                const sourceFilter = document.getElementById('sourceFilter');
                if (sourceFilter) sourceFilter.value = '';
                break;
            case 'people':
                this.currentFilters.people = '';
                const peopleFilter = document.getElementById('peopleFilter');
                if (peopleFilter) peopleFilter.value = '';
                break;
            case 'quickFilter':
                this.currentFilters.quickFilter = '';
                document.querySelectorAll('.modern-filter-pill').forEach(btn => {
                    btn.classList.remove('active');
                });
                break;
        }
        
        this.applyFiltersWithAnimation();
    }

    handleResize() {
        this.isMobile = window.innerWidth <= 768;
        this.updateMobileFilterVisibility();
        
        // Update sidebar visibility
        const sidebar = document.getElementById('sidebar');
        if (sidebar && this.isMobile) {
            sidebar.classList.remove('active');
        }
    }

    closeAnyOpenModals() {
        // Close all modals
        const modals = document.querySelectorAll('.modal[style*="block"]');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        // Close lightbox
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'block') {
            lightbox.style.display = 'none';
        }
    }

    toggleSidebar(sidebar) {
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    closeSidebar(sidebar) {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
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

// Modern app initialization with feature detection
let archive;
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animation support detection
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        .skeleton-card {
            animation: pulse 1.5s ease-in-out infinite alternate;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            100% { opacity: 0.4; }
        }
        .filter-changed {
            transform: scale(1.02);
            transition: transform 0.3s ease;
        }
        .pulse-animation {
            animation: pulse 1s infinite;
        }
        .focused {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }
    `;
    document.head.appendChild(style);
    
    archive = new ArchiveApp();
});

// Make archive available globally for pagination and other external calls
window.archive = archive;

// Add modern browser performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        if (loadTime > 3000) {
            console.warn('Archive loaded slowly:', loadTime + 'ms');
        }
    });
}