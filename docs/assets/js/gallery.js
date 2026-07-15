/*
 * Photo Gallery Component for MkDocs Material
 * Auto-initializes Swiper (Cards) + LightGallery from .photo-gallery elements
 *
 * Usage in Markdown:
 *   <div class="photo-gallery">
 *     <img src="/path/to/1.jpg" alt="Photo caption">
 *     <video src="/path/to/video.mp4" alt="Video caption"></video>
 *   </div>
 *
 * Optional data attributes:
 *   data-effect="cards"        Swiper effect (cards | coverflow | slide)
 *   data-autoplay="3000"       Autoplay delay in ms (false to disable)
 *   data-height="500"          Fixed height in px
 */

(function () {
    'use strict';

    /**
     * Initialize a single photo gallery
     */
    function initGallery(container) {
        // Collect all media: images and videos
        var mediaEls = container.querySelectorAll('img, video');
        if (mediaEls.length === 0) return;

        // Build slides HTML for Swiper, track type per item
        var lgItems = [];
        var slideCount = mediaEls.length;
        var slides = Array.from(mediaEls).map(function (el, i) {
            var src = el.getAttribute('src');
            var alt = el.getAttribute('alt') || '';
            var isVideo = el.tagName.toLowerCase() === 'video';

            if (isVideo) {
                var poster = el.getAttribute('poster') || '';
                lgItems.push({
                    src: src,
                    subHtml: alt,
                    type: 'video'
                });
                return '<div class="swiper-slide swiper-slide-video" data-src="' + src + '" data-type="video" data-sub-html="' + escapeHtml(alt) + '">'
                    + '<video src="' + src + '"' + (poster ? ' poster="' + escapeAttr(poster) + '"' : '') + ' preload="metadata" playsinline></video>'
                    + '</div>';
            } else {
                lgItems.push({
                    src: src,
                    subHtml: alt,
                    type: 'image'
                });
                return '<div class="swiper-slide" data-src="' + src + '" data-type="image" data-sub-html="' + escapeHtml(alt) + '">'
                    + '<img src="' + src + '" alt="' + escapeAttr(alt) + '">'
                    + '</div>';
            }
        });

        // Read config from data attributes
        var effect = container.getAttribute('data-effect') || 'cards';
        var autoplayDelay = container.getAttribute('data-autoplay');
        var fixedHeight = container.getAttribute('data-height');

        // Create structure: arrows + pagination in a single control bar
        var html = '<div class="swiper"><div class="swiper-wrapper">'
            + slides.join('')
            + '</div>'
            + '</div>'
            + '<div class="gallery-controls">'
            + '<button class="gallery-arrow gallery-arrow-prev" type="button" aria-label="上一张">&lsaquo;</button>'
            + '<div class="swiper-pagination"></div>'
            + '<button class="gallery-arrow gallery-arrow-next" type="button" aria-label="下一张">&rsaquo;</button>'
            + '</div>'
            + '<div class="gallery-counter"></div>'
            + '<div class="gallery-caption"></div>';

        container.innerHTML = html;

        var swiperEl = container.querySelector('.swiper');
        var prevBtn = container.querySelector('.gallery-arrow-prev');
        var nextBtn = container.querySelector('.gallery-arrow-next');
        var captionEl = container.querySelector('.gallery-caption');
        var counterEl = container.querySelector('.gallery-counter');

        // Swiper config — no loop to avoid cards-effect glitches
        var swiperConfig = {
            effect: effect,
            loop: false,
            speed: 400,
            touchRatio: 0.45,
            threshold: 10,
            pagination: {
                el: container.querySelector('.swiper-pagination'),
                clickable: true,
                dynamicBullets: slideCount > 6,
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            grabCursor: true,
            watchSlidesProgress: true,
            on: {
                init: function () {
                    updateCaptionAndCounter(this, mediaEls, captionEl, counterEl);
                },
                slideChange: function () {
                    updateCaptionAndCounter(this, mediaEls, captionEl, counterEl);
                },
            },
        };

        // Cards effect: wider offset for more visible stacking
        if (effect === 'cards') {
            swiperConfig.cardsEffect = {
                perSlideOffset: 6,
                perSlideRotate: 4,
                rotate: true,
                slideShadows: true,
            };
        }

        // Fixed height
        if (fixedHeight) {
            swiperEl.style.height = fixedHeight + 'px';
        }

        // Autoplay via setInterval — more reliable than Swiper's built-in module w/ Cards
        var hasAutoplay = autoplayDelay && autoplayDelay !== 'false';
        var autoplayTimer = null;
        var autoplayPaused = false;

        // Initialize Swiper
        var swiper = new Swiper(swiperEl, swiperConfig);

        if (hasAutoplay) {
            var delay = parseInt(autoplayDelay, 10) || 3000;
            autoplayTimer = setInterval(function () {
                if (autoplayPaused) return;
                if (swiper.isEnd) swiper.slideTo(0);
                else swiper.slideNext();
            }, delay);

            // Pause on hover
            container.addEventListener('mouseenter', function () { autoplayPaused = true; });
            container.addEventListener('mouseleave', function () { autoplayPaused = false; });
        }

        // Custom arrows — manual wrap for no-loop mode
        prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!swiper.isBeginning) swiper.slidePrev();
            else swiper.slideTo(slideCount - 1);
        });
        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!swiper.isEnd) swiper.slideNext();
            else swiper.slideTo(0);
        });

        // Click handler — open LightGallery, using swiper.activeIndex for reliability
        var slideEls = container.querySelectorAll('.swiper-slide');
        slideEls.forEach(function (slide) {
            slide.addEventListener('click', function () {
                var idx = swiper.activeIndex;
                if (idx < 0 || idx >= lgItems.length) idx = 0;

                var el = document.createElement('div');
                el.style.display = 'none';
                document.body.appendChild(el);

                el.innerHTML = lgItems.map(function (item) {
                    if (item.type === 'video') {
                        return '<a data-sub-html="' + escapeHtml(item.subHtml) + '" data-video=\'{"source": [{"src":"' + item.src + '", "type":"video/mp4"}], "attributes": {"preload": false, "playsinline": true, "controls": true}}\'>'
                            + '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />'
                            + '</a>';
                    }
                    return '<a data-src="' + item.src + '" data-sub-html="' + escapeHtml(item.subHtml) + '">'
                        + '<img src="' + item.src + '" />'
                        + '</a>';
                }).join('');

                lightGallery(el, {
                    dynamic: false,
                    download: false,
                    index: idx,
                    plugins: [lgZoom, lgThumbnail, lgFullscreen, lgVideo, lgAutoplay, lgPager],
                    mobileSettings: { showCloseIcon: true, controls: true },
                });

                // Open the gallery at the correct slide
                setTimeout(function () {
                    var link = el.querySelectorAll('a')[idx];
                    if (link) link.click();
                }, 80);

                // Sync Swiper back to where LG left off, then cleanup
                el.addEventListener('lgAfterClose', function (event) {
                    swiper.slideTo(event.detail.instance.index);
                    setTimeout(function () { el.remove(); }, 300);
                });
            });
        });
    }

    /**
     * Update caption and counter display
     */
    function updateCaptionAndCounter(swiper, mediaEls, captionEl, counterEl) {
        var realIndex = swiper.realIndex;
        if (realIndex >= 0 && realIndex < mediaEls.length) {
            var alt = mediaEls[realIndex].getAttribute('alt') || '';
            captionEl.textContent = alt;
            counterEl.textContent = (realIndex + 1) + ' / ' + mediaEls.length;
        }
    }

    /**
     * Escape HTML for safe insertion
     */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Escape attribute value
     */
    function escapeAttr(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * Initialize all galleries on the page
     */
    function initAllGalleries() {
        var galleries = document.querySelectorAll('.photo-gallery');
        galleries.forEach(function (gallery) {
            initGallery(gallery);
        });
    }

    // Auto-init: wait for DOM + external scripts (Swiper, LightGallery)
    function waitForDeps(callback, retries) {
        retries = retries || 0;
        if (typeof Swiper !== 'undefined' && typeof lightGallery !== 'undefined') {
            callback();
        } else if (retries < 50) {
            setTimeout(function () {
                waitForDeps(callback, retries + 1);
            }, 200);
        } else {
            console.warn('[Gallery] Swiper or LightGallery not loaded after 10s. Giving up.');
        }
    }

    // Also support MkDocs Material instant loading (page transitions)
    if (document.querySelector('.photo-gallery')) {
        waitForDeps(initAllGalleries);
    }

    // Re-init on MkDocs Material page transitions
    document.addEventListener('DOMContentLoaded', function () {
        if (document.querySelector('.photo-gallery')) {
            waitForDeps(initAllGalleries);
        }
    });

    // Listen for Material for MkDocs instant navigation
    if (typeof document$ !== 'undefined') {
        document$.subscribe(function () {
            // Small delay to let DOM settle after navigation
            setTimeout(function () {
                if (document.querySelector('.photo-gallery')) {
                    waitForDeps(initAllGalleries);
                }
            }, 150);
        });
    }

})();
