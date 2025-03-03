/*jshint esversion: 9, undef: false, unused: false */

/*
 * Plugin Name: Palleon
 * Plugin URI: https://palleon.website/js-version/
 * Version: 2.9.2
 * Description: Palleon - Javascript Image Editor
 * Author URI: http://codecanyon.net/user/egemenerd
 * License: http://codecanyon.com/licenses
*/

(function($) {
    "use strict";

    $.fn.palleon = function (options) {    
        var selector = $(this); 
        var windowWidth = document.body.clientWidth;

        // Default settings
        var settings = $.extend({
            baseURL: "./",
            PexelsApiKey: '',
            PexelsPagination: 20,
            PexelsLanguage: 'en-US',
            PexelsImgSize: 'large2x',
            PixabayApiKey: '',
            PixabayPagination: 16,
            PixabayLanguage: 'en',
            PixabaySafeSearch: 'false',
            PixabayEditorsChice: 'false',
            apiCaching: true,
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            fontSize: 60,
            fontWeight: 'normal',
            fontStyle: 'normal',
            canvasColor: 'transparent',
            fill: '#000',
            stroke: '#fff',
            strokeWidth: 0,
            textBackgroundColor: 'rgba(255,255,255,0)',
            textAlign: 'left',
            lineHeight: 1.2,
            borderColor: '#000',
            borderDashArray: [4, 4],
            borderOpacityWhenMoving: 0.5,
            borderScaleFactor: 2,
            editingBorderColor: 'rgba(0,0,0,0.5)',
            cornerSize: 12,
            cornerStrokeColor: '#000',
            cornerStyle: 'circle',
            transparentCorners: false,
            cursorColor: '#000',
            cursorWidth: 2,
            enableGLFiltering: true,
            textureSize: 4096,
            watermark: false,
            watermarkText: 'palleon.website',
            watermarkFontFamily: 'Georgia, serif',
            watermarkFontStyle: 'normal',
            watermarkFontColor: '#000',
            watermarkFontSize: 40,
            watermarkFontWeight: 'bold',
            watermarkBackgroundColor: '#FFF',
            watermarkLocation: 'bottom-right',
            templatePreview: true,
            customFunctions: function() {}
        }, options);

        // Define Variables
        var c = '',
        db = new Localbase('palleon'),
        pageID = 0,
        cropping = false,
        cropobj,
        cropscalex,
        cropscaley,
        croptop,
        cropleft,
        mode = 'none',
        img = '',
        imgurl = '',
        originalWidth = '',
        originalHeight = '',
        rotate = 0,
        scaleX = 1,
        scaleY = 1,
        originX = 'left',
        originY = 'top',
        canvas = '',
        filters = [],
        clipPath = '',
        overlay = '',
        brush = '',
        brushShadow = '',
        duotoneFilter = '',
        timeOut = 0,
        mmediaLibraryMode = 'add-to-canvas',
        shapeTypes = ['circle', 'square', 'rectangle', 'triangle', 'ellipse', 'trapezoid', 'octagon', 'pentagon', 'emerald', 'star','diamond', 'parallelogram','customShape'],
        resizableShapeTypes = ['square', 'rectangle', 'triangle'],
        webSafeFonts = [
            ["Helvetica Neue", "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"],
            ["Impact", "Impact, Charcoal, sans-serif"],
            ["Georgia", "Georgia, serif"],
            ["Palatino Linotype", "'Palatino Linotype', 'Book Antiqua', Palatino, serif"],
            ["Times New Roman", "'Times New Roman', Times, serif"],
            ["Arial", "Arial, Helvetica, sans-serif"],
            ["Arial Black", "'Arial Black', Gadget, sans-serif"],
            ["Comic Sans", "'Comic Sans MS', cursive, sans-serif"],
            ["Lucida Sans", "'Lucida Sans Unicode', 'Lucida Grande', sans-serif"],
            ["Tahoma", "Tahoma, Geneva, sans-serif"],
            ["Trebuchet", "'Trebuchet MS', Helvetica, sans-serif"],
            ["Verdana", "Verdana, Geneva, sans-serif"],
            ["Courier New", "'Courier New', Courier, monospace"],
            ["Lucida Console", "'Lucida Console', Monaco, monospace"]
        ],
        JSON_defaults = ['objectType','gradientFill','roundedCorders','mode','selectable','lockMovementX','lockMovementY','lockRotation','crossOrigin','layerName','maskType', 'ogWidth', 'ogHeight'];

        // For debugging purposes
        db.config.debug = false;

        // Get assets
        function getAssets() {
            db.collection('assets')
                .get()
                .then((assets) => {
                // Sometimes the assets aren't ready when importing
                if (assets === undefined) {
                    getAssets();
                } else if (assets.length > 0) {
                    var svgs = 0;
                    var images = 0;
                    var templates = 0;
                    var uploaded_images = [];
                    assets.forEach(function (asset) {
                        uploaded_images.push({
                            src: asset.src,
                            key: asset.key,
                            type: asset.type,
                            name: asset.name
                        });
                    });
                    selector.find('#palleon-library-my').html('');
                    selector.find('#palleon-svg-library-my').html('');
                    selector.find('#palleon-my-templates').html('');
                    uploaded_images.slice().reverse().forEach(function (item) {
                        if (item.type == 'svg') {
                            const svgblob = new Blob([item.src], {type:"image/svg+xml;charset=utf-8"});  
                            const svgurl = URL.createObjectURL(svgblob);
                            selector.find('#palleon-svg-library-my').append(
                                '<div class="palleon-masonry-item" data-keyword="' + item.name + '"> <div class="palleon-library-delete" data-target="' + item.key + '"><span class="material-icons">remove</span></div> <div class="palleon-masonry-item-inner"> <div class="palleon-img-wrap"> <img src="' + svgurl + '" data-full="' + svgurl + '" data-filename="' + item.name + '" title="' + item.name + '" data-format="' + item.type + '" /> </div> <div class="palleon-masonry-item-desc">' + item.name + '</div> </div> </div>'
                            );
                            svgs ++;
                        } else if (item.type == 'json') {
                            const jsonblob = new Blob([item.src], {type:"text/plain"});  
                            const jsonurl = URL.createObjectURL(jsonblob);
                            selector.find('#palleon-my-templates').append(
                                '<li data-keyword="' + item.name + '"> <div>' + item.name + '</div> <div> <button type="button" class="palleon-btn primary palleon-select-template" data-json="' + jsonurl + '"><span class="material-icons">check</span>' + palleonParams.select + '</button> <button type="button" class="palleon-btn danger palleon-template-delete" data-target="' + item.key + '"><span class="material-icons">clear</span>' + palleonParams.delete + '</button> </div> </li>'
                            );
                            templates ++;
                        } else {
                            const blob = dataURLtoBlob(item.src);
                            const objurl = URL.createObjectURL(blob);
                            selector.find('#palleon-library-my').append(
                                '<div class="palleon-masonry-item" data-keyword="' + item.name + '"> <div class="palleon-library-delete" data-target="' + item.key + '"><span class="material-icons">remove</span></div> <div class="palleon-masonry-item-inner"> <div class="palleon-img-wrap"> <img src="' + objurl + '" data-full="' + objurl + '" data-filename="' + item.name + '" title="' + item.name + '" data-format="' + item.type + '" /> </div> <div class="palleon-masonry-item-desc">' + item.name + '</div> </div> </div>'
                            );
                            images ++;
                        }
                    });
                    selector.find('#palleon-svg-library-my-pagination').remove();
                    if (svgs !== 0) {
                        setPagination(selector.find("#palleon-svg-library-my"));
                    } else {
                        selector.find('#palleon-svg-library-my').html('<div class="notice notice-info">' + palleonParams.easyAccess + '</div>');
                    }
                    selector.find('#palleon-library-my-pagination').remove();
                    if (images !== 0) {
                        setPagination(selector.find("#palleon-library-my"));
                    } else {
                        selector.find('#palleon-library-my').html('<div class="notice notice-info">' + palleonParams.easyAccess + '</div>');
                    }
                    selector.find('#palleon-my-templates-pagination').remove();
                    if (templates !== 0) {
                        setPagination(selector.find("#palleon-my-templates"));
                    } else {
                        selector.find('#palleon-my-templates').html('<div class="notice notice-info">' + palleonParams.easyAccessTemplate + '</div>');
                    }
                } else {
                    selector.find('#palleon-svg-library-my-pagination').remove();
                    selector.find('#palleon-library-my-pagination').remove();
                    selector.find('#palleon-my-templates-pagination').remove();
                    selector.find('#palleon-svg-library-my').html('<div class="notice notice-info">' + palleonParams.easyAccess + '</div>');
                    selector.find('#palleon-library-my').html('<div class="notice notice-info">' + palleonParams.easyAccess + '</div>');
                    selector.find('#palleon-my-templates').html('<div class="notice notice-info">' + palleonParams.easyAccessTemplate + '</div>');
                }
            });
        }
        getAssets();

        // Delete asset
        selector.on('click','.palleon-library-delete',function(){
            var container = $(this).parent().parent();
            var item = $(this).parent();
            var key = $(this).attr('data-target');
            db.collection('assets')
                .doc({ key: key })
                .get()
                .then((asset) => {
                db.collection('assets').doc({ key: key }).delete();
                item.remove();
                selector.find('#' + container.attr('id') + '-pagination').remove();
                setPagination(container);
            });
        });

        // Delete template
        selector.find('.palleon-template-list').on('click','.palleon-template-delete',function(){
            var item = $(this).parent().parent();
            var key = $(this).attr('data-target');
            db.collection('assets')
                .doc({ key: key })
                .get()
                .then((asset) => {
                db.collection('assets').doc({ key: key }).delete();
                item.remove();
                selector.find('#palleon-my-templates-pagination').remove();
                setPagination(selector.find('#palleon-my-templates'));
            });
        });

        /* Initialize Plugins */
        selector.find(".crop-custom").css('display', 'none');

        /* Load Material Icons */
        var materialIcons = new FontFaceObserver("Material Icons");
        materialIcons.load(null, 10000).then(function() {
            $('#palleon').find('#palleon-main-loader').fadeOut(200);
            }).catch(function(e) {
            console.log(e);
            $('#palleon').find('#palleon-main-loader').hide();
        });

        /* LazyLoad */
        var lazyLoadInstance = new LazyLoad({
            callback_error: (img) => {
                img.setAttribute("src", settings.baseURL + "assets/placeholder.png");
                $(img).parent().css('min-height', 'auto');
                $(img).parent().find('.palleon-img-loader').remove();
            },
            callback_loaded: (img) => {
                $(img).parent().css('min-height', 'auto');
                $(img).parent().find('.palleon-img-loader').remove();
            }
        });

        // Populate Websafe Fonts
        for (var i = 0; i < webSafeFonts.length; i++) {
            selector.find('#websafe-fonts').append($('<option class="websafe-font"></option>').attr("value", webSafeFonts[i][1]).text(webSafeFonts[i][0]).attr("data-font", webSafeFonts[i][1]).text(webSafeFonts[i][0]));
        }

        // Populate Google Fonts
        $.getJSON(settings.baseURL + 'json/google-fonts.json', function(fonts) {
            for (var i = 0; i < fonts.items.length; i++) {      
                selector.find('#google-fonts').append($('<option class="google-font"></option>').attr("value", fonts.items[i].family).text(fonts.items[i].family).attr("data-font", fonts.items[i].family).text(fonts.items[i].family));
            }  
        });

        // Populate Material Icons
        $.getJSON(settings.baseURL + 'json/material-icons.json', function(fonts) {
            for (var i = 0; i < fonts.categories.length; i++) {   
                var item = fonts.categories[i];
                for (var ii = 0; ii < item.icons.length; ii++) {
                    var url = settings.baseURL + 'files/icons/' + item.icons[ii].group_id + '/' + item.icons[ii].ligature;
                    selector.find('#palleon-icons .palleon-grid').append('<div class="palleon-element add-element" data-elsource="' + url + '" data-loader="no" title="' + item.icons[ii].name + '">' + '<span class="material-icons">' + item.icons[ii].ligature + '</div>');
                }
            }  
        });
        
        // Select2
        selector.find('.palleon-select.palleon-select2').select2({
            theme: "dark",
            width: "100%",
            templateSelection: select2format,
            templateResult: select2format,
            allowHtml: true
        });

        // Spectrum Colorpicker
        selector.find(".palleon-colorpicker.disallow-empty").spectrum({
            allowEmpty: false,
            showInitial: true,
            hideAfterPaletteSelect:true
        });
        selector.find(".palleon-colorpicker.allow-empty").spectrum({
            allowEmpty: true,
            showInitial: false,
            hideAfterPaletteSelect:true
        });

        // Toastr
        toastr.options.closeButton = true;
        toastr.options.positionClass = 'toast-bottom-right';
        toastr.options.progressBar = true;
        toastr.options.newestOnTop = false;
        toastr.options.showEasing = 'swing';
        toastr.options.hideEasing = 'linear';
        toastr.options.closeEasing = 'linear';

        // UI Draggable
        selector.find("#palleon-canvas-wrap").draggable({ disabled: true });

        // Pagination
        function setPagination(target) {
            var items = target.find('>*');
            var num = items.length;
            var perPage = parseInt(target.data('perpage'));
            if (num > perPage) {
                items.slice(perPage).hide();
                var paginationDiv = '<div id="' + target.attr('id') + '-pagination' + '" class="palleon-pagination"></div>';
                target.after(paginationDiv);
                selector.find('#' + target.attr('id') + '-pagination').pagination({
                    items: num,
                    itemsOnPage: perPage,
                    prevText: '<span class="material-icons">navigate_before</span>',
                    nextText: '<span class="material-icons">navigate_next</span>',
                    displayedPages: 4,
                    onPageClick: function (pageNumber, event) {
                        if (typeof event !== "undefined") {
                            event.preventDefault();
                        }
                        var showFrom = perPage * (pageNumber - 1);
                        var showTo = showFrom + perPage;
                        items.hide().slice(showFrom, showTo).show();
                    }
                });
                selector.find('#' + target.attr('id') + '-pagination').pagination('selectPage', 1);
            }
        }

        selector.find('.paginated').each(function() {
            setPagination($(this));
        });

        // PAGES

        function setPageTab() {
            pageID++;
            var json = canvas.toJSON(JSON_defaults);
            selector.find('#palleon-history-list li').remove();
            selector.find('#palleon-history').prop('disabled', true);
            selector.find('#palleon-undo').prop('disabled', true);
            selector.find('#palleon-redo').prop('disabled', true);
            selector.find('#palleon-pages > div').removeClass('active');
            if (selector.find('#palleon-page-' + pageID + '-json').length > 0) {
                selector.find('#palleon-page-' + pageID + '-json').html(JSON.stringify(json));
                selector.find('#palleon-pages').find('#' + pageID).attr('data-origin',json.backgroundImage["src"]);
                selector.find('#palleon-pages').find('#' + pageID).trigger('click');
            } else {
                selector.append('<script id="palleon-page-' + pageID + '-json" type="text/json">' + JSON.stringify(json) + '</script>');
                selector.find('#palleon-pages').prepend('<div id="' + pageID + '" class="active" data-origin="' + json.backgroundImage["src"] + '"><div class="palleon-open-page">' + selector.find('#palleon-download-name').val() + '</div><span class="material-icons palleon-delete-page">clear</span></div>');
            }
        }

        selector.find('#palleon-pages').on('click','.palleon-open-page',function(){
            var tab = $(this).parent();
            if (!tab.hasClass('active')) {
                selector.find('#palleon-history-list li').remove();
                selector.find('#palleon-history').prop('disabled', true);
                selector.find('#palleon-undo').prop('disabled', true);
                selector.find('#palleon-redo').prop('disabled', true);
                selector.find('#palleon-canvas-loader').show();
                var id = selector.find('#palleon-pages > div.active').attr('id');
                var newid = $(this).parent().attr('id');
                var json = canvas.toJSON(JSON_defaults);
                selector.find('#palleon-page-' + id + '-json').html(JSON.stringify(json));
                var newjson = selector.find('#palleon-page-' + newid + '-json').html();
                $(document).trigger( "loadTemplate", [ newjson, '', ''] );
                selector.find('#palleon-pages > div').removeClass('active');
                tab.addClass('active');
                adjustZoom();     
            }
        });

        selector.find('#palleon-pages').on('click','.palleon-delete-page',function(){
            var tab = $(this).parent();
            if (!tab.hasClass('active')) {
                tab.remove();
            } else {
                tab.remove();
                if (selector.find('#palleon-pages > div').length > 0) {
                    selector.find('#palleon-pages > div:first-child > .palleon-open-page').trigger('click');
                } else {
                    mode = 'none';
                    modeCheck();
                }   
            }
        });

        selector.on('change','.palleon-file-name',function(){
            var val = $(this).val();
            selector.find('.palleon-file-name').not(this).each(function(){
                $(this).val(val);
                selector.find('#palleon-pages > div.active > .palleon-open-page').html(val);
            });
        });

        selector.on('click','#palleon-new',function(){
            if (selector.find('#palleon-pages > div.active').length > 0) {
                var id = selector.find('#palleon-pages > div.active').attr('id');
                var json = canvas.toJSON(JSON_defaults);
                selector.find('#palleon-page-' + id + '-json').html(JSON.stringify(json));
            }
        });

        selector.on('click','#palleon-save',function(){
            if (selector.find('#palleon-pages > div.active').length > 0) {
                var id = selector.find('#palleon-pages > div.active').attr('id');
                var json = canvas.toJSON(JSON_defaults);
                selector.find('#palleon-page-' + id + '-json').html(JSON.stringify(json));
            }
        });

        // Dataurl to blob
        function dataURLtoBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
        }

        // Convert to data url
        function convertToDataURL(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
              var reader = new FileReader();
              reader.onloadend = function() {
                callback(reader.result);
              };
              reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        }

        /* Open Panel */
        function openPanel() {
            selector.removeClass('panel-closed');
            selector.find(".palleon-icon-menu-btn").removeClass('active');
            selector.find("#palleon-icon-menu").removeClass('closed');
            selector.find("#palleon-toggle-left").removeClass('closed');
            selector.find("#palleon-toggle-left").find(".material-icons").html('chevron_left');
            selector.find("#palleon-icon-panel").show();
        }

        /* Close Panel */
        function closePanel() {
            selector.addClass('panel-closed');
            selector.find(".palleon-icon-menu-btn").removeClass('active');
            selector.find("#palleon-icon-menu").addClass('closed');
            selector.find("#palleon-toggle-left").addClass('closed');
            selector.find("#palleon-toggle-left").find(".material-icons").html('chevron_right');
            selector.find("#palleon-icon-panel").hide();
        }

        /* Left Panel Toggle */
        selector.find("#palleon-toggle-left").on("click", function () {
            if ($(this).hasClass('closed')) {
                openPanel();
            } else {
                closePanel();
            }
        });

        /* Right Panel Toggle */
        selector.find("#palleon-toggle-right").on("click", function () {
            if ($(this).hasClass('closed')) {
                selector.removeClass('layers-closed');
                $(this).removeClass('closed');
                $(this).find(".material-icons").html('chevron_right');
                selector.find("#palleon-right-col").show();
            } else {
                selector.addClass('layers-closed');
                $(this).addClass('closed');
                $(this).find(".material-icons").html('chevron_left');
                selector.find("#palleon-right-col").hide();
            }
        });

        selector.find(".palleon-toggle-right").on("click", function (e) {
            e.preventDefault();
            selector.find("#palleon-toggle-right").trigger('click');
        });

        /* Close panels if needed */
        if (windowWidth <= 1200) {
            selector.find("#palleon-toggle-right").trigger('click');
            selector.find("#palleon-toggle-left").trigger('click');
        }

        /* Icon Button */
        selector.find(".palleon-icon-menu-btn").on("click", function () {
            if ($(this).data('target')) {
                if ($(this).hasClass('active')) {
                    closePanel();
                } else {
                    openPanel();
                    $(this).addClass('active');
                    selector.find('.palleon-icon-panel-content').addClass('panel-hide');
                    selector.find($(this).data('target')).removeClass('panel-hide');
                }
            }
            if ($(this).attr('id') == 'palleon-btn-elements') {
                selector.find('#palleon-all-elements-open').trigger('click');
            }
        });

        /* Dropdown Menu */
        selector.find('.palleon-dropdown-wrap').on('click', function() {
            if ($(this).hasClass('opened')) {
                $(this).removeClass('opened');
                $(this).find('.palleon-dropdown').hide();
            } else {
                $(this).addClass('opened');
                $(this).find('.palleon-dropdown').show();
            }
        });

        /* Accordion */
        selector.find(".palleon-icon-panel-content ul.palleon-accordion > li > a").on("click", function (e) {
            e.preventDefault();
            var parent = $(this).parent().parent();
            if ($(this).parent().hasClass('opened')) {
                parent.find('li').removeClass('opened');
            } else {
                parent.find('li').removeClass('opened');
                $(this).parent().addClass('opened');
            }
        });

        /* Lock/Unlock Button */
        selector.find(".palleon-lock-unlock").on("click", function () {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                $(this).find('.material-icons').html('lock_open');
            } else {
                $(this).addClass('active');
                $(this).find('.material-icons').html('lock');
            }
        });

        /* Rangeslider */
        selector.find(".palleon-slider").on("input", function () {
            var wrapper = $(this).parent().parent();
            wrapper.find('.slider-label span').html($(this).val());
            selector.find('span.tm-count-zoom').html($(this).val());
        });

        /* Toggle conditional fields */
        selector.find('input[type="checkbox"]').on("change", function () {
            if ($(this).data('conditional')) {
                if ($(this).is(":checked")) {
                    selector.find($(this).data('conditional')).removeClass('d-none');
                } else {
                    selector.find($(this).data('conditional')).addClass('d-none');
                }
            }
        });

        /* Tabs */
        selector.find('.palleon-tabs-menu li').on('click', function () {
            var target = $(this).data('target');
            var wrapper = $(this).parent().parent();
            wrapper.find('> .palleon-tab').removeClass('active');
            $(target).addClass('active');
            wrapper.find('> .palleon-tabs-menu li').removeClass('active');
            $(this).addClass('active');
        });

        /* Numeric validation */
        selector.find('input[type="number"],.numeric-field').bind('input paste keyup keydown', function(){
            this.value = this.value.replace(/(?!^-)[^0-9.]/g, "").replace(/(\..*)\./g, '$1');
            if ($(this).data('max') && (this.value > $(this).data('max'))) {
                this.value = $(this).data('max');
            }
            if ($(this).data('min') && (this.value < $(this).data('min'))) {
                this.value = $(this).data('min');
            }
        });

        /* Numeric Plus */
        selector.find('.palleon-counter .counter-plus').on('click', function() {
            var input = $(this).parent().find('input.palleon-form-field');
            var val = parseInt(input.val()) + parseInt(input.data('step'));
            if (input.data('max') && (val > input.data('max'))) {
                val = input.data('max');
            }
            if (input.data('min') && (val < input.data('min'))) {
                val = input.data('min');
            }
            if (val < 0) {
                val = 0;
            }
            input.val(val);
            if ($(this).attr('id') == 'palleon-img-zoom-in') {
                adjustZoom(val);
            }
        });

        /* Numeric Minus */
        selector.find('.palleon-counter .counter-minus').on('click', function() {
            var input = $(this).parent().find('input.palleon-form-field');
            var val = parseInt(input.val()) - parseInt(input.data('step'));
            if (input.data('max') && (val > input.data('max'))) {
                val = input.data('max');
            }
            if (input.data('min') && (val < input.data('min'))) {
                val = input.data('min');
            }
            if (val < 0) {
                val = 0;
            }
            input.val(val);
            if ($(this).attr('id') == 'palleon-img-zoom-out') {
                adjustZoom(val);
            }
        });

        /* Deselect Active Object */
        selector.find(".palleon-wrap").on("click", function (e) {
            if (!cropping) {
                var target = e.target["id"];
                if (target != '' && target == 'palleon-content') {
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }
            }
        });

        // Set Fabric Settings
        fabric.enableGLFiltering = settings.enableGLFiltering;
        fabric.textureSize = parseInt(settings.textureSize);
        fabric.Object.prototype.borderColor = settings.borderColor;
        fabric.Object.prototype.borderDashArray = settings.borderDashArray;
        fabric.Object.prototype.borderOpacityWhenMoving = settings.borderOpacityWhenMoving;
        fabric.Object.prototype.borderScaleFactor = settings.borderScaleFactor;
        fabric.Object.prototype.editingBorderColor = settings.editingBorderColor;
        fabric.Object.prototype.cornerColor = settings.cornerColor;
        fabric.Object.prototype.cornerSize = settings.cornerSize;
        fabric.Object.prototype.cornerStrokeColor = settings.cornerStrokeColor;
        fabric.Object.prototype.cornerStyle = settings.cornerStyle;
        fabric.Object.prototype.transparentCorners = settings.transparentCorners;
        fabric.Object.prototype.cursorColor = settings.cursorColor;
        fabric.Object.prototype.cursorWidth = settings.cursorWidth;
        fabric.Object.prototype.strokeUniform = true;
        fabric.Group.prototype.padding = 0;
        fabric.Object.prototype.erasable = false;

        // Get any object by ID
        fabric.Canvas.prototype.getItemById = function (name) {
            var object = null,
                objects = this.getObjects();
            for (var i = 0, len = this.size(); i < len; i++) {
                if (objects[i].get('type') == 'group') {
                    if (objects[i].get('id') && objects[i].get('id') === name) {
                        object = objects[i];
                        break;
                    }
                    var wip = i;
                    for (var o = 0; o < objects[i]._objects.length; o++) {
                        if (objects[wip]._objects[o].id && objects[wip]._objects[o].id === name) {
                            object = objects[wip]._objects[o];
                            break;
                        }
                    }
                } else if (objects[i].id && objects[i].id === name) {
                    object = objects[i];
                    break;
                }
            }
            return object;
        };

        // Reset object controls
        function resetControls() {
            fabric.Object.prototype.controls.ml = new fabric.Control({
            x: -0.5,
            y: 0,
            offsetX: -1,
            cursorStyleHandler:
                fabric.controlsUtils.scaleSkewCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
            getActionName: fabric.controlsUtils.scaleOrSkewActionName
            });
        
            fabric.Object.prototype.controls.mr = new fabric.Control({
            x: 0.5,
            y: 0,
            offsetX: 1,
            cursorStyleHandler:
                fabric.controlsUtils.scaleSkewCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
            getActionName: fabric.controlsUtils.scaleOrSkewActionName
            });
        
            fabric.Object.prototype.controls.mb = new fabric.Control({
            x: 0,
            y: 0.5,
            offsetY: 1,
            cursorStyleHandler:
                fabric.controlsUtils.scaleSkewCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
            getActionName: fabric.controlsUtils.scaleOrSkewActionName
            });
        
            fabric.Object.prototype.controls.mt = new fabric.Control({
            x: 0,
            y: -0.5,
            offsetY: -1,
            cursorStyleHandler:
                fabric.controlsUtils.scaleSkewCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
            getActionName: fabric.controlsUtils.scaleOrSkewActionName
            });
        
            fabric.Object.prototype.controls.tl = new fabric.Control({
            x: -0.5,
            y: -0.5,
            cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingEqually
            });
        
            fabric.Object.prototype.controls.tr = new fabric.Control({
            x: 0.5,
            y: -0.5,
            cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingEqually
            });
        
            fabric.Object.prototype.controls.bl = new fabric.Control({
            x: -0.5,
            y: 0.5,
            cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingEqually
            });
        
            fabric.Object.prototype.controls.br = new fabric.Control({
            x: 0.5,
            y: 0.5,
            cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
            actionHandler: fabric.controlsUtils.scalingEqually
            });
        }

        // Delete object control
        var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='tm_delete_btn' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='512px' height='512px' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='256' cy='256' r='256'/%3E%3Cg%3E%3Crect x='120.001' y='239.987' transform='matrix(-0.7071 -0.7071 0.7071 -0.7071 256.0091 618.0168)' style='fill:%23FFFFFF;' width='271.997' height='32'/%3E%3Crect x='240' y='119.989' transform='matrix(-0.7071 -0.7071 0.7071 -0.7071 256.0091 618.0168)' style='fill:%23FFFFFF;' width='32' height='271.997'/%3E%3C/g%3E%3C/svg%3E";

        var deleteimg = document.createElement('img');
        deleteimg.src = deleteIcon;

        function deleteObject(eventData, transform) {
            var target = transform.target;
            if (target.type === 'activeSelection') {
                $.each(target._objects, function( index, val ) {
                    var item = selector.find("#palleon-layers #" + val.id)
                    item.find("a.delete-layer").trigger('click');
                });
                canvas.discardActiveObject();
            } else {
                var item = selector.find("#palleon-layers #" + target.id)
                item.find("a.delete-layer").trigger('click');
            }
        }

        function renderDeleteIcon(ctx, left, top, styleOverride, fabricObject) {
            var size = 24;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(deleteimg, -size/2, -size/2, size, size);
            ctx.restore();
        }

        function addDeleteIcon(obj) {
            obj.controls.deleteControl = new fabric.Control({
                x: 0,
                y: 0.5,
                offsetY: 22,
                offsetX: 14,
                cursorStyle: 'pointer',
                mouseUpHandler: deleteObject,
                render: renderDeleteIcon,
                cornerSize: 24
            });
        }

        // Clone object control
        var cloneIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='tm_add_btn' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='512px' height='512px' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512;' xml:space='preserve'%3E%3Ccircle style='fill:%23009688;' cx='256' cy='256' r='256'/%3E%3Cg%3E%3Crect x='240' y='120' style='fill:%23FFFFFF;' width='32' height='272'/%3E%3Crect x='120' y='240' style='fill:%23FFFFFF;' width='272' height='32'/%3E%3C/g%3E%3C/svg%3E";

        var cloneimg = document.createElement('img');
        cloneimg.src = cloneIcon;

        function cloneObject(eventData, transform) {
            var target = transform.target;
            if (target.type === 'activeSelection') {
                toastr.warning(palleonParams.noDuplicate,palleonParams.warning);
            } else {
                var item = selector.find("#palleon-layers #" + target.id)
                item.find("a.duplicate-layer").trigger('click');
            }
        }

        function renderCloneIcon(ctx, left, top, styleOverride, fabricObject) {
            var size = 24;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(cloneimg, -size/2, -size/2, size, size);
            ctx.restore();
        }

        function addCloneIcon(obj) {
            obj.controls.cloneControl = new fabric.Control({
                x: 0,
                y: 0.5,
                offsetY: 22,
                offsetX: -14,
                cursorStyle: 'pointer',
                mouseUpHandler: cloneObject,
                render: renderCloneIcon,
                cornerSize: 24
            });
        }

        // Custom Image Filters
        fabric.Image.filters.Shift = fabric.util.createClass(fabric.Image.filters.ColorMatrix, {
            type: 'Shift',
            matrix: [
                0,0,1,0,0,
			    0,1,0,0,0,
			    1,0,0,0,0,
			    0,0,0,1,0
            ],
            mainParameter: false,
            colorsOnly: true
        });

        /* Create Canvas */
        c = selector.find('#palleon-canvas')[0];
        canvas = new fabric.Canvas(c);
        canvas.backgroundColor = settings.canvasColor;

        /* Set File Name */
        function setFileName(fileName, fileExtention) {
            if (fileName == '') {
                fileName = new Date().getTime();
            }
            if (fileExtention == '') {
                fileExtention = 'jpeg';
            } else if (fileExtention == '.jpg') {
                fileExtention = 'jpeg';
            } else if (fileExtention == 'jpg') {
                fileExtention = 'jpeg';
            } else if (fileExtention == '.png') {
                fileExtention = 'png';
            } else if (fileExtention == '.webp') {
                fileExtention = 'webp';
            } else if (fileExtention == '.tiff') {
                fileExtention = 'tiff';
            }
            
            selector.find('.palleon-file-name').val(fileName);
            selector.find('.palleon-file-name').data('default', fileName);
            selector.find('#palleon-save-img-format').val(fileExtention).change();
            selector.find('#palleon-download-format').val(fileExtention).change();
        }

        /* Init */
        function init(getMode) {
            rotate = 0;
            selector.find('#palleon-canvas-loader').css('display', 'flex');            
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            mode = getMode;
            if (canvas.backgroundImage) {
                filters = canvas.backgroundImage.filters;
            }
            // Temp Canvas
            if (mode == 'canvas') {
                selector.find('#palleon-canvas-color').trigger('change');
                var newCanvas = document.createElement("canvas");
                var canvas2 = new fabric.Canvas(newCanvas);
                var canvas2Width = parseInt(selector.find('#palleon-canvas-width').val());
                var canvas2Height = parseInt(selector.find('#palleon-canvas-height').val());
                if (canvas2Width == '') {
                    canvas2Width = 800;
                }
                if (canvas2Height == '') {
                    canvas2Height = 800;
                }
                canvas2.setWidth(canvas2Width);
                canvas2.setHeight(canvas2Height);
                canvas2.backgroundColor = 'transparent';
                var imgData = canvas2.toDataURL({ format: 'png', enableRetinaScaling: false});
                selector.find('#palleon-canvas-img').attr('src', imgData);
                canvas2.dispose();
            }

            // Canvas Init
            selector.find('#palleon-canvas-img-wrap').imagesLoaded( function() {
                img = selector.find('#palleon-canvas-img')[0];
                imgurl = selector.find('#palleon-canvas-img').attr('src');
                originalWidth = img.width;
                originalHeight = img.height;

                // Display image dimentions
                setDimentions(img);

                canvas.setDimensions({width: originalWidth, height: originalHeight});

                fabric.Image.fromURL(imgurl, function(img) {
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        objectType: 'BG',
                        mode: mode,
                        scaleX: scaleX,
                        scaleY: scaleY,
                        selectable: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        erasable: true
                    }, { crossOrigin: 'anonymous' });
                    setTimeout(function(){ 
                        setPageTab();
                        selector.find('#palleon-canvas-loader').hide();
                    }, 500);
                });
                adjustZoom();
                modeCheck();
                setTimeout(function(){ 
                    reset();
                    addToHistory('<span class="material-icons">flag</span>' + palleonParams.started);
                }, 100);
            });
        }

        // Add base64 image to canvas
        $( document ).on( "loadBase64Img", function(event, src, seed, newtab = true) {
            rotate = 0;
            selector.find('#palleon-canvas-loader').css('display', 'flex');            
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            mode = 'image';
            if (canvas.backgroundImage) {
                filters = canvas.backgroundImage.filters;
            }
            selector.find('#palleon-canvas-img').attr("src",src);
            selector.find('#palleon-canvas-img-wrap').imagesLoaded( function() {
                img = selector.find('#palleon-canvas-img')[0];
                originalWidth = img.width;
                originalHeight = img.height;
                setFileName(seed, 'png');
                setDimentions(img);
                canvas.setDimensions({width: originalWidth, height: originalHeight});
                canvas.setBackgroundImage(src, canvas.renderAll.bind(canvas), {
                    objectType: 'BG',
                    mode: mode,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    lockRotation: true,
                    erasable: true
                }, { crossOrigin: 'anonymous' });
                adjustZoom();
                modeCheck();
                setTimeout(function(){
                    if (newtab) {
                        reset();
                        setPageTab();
                        addToHistory('<span class="material-icons">flag</span>' + palleonParams.started);
                        selector.find('#palleon-canvas-loader').hide();
                    } else {
                        addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
                    }
                    selector.find('#palleon-canvas-loader').hide();
                }, 500);
            });
        });

        // Add image from url
        $( document ).on( "loadImgURL", function(event, src, fileExtention) {
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            selector.find('#palleon-canvas-wrap').css('visibility', 'visible');
            var fullImg = src;
            var tempImg = new Image();
            if (mmediaLibraryMode == 'add-to-canvas') {
                setFileName(fileName, fileExtention);
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        selector.find('#palleon-canvas-img').attr('src', dataUrl);
                        init('image');
                    };
                });
            } else if (mmediaLibraryMode == 'add-as-object') {
                var top = getScaledSize()[1] / 2;
                var left = getScaledSize()[0] / 2;
                var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
                if (print_a) {
                    top = print_a.top;
                    left = print_a.left;
                }
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        var image = new fabric.Image(tempImg, {
                            objectType: 'image',
                            objectCaching: true,
                            roundedCorders: 0,
                            stroke: '#fff', 
                            strokeWidth: 0,
                            top: top,
                            left: left,
                            originX: 'center',
                            originY: 'center'
                        });
                        image.set({
                            ogWidth: image.get('width'),
                            ogHeight: image.get('height'),
                        });
                        canvas.add(image);
                        if (print_a) {
                            image.scaleToWidth((print_a.width * 0.8) * canvas.getZoom());
                            if(!image.isContainedWithinObject(print_a)) {
                                image.scaleToHeight((print_a.height * 0.8) * canvas.getZoom());
                            }
                        } else {
                            image.scaleToWidth(getScaledSize()[0] / 4);
                            if (image.isPartiallyOnScreen()) {
                                image.scaleToHeight(getScaledSize()[1] / 4);
                            }
                        }
                        canvas.setActiveObject(image);
                        canvas.requestRenderAll();
                        selector.find('#palleon-canvas-loader').hide();
                        canvas.fire('palleon:history', { type: 'image', text: palleonParams.added });
                    };
                }); 
            } else if (mmediaLibraryMode == 'replace-image') {
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        canvas.getActiveObject().setSrc(dataUrl);
                        canvas.requestRenderAll();
                        selector.find('#palleon-canvas-loader').hide();
                        canvas.fire('palleon:history', { type: 'image', text: palleonParams.replaced });
                    };
                }); 
            } else if (mmediaLibraryMode == 'overlay-image') {
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {
                        var img = new fabric.Image(tempImg);
                        img.set({
                            scaleX: getScaledSize()[0] / img.width,
                            scaleY: getScaledSize()[1] / img.height,
                            objectCaching: false,
                            originX: 'left',
                            originY: 'top',
                            selectable: false,
                            lockMovementX: true,
                            lockMovementY: true,
                            lockRotation: true,
                            erasable: true
                        });
                        canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
                        selector.find('#palleon-overlay-wrap').show();
                        selector.find('#palleon-overlay-preview').attr('src', fullImg);
                        setTimeout(function(){ 
                            selector.find('#palleon-canvas-loader').hide();
                        }, 500);
                    }
                    });
            }
            selector.find('#modal-media-library').hide();
        });

        // Open the editor with a default image if exists
        if(selector.find('#palleon-canvas-img').attr('src') != '') {
            mode = 'image';
            var fileName = selector.find('#palleon-canvas-img').data('filename');
            var fileExtention = selector.find('#palleon-canvas-img').attr('src').match(/\.[0-9a-z]+$/i)[0].replace(/\./g, "");
            setFileName(fileName, fileExtention);
            init(mode);
        }

        modeCheck();

        // Open the editor with a default template if exists
        if(selector.find('#palleon-canvas-img').data('template') != '') {
            var fileName = selector.find('#palleon-canvas-img').data('filename');
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            selector.find('.palleon-modal').hide();
            var objects = canvas.getObjects();
            objects.filter(element => element.objectType != 'BG').forEach(element => canvas.remove(element));
            selector.find('#palleon-layers li').remove();
            checkLayers();
            $.getJSON(selector.find('#palleon-canvas-img').data('template'), function(json) {
                loadJSON(json);
                setTimeout(function(){
                    setFileName(fileName, '');
                    setPageTab();
                    addToHistory('<span class="material-icons">flag</span>' + palleonParams.started);
                }, 100);
            }).fail(function(jqxhr, textStatus, error) {
                toastr.error("Request Failed: " + error, palleonParams.error);
            }).always(function() {
                selector.find('#palleon-canvas-loader').hide();
            }); 
        }

        /* Reset */
        function reset() {
            // Vars
            rotate = 0;
            scaleX = 1;
            scaleY = 1;
            originX = 'left';
            originY = 'top';

            if (typeof canvas.overlayImage !== "undefined" && canvas.overlayImage !== null) {
                canvas.overlayImage = null;
            }

            if (!selector.find('#keep-data').is(":checked")) {
                canvas.backgroundImage.filters = [];
                selector.find('#palleon-adjust .conditional-settings').addClass('d-none');
                selector.find('#palleon-brightness').prop('checked', false);
                selector.find('#brightness').val(0);
                selector.find('#palleon-contrast').prop('checked', false);
                selector.find('#contrast').val(0);
                selector.find('#palleon-saturation').prop('checked', false);
                selector.find('#saturation').val(0);
                selector.find('#palleon-hue').prop('checked', false);
                selector.find('#hue').val(0);
                selector.find('#palleon-filters input[type=checkbox]').prop('checked', false);
                selector.find('#palleon-gamma').prop('checked', false);
                selector.find('#gamma-red').val(1);
                selector.find('#gamma-green').val(1);
                selector.find('#gamma-blue').val(1);
                selector.find('#palleon-blend-color').prop('checked', false);
                selector.find('#blend-color-mode').val('add');
                selector.find('#blend-color-color').spectrum("set", "#ffffff");
                selector.find('#blend-color-alpha').val(0.5);
                selector.find('#blend-color-alpha').parent().parent().find('.slider-label span').html(0.5);
                selector.find('#palleon-duotone-color').prop('checked', false);
                selector.find('#duotone-light-color').spectrum("set", "green");
                selector.find('#duotone-dark-color').spectrum("set", "blue");
                selector.find('#palleon-swap-colors').prop('checked', false);
                selector.find('#palleon-blur').prop('checked', false);
                selector.find('#blur').val(0);
                selector.find('#palleon-noise').prop('checked', false);
                selector.find('#noise').val(0);
                selector.find('#palleon-pixelate').prop('checked', false);
                selector.find('#pixelate').val(1);

                var objects = canvas.getObjects();
                objects.filter(element => element.objectType != 'BG').forEach(element => canvas.remove(element));
                selector.find('#palleon-layers li').remove();
                checkLayers();
            } else {
                canvas.backgroundImage.filters = filters;
                canvas.backgroundImage.applyFilters();
            }

            canvas.fire('selection:cleared');
            canvas.requestRenderAll();
        }

        /* Adjust Filter Controls */
        function adjustFilterControls(filters) {
            // Reset
            selector.find('#palleon-brightness').prop('checked', false);
            selector.find('#palleon-contrast').prop('checked', false);
            selector.find('#palleon-saturation').prop('checked', false);
            selector.find('#palleon-hue').prop('checked', false);
            selector.find('#grayscale').prop('checked', false);
            selector.find('#sepia').prop('checked', false);
            selector.find('#brownie').prop('checked', false);
            selector.find('#blackwhite').prop('checked', false);
            selector.find('#vintage').prop('checked', false);
            selector.find('#kodachrome').prop('checked', false);
            selector.find('#polaroid').prop('checked', false);
            selector.find('#technicolor').prop('checked', false);
            selector.find('#invert').prop('checked', false);
            selector.find('#sharpen').prop('checked', false);
            selector.find('#emboss').prop('checked', false);
            selector.find('#palleon-gamma').prop('checked', false);
            selector.find('#palleon-blend-color').prop('checked', false);
            selector.find('#palleon-duotone-color').prop('checked', false);
            selector.find('#palleon-blur').prop('checked', false);
            selector.find('#palleon-noise').prop('checked', false);
            selector.find('#palleon-pixelate').prop('checked', false);

            // Get Values
            if (filters.length !== 0) {
                $.each(filters, function( index, val ) {
                    if (val.type == 'Brightness') {
                        selector.find('#palleon-brightness').prop('checked', true);
                        selector.find('#brightness').val(val.brightness);
                        selector.find('#brightness').parent().parent().find('.slider-label span').html(val.brightness);
                    } else if (val.type == 'Contrast') {
                        selector.find('#palleon-contrast').prop('checked', true);
                        selector.find('#contrast').val(val.brightness);
                        selector.find('#contrast').parent().parent().find('.slider-label span').html(val.contrast);
                    } else if (val.type == 'Saturation') {
                        selector.find('#palleon-saturation').prop('checked', true);
                        selector.find('#saturation').val(val.brightness);
                        selector.find('#saturation').parent().parent().find('.slider-label span').html(val.saturation);
                    } else if (val.type == 'HueRotation') {
                        selector.find('#palleon-hue').prop('checked', true);
                        selector.find('#hue').val(val.rotation);
                        selector.find('#hue').parent().parent().find('.slider-label span').html(val.rotation);
                    } else if (val.type == 'Grayscale') {
                        selector.find('#grayscale').prop('checked', true);
                    } else if (val.type == 'Sepia') {
                        selector.find('#sepia').prop('checked', true);
                    } else if (val.type == 'Brownie') {
                        selector.find('#brownie').prop('checked', true);
                    } else if (val.type == 'BlackWhite') {
                        selector.find('#blackwhite').prop('checked', true);
                    } else if (val.type == 'Vintage') {
                        selector.find('#vintage').prop('checked', true);
                    } else if (val.type == 'Kodachrome') {
                        selector.find('#kodachrome').prop('checked', true);
                    } else if (val.type == 'Polaroid') {
                        selector.find('#polaroid').prop('checked', true);
                    } else if (val.type == 'Technicolor') {
                        selector.find('#technicolor').prop('checked', true);
                    } else if (val.type == 'Invert') {
                        selector.find('#invert').prop('checked', true);
                    } else if (val.type == 'Convolute') {
                        if (val.matrix == '[0,-1,0,-1,5,-1,0,-1,0]') {
                            selector.find('#sharpen').prop('checked', true);
                        } else if (val.matrix == '[1,1,1,1,0.7,-1,-1,-1,-1]'){
                            selector.find('#emboss').prop('checked', true);
                        } else if (val.matrix == '[-1,0,1,-2,0,2,-1,0,1]'){
                            selector.find('#sobelX').prop('checked', true);
                        } else if (val.matrix == '[-1,-2,-1,0,0,0,1,2,1]'){
                            selector.find('#sobelY').prop('checked', true);
                        }
                    } else if (val.type == 'Gamma') {
                        selector.find('#palleon-gamma').prop('checked', true);
                        selector.find('#gamma-red').val(val.gamma[0]);
                        selector.find('#gamma-red').parent().parent().find('.slider-label span').html(val.gamma[0]);
                        selector.find('#gamma-green').val(val.gamma[1]);
                        selector.find('#gamma-green').parent().parent().find('.slider-label span').html(val.gamma[1]);
                        selector.find('#gamma-blue').val(val.gamma[2]);
                        selector.find('#gamma-blue').parent().parent().find('.slider-label span').html(val.gamma[2]);
                    } else if (val.type == 'BlendColor') {
                        selector.find('#palleon-blend-color').prop('checked', true);
                        selector.find('#blend-color-mode').val(val.mode);
                        selector.find('#blend-color-color').val(val.color);
                        selector.find('#blend-color-alpha').val(val.alpha);
                        selector.find('#blend-color-alpha').parent().parent().find('.slider-label span').html(val.alpha);
                    } else if (val.type == 'Composed') {
                        selector.find('#palleon-duotone-color').prop('checked', true);
                        selector.find('#duotone-light-color').val(val.subFilters[1].color);
                        selector.find('#duotone-dark-color').val(val.subFilters[2].color);
                    } else if (val.type == 'Blur') {
                        selector.find('#palleon-blur').prop('checked', true);
                        selector.find('#blur').val(val.blur);
                        selector.find('#blur').parent().parent().find('.slider-label span').html(val.blur);
                    } else if (val.type == 'Noise') {
                        selector.find('#palleon-noise').prop('checked', true);
                        selector.find('#noise').val(val.noise);
                        selector.find('#noise').parent().parent().find('.slider-label span').html(val.noise);
                    } else if (val.type == 'Pixelate') {
                        selector.find('#palleon-pixelate').prop('checked', true);
                        selector.find('#pixelate').val(val.blocksize);
                        selector.find('#pixelate').parent().parent().find('.slider-label span').html(val.blocksize);
                    }
                });
            }
            
            selector.find('#palleon-brightness').trigger('change');
            selector.find('#palleon-contrast').trigger('change');
            selector.find('#palleon-saturation').trigger('change');
            selector.find('#palleon-hue').trigger('change');
            selector.find('#palleon-gamma').trigger('change');
            selector.find('#palleon-blend-color').trigger('change');
            selector.find('#palleon-blur').trigger('change');
            selector.find('#palleon-noise').trigger('change');
            selector.find('#palleon-pixelate').trigger('change');
        }

        /* Adjust Mode */
        function modeCheck() {
            if (mode == 'none') {
                selector.find('#palleon-icon-menu, #palleon-icon-panel, #palleon-ruler-icon').css('pointer-events', 'none');
                selector.find('.palleon-keep, #modal-add-new .palleon-modal-close').hide();
                selector.find('.palleon-keep, #modal-media-library .palleon-modal-close').hide();
                selector.find('#modal-add-new').show();
                selector.find('#palleon-modal-onstart').show();
                selector.find('#palleon-save').prop('disabled', true);
            } else {
                selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
                selector.find('#palleon-icon-menu, #palleon-icon-panel, #palleon-ruler-icon').css('pointer-events', 'auto');
                selector.find('.palleon-keep, #modal-add-new .palleon-modal-close').show();
                selector.find('.palleon-keep, #modal-media-library .palleon-modal-close').show();
                selector.find('#modal-add-new').hide();
                selector.find('#palleon-modal-onstart').hide();
                selector.find('#palleon-save').prop('disabled', false);
            }
            if (mode == 'canvas') {
                selector.find('.hide-on-canvas-mode').hide();
            } else {
                selector.find('.hide-on-canvas-mode').show();
            }
        }

        selector.on('click','#palleon-modal-onstart',function(){
            selector.find('.palleon-modal').hide();
            selector.find('#modal-add-new').show();
        });

        /* MODAL */

        /* Modal Open */
        selector.find('.palleon-modal-open').on('click', function(e) {
            e.preventDefault();
            var target = $(this).data('target');
            selector.find('.palleon-modal').hide();
            selector.find(target).show();
        });

        /* Modal Close */
        selector.find('.palleon-modal-close').on('click', function(e) {
            e.preventDefault();
            var target = $(this).data('target');
            selector.find(target).hide();
        });

        /* Upload Image */
        selector.find('#palleon-image-upload').on('change', function () {
            selector.find('.palleon-modal').hide();
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            var reader = new FileReader();
            reader.onload = function(ev) {
                selector.find('#palleon-canvas-img').attr('src', reader.result);
                init('image');
            };
            reader.readAsDataURL(this.files[0]);
            var fileName = this.files[0].name.replace(/\.[^/.]+$/, "");
            var fileExtention = this.files[0].name.match(/\.[0-9a-z]+$/i)[0].replace(/\./g, "");
            setFileName(fileName, fileExtention);
        });

        /* Empty Canvas */
        selector.find('#palleon-canvas-create').on('click', function() {
            setFileName(new Date().getTime(), '');
            init('canvas');
        });

        /* TEMPLATE LIBRARY */

        /* Template Search */
        selector.find('#palleon-template-search').on('click', function() {
            var category = selector.find('#palleon-templates-menu').val();
            var input = $(this).parent().find('input');
            selector.find("#palleon-all-templates-noimg").addClass('d-none');
            selector.find('#palleon-templates-grid .grid-item').each(function() {
                $(this).attr('data-keyword', $(this).data('keyword').toLowerCase());
            });
            if ($(this).hasClass('cancel')) {
                selector.find('#palleon-templates-menu').val('all').change();
                selector.find('#palleon-templates-menu').parent().find('span.select2-container').css('opacity', 1);
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-templates-grid .grid-item').show();
                if (selector.find('#palleon-templates-grid-pagination').length) {
                    selector.find('#palleon-templates-grid-pagination').pagination('redraw');
                    selector.find('#palleon-templates-grid-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
                selector.find('#palleon-templates-menu').prop('disabled', false);
            } else {
                selector.find('#palleon-templates-menu').parent().find('span.select2-container').css('opacity', 0.5);
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                if ((searchTerm == '' || searchTerm.length < 1) && category == 'all') {
                    selector.find('#palleon-templates-grid .grid-item').show();
                    if (selector.find('#palleon-templates-grid-pagination').length) {
                        selector.find('#palleon-templates-grid-pagination').pagination('redraw');
                        selector.find('#palleon-templates-grid-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-templates-grid-pagination').length) {
                        selector.find('#palleon-templates-grid-pagination').pagination('destroy');
                    }
                    if (category == 'all') {
                        if (searchTerm != '' || searchTerm.length > 1) {
                            selector.find('#palleon-templates-grid .grid-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                        }
                    } else {
                        if (searchTerm != '' || searchTerm.length > 1) {
                            selector.find('#palleon-templates-grid .grid-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').filter('[data-category*="'+ category +'"]').show();
                        } else {
                            selector.find('#palleon-templates-grid .grid-item').hide().filter('[data-category*="'+ category +'"]').show();
                        }
                    }
                    if (selector.find('#palleon-templates-grid .grid-item:visible').length === 0) {
                        selector.find("#palleon-all-templates-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
                selector.find('#palleon-templates-menu').prop('disabled', true);
            }
            
        });

        /* Save Template */
        selector.find('#palleon-json-save').on('click', function() {
            var json = canvas.toJSON(JSON_defaults);
            convertToDataURL(json.backgroundImage.src, function(dataUrl) {
                json.backgroundImage.src = dataUrl;
                var template = JSON.stringify(json);
                var key = Math.random().toString(36).substr(2, 9);
                var name = selector.find("#palleon-save-img-name").val();
                try {
                    db.collection('assets').add({
                        key: key,
                        src: template,
                        name: name,
                        type: 'json'
                    }).then(document => {
                        toastr.success(palleonParams.tempsaved, palleonParams.saved);
                        getAssets();
                    });
                } catch(e) {
                    toastr.error(e.message, palleonParams.error);
                }

                selector.find('.palleon-modal').hide();
            });
        });

        /* Download Template */
        selector.find('#palleon-json-download').on('click', function() {
            var name = selector.find('#palleon-json-download-name').val();
            var json = canvas.toJSON(JSON_defaults);
            convertToDataURL(json.backgroundImage.src, function(dataUrl) {
                json.backgroundImage.src = dataUrl;
                var json2 = JSON.stringify(json);
                var a = document.createElement("a");
                var file = new Blob([json2], { type: "text/plain" });
                a.href = URL.createObjectURL(file);
                a.download = name + '.json';
                a.click();
                selector.find('.palleon-modal').hide();
            });
        });

        /* Load JSON */
        function loadJSON(json) {
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            rotate = json.backgroundImage.angle;
            scaleX = json.backgroundImage.scaleX;
            scaleY = json.backgroundImage.scaleY;
            originX = json.backgroundImage.originX;
            originY = json.backgroundImage.originY;
            canvas.clear();
            selector.find('#palleon-layers li').remove();

            mode = json.backgroundImage.mode;
            var blob = dataURLtoBlob(json.backgroundImage.src);
            imgurl = URL.createObjectURL(blob);
            selector.find('#palleon-canvas-img').attr("src",imgurl);
            originalWidth = json.backgroundImage.width;
            originalHeight = json.backgroundImage.height;
            var dimentions = {width:originalWidth, height:originalHeight};

            for (var i = 0; i < json.objects.length; i++) {
                if (json.objects[i].objectType == 'textbox') {
                    json.objects[i].fontFamily = json.objects[i].fontFamily + '-palleon';
                }
            }

            canvas.loadFromJSON(json, function() {
                var objects = canvas.getObjects();
                var textboxes = objects.filter(element => element.objectType == 'textbox');
                loadTemplateFonts(textboxes);
                checkLayers();
                selector.find('#palleon-canvas-color').spectrum("set", canvas.backgroundColor);
                selector.find('#custom-image-background').spectrum("set", canvas.backgroundColor);
                img = selector.find('#palleon-canvas-img')[0];
                canvas.requestRenderAll();
                selector.find('#palleon-canvas-loader').hide();
            }, function() {}, {
                crossOrigin: 'anonymous'
            });

            setFileName(new Date().getTime(), '');
            setDimentions(dimentions);
            adjustZoom();
            modeCheck();
            canvas.fire('selection:cleared');
            setTimeout(function(){ 
                selector.find("#palleon-layers > li").removeClass('active');
                if (json.backgroundImage) {
                    adjustFilterControls(json.backgroundImage["filters"]);
                }
                if (json.overlayImage) {
                    selector.find('#palleon-overlay-wrap').show();
                    selector.find('#palleon-overlay-preview').attr('src', json.overlayImage.src);
                } else {
                    selector.find('#palleon-overlay-wrap').hide();
                    selector.find('#palleon-overlay-preview').attr('src', '');
                }
            }, 100);
        }

        // Custom load template event
        $( document ).on( "loadTemplate", function( event, getjson, json, canvasColor) {
            var objects = canvas.getObjects();
            objects.filter(element => element.objectType != 'BG').forEach(element => canvas.remove(element));
            selector.find('#palleon-layers li').remove();
            checkLayers();
            if (getjson) {
                var parsejson = JSON.parse(getjson);
                convertToDataURL(parsejson.backgroundImage["src"], function(dataUrl) {
                    parsejson.backgroundImage["src"] = dataUrl;
                    loadJSON(parsejson);
                    if (canvasColor != '') {
                        canvas.backgroundColor = canvasColor;
                    }
                    setTimeout(function(){ 
                        selector.find('#palleon-canvas-loader').hide();
                    }, 500);
                });
            } else {
                $.getJSON(json, function(json) {
                    loadJSON(json);
                    if (canvasColor != '') {
                        canvas.backgroundColor = canvasColor;
                    }
                }).fail(function(jqxhr, textStatus, error) {
                    toastr.error("Request Failed: " + error, palleonParams.error);
                }).always(function() {
                    setTimeout(function(){ 
                        selector.find('#palleon-canvas-loader').hide();
                    }, 500);
                }); 
            }
        });

        /* Load Template Fonts */
        function loadTemplateFonts(objects) {
            if (objects.length !== 0) {
                $.each(objects, function( index, val ) {
                    var font = val.fontFamily.replace('-palleon', '');
                    val.fontFamily = settings.fontFamily;
                    var loadFonts = 'yes';
                    if (font == '') {
                        loadFonts = 'no';
                    } else {
                        for (var i = 0; i < webSafeFonts.length; i++) {
                            if (webSafeFonts[i][1] == font) {
                                loadFonts = 'no';
                                break;
                            } 
                        }
                    }
                    if (loadFonts == 'yes') {
                        WebFont.load({
                            google: {
                            families: [font + ':regular,bold', font + ':italic,regular,bold']
                            }
                        });
                        var fontNormal = new FontFaceObserver(font, {
                            weight: 'normal',
                            style: 'normal'
                        });
                        var fontBold = new FontFaceObserver(font, {
                            weight: 'bold',
                            style: 'normal'
                        });
                        var fontNormalItalic = new FontFaceObserver(font, {
                            weight: 'normal',
                            style: 'italic'
                        });
                        var fontBoldItalic = new FontFaceObserver(font, {
                            weight: 'bold',
                            style: 'italic'
                        });
                        Promise.all([fontNormal.load(null, 5000), fontBold.load(null, 5000), fontNormalItalic.load(null, 5000), fontBoldItalic.load(null, 5000)]).then(function () {
                            val.set("fontFamily", font);
                            canvas.requestRenderAll();
                        }).catch(function(e) {
                            console.log(e);
                        });
                    } else {
                        val.set("fontFamily", font);
                        canvas.requestRenderAll();
                    }

                });
            }
        }

        /* Upload Template */
        selector.find('#palleon-json-upload').on('change', function (e) {
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            var reader = new FileReader();
            var json = '';
            reader.onload = function(ev) {
                json = JSON.parse(reader.result);
                loadJSON(json);
                selector.find('#palleon-canvas-loader').hide();
                setTimeout(function(){
                    setPageTab();
                    addToHistory('<span class="material-icons">flag</span>' + palleonParams.started);
                }, 100);
            };
            reader.readAsText(e.target.files[0]);
            selector.find('.palleon-modal').hide();
        });

        /* Template Preview */
        if (settings.templatePreview) {
            selector.find('#palleon-templates-grid').on('mouseenter','.palleon-select-template',function(){
                var title = $(this).find('img.lazy').data('title');
                var preview = $(this).find('img.lazy').data('preview');
                $(this).append('<div id="palleon-template-preview"><div class="palleon-img-wrap"><div class="palleon-img-loader"></div><img class="lazy" data-src="' + preview + '" /></div><div id="palleon-template-preview-title">' + title + '</div></div>');
                lazyLoadInstance.update();
            }).on('mousemove','.palleon-select-template',function(event){
                jQuery("#palleon-template-preview").position({
                    my: "left+20 top",
                    of: event,
                    collision: "fit flip"
                });
            }).on('mouseleave','.palleon-select-template',function(){
                jQuery("#palleon-template-preview").remove();
            });
        }

        /* Add Template */
        selector.find('.template-selection').on('click','.palleon-select-template',function(){
            selector.find('#palleon-canvas-wrap, .palleon-content-bar').css('visibility', 'visible');
            selector.find('.palleon-modal').hide();
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            var objects = canvas.getObjects();
            objects.filter(element => element.objectType != 'BG').forEach(element => canvas.remove(element));
            selector.find('#palleon-layers li').remove();
            checkLayers();
            $.getJSON($(this).data('json'), function(json) {
                loadJSON(json);
                setTimeout(function(){
                    setPageTab();
                    addToHistory('<span class="material-icons">flag</span>' + palleonParams.started);
                }, 100);
            }).fail(function(jqxhr, textStatus, error) {
                toastr.error("Request Failed: " + error, palleonParams.error);
            }).always(function() {
                selector.find('#palleon-canvas-loader').hide();
            }); 
        });

        /* Search My Templates */
        selector.find('#palleon-my-templates-search').on('click', function () {
            var input = $(this).parent().find('input');
            selector.find("#palleon-my-templates-noimg").addClass('d-none');
            selector.find('#palleon-my-templates li').each(function() {
                $(this).attr('data-keyword', $(this).data('keyword').toLowerCase());
            });
            if (input.val() == '') {
                return;
            }
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-my-templates li').show();
                if (selector.find('#palleon-my-templates-pagination').length) {
                    selector.find('#palleon-my-templates-pagination').pagination('redraw');
                    selector.find('#palleon-my-templates-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
            } else {
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                console.log(searchTerm);
                if ((searchTerm == '' || searchTerm.length < 1)) {
                    selector.find('#palleon-my-templates li').show();
                    if (selector.find('#palleon-my-templates-pagination').length) {
                        selector.find('#palleon-my-templates-pagination').pagination('redraw');
                        selector.find('#palleon-my-templates-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-my-templates-pagination').length) {
                        selector.find('#palleon-my-templates-pagination').pagination('destroy');
                    }
                    selector.find('#palleon-my-templates li').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                    if (selector.find('#palleon-my-templates li:visible').length === 0) {
                        selector.find("#palleon-my-templates-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
            }
        });

        /* Watermark */
        function add_watermark() {
            if (settings.watermark) {  
                var location = settings.watermarkLocation;
                var scaledFontSize = (originalWidth * settings.watermarkFontSize) / 1400;
                var watermark = new fabric.Textbox(' ' + settings.watermarkText + ' ',{
                    objectType: 'watermark',
                    gradientFill: 'none',
                    fontSize: scaledFontSize,
                    fontFamily: settings.watermarkFontFamily,
                    fontWeight: settings.watermarkFontWeight,
                    fontStyle: settings.watermarkFontStyle,
                    lineHeight: 1,
                    fill: settings.watermarkFontColor,
                    textBackgroundColor: settings.watermarkBackgroundColor,
                    width: getScaledSize()[0],
                    left:0
                });
                canvas.add(watermark);

                if (location == 'bottom-right') {
                    watermark.textAlign = 'right';
                    watermark.top = getScaledSize()[1] - watermark.height;
                } else if (location == 'bottom-left') {
                    watermark.textAlign = 'left';
                    watermark.top = getScaledSize()[1] - watermark.height;
                } else if (location == 'top-right') {
                    watermark.textAlign = 'right';
                    watermark.top = 0;
                } else if (location == 'top-left') {
                    watermark.textAlign = 'left';
                    watermark.top = 0;
                }
                watermark.moveTo(999);
            }
        }

        function remove_watermark() {
            if (settings.watermark) {  
                objects = canvas.getObjects();
                objects.filter(element => element.objectType === 'watermark').forEach(element => canvas.remove(element));   
            }
        }

        /* Download Image */
        selector.find('#palleon-download').on('click', function () {
            var name = selector.find('#palleon-download-name').val();
            var quality = parseFloat(selector.find('#palleon-download-quality').val());
            var format = selector.find('#palleon-download-format').val();
            var link = document.createElement("a");
            add_watermark();
            canvas.setZoom(1);
            selector.find('#palleon-img-zoom').val(100);
            var zoomWidth = originalHeight;
            var zoomHeight = originalWidth;
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                zoomWidth = originalWidth;
                zoomHeight = originalHeight;
            }
            canvas.setWidth(zoomWidth);
            canvas.setHeight(zoomHeight);

            var blob = '';

            if (format == 'svg') {
                var svgData = canvas.toSVG({suppressPreamble: false,width: originalWidth,height: originalHeight});
                var texts = canvas.getObjects().filter(element => element.objectType == 'textbox');
                var def = '<defs><style type="text/css"><![CDATA[';
                var fonts = [];
                var objurl = '';
                $.each(texts, function(index, value) {
                    var font = value.fontFamily;
                    var loadFonts = 'yes';
                    for (var i = 0; i < webSafeFonts.length; i++) {
                        if (webSafeFonts[i][1] == font) {
                            loadFonts = 'no';
                            break;
                        } 
                    }
                    if (loadFonts == 'yes') {
                        if (!fonts.includes(font)) {
                            fonts.push(font);
                        }
                    }
                });
                
                if (fonts.length > 0) {
                    $.each(fonts, function(index, value) {
                        var isLastElement = index == fonts.length -1;
                        var slug = value.replace(/ /g, '+');
                        $.ajax({
                            url: "https://fonts.googleapis.com/css?family=" + slug + ":italic,regular,bold",
                            type: 'GET',
                            dataType: "text",
                            crossDomain:true,
                            success: function (cssText) {
                                def = def + cssText;
                                setTimeout(function() {
                                    if (isLastElement) {
                                        svgData = svgData.replace('<defs>', def + ']]></style>');
                                        blob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});   
                                        objurl = URL.createObjectURL(blob);
                                        link.download = name + '.' + format;
                                        link.href = objurl;
                                        link.click();
                                    }
                                }, 500);
                            },
                            error: function(jqXHR,error, errorThrown) {
                                if(jqXHR.status&&jqXHR.status==400){
                                    toastr.error(jqXHR.responseText, palleonParams.error);
                                }else{
                                    toastr.error(palleonParams.wrong, palleonParams.error);
                                }
                            }
                        });
                    });
                } else {
                    blob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});  
                    objurl = URL.createObjectURL(blob);
                    link.download = name + '.' + format;
                    link.href = objurl;
                    link.click();
                }      
            } else if (format == 'tiff') {
                var imgData = canvas.toDataURL({ format: 'png', enableRetinaScaling: false});
                var tiffCanvas = document.createElement('canvas');
                tiffCanvas.width = parseInt(selector.find('#palleon-resize-width').val());
                tiffCanvas.height = parseInt(selector.find('#palleon-resize-height').val());
                var tiffctx = tiffCanvas.getContext("2d");
                var tiffimg = new Image;
                tiffimg.src = imgData;
                tiffimg.onload = function() {
                    tiffctx.drawImage(this, 0, 0, tiffCanvas.width, tiffCanvas.height);
                    CanvasToTIFF.toBlob(tiffCanvas, function(blob) {
                        objurl = URL.createObjectURL(blob);
                        link.download = name + '.' + format;
                        link.href = objurl;
                        link.click();
                        tiffCanvas.remove();
                        tiffimg.remove();
                    }, {
                        dpi: parseInt(selector.find('#palleon-download-img-dpi').val())
                    });
                };
            } else {
                var imgData = canvas.toDataURL({ format: format, quality: quality, enableRetinaScaling: false});
                if (format != 'webp') {
                    imgData = changeDpiDataUrl(imgData, selector.find('#palleon-download-img-dpi').val());
                }
                blob = dataURLtoBlob(imgData);
                objurl = URL.createObjectURL(blob);
                link.download = name + '.' + format;
                link.href = objurl;
                link.click();
            }
            remove_watermark();
            adjustZoom();
            canvas.requestRenderAll();
            selector.find('.palleon-modal').hide();
        });

        /* Download File Format Select */
        selector.find('#palleon-download-format').on('change', function () {
            if ($(this).val() == 'png' || $(this).val() == 'svg') {
                selector.find('#palleon-download-quality').prop('disabled', true);
            } else {
                selector.find('#palleon-download-quality').prop('disabled', false);
            }
        });

        /* Save File Format Select */
        selector.find('#palleon-save-img-format').on('change', function () {
            if ($(this).val() == 'png' || $(this).val() == 'svg') {
                selector.find('#palleon-save-img-quality').prop('disabled', true);
            } else {
                selector.find('#palleon-save-img-quality').prop('disabled', false);
            }
        });

        /* BLANK CANVAS */
        selector.find('#palleon-canvas-size-select').on('change', function() {
            var val = $(this).val();
            if (val == 'custom') {
                selector.find('#palleon-canvas-width').prop('disabled', false);
                selector.find('#palleon-canvas-height').prop('disabled', false);
            } else {
                selector.find('#palleon-canvas-width').prop('disabled', true);
                selector.find('#palleon-canvas-height').prop('disabled', true);
            }
            selector.find('#palleon-canvas-width').val($(this).find(':selected').data('width'));
            selector.find('#palleon-canvas-height').val($(this).find(':selected').data('height'));
        });

        // Canvas Background
        selector.find('#palleon-canvas-color').on('change', function() {
            var val = $(this).val();
            selector.find('#custom-image-background').spectrum("set", val);
            if (val == '') {
                canvas.backgroundColor = 'transparent';
                canvas.requestRenderAll();
            } else {
                canvas.backgroundColor = val;
                canvas.requestRenderAll();
            }
        });

        /* MEDIA LIBRARY */

        selector.find('#palleon-media-library').on('click', function() {
            mmediaLibraryMode = 'add-to-canvas';
        });

        selector.find('#palleon-img-media-library').on('click', function() {
            mmediaLibraryMode = 'add-as-object';
        });

        selector.find('#palleon-img-replace-media-library').on('click', function() {
            mmediaLibraryMode = 'replace-image';
        });

        selector.find('#palleon-overlay-img-media-library').on('click', function() {
            mmediaLibraryMode = 'overlay-image';
        });

        /* Select Image */
        selector.find('#modal-media-library').on('click','.media-library-grid>.palleon-masonry-item>.palleon-masonry-item-inner',function(){
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            selector.find('#palleon-canvas-wrap').css('visibility', 'visible');
            var fullImg = $(this).find('img').data('full');
            var tempImg = new Image();
            if (mmediaLibraryMode == 'add-to-canvas') {
                var fileExtention = '';
                var fileName = $(this).find('img').data('filename');
                if ($(this).find('img').data('format')) {
                    fileExtention = $(this).find('img').data('format');
                } else {
                    var fullImgCheck = fullImg.substring(0 , fullImg.indexOf('?'));
                    if (fullImgCheck != '') {
                        fileExtention = fullImgCheck.match(/\.[0-9a-z]+$/i)[0].replace(/\./g, "");
                    } else {
                        fileExtention = fullImg.match(/\.[0-9a-z]+$/i)[0].replace(/\./g, "");
                    }
                }
                setFileName(fileName, fileExtention);
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        selector.find('#palleon-canvas-img').attr('src', dataUrl);
                        init('image');
                    };
                });
            } else if (mmediaLibraryMode == 'add-as-object') {
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        var image = new fabric.Image(tempImg, {
                            objectType: 'image',
                            objectCaching: true,
                            roundedCorders: 0,
                            stroke: '#fff', 
                            strokeWidth: 0,
                            top: getScaledSize()[1] / 2,
                            left: getScaledSize()[0] / 2,
                            originX: 'center',
                            originY: 'center'
                        });
                        image.set({
                            ogWidth: image.get('width'),
                            ogHeight: image.get('height'),
                        });
                        canvas.add(image);
                        image.scaleToWidth(getScaledSize()[0] / 2);
                        if (image.isPartiallyOnScreen()) {
                            image.scaleToHeight(getScaledSize()[1] / 2);
                        }
                        canvas.setActiveObject(image);
                        canvas.requestRenderAll();
                        selector.find('#palleon-canvas-loader').hide();
                        canvas.fire('palleon:history', { type: 'image', text: palleonParams.added });
                    };
                }); 
            } else if (mmediaLibraryMode == 'replace-image') {
                convertToDataURL(fullImg, function(dataUrl) {
                    tempImg.src = dataUrl;
                    tempImg.onload = function () {    
                        canvas.getActiveObject().setSrc(dataUrl);
                        canvas.requestRenderAll();
                        selector.find('#palleon-canvas-loader').hide();
                        canvas.fire('palleon:history', { type: 'image', text: palleonParams.replaced });
                    };
                }); 
            } else if (mmediaLibraryMode == 'overlay-image') {
                fabric.Image.fromURL(fullImg, function(img) {
                    img.set({
                        scaleX: getScaledSize()[0] / img.width,
                        scaleY: getScaledSize()[1] / img.height,
                        objectCaching: false,
                        originX: 'left',
                        originY: 'top',
                        selectable: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        erasable: true
                    });
                    canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
                    selector.find('#palleon-overlay-wrap').show();
                    selector.find('#palleon-overlay-preview').attr('src', fullImg);
                    setTimeout(function(){ 
                        selector.find('#palleon-canvas-loader').hide();
                    }, 500);
                 });
            }
            selector.find('#modal-media-library').hide();
        });

        /* Search My Images */
        selector.find('#palleon-library-my-search').on('click', function () {
            var input = $(this).parent().find('input');
            selector.find("#palleon-library-my-noimg").addClass('d-none');
            if (input.val() == '') {
                return;
            }
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-library-my .palleon-masonry-item').show();
                if (selector.find('#palleon-library-my-pagination').length) {
                    selector.find('#palleon-library-my-pagination').pagination('redraw');
                    selector.find('#palleon-library-my-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
            } else {
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                if ((searchTerm == '' || searchTerm.length < 1)) {
                    selector.find('#palleon-library-my .palleon-masonry-item').show();
                    if (selector.find('#palleon-library-my-pagination').length) {
                        selector.find('#palleon-library-my-pagination').pagination('redraw');
                        selector.find('#palleon-library-my-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-library-my-pagination').length) {
                        selector.find('#palleon-library-my-pagination').pagination('destroy');
                    }
                    selector.find('#palleon-library-my .palleon-masonry-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                    if (selector.find('#palleon-library-my .palleon-masonry-item:visible').length === 0) {
                        selector.find("#palleon-library-my-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
            }
        });

        /* Search All Images */
        selector.find('#palleon-library-all-search').on('click', function () {
            var input = $(this).parent().find('input');
            selector.find("#palleon-library-all-noimg").addClass('d-none');
            if (input.val() == '') {
                return;
            }
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-library-all .palleon-masonry-item').show();
                if (selector.find('#palleon-library-all-pagination').length) {
                    selector.find('#palleon-library-all-pagination').pagination('redraw');
                    selector.find('#palleon-library-all-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
            } else {
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                if ((searchTerm == '' || searchTerm.length < 1)) {
                    selector.find('#palleon-library-all .palleon-masonry-item').show();
                    if (selector.find('#palleon-library-all-pagination').length) {
                        selector.find('#palleon-library-all-pagination').pagination('redraw');
                        selector.find('#palleon-library-all-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-library-all-pagination').length) {
                        selector.find('#palleon-library-all-pagination').pagination('destroy');
                    }
                    selector.find('#palleon-library-all .palleon-masonry-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                    if (selector.find('#palleon-library-all .palleon-masonry-item:visible').length === 0) {
                        selector.find("#palleon-library-all-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
            }
        });

        /* Save Image */
        selector.find('#palleon-save-img').on('click', function() {
            var quality = parseFloat(selector.find('#palleon-save-img-quality').val());
            var format = selector.find('#palleon-save-img-format').val();
            var name = selector.find("#palleon-save-img-name").val();
            var imgData= '';
            add_watermark();
            canvas.setZoom(1);
            selector.find('#palleon-img-zoom').val(100);
            var zoomWidth = originalHeight;
            var zoomHeight = originalWidth;
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                zoomWidth = originalWidth;
                zoomHeight = originalHeight;
            }
            canvas.setWidth(zoomWidth);
            canvas.setHeight(zoomHeight);

            if (format == 'svg') {
                imgData = canvas.toSVG({suppressPreamble: false,width: originalWidth,height: originalHeight});
                var texts = canvas.getObjects().filter(element => element.objectType == 'textbox');
                var def = '<defs><style type="text/css"><![CDATA[';
                var fonts = [];
                $.each(texts, function(index, value) {
                    var font = value.fontFamily;
                    var loadFonts = 'yes';
                    for (var i = 0; i < webSafeFonts.length; i++) {
                        if (webSafeFonts[i][1] == font) {
                            loadFonts = 'no';
                            break;
                        } 
                    }
                    if (loadFonts == 'yes') {
                        if (!fonts.includes(font)) {
                            fonts.push(font);
                        }
                    }
                });
                if (fonts.length > 0) {
                    $.each(fonts, function(index, value) {
                        var isLastElement = index == fonts.length -1;
                        var slug = value.replace(/ /g, '+');
                        $.ajax({
                            url: "https://fonts.googleapis.com/css?family=" + slug + ":italic,regular,bold",
                            type: 'GET',
                            dataType: "text",
                            crossDomain:true,
                            success: function (cssText) {
                                def = def + cssText;
                                setTimeout(function() {
                                    if (isLastElement) {
                                        imgData = imgData.replace('<defs>', def + ']]></style>');
                                    }
                                }, 500);
                            },
                            error: function(jqXHR,error, errorThrown) {
                                if(jqXHR.status&&jqXHR.status==400){
                                    toastr.error(jqXHR.responseText, palleonParams.error);
                                }else{
                                    toastr.error(palleonParams.wrong, palleonParams.error);
                                }
                            }
                        });
                    });
                } 
            } else {
                imgData = canvas.toDataURL({ format: format, quality: quality, enableRetinaScaling: false});
                if (format != 'webp') {
                    imgData = changeDpiDataUrl(imgData, selector.find('#palleon-save-img-dpi').val());
                }
            }

            var key = Math.random().toString(36).substr(2, 9);

            try {
                db.collection('assets').add({
                    key: key,
                    src: imgData,
                    name: name,
                    type: format
                }).then(document => {
                    toastr.success(palleonParams.imgsaved, palleonParams.saved);
                    getAssets();
                });
            } catch(e) {
                toastr.error(e.message, palleonParams.error);
            }
            selector.find('.palleon-modal').hide();
            remove_watermark();
            adjustZoom();
            canvas.requestRenderAll();
        });

        /* Upload Image To Media Library */
        selector.find('#palleon-library-upload-img').on('change', function (e) {
            var reader = new FileReader();
            reader.fileName = this.files[0].name;
            reader.onload = function (event) {
                var imgObj = new Image();
                    convertToDataURL(event.target.result, function(dataUrl) {
                        imgObj.src = dataUrl;
                        imgObj.onload = function () {
                            var key = Math.random().toString(36).substr(2, 9);
                            try {
                                db.collection('assets').add({
                                    key: key,
                                    src: dataUrl,
                                    name: event.target.fileName,
                                    type: event.target.fileName.match(/\.[0-9a-z]+$/i)
                                }).then(document => {
                                    getAssets();
                                });
                            } catch(e) {
                                toastr.error(e.message, palleonParams.error);
                            }
                        };
                    });
            };
            reader.readAsDataURL(e.target.files[0]);
        });

        /* SVG LIBRARY */

        /* Helper function to check svg paths */
        function isSameColor(svg) {
            if (svg._objects) {
                if (typeof svg._objects[0].get('fill') !== 'object') {
                    var firstPathFill = (svg._objects[0].get('fill') || '').toLowerCase();
                    return svg._objects.every(function(path) {
                        return (path.get('fill') || '').toLowerCase() === firstPathFill;
                    });
                }
            } else {
                return true;
            }
        }

        /* Select SVG */
        selector.find('.svg-library-grid').on('click','>.palleon-masonry-item>.palleon-masonry-item-inner',function(){
            var fullSVG = $(this).find('img').data('full');
            fabric.loadSVGFromURL(fullSVG,function(objects, options){
                var svg = fabric.util.groupSVGElements(objects, options);
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', getScaledSize()[0] / 2);
                svg.set('top', getScaledSize()[1] / 2);
                if (isSameColor(svg)) {
                    svg.set('objectType', 'element');
                    canvas.fire('palleon:history', { type: 'element', text: palleonParams.added });
                } else {
                    svg.set('objectType', 'customSVG');
                    canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.added });
                }
                svg.scaleToWidth(getScaledSize()[0] / 2);
                svg.scaleToHeight(getScaledSize()[1] / 2);
                canvas.add(svg);
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
            }, function() {}, {
                crossOrigin: 'anonymous'
            });
            selector.find('#modal-svg-library').hide();
        });
        
        /* Search My SVGs */
        selector.find('#palleon-svg-library-my-search').on('click', function () {
            var input = $(this).parent().find('input');
            selector.find("#palleon-svg-library-my-noimg").addClass('d-none');
            if (input.val() == '') {
                return;
            }
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-svg-library-my .palleon-masonry-item').show();
                if (selector.find('#palleon-svg-library-my-pagination').length) {
                    selector.find('#palleon-svg-library-my-pagination').pagination('redraw');
                    selector.find('#palleon-svg-library-my-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
            } else {
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                if ((searchTerm == '' || searchTerm.length < 1)) {
                    selector.find('#palleon-svg-library-my .palleon-masonry-item').show();
                    if (selector.find('#palleon-svg-library-my-pagination').length) {
                        selector.find('#palleon-svg-library-my-pagination').pagination('redraw');
                        selector.find('#palleon-svg-library-my-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-svg-library-my-pagination').length) {
                        selector.find('#palleon-svg-library-my-pagination').pagination('destroy');
                    }
                    selector.find('#palleon-svg-library-my .palleon-masonry-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                    if (selector.find('#palleon-svg-library-my .palleon-masonry-item:visible').length === 0) {
                        selector.find("#palleon-svg-library-my-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
            }
        });

        /* Search All SVGs */
        selector.find('#palleon-svg-library-all-search').on('click', function () {
            var input = $(this).parent().find('input');
            selector.find("#palleon-library-all-noimg").addClass('d-none');
            if (input.val() == '') {
                return;
            }
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).find('.material-icons').html('search');
                $(this).removeClass('danger');
                $(this).addClass('primary');
                input.val('');
                selector.find('#palleon-svg-library-all .palleon-masonry-item').show();
                if (selector.find('#palleon-svg-library-all-pagination').length) {
                    selector.find('#palleon-svg-library-all-pagination').pagination('redraw');
                    selector.find('#palleon-svg-library-all-pagination').pagination('selectPage', 1);
                }
                input.prop('disabled', false);
            } else {
                $(this).addClass('cancel');
                $(this).find('.material-icons').html('close');
                $(this).removeClass('primary');
                $(this).addClass('danger');
                var searchTerm = input.val().toLowerCase().replace(/\s/g,' ');
                if ((searchTerm == '' || searchTerm.length < 1)) {
                    selector.find('#palleon-svg-library-all .palleon-masonry-item').show();
                    if (selector.find('#palleon-svg-library-all-pagination').length) {
                        selector.find('#palleon-svg-library-all-pagination').pagination('redraw');
                        selector.find('#palleon-svg-library-all-pagination').pagination('selectPage', 1);
                    }
                } else {
                    if (selector.find('#palleon-svg-library-all-pagination').length) {
                        selector.find('#palleon-svg-library-all-pagination').pagination('destroy');
                    }
                    selector.find('#palleon-svg-library-all .palleon-masonry-item').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
                    if (selector.find('#palleon-svg-library-all .palleon-masonry-item:visible').length === 0) {
                        selector.find("#palleon-svg-library-all-noimg").removeClass('d-none');
                    }
                }
                input.prop('disabled', true);
            }
        });

        /* Upload SVG To Media Library */
        selector.find('#palleon-svg-library-upload-img').on('change', function (e) {
            var reader = new FileReader();
            reader.fileName = this.files[0].name;
            reader.onload = function (event) {
                var svg = atob(event.target.result.replace(/data:image\/svg\+xml;base64,/, ''));
                var key = Math.random().toString(36).substr(2, 9);
                try {
                    db.collection('assets').add({
                        key: key,
                        src: svg,
                        name: event.target.fileName,
                        type: 'svg'
                    }).then(document => {
                        getAssets();
                    });
                } catch(e) {
                    toastr.error(e.message, palleonParams.error);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        });

        ////////////* INTEGRATIONS *////////////

        var PexelsApiKey = settings.PexelsApiKey;
        var PixabayApiKey = settings.PixabayApiKey;

        // Handle API Errors
        function handleApiErrors(response) {
            if (!response.ok) {
                throw Error(response.status);
            }
            return response;
        }

        /* PEXELS */
        if (PexelsApiKey != '') {
            function populatePexels(action, page) {
                var orientation = selector.find('#pexels-orientation').val();
                var color = selector.find('#pexels-color').val();
                var keyword = selector.find('#palleon-pexels-keyword').val();
                var url = '';
                var output = '';
                if (orientation == '' && color == '' && keyword == '') {
                    url = 'https://api.pexels.com/v1/curated?locale=' + settings.PexelsLanguage + '&page=' + page + '&per_page=' + settings.PexelsPagination;
                } else {
                    url = 'https://api.pexels.com/v1/search?locale=' + settings.PexelsLanguage + '&';
                    if (keyword != '') {
                        keyword = encodeURIComponent(keyword);
                        url += 'query=' + keyword + '&';
                    } else {
                        url += 'query=&';
                    }
                    if (orientation != '') {
                        url += 'orientation=' + orientation + '&';
                    }
                    if (color != '') {
                        url += 'color=' + color + '&';
                    }
                    url += 'page=' + page + '&per_page=' + settings.PexelsPagination;
                }
                var prefix = '<div class="palleon-grid media-library-grid pexels-grid">';
                var suffix = '</div>';
                var button = '<button id="pexels-loadmore" type="button" class="palleon-btn palleon-lg-btn primary" autocomplete="off" data-page="' + parseInt(page) + '">' + palleonParams.loadMore + '</button>';

                if(settings.apiCaching && sessionStorage.getItem(url)) {
                    if (action == 'search') {
                        selector.find('#pexels-output').html(prefix + sessionStorage.getItem(url) + suffix + button);
                    } else {
                        selector.find('#pexels-output > .pexels-grid').append(sessionStorage.getItem(url));
                        selector.find('#pexels-loadmore').remove();
                        selector.find('#pexels-output > .pexels-grid').after(button);
                    }  
                    lazyLoadInstance.update();
                    selector.find('#pexels').css('pointer-events', 'auto');
                    selector.find('#pexels-menu,#pexels-output').css('opacity', 1);
                } else {
                    fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': PexelsApiKey,
                        },
                        redirect: 'follow',
                    }).then(handleApiErrors).then(response => response.json()).then(data => {
                        var photos = data.photos;
                        if (photos == '') {
                            output = '<div class="notice notice-warning">' + palleonParams.nothing + '</div>';
                            if (action == 'search') {
                                selector.find('#pexels-output').html(output);
                            } else {
                                selector.find('#pexels-loadmore').prop('disabled', true);
                            }
                        } else {
                            $.each(photos, function( index, val ) {
                                var id = val.id;
                                var url = val.url;
                                var src = val.src;
                                var thumb = src.tiny;
                                var full = src[settings.PexelsImgSize];
                                var alt = val.alt;
                                
                                output += '<div class="palleon-masonry-item">';
                                output += '<a href="' + url + '" class="pexels-url" target="_blank"><span class="material-icons">info</span></a>';
                                output += '<div class="palleon-masonry-item-inner">';
                                output += '<div class="palleon-img-wrap">';
                                output += '<div class="palleon-img-loader"></div>';
                                output += '<img class="lazy" data-src="' + thumb + '" data-full="' + full + '" data-id="' + id + '" data-filename="pexels-' + id + '" title="' + alt + '" />';
                                output += '</div>';
                                if (alt != '') {
                                    output += '<div class="palleon-masonry-item-desc">' + alt + '</div>';
                                }
                                output += '</div></div>';
                            });
                            if (action == 'search') {
                                selector.find('#pexels-output').html(prefix + output + suffix + button);
                            } else {
                                selector.find('#pexels-output > .pexels-grid').append(output);
                                selector.find('#pexels-loadmore').remove();
                                selector.find('#pexels-output > .pexels-grid').after(button);
                            }  
                            if(settings.apiCaching) {
                                sessionStorage.setItem(url, output);
                            }
                            lazyLoadInstance.update();
                        }
                        selector.find('#pexels').css('pointer-events', 'auto');
                        selector.find('#pexels-menu,#pexels-output').css('opacity', 1);
                    }).catch(err => {
                        toastr.error(palleonParams.pexelsApiError, err);
                        selector.find('#pexels').css('pointer-events', 'auto');
                        selector.find('#pexels-menu,#pexels-output').css('opacity', 1);
                    });
                }
            }
            populatePexels('search','1');

            selector.find('#palleon-pexels-search').on('click', function () {
                selector.find('#pexels').css('pointer-events', 'none');
                selector.find('#pexels-menu,#pexels-output').css('opacity', 0.5);
                populatePexels('search','1');
            });

            selector.find('#pexels-output').on('click','#pexels-loadmore',function(){
                selector.find('#pexels').css('pointer-events', 'none');
                selector.find('#pexels-menu,#pexels-output').css('opacity', 0.5);
                populatePexels('loadmore',parseInt($(this).data('page')) + 1);
            });

            selector.find('#palleon-pexels-keyword').on('keyup input', function () {
                var val = $(this).val();
                if (val == '') {
                    selector.find('#pexels-orientation').val('');
                    selector.find('#pexels-color').val('');
                    selector.find('#pexels-orientation').prop('disabled', true);
                    selector.find('#pexels-color').prop('disabled', true);
                } else {
                    selector.find('#pexels-orientation').prop('disabled', false);
                    selector.find('#pexels-color').prop('disabled', false);
                }
            });
        }

        /* PIXABAY */
        if (PixabayApiKey != '') {
            function populatePixabay(action, page) {
                var orientation = selector.find('#pixabay-orientation').val();
                var color = selector.find('#pixabay-color').val();
                var keyword = selector.find('#palleon-pixabay-keyword').val();
                var category = selector.find('#pixabay-category').val();
                var url = '';
                var output = '';
                if (orientation == '' && color == '' && keyword == '' && category == '') {
                    url = 'https://pixabay.com/api/?key=' + PixabayApiKey + '&editors_choice=true&order=latest&image_type=photo&lang=' + settings.PixabayLanguage + '&safesearch=' + settings.PixabaySafeSearch + '&page=' + page + '&per_page=' + settings.PixabayPagination;
                } else {
                    url = 'https://pixabay.com/api/?key=' + PixabayApiKey + '&image_type=photo&order=latest&lang=' + settings.PixabayLanguage + '&safesearch=' + settings.PixabaySafeSearch + '&editors_choice=' + settings.PixabayEditorsChice + '&';
                    if (keyword != '') {
                        keyword = encodeURIComponent(keyword);
                        url += 'q=' + keyword + '&';
                    }
                    if (orientation != '') {
                        url += 'orientation=' + orientation + '&';
                    }
                    if (color != '') {
                        url += 'color=' + color + '&';
                    }
                    if (category != '') {
                        url += 'category=' + category + '&';
                    }
                    url += 'page=' + page + '&per_page=' + settings.PixabayPagination;
                }
                var prefix = '<div class="palleon-grid media-library-grid pixabay-grid">';
                var suffix = '</div>';
                var button = '<button id="pixabay-loadmore" type="button" class="palleon-btn palleon-lg-btn primary" autocomplete="off" data-page="' + parseInt(page) + '">' + palleonParams.loadMore + '</button>';

                if(settings.apiCaching && sessionStorage.getItem(url)) {
                    if (action == 'search') {
                        selector.find('#pixabay-output').html(prefix + sessionStorage.getItem(url) + suffix + button);
                    } else {
                        selector.find('#pixabay-output > .pixabay-grid').append(sessionStorage.getItem(url));
                        selector.find('#pixabay-loadmore').remove();
                        selector.find('#pixabay-output > .pixabay-grid').after(button);
                    }  
                    lazyLoadInstance.update();
                    selector.find('#pixabay').css('pointer-events', 'auto');
                    selector.find('#pixabay-menu,#pixabay-output').css('opacity', 1);
                } else {
                    $.ajax({
                        url: url,
                        type: 'POST',
                        timeout: 0,
                        crossDomain: true,
                        processData: false,
                        contentType: false,
                        success: function(data){
                            if(data) {
                                if (parseInt(data.totalHits) > 0) {
                                    var photos = data.hits;
                                    $.each(photos, function( index, val ) {
                                        var id = val.id;
                                        var url = val.pageURL;
                                        var thumb = val.webformatURL;
                                        var full = val.largeImageURL;
                                        if (val.fullHDURL !== undefined) {
                                            full = val.fullHDURL;
                                        }
                                        var alt = val.tags;

                                        output += '<div class="palleon-masonry-item">';
                                        output += '<a href="' + url + '" class="pixabay-url" target="_blank"><span class="material-icons">info</span></a>';
                                        output += '<div class="palleon-masonry-item-inner">';
                                        output += '<div class="palleon-img-wrap">';
                                        output += '<div class="palleon-img-loader"></div>';
                                        output += '<img class="lazy" data-src="' + thumb + '" data-full="' + full + '" data-id="' + id + '" data-filename="pixabay-' + id + '" title="' + alt + '" />';
                                        output +=  '</div>';
                                        if (alt != '') {
                                            output += '<div class="palleon-masonry-item-desc">' + alt + '</div>';
                                        }
                                        output += '</div></div>';
                                    });
                                    if (action == 'search') {
                                        selector.find('#pixabay-output').html(prefix + output + suffix + button);
                                    } else {
                                        selector.find('#pixabay-output > .pixabay-grid').append(output);
                                        selector.find('#pixabay-loadmore').remove();
                                        selector.find('#pixabay-output > .pixabay-grid').after(button);
                                    }  
                                    if(settings.apiCaching) {
                                        sessionStorage.setItem(url, output);
                                    }
                                    lazyLoadInstance.update();
                                } else {
                                    output = '<div class="notice notice-warning">' + palleonParams.nothing + '</div>';
                                    if (action == 'search') {
                                        selector.find('#pixabay-output').html(output);
                                    } else {
                                        selector.find('#pixabay-loadmore').prop('disabled', true);
                                    }
                                }
                                selector.find('#pixabay').css('pointer-events', 'auto');
                                selector.find('#pixabay-menu,#pixabay-output').css('opacity', 1);
                            }
                        },
                        error: function(jqXHR,error, errorThrown) {
                            if(jqXHR.status&&jqXHR.status==400){
                                toastr.error(jqXHR.responseText, palleonParams.error);
                            }else{
                                toastr.error(palleonParams.wrong, palleonParams.error);
                            }
                            selector.find('#pixabay').css('pointer-events', 'auto');
                            selector.find('#pixabay-menu,#pixabay-output').css('opacity', 1);
                    }
                    });
                }
            }
            populatePixabay('search','1');

            /* Pixabay Search */
            selector.find('#palleon-pixabay-search').on('click', function () {
                selector.find('#pixabay').css('pointer-events', 'none');
                selector.find('#pixabay-menu,#pixabay-output').css('opacity', 0.5);
                populatePixabay('search','1');
            });

            selector.find('#pixabay-output').on('click','#pixabay-loadmore',function(){
                selector.find('#pixabay').css('pointer-events', 'none');
                selector.find('#pixabay-menu,#pixabay-output').css('opacity', 0.5);
                populatePixabay('loadmore',parseInt($(this).data('page')) + 1);
            });
        }

        /* HISTORY */

        function objectName(type) {
            var layerName = palleonParams.object;
            var layerIcon = 'category';
            if (type == null) {
                layerName = palleonParams.object;
                layerIcon = 'category';
            } else if (type == 'textbox') {
                layerName = palleonParams.text; 
                layerIcon = 'title';
            } else if (type == 'drawing') {
                layerName = palleonParams.freeDrawing; 
                layerIcon = 'brush';
            } else if (type == 'frame') {
                layerName = palleonParams.frame; 
                layerIcon = 'wallpaper';
            } else if (type == 'image') {
                layerName = palleonParams.image; 
                layerIcon = 'image';
            } else if (type == 'circle') {
                layerName = palleonParams.circle;
            } else if (type == 'square') {
                layerName = palleonParams.square;
            } else if (type == 'rectangle') {
                layerName = palleonParams.rectangle;
            } else if (type == 'triangle') {
                layerName = palleonParams.triangle;
            } else if (type == 'ellipse') {
                layerName = palleonParams.ellipse;
            } else if (type == 'trapezoid') {
                layerName = palleonParams.trapezoid;
            } else if (type == 'pentagon') {
                layerName = palleonParams.pentagon;
            } else if (type == 'octagon') {
                layerName = palleonParams.octagon;
            } else if (type == 'emerald') {
                layerName = palleonParams.emerald;
            } else if (type == 'diamond') {
                layerName = palleonParams.diamond;
            } else if (type == 'parallelogram') {
                layerName = palleonParams.parallelogram;
            } else if (type == 'star') {
                layerName = palleonParams.star;
            } else if (type == 'element') {
                layerName = palleonParams.element;
                layerIcon = 'star';
            } else if (type == 'BG') {
                layerName = palleonParams.bg; 
                layerIcon = 'image';
            } else if (type == 'customShape') {
                layerName = palleonParams.customShape;
            } else if (type == 'customSVG') {
                layerName = palleonParams.customSvg;
            } else if (type == 'apps') {
                layerName = palleonParams.app;
                layerIcon = 'apps';
            }
            return '<span class="material-icons">' + layerIcon + '</span>' + layerName;
        }

        // Add to history
        function addToHistory(action) {
            var list = selector.find('#palleon-history-list');
            var today = new Date();
            var time = String(today.getHours()).padStart(2, '0') + ":" + String(today.getMinutes()).padStart(2, '0') + ":" + String(today.getSeconds()).padStart(2, '0');
            var json = canvas.toJSON(JSON_defaults);

            selector.find('#palleon-history').prop('disabled', false);
            list.find('li').removeClass('active');
            list.prepend('<li class="active"><div class="info">' + action + '<span class="time">' + time + '</span></div><div><button type="button" class="palleon-btn primary"><span class="material-icons">restore</span>Restore</button><button type="button" class="palleon-btn danger"><span class="material-icons">clear</span>Delete</button><script type="text/json">' + JSON.stringify(json) + '</script></div></li>');

            var count = list.find('li').length;
            var limit = list.data('max');

            if (count > limit) {
                list.find('li').last().remove();
            }

            selector.find('#palleon-history-count').html(list.find('li').length);

            var undo = list.find('li.active').next('li');
            var redo = list.find('li.active').prev('li');

            if (undo.length) {
                selector.find('#palleon-undo').prop('disabled', false);
            } else {
                selector.find('#palleon-undo').prop('disabled', true);
            }
            if (redo.length) {
                selector.find('#palleon-redo').prop('disabled', false);
            } else {
                selector.find('#palleon-redo').prop('disabled', true);
            }
        }

        // Undo
        selector.find('#palleon-undo').on('click',function(){
            var target = selector.find('#palleon-history-list li.active').next('li');
            if (target.length) {
                target.find('.palleon-btn.primary').trigger('click');
                selector.find('#palleon-redo').prop('disabled', false);
            } else {
                selector.find('#palleon-undo').prop('disabled', true);
            }
        });

        // Redo
        selector.find('#palleon-redo').on('click',function(){
            var target = selector.find('#palleon-history-list li.active').prev('li');
            if (target.length) {
                target.find('.palleon-btn.primary').trigger('click');
                selector.find('#palleon-undo').prop('disabled', false);
            } else {
                selector.find('#palleon-redo').prop('disabled', true);
            }
        });

        // Delete history
        selector.find('#palleon-history-list').on('click','.palleon-btn.danger',function(){
            $(this).parent().parent().remove();
            if (!$('#palleon-history-list li').length) {
                selector.find('#palleon-history').prop('disabled', true);
                selector.find('#palleon-undo').prop('disabled', true);
                selector.find('#palleon-redo').prop('disabled', true);
                selector.find('.palleon-modal').hide();
            }
        });

        // Restore history
        selector.find('#palleon-history-list').on('click','.palleon-btn.primary',function(){
            selector.find('#palleon-history-list li').removeClass('active');
            $(this).parent().parent().addClass('active');
            var undo = selector.find('#palleon-history-list li.active').next('li');
            var redo = selector.find('#palleon-history-list li.active').prev('li');
            if (undo.length) {
                selector.find('#palleon-undo').prop('disabled', false);
            } else {
                selector.find('#palleon-undo').prop('disabled', true);
            }
            if (redo.length) {
                selector.find('#palleon-redo').prop('disabled', false);
            } else {
                selector.find('#palleon-redo').prop('disabled', true);
            }
            var json = JSON.parse($(this).parent().find('script').html());
            selector.find('.palleon-modal').hide();
            convertToDataURL(json.backgroundImage.src, function(dataUrl) {
                json.backgroundImage.src = dataUrl;
                loadJSON(json);
                selector.find('#palleon-canvas-loader').hide();
            });
        });

        /* Clear history */
        selector.find('#palleon-clear-history').on('click',function(){
            var answer = window.confirm(palleonParams.question1);
            if (answer) {
                selector.find('#palleon-history-list li').remove();
                selector.find('#palleon-history').prop('disabled', true);
                selector.find('#palleon-undo').prop('disabled', true);
                selector.find('#palleon-redo').prop('disabled', true);
                selector.find('.palleon-modal').hide();
            }
        });

        /* EVENTS */

        canvas.on('palleon:history', function(e) {
            addToHistory(objectName(e.type) + ' ' + e.text);
        });

        var isObjectMoving  = false;

        canvas.on('mouse:up', function (e) {
            var obj = e.target;
            if (obj !== null) {
                var objType = obj.objectType;
                if (isObjectMoving) {
                    addToHistory(objectName(objType) + ' ' + palleonParams.moved);
                }
            }
            if (typeof canvas.overlayImage !== "undefined" && canvas.overlayImage !== null) {
                canvas.overlayImage.set('opacity', 1);
            }
        });

        canvas.on('object:moving', function (e) {
            isObjectMoving = true;
            if (typeof canvas.overlayImage !== "undefined" && canvas.overlayImage !== null) {
                canvas.overlayImage.set('opacity', 0.7);
            }
            var tempW = originalHeight;
            var tempH = originalWidth;
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                tempW = originalWidth;
                tempH = originalHeight;
            }
            var obj = e.target;
            var objWidth = obj.getScaledWidth();
            var objHeight = obj.getScaledHeight();
            if (obj.isPartiallyOnScreen() && obj.objectType == 'clipPath') {
                // top - left
                if (obj.top < 0 && obj.left < 0) {
                    obj.top = 0;
                    obj.left = 0;
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                } 
                // top - right
                else if (obj.top < 0 && objWidth + obj.left > tempW) {
                    obj.top = 0;
                    obj.left = tempW - objWidth;
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                } 
                // bottom - left
                else if (objHeight + obj.top > tempH && obj.left < 0) {    
                    obj.top = tempH - objHeight;
                    obj.left = 0;
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                }
                // bottom - right
                else if (objHeight + obj.top > tempH && objWidth + obj.left > tempW) {    
                    obj.top = tempH - objHeight;
                    obj.left = tempW - objWidth;
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                }
                // top
                else if (obj.top < 0) {
                    obj.top = 0;
                    obj.lockMovementY = true;
                } 
                // left
                else if (obj.left < 0) {
                    obj.left = 0;
                    obj.lockMovementX = true;
                } 
                // right
                else if (objWidth + obj.left > tempW) {
                    obj.left = tempW - objWidth;
                    obj.lockMovementX = true;
                } 
                // bottom
                else if (objHeight + obj.top > tempH) {    
                    obj.top = tempH - objHeight;
                    obj.lockMovementY = true;
                }
                obj.setCoords();
            }
        });

        canvas.on('object:scaling', function (e) {
            var tempW = originalHeight;
            var tempH = originalWidth;
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                tempW = originalWidth;
                tempH = originalHeight;
            }
            var obj = e.target;
            var objWidth = obj.getScaledWidth();
            var objHeight = obj.getScaledHeight();
            if (obj.isPartiallyOnScreen() && obj.objectType == 'clipPath') { 
                // Max Width
                if(objWidth >= tempW){
                    obj.set({scaleX: tempW/obj.width});
                    obj.lockScalingX = true;
                }
                // Max Height
                if(objHeight >= tempH){
                    obj.set({scaleY: tempH/obj.height});
                    obj.lockScalingY = true;
                }
                // top
                if (obj.top < 0) { 
                    obj.top = 0;
                    obj.lockScalingX = true;
                    obj.lockScalingY = true;
                    obj.setCoords();
                } 
                // left
                if (obj.left < 0) {
                    obj.left = 0;
                    obj.lockScalingX = true;
                    obj.lockScalingY = true;
                    obj.setCoords();
                } 
                // right
                if (objWidth + obj.left > tempW) {
                    obj.left = tempW - objWidth;
                    obj.lockScalingX = true;
                    obj.lockScalingY = true;
                    obj.setCoords();
                } 
                // bottom
                if (objHeight + obj.top > tempH) {
                    obj.top = tempH - objHeight;
                    obj.lockScalingX = true;
                    obj.lockScalingY = true;
                    obj.setCoords();
                }  
            }
        });    

        canvas.on('object:added', function (e) {
            var obj = e.target;
            if (obj.objectType != 'clipPath' && obj.objectType != 'drawing' && obj.objectType != 'watermark') {
                if (canvas.isDrawingMode === true) {
                    obj.set('objectType', 'drawing');
                    obj.set('selectable', false);
                    obj.set('lockMovementX', true);
                    obj.set('lockMovementY', true);
                    obj.set('lockRotation', true);
                } else {
                    var order = canvas.getObjects().indexOf(obj);
                    var output = '';
                    var layerName = 'Object';
                    var layerIcon = 'category';
                    var visibility = 'layer-visible';
                    var visibilityTag = 'visibility';
                    var lock = 'layer-unlocked';
                    var lockTag = 'lock_open';

                    if (obj.visible == false) {
                        visibility = 'layer-hidden';
                        visibilityTag = 'visibility_off';
                    }

                    if (obj.selectable == false) {
                        lock = 'layer-locked';
                        lockTag = 'lock';
                    }

                    obj.set('id', new Date().getTime());

                    selector.find("#palleon-layers > li").removeClass('active');

                    if (obj.objectType == 'textbox') {
                        layerName = obj.text; 
                        layerIcon = 'title';
                    } else if (obj.objectType == 'drawing') {
                        layerName = palleonParams.freeDrawing; 
                        layerIcon = 'brush';
                    } else if (obj.objectType == 'frame') {
                        layerName = palleonParams.frame; 
                        layerIcon = 'wallpaper';
                    } else if (obj.objectType == 'image') {
                        layerName = palleonParams.image; 
                        layerIcon = 'image';
                    } else if (obj.objectType == 'circle') {
                        layerName = palleonParams.circle;
                    } else if (obj.objectType == 'square') {
                        layerName = palleonParams.square;
                    } else if (obj.objectType == 'rectangle') {
                        layerName = palleonParams.rectangle;
                    } else if (obj.objectType == 'triangle') {
                        layerName = palleonParams.triangle;
                    } else if (obj.objectType == 'ellipse') {
                        layerName = palleonParams.ellipse;
                    } else if (obj.objectType == 'trapezoid') {
                        layerName = palleonParams.trapezoid;
                    } else if (obj.objectType == 'pentagon') {
                        layerName = palleonParams.pentagon;
                    } else if (obj.objectType == 'octagon') {
                        layerName = palleonParams.octagon;
                    } else if (obj.objectType == 'emerald') {
                        layerName = palleonParams.emerald;
                    } else if (obj.objectType == 'diamond') {
                        layerName = palleonParams.diamond;
                    } else if (obj.objectType == 'parallelogram') {
                        layerName = palleonParams.parallelogram;
                    } else if (obj.objectType == 'star') {
                        layerName = palleonParams.star;
                    } else if (obj.objectType == 'customShape') {
                        layerName = palleonParams.customShape;
                    } else if (obj.objectType == 'element') {
                        layerName = palleonParams.element;
                        layerIcon = 'star';
                    } else if (obj.objectType == 'customSVG') {
                        layerName = palleonParams.customSvg;
                    } else if (obj.objectType == 'app') {
                        layerName = palleonParams.app;
                        layerIcon = 'apps';
                    }

                    if ("layerName" in obj) {
                        layerName = obj.layerName;
                    }

                    output = '<li id="' + obj.id + '" data-type="' + obj.objectType + '" class="layer-' + obj.objectType + ' active" data-sort="' + order + '"><span class="material-icons">' + layerIcon + '</span><input class="layer-name" autocomplete="off" value="' + layerName + '" /><span class="material-icons layer-settings">settings</span><div class="layer-icons"><a class="material-icons lock-layer ' + lock + '" title="' + palleonParams.lockunlock + '">' + lockTag + '</a><a class="material-icons text-success duplicate-layer" title="' + palleonParams.duplicate + '">content_copy</a><a class="material-icons layer-visibility ' + visibility + '" title="' + palleonParams.showhide + '">' + visibilityTag + '</a><a class="material-icons text-danger delete-layer" title="' + palleonParams.delete + '">clear</a></div></li>';

                    selector.find('#palleon-layers').prepend(output);
                    deleteLayerEvent(obj.id);
                    cloneLayerEvent(obj.id);
                    visibilityLayerEvent(obj.id);
                    lockLayerEvent(obj.id);
                    clickLayerEvent(obj.id);
                    layerNameEvent(obj.id);
                    selector.find('#palleon-layers').sortable('refresh');
                    checkLayers();
                    addDeleteIcon(obj);
                    addCloneIcon(obj);
                }
            }
        });

        canvas.on('object:modified', function (e) {
            var obj = e.target;
            if (obj.objectType == 'textbox' && obj.id) {
                selector.find("#palleon-layers #" + obj.id + " .layer-name").html(obj.text);
                selector.find('#text-rotate').val(parseInt(canvas.getActiveObject().angle));
                selector.find('#text-rotate').parent().parent().find('.slider-label span').html(parseInt(canvas.getActiveObject().angle));
            }
            if (obj.objectType == 'image' && obj.id) {
                selector.find('#img-rotate').val(parseInt(canvas.getActiveObject().angle));
                selector.find('#img-rotate').parent().parent().find('.slider-label span').html(parseInt(canvas.getActiveObject().angle));
            }
            if (obj.objectType == 'element' && obj.id) {
                selector.find('#element-rotate').val(parseInt(canvas.getActiveObject().angle));
                selector.find('#element-rotate').parent().parent().find('.slider-label span').html(parseInt(canvas.getActiveObject().angle));
            }
            if (obj.objectType == 'customSVG' && obj.id) {
                selector.find('#customsvg-rotate').val(parseInt(canvas.getActiveObject().angle));
                selector.find('#customsvg-rotate').parent().parent().find('.slider-label span').html(parseInt(canvas.getActiveObject().angle));
            }
            if (shapeTypes.includes(obj.objectType) && obj.id) {
                selector.find('#shape-rotate').val(parseInt(canvas.getActiveObject().angle));
                selector.find('#shape-rotate').parent().parent().find('.slider-label span').html(parseInt(canvas.getActiveObject().angle));
            }
            if (obj.objectType == 'clipPath') { 
                obj.lockScalingX = false;
                obj.lockScalingY = false;
                obj.lockMovementX = false;
                obj.lockMovementY = false;
            }
            if (cropping) {
                checkCrop(obj);
            }
        });

        canvas.on('erasing:end', function () {
            addToHistory('<span class="material-icons">brush</span>' + palleonParams.erased);
        });

        /* Horizontal Align Center */
        selector.find('.palleon-horizontal-center').on('click', function() {
            var obj = canvas.getActiveObject();
            obj.set('originX', 'center');
            obj.set('left', getScaledSize()[0] / 2);
            canvas.requestRenderAll();   
        });

        /* Vertical Align Center */
        selector.find('.palleon-vertical-center').on('click', function() {
            var obj = canvas.getActiveObject();
            obj.set('originY', 'center');
            obj.set('top', getScaledSize()[1] / 2);
            canvas.requestRenderAll();  
        });

        // Selection Events
        canvas.on('selection:created', function (e) {
            var obj = e.selected;
            layerToggle(obj);
        });

        canvas.on('selection:updated', function (e) {
            var obj = e.selected;
            layerToggle(obj);
        });

        canvas.on('selection:cleared', function () {
            if (!cropping) {
                selector.find('#palleon-text-settings').hide();
                selector.find('#palleon-image-settings').hide();
                selector.find('#palleon-shape-settings').hide();
                selector.find('#palleon-custom-element-options').hide();
                selector.find('#palleon-custom-element-options-info').show();
                selector.find('#palleon-shape-settings-info').show();
                selector.find('#palleon-custom-svg-options').hide();
                selector.find("#palleon-layers > li").removeClass('active');
                } else {
                    crop(cropobj);
                    selector.find('#crop-image-object').removeClass('d-none');
                    selector.find('#crop-image-object-selection').addClass('d-none');
                    selector.find("#palleon-icon-menu, #palleon-top-bar, #palleon-right-col, #palleon-img-upload-wrap, #palleon-img-media-library, #palleon-image-settings > *, .palleon-content-bar").css('pointer-events', 'auto');
                }
        });

        /* Layers */
        selector.find("#palleon-layers").sortable({
            placeholder: "layer-placeholder",
            axis: 'y',
            update: function(e,ui) {
                var objects = canvas.getObjects();
                $('#palleon-layers li').each(function(index, value) {
                    $(this).attr("data-sort", index + 1);
                    objects.filter(element => element.id == value.id).forEach(element => element.moveTo(-(index + 1)));
                });
                canvas.requestRenderAll();
            },
            create: function(e,ui) {
                checkLayers();
            },
        }).disableSelection();

        /* Settings toggle */
        selector.find('#palleon-layers').on('click','.layer-settings',function(){
            var layerSettings = $(this).next();
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                layerSettings.hide();
            } else {
                selector.find('#palleon-layers .layer-icons').hide();
                selector.find('#palleon-layers .layer-settings').removeClass('active');
                $(this).addClass('active');
                layerSettings.show();
            }
        });

        /* Delete Layer Event */
        function deleteLayerEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.find("a.delete-layer").on('click', function(e) {
                e.preventDefault();
                canvas.fire('palleon:history', { type: item.data('type'), text: palleonParams.removed });
                var objects = canvas.getObjects();
                objects.filter(element => element.id == id).forEach(element => canvas.remove(element));
                item.remove();
                canvas.requestRenderAll();
                selector.find('#palleon-layers').sortable('refresh');
                checkLayers();
            });
        }

        /* Clone Layer Event */
        function cloneLayerEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.find("a.duplicate-layer").on('click', function(e) {
                e.preventDefault();
                var objects = canvas.getObjects();
                objects.filter(element => element.id == id).forEach(element => element.clone(function(cloned) {
                    cloned.set('id', new Date().getTime());
                    cloned.set('objectType', element.objectType);
                    canvas.add(cloned);
                    canvas.setActiveObject(cloned);
                }));
                canvas.requestRenderAll();
                selector.find('#palleon-layers').sortable('refresh');
                canvas.fire('palleon:history', { type: item.data('type'), text: palleonParams.added });
            });
        }

        /* Visibility Layer Event */
        function visibilityLayerEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.find("a.layer-visibility").on('click', function(e) {
                e.preventDefault();
                var objects = canvas.getObjects();
                if ($(this).hasClass('layer-visible')) {
                    $(this).removeClass('layer-visible');
                    $(this).addClass('layer-hidden');
                    $(this).html('visibility_off');
                    objects.filter(element => element.id == id).forEach(element => element.set('visible', false));
                } else if ($(this).hasClass('layer-hidden')) {
                    $(this).removeClass('layer-hidden');
                    $(this).addClass('layer-visible');
                    $(this).html('visibility');
                    objects.filter(element => element.id == id).forEach(element => element.set('visible', true));
                }
                canvas.requestRenderAll();
            });
        }

        /* Lock/Unlock Layer Event */
        function lockLayerEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.find("a.lock-layer").on('click', function(e) {
                e.preventDefault();
                var obj = canvas.getActiveObject();
                if ($(this).hasClass('layer-unlocked')) {
                    $(this).removeClass('layer-unlocked');
                    $(this).addClass('layer-locked');
                    $(this).html('lock');
                    obj.set({lockMovementX: true, lockMovementY: true, lockRotation:true, selectable:false});
                } else if ($(this).hasClass('layer-locked')) {
                    $(this).removeClass('layer-locked');
                    $(this).addClass('layer-unlocked');
                    $(this).html('lock_open');
                    obj.set({lockMovementX: false, lockMovementY: false, lockRotation:false, selectable:true});
                }
                canvas.requestRenderAll();
            });
        }

        /* Layer Click Event */
        function clickLayerEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.on('click', function(e) {
                var objects = canvas.getObjects();
                var id = $(this).attr('id');
                objects.filter(element => element.id == id).forEach(element => canvas.setActiveObject(element));
                selector.find("#palleon-layers > li").removeClass('active');
                $(this).addClass('active');
                canvas.requestRenderAll();
            });
        }

        /* Layer Name Event */
        function layerNameEvent(id) {
            var item = selector.find("#palleon-layers #" + id);
            item.find('.layer-name').on('change', function(e) {
                var objects = canvas.getObjects();
                var id = $(this).parent('li').attr('id');
                objects.filter(element => element.id == id).forEach(element => element.set({layerName: $(this).val()}));
            });
        }

        /* Layer Click Event */
        function checkLayers() {
            if (! selector.find("#palleon-layers li").length) {
                selector.find("#palleon-no-layer").show();
                selector.find("#palleon-layer-delete-wrap").css('visibility', 'hidden');
            } else {
                selector.find("#palleon-no-layer").hide();
                selector.find("#palleon-layer-delete-wrap").css('visibility', 'visible');
            }
        }

        /* Layer Toggle */
        function layerToggle(obj) {
            if (!cropping) {
            selector.find("#palleon-layers li").removeClass('active');
            if (obj.length >= 2) {
                for (var i = 0; i < obj.length; i++) {
                    selector.find("#palleon-layers #" + obj[i].id).addClass('active');
                }
            } else {
                obj = obj[0];
                if (typeof obj !== "undefined" && obj.objectType) {
                    // Textbox
                    if (obj.objectType == 'textbox') {
                        selector.find('#palleon-text-settings').show();
                        setTextSettings(obj);
                        if (!selector.find('#palleon-btn-text').hasClass('active')) {
                            selector.find('#palleon-btn-text').trigger('click');
                        }
                        selector.find('#palleon-font-family').trigger('change');
                    } else {
                        selector.find('#palleon-text-settings').hide();
                    }
                    // Image
                    if (obj.objectType == 'image') {
                        selector.find('#palleon-image-settings').show();
                        setImageSettings(obj);
                        if (!selector.find('#palleon-btn-image').hasClass('active')) {
                            selector.find('#palleon-btn-image').trigger('click');
                            selector.find('#palleon-img-mode').trigger('click');
                        }
                    } else {
                        selector.find('#palleon-image-settings').hide();
                    }
                    // Frames
                    if (obj.objectType == 'frame') {
                        if (!selector.find('#palleon-btn-frames').hasClass('active')) {
                            selector.find('#palleon-btn-frames').trigger('click');
                        }
                    }
                    // Elements
                    if (obj.objectType == 'element') {
                        selector.find('#palleon-custom-element-options').show();
                        selector.find('#palleon-custom-element-options-info').hide();
                        setElementSettings(obj);
                        if (!selector.find('#palleon-btn-elements').hasClass('active')) {
                            selector.find('#palleon-btn-elements').trigger('click');
                        }
                        selector.find('#palleon-custom-element-open').trigger('click');
                    } else {
                        selector.find('#palleon-custom-element-options').hide();
                        selector.find('#palleon-custom-element-options-info').show();
                    }
                    // Custom SVG
                    if (obj.objectType == 'customSVG') {
                        selector.find('#palleon-custom-svg-options').show();
                        setCustomSVGSettings(obj);
                        if (!selector.find('#palleon-btn-elements').hasClass('active')) {
                            selector.find('#palleon-btn-elements').trigger('click');
                        }
                        selector.find('#palleon-custom-svg-open').trigger('click');
                    } else {
                        selector.find('#palleon-custom-svg-options').hide();
                    }
                    // Shapes
                    if (shapeTypes.includes(obj.objectType)) {
                        if (resizableShapeTypes.includes(obj.objectType)) {
                            selector.find('#shape-custom-width-wrap').show();
                        } else {
                            selector.find('#shape-custom-width-wrap').hide();
                        }
                        selector.find('#palleon-shape-settings').show();
                        setShapeSettings(obj);
                        if (!selector.find('#palleon-btn-shapes').hasClass('active')) {
                            selector.find('#palleon-btn-shapes').trigger('click');
                        }
                        selector.find('#palleon-shape-setting-open').trigger('click');
                    } else {
                        selector.find('#palleon-shape-settings').hide();
                    }
                    if (obj.id) {
                        selector.find("#palleon-layers #" + obj.id).addClass('active');
                    }
                } else {
                    $.each(obj, function( index, val ) {
                        selector.find("#palleon-layers #" + val.id).addClass('active');
                    });
                }
            }
            }
        }

        /* Layer Delete */
        selector.find('#palleon-layer-delete').on('click', function() {
            var answer = window.confirm(palleonParams.question2);
            if (answer) {
                var type = selector.find('#palleon-layer-select').val();
                var objects = canvas.getObjects();
                if (type == 'all') {
                    objects.forEach(element => canvas.remove(element));
                    selector.find("#palleon-layers > li").remove();
                } else {
                    objects.filter(element => element.objectType == type).forEach(element => canvas.remove(element));
                    selector.find("#palleon-layers > li.layer-" + type).remove();
                }
                canvas.requestRenderAll();
                selector.find('#palleon-layers').sortable('refresh');
                checkLayers();
            }
        });

        /* Set Background Image */
        function setBackgroundImage() {
            fabric.Image.fromURL(imgurl, function(img) {
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    objectType: 'BG',
                    mode: mode,
                    top: 0, 
                    left: 0,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: false,
                    angle: rotate, 
                    originX: originX, 
                    originY: originY,
                    lockMovementX: true,
                    lockMovementY: true,
                    lockRotation: true,
                    erasable: true
                }, { crossOrigin: 'anonymous' });
            }); 
        }

        /* Adjust Zoom */
        function adjustZoom(zoom) {
            var zoomWidth = originalHeight;
            var zoomHeight = originalWidth;
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                zoomWidth = originalWidth;
                zoomHeight = originalHeight;
            }
            if (zoom) {
                zoom = zoom / 100;
                canvas.setZoom(zoom);
            } else { 
                var currentZoom = selector.find('#palleon-img-zoom').val();
                var requiredRatio = 100;
                var ratio = 1;
                var ratio2 = 0;
                if (zoomWidth < selector.find('#palleon-content').width() && zoomHeight < selector.find('#palleon-content').height()) {
                    canvas.setZoom(1);
                    selector.find('#palleon-img-zoom').val(100);
                } else {
                    if (zoomWidth > selector.find('#palleon-content').width()) {
                        ratio = (selector.find('#palleon-content').width() - 60) / zoomWidth;
                        requiredRatio = ratio.toFixed(2) * 100;
                        if (currentZoom > requiredRatio) {
                            canvas.setZoom(ratio.toFixed(2));
                            selector.find('#palleon-img-zoom').val(ratio.toFixed(2) * 100);
                            ratio2 = ratio.toFixed(2);
                        }
                    }
                    if (zoomHeight > selector.find('#palleon-content').height()) {
                        ratio = selector.find('#palleon-content').height() / zoomHeight;
                        requiredRatio = ratio.toFixed(2) * 100;
                        if (currentZoom > requiredRatio) {
                            if (ratio2 === 0 || ratio2 > ratio.toFixed(2)) {
                                canvas.setZoom(ratio.toFixed(2));
                                selector.find('#palleon-img-zoom').val(ratio.toFixed(2) * 100);
                            }
                        }
                    }
                }
            }

            canvas.setWidth(zoomWidth * canvas.getZoom());
            canvas.setHeight(zoomHeight * canvas.getZoom());

            if (canvas.isDrawingMode === true) {
                if (selector.find('#palleon-erase-btn').hasClass('active')) {
                    selector.find('#eraser-width').trigger('input');
                }
                if (selector.find('#palleon-draw-btn').hasClass('active')) {
                    selector.find('#brush-width').trigger('input');
                }
            }
        }

        /* Pan */
        selector.find('#palleon-img-drag').on('click', function() {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                selector.find("#palleon-canvas-overlay").hide();
                selector.find("#palleon-canvas-wrap").draggable('disable');
            } else {
                $(this).addClass('active');
                selector.find("#palleon-canvas-overlay").show();
                selector.find("#palleon-canvas-wrap").draggable('enable');
            }
        });

        /* Zoom */
        selector.find('.palleon-counter input.palleon-form-field').on('input', function() {
            var val = parseInt($(this).val());
            adjustZoom(val);
        });

        /* Resize Input Update */
        var setDimentions = function(e) {
            selector.find('#palleon-resize-width').val(Math.round(e.width));
            selector.find('#palleon-resize-height').val(Math.round(e.height));
            selector.find('#palleon-img-width').html(Math.round(e.width));
            selector.find('#palleon-img-height').html(Math.round(e.height));
            selector.find('#palleon-crop-width').val(Math.round(e.width / 2));
            selector.find('#palleon-crop-height').val(Math.round(e.height / 2));
            selector.find('#palleon-resize-width').data('size', Math.round(e.width));
            selector.find('#palleon-resize-height').data('size', Math.round(e.height));
            if (mode == 'image') {
                selector.find('#palleon-crop-width').data('max', Math.round(e.width));
                selector.find('#palleon-crop-height').data('max', Math.round(e.height));
            }
            selector.find('#palleon-resize-width').trigger('sizeChanged');
            selector.find('#palleon-resize-height').trigger('sizeChanged');
        };

        /* CROP */
        function updateImage() {
            var objects = canvas.getObjects();
            objects.filter(element => element.objectType != 'BG').forEach(element => element.set("visible", false));
            canvas.backgroundColor = 'transparent';

            var imgData = canvas.toDataURL({ format: 'png', enableRetinaScaling: false});
            var blob = dataURLtoBlob(imgData);
            imgurl = URL.createObjectURL(blob);
            selector.find('#palleon-canvas-img').attr("src",imgurl);

            canvas.backgroundColor = selector.find('#custom-image-background').val();
            objects.filter(element => element.objectType != 'BG').forEach(element => element.set("visible", true));
        }

        function setClipPath() {
            var objects = canvas.getObjects();
            clipPath.moveTo(9999);
            canvas.setActiveObject(clipPath);
            selector.find('#palleon-crop-btns').removeClass('disabled');
            selector.find(".palleon-icon-panel-content ul.palleon-accordion > li, #palleon-icon-menu, #palleon-top-bar, #palleon-right-col, .palleon-content-bar").css('pointer-events', 'none');
            selector.find(".palleon-icon-panel-content ul.palleon-accordion > li.accordion-crop").css('pointer-events', 'auto');
            objects.filter(element => element.objectType != 'clipPath' && element.objectType != 'BG').forEach(element => element.set('selectable', false));
        }

        /* Crop Style Select */
        selector.find('#palleon-crop-style').on("change", function(){
            if ($(this).val() != '') {
                $(this).select2("enable", false);
            } 
            // Freeform
            if ($(this).val() == 'freeform') {
                clipPath = new fabric.Rect({
                    fill: 'rgba(156, 39, 176, 0.3)',
                    width: originalWidth / 2,
                    height: originalHeight / 2,
                    excludeFromExport: true,
                    objectType: 'clipPath',
                    top: getScaledSize()[1] / 4,
                    left: getScaledSize()[0] / 4
                });
                clipPath.controls = {
                    ...fabric.Rect.prototype.controls,
                    mtr: new fabric.Control({ visible: false })
                };
                canvas.add(clipPath);

                setClipPath();   
            } 
            // Custom
            else if ($(this).val() == 'custom') {
                selector.find(".crop-custom").css('display', 'flex');
                var width = parseInt(selector.find('#palleon-crop-width').val());
                var height = parseInt(selector.find('#palleon-crop-height').val());
                clipPath = new fabric.Rect({
                    fill: 'rgba(156, 39, 176, 0.3)',
                    width: width,
                    height: height,
                    excludeFromExport: true,
                    objectType: 'clipPath',
                    top: getScaledSize()[1] / 4,
                    left: getScaledSize()[0] / 4
                });
                clipPath.controls = {
                    ...fabric.Rect.prototype.controls,
                    mtr: new fabric.Control({ visible: false }),
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false }),
                    tl: new fabric.Control({ visible: false }),
                    bl: new fabric.Control({ visible: false }),
                    tr: new fabric.Control({ visible: false }),
                    br: new fabric.Control({ visible: false })
                };
                canvas.add(clipPath);
                
                setClipPath();
            }
            // Square
            else if ($(this).val() == 'square') {
                var squaresize = originalHeight / 2;
                var squaresizetop = getScaledSize()[1] / 4;
                if (originalWidth > originalHeight) {
                    squaresize = originalWidth / 2;
                    squaresizetop = getScaledSize()[1] / 8;
                }

                clipPath = new fabric.Rect({
                    fill: 'rgba(156, 39, 176, 0.3)',
                    width: squaresize,
                    height: squaresize,
                    excludeFromExport: true,
                    objectType: 'clipPath',
                    top: squaresizetop,
                    left: getScaledSize()[0] / 4
                });
                clipPath.controls = {
                    ...fabric.Rect.prototype.controls,
                    mtr: new fabric.Control({ visible: false }),
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false })
                };
                canvas.add(clipPath);
                
                setClipPath();
            } 
            // Original
            else if ($(this).val() == 'original') {
                clipPath = new fabric.Rect({
                    fill: 'rgba(156, 39, 176, 0.3)',
                    width: originalWidth / 2,
                    height: originalHeight / 2,
                    excludeFromExport: true,
                    objectType: 'clipPath',
                    top: getScaledSize()[1] / 4,
                    left: getScaledSize()[0] / 4
                });
                clipPath.controls = {
                    ...fabric.Rect.prototype.controls,
                    mtr: new fabric.Control({ visible: false }),
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false })
                };
                canvas.add(clipPath);
                
                setClipPath();
            }else {
                var objects = canvas.getObjects();
                objects.filter(element => element.objectType != 'clipPath' && element.objectType != 'BG' && element.objectType != 'drawing').forEach(element => element.set('selectable', true));
                selector.find(".crop-custom").css('display', 'none');
                selector.find('#palleon-crop-btns').addClass('disabled');
                selector.find(".palleon-icon-panel-content ul.palleon-accordion > li, #palleon-icon-menu, #palleon-top-bar, #palleon-right-col, .palleon-content-bar").css('pointer-events', 'auto');
            }
        });

        /* Crop Cancel Button */
        selector.find('#palleon-crop-cancel').on("click", function(){
            selector.find('#palleon-crop-btns').addClass('disabled');
            selector.find('#palleon-crop-style').select2("enable");
            selector.find('#palleon-crop-style').val('');
            selector.find('#palleon-crop-style').trigger('change');
            canvas.remove(overlay);
            canvas.remove(clipPath);
        });

        /* Crop Apply Button */
        selector.find('#palleon-crop-apply').on("click", function(){
            var answer = window.confirm(palleonParams.question3);
            if (answer) {
                selector.find('#palleon-crop-btns').addClass('disabled');
                selector.find('#palleon-crop-style').select2("enable");
                selector.find('#palleon-crop-style').val('');
                selector.find('#palleon-crop-style').trigger('change');
                canvas.setZoom(1);
                selector.find('#palleon-img-zoom').val(100);
                var clipPos = clipPath.getBoundingRect();
                canvas.setWidth(clipPos.width - 1);
                canvas.setHeight(clipPos.height - 1);

                canvas.backgroundImage.set({ top: -clipPos.top, left: -clipPos.left});

                canvas.remove(overlay);
                canvas.remove(clipPath);

                updateImage();

                // Wait for the placeholder image fully load
                selector.find('#palleon-canvas-img-wrap').imagesLoaded( function() {
                    originalWidth = canvas.width;
                    originalHeight = canvas.height;
                    rotate = 0;
                    originX = 'left';
                    originY = 'top';
                    scaleX = 1;
                    scaleY = 1;
                    setBackgroundImage();
                    setDimentions(canvas);
                    adjustZoom();
                    canvas.requestRenderAll();
                    setTimeout(function(){
                        canvas.fire('palleon:history', { type: 'BG', text: palleonParams.cropped });
                    }, 500);
                });
            }
  
        });

        /* Crop Width Input */
        selector.find('#palleon-crop-width').bind('input paste', function() {
            if (selector.find('#palleon-crop-lock').hasClass('active')) {
                var width = $(this).data('max');
                var height = selector.find('#palleon-crop-height').data('max');
                var ratio = width / height;
                selector.find('#palleon-crop-height').val(Math.round(this.value / ratio));
            }
            clipPath.set('width', parseInt($(this).val()));
            clipPath.set('height', parseInt(selector.find('#palleon-crop-height').val()));
            canvas.requestRenderAll();
        });

        /* Crop Height Input */
        selector.find('#palleon-crop-height').bind('input paste', function() {
            if (selector.find('#palleon-crop-lock').hasClass('active')) {
                var height = $(this).data('max');
                var width = selector.find('#palleon-crop-width').data('max');
                var ratio = height / width;
                selector.find('#palleon-crop-width').val(Math.round(this.value / ratio));
            }
            clipPath.set('height', parseInt($(this).val()));
            clipPath.set('width', parseInt(selector.find('#palleon-crop-width').val()));
            canvas.requestRenderAll();
        });

         // Check that crop controls are inside image
         function checkCrop(obj) {
            if (obj.isContainedWithinObject(cropobj)) {
                croptop = obj.get('top');
                cropleft = obj.get('left');
                cropscalex = obj.get('scaleX');
                cropscaley = obj.get('scaleY');
            } else {
                obj.top = croptop;
                obj.left = cropleft;
                obj.scaleX = cropscalex;
                obj.scaleY = cropscaley;
                obj.setCoords();
                obj.saveState();
            }
            obj.set({
                borderColor: '#4affff',
            });
            canvas.requestRenderAll();
            crop(canvas.getItemById('cropped'));
        }

        function cropOverlay() {
            canvas.add(
                new fabric.Rect({
                    objectType: 'clipPath',
                    left: 0,
                    top: 0,
                    originX: 'left',
                    originY: 'top',
                    width: originalWidth,
                    height: originalHeight,
                    fill: 'rgba(0,0,0,0.5)',
                    selectable: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    lockRotation: true,
                    id: 'overlay',
                })
            );
        }

        // Start cropping an image
        function cropImage(object) {
            if (!cropping) {
                cropping = true;
                cropobj = object;
                canvas.uniformScaling = false;
                cropobj.setCoords();
                var left = cropobj.get('left') - (cropobj.get('width') * cropobj.get('scaleX')) / 2;
                var top = cropobj.get('top') - (cropobj.get('height') * cropobj.get('scaleY')) / 2;
                var cropx = cropobj.get('cropX');
                var cropy = cropobj.get('cropY');
                cropOverlay();
                var cropUI = new fabric.Rect({
                    objectType: 'clipPath',
                    left: object.get('left'),
                    top: object.get('top'),
                    width: object.get('width') * object.get('scaleX') - 5,
                    height: object.get('height') * object.get('scaleY') - 5,
                    originX: 'center',
                    originY: 'center',
                    id: 'crop',
                    fill: 'rgba(0,0,0,0)',
                    shadow: {
                        color: 'black',
                        offsetX: 0,
                        offsetY: 0,
                        blur: 0,
                        opacity: 0,
                    },
                });
                cropobj.clone(function (cloned) {
                    cloned.set({
                        objectType: 'clipPath',
                        id: 'cropped',
                        selectable: false,
                        originX: 'center',
                        originY: 'center',
                    });
                    canvas.add(cloned);
                    canvas.bringToFront(cloned);
                    canvas.bringToFront(cropUI);
                    canvas.requestRenderAll();
                    cropobj = object;
                });
                cropobj.set({
                        cropX: 0,
                        cropY: 0,
                        width: cropobj.get('ogWidth'),
                        height: cropobj.get('ogHeight'),
                    }).setCoords();
                canvas.requestRenderAll();
                cropobj.set({
                    left: left + (cropobj.get('width') * cropobj.get('scaleX')) / 2 - cropx * cropobj.get('scaleX'),
                    top: top + (cropobj.get('height') * cropobj.get('scaleY')) / 2 - cropy * cropobj.get('scaleY'),
                });
                cropUI.setControlsVisibility({
                    mt: false,
                    mb: false,
                    mr: false,
                    ml: false,
                    mtr: false,
                    deleteControl: false,
                    cloneControl: false
                });
                cropUI.controls.tl = new fabric.Control({
                    x: -0.5,
                    y: -0.5,
                    offsetX: 3,
                    offsetY: 3,
                    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                    actionHandler: fabric.controlsUtils.scalingEqually,
                    render: function (ctx, left, top, styleOverride, fabricObject) {
                        const wsize = 27;
                        const hsize = 27;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                        ctx.drawImage(tlcrop, -wsize / 2, -hsize / 2, wsize, hsize);
                        ctx.restore();
                    },
                });
                cropUI.controls.tr = new fabric.Control({
                    x: 0.5,
                    y: -0.5,
                    offsetX: -3,
                    offsetY: 3,
                    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                    actionHandler: fabric.controlsUtils.scalingEqually,
                    render: function (ctx, left, top, styleOverride, fabricObject) {
                        const wsize = 27;
                        const hsize = 27;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                        ctx.drawImage(trcrop, -wsize / 2, -hsize / 2, wsize, hsize);
                        ctx.restore();
                    },
                });
                cropUI.controls.bl = new fabric.Control({
                    x: -0.5,
                    y: 0.5,
                    offsetX: 3,
                    offsetY: -3,
                    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                    actionHandler: fabric.controlsUtils.scalingEqually,
                    render: function (ctx, left, top, styleOverride, fabricObject) {
                        const wsize = 27;
                        const hsize = 27;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                        ctx.drawImage(blcrop, -wsize / 2, -hsize / 2, wsize, hsize);
                        ctx.restore();
                    },
                });
                cropUI.controls.br = new fabric.Control({
                    x: 0.5,
                    y: 0.5,
                    offsetX: -3,
                    offsetY: -3,
                    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
                    actionHandler: fabric.controlsUtils.scalingEqually,
                    render: function (ctx, left, top, styleOverride, fabricObject) {
                        const wsize = 27;
                        const hsize = 27;
                        ctx.save();
                        ctx.translate(left, top);
                        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                        ctx.drawImage(brcrop, -wsize / 2, -hsize / 2, wsize, hsize);
                        ctx.restore();
                    },
                });
                canvas.add(cropUI);
                canvas.setActiveObject(cropUI);
                canvas.requestRenderAll();
                cropleft = cropUI.get('left');
                croptop = cropUI.get('top');
                cropscalex = cropUI.get('scaleX') - 0.03;
                cropscaley = cropUI.get('scaleY') - 0.03;
            }
        }
        selector.on('click', '#crop-image-object', function () {
            if (canvas.getActiveObject()) {
                selector.find("#palleon-icon-menu, #palleon-top-bar, #palleon-right-col, #palleon-img-upload-wrap, #palleon-img-media-library, #palleon-image-settings > *, .palleon-content-bar").css('pointer-events', 'none');
                selector.find("#crop-image-object-selection").css('pointer-events', 'auto');
                $(this).addClass('d-none');
                selector.find('#crop-image-object-selection').removeClass('d-none');
                cropImage(canvas.getActiveObject());
            }
        });

        // Stop cropping when clicking on the blacked out properties panel
        selector.on('click', '#crop-image-object-selection', function () {
            if (cropping) {
                selector.find("#palleon-icon-menu, #palleon-top-bar, #palleon-right-col, #palleon-img-upload-wrap, #palleon-img-media-library, #palleon-image-settings > *, .palleon-content-bar").css('pointer-events', 'auto');
                $(this).addClass('d-none');
                selector.find('#crop-image-object').removeClass('d-none');
                canvas.discardActiveObject();
                canvas.fire('selection:cleared');
                canvas.requestRenderAll();
            }
        });

        // Perform a crop
        function crop(obj) {
            var crop = canvas.getItemById('crop');
            cropobj.setCoords();
            crop.setCoords();
            var cleft = crop.get('left') - (crop.get('width') * crop.get('scaleX')) / 2;
            var ctop = crop.get('top') - (crop.get('height') * crop.get('scaleY')) / 2;
            var height = (crop.get('height') / cropobj.get('scaleY')) * crop.get('scaleY');
            var width = (crop.get('width') / cropobj.get('scaleX')) * crop.get('scaleX');
            var img_height = cropobj.get('height') * cropobj.get('scaleY');
            var img_width = cropobj.get('width') * cropobj.get('scaleX');
            var left = cleft - (cropobj.get('left') - (cropobj.get('width') * cropobj.get('scaleX')) / 2);
            var top = ctop - (cropobj.get('top') - (cropobj.get('height') * cropobj.get('scaleY')) / 2);
            if (left < 0 && top > 0) {
                obj.set({cropY: top / cropobj.get('scaleY'), height: height}).setCoords();
                canvas.requestRenderAll();
                obj.set({
                    top: ctop + (obj.get('height') * obj.get('scaleY')) / 2,
                });
                canvas.requestRenderAll();
            } else if (top < 0 && left > 0) {
                obj.set({cropX: left / cropobj.get('scaleX'), width: width}).setCoords();
                canvas.requestRenderAll();
                obj.set({
                    left: cleft + (obj.get('width') * obj.get('scaleX')) / 2,
                });
                canvas.requestRenderAll();
            } else if (top > 0 && left > 0) {
                obj.set({
                    cropX: left / cropobj.get('scaleX'),
                    cropY: top / cropobj.get('scaleY'),
                    height: height,
                    width: width,
                }).setCoords();
                canvas.requestRenderAll();
                obj.set({
                    left: cleft + (obj.get('width') * obj.get('scaleX')) / 2,
                    top: ctop + (obj.get('height') * obj.get('scaleY')) / 2,
                });
                canvas.requestRenderAll();
            }
            if (obj.get('id') != 'cropped') {
                canvas.remove(crop);
                canvas.remove(canvas.getItemById('overlay'));
                canvas.remove(canvas.getItemById('cropped'));
                cropping = false;
                resetControls();
                canvas.uniformScaling = true;
                canvas.requestRenderAll();
                canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited });
            }
            canvas.requestRenderAll();
        }

        var tlcrop = new Image();
        tlcrop.src = settings.baseURL + 'assets/tlcrop.svg';
        var trcrop = new Image();
        trcrop.src = settings.baseURL + 'assets/trcrop.svg';
        var blcrop = new Image();
        blcrop.src = settings.baseURL + 'assets/blcrop.svg';
        var brcrop = new Image();
        brcrop.src = settings.baseURL + 'assets/brcrop.svg';

        /* Resize Canvas */
        function resizeCanvas() {
            var inputWidth = parseInt(selector.find('#palleon-resize-width').val());
            var inputHeight = parseInt(selector.find('#palleon-resize-height').val());

            originalWidth = inputWidth;
            originalHeight = inputHeight;

            canvas.setZoom(1);
            selector.find('#palleon-img-zoom').val(100);
            canvas.setWidth(inputWidth);
            canvas.setHeight(inputHeight);

            if (rotate == 0 || rotate == 180 || rotate == -180) {
                scaleX = canvas.width / selector.find('#palleon-canvas-img')[0].width;
                scaleY = canvas.height / selector.find('#palleon-canvas-img')[0].height;     
            } else {
                scaleX = canvas.height / selector.find('#palleon-canvas-img')[0].width;
                scaleY = canvas.width / selector.find('#palleon-canvas-img')[0].height;
            }

            canvas.backgroundImage.set({ scaleX: scaleX, scaleY: scaleY});

            canvas.discardActiveObject();
            var sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
            });
            canvas.setActiveObject(sel);
            canvas.requestRenderAll();

            var group = canvas.getActiveObject();
            group.set({top: group.top * scaleY, left: group.left * scaleX, scaleX: scaleX, scaleY: scaleY});
            
            updateImage();

            // Wait for the placeholder image fully load
            selector.find('#palleon-canvas-img-wrap').imagesLoaded( function() {
                canvas.discardActiveObject();
                originalWidth = canvas.width;
                originalHeight = canvas.height;
                rotate = 0;
                originX = 'left';
                originY = 'top';
                scaleX = 1;
                scaleY = 1;
                setBackgroundImage();
                setDimentions(canvas);
                adjustZoom();
                canvas.requestRenderAll();
                setTimeout(function(){
                    canvas.fire('palleon:history', { type: 'BG', text: palleonParams.resized });
                }, 500); 
            });
        }

        /* Resize Canvas Button */
        selector.find('#palleon-resize-apply').on('click', function() {
            var answer = window.confirm(palleonParams.question4);
            if (answer) {
                resizeCanvas();
            }
        });

        /* Resize Width Input */
        selector.find('#palleon-resize-width').bind('input paste', function(){
            if (selector.find('#palleon-resize-lock').hasClass('active')) {
                var width = $(this).data('size');
                var height = selector.find('#palleon-resize-height').data('size');
                var ratio = width / height;
                selector.find('#palleon-resize-height').val(Math.round(this.value / ratio));
            }
        });

        /* Resize Height Input */
        selector.find('#palleon-resize-height').bind('input paste', function(){
            if (selector.find('#palleon-resize-lock').hasClass('active')) {
                var height = $(this).data('size');
                var width = selector.find('#palleon-resize-width').data('size');
                var ratio = height / width;
                selector.find('#palleon-resize-width').val(Math.round(this.value / ratio));
            }
        });

        /* Rotate Canvas */
        function rotateCanvas(direction) {
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                canvas.setDimensions({width: originalHeight, height: originalWidth});
                scaleX = canvas.height / img.width;
                scaleY = canvas.width / img.height;
            } else {
                canvas.setDimensions({width: originalWidth, height: originalHeight});
                scaleX = canvas.width / img.width;
                scaleY = canvas.height / img.height;
            }
            if (direction == 'right') {
                if (rotate == 0) {
                    rotate = 90;
                    originX = 'left';
                    originY = 'bottom';
                } else if (rotate == 90) {
                    rotate = 180;
                    originX = 'right';
                    originY = 'bottom';
                } else if (rotate == 180) {
                    rotate = 270;
                    originX = 'right';
                    originY = 'top';
                } else if (rotate == 270) {
                    rotate = 0;
                    originX = 'left';
                    originY = 'top';
                } else if (rotate == -90) {
                    rotate = 0;
                    originX = 'left';
                    originY = 'top';
                } else if (rotate == -180) {
                    rotate = -90;
                    originX = 'right';
                    originY = 'top';
                } else if (rotate == -270) {
                    rotate = -180;
                    originX = 'right';
                    originY = 'bottom';
                }
            } else if (direction == 'left') {
                if (rotate == 0) {
                    rotate = -90;
                    originX = 'right';
                    originY = 'top';
                } else if (rotate == -90) {
                    rotate = -180;
                    originX = 'right';
                    originY = 'bottom';
                } else if (rotate == -180) {
                    rotate = -270;
                    originX = 'left';
                    originY = 'bottom';
                } else if (rotate == -270) {
                    rotate = 0;
                    originX = 'left';
                    originY = 'top';
                } else if (rotate == 90) {
                    rotate = 0;
                    originX = 'left';
                    originY = 'top';
                } else if (rotate == 180) {
                    rotate = 90;
                    originX = 'left';
                    originY = 'bottom';
                } else if (rotate == 270) {
                    rotate = 180;
                    originX = 'right';
                    originY = 'bottom';
                }
            }
            canvas.backgroundImage.set({ scaleX: scaleX, scaleY: scaleY, angle: rotate, originX: originX, originY: originY});

            var tempRect = new fabric.Rect({
                radius: 50,
                fill: 'transparent',
                stroke: 'transparent',
                strokeWidth: 0,
                objectType: 'clipPath',
                width:canvas.height,
                height:canvas.width,
                gradientFill: 'none',
                top: 0,
                left: 0,
                originX: 'left',
                originY: 'top'
            });
            canvas.add(tempRect);

            canvas.discardActiveObject();
            var sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
            });
            canvas.setActiveObject(sel);
            var group = canvas.getActiveObject();

            if (direction == 'right') {
                group.set({angle: 90, originX: 'left', originY: 'bottom' });
            } else if (direction == 'left') {
                group.set({angle: -90, originX: 'right',originY: 'top'});
            }
            canvas.remove(tempRect);
            canvas.discardActiveObject();

            setDimentions(canvas);
            adjustZoom();
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'BG', text: palleonParams.rotated });
        }

        /* Rotate Right */
        selector.find('#palleon-rotate-right').on('click', function() {
            rotateCanvas('right');
        });

        /* Rotate Left */
        selector.find('#palleon-rotate-left').on('click', function() {
            rotateCanvas('left');
        });

        /* Flip X */
        selector.find('#palleon-flip-horizontal').on('click', function() {
            canvas.backgroundImage.toggle('flipX');
            var tempRect = new fabric.Rect({
                radius: 50,
                fill: 'transparent',
                stroke: 'transparent',
                strokeWidth: 0,
                objectType: 'clipPath',
                width:getScaledSize()[0],
                height:getScaledSize()[1],
                gradientFill: 'none',
                top: 0,
                left: 0,
                originX: 'left',
                originY: 'top'
            });
            canvas.add(tempRect);
            canvas.discardActiveObject();
            var sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
            });
            canvas.setActiveObject(sel);
            var group = canvas.getActiveObject();
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                group.toggle('flipX');
            } else {
                group.toggle('flipY');
            }
            canvas.remove(tempRect);
            canvas.discardActiveObject();
            canvas.requestRenderAll(); 
            canvas.fire('palleon:history', { type: 'BG', text: palleonParams.flipped });  
        });

        /* Flip Y */
        selector.find('#palleon-flip-vertical').on('click', function() {
            canvas.backgroundImage.toggle('flipY');
            var tempRect = new fabric.Rect({
                radius: 50,
                fill: 'transparent',
                stroke: 'transparent',
                strokeWidth: 0,
                objectType: 'clipPath',
                width:getScaledSize()[0],
                height:getScaledSize()[1],
                gradientFill: 'none',
                top: 0,
                left: 0,
                originX: 'left',
                originY: 'top'
            });
            canvas.add(tempRect);
            canvas.discardActiveObject();
            var sel = new fabric.ActiveSelection(canvas.getObjects(), {
            canvas: canvas,
            });
            canvas.setActiveObject(sel);
            var group = canvas.getActiveObject();
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                group.toggle('flipY');
            } else {
                group.toggle('flipX');
            }
            canvas.remove(tempRect);
            canvas.discardActiveObject();
            canvas.requestRenderAll(); 
            canvas.fire('palleon:history', { type: 'BG', text: palleonParams.flipped }); 
        });

        /* Brightness Toggle */
        selector.find('#palleon-brightness').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Brightness());
            } else {
                selector.find('#brightness').val(0);
                selector.find('#brightness').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Brightness');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Brightness */
        selector.find('#brightness').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'Brightness').forEach(element => element.brightness = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#brightness').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Contrast Toggle */
        selector.find('#palleon-contrast').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Contrast());
            } else {
                selector.find('#contrast').val(0);
                selector.find('#contrast').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Contrast');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Contrast */
        selector.find('#contrast').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'Contrast').forEach(element => element.contrast = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#contrast').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Saturation Toggle */
        selector.find('#palleon-saturation').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Saturation());
            } else {
                selector.find('#saturation').val(0);
                selector.find('#saturation').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Saturation');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Saturation */
        selector.find('#saturation').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'Saturation').forEach(element => element.saturation = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#saturation').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Hue Toggle */
        selector.find('#palleon-hue').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.HueRotation());
            } else {
                selector.find('#hue').val(0);
                selector.find('#hue').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'HueRotation');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Hue */
        selector.find('#hue').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'HueRotation').forEach(element => element.rotation = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#hue').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Image Mask */
        selector.find('#palleon-img-mask').on("change", function (e) {
            var selected = $(this).find(':selected').val();
            if (selected == 'custom') {
                selector.find('#palleon-img-radius-settings').removeClass('d-none');
            } else {
                selector.find('#palleon-img-radius-settings').addClass('d-none');
                selector.find('#img-border-radius').val('0');
                selector.find('#img-border-radius').parent().parent().find('label span').html('0');
            }
            var obj = canvas.getActiveObject();
            var mask = null;
            var left = -(obj.width / 2);
            var top = -(obj.width / 2);
            var radius = obj.width / 2;
            if (obj.width > obj.height) {
                left = -(obj.height / 2);
                top = -(obj.height / 2);
                radius = obj.height / 2;
            }
            obj.clipPath = null;
            canvas.requestRenderAll();
            
            if (selected == 'circle') {
                mask = new fabric.Circle({
                    maskType: selected,
                    radius: radius,
                    left: left,
                    top: top
                });
            } else if (selected == 'triangle') {
                mask = new fabric.Triangle({
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    left: left,
                    top: top
                });
            } else if (selected == 'triangleDown') {
                mask = new fabric.Triangle({
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    flipY: true,
                    left: left,
                    top: top
                });
            } else if (selected == 'triangleRight') {
                mask = new fabric.Triangle({
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    left: left,
                    top: top,
                    originX: 'left',
                    originY: 'bottom',
                    angle:90
                });
            } else if (selected == 'triangleLeft') {
                mask = new fabric.Triangle({
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    left: left,
                    top: top,
                    originX: 'right',
                    originY: 'top',
                    angle:-90
                });
            } else if (selected == 'pentagon') {
                var polygon = [{x:26,y:86},
                    {x:11.2,y:40.4},
                    {x:50,y:12.2},
                    {x:88.8,y:40.4},
                    {x:74,y:86}];
                    mask = new fabric.Polygon(polygon,{
                        maskType: selected,
                        width: radius * 2,
                        height: radius * 2,
                        left: left,
                        top: top
                    });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'pentagonDown') {
                var polygon = [{x:26,y:86},
                    {x:11.2,y:40.4},
                    {x:50,y:12.2},
                    {x:88.8,y:40.4},
                    {x:74,y:86}];
                    mask = new fabric.Polygon(polygon,{
                        maskType: selected,
                        width: radius * 2,
                        height: radius * 2,
                        flipY: true,
                        left: left,
                        top: top
                    });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'pentagonLeft') {
                var polygon = [{x:26,y:86},
                    {x:11.2,y:40.4},
                    {x:50,y:12.2},
                    {x:88.8,y:40.4},
                    {x:74,y:86}];
                    mask = new fabric.Polygon(polygon,{
                        maskType: selected,
                        width: radius * 2,
                        height: radius * 2,
                        originX: 'right',
                        originY: 'top',
                        angle:-90,
                        left: left,
                        top: top
                    });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'pentagonRight') {
                var polygon = [{x:26,y:86},
                    {x:11.2,y:40.4},
                    {x:50,y:12.2},
                    {x:88.8,y:40.4},
                    {x:74,y:86}];
                    mask = new fabric.Polygon(polygon,{
                        maskType: selected,
                        width: radius * 2,
                        height: radius * 2,
                        originX: 'left',
                        originY: 'bottom',
                        angle:90,
                        left: left,
                        top: top
                    });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'octagon') {
                var polygon = [{x:34.2,y:87.4},
                    {x:12.3,y:65.5},
                    {x:12.3,y:34.5},
                    {x:34.2,y:12.6},
                    {x:65.2,y:12.6},
                    {x:87.1,y:34.5},
                    {x:87.1,y:65.5},
                    {x:65.2,y:87.4}
                ];
                mask = new fabric.Polygon(polygon,{
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    left: left,
                    top: top
                });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'star') {
                var polygon = [{x:350,y:75},
                    {x:380,y:160},
                    {x:470,y:160},
                    {x:400,y:215},
                    {x:423,y:301},
                    {x:350,y:250},
                    {x:277,y:301},
                    {x:303,y:215},
                    {x:231,y:161},
                    {x:321,y:161}];
                mask = new fabric.Polygon(polygon,{
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    left: left,
                    top: top
                });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            } else if (selected == 'starReverse') {
                var polygon = [{x:350,y:75},
                    {x:380,y:160},
                    {x:470,y:160},
                    {x:400,y:215},
                    {x:423,y:301},
                    {x:350,y:250},
                    {x:277,y:301},
                    {x:303,y:215},
                    {x:231,y:161},
                    {x:321,y:161}];
                mask = new fabric.Polygon(polygon,{
                    maskType: selected,
                    width: radius * 2,
                    height: radius * 2,
                    flipY: true,
                    left: left,
                    top: top
                });
                mask.scaleToWidth(obj.width);
                if (obj.width > obj.height) {
                    mask.scaleToHeight(obj.height);
                }
            }
            setTimeout(function(){
                obj.clipPath = mask;
                canvas.requestRenderAll();
                addToHistory(objectName('image') + ' ' + palleonParams.mask + ' ' + palleonParams.added);
            }, 100);
        });

        /* Filters */
        selector.find('#image-filter').on("change", function (e) {
            var selected = $(this).find(':selected').val();
            var obj = canvas.getActiveObject();
            if (selected == 'grayscale') {
                obj.filters[0] = new fabric.Image.filters.Grayscale();
            } else if (selected == 'sepia') {
                obj.filters[0] = new fabric.Image.filters.Sepia();
            } else if (selected == 'blackwhite') {
                obj.filters[0] = new fabric.Image.filters.BlackWhite();
            } else if (selected == 'brownie') {
                obj.filters[0] = new fabric.Image.filters.Brownie();
            } else if (selected == 'vintage') {
                obj.filters[0] = new fabric.Image.filters.Vintage();
            } else if (selected == 'kodachrome') {
                obj.filters[0] = new fabric.Image.filters.Kodachrome();
            } else if (selected == 'technicolor') {
                obj.filters[0] = new fabric.Image.filters.Technicolor();
            } else if (selected == 'polaroid') {
                obj.filters[0] = new fabric.Image.filters.Polaroid();
            } else if (selected == 'shift') {
                obj.filters[0] = new fabric.Image.filters.Shift();
            } else if (selected == 'invert') {
                obj.filters[0] = new fabric.Image.filters.Invert();
            } else {
                obj.filters = [];
            } 
            obj.applyFilters();
            canvas.requestRenderAll();
        });
        
        selector.find('#palleon-filters input[type=checkbox]').on("change", function (e) {
            if ($(this).is(":checked")) {
                if ($(this).attr('id') == 'grayscale') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Grayscale());
                } else if ($(this).attr('id') == 'sepia') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Sepia());
                } else if ($(this).attr('id') == 'blackwhite') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.BlackWhite());
                } else if ($(this).attr('id') == 'brownie') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Brownie());
                } else if ($(this).attr('id') == 'vintage') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Vintage());
                } else if ($(this).attr('id') == 'kodachrome') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Kodachrome());
                } else if ($(this).attr('id') == 'technicolor') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Technicolor());
                } else if ($(this).attr('id') == 'polaroid') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Polaroid());
                } else if ($(this).attr('id') == 'shift') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Shift());
                } else if ($(this).attr('id') == 'invert') {
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Invert());
                } else if ($(this).attr('id') == 'sharpen') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [0,-1,0,-1,5,-1,0,-1,0]
                    }));
                } else if ($(this).attr('id') == 'emboss') {
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [1,1,1,1,0.7,-1,-1,-1,-1]
                    }));
                } else if ($(this).attr('id') == 'sobelX') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [-1,0,1,-2,0,2,-1,0,1]
                    }));
                } else if ($(this).attr('id') == 'sobelY') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                    canvas.backgroundImage.filters.push(new fabric.Image.filters.Convolute({
                        matrix: [-1,-2,-1,0,0,0,1,2,1]
                    }));
                }
            } else {
                if ($(this).attr('id') == 'grayscale') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Grayscale');
                } else if ($(this).attr('id') == 'sepia') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Sepia');
                } else if ($(this).attr('id') == 'blackwhite') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'BlackWhite');
                } else if ($(this).attr('id') == 'brownie') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Brownie');
                } else if ($(this).attr('id') == 'vintage') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Vintage');
                } else if ($(this).attr('id') == 'kodachrome') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Kodachrome');
                } else if ($(this).attr('id') == 'technicolor') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Technicolor');
                } else if ($(this).attr('id') == 'polaroid') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Polaroid');
                } else if ($(this).attr('id') == 'shift') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Shift');
                } else if ($(this).attr('id') == 'invert') {
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Invert');
                } else if ($(this).attr('id') == 'sharpen') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                } else if ($(this).attr('id') == 'emboss') {
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                } else if ($(this).attr('id') == 'sobelX') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelY').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                } else if ($(this).attr('id') == 'sobelY') {
                    selector.find('#emboss').prop('checked', false);
                    selector.find('#sharpen').prop('checked', false);
                    selector.find('#sobelX').prop('checked', false);
                    canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Convolute');
                }
            }
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Filter Library */
        selector.find('#palleon-filter-library').imagesLoaded( function() {
            selector.find('#palleon-filter-library > .grid-item').not('.none').each(function() {
                var item = $(this);
                var img = item.find('img')[0];
                pixelsJS.filterImg(img, item.data('filter'));
            });
        });

        selector.find('#palleon-filter-library > .grid-item').on("click", function () {
            var item = $(this);
            var canvasIMG = selector.find('#palleon-pages').find('div.active').attr('data-origin');
            selector.find('#palleon-filter-preview').html('<img src="' + canvasIMG + '">');
            var imgData = '';
            var img = selector.find('#palleon-filter-preview img')[0];
            if (item.data('filter') != '') {
                pixelsJS.filterImg(img, item.data('filter'));
                imgData = selector.find('#palleon-filter-preview > canvas')[0].toDataURL();
            } else {
                imgData = canvasIMG;
            }
            $(document).trigger( "loadBase64Img", [imgData, selector.find('#palleon-download-name').val(), false] );
        });

        /* Gamma Toggle */
        selector.find('#palleon-gamma').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Gamma());
            } else {
                selector.find('#gamma-red').val(1);
                selector.find('#gamma-red').parent().parent().find('.slider-label span').html(1);
                selector.find('#gamma-green').val(1);
                selector.find('#gamma-green').parent().parent().find('.slider-label span').html(1);
                selector.find('#gamma-blue').val(1);
                selector.find('#gamma-blue').parent().parent().find('.slider-label span').html(1);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Gamma');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Gamma Settings */
        selector.find('#palleon-gamma-settings input').on("input", function () {
            var v1 = parseFloat($('#gamma-red').val());
            var v2 = parseFloat($('#gamma-green').val());
            var v3 = parseFloat($('#gamma-blue').val());
            var gammaArray = [v1, v2, v3];
            canvas.backgroundImage.filters.filter(element => element.type == 'Gamma').forEach(element => element.gamma = gammaArray);
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#palleon-gamma-settings input').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Blur Toggle */
        selector.find('#palleon-blur').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Blur());
            } else {
                selector.find('#blur').val(0);
                selector.find('#blur').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Blur');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Blur */
        selector.find('#blur').on("change", function (e) {
            canvas.backgroundImage.filters.filter(element => element.type == 'Blur').forEach(element => element.blur = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Noise Toggle */
        selector.find('#palleon-noise').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Noise());
            } else {
                selector.find('#noise').val(0);
                selector.find('#noise').parent().parent().find('.slider-label span').html(0);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Noise');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Noise */
        selector.find('#noise').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'Noise').forEach(element => element.noise = parseInt(this.value, 10));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        selector.find('#noise').on("change", function (e) {
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Pixelate Toggle */
        selector.find('#palleon-pixelate').on("change", function () {
            if ($(this).is(":checked")) {
                canvas.backgroundImage.filters.push(new fabric.Image.filters.Pixelate());
            } else {
                selector.find('#pixelate').val(1);
                selector.find('#pixelate').parent().parent().find('.slider-label span').html(1);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Pixelate');
                canvas.backgroundImage.applyFilters();
            }
            canvas.requestRenderAll();
        });

        /* Pixelate */
        selector.find('#pixelate').on("change", function (e) {
            canvas.backgroundImage.filters.filter(element => element.type == 'Pixelate').forEach(element => element.blocksize = parseInt(this.value, 10));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
            if (e.originalEvent){
                addToHistory('<span class="material-icons">image</span>' + palleonParams.bg  + ' ' + palleonParams.edited);
            }
        });

        /* Blend Color Toggle */
        selector.find('#palleon-blend-color').on("change", function () {
            if ($(this).is(":checked")) {
                var mode = selector.find('#blend-color-mode').val();
                var color = selector.find('#blend-color-color').val();
                var alpha = parseFloat(selector.find('#blend-color-alpha').val());
                canvas.backgroundImage.filters.push(new fabric.Image.filters.BlendColor());
                canvas.backgroundImage.filters.filter(element => element.type == 'BlendColor').forEach(element => element.mode = mode,element => element.color = color,element => element.alpha = parseFloat(alpha));
            } else {
                selector.find('#blend-color-mode').val('add');
                selector.find('#blend-color-color').spectrum("set", "#ffffff");
                selector.find('#blend-color-alpha').val(0.5);
                selector.find('#blend-color-alpha').parent().parent().find('.slider-label span').html(0.5);
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'BlendColor');
            }
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Blend Mode */
        selector.find('#blend-color-mode').on("change", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'BlendColor').forEach(element => element.mode = this.value);
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Blend Color */
        selector.find('#blend-color-color').on("change", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'BlendColor').forEach(element => element.color = this.value);
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Blend Alpha */
        selector.find('#blend-color-alpha').on("input", function () {
            canvas.backgroundImage.filters.filter(element => element.type == 'BlendColor').forEach(element => element.alpha = parseFloat(this.value));
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Duotone Toggle */
        selector.find('#palleon-duotone-color').on("change", function () {
            if ($(this).is(":checked")) {
                duotoneFilter = new fabric.Image.filters.Composed({
                    subFilters: [
                      new fabric.Image.filters.Grayscale({ mode: 'luminosity' }), // make it black and white
                      new fabric.Image.filters.BlendColor({ color: selector.find('#duotone-light-color').val() }), // apply light color
                      new fabric.Image.filters.BlendColor({ color: selector.find('#duotone-dark-color').val(), mode: 'lighten' }), // apply a darker color
                    ]
                });
                canvas.backgroundImage.filters.push(duotoneFilter);
            } else {
                selector.find('#duotone-light-color').spectrum("set", "green");
                selector.find('#duotone-dark-color').spectrum("set", "blue");
                canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Composed');
            }
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Duotone Light Color */
        selector.find('#duotone-light-color').on("change", function () {
            canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Composed');
            canvas.backgroundImage.filters.push(duotoneFilter);
            duotoneFilter.subFilters[1].color = $(this).val();
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Duotone Dark Color */
        selector.find('#duotone-dark-color').on("change", function () {
            canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'Composed');
            canvas.backgroundImage.filters.push(duotoneFilter);
            duotoneFilter.subFilters[2].color = $(this).val();
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
        });

        /* Swap Colors Apply */
        selector.find('#palleon-swap-apply').on('click', function() {
            var swapColors = new fabric.Image.filters.SwapColor({
                colorSource: selector.find('#color-source').val(),
                colorDestination: selector.find('#color-destination').val(),
            });
            canvas.backgroundImage.filters.push(swapColors);
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
            $(this).prop('disabled', true);
            selector.find('#palleon-swap-remove').prop('disabled', false);
        });

        /* Swap Colors Remove */
        selector.find('#palleon-swap-remove').on('click', function() {
            canvas.backgroundImage.filters = canvas.backgroundImage.filters.filter(element => element.type != 'SwapColor');
            canvas.backgroundImage.applyFilters();
            canvas.requestRenderAll();
            $(this).prop('disabled', true);
            selector.find('#palleon-swap-apply').prop('disabled', false);
        });

        /* Swap Colors Toggle */
        selector.find('#palleon-swap-colors').on("change", function () {
            if (!$(this).is(":checked")) {
                selector.find('#palleon-swap-remove').trigger('click');
            }
        });

        /* Shadow Fields */
        var shadowFields = ['text', 'image', 'shape', 'element'];

        $.each(shadowFields, function( index, value ) {
            selector.find('#palleon-' + value + '-shadow').on("change", function () {
                var shadow = new fabric.Shadow({
                    color: selector.find('#' + value + '-shadow-color').val(),
                    blur: selector.find('#' + value + '-shadow-blur').val(),
                    offsetX: selector.find('#' + value + '-shadow-offset-x').val(),
                    offsetY: selector.find('#' + value + '-shadow-offset-y').val(),
                });
                if ($(this).is(":checked")) {
                    canvas.getActiveObject().shadow = shadow;
                } else {
                    canvas.getActiveObject().shadow = null;
                }
                canvas.requestRenderAll();
            });
            selector.find('#' + value + '-shadow-color').bind("change", function () {
                canvas.getActiveObject().shadow.color = $(this).val();
                canvas.requestRenderAll();
            });
            selector.find('#' + value + '-shadow-settings input[type=number]').bind("input paste keyup keydown", function () {
                var val = $(this).val();
                if ($(this).attr('id') == value + '-shadow-blur') {
                    canvas.getActiveObject().shadow.blur = parseInt(val);
                } else if ($(this).attr('id') == value + '-shadow-offset-x') {
                    canvas.getActiveObject().shadow.offsetX = parseInt(val);
                } else if ($(this).attr('id') == value + '-shadow-offset-y') {
                    canvas.getActiveObject().shadow.offsetY = parseInt(val);
                }
                canvas.requestRenderAll();
            });
        });

        /* Gradient Fields */
        function updateGradient(value) {
            var obj = canvas.getActiveObject();
            obj.set('gradientFill', selector.find('#palleon-' + value + '-gradient').val());
            var colorStops = '';
            if (selector.find('#' + value + '-gradient-color-3').val() == '' && selector.find('#' + value + '-gradient-color-4').val() == '') {
                colorStops = [
                    { offset: 0, color: selector.find('#' + value + '-gradient-color-1').val() },
                    { offset: 1, color: selector.find('#' + value + '-gradient-color-2').val() }
                ];
            } else if (selector.find('#' + value + '-gradient-color-3').val() != '' && selector.find('#' + value + '-gradient-color-4').val() == '') {
                colorStops = [
                    { offset: 0, color: selector.find('#' + value + '-gradient-color-1').val() },
                    { offset: 0.5, color: selector.find('#' + value + '-gradient-color-2').val() },
                    { offset: 1, color: selector.find('#' + value + '-gradient-color-3').val() }
                ];
            } else if (selector.find('#' + value + '-gradient-color-1').val() != '' && selector.find('#' + value + '-gradient-color-2').val() != '' && selector.find('#' + value + '-gradient-color-3').val() != '' && selector.find('#' + value + '-gradient-color-4').val() != '') {
                colorStops = [
                    { offset: 0, color: selector.find('#' + value + '-gradient-color-1').val() },
                    { offset: 0.25, color: selector.find('#' + value + '-gradient-color-2').val() },
                    { offset: 0.75, color: selector.find('#' + value + '-gradient-color-3').val() },
                    { offset: 1, color: selector.find('#' + value + '-gradient-color-4').val() }
                ];
            }
            if (selector.find('#palleon-' + value + '-gradient').val() == 'vertical') {
                selector.find('#' + value + '-gradient-settings').show();
                selector.find('#' + value + '-fill-color').hide();
                obj.set('fill', new fabric.Gradient({
                    type: 'linear',
                    gradientUnits: 'percentage',
                    coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    colorStops: colorStops
                }));
                if (obj._objects) {
                    for (var i = 0; i < obj._objects.length; i++) {
                        if (obj._objects[i].fill != '') {
                            obj._objects[i].set({
                            fill: new fabric.Gradient({
                                type: 'linear',
                                gradientUnits: 'percentage',
                                coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
                                colorStops: colorStops
                            })
                            });
                        }
                    }
                }
            } else if (selector.find('#palleon-' + value + '-gradient').val() == 'horizontal') {
                selector.find('#' + value + '-gradient-settings').show();
                selector.find('#' + value + '-fill-color').hide();
                obj.set('fill', new fabric.Gradient({
                    type: 'linear',
                    gradientUnits: 'percentage',
                    coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
                    colorStops: colorStops
                }));
                if (obj._objects) {
                    for (var i = 0; i < obj._objects.length; i++) {
                        if (obj._objects[i].fill != '') {
                            obj._objects[i].set({
                            fill: new fabric.Gradient({
                                type: 'linear',
                                gradientUnits: 'percentage',
                                coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
                                colorStops: colorStops
                            })
                            });
                        }
                    }
                }
            } else if (selector.find('#palleon-' + value + '-gradient').val() == 'diagonal') {
                selector.find('#' + value + '-gradient-settings').show();
                selector.find('#' + value + '-fill-color').hide();
                obj.set('fill', new fabric.Gradient({
                    type: 'linear',
                    gradientUnits: 'percentage',
                    coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
                    colorStops: colorStops
                }));
                if (obj._objects) {
                    for (var i = 0; i < obj._objects.length; i++) {
                        if (obj._objects[i].fill != '') {
                            obj._objects[i].set({
                            fill: new fabric.Gradient({
                                type: 'linear',
                                gradientUnits: 'percentage',
                                coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
                                colorStops: colorStops
                            })
                            });
                        }
                    }
                }
            } else {
                selector.find('#' + value + '-gradient-settings').hide();
                selector.find('#' + value + '-fill-color').show();
                obj.set('fill', selector.find('#palleon-' + value + '-color').val());
                if (obj._objects) {
                    for (var i = 0; i < obj._objects.length; i++) {
                        if (obj._objects[i].fill != '') {
                            obj._objects[i].set('fill', selector.find('#palleon-' + value + '-color').val());
                        }
                    }
                }
            }
            canvas.requestRenderAll();
        }

        var gradientFields = ['text', 'shape', 'element'];

        $.each(gradientFields, function( index, value ) {
            selector.find('#palleon-' + value + '-gradient').on("change", function () {
                updateGradient(value);
            });
            selector.find('#' + value + '-gradient-color-1').on("change", function () {
                updateGradient(value);
            });
            selector.find('#' + value + '-gradient-color-2').on("change", function () {
                updateGradient(value);
            });
            selector.find('#' + value + '-gradient-color-3').on("change", function () {
                updateGradient(value);
            });
            selector.find('#' + value + '-gradient-color-4').on("change", function () {
                updateGradient(value);
            });
        });

        /* Get Scaled Size */
        function getScaledSize() {
            var width = canvas.backgroundImage.getScaledHeight();
            var height = canvas.backgroundImage.getScaledWidth();
            if (rotate == 0 || rotate == 180 || rotate == -180) {
                width = canvas.backgroundImage.getScaledWidth();
                height = canvas.backgroundImage.getScaledHeight();
            }
            return [width, height];
        }

        /* Add Text */
        selector.find('#palleon-add-text').on('click', function() {
            var text = new fabric.Textbox(palleonParams.textbox,{
                objectType: 'textbox',
                gradientFill: 'none',
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                fontWeight: settings.fontWeight,
                fontStyle: settings.fontStyle,
                lineHeight: settings.lineHeight,
                fill: settings.fill,
                stroke: settings.stroke,
                strokeWidth: settings.strokeWidth,
                textBackgroundColor: settings.textBackgroundColor,
                textAlign: settings.textAlign,
                width: getScaledSize()[0] / 2,
                top: getScaledSize()[1] / 2,
                left: getScaledSize()[0] / 2,
                originX: 'center',
                originY: 'center'
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.added });
        });

        /* Set Text Settings */
        function setTextSettings(text) {
            selector.find('#palleon-text-input').val(text.text);
            selector.find('#palleon-font-family').val(text.fontFamily);
            selector.find('#palleon-font-family').trigger('change');

            if (text.gradientFill == 'none' || text.gradientFill == '' || text.gradientFill === undefined) {
                selector.find('#palleon-text-gradient').val('none');
                selector.find('#palleon-text-color').spectrum("set", text.fill);
            } else if (text.gradientFill == 'vertical') {
                selector.find('#palleon-text-gradient').val('vertical');
            } else if (text.gradientFill == 'horizontal') {
                selector.find('#palleon-text-gradient').val('horizontal');
            } else if (text.gradientFill == 'diagonal') {
                selector.find('#palleon-text-gradient').val('diagonal');
            }

            if (text.gradientFill == 'vertical' || text.gradientFill == 'horizontal' || text.gradientFill == 'diagonal') {
                if (text.fill.colorStops.length == 4) {
                    selector.find('#text-gradient-color-1').spectrum("set", text.fill.colorStops[0].color);
                    selector.find('#text-gradient-color-2').spectrum("set", text.fill.colorStops[1].color);
                    selector.find('#text-gradient-color-3').spectrum("set", text.fill.colorStops[2].color);
                    selector.find('#text-gradient-color-4').spectrum("set", text.fill.colorStops[3].color);
                } else if (text.fill.colorStops.length == 3) {
                    selector.find('#text-gradient-color-1').spectrum("set", text.fill.colorStops[0].color);
                    selector.find('#text-gradient-color-2').spectrum("set", text.fill.colorStops[1].color);
                    selector.find('#text-gradient-color-3').spectrum("set", text.fill.colorStops[2].color);
                    selector.find('#text-gradient-color-4').spectrum("set", '');
                } else if (text.fill.colorStops.length == 2) {
                    selector.find('#text-gradient-color-1').spectrum("set", text.fill.colorStops[0].color);
                    selector.find('#text-gradient-color-2').spectrum("set", text.fill.colorStops[1].color);
                    selector.find('#text-gradient-color-3').spectrum("set", '');
                    selector.find('#text-gradient-color-4').spectrum("set", '');
                }
            }
            selector.find('#palleon-text-gradient').trigger('change');

            if (text.fontWeight == 'bold') {
                selector.find("#format-bold").addClass('active');
            } else {
                selector.find("#format-bold").removeClass('active');
            }
            if (text.fontStyle == 'italic') {
                selector.find("#format-italic").addClass('active');
            } else {
                selector.find("#format-italic").removeClass('active');
            }
            if (text.underline == true) {
                selector.find("#format-underline").addClass('active');
            } else {
                selector.find("#format-underline").removeClass('active');
            }
            if (text.textAlign == 'left') {
                selector.find('.format-align').removeClass('active');
                selector.find('#format-align-left').addClass('active');
            }
            if (text.textAlign == 'right') {
                selector.find('.format-align').removeClass('active');
                selector.find('#format-align-right').addClass('active');
            }
            if (text.textAlign == 'center') {
                selector.find('.format-align').removeClass('active');
                selector.find('#format-align-center').addClass('active');
            }
            if (text.textAlign == 'justify') {
                selector.find('.format-align').removeClass('active');
                selector.find('#format-align-justify').addClass('active');
            }

            selector.find('#palleon-font-size').val(text.fontSize);
            selector.find('#palleon-outline-size').val(text.strokeWidth);
            selector.find('#palleon-line-height').val(text.lineHeight);
            selector.find('#palleon-letter-spacing').val(text.charSpacing);
            selector.find('#palleon-outline-color').spectrum("set", text.stroke);
            selector.find('#palleon-text-background').spectrum("set", text.textBackgroundColor);

            if (text.shadow == null) {
                selector.find('#palleon-text-shadow').prop('checked', false);
            } else {
                selector.find('#palleon-text-shadow').prop('checked', true);
                selector.find('#text-shadow-color').spectrum("set", text.shadow.color);
                selector.find('#text-shadow-blur').val(text.shadow.blur);
                selector.find('#text-shadow-offset-x').val(text.shadow.offsetX);
                selector.find('#text-shadow-offset-y').val(text.shadow.offsetY);
            }
            selector.find('#palleon-text-shadow').trigger('change');

            if (text.flipX == true) {
                selector.find("#text-flip-x").addClass('active');
            } else {
                selector.find("#text-flip-x").removeClass('active');
            }

            if (text.flipY == true) {
                selector.find("#text-flip-y").addClass('active');
            } else {
                selector.find("#text-flip-y").removeClass('active');
            }

            selector.find('#text-skew-x').val(text.skewX);
            selector.find('#text-skew-x').parent().parent().find('.slider-label span').html(text.skewX);
            selector.find('#text-skew-y').val(text.skewY);
            selector.find('#text-skew-y').parent().parent().find('.slider-label span').html(text.skewY);
            selector.find('#text-rotate').val(parseInt(text.angle));
            selector.find('#text-rotate').parent().parent().find('.slider-label span').html(parseInt(text.angle));
        }

        /* Text Input */
        selector.find('#palleon-text-input').bind('input paste', function(){
            canvas.getActiveObject().set("text", $(this).val());
            selector.find("#palleon-layers #" + canvas.getActiveObject().id + " .layer-name").html(canvas.getActiveObject().text);
            canvas.requestRenderAll();
        });

        selector.find('#palleon-text-input').bind('focusout', function(){
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
        });

        /* Font Family */
        selector.find('#palleon-font-family').on('change', function() {
            var font = $(this).val();
            var loadFonts = 'yes';
            for (var i = 0; i < webSafeFonts.length; i++) {
                if (webSafeFonts[i][1] == font) {
                    loadFonts = 'no';
                    break;
                } 
            }
            if (loadFonts == 'yes') {
                WebFont.load({
                    google: {
                    families: [font + ':regular,bold', font + ':italic,regular,bold']
                    }
                });
                var fontNormal = new FontFaceObserver(font, {
                    weight: 'normal',
                    style: 'normal'
                  });
                var fontBold = new FontFaceObserver(font, {
                    weight: 'bold',
                    style: 'normal'
                });
                var fontNormalItalic = new FontFaceObserver(font, {
                    weight: 'normal',
                    style: 'italic'
                  });
                var fontBoldItalic = new FontFaceObserver(font, {
                    weight: 'bold',
                    style: 'italic'
                });
                Promise.all([fontNormal.load(null, 5000), fontBold.load(null, 5000), fontNormalItalic.load(null, 5000), fontBoldItalic.load(null, 5000)]).then(function () {
                    canvas.getActiveObject().set("fontFamily", font);
                    canvas.requestRenderAll();
                }).catch(function(e) {
                    console.log(e);
                });
            } else {
                canvas.getActiveObject().set("fontFamily", font);
                canvas.requestRenderAll();
            }
        });

        // Font Preview
        var loadedFonts = [];
        var fontTimeOut = 0;
        selector.find('#palleon-font-family').on('select2:open', function() {
            selector.find("#select2-palleon-font-family-results").scroll(function() {
                $(this).find('li:last-child').find('ul li').each(function() {
                    var item = $(this);
                    if(item.is(':in-viewport( 0, #select2-palleon-font-family-results)')) {
                        if (!loadedFonts.includes(item.attr('id'))) {
                            WebFont.load({
                                google: {
                                    families: [item.find('.select2-item').html()]
                                },
                                inactive: function() {
                                    WebFont.load({
                                        custom: {
                                        families: [item.find('.select2-item').html()],
                                        urls: ['https://fonts.googleapis.com/css?family=' + item.find('.select2-item').html() + '&text=abc']
                                        },
                                        active: function() {console.log("active")},
                                    });
                                },
                            });
                            loadedFonts.push(item.attr('id'));
                        }
                    }
                });
            });
            selector.on('keypress', '.select2-search .select2-search__field', function (e) {
                window.clearTimeout(fontTimeOut);
                fontTimeOut = setTimeout(function(){
                    selector.find("#select2-palleon-font-family-results").trigger('scroll');
                }, 500);
            });
        });

        /* Text Format Buttons */
        selector.find("#palleon-text-format-btns > .palleon-btn").on('click', function () {
            if ($(this).attr('id') == 'format-uppercase') {
                var text = selector.find('#palleon-text-input').val();
                if (text === text.toUpperCase()) {
                    text = text.toLowerCase();
                } else {
                    text = text.toUpperCase();
                }
                selector.find('#palleon-text-input').val(text);
                selector.find('#palleon-text-input').trigger('input');
            }
            if ($(this).hasClass('active')) {
                if ($(this).attr('id') == 'format-bold') {
                    canvas.getActiveObject().set("fontWeight", 'normal');
                    $(this).removeClass('active');
                }
                if ($(this).attr('id') == 'format-italic') {
                    canvas.getActiveObject().set("fontStyle", 'normal');
                    $(this).removeClass('active');
                }
                if ($(this).attr('id') == 'format-underlined') {
                    canvas.getActiveObject().set("underline", false);
                    $(this).removeClass('active');
                }
            } else {
                if ($(this).attr('id') == 'format-bold') {
                    canvas.getActiveObject().set("fontWeight", 'bold');
                }
                if ($(this).attr('id') == 'format-italic') {
                    canvas.getActiveObject().set("fontStyle", 'italic');
                }
                if ($(this).attr('id') == 'format-underlined') {
                    canvas.getActiveObject().set("underline", true);
                }
                if ($(this).attr('id') == 'format-align-left') {
                    canvas.getActiveObject().set("textAlign", 'left');
                }
                if ($(this).attr('id') == 'format-align-right') {
                    canvas.getActiveObject().set("textAlign", 'right');
                }
                if ($(this).attr('id') == 'format-align-center') {
                    canvas.getActiveObject().set("textAlign", 'center');
                }
                if ($(this).attr('id') == 'format-align-justify') {
                    canvas.getActiveObject().set("textAlign", 'justify');
                }

                selector.find('.format-align').removeClass('active');
                if ($(this).attr('id') != 'format-uppercase') {
                    $(this).addClass('active');
                }
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
        });

        /* Text Numeric Fields */
        selector.find('#palleon-text-settings input[type=number]').bind('input paste keyup keydown', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'palleon-font-size') {
                canvas.getActiveObject().set("fontSize", parseInt(val));
            } else if ($(this).attr('id') == 'palleon-outline-size') {
                canvas.getActiveObject().set("strokeWidth", parseInt(val));
            } else if ($(this).attr('id') == 'palleon-line-height') {
                canvas.getActiveObject().set("lineHeight", parseFloat(val));
            } else if ($(this).attr('id') == 'palleon-letter-spacing') {
                canvas.getActiveObject().set("charSpacing", parseInt(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-text-settings input[type=number]').bind('input', function() {
            window.clearTimeout(timeOut);
            timeOut = setTimeout(function(){
                canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
            }, 500); 
        });

        /* Text Color Fields */
        selector.find('#palleon-text-settings .palleon-colorpicker').bind('change', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'palleon-text-color') {
                canvas.getActiveObject().set("fill", val);
            } else if ($(this).attr('id') == 'palleon-outline-color') {
                canvas.getActiveObject().set("stroke", val);
            } else if ($(this).attr('id') == 'palleon-text-background') {
                canvas.getActiveObject().set("textBackgroundColor", val);
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
        });

        /* Text Flip Buttons */
        selector.find("#palleon-text-flip-btns > .palleon-btn").on('click', function () {
            if ($(this).hasClass('active')) {
                if ($(this).attr('id') == 'text-flip-x') {
                    canvas.getActiveObject().set("flipX", false);
                } else if ($(this).attr('id') == 'text-flip-y') {
                    canvas.getActiveObject().set("flipY", false);
                }
                $(this).removeClass('active');
            } else {
                if ($(this).attr('id') == 'text-flip-x') {
                    canvas.getActiveObject().set("flipX", true);
                } else if ($(this).attr('id') == 'text-flip-y') {
                    canvas.getActiveObject().set("flipY", true);
                }
                $(this).addClass('active');
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
        });

        /* Text Skew, Rotate, Opacity */
        selector.find('#palleon-text-settings input[type=range]').bind('input click', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'text-skew-x') {
                canvas.getActiveObject().set("skewX", parseInt(val));
            } else if ($(this).attr('id') == 'text-skew-y') {
                canvas.getActiveObject().set("skewY", parseInt(val));
            } else if ($(this).attr('id') == 'text-rotate') {
                canvas.getActiveObject().set("angle", parseInt(val));
            } else if ($(this).attr('id') == 'text-opacity') {
                canvas.getActiveObject().set("opacity", parseFloat(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-text-settings input[type=range]').bind('change', function() {
            canvas.fire('palleon:history', { type: 'textbox', text: palleonParams.edited});
        });

        /* Select2 icon support */
        function select2format(icon) {
            var originalOption = icon.element;
            if ($(originalOption).data('icon')) {
                return $('<div class="select2-item"><span class="material-icons">' + $(originalOption).data('icon') + '</span>' + icon.text + '</div>');
            } else if ($(originalOption).data('font')) {
                return $('<div class="select2-item" style="font-family:' + $(originalOption).data('font') + '">' + icon.text + '</div>');
            } else {
                return $('<div class="select2-item">' + icon.text + '</div>');
            }
        }

        /* Set Image Settings */
        function setImageSettings(img) {
            if (img.filters == '') {
                selector.find('#image-filter').val('none');
            } else {
                selector.find('#image-filter').val(img.filters[0]['type'].toLowerCase());
            }
            if (img.clipPath === undefined) {
                selector.find('#palleon-img-mask').val('none');
            } else if (img.clipPath == null) {
                selector.find('#palleon-img-mask').val('none');
            } else if (img.clipPath.maskType === undefined) {
                selector.find('#palleon-img-mask').val('none');
            } else if (img.clipPath.maskType == null) {
                selector.find('#palleon-img-mask').val('none');
            } else {
                selector.find('#palleon-img-mask').val(img.clipPath.maskType);
            }
            selector.find('#img-border-radius').val(img.roundedCorders);
            selector.find('#img-border-radius').parent().parent().find('.slider-label span').html(img.roundedCorders);
            if (img.shadow == null) {
                selector.find('#palleon-image-shadow').prop('checked', false);
            } else {
                selector.find('#palleon-image-shadow').prop('checked', true);
                selector.find('#image-shadow-color').spectrum("set", img.shadow.color);
                selector.find('#image-shadow-blur').val(img.shadow.blur);
                selector.find('#image-shadow-offset-x').val(img.shadow.offsetX);
                selector.find('#image-shadow-offset-y').val(img.shadow.offsetY);
            }
            selector.find('#palleon-image-shadow').trigger('change');
            selector.find('#img-border-width').val(img.strokeWidth);
            selector.find('#img-border-color').spectrum("set", img.stroke);
            selector.find('#img-opacity').val(img.opacity);
            selector.find('#img-opacity').parent().parent().find('.slider-label span').html(img.opacity);
            selector.find('#img-skew-x').val(img.skewX);
            selector.find('#img-skew-x').parent().parent().find('.slider-label span').html(img.skewX);
            selector.find('#img-skew-y').val(img.skewY);
            selector.find('#img-skew-y').parent().parent().find('.slider-label span').html(img.skewY);
            selector.find('#img-rotate').val(parseInt(img.angle));
            selector.find('#img-rotate').parent().parent().find('.slider-label span').html(parseInt(img.angle));
        }

        /* Upload Image */
        selector.find('#palleon-img-upload').on('change', function (e) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var imgObj = new Image();
                    convertToDataURL(event.target.result, function(dataUrl) {
                        imgObj.src = dataUrl;
                        imgObj.onload = function () {
                            var image = new fabric.Image(imgObj);
                            image.set({
                                objectType: 'image',
                                objectCaching: true,
                                roundedCorders: 0,
                                stroke: '#fff', 
                                strokeWidth: 0,
                                top: getScaledSize()[1] / 2,
                                left: getScaledSize()[0] / 2,
                                originX: 'center',
                                originY: 'center'
                            });   
                            image.set({
                                ogWidth: image.get('width'),
                                ogHeight: image.get('height'),
                            });
                            canvas.add(image);
                            image.scaleToWidth(getScaledSize()[0] / 2);
                            if (image.isPartiallyOnScreen()) {
                                image.scaleToHeight(getScaledSize()[1] / 2);
                            }
                            canvas.setActiveObject(image);
                            canvas.requestRenderAll();
                        };
                    });
            };
            reader.readAsDataURL(e.target.files[0]);
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.added });
        });

        /* Upload Overlay Image */
        selector.find('#palleon-overlay-img-upload').on('change', function (e) {
            if ($(this).val() == '') {
                return;
            }
            selector.find('#palleon-canvas-loader').css('display', 'flex');     
            var reader = new FileReader();
            reader.onload = function (event) {
                fabric.Image.fromURL(event.target.result, function(img) {
                    img.set({
                        scaleX: getScaledSize()[0] / img.width,
                        scaleY: getScaledSize()[1] / img.height,
                        objectCaching: false,
                        originX: 'left',
                        originY: 'top',
                        selectable: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        erasable: true
                    });
                    canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
                    selector.find('#palleon-overlay-wrap').show();
                    selector.find('#palleon-overlay-preview').attr('src', event.target.result);
                    setTimeout(function(){ 
                        selector.find('#palleon-canvas-loader').hide();
                    }, 500);
                 });
            };
            reader.readAsDataURL(e.target.files[0]);
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.added });
        });   

        /* Delete Overlay Image */
        selector.find('#palleon-overlay-delete').on('click', function() {
            if (typeof canvas.overlayImage !== "undefined" && canvas.overlayImage !== null) {
                canvas.overlayImage = null;
                selector.find('#palleon-overlay-wrap').hide();
                selector.find('#palleon-overlay-preview').attr('src', '');
                canvas.requestRenderAll();
            }
        });

        /* Image Flip X */
        selector.find('#img-flip-horizontal').on('click', function() {
            canvas.getActiveObject().toggle('flipX');
            canvas.requestRenderAll();  
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited }); 
        });

        /* Image Flip Y */
        selector.find('#img-flip-vertical').on('click', function() {
            canvas.getActiveObject().toggle('flipY');
            canvas.requestRenderAll();   
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited }); 
        });

        /* Rounded Corners */
        var roundedCorners = (fabricObject, cornerRadius) => new fabric.Rect({
            width: fabricObject.width,
            height: fabricObject.height,
            rx: cornerRadius / fabricObject.scaleX,
            ry: cornerRadius / fabricObject.scaleY,
            left: -fabricObject.width / 2,
            top: -fabricObject.height / 2
        });

        /* Image Border Radius */
        selector.find('#img-border-radius').on("input", function () {
            canvas.getActiveObject().set('clipPath', roundedCorners(canvas.getActiveObject(), parseInt($(this).val())));
            canvas.getActiveObject().set("roundedCorders", parseInt($(this).val()));
            canvas.requestRenderAll();
        });

        selector.find('#img-border-radius').bind('change', function() {
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited});
        });

        /* Image Border Color */
        selector.find('#img-border-color').bind('change', function() {
            canvas.getActiveObject().set("stroke", $(this).val());
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited});
        });

        /* Image Border Width */
        selector.find('#palleon-image-settings input[type=number]').on("input paste", function () {
            var val = parseInt($(this).val());
            if ($(this).attr('id') == 'img-border-width') {
                canvas.getActiveObject().set('strokeWidth', val);
            }
            canvas.requestRenderAll();   
        });

        selector.find('#palleon-image-settings input[type=number]').bind('input', function() {
            window.clearTimeout(timeOut);
            timeOut = setTimeout(function(){
                canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited});
            }, 500); 
        });

        /* Image Skew, Rotate, Opacity */
        selector.find('#palleon-image-settings input[type=range]').bind('input click', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'img-skew-x') {
                canvas.getActiveObject().set("skewX", parseInt(val));
            } else if ($(this).attr('id') == 'img-skew-y') {
                canvas.getActiveObject().set("skewY", parseInt(val));
            } else if ($(this).attr('id') == 'img-rotate') {
                canvas.getActiveObject().set("angle", parseInt(val));
            } else if ($(this).attr('id') == 'img-opacity') {
                canvas.getActiveObject().set("opacity", parseFloat(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-image-settings input[type=range]').bind('change', function() {
            canvas.fire('palleon:history', { type: 'image', text: palleonParams.edited});
        });

        /* Set Shape Settings */
        function setShapeSettings(shape) {
            selector.find('#palleon-shape-settings-info').hide();
            selector.find('#shape-outline-width').val(shape.strokeWidth);
            if (shape.gradientFill == 'none' || shape.gradientFill == '' || shape.gradientFill === undefined) {
                selector.find('#palleon-shape-gradient').val('none');
                selector.find('#palleon-shape-color').spectrum("set", shape.fill);
            } else if (shape.gradientFill == 'vertical') {
                selector.find('#palleon-shape-gradient').val('vertical');
            } else if (shape.gradientFill == 'horizontal') {
                selector.find('#palleon-shape-gradient').val('horizontal');
            } else if (shape.gradientFill == 'diagonal') {
                selector.find('#palleon-shape-gradient').val('diagonal');
            }
            if (shape.gradientFill == 'vertical' || shape.gradientFill == 'horizontal' || shape.gradientFill == 'diagonal') {
                if (shape.fill.colorStops.length == 4) {
                    selector.find('#shape-gradient-color-1').spectrum("set", shape.fill.colorStops[0].color);
                    selector.find('#shape-gradient-color-2').spectrum("set", shape.fill.colorStops[1].color);
                    selector.find('#shape-gradient-color-3').spectrum("set", shape.fill.colorStops[2].color);
                    selector.find('#shape-gradient-color-4').spectrum("set", shape.fill.colorStops[3].color);
                } else if (shape.fill.colorStops.length == 3) {
                    selector.find('#shape-gradient-color-1').spectrum("set", shape.fill.colorStops[0].color);
                    selector.find('#shape-gradient-color-2').spectrum("set", shape.fill.colorStops[1].color);
                    selector.find('#shape-gradient-color-3').spectrum("set", shape.fill.colorStops[2].color);
                    selector.find('#shape-gradient-color-4').spectrum("set", '');
                } else if (shape.fill.colorStops.length == 2) {
                    selector.find('#shape-gradient-color-1').spectrum("set", shape.fill.colorStops[0].color);
                    selector.find('#shape-gradient-color-2').spectrum("set", shape.fill.colorStops[1].color);
                    selector.find('#shape-gradient-color-3').spectrum("set", '');
                    selector.find('#shape-gradient-color-4').spectrum("set", '');
                }
            }
            selector.find('#palleon-shape-gradient').trigger('change');

            selector.find('#shape-outline-color').spectrum("set", shape.stroke);
            if (shape.shadow == null) {
                selector.find('#palleon-shape-shadow').prop('checked', false);
            } else {
                selector.find('#palleon-shape-shadow').prop('checked', true);
                selector.find('#shape-shadow-color').spectrum("set", shape.shadow.color);
                selector.find('#shape-shadow-blur').val(shape.shadow.blur);
                selector.find('#shape-shadow-offset-x').val(shape.shadow.offsetX);
                selector.find('#shape-shadow-offset-y').val(shape.shadow.offsetY);
            }
            selector.find('#palleon-shape-shadow').trigger('change');

            if (shape.strokeDashArray == null) {
                selector.find('#palleon-shape-dashed-outline').prop('checked', false);
            } else if (Array.isArray(shape.strokeDashArray)) {
                selector.find('#palleon-shape-dashed-outline').prop('checked', true);
                selector.find('#shape-dashed-outline-width').val(shape.strokeDashArray[0]);
                selector.find('#shape-dashed-outline-spacing').val(shape.strokeDashArray[1]);
            }
            selector.find('#palleon-shape-dashed-outline').trigger('change');

            selector.find('#shape-opacity').val(shape.opacity);
            selector.find('#shape-opacity').parent().parent().find('.slider-label span').html(shape.opacity);
            selector.find('#shape-skew-x').val(shape.skewX);
            selector.find('#shape-skew-x').parent().parent().find('.slider-label span').html(shape.skewX);
            selector.find('#shape-skew-y').val(shape.skewX);
            selector.find('#shape-skew-y').parent().parent().find('.slider-label span').html(shape.skewY);
            selector.find('#shape-rotate').val(parseInt(shape.angle));
            selector.find('#shape-rotate').parent().parent().find('.slider-label span').html(parseInt(shape.angle));

            if (shape.objectType == 'square' || shape.objectType == 'rectangle') {
                selector.find('#palleon-shape-rounded-corners').show();
            } else {
                selector.find('#palleon-shape-rounded-corners').hide();
            }

            if (shape.rx !== undefined) {
                selector.find('#shape-rounded-corners').val(parseInt(shape.rx));
                selector.find('#shape-rounded-corners').parent().parent().find('.slider-label span').html(parseInt(shape.rx));
            } else {
                selector.find('#shape-rounded-corners').val(0);
                selector.find('#shape-rounded-corners').parent().parent().find('.slider-label span').html(0);
            }

            if (shape.objectType == 'printarea') {
                selector.find('#shape-custom-width').val(shape.width);
                selector.find('#shape-custom-height').val(shape.height);
            } else {
                selector.find('#shape-custom-width').val('');
                selector.find('#shape-custom-height').val('');
            }
        }

        /* Shape Rounded Corners */
        selector.find('#shape-rounded-corners').on('input', function() {
            var val = parseInt($(this).val());
            var obj = canvas.getActiveObject();
            if (obj.objectType == 'square' || obj.objectType == 'rectangle') {
                obj.set('rx', val);
                obj.set('ry', val);
            }
            canvas.requestRenderAll();
        });

        /* Add Shape */
        selector.on('click','#palleon-shapes-grid > div',function(){
            var val = $(this).attr('data-id');
            if (val == 'printarea'){
                var objects = canvas.getObjects();
                objects.filter(element => element.objectType != 'BG').forEach(element => canvas.remove(element));
                selector.find('#palleon-layers li').remove();
            }
            var top = getScaledSize()[1] / 2;
            var left = getScaledSize()[0] / 2;
            var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
            if (print_a) {
                top = print_a.top;
                left = print_a.left;
            }
            if (val == 'customShape') {
                var serializer = new XMLSerializer();
                var svgStr = serializer.serializeToString($(this)[0]);
                fabric.loadSVGFromString(svgStr,function(objects, options){
                    var svg = fabric.util.groupSVGElements(objects, options);
                    svg.set('originX', 'center');
                    svg.set('originY', 'center');
                    svg.set('left', left);
                    svg.set('top', top);
                    svg.set('objectType', 'customShape');
                    svg.set('gradientFill', 'none');
                    svg.set('stroke', '#000');
                    svg.set('strokeWidth', 0);
                    svg.set('fill', '#fff');
                    canvas.add(svg);
                    if (print_a) {
                        svg.scaleToWidth((print_a.width * 0.5) * canvas.getZoom());
                        if(!svg.isContainedWithinObject(print_a)) {
                            svg.scaleToHeight((print_a.height * 0.5) * canvas.getZoom());
                        }
                    } else {
                        svg.scaleToWidth(getScaledSize()[0] / 8);
                        if (svg.isPartiallyOnScreen()) {
                            svg.scaleToHeight(getScaledSize()[1] / 8);
                        }
                    }
                    canvas.setActiveObject(svg);
                    canvas.requestRenderAll();
                    canvas.fire('palleon:history', { type: 'customShape', text: palleonParams.added });
                }, function() {}, {
                    crossOrigin: 'anonymous'
                });
            } else {
                var shape = '';
                var polygon = '';
                if (val == 'circle') {
                    shape = new fabric.Circle({
                        radius: 50,
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'circle',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                    shape.controls = {
                        ...fabric.Rect.prototype.controls,
                        ml: new fabric.Control({ visible: false }),
                        mb: new fabric.Control({ visible: false }),
                        mr: new fabric.Control({ visible: false }),
                        mt: new fabric.Control({ visible: false })
                    };
                } else if (val == 'ellipse') {
                    shape = new fabric.Ellipse({
                        rx: 75,
                        ry: 50,
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'ellipse',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'square') {
                    shape = new fabric.Rect({
                        radius: 50,
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'square',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                    shape.controls = {
                        ...fabric.Rect.prototype.controls,
                        ml: new fabric.Control({ visible: false }),
                        mb: new fabric.Control({ visible: false }),
                        mr: new fabric.Control({ visible: false }),
                        mt: new fabric.Control({ visible: false })
                    };
                } else if (val == 'rectangle') {
                    shape = new fabric.Rect({
                        radius: 50,
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'rectangle',
                        width:200,
                        height:150,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'triangle') {
                    shape = new fabric.Triangle({
                        radius: 50,
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'triangle',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'trapezoid') {
                    polygon = [ {x:-100,y:-50},{x:100,y:-50},{x:150,y:50},{x:-150,y:50} ];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'trapezoid',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'pentagon') {
                    polygon = [{x:26,y:86},
                        {x:11.2,y:40.4},
                        {x:50,y:12.2},
                        {x:88.8,y:40.4},
                        {x:74,y:86}];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'pentagon',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'octagon') {
                    polygon = [{x:34.2,y:87.4},
                        {x:12.3,y:65.5},
                        {x:12.3,y:34.5},
                        {x:34.2,y:12.6},
                        {x:65.2,y:12.6},
                        {x:87.1,y:34.5},
                        {x:87.1,y:65.5},
                        {x:65.2,y:87.4}
                    ];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'octagon',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'emerald') {
                    polygon = [{x:850,y:75},
                        {x:958,y:137.5},
                        {x:958,y:262.5},
                        {x:850,y:325},
                        {x:742,y:262.5},
                        {x:742,y:137.5}];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'emerald',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'star') {
                    polygon = [{x:350,y:75},
                        {x:380,y:160},
                        {x:470,y:160},
                        {x:400,y:215},
                        {x:423,y:301},
                        {x:350,y:250},
                        {x:277,y:301},
                        {x:303,y:215},
                        {x:231,y:161},
                        {x:321,y:161}];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'star',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'diamond') {
                    polygon = [{x:69.445,y:125},
                        {x:125,y:28.774},
                        {x:180.556,y:125},
                        {x:125,y:221.227}];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'diamond',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'parallelogram') {
                    polygon = [{x:15,y:10},
                        {x:55,y:10},
                        {x:45,y:20},
                        {x:5,y:20}];
                    shape = new fabric.Polygon(polygon,{
                        fill: '#fff',
                        stroke: '#000',
                        strokeWidth: 0,
                        objectType: 'parallelogram',
                        width:100,
                        height:100,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        originX: 'center',
                        originY: 'center'
                    });
                } else if (val == 'printarea') {
                    shape = new fabric.Rect({
                        radius: 50,
                        fill: '',
                        stroke: '#4affff',
                        strokeWidth: 3,
                        strokeDashArray: [10, 5],
                        objectType: 'printarea',
                        width:originalWidth / 2,
                        height:originalHeight / 2,
                        gradientFill: 'none',
                        top: top,
                        left: left,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true,
                        originX: 'center',
                        originY: 'center'
                    });
                    shape.controls = {
                        ...fabric.Rect.prototype.controls,
                        mtr: new fabric.Control({ visible: false }),
                        ml: new fabric.Control({ visible: false }),
                        mb: new fabric.Control({ visible: false }),
                        mr: new fabric.Control({ visible: false }),
                        mt: new fabric.Control({ visible: false }),
                        tl: new fabric.Control({ visible: false }),
                        bl: new fabric.Control({ visible: false }),
                        tr: new fabric.Control({ visible: false }),
                        br: new fabric.Control({ visible: false })
                    };
                }
                canvas.add(shape);
                if (print_a) {
                    shape.scaleToWidth((print_a.width * 0.5) * canvas.getZoom());
                    if(!shape.isContainedWithinObject(print_a)) {
                        shape.scaleToHeight((print_a.height * 0.5) * canvas.getZoom());
                    }
                } else if (shape.objectType != 'printarea') {
                    shape.scaleToWidth(getScaledSize()[0] / 6);
                    if (shape.isPartiallyOnScreen()) {
                        shape.scaleToHeight(getScaledSize()[1] / 6);
                    }
                }
                canvas.setActiveObject(shape);
                canvas.requestRenderAll();  
                canvas.fire('palleon:history', { type: val, text: palleonParams.added });
            }
        });

        /* Load More Shapes */
        selector.find('#palleon-shape-loadmore').on('click', function() {
            var btn = $(this);
            btn.html(palleonParams.loading);
            btn.prop('disabled', true);
            $.getJSON(settings.baseURL + 'json/shapes.json', function(shapes) {
                $.each(shapes, function( index, val ) {
                    var item = '<div class="palleon-shape" data-id="customShape" title="' + palleonParams.customShape + '">' + val + '</div>';
                    selector.find('#palleon-shapes-grid').append(item);
                });
                btn.remove();
            });
        });

        /* Shape Color Fields */
        selector.find('#palleon-shape-settings .palleon-colorpicker').bind('change', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'palleon-shape-color') {
                canvas.getActiveObject().set('fill', val);
            } else if ($(this).attr('id') == 'shape-outline-color') {
                canvas.getActiveObject().set('stroke', val);
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: canvas.getActiveObject().objectType, text: palleonParams.edited });
        });

        /* Shape Skew, Rotate, Opacity */
        selector.find('#palleon-shape-settings input[type=range]').bind('input click', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'shape-skew-x') {
                canvas.getActiveObject().set("skewX", parseInt(val));
            } else if ($(this).attr('id') == 'shape-skew-y') {
                canvas.getActiveObject().set("skewY", parseInt(val));
            } else if ($(this).attr('id') == 'shape-rotate') {
                canvas.getActiveObject().set("angle", parseInt(val));
            } else if ($(this).attr('id') == 'shape-opacity') {
                canvas.getActiveObject().set("opacity", parseFloat(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-shape-settings input[type=range]').bind('change', function() {
            canvas.fire('palleon:history', { type: canvas.getActiveObject().objectType, text: palleonParams.edited });
        });

        /* Shape Numeric Fields */
        selector.find('#palleon-shape-settings input[type=number]').bind('input paste', function() {
            var val = parseInt($(this).val());
            if ($(this).attr('id') == 'shape-outline-width') {
                canvas.getActiveObject().set('strokeWidth', val);
            } else if ($(this).attr('id') == 'shape-custom-width') {
                canvas.getActiveObject().set("width", val);
                canvas.getActiveObject().set("scaleX", 1);
            } else if ($(this).attr('id') == 'shape-custom-height') {
                canvas.getActiveObject().set("height", val);
                canvas.getActiveObject().set("scaleY", 1);
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-shape-settings input[type=number]').bind('input', function() {
            window.clearTimeout(timeOut);
            timeOut = setTimeout(function(){
                canvas.fire('palleon:history', { type: canvas.getActiveObject().objectType, text: palleonParams.edited});
            }, 500); 
        });

        /* Shape Aspect Ratio Width Input */
        selector.find('#shape-custom-width').bind('input paste', function(){
            if (selector.find('#palleon-shape-ratio-lock').hasClass('active')) {
                var width = parseInt($(this).val());
                var ratioW = parseInt(selector.find('#palleon-shape-ratio-w').val());
                var ratioH = parseInt(selector.find('#palleon-shape-ratio-h').val());
                var height = (width * ratioH) / ratioW;
                selector.find('#shape-custom-height').val(Math.round(height));
                canvas.getActiveObject().set("height", height);
                canvas.getActiveObject().set("scaleY", 1);
            }
        });

        /* Shape Aspect Ratio Height Input */
        selector.find('#shape-custom-height').bind('input paste', function(){
            if (selector.find('#palleon-shape-ratio-lock').hasClass('active')) {
                var height = $(this).val();
                var ratioW = parseInt(selector.find('#palleon-shape-ratio-w').val());
                var ratioH = parseInt(selector.find('#palleon-shape-ratio-h').val());
                var width = (height * ratioW) / ratioH;
                selector.find('#shape-custom-width').val(Math.round(width));
                canvas.getActiveObject().set("width", width);
                canvas.getActiveObject().set("scaleX", 1);
            }
        });

         /* FRAMES */

        /* Filter frames */
        var filterframes = function(searchTerm) {
            selector.find('#palleon-frames-wrap li').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
        };

        /* Search frame Input */
        selector.find('#palleon-frame-search').on('keyup input', function () {
            selector.find("#palleon-noframes").hide();
            var searchTerm = $(this).val().toLowerCase().replace(/\s/g,' ');
            if ((searchTerm == '') || (searchTerm.length < 1)) {
                selector.find('#palleon-frames-wrap li').show();
                selector.find('#palleon-frame-search-icon').html('search');
                selector.find('#palleon-frame-search-icon').removeClass('cancel');
            } else {
                selector.find('#palleon-frame-search-icon').html('clear');
                selector.find('#palleon-frame-search-icon').addClass('cancel');
                filterframes(searchTerm);
                if (selector.find('#palleon-frames-wrap li:visible').length === 0) {
                    selector.find("#palleon-noframes").show();
                }
            }
        });

        /* Search frame Icon */
        selector.find('#palleon-frame-search-icon').on('click', function () {
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).html('search');
                selector.find('#palleon-frame-search').val('');
                selector.find('#palleon-frames-wrap li').show();
                selector.find("#palleon-noframes").hide();
            }
        });

        /* Add frame */
        selector.find('.palleon-frames-grid').on('click','.palleon-frame img',function(){
            selector.find('#palleon-canvas-loader').css('display', 'flex');
            var frame = $(this).parent().parent();
            var svgUrl = frame.data('elsource');
            selector.find('.palleon-frames-grid .palleon-frame').removeClass('active');
            frame.addClass('active');
            fabric.loadSVGFromURL(svgUrl,function(objects, options){
                var svg = fabric.util.groupSVGElements(objects, options);
                var svgWidth = svg.width;
                var svgHeight = svg.height;
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', getScaledSize()[0] / 2);
                svg.set('top', getScaledSize()[1] / 2);
                svg.set('scaleX', (getScaledSize()[0]+2) / svgWidth);
                svg.set('scaleY', (getScaledSize()[1]+2) / svgHeight);
                svg.set('objectType', 'frame');
                canvas.add(svg);
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
                selector.find('#palleon-canvas-loader').hide();
            }, function() {}, {
                crossOrigin: 'anonymous'
            });
            canvas.fire('palleon:history', { type: 'frame', text: palleonParams.added });
        });

        /* Frame color */
        selector.find('#palleon-frame-color').bind('change', function() {
            var val = $(this).val();
            var objects = canvas.getObjects().filter(element => element.objectType == 'frame');
            $.each(objects, function(index, value) {
                if (value.fill != '') {
                    value.set('fill', val);
                }
                if (value._objects) {
                    for (var i = 0; i < value._objects.length; i++) {
                        if (value._objects[i].fill != '') {
                            value._objects[i].set({
                            fill: val
                            });
                        }
                    }
                }
            });
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'frame', text: palleonParams.edited});
        });

        /* Rotate Frame */
        function rotateFrame(direction) {
            var objects = canvas.getObjects().filter(element => element.objectType == 'frame');
            $.each(objects, function(index, svg) {
                var svgRotate = svg.angle;
                var svgWidth = svg.width;
                var svgHeight = svg.height;
                var width = getScaledSize()[0];
                var height = getScaledSize()[1];
                if (svgRotate == 0 || svgRotate == 180 || svgRotate == -180) {
                    width = getScaledSize()[1];
                    height = getScaledSize()[0];
                }
                if (direction == 'right') {
                    if (svgRotate == 0) {
                        svgRotate = 90;
                    } else if (svgRotate == 90) {
                        svgRotate = 180;
                    } else if (svgRotate == 180) {
                        svgRotate = 270;
                    } else if (svgRotate == 270) {
                        svgRotate = 0;
                    } else if (svgRotate == -90) {
                        svgRotate = 0;
                    } else if (svgRotate == -180) {
                        svgRotate = -90;
                    } else if (svgRotate == -270) {
                        svgRotate = -180;
                    }
                } else if (direction == 'left') {
                    if (svgRotate == 0) {
                        svgRotate = -90;
                    } else if (svgRotate == -90) {
                        svgRotate = -180;
                    } else if (svgRotate == -180) {
                        svgRotate = -270;
                    } else if (svgRotate == -270) {
                        svgRotate = 0;
                    } else if (svgRotate == 90) {
                        svgRotate = 0;
                    } else if (svgRotate == 180) {
                        svgRotate = 90;
                    } else if (svgRotate == 270) {
                        svgRotate = 180;
                    }
                }
                svg.set('left', getScaledSize()[0] / 2);
                svg.set('top', getScaledSize()[1] / 2);
                svg.set('scaleX', width / svgWidth);
                svg.set('scaleY', height / svgHeight);
                svg.set('angle', svgRotate);
            });
            canvas.requestRenderAll(); 
            canvas.fire('palleon:history', { type: 'frame', text: palleonParams.edited});
        }

        /* Frame Rotate Right */
        selector.find('#palleon-rotate-right-frame').on('click', function() {
            rotateFrame('right');
        });

        /* Frame Rotate Left */
        selector.find('#palleon-rotate-left-frame').on('click', function() {
            rotateFrame('left');
        });

        /* Frame Flip X */
        selector.find('#palleon-flip-horizontal-frame').on('click', function() {
            var objects = canvas.getObjects().filter(element => element.objectType == 'frame');
            $.each(objects, function(index, value) {
                value.toggle('flipX');
            });
            canvas.requestRenderAll();  
            canvas.fire('palleon:history', { type: 'frame', text: palleonParams.edited});
        });

        /* Frame Flip Y */
        selector.find('#palleon-flip-vertical-frame').on('click', function() {
            var objects = canvas.getObjects().filter(element => element.objectType == 'frame');
            $.each(objects, function(index, value) {
                value.toggle('flipY');
            });
            canvas.requestRenderAll();  
            canvas.fire('palleon:history', { type: 'frame', text: palleonParams.edited});
        });

        /* ELEMENTS */

        /* Filter elements */
        var filterElements = function(searchTerm) {
            selector.find('#palleon-elements-wrap li').hide().filter('[data-keyword*="'+ searchTerm +'"]').show();
        };

        /* Search Element Input */
        selector.find('#palleon-element-search').on('keyup input', function () {
            selector.find("#palleon-noelements").hide();
            var searchTerm = $(this).val().toLowerCase().replace(/\s/g,' ');
            if ((searchTerm == '') || (searchTerm.length < 1)) {
                selector.find('#palleon-elements-wrap li').show();
                selector.find('#palleon-element-search-icon').html('search');
                selector.find('#palleon-element-search-icon').removeClass('cancel');
            } else {
                selector.find('#palleon-element-search-icon').html('clear');
                selector.find('#palleon-element-search-icon').addClass('cancel');
                filterElements(searchTerm);
                if (selector.find('#palleon-elements-wrap li:visible').length === 0) {
                    selector.find("#palleon-noelements").show();
                }
            }
        });

        /* Search Element Icon */
        selector.find('#palleon-element-search-icon').on('click', function () {
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).html('search');
                selector.find('#palleon-element-search').val('');
                selector.find('#palleon-elements-wrap li').show();
                selector.find("#palleon-noelements").hide();
            }
        });

        /* Add Element */
        selector.find('.palleon-elements-grid').on('click','.palleon-element > *:first-child',function(){
            var element = $(this).parent();
            var svgUrl = element.data('elsource');
            if (element.parent().attr('id') == 'palleon-icons-grid') {
                var iconStyle = selector.find('#palleon-icon-style').val();
                svgUrl = element.data('elsource') + '/' + iconStyle + '/24px.svg';
                console.log(svgUrl);
            }
            var loader = element.data('loader');
            if (loader == 'yes') {
                selector.find('#palleon-canvas-loader').css('display', 'flex');  
            }
            selector.find('.palleon-elements-grid .palleon-element').removeClass('active');
            element.addClass('active');

            fabric.loadSVGFromURL(svgUrl,function(objects, options){
                var svg = fabric.util.groupSVGElements(objects, options);
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', getScaledSize()[0] / 2);
                svg.set('top', getScaledSize()[1] / 2);
                if (isSameColor(svg)) {
                    svg.set('objectType', 'element');
                    canvas.fire('palleon:history', { type: 'element', text: palleonParams.added });
                } else {
                    svg.set('objectType', 'customSVG');
                    canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.added });
                }
                svg.set('gradientFill', 'none');
                canvas.add(svg);
                svg.scaleToWidth(getScaledSize()[0] / 8);
                if (svg.isPartiallyOnScreen()) {
                    svg.scaleToHeight(getScaledSize()[1] / 8);
                }
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
                if (loader == 'yes') {
                    selector.find('#palleon-canvas-loader').hide();
                }
            }, function() {}, {
                crossOrigin: 'anonymous'
            });
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.added });
        });

        /* Set element Settings */
        function setElementSettings(obj) {
            if (obj.gradientFill == 'none' || obj.gradientFill == '' || obj.gradientFill === undefined) {
                selector.find('#palleon-element-gradient').val('none');
                selector.find('#palleon-element-color').spectrum("set", obj.fill);
            } else if (obj.gradientFill == 'vertical') {
                selector.find('#palleon-element-gradient').val('vertical');
            } else if (obj.gradientFill == 'horizontal') {
                selector.find('#palleon-element-gradient').val('horizontal');
            } else if (obj.gradientFill == 'diagonal') {
                selector.find('#palleon-element-gradient').val('diagonal');
            }
            
            if (obj.gradientFill == 'vertical' || obj.gradientFill == 'horizontal' || obj.gradientFill == 'diagonal') {
                if (obj.fill.colorStops.length == 4) {
                    selector.find('#element-gradient-color-1').spectrum("set", obj.fill.colorStops[0].color);
                    selector.find('#element-gradient-color-2').spectrum("set", obj.fill.colorStops[1].color);
                    selector.find('#element-gradient-color-3').spectrum("set", obj.fill.colorStops[2].color);
                    selector.find('#element-gradient-color-4').spectrum("set", obj.fill.colorStops[3].color);
                } else if (obj.fill.colorStops.length == 3) {
                    selector.find('#element-gradient-color-1').spectrum("set", obj.fill.colorStops[0].color);
                    selector.find('#element-gradient-color-2').spectrum("set", obj.fill.colorStops[1].color);
                    selector.find('#element-gradient-color-3').spectrum("set", obj.fill.colorStops[2].color);
                    selector.find('#element-gradient-color-4').spectrum("set", '');
                } else if (obj.fill.colorStops.length == 2) {
                    selector.find('#element-gradient-color-1').spectrum("set", obj.fill.colorStops[0].color);
                    selector.find('#element-gradient-color-2').spectrum("set", obj.fill.colorStops[1].color);
                    selector.find('#element-gradient-color-3').spectrum("set", '');
                    selector.find('#element-gradient-color-4').spectrum("set", '');
                }
            }
            selector.find('#palleon-element-gradient').trigger('change');
            selector.find('#element-opacity').val(obj.opacity);
            selector.find('#element-opacity').parent().parent().find('.slider-label span').html(obj.opacity);
            selector.find('#element-skew-x').val(obj.skewX);
            selector.find('#element-skew-x').parent().parent().find('.slider-label span').html(obj.skewX);
            selector.find('#element-skew-y').val(obj.skewY);
            selector.find('#element-skew-y').parent().parent().find('.slider-label span').html(obj.skewY);
            selector.find('#element-rotate').val(parseInt(obj.angle));
            selector.find('#element-rotate').parent().parent().find('.slider-label span').html(parseInt(obj.angle));
            if (obj.shadow == null) {
                selector.find('#palleon-element-shadow').prop('checked', false);
            } else {
                selector.find('#palleon-element-shadow').prop('checked', true);
                selector.find('#element-shadow-color').spectrum("set", obj.shadow.color);
                selector.find('#element-shadow-blur').val(obj.shadow.blur);
                selector.find('#element-shadow-offset-x').val(obj.shadow.offsetX);
                selector.find('#element-shadow-offset-y').val(obj.shadow.offsetY);
            }
            selector.find('#palleon-element-shadow').trigger('change');
        }

        /* Upload Custom Element */
        selector.find('#palleon-element-upload').on('change', function (e) {
            var reader = new FileReader();
            var svgImg = '';
            reader.onload = function(ev) {
                svgImg = reader.result;
                fabric.loadSVGFromURL(svgImg,function(objects, options){
                    var svg = fabric.util.groupSVGElements(objects, options);
                    svg.set('originX', 'center');
                    svg.set('originY', 'center');
                    svg.set('left', getScaledSize()[0] / 2);
                    svg.set('top', getScaledSize()[1] / 2);
                    if (isSameColor(svg)) {
                        svg.set('objectType', 'element');
                        canvas.fire('palleon:history', { type: 'element', text: palleonParams.added });
                    } else {
                        svg.set('objectType', 'customSVG');
                        canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.added });
                    }
                    svg.scaleToWidth(getScaledSize()[0] / 2);
                    svg.scaleToHeight(getScaledSize()[1] / 2);
                    canvas.add(svg);
                    canvas.setActiveObject(svg);
                    canvas.requestRenderAll();
                }, function() {}, {
                    crossOrigin: 'anonymous'
                });
            };
            reader.readAsDataURL(this.files[0]);
        });

        /* Custom element color */
        selector.find('#palleon-element-color').bind('change', function() {
            var val = $(this).val();
            var obj = canvas.getActiveObject();
            if (obj.fill != '') {
                obj.set('fill', val);
            }
            if (obj._objects) {
                for (var i = 0; i < obj._objects.length; i++) {
                    if (obj._objects[i].fill != '') {
                        obj._objects[i].set({
                        fill: val
                        });
                    }
                }
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.edited });
        });

        /* Custom Element Flip X */
        selector.find('#element-flip-horizontal').on('click', function() {
            canvas.getActiveObject().toggle('flipX');
            canvas.requestRenderAll();   
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.edited });
        });

        /* Custom Element Flip Y */
        selector.find('#element-flip-vertical').on('click', function() {
            canvas.getActiveObject().toggle('flipY');
            canvas.requestRenderAll();   
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.edited });
        });

        /* Custom Element Skew, Rotate, Opacity */
        selector.find('#palleon-custom-element-options input[type=range]').bind('input click', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'element-skew-x') {
                canvas.getActiveObject().set("skewX", parseInt(val));
            } else if ($(this).attr('id') == 'element-skew-y') {
                canvas.getActiveObject().set("skewY", parseInt(val));
            } else if ($(this).attr('id') == 'element-rotate') {
                canvas.getActiveObject().set("angle", parseInt(val));
            } else if ($(this).attr('id') == 'element-opacity') {
                canvas.getActiveObject().set("opacity", parseFloat(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-custom-element-options input[type=range]').bind('change', function() {
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.edited});
        });

        /* Set custom SVG Settings */
        function setCustomSVGSettings(obj) {
            if (obj._objects) {
                var colors = [];
                var output = '';
                $.each(obj._objects, function( index, val ) {
                    if (colors.indexOf(val.get('fill')) === -1) {
                        colors.push(val.get('fill'));
                    } 
                });
                $.each(colors, function( index, color ) {
                    if (typeof color === 'string' || color instanceof String) {
                        var count = index + 1;
                        output += '<div class="palleon-control-wrap control-text-color"><label class="palleon-control-label">' + palleonParams.fillColor + ' ' + count + '</label><div class="palleon-control"><input id="customsvg-color-' + count + '" type="text" data-color="' + color + '" class="customsvg-color palleon-colorpicker disallow-empty" autocomplete="off" value="' + color + '" /></div></div>';
                    }
                });
                selector.find('#customsvg-colors').html(output);
                selector.find(".customsvg-color").spectrum({
                    allowEmpty: false,
                    showInitial: true,
                    hideAfterPaletteSelect:true,
                    showAlpha: true
                });
            }
            selector.find('#customsvg-opacity').val(obj.opacity);
            selector.find('#customsvg-opacity').parent().parent().find('.slider-label span').html(obj.opacity);
            selector.find('#customsvg-skew-x').val(obj.skewX);
            selector.find('#customsvg-skew-x').parent().parent().find('.slider-label span').html(obj.skewX);
            selector.find('#customsvg-skew-y').val(obj.skewY);
            selector.find('#customsvg-skew-y').parent().parent().find('.slider-label span').html(obj.skewY);
            selector.find('#customsvg-rotate').val(parseInt(obj.angle));
            selector.find('#customsvg-rotate').parent().parent().find('.slider-label span').html(parseInt(obj.angle));
        }

        /* Custom element color */
        selector.find('#palleon-customsvg-upload').on('change','.customsvg-color',function(){
            var val = $(this).val();
            var oldColor = $(this).attr('data-color');
            var obj = canvas.getActiveObject();
            if (obj._objects) {
                for (var i = 0; i < obj._objects.length; i++) {
                    if (obj._objects[i].fill == oldColor) {
                        obj._objects[i].set({
                            fill: val
                        });
                    }
                }
                $(this).attr('data-color', val);
            }
            canvas.requestRenderAll();
            canvas.fire('palleon:history', { type: 'element', text: palleonParams.edited });
        });

        /* Custom Element Flip X */
        selector.find('#customsvg-flip-horizontal').on('click', function() {
            canvas.getActiveObject().toggle('flipX');
            canvas.requestRenderAll();   
            canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.edited });
        });

        /* Custom Element Flip Y */
        selector.find('#customsvg-flip-vertical').on('click', function() {
            canvas.getActiveObject().toggle('flipY');
            canvas.requestRenderAll();   
            canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.edited });
        });

        /* Custom Element Skew, Rotate, Opacity */
        selector.find('#palleon-custom-svg-options input[type=range]').bind('input click', function() {
            var val = $(this).val();
            if ($(this).attr('id') == 'customsvg-skew-x') {
                canvas.getActiveObject().set("skewX", parseInt(val));
            } else if ($(this).attr('id') == 'customsvg-skew-y') {
                canvas.getActiveObject().set("skewY", parseInt(val));
            } else if ($(this).attr('id') == 'customsvg-rotate') {
                canvas.getActiveObject().set("angle", parseInt(val));
            } else if ($(this).attr('id') == 'customsvg-opacity') {
                canvas.getActiveObject().set("opacity", parseFloat(val));
            }
            canvas.requestRenderAll();
        });

        selector.find('#palleon-custom-svg-options input[type=range]').bind('change', function() {
            canvas.fire('palleon:history', { type: 'customSVG', text: palleonParams.edited});
        });

        /* ICON LIBRARY */

        /* Filter icons */
        var filterIcons = function(searchTerm) {
            selector.find('#palleon-icons-grid .palleon-element').css('display', 'none').filter('[title*="'+ searchTerm +'"]').css('display', 'flex');
        };

        /* Search Icon Input */
        selector.find('#palleon-icon-search').on('keyup input', function () {
            selector.find("#palleon-noicons").hide();
            var searchTerm = $(this).val().toLowerCase().replace(/\s/g,' ');
            if ((searchTerm == '') || (searchTerm.length < 1)) {
                selector.find('#palleon-icons-grid .palleon-element').css('display', 'flex');
                selector.find('#palleon-icon-search-icon').html('search');
                selector.find('#palleon-icon-search-icon').removeClass('cancel');
            } else {
                selector.find('#palleon-icon-search-icon').html('clear');
                selector.find('#palleon-icon-search-icon').addClass('cancel');
                filterIcons(searchTerm);
                if (selector.find('#palleon-icons-grid .palleon-element:visible').length === 0) {
                    selector.find("#palleon-noicons").show();
                }
            }
        });

        /* Search Icon */
        selector.find('#palleon-icon-search-icon').on('click', function () {
            if ($(this).hasClass('cancel')) {
                $(this).removeClass('cancel');
                $(this).html('search');
                selector.find('#palleon-icon-search').val('');
                selector.find('#palleon-icons-grid .palleon-element').css('display', 'flex');
                selector.find("#palleon-noicons").hide();
            }
        });

        ///////////////////////* APPS *///////////////////////

        selector.find('#palleon-apps-menu > .palleon-apps-menu-item').on('click', function () {
            var target = $(this).attr('data-id');
            selector.find('#palleon-apps-content > div').addClass('d-none');
            selector.find(target).removeClass('d-none');
            selector.find('#palleon-apps-menu').hide();
        });

        selector.find('.palleon-close-app').on('click', function () {
            selector.find('#palleon-apps-content > div').addClass('d-none');
            selector.find('#palleon-apps-menu').show();
        });

        selector.find('.palleon-app-download').on('click', function () {
            var id = $(this).attr('data-id');
            var imgData = selector.find('#palleon-' + id + '-preview')[0];
            var serializer = new XMLSerializer();
            var svgStr = serializer.serializeToString(imgData);
            var a = document.createElement("a");
            var file = new Blob([svgStr], { type: "text/plain" });
            a.href = URL.createObjectURL(file);
            a.download = id + '.svg';
            a.click();
        });

        selector.find('.palleon-app-download-png').on('click', function () {
            var id = $(this).attr('data-id');
            var imgData = selector.find('#palleon-' + id + '-preview').find('img').attr('src');
            var blob = dataURLtoBlob(imgData);
            var objurl = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.download = id + '.png';
            link.href = objurl;
            link.click();
        });

        selector.find('.palleon-app-select').on('click', function () {
            var btn = $(this);
            var id = $(this).attr('data-id');
            var imgData = selector.find('#palleon-' + id + '-preview')[0];
            var top = getScaledSize()[1] / 2;
            var left = getScaledSize()[0] / 2;
            var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
            if (print_a) {
                top = print_a.top;
                left = print_a.left;
            }
            var serializer = new XMLSerializer();
            var svgStr = serializer.serializeToString(imgData);
            fabric.loadSVGFromString(svgStr,function(objects, options) {
                var svg = fabric.util.groupSVGElements(objects, options);
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', left);
                svg.set('top', top);
                if (btn.hasClass('element')) {
                    svg.set('objectType', 'element');
                } else {
                    svg.set('objectType', 'customSVG');
                }
                svg.set('gradientFill', 'none');
                svg.controls = {
                    ...fabric.Rect.prototype.controls,
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false })
                };
                canvas.add(svg);
                if (print_a) {
                    svg.scaleToWidth((print_a.width * 0.5) * canvas.getZoom());
                    if(!svg.isContainedWithinObject(print_a)) {
                        svg.scaleToHeight((print_a.height * 0.5) * canvas.getZoom());
                    }
                } else {
                    svg.scaleToWidth(getScaledSize()[0] / 8);
                    if (svg.isPartiallyOnScreen()) {
                        svg.scaleToHeight(getScaledSize()[1] / 8);
                    }
                }
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
            });
        });

        selector.find('.palleon-app-select-png').on('click', function () {
            var id = $(this).attr('data-id');
            var imgData = selector.find('#palleon-' + id + '-preview').find('img').attr('src');
            var tempImg = new Image();
            var top = getScaledSize()[1] / 2;
            var left = getScaledSize()[0] / 2;
            var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
            if (print_a) {
                top = print_a.top;
                left = print_a.left;
            }
            tempImg.src = imgData;
            tempImg.onload = function () {    
                var image = new fabric.Image(tempImg, {
                    objectType: 'image',
                    objectCaching: true,
                    roundedCorders: 0,
                    stroke: '#fff', 
                    strokeWidth: 0,
                    top: top,
                    left: left,
                    originX: 'center',
                    originY: 'center'
                });
                image.set({
                    ogWidth: image.get('width'),
                    ogHeight: image.get('height'),
                });
                canvas.add(image);
                if (print_a) {
                    image.scaleToWidth((print_a.width * 0.8) * canvas.getZoom());
                    if(!image.isContainedWithinObject(print_a)) {
                        image.scaleToHeight((print_a.height * 0.8) * canvas.getZoom());
                    }
                } else {
                    image.scaleToWidth(getScaledSize()[0] / 4);
                    if (image.isPartiallyOnScreen()) {
                        image.scaleToHeight(getScaledSize()[1] / 4);
                    }
                }
                canvas.setActiveObject(image);
                canvas.requestRenderAll();
                selector.find('#palleon-canvas-loader').hide();
                canvas.fire('palleon:history', { type: 'image', text: palleonParams.added });
            };
        });

        /* LOAD APP FIELDS */

        var colorbrewer = {};
        var brandsArray = '';

        selector.find('#palleon-btn-apps').one('click', function () {
            colorbrewer = {
                YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
                YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
                GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
                BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
                PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
                PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
                BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
                RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
                PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
                OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
                YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
                YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
                Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
                Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
                Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
                Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
                Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
                Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
                PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
                BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
                PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
                PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
                RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
                RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
                RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
                Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
                RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837']
            }
    
            var colorbrewerOutput = '<div class="palleon-colorbrewer-item random active" data-id="random"><span class="material-icons">shuffle</span></div>';
    
            $.each(colorbrewer, function( index, val ) {
                colorbrewerOutput += '<div class="palleon-colorbrewer-item" data-id="' + index + '">';
                for (var i = 0; i < val.length; i++) { 
                    colorbrewerOutput += '<div style="background: ' + val[i] + ';"></div>';  
                }
                colorbrewerOutput += '</div>';
            });
    
            selector.find('#palleon-colorbrewer').html(colorbrewerOutput);

            // Brands
            $.getJSON(settings.baseURL + 'json/brands.json', function(brands) {
                brandsArray = brands;
                for (var i = 0; i < brands.length; i++) {   
                    if (brands[i].id == 'envato') {
                        selector.find('#palleon-brands-list').append($('<option></option>').attr("value", brands[i].id).attr("selected", 'selected').text(brands[i].title));
                    } else {
                        selector.find('#palleon-brands-list').append($('<option></option>').attr("value", brands[i].id).text(brands[i].title));
                    }
                }
                selector.find('#palleon-brands-list').trigger('change');
            });

            // Crypto
            $.getJSON(settings.baseURL + 'json/crypto.json', function(cryptos) {
                for (var i = 0; i < cryptos.length; i++) {   
                    if (cryptos[i].symbol == 'BTC') {
                        selector.find('#palleon-crypto-list').append($('<option></option>').attr("value", cryptos[i].symbol).attr("selected", 'selected').text(cryptos[i].name));
                    } else {
                        selector.find('#palleon-crypto-list').append($('<option></option>').attr("value", cryptos[i].symbol).text(cryptos[i].name));
                    }
                }  
                selector.find('#palleon-crypto-list').trigger('change');
            });

            // Flags
            $.getJSON(settings.baseURL + 'json/countries.json', function(countries) {
                for (var i = 0; i < countries.length; i++) {      
                    selector.find('#palleon-flags-list').append($('<option></option>').attr("value", countries[i].code).text(countries[i].name));
                }  
                selector.find('#palleon-flags-list').trigger('change');
            });
        });

        /* TRIANGLIFY */

        function triangleArt(width, height, cellSize, variance, xColors) {
            const trianglify = window.trianglify;
            var pattern = trianglify({
                width: width,
                height: height,
                cellSize: cellSize,
                variance: variance,
                xColors: xColors,
                yColors: 'match',
                fill: true
            }).toCanvas();
            pattern = pattern.toDataURL({ format: 'png', enableRetinaScaling: false});
            selector.find('#palleon-trianglify-preview').html('<img src="' + pattern + '" />');
        }

        selector.find('#palleon-apps-menu-trianglify').one('click', function () {
            triangleArt(1440, 900, 75, 0.5, 'random');
        });

        selector.find('#palleon-trianglify-app').on('click','.palleon-colorbrewer-item',function(){
            if ($(this).hasClass('active')) {
                if ($(this).hasClass('random')) {
                    var width = parseInt(selector.find('#palleon-trianglify-width').val());
                    var height = parseInt(selector.find('#palleon-trianglify-height').val());
                    var cellSize = selector.find('#palleon-trianglify-cell-size').val();
                    var variance = selector.find('#palleon-trianglify-variance').val();
                    triangleArt(width, height, cellSize, variance, 'random');
                } else {
                    return;
                }
            } else {
                selector.find('.palleon-colorbrewer-item').removeClass('active');
                $(this).addClass('active');
                var width = parseInt(selector.find('#palleon-trianglify-width').val());
                var height = parseInt(selector.find('#palleon-trianglify-height').val());
                var cellSize = selector.find('#palleon-trianglify-cell-size').val();
                var variance = selector.find('#palleon-trianglify-variance').val();
                triangleArt(width, height, cellSize, variance, $(this).attr('data-id'));
            }
        });

        selector.find('#palleon-trianglify-width').on('change', function () {
            var width = parseInt($(this).val());
            var height = parseInt(selector.find('#palleon-trianglify-height').val());
            var cellSize = selector.find('#palleon-trianglify-cell-size').val();
            var variance = selector.find('#palleon-trianglify-variance').val();
            var xColors = selector.find('.palleon-colorbrewer-item.active').attr('data-id');
            triangleArt(width, height, cellSize, variance, xColors);
        });

        selector.find('#palleon-trianglify-height').on('change', function () {
            var height = parseInt($(this).val());
            var width = parseInt(selector.find('#palleon-trianglify-width').val());
            var cellSize = selector.find('#palleon-trianglify-cell-size').val();
            var variance = selector.find('#palleon-trianglify-variance').val();
            var xColors = selector.find('.palleon-colorbrewer-item.active').attr('data-id');
            triangleArt(width, height, cellSize, variance, xColors);
        });

        selector.find('#palleon-trianglify-cell-size').on('change', function () {
            var height = parseInt(selector.find('#palleon-trianglify-height').val());
            var width = parseInt(selector.find('#palleon-trianglify-width').val());
            var cellSize = $(this).val();
            var variance = selector.find('#palleon-trianglify-variance').val();
            var xColors = selector.find('.palleon-colorbrewer-item.active').attr('data-id');
            triangleArt(width, height, cellSize, variance, xColors);
        });

        selector.find('#palleon-trianglify-variance').on('change', function () {
            var height = parseInt(selector.find('#palleon-trianglify-height').val());
            var width = parseInt(selector.find('#palleon-trianglify-width').val());
            var cellSize = selector.find('#palleon-trianglify-cell-size').val();
            var variance = $(this).val();
            var xColors = selector.find('.palleon-colorbrewer-item.active').attr('data-id');
            triangleArt(width, height, cellSize, variance, xColors);
        });

        /* BRANDS */

        selector.find('#palleon-brands-list').on('change', function () {
            var val = $(this).val();
            for (var i = 0; i < brandsArray.length; i++) {   
                if (brandsArray[i].id == val) {
                    var url = 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/' + brandsArray[i].id + '.svg';
                    $.get(url, function(data) {
                        var svg = $(data).find('svg');
                        svg.removeAttr('xmlns:a');
                        selector.find('#palleon-brands-preview > *').replaceWith(svg);
                        selector.find('#palleon-brands-preview').html(selector.find('#palleon-brands-preview').html().replace(/^.{4}/g, '<svg fill="#' + brandsArray[i].hex + '"'));
                    }, 'xml');
                    return;
                }
            } 
        });

        /* CRYPTO */

        selector.find('#palleon-crypto-list').on('change', function () {
            var val = $(this).val().toLowerCase();
            var url = settings.baseURL + 'files/crypto/' + val + '.svg';
            $.get(url, function(data) {
                var svg = $(data).find('svg');
                svg.removeAttr('xmlns:a');
                selector.find('#palleon-crypto-preview > *').replaceWith(svg);
            }, 'xml');
        });

        /* FLAGS */

        selector.find('#palleon-flags-style').on('change', function () {
            var style = $(this).val();
            var val = selector.find('#palleon-flags-list').val().toLowerCase();
            var url = settings.baseURL + 'files/flags/' + style + '/' + val + '.svg';
            $.get(url, function(data) {
                var svg = $(data).find('svg');
                svg.removeAttr('xmlns:a');
                selector.find('#palleon-flags-preview > *').replaceWith(svg);
            }, 'xml');
        });
        
        selector.find('#palleon-flags-list').on('change', function () {
            var val = $(this).val().toLowerCase();
            var style = selector.find('#palleon-flags-style').val();
            var url = settings.baseURL + 'files/flags/' + style + '/' + val + '.svg';
            $.get(url, function(data) {
                var svg = $(data).find('svg');
                svg.removeAttr('xmlns:a');
                selector.find('#palleon-flags-preview > *').replaceWith(svg);
            }, 'xml');
        });

        /* MULTIAVATAR */

        selector.find('#palleon-generate-multiavatar').on('click', function () {
            var avatarId = new Date().getTime();
            var svgCode = multiavatar(avatarId);
            selector.find('#palleon-multiavatar-name').val(avatarId);
            selector.find('#palleon-multiavatar-preview').html(svgCode);
        });

        selector.find('#palleon-apps-menu-multiavatar').on('click', function () {
            selector.find('#palleon-generate-multiavatar').trigger('click');
        });

        selector.find('#palleon-multiavatar-name').on('input paste', function () {
            var avatarId = 'John Doe';
            if ($(this).val().length !== 0) {
                avatarId = $(this).val();
            } else {
                $(this).val(avatarId);
            }
            var svgCode = multiavatar(avatarId);
            selector.find('#palleon-multiavatar-preview').html(svgCode);
        });

        /* QR CODE */ 

        function qrcodePreview(){
            var qrcode = kjua({
                text: selector.find('#palleon-qrcode-text').val(),
                render: 'svg',
                size: 300,
                fill: selector.find('#palleon-qrcode-fill').val(),
                back: selector.find('#palleon-qrcode-back').val(),
                rounded: selector.find('#palleon-qrcode-rounded').val(),
                mode: 'label', // modes: 'plain', 'label' or 'image'
                label: selector.find('#palleon-qrcode-label').val(),
                fontname: 'sans',
                fontcolor: selector.find('#palleon-qrcode-label-color').val(),
                mSize: selector.find('#palleon-qrcode-label-size').val(),
                mPosX: selector.find('#palleon-qrcode-label-position-x').val(),
                mPosY: selector.find('#palleon-qrcode-label-position-y').val(),
            });
            return qrcode;
        }

        selector.find('#palleon-generate-qr-code').on('click', function () {
            var qrcode = kjua({
                text: selector.find('#palleon-qrcode-text').val(),
                render: 'svg',
                size: 300,
                fill: selector.find('#palleon-qrcode-fill').val(),
                back: selector.find('#palleon-qrcode-back').val(),
                rounded: selector.find('#palleon-qrcode-rounded').val(),
                mode: 'label', // modes: 'plain', 'label' or 'image'
                label: selector.find('#palleon-qrcode-label').val(),
                fontname: 'sans',
                fontcolor: selector.find('#palleon-qrcode-label-color').val(),
                mSize: selector.find('#palleon-qrcode-label-size').val(),
                mPosX: selector.find('#palleon-qrcode-label-position-x').val(),
                mPosY: selector.find('#palleon-qrcode-label-position-y').val(),
            });

            var top = getScaledSize()[1] / 2;
            var left = getScaledSize()[0] / 2;
            var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
            if (print_a) {
                top = print_a.top;
                left = print_a.left;
            }
            var serializer = new XMLSerializer();
            var svgStr = serializer.serializeToString(qrcode);
            fabric.loadSVGFromString(svgStr,function(objects, options) {
                var svg = fabric.util.groupSVGElements(objects, options);
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', left);
                svg.set('top', top);
                svg.set('objectType', 'app');
                svg.set('gradientFill', 'none');
                svg.controls = {
                    ...fabric.Rect.prototype.controls,
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false })
                };
                canvas.add(svg);
                if (print_a) {
                    svg.scaleToWidth((print_a.width * 0.5) * canvas.getZoom());
                    if(!svg.isContainedWithinObject(print_a)) {
                        svg.scaleToHeight((print_a.height * 0.5) * canvas.getZoom());
                    }
                } else {
                    svg.scaleToWidth(getScaledSize()[0] / 8);
                    if (svg.isPartiallyOnScreen()) {
                        svg.scaleToHeight(getScaledSize()[1] / 8);
                    }
                }
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
            });
        });

        selector.find('#palleon-apps-menu-qrcode').one('click', function () {
            selector.find('#qrcode-preview').html(qrcodePreview());
        });

        selector.find('#palleon-qrcode-settings input[type="text"]').on("input", function () {
            var qrcode = qrcodePreview();
            selector.find('#qrcode-preview').html(qrcode);
        });

        selector.find('#palleon-qrcode-settings .palleon-colorpicker').bind('change', function() {
            var qrcode = qrcodePreview();
            selector.find('#qrcode-preview').html(qrcode);
        });

        selector.find('#palleon-qrcode-settings input[type=range]').bind('input click', function() {
            var qrcode = qrcodePreview();
            selector.find('#qrcode-preview').html(qrcode);
        });

        /* BARCODE */

        function barcodePreview(){
            var showText = false;
            var fontOptions = '';
            if (selector.find('#palleon-barcode-show-text').is(':checked')) {
                showText = true;
            }
            if (selector.find('#palleon-barcode-text-bold').hasClass('active')) {
                fontOptions += 'bold';
            }
            if (selector.find('#palleon-barcode-text-italic').hasClass('active')) {
                fontOptions += ' italic';
            }
            JsBarcode("#palleon-barcode-preview", selector.find('#palleon-barcode-text').val(), {
                format: selector.find('#palleon-barcode-format').val(),
                width: parseInt(selector.find('#palleon-barcode-bar-width').val()),
                height: parseInt(selector.find('#palleon-barcode-height').val()),
                displayValue: showText,
                fontOptions: fontOptions,
                font: selector.find('#palleon-barcode-font-family').val(),
                textAlign: $('#palleon-barcode-text-options').find('.format-align.active').data('align'),
                textMargin: parseInt(selector.find('#palleon-barcode-text-margin').val()),
                fontSize: parseInt(selector.find('#palleon-barcode-font-size').val()),
                background: selector.find('#palleon-barcode-back').val(),
                lineColor: selector.find('#palleon-barcode-line').val(),
                margin: parseInt(selector.find('#palleon-barcode-margin').val()),
                valid: function(valid){
                    if(valid){
                        $("#palleon-barcode-wrap").show();
                        $("#palleon-barcode-notice").addClass('d-none');
                        selector.find("#palleon-generate-barcode").prop('disabled', false);
                    }
                    else{
                        $("#palleon-barcode-wrap").hide();
                        $("#palleon-barcode-notice").removeClass('d-none');
                        selector.find("#palleon-generate-barcode").prop('disabled', true);
                    }
                }
            });
        }

        selector.find('#palleon-generate-barcode').on('click', function () {
            var barcode = document.getElementById('palleon-barcode-preview');
            var top = getScaledSize()[1] / 2;
            var left = getScaledSize()[0] / 2;
            var print_a = canvas.getObjects().filter(element => element.objectType == 'printarea')[0];
            if (print_a) {
                top = print_a.top;
                left = print_a.left;
            }
            var serializer = new XMLSerializer();
            var svgStr = serializer.serializeToString(barcode);
            fabric.loadSVGFromString(svgStr,function(objects, options) {
                var svg = fabric.util.groupSVGElements(objects, options);
                svg.set('originX', 'center');
                svg.set('originY', 'center');
                svg.set('left', left);
                svg.set('top', top);
                svg.set('objectType', 'app');
                svg.set('gradientFill', 'none');
                svg.controls = {
                    ...fabric.Rect.prototype.controls,
                    ml: new fabric.Control({ visible: false }),
                    mb: new fabric.Control({ visible: false }),
                    mr: new fabric.Control({ visible: false }),
                    mt: new fabric.Control({ visible: false })
                };
                canvas.add(svg);
                if (print_a) {
                    svg.scaleToWidth((print_a.width * 0.5) * canvas.getZoom());
                    if(!svg.isContainedWithinObject(print_a)) {
                        svg.scaleToHeight((print_a.height * 0.5) * canvas.getZoom());
                    }
                } else {
                    svg.scaleToWidth(getScaledSize()[0] / 4);
                    if (svg.isPartiallyOnScreen()) {
                        svg.scaleToHeight(getScaledSize()[1] / 4);
                    }
                }
                canvas.setActiveObject(svg);
                canvas.requestRenderAll();
            });
        });

        selector.find('#palleon-apps-menu-barcode').one('click', function () {
            selector.find('#barcode-preview').html(barcodePreview());
        });
        
        selector.find('#palleon-barcode-settings input[type="text"]').on("input", function () {
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings .palleon-colorpicker').bind('change', function() {
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings input[type=range]').bind('input click', function() {
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings .format-style').on("click", function () {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            } else {
                $(this).addClass('active');
            }
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings .format-align').on("click", function () {
            if (!$(this).hasClass('active')) {
                selector.find('#palleon-barcode-settings .format-align').removeClass('active');
                $(this).addClass('active');
            }
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings .palleon-select').bind('change', function() {
            if ($(this).attr('id') == 'palleon-barcode-format') {
                var defaultValues = {
                    CODE128 : "Example 1234",
                    CODE128A : "EXAMPLE",
                    CODE128B : "Example text",
                    CODE128C : "12345678",
                    EAN13 : "1234567890128",
                    EAN8 : "12345670",
                    UPC : "123456789999",
                    CODE39 : "EXAMPLE TEXT",
                    ITF14 : "10012345000017",
                    ITF : "123456",
                    MSI : "123456",
                    MSI10 : "123456",
                    MSI11 : "123456",
                    MSI1010 : "123456",
                    MSI1110 : "123456",
                    pharmacode : "1234"
                };
                selector.find("#palleon-barcode-text").val( defaultValues[$(this).val()] );
            }
            barcodePreview();
        });

        selector.find('#palleon-barcode-settings .palleon-toggle-checkbox').bind('change', function() {
            barcodePreview();
        });

        /* BRUSHES */

        /* Draw Cursor */
        function drawCursor(brushSize, brushColor){
            $('#tm-cursor-1').remove();
            selector.find('#palleon-canvas-wrap').tmpointer({
                id: 1,
                native_cursor: 'enable',
                cursorSize: brushSize,
                cursorColor: brushColor
            });
        }

        // Draw Mode Button
        selector.find('#palleon-draw-btn').on('click', function () {
            if ($(this).hasClass('active')) {
                selector.find("#palleon-draw-undo").prop('disabled', true);
                selector.find("#palleon-draw-undo").removeClass('active');
                $('#tm-cursor-1').remove();
                selector.find('#palleon-draw-settings').hide();
                selector.find('#palleon-top-bar, #palleon-right-col, #palleon-icon-menu, #palleon-toggle-left, #palleon-toggle-right, .palleon-content-bar').css('pointer-events', 'auto');
                $(this).removeClass('active');
                canvas.isDrawingMode = false;
                $(this).html('<span class="material-icons">edit</span>' + palleonParams.startDrawing);
            } else {
                selector.find("#palleon-draw-undo").prop('disabled', false);
                selector.find('#palleon-draw-settings').show();
                selector.find('#palleon-top-bar, #palleon-right-col, #palleon-icon-menu, #palleon-toggle-left, #palleon-toggle-right, .palleon-content-bar').css('pointer-events', 'none');
                $(this).addClass('active');
                selector.find('#palleon-brush-select').trigger('change');
                canvas.isDrawingMode = true;
                $(this).html('<span class="material-icons">close</span>' + palleonParams.stopDrawing);
            }
        });

        // Brush Type Select
        selector.find('#palleon-brush-select').on('change', function () {
            var val = $(this).val();
            if (val == 'erase') {
                $('#palleon-brush-tip').hide();
                $('#palleon-eraser-tip').show();
            } else {
                $('#palleon-brush-tip').show();
                $('#palleon-eraser-tip').hide();
            }
            if (val == 'pencil') {
                var pencilBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush = pencilBrush;
            } else if (val == 'circle') {
                var circleBrush = new fabric.CircleBrush(canvas);
                canvas.freeDrawingBrush = circleBrush;
            } else if (val == 'spray') {
                var sprayBrush = new fabric.SprayBrush(canvas);
                canvas.freeDrawingBrush = sprayBrush;
            } else if (val == 'hline') {
                var hlineBrush = new fabric.PatternBrush(canvas);
                canvas.freeDrawingBrush = hlineBrush;
                hlineBrush.getPatternSrc = function() {
                    var patternWidth = parseInt(selector.find('#brush-pattern-width').val());
                    var patternWidth2 = patternWidth / 2;
                    var patternCanvas = fabric.document.createElement('canvas');
                    patternCanvas.width = patternCanvas.height = patternWidth;
                    var ctx = patternCanvas.getContext('2d');
                    ctx.strokeStyle = selector.find('#brush-color').val();
                    ctx.lineWidth = patternWidth2;
                    ctx.beginPath();
                    ctx.moveTo(patternWidth2, 0);
                    ctx.lineTo(patternWidth2, patternWidth);
                    ctx.closePath();
                    ctx.stroke();
                    return patternCanvas;
                };
            } else if (val == 'vline') {
                var vlineBrush = new fabric.PatternBrush(canvas);
                canvas.freeDrawingBrush = vlineBrush;
                vlineBrush.getPatternSrc = function() {
                    var patternWidth = parseInt(selector.find('#brush-pattern-width').val());
                    var patternWidth2 = patternWidth / 2;
                    var patternCanvas = fabric.document.createElement('canvas');
                    patternCanvas.width = patternCanvas.height = patternWidth;
                    var ctx = patternCanvas.getContext('2d');
                    ctx.strokeStyle = selector.find('#brush-color').val();
                    ctx.lineWidth = patternWidth2;
                    ctx.beginPath();
                    ctx.moveTo(0, patternWidth2);
                    ctx.lineTo(patternWidth, patternWidth2);
                    ctx.closePath();
                    ctx.stroke();
                    return patternCanvas;
                };
            } else if (val == 'square') {
                var squareBrush = new fabric.PatternBrush(canvas);
                canvas.freeDrawingBrush = squareBrush;
                squareBrush.getPatternSrc = function() {
                    var squareWidth = parseInt(selector.find('#brush-pattern-width').val()), squareDistance = parseInt(selector.find('#brush-pattern-distance').val());
                    var patternCanvas = fabric.document.createElement('canvas');
                    patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
                    var ctx = patternCanvas.getContext('2d');
                    ctx.fillStyle = selector.find('#brush-color').val();
                    ctx.fillRect(0, 0, squareWidth, squareWidth);
                    return patternCanvas;
                };
            } else if (val == 'erase') {
                var eraseBrush = new fabric.EraserBrush(canvas);
                canvas.freeDrawingBrush = eraseBrush;
            }
            brush = canvas.freeDrawingBrush;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
            brush.width = parseInt(selector.find('#brush-width').val());
            if (val == 'erase') {
                selector.find('#not-erase-brush').hide();
                brush.shadow = null;
                brush.color = '#E91E63';
            } else {
                canvas.freeDrawingBrush.inverted = false;
                selector.find("#palleon-draw-undo").removeClass('active');
                selector.find('#not-erase-brush').show();
                brush.color = selector.find('#brush-color').val();
            }
            if (selector.find('#palleon-brush-shadow').is(":checked")) {
                brush.shadow = brushShadow;
            } else {
                brush.shadow = null;
            }
            drawCursor(brush.width * canvas.getZoom(), brush.color);

            if (val == 'hline' || val == 'vline' || val == 'square') {
                selector.find('#palleon-brush-pattern-width').css('display', 'flex');
            } else {
                selector.find('#palleon-brush-pattern-width').css('display', 'none');
            }

            if (val == 'square') {
                selector.find('#palleon-brush-pattern-distance').css('display', 'flex');
            } else {
                selector.find('#palleon-brush-pattern-distance').css('display', 'none');
            }
        });

        /* Draw Shadow */
        selector.find('#palleon-brush-shadow').on("change", function () {
            brushShadow = new fabric.Shadow({
                color: selector.find('#brush-shadow-color').val(),
                blur: selector.find('#brush-shadow-width').val(),
                offsetX: selector.find('#brush-shadow-shadow-offset-x').val(),
                offsetY: selector.find('#brush-shadow-shadow-offset-y').val(),
            });
            if ($(this).is(":checked")) {
                brush.shadow = brushShadow;
            } else {
                brush.shadow = null;
            }
        });

        /* Draw Numeric Fields */
        selector.find('#palleon-draw-settings input[type=number]').bind('input paste keyup keydown', function() {
            if ($(this).attr('id') == 'brush-width') {
                brush.width = parseInt($(this).val());
                drawCursor(brush.width * canvas.getZoom(), brush.color);
            } else if ($(this).attr('id') == 'brush-shadow-shadow-offset-x') {
                brushShadow.offsetX = parseInt($(this).val());
            } else if ($(this).attr('id') == 'brush-shadow-shadow-offset-y') {
                brushShadow.offsetY = parseInt($(this).val());
            } else if ($(this).attr('id') == 'brush-shadow-width') {
                brushShadow.blur = parseInt($(this).val());
            } else if ($(this).attr('id') == 'brush-pattern-width') {
                selector.find('#palleon-brush-select').trigger('change');
            } else if ($(this).attr('id') == 'brush-pattern-distance') {
                selector.find('#palleon-brush-select').trigger('change');
            }
        });

        /* Draw Color Fields */
        selector.find('#palleon-draw-settings .palleon-colorpicker').bind('change', function() {
            if ($(this).attr('id') == 'brush-color') {
                brush.color = $(this).val();
                drawCursor(brush.width * canvas.getZoom(), brush.color);
                selector.find('#palleon-brush-select').trigger('change');
            } else if ($(this).attr('id') == 'brush-shadow-color') {
                brushShadow.color = $(this).val();
            }
        });

        /* Undo Draw */
        selector.find("#palleon-draw-undo").on("click", function () {
            if (selector.find('#palleon-brush-select').val() == 'erase') {
                if (canvas.backgroundImage) {
                    if ($(this).hasClass('active')) {
                        $(this).removeClass('active');
                        canvas.freeDrawingBrush.inverted = false;
                    } else {
                        $(this).addClass('active');
                        canvas.freeDrawingBrush.inverted = true;
                    }
                }
            } else {
                var objects = canvas.getObjects();
                var drawings = objects.filter(element => element.objectType == 'drawing');
                var lastElement = drawings.slice(-1)[0];
                canvas.remove(lastElement);
                canvas.requestRenderAll();
            }
        });

        /* KEYBOARD EVENTS */

        document.onkeydown = function(e) {
            var item = canvas.getActiveObject();
            switch (e.keyCode) {
              case 38:  /* Up arrow */
                  if(item){
                    item.top -= 1;
                    canvas.requestRenderAll();
                  }
                break;
              case 40:  /* Down arrow  */
                  if(item){
                    item.top += 1;
                    canvas.requestRenderAll();
                  }
                break;
              case 37:  /* Left arrow  */
                  if(item){
                    item.left -= 1; 
                    canvas.requestRenderAll();
                  }
                break;
              case 39:  /* Right arrow  */
                  if(item){
                    item.left += 1; 
                    canvas.requestRenderAll();
                  }
                break;
            }
        }

        /* FAVORITES */ 

        function arrayRemove(arr, value) {
            return arr.filter(function (item) {
                return item != value;
            });  
        }

        /* Frames - User Favorites */
        function populateFramesFavs() {
            if (localStorage.getItem('palleon-user-frames')) {
                var userfavs = JSON.parse(localStorage.getItem("palleon-user-frames"));
                var userfavcount = userfavs.length;
                var userfavoutput = '';
                $.each(userfavs, function( index, val ) {
                    selector.find("[data-frameid='" + val + "']").addClass('favorited');
                    selector.find("[data-frameid='" + val + "']").find('.material-icons').html('star');
                    userfavoutput += '<div class="palleon-frame" data-elsource="' + val + '.svg"><div class="palleon-img-wrap" style="min-height: auto;"><img class="lazy" data-src="' + val + '.jpg" src="' + val + '.jpg"></div><div class="frame-favorite"><button type="button" class="palleon-btn-simple star favorited" data-frameid="' + val + '"><span class="material-icons">star</span></button></div></div>';
                });
                selector.find('#palleon-frames-favorites').html(userfavoutput);
                selector.find('#frames-favorites-count').html(userfavcount);
                lazyLoadInstance.update();
            } else {
                selector.find('#palleon-frames-favorites').html('<div class="notice notice-info"><h6>' + palleonParams.nofavorites + '</h6>' + palleonParams.nofavoritesdesc + '</div>');
                selector.find('#frames-favorites-count').html('0');
            }
        }
        populateFramesFavs();

        selector.find('.palleon-frames-grid').on('click','.frame-favorite button.star',function(){
            var button = $(this);
            var frameid = button.data('frameid');
            if (button.hasClass('favorited')) {
                if(localStorage.getItem('palleon-user-frames')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-frames"));
                    var favorites = arrayRemove(array, frameid);
                    if (favorites.length === 0) {
                        localStorage.removeItem('palleon-user-frames');
                    } else {
                        localStorage.setItem("palleon-user-frames", JSON.stringify(favorites));
                    }
                }
                button.removeClass('favorited');
                button.find('.material-icons').html('star_border');
                toastr.success(palleonParams.unfavorited, palleonParams.success);
            } else {
                if(localStorage.getItem('palleon-user-frames')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-frames"));
                    array.push(frameid);
                    localStorage.setItem("palleon-user-frames", JSON.stringify(array));
                } else {
                    var favs = [];
                    favs[0] = frameid;
                    localStorage.setItem("palleon-user-frames", JSON.stringify(favs));
                }
                button.addClass('favorited');
                button.find('.material-icons').html('star');
                toastr.success(palleonParams.favorited, palleonParams.success);    
            }
            populateFramesFavs();
        });

        /* Elements - User Favorites */
        function populateElementsFavs() {
            if (localStorage.getItem('palleon-user-elements')) {
                var userfavs = JSON.parse(localStorage.getItem("palleon-user-elements"));
                var userfavcount = userfavs.length;
                var userfavoutput = '';
                $.each(userfavs, function( index, val ) {
                    selector.find("[data-elementid='" + val + "']").addClass('favorited');
                    selector.find("[data-elementid='" + val + "']").find('.material-icons').html('star');
                    userfavoutput += '<div class="palleon-element" data-elsource="' + val + '.svg" data-loader="no"><img class="lazy" data-src="' + val + '.svg" /><div class="element-favorite"><button type="button" class="palleon-btn-simple star favorited" data-elementid="' + val + '"><span class="material-icons">star</span></button></div></div>';
                });
                selector.find('#palleon-elements-favorites').html(userfavoutput);
                selector.find('#elements-favorites-count').html(userfavcount);
                lazyLoadInstance.update();
            } else {
                selector.find('#palleon-elements-favorites').html('<div class="notice notice-info"><h6>' + palleonParams.nofavorites + '</h6>' + palleonParams.nofavoritesdesc + '</div>');
                selector.find('#elements-favorites-count').html('0');
            }
        }
        populateElementsFavs();

        selector.find('.palleon-elements-grid').on('click','.element-favorite button.star',function(){
            var button = $(this);
            var elementid = button.data('elementid');
            if (button.hasClass('favorited')) {
                if(localStorage.getItem('palleon-user-elements')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-elements"));
                    var favorites = arrayRemove(array, elementid);
                    if (favorites.length === 0) {
                        localStorage.removeItem('palleon-user-elements');
                    } else {
                        localStorage.setItem("palleon-user-elements", JSON.stringify(favorites));
                    }
                }
                button.removeClass('favorited');
                button.find('.material-icons').html('star_border');
                toastr.success(palleonParams.unfavorited, palleonParams.success);
            } else {
                if(localStorage.getItem('palleon-user-elements')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-elements"));
                    array.push(elementid);
                    localStorage.setItem("palleon-user-elements", JSON.stringify(array));
                } else {
                    var favs = [];
                    favs[0] = elementid;
                    localStorage.setItem("palleon-user-elements", JSON.stringify(favs));
                }
                button.addClass('favorited');
                button.find('.material-icons').html('star');
                toastr.success(palleonParams.favorited, palleonParams.success);    
            }
            populateElementsFavs();
        });

        /* Templates - User Favorites */
        function populateTemplatesFavs() {
            if (localStorage.getItem('palleon-user-templates')) {
                var userfavs = JSON.parse(localStorage.getItem("palleon-user-templates"));
                var userfavoutput = '';
                $.each(userfavs, function( index, val ) {
                    selector.find("[data-templateid='" + val + "']").addClass('favorited');
                    selector.find("[data-templateid='" + val + "']").find('.material-icons').html('star');
                    userfavoutput += '<div class="grid-item" data-keyword="" data-category=""><div class="template-favorite"><button type="button" class="palleon-btn-simple star" data-templateid="' + val + '"><span class="material-icons">star</span></button></div><div class="palleon-masonry-item-inner palleon-select-template" data-json="files/templates/json/' + val + '.json"><div class="palleon-img-wrap"><div class="palleon-img-loader"></div><img class="lazy" data-src="files/templates/img/' + val + '.jpg" /></div></div></div>';
                });
                selector.find('#templates-favorites').html(userfavoutput);
                lazyLoadInstance.update();
            } else {
                selector.find('#templates-favorites').html('<div class="notice notice-info"><h6>' + palleonParams.nofavorites + '</h6>' + palleonParams.nofavoritesdesc + '</div>');
            }
        }
        populateTemplatesFavs();

        selector.find('.template-grid').on('click','.template-favorite button.star',function(){
            var button = $(this);
            var templateid = button.data('templateid');
            if (button.hasClass('favorited')) {
                if(localStorage.getItem('palleon-user-templates')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-templates"));
                    var favorites = arrayRemove(array, templateid);
                    if (favorites.length === 0) {
                        localStorage.removeItem('palleon-user-templates');
                    } else {
                        localStorage.setItem("palleon-user-templates", JSON.stringify(favorites));
                    }
                }
                button.removeClass('favorited');
                button.find('.material-icons').html('star_border');
                toastr.success(palleonParams.unfavorited, palleonParams.success);
            } else {
                if(localStorage.getItem('palleon-user-templates')) {
                    var array = JSON.parse(localStorage.getItem("palleon-user-templates"));
                    array.push(templateid);
                    localStorage.setItem("palleon-user-templates", JSON.stringify(array));
                } else {
                    var favs = [];
                    favs[0] = templateid;
                    localStorage.setItem("palleon-user-templates", JSON.stringify(favs));
                }
                button.addClass('favorited');
                button.find('.material-icons').html('star');
                toastr.success(palleonParams.favorited, palleonParams.success);    
            }
            populateTemplatesFavs();
        });

        /* SETTINGS */ 

        // CSS Theme Select
        selector.find('#custom-theme').on('change', function() {
            var val = $(this).val();
            var link = settings.baseURL + 'css/' + val + '.css';
            $("#palleon-theme-link").attr('href', link);
            selector.removeClass('light-theme');
            selector.removeClass('dark-theme');
            selector.addClass(val + '-theme');
        });

        // Font Size
        selector.find("#custom-font-size").on("input", function () {
            $('html').css('font-size', $(this).val() + 'px');
        });

        // Image Background
        selector.find('#custom-image-background').on('change', function() {
            var val = $(this).val();
            selector.find('#palleon-canvas-color').spectrum("set", val);
            if (val == '') {
                canvas.backgroundColor = 'transparent';
                canvas.requestRenderAll();
            } else {
                canvas.backgroundColor = val;
                canvas.requestRenderAll();
            }
        });

        // Ruler guide color
        selector.find('#ruler-guide-color').on('change', function() {
            var val = $(this).val();
            if (val != '') {
                selector.find(".guide.h, .guide.v").css('border-color', val);
                initAligningGuidelines(canvas);
            }
        });

        // Ruler guide size
        selector.find("#ruler-guide-size").on("input", function () {
            var val = $(this).val();
            selector.find(".guide.h, .guide.v").css('border-width', val + 'px');
            initAligningGuidelines(canvas);
        });

        // Save preferences
        selector.find('#palleon-preferences-save').on('click', function() {
            var settings = {};
            var keys = [];
            var values = [];
            selector.find('#palleon-preferences .preference').each(function(index, value) {
                keys.push($(this).attr('id'));
                values.push($(this).val());
            });
            for (let i = 0; i < keys.length; i++) {
                settings[keys[i]] = values[i];
            }
            localStorage.setItem("palleon-user-settings", JSON.stringify(settings));
            toastr.success(palleonParams.settingsaved, palleonParams.success);
        });

        /* STORAGE */
        if (localStorage.getItem('palleon-user-settings')) {
            var userSettings = JSON.parse(localStorage.getItem('palleon-user-settings'));
            //Font Size
            selector.find('#custom-font-size').val(userSettings["custom-font-size"]);
            var fontwrapper = selector.find('#custom-font-size').parent().parent();
            fontwrapper.find('.slider-label span').html(userSettings["custom-font-size"]);
            selector.find('#custom-font-size').trigger('input');

            // Theme
            selector.find('#custom-theme').val(userSettings["custom-theme"]);
            $('body').removeClass('dark-theme');
            $('body').removeClass('light-theme');
            $('body').addClass(userSettings["custom-theme"] + '-theme');
            selector.find('#custom-theme').trigger('change');

            // Background
            selector.find('#custom-background').spectrum("set", userSettings["custom-background"]);
            selector.find('#custom-background').trigger('change');

            // Ruler
            selector.find('#ruler-guide-color').spectrum("set", userSettings["ruler-guide-color"]);
            selector.find('#ruler-guide-color').trigger('change');
            selector.find('#ruler-guide-size').val(userSettings["ruler-guide-size"]);
            var fontwrapper = selector.find('#ruler-guide-size').parent().parent();
            fontwrapper.find('.slider-label span').html(userSettings["ruler-guide-size"]);
            selector.find('#ruler-guide-size').trigger('input');
        }

        /* Init Aligning Guidelines */
        initAligningGuidelines(canvas);

        /* Resize Events */
        $(window).on('resize', function(){
            adjustZoom();
        });

        //////////////////////* CUSTOM FUNCTIONS *//////////////////////

        settings.customFunctions.call(this, selector, canvas, lazyLoadInstance);

    };

})(jQuery);