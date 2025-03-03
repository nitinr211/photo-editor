
(function($) {
    "use strict";

    $(document).ready(function () {
        $('#palleon').palleon({
            baseURL: "./", // The url of the main directory. For example; "http://www.mysite.com/palleon-js/"

            //////////////////////* API SETTINGS *//////////////////////

            PexelsApiKey: '', // Your Pexels API key. @see https://www.pexels.com/api/documentation/
            PexelsPagination: 20, // Max. number of images to show.
            PexelsLanguage: 'en-US', // The locale of the search you are performing. The current supported locales are: 'en-US' 'pt-BR' 'es-ES' 'ca-ES' 'de-DE' 'it-IT' 'fr-FR' 'sv-SE' 'id-ID' 'pl-PL' 'ja-JP' 'zh-TW' 'zh-CN' 'ko-KR' 'th-TH' 'nl-NL' 'hu-HU' 'vi-VN' 'cs-CZ' 'da-DK' 'fi-FI' 'uk-UA' 'el-GR' 'ro-RO' 'nb-NO' 'sk-SK' 'tr-TR' 'ru-RU'
            PexelsImgSize: 'large2x', // Valid image sizes are; original large2x large medium small portrait landscape
            PixabayApiKey: '', // Your Pixabay API key. @see https://pixabay.com/api/docs/
            PixabayPagination: 16, // Max. number of images to show.
            PixabayLanguage: 'en', // The locale of the search you are performing. Accepted values: cs, da, de, en, es, fr, id, it, hu, nl, no, pl, pt, ro, sk, fi, sv, tr, vi, th, bg, ru, el, ja, ko, zh
            PixabaySafeSearch: 'false', // A flag indicating that only images suitable for all ages should be returned. Accepted values: "true", "false".
            PixabayEditorsChice: 'false', // Select images that have received an Editor's Choice award. Accepted values: "true", "false".
            apiCaching: true, // Browser caching for API requests. Boolean value: true or false

            //////////////////////* CANVAS SETTINGS *//////////////////////

            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", // Should be a web safe font
            fontSize: 60, // Default font size
            fontWeight: 'normal', // e.g. bold, normal, 400, 600, 800
            fontStyle: 'normal', // Possible values: "", "normal", "italic" or "oblique".
            canvasColor: 'transparent', // Canvas background color
            fill: '#000', // Default text color
            stroke: '#fff', // Default stroke color
            strokeWidth: 0, // Default stroke width
            textBackgroundColor: 'rgba(255,255,255,0)', // Default text background color
            textAlign: 'left', // Possible values: "", "left", "center" or "right". 
            lineHeight: 1.2, // Default line height.
            borderColor: '#000', // Color of controlling borders of an object (when it's active).
            borderDashArray: [4, 4], // Array specifying dash pattern of an object's borders (hasBorder must be true).
            borderOpacityWhenMoving: 0.5, // Opacity of object's controlling borders when object is active and moving.
            borderScaleFactor: 2, // Scale factor of object's controlling borders bigger number will make a thicker border border is 1, so this is basically a border thickness since there is no way to change the border itself.
            editingBorderColor: 'rgba(0,0,0,0.5)', // Editing object border color.
            cornerColor: '#fff', // Color of controlling corners of an object (when it's active).
            cornerSize: 12, // Size of object's controlling corners (in pixels).
            cornerStrokeColor: '#000', // Color of controlling corners of an object (when it's active and transparentCorners false).
            cornerStyle: 'circle', // Specify style of control, 'rect' or 'circle'.
            transparentCorners: false, // When true, object's controlling corners are rendered as transparent inside (i.e. stroke instead of fill).
            cursorColor: '#000', // Cursor color (Free drawing)
            cursorWidth: 2, // Cursor width (Free drawing)
            enableGLFiltering: true, // set false if you experience issues on image filters.
            textureSize: 4096, // Required for enableGLFiltering
            watermark: false, // true or false
            watermarkText: 'https://palleon.website/', // The watermark text
            watermarkFontFamily: 'Georgia, serif', // Should be a web safe font
            watermarkFontStyle: 'normal', // Possible values: "", "normal", "italic" or "oblique".
            watermarkFontColor: '#000', // Watermark font color
            watermarkFontSize: 40, // Watermark font size (integer only)
            watermarkFontWeight: 'bold', // e.g. bold, normal, 400, 600, 800
            watermarkBackgroundColor: '#FFF', // Watermark background color
            watermarkLocation: 'bottom-right', // Possible values: "bottom-right", "bottom-left", "top-left" and "top-right".
            templatePreview: true, // true or false

            //////////////////////* CUSTOM FUNCTIONS *//////////////////////

            customFunctions: function(selector, canvas, lazyLoadInstance) {
                /**
                 * @see http://fabricjs.com/fabric-intro-part-1#canvas
                 * You may need to update "lazyLoadInstance" if you are going to populate items of a grid with ajax. 
                 * lazyLoadInstance.update();
                 * @see https://github.com/verlok/vanilla-lazyload
                 */

            }
        });
    });

})(jQuery);