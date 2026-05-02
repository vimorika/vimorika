"use strict";
//GENERAL HELPER FUNCTIONS
const getStyle = (el, prop) => window.getComputedStyle(el, null).getPropertyValue(prop);
//
const parseJsonString = jsonString => JSON.parse(jsonString);
const hasValidDatasetAttribute = (el, attr) => !!el.dataset?.[attr];
const getJson = (el, attr) => hasValidDatasetAttribute(el, attr) ? parseJsonString(el.dataset[attr]) : {};
//
const getX = e => e.touches ? e.touches[0].clientX : e.clientX;
//
const getTransAmountX = el => new WebKitCSSMatrix(getComputedStyle(el).transform).m41;
//
const toggleClass = (element, className, add) => element?.classList[add ? 'add' : 'remove'](className);
//
const rdDecimal = (val, n) => Math.round((val + Number.EPSILON) * n * 10) / (n * 10);
//----------
//SPECIFIC HELPER FUNCTIONS
//Get option
const getOption = (el, attr, option, defltVal) => {
    const obj = getJson(el, attr);
    return Object.prototype.hasOwnProperty.call(obj, option) && obj[option] !== null && obj[option] !== "" ? obj[option] : defltVal;
}
//----------
//MAIN FUNCTION
document.addEventListener("DOMContentLoaded", () => {
    const sliders = Array.from(document.querySelectorAll(".vimorika"));
    sliders?.forEach(setUpSlider);
});
function setUpSlider(slider) {
    //DECLARE HIGHEST SCOPE VARIABLES
    let index;
    let isTransition = false;
    let play = false;
    let apInterval;
    let apCorrectDur;
    let apTimeout;
    //----------
    //GET ELEMENTS
    const viewport = slider.querySelector(".vimorika-viewport");
    const track = viewport.querySelector(".vimorika-track");
    const slides = Array.from(track.children);
    const prevBtn = slider.querySelector(".vimorika-prev");
    const nextBtn = slider.querySelector(".vimorika-next");
    const firstBtn = slider.querySelector(".vimorika-first");
    const lastBtn = slider.querySelector(".vimorika-last");
    const pagination = slider.querySelector(".vimorika-pagination");
    const pagInput = slider.querySelector(".vimorika-input");
    const playBtn = slider.querySelector(".vimorika-play");
    const timerBar = slider.querySelector(".vimorika-timerbar");
    const fullscreenBtn = slider.querySelector(".vimorika-fullscreen");
    const countInfo = slider.querySelector(".vimorika-count");
    const totalInfo = slider.querySelector(".vimorika-total");
    const progressBar = slider.querySelector(".vimorika-progressbar");
    //----------
    //DECLARE NON CREATED YET ELEMENTS
    let pagTrack, pagSelectors, liveRegion;
    //----------
    //GET DATA
    const len = slides.length;
    const isRTL = getStyle(slider, "direction") === "rtl";
    const role = getOption(slider, "options", "role", "region");
    const startIndex = getOption(slider, "options", "start-index", 1) - 1;
    const gapRem = getOption(slider, "options", "gap-rem", 0);
    const isNumSelector = getOption(slider, "options", "numbered-selector", false);
    const swipeDist = getOption(slider, "options", "swipe-distance", 50);
    let trDur = getOption(slider, "options", "transition-duration", 500);
    const trDelay = getOption(slider, "options", "transition-delay", 0);
    const isStartAutoplaying = getOption(slider, "options", "start-autoplaying", false);
    let apDur = getOption(slider, "options", "autoplay-duration", 5000);
    const scrollEasing = getOption(slider, "options", "scroll-easing", "linear");
    const isAnimationsOff = getOption(slider, "options", "animations-off", false);
    //----------
    //Get i18n
    const i18nPrev = getOption(slider, "i18n", "prev", "previous");
    const i18nNext = getOption(slider, "i18n", "next", "next");
    const i18nFirst = getOption(slider, "i18n", "first", "first");
    const i18nLast = getOption(slider, "i18n", "last", "last");
    const i18nSlide = getOption(slider, "i18n", "slide", "slide");
    const i18nOf = getOption(slider, "i18n", "of", "of");
    const i18nGoto = getOption(slider, "i18n", "goto", "go to");
    const i18nPlay = getOption(slider, "i18n", "play", "start autoplay");
    const i18nPause = getOption(slider, "i18n", "pause", "pause autoplay");
    const i18nEnterF = getOption(slider, "i18n", "enterF", "enter fullscreen");
    const i18nExitF = getOption(slider, "i18n", "exitF", "exit fullscreen");
    const i18nSlider = getOption(slider, "i18n", "slider", "slider");
    const i18nInput = getOption(slider, "i18n", "input", `type a number`);
    //----------
    //CREATE AND GET NEW ELEMENTS BASED ON DATA
    const initPag = () => {
        if (pagination?.children.length === 0) {
            const ul = document.createElement("ul");
            for (let i = 0; i < len; i++) {
                const li = document.createElement("li");
                const btn = document.createElement("button");
                toggleClass(btn, "vimorika-selector", true);
                if (isNumSelector) btn.textContent = `${i + 1}`;
                li.appendChild(btn);
                ul.appendChild(li);
            }
            pagination.appendChild(ul);
        }
        pagTrack = pagination?.querySelector("ul");
        if (pagTrack) pagSelectors = [...pagTrack.querySelectorAll(".vimorika-selector")];
    }
    //
    const createLiveregion = () => {
        const lr = document.createElement('div');
        lr.setAttribute("aria-live", "polite");
        lr.setAttribute("aria-atomic", "true");
        lr.setAttribute("class", "vimorika-liveregion");
        lr.tabIndex = -1;
        slider.appendChild(lr);
        liveRegion = slider.querySelector(".vimorika-liveregion");
    }
    //----------
    //DECLARE FUNCTIONS
    const initIndex = () => index = isRTL ? -startIndex : startIndex;
    //
    const initPagInput = () => {
        if (!pagInput) return;
        Object.assign(pagInput, {
            step: 1,
            min: 1,
            max: len,
            value: Math.abs(index) + 1
        });
    }
    //
    const initAriaSlider = () => {
        slider.setAttribute('role', role);
        slider.setAttribute('aria-roledescription', i18nSlider);
    }
    //
    const initAriaBtns = () => {
        nextBtn?.setAttribute('aria-label', `${i18nGoto} ${i18nNext} ${i18nSlide}`);
        prevBtn?.setAttribute('aria-label', `${i18nGoto} ${i18nPrev} ${i18nSlide}`);
        firstBtn?.setAttribute('aria-label', `${i18nGoto} ${i18nFirst} ${i18nSlide}`);
        lastBtn?.setAttribute('aria-label', `${i18nGoto} ${i18nLast} ${i18nSlide}`);
        pagInput?.setAttribute('aria-label', i18nInput);
        fullscreenBtn?.setAttribute('aria-label', i18nEnterF);
        playBtn?.setAttribute('aria-label', isStartAutoplaying ? i18nPause : i18nPlay);
    }
    //
    const initSlides = () => {
        slides.forEach((x, i) => {
            x.tabIndex = 0;
            x.setAttribute('role', 'tabpanel');
            x.setAttribute('aria-roledescription', i18nSlide);
            x.setAttribute('aria-label', `${i18nSlide} ${i + 1} ${i18nOf} ${len}`);
        });
    }
    //
    const initSelectors = () => {
        pagSelectors?.forEach((x, i) => {
            x.setAttribute('role', 'tab');
            x.setAttribute('aria-label', `${i18nGoto} ${i18nSlide} ${i + 1} ${i18nOf} ${len}`);
        });
    }
    //
    const turnOffAnimations = () => isAnimationsOff && toggleClass(slider, "animations-off", true)
    //
    const setCountInfo = () => { if (countInfo) countInfo.textContent = Math.abs(index) + 1 };
    //
    const setTotalInfo = () => { if (totalInfo) totalInfo.textContent = len };
    //
    const initTimerbarAnimDur = () => { if (timerBar) timerBar.style.animationDuration = `${apDur}ms` };
    //
    const updateProgressbar = (t) => {
        if (!progressBar) return;
        progressBar.style.transitionDelay = `${trDelay}ms`;
        progressBar.style.transitionDuration = `${t}ms`;
        progressBar.style.width = `${rdDecimal(((Math.abs(index) + 1) / len) * 100, 2)}%`;
    }
    //
    const rtlIndexBackward = () => index > 1 - len ? index - 1 : index;
    //
    const indexForward = () => index < len - 1 ? index + 1 : index;
    //
    const rtlIndexForward = () => index < 0 ? index + 1 : index;
    //
    const indexBackward = () => index > 0 ? index - 1 : index;
    //
    const nextSetIndex = () => index = isRTL ? rtlIndexBackward : indexForward;
    //
    const prevSetIndex = () => index = isRTL ? rtlIndexForward : indexBackward;
    //
    const firstSetIndex = () => index = 0;
    //
    const lastSetIndex = () => index = isRTL ? -(len - 1) : len - 1;
    //
    const indexSign = () => isRTL ? -1 : 1;
    //
    const pagSelectorsSetIndex = i => index = i * indexSign;
    //
    const arrowrightSetIndex = () => index = isRTL ? rtlIndexForward : indexForward;
    //
    const arrowleftSetIndex = () => index = isRTL ? rtlIndexBackward : indexBackward;
    //
    const tabSetIndex = (slide) => index = slides.indexOf(slide) * indexSign;
    //
    const pagInputSetIndex = () => index = (pagInput.value - 1) * indexSign;
    //
    const apSetIndex = () => isRTL ? (index <= 1 - len ? firstSetIndex() : arrowleftSetIndex()) : (index >= len - 1 ? firstSetIndex() : arrowrightSetIndex());
    //
    const updatePagInput = e => pagInput && e?.target !== pagInput && (pagInput.value = Math.abs(index) + 1);
    //
    const toggleActiveClass = (elements) => elements?.forEach((el, i) => el.classList.toggle('active', i === Math.abs(index)));
    const activateSelector = () => toggleActiveClass(pagSelectors);
    const activateSlide = () => toggleActiveClass(slides);

    //
    const disableDirBtns = () => {
        [
            { buttons: [nextBtn, lastBtn], cond1: index <= 1 - len, cond2: index >= len - 1 },
            { buttons: [prevBtn, firstBtn], cond1: index >= 0, cond2: index <= 0 }
        ].forEach(({ buttons, cond1, cond2 }) =>
            buttons?.forEach(btn => { if (btn) btn.disabled = isRTL ? cond1 : cond2 })
        );
    };
    //
    const setTrDur = () => track.style.transitionDuration = `${trDur}ms`;
    //
    const flitX = () => track.style.transform = `translate3d(calc(${-index * 100}% - ${index * gapRem}rem), 0, 0)`;
    //
    const track_addEL_transitionrun = () => track.addEventListener("transitionrun", (e) => {
        if (e.propertyName === 'transform' && e.target === e.currentTarget) {
            isTransition = true;
            slider.classList.remove("transition-start");
            slider.classList.remove("transition-end");
            slider.classList.add("transition-run");            
        }
        e.stopPropagation();
    });
    const track_addEL_transitionstart = () => track.addEventListener("transitionstart", (e) => {
        if (e.propertyName === 'transform' && e.target === e.currentTarget) {
            slider.classList.remove("transition-end");
            slider.classList.remove("transition-run");
            slider.classList.add("transition-start");
        }
        e.stopPropagation();
    });
    //
    const track_addEL_transitionend = () => track.addEventListener("transitionend", (e) => {
        if (e.propertyName === 'transform' && e.target === e.currentTarget) {
            isTransition = false;
            slider.classList.remove("transition-run");
            slider.classList.remove("transition-start");
            slider.classList.add("transition-end");
        }
        e.stopPropagation();
    });
    //
    const pauseMedia = () => slides.forEach((slide, i) => i !== index && Array.from(slide.querySelectorAll('video, audio')).forEach(media => !media.paused && media.pause()));
    //
    // Easing functions that mimic CSS3 easing functions
    const easingFunctions = {
        linear: t => t,
        ease: t => 0.25 * (1 - Math.cos(Math.PI * t)),
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    };
    // Scroll animation function
    const animateScroll = (container, start, targetPosition, duration, easingFunction, startTime) => {
        const currentTime = performance.now();
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easingFunctions[easingFunction](progress);
        container.scrollLeft = start + targetPosition * ease;
        if (timeElapsed < duration) {
            requestAnimationFrame(() => animateScroll(container, start, targetPosition, duration, easingFunction, startTime));
        }
    };
    // Main scroll function
    const scrollToElement = (container, element, duration, easingFunction, isAnimationsOff) => {
        const start = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const elementLeft = element.getBoundingClientRect().left - container.getBoundingClientRect().left;
        const elementWidth = element.offsetWidth;
        const targetPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        if (isAnimationsOff) {
            container.scrollLeft = start + targetPosition;
        } else {
            const startTime = performance.now();
            requestAnimationFrame(() => animateScroll(container, start, targetPosition, duration, easingFunction, startTime));
        }
    };
    //
    const slidesSetAria = () => slides.forEach((slide, i) => slide.setAttribute('aria-hidden', i !== index));
    //
    const selectorsSetAria = () => pagSelectors?.forEach((selector, i) => selector.setAttribute('aria-selected', i === index));
    //
    const updateLiveregion = () => liveRegion.textContent = `${i18nSlide} ${Math.abs(index) + 1} ${i18nOf} ${len}`;
    //
    const updateSlider = (e) => {
        setTrDur();
        track.style.transitionDelay = `${trDelay}ms`;
        if (pagTrack) scrollToElement(pagination, pagSelectors[Math.abs(index)], trDur, scrollEasing, isAnimationsOff);
        updateProgressbar(trDur);
        flitX();
        activateSlide();
        activateSelector();
        selectorsSetAria();
        setCountInfo();
        updatePagInput(e);
        disableDirBtns();
        pauseMedia();
        setTimeout(() => {
            slidesSetAria();
            updateLiveregion();
        }, trDelay);
    }
    //
    const startAutoplay = () => {
        play = true;
        apInterval = setInterval(autoplayRepeat, apCorrectDur);
    }
    const stopPlayProgress = (bar) => bar?.getAnimations().forEach(animation => animation.cancel());
    const clearAutoPlay = () => {
        toggleClass(playBtn, "enabled", false);
        playBtn.setAttribute('aria-label', i18nPlay);
        play = false;
        clearTimeout(apTimeout);
        clearInterval(apInterval);
        stopPlayProgress(timerBar);
        toggleClass(timerBar, "animate", false);
    };
    const stopAutoPlay = () => play && clearAutoPlay();
    const resetAutoplay = () => {
        clearTimeout(apTimeout);
        stopPlayProgress(timerBar);
        toggleClass(timerBar, "animate", false);
        clearInterval(apInterval);
    };
    const initAutoplay = () => {
        apSetIndex();
        updateSlider();
        apCorrectDur = apDur + trDur + trDelay;
        apInterval = setInterval(autoplayRepeat, apCorrectDur);
        apTimeout = setTimeout(() => {
            toggleClass(timerBar, "animate", true);
        }, trDur + trDelay);
    };
    const autoplayRepeat = () => {
        resetAutoplay();
        initAutoplay();
    };
    //-----
    //Main functions
    const triggerMove_click = (el, setIndexFunction) => {
        const handleClick = (e, i) => {
            if (isTransition) return;
            let prevIndex = index;
            setIndexFunction(i);
            if (index === prevIndex) return;
            updateSlider();
            stopAutoPlay();
            e.stopPropagation();
        };

        [].concat(el).forEach((element, i) =>
            element?.addEventListener("click", e => handleClick(e, i))
        );
    };
    //
    const triggerMove_tabArrows = () => {
        const handleFocus = (slide) => {
            tabSetIndex(slide);
            updateSlider();
            stopAutoPlay();
        };
        const handleTabKey = () => {
            slides.forEach(slide => [...slide.querySelectorAll("*"), slide].forEach(el => el.addEventListener("focus", () => handleFocus(slide))));
        };
        const handleArrowKeys = e => {
            const activeSlide = slides.find(slide => document.activeElement === slide);
            if (!activeSlide) return;
            e.preventDefault();//prevent scrolling of container
            e.key === "ArrowRight" ? arrowrightSetIndex() : arrowleftSetIndex();
            slides[Math.abs(index)].focus();
            updateSlider();
            stopAutoPlay();
        };
        const handleKeydown = e => {
            const { key } = e;
            if (!document.activeElement.closest(".vimorika") === slider || isTransition) return e.preventDefault();
            if (["ArrowRight", "ArrowLeft"].includes(key)) handleArrowKeys(e);
            else if (key === "Tab") handleTabKey();
            e.stopPropagation();
        };
        document.addEventListener("keydown", handleKeydown, true);
    };
    //
    const triggerMove_input = () => {
        const validateInputValue = () => {
            pagInput.value = Math.max(1, Math.min((pagInput.value), len));
            pagInputSetIndex();
        };
        const handleFsInputEvent = (e) => {
            if (e.type === "change") {
                if (isTransition) return;
                validateInputValue();
                updateSlider(e);
            } else if (e.type === "input") {
                pagInput.value = pagInput.value.replace(/\D/g, '');
                stopAutoPlay();
            } else if (e.type === "mousedown" || e.type === "keydown") {
                if (isTransition) e.preventDefault();
                stopAutoPlay();
            } else {
                stopAutoPlay();
            }
            e.stopPropagation();
        };
        const addEventListenersInput = () => ["change", "input", "focus", "mousedown", "keydown"].forEach(e => pagInput?.addEventListener(e, handleFsInputEvent));
        addEventListenersInput();
    }
    //
    const trackMoveOnTouch = () => {
        let startX = 0;
        let isDragging = false;
        let amountTransX = 0;
        const handleTouchEvent = () => {
            isDragging = false;
            track.style.transitionDelay = `${0}ms`;
            flitX();
        };
        const onStart = (event) => {
            startX = getX(event);            
            isDragging = true;
            amountTransX = getTransAmountX(track);
            stopAutoPlay();
            //handle elements that require dragging to function
            const { target } = event;
            const tagName = target?.tagName.toLowerCase();
            if (target && (tagName === "input" && target.type === "range") || target.draggable || tagName === "canvas" || target.classList.contains("draggable")) {
                ["touchstart", "touchmove"].forEach(evt => target.addEventListener(evt, handleTouchEvent, { passive: true }));
            }
            let element = target;
            while (element && element !== track) {
                element.addEventListener('scroll', handleTouchEvent);
                element = element.parentElement;
            }
            if (window.getSelection().toString().length > 0) handleTouchEvent();
            //
            event.stopPropagation();
        };
        const onMove = (event) => {
            if (!isDragging || isTransition) return;
            if (window.getSelection().toString().length > 0) {
                handleTouchEvent();
                return;
            }
            const diffX = getX(event) - startX;                       
            track.style.transform = `translate3d(${amountTransX + diffX}px, 0, 0)`;
            track.style.transitionDuration = `${0}ms`;
            track.style.transitionDelay = `${0}ms`;
            event.stopPropagation();
        };
        const onEnd = (event) => {
            if (!isDragging || isTransition) return;
            const diffX = event.changedTouches[0].clientX - startX;
            if (diffX > swipeDist) {
                arrowleftSetIndex();
                updateSlider();
            } else if (diffX < -swipeDist) {
                arrowrightSetIndex();
                updateSlider();
            } else {
                setTrDur();
                track.style.transitionDelay = `${trDelay}ms`;
                flitX();
            }
            isDragging = false;
            event.stopPropagation();
        }
        //move
        const addElMove = () => {
            viewport.addEventListener('touchmove', onMove, { passive: true });
        }
        const removeElMove = () => {
            viewport.removeEventListener('touchmove', onMove, { passive: true });
        }
        //start
        const handleStart = (event) => {
            onStart(event);
            addElMove();
        }
        viewport.addEventListener('touchstart', handleStart, { passive: true });
        //end
        const handleEnd = (event) => {
            onEnd(event);
            removeElMove();
        }
        viewport.addEventListener('touchend', handleEnd);
        viewport.addEventListener('touchcancel', handleEnd);
    }
    //  
    const pagMoveOnTouchAndMouse = () => {
        let startX = 0;
        let isDragging = false;
        let sl = 0;
        const onStart = (event) => {
            startX = getX(event);
            isDragging = true;
            sl = pagination.scrollLeft;
            stopAutoPlay();
        };
        const onMove = (event) => {
            if (!isDragging) return;
            const diffX = getX(event) - startX;
            pagination.scrollLeft = sl - diffX;
            pagTrack.style.pointerEvents = "none";
        };
        const onEnd = () => {
            isDragging = false;
            startX = 0;
            pagTrack.style.pointerEvents = "initial";
        }
        //move
        const addElMove = () => {
            ['touchmove', 'mousemove'].forEach(eventType => {
                pagination?.addEventListener(eventType, onMove, { passive: true });
            });
        }
        const removeElMove = () => {
            ['touchmove', 'mousemove'].forEach(eventType => {
                pagination?.removeEventListener(eventType, onMove, { passive: true });
            });
        }
        //start
        const handleStart = (event) => {
            onStart(event);
            addElMove();
        }
        ['touchstart', 'mousedown'].forEach(eventType => {
            pagination?.addEventListener(eventType, handleStart, { passive: true });
        });
        //end
        const handleEnd = () => {
            onEnd();
            removeElMove();
        }
        ['touchend', 'mouseup', 'mouseleave'].forEach(eventType => {
            pagination?.addEventListener(eventType, handleEnd);
        });
    }
    //
    const autoplay = () => {
        if (!isStartAutoplaying) return;
        toggleClass(playBtn, "enabled", true);
        playBtn.setAttribute('aria-label', i18nPause);
        apCorrectDur = apDur;
        startAutoplay();
        toggleClass(timerBar, "animate", true);
    };
    const togglePlay = () => {
        const play_handle_click = (e) => {
            if (play) {
                clearAutoPlay();
            } else {
                if (isTransition) return;
                play = true;
                toggleClass(playBtn, "enabled", true);
                playBtn.setAttribute('aria-label', i18nPause);
                initAutoplay();
            }
            e.stopPropagation();
        }
        playBtn?.addEventListener("click", play_handle_click);
    }
    const cancelPlayOnMousedown = () => viewport.addEventListener("mousedown", stopAutoPlay);
    //
    const fullscreen_handle_click = (e) => {
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); /* Safari */
            } else {
                if (slider.requestFullscreen) slider.requestFullscreen();
                else if (slider.webkitRequestFullscreen) slider.webkitRequestFullscreen(); /* Safari */
            }
            e.stopPropagation();
        }
    const toggleFullscreenFn = () => {
        fullscreenBtn?.addEventListener("click", fullscreen_handle_click);
    }
    const fullscreen_handle_change = (e) => {
        if (e.target === slider) {
            const toggleFullscreenButtons = slider.querySelectorAll('.vimorika-fullscreen');            
            if (document.fullscreenElement) {
                toggleFullscreenButtons?.forEach((x) => {
                    x.setAttribute('aria-label', i18nExitF);
                });
            } else {
                toggleFullscreenButtons?.forEach((x) => {
                    x.setAttribute('aria-label', i18nEnterF);
                });
            }
            slider.classList.toggle("fullscreen");
            toggleFullscreenButtons?.forEach((x) => {
                x.classList.toggle("enabled");
            });
            e.stopPropagation();
        }
    }
    const fullscreenChangeFn = () => {
        document.addEventListener("fullscreenchange", fullscreen_handle_change);
    }
    //----------
    //INITIALIZE
    initIndex();
    initPag();
    createLiveregion();
    initPagInput();
    track.style.transitionDelay = `${0}ms`;
    flitX();
    if (pagTrack) scrollToElement(pagination, pagSelectors[Math.abs(index)], 0, scrollEasing, isAnimationsOff);
    disableDirBtns();
    activateSelector();
    activateSlide();
    slidesSetAria();
    selectorsSetAria();
    initAriaSlider();
    initAriaBtns();
    initSelectors();
    initSlides();
    turnOffAnimations();
    autoplay();
    setTotalInfo();
    setCountInfo();
    initTimerbarAnimDur();
    updateProgressbar(0);
    updateLiveregion();
    track.style.gap = `${gapRem}rem`;
    //----------
    //CALL FUNCTIONS
    track_addEL_transitionrun();
    track_addEL_transitionstart();
    track_addEL_transitionend();
    triggerMove_click(nextBtn, nextSetIndex);
    triggerMove_click(prevBtn, prevSetIndex);
    triggerMove_click(firstBtn, firstSetIndex);
    triggerMove_click(lastBtn, lastSetIndex);
    triggerMove_click(pagSelectors, pagSelectorsSetIndex);
    triggerMove_click(slides, pagSelectorsSetIndex);
    triggerMove_tabArrows();
    triggerMove_input();
    trackMoveOnTouch();
    pagMoveOnTouchAndMouse();
    cancelPlayOnMousedown();
    togglePlay();
    toggleFullscreenFn();
    fullscreenChangeFn();
    //END
}