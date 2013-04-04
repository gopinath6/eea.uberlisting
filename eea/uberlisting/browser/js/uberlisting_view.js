/* readCookie and createCookie from Plone cookie_functions.js */ 
/*global window, jQuery */ 
/* Events
*/
window.Uberlisting = {};
window.Uberlisting.Events = {};

// success event which is triggered after the ajax load of the selected template
// useful if the page requires some extra js code to be called
// see our bind example below
window.Uberlisting.Events.Success = 'Success';

// Listing event which is called on page load for default template
// useful if you want to modify the listing on page load
window.Uberlisting.Events.Listing = 'Listing';

jQuery(document).ready(function($) {
    "use strict";
    var $uber_view_switch = $('#uber-view-switch');
    var faceted = $("#faceted-form").length;
    var selected_template = $("#selected-template").text();
    var $content = $("#content");
    var $uber_view_content = $('#uber-view-content');
    var events = window.Uberlisting.Events;
    var base_href = $('base').attr('href');
    var $events = $(events);
    var success_event = events.Success;
    var listing_event = events.Listing;
    // bind our success handler only if we have EEA object
    if (window.EEA) {
        $events.bind(success_event, function(evt) {
            var uberTemplate = $.bbq.getState('uberTemplate');
            if (uberTemplate === 'folder_tabs_view') {
                // run logic for tabs from eea-tabs.js
                window.EEA.eea_tabs();
                return;
            }
            if (uberTemplate === 'folder_accordion_view') {
                // run logic for tabs from eea-accordion.js
                window.EEA.eea_accordion();
                return;
            }
            if (uberTemplate === 'gallery_view') {
                $('#galleryView').eeaGalleryView();
            }
        });
    }

    $events.bind(listing_event, function(evt) {
        $content.find('.listingBar a').each(function(i) {
            var batchQueryString = $.param.querystring(this.href);
            var uberTemplate = $.bbq.getState('uberTemplate') || selected_template;
            this.href = $.param.querystring(uberTemplate, batchQueryString);
        }); 

        $content.delegate('.listingBar ', 'click', function(evt){
            var $target = $(evt.target);
            var target_href = $target.attr('href');
            $uber_view_content.html('<img src="ajax-loader.gif" />');
            evt.preventDefault();
            if (target_href) {
                $.get(target_href, function(data){
                    var $data = $(data).find('#content-core').html();
                    $uber_view_content.html($data);
                });
            }
        });
    });

    var markSelectedButton = function () {
        var uberTemplate = $.bbq.getState('uberTemplate') || selected_template;
        var $uber_view_switch = $("#uber-view-switch");
        $uber_view_switch.find('.selected').removeClass('selected');
        $uber_view_switch.find('a').each(function(i) {
            var $this = $(this);
            var templateID = $this.data().templateid;
            if (templateID === uberTemplate) {
                $this.addClass('selected');
            }
        });
    };

    var loadCookieSetttings =  function() {
        var cookie = window.readCookie('uberTemplate');
        if (cookie === selected_template) {
            cookie = undefined;
        }
        if ($.bbq.getState('uberTemplate') === undefined && cookie) {
            $.bbq.pushState({
                'uberTemplate': cookie 
            });
        }
    };

    var loadContent = function() {
        var $uber_view_content = $('#uber-view-content');
        var uberTemplate = $.bbq.getState('uberTemplate') || selected_template;
        $uber_view_content.html('<img src="ajax-loader.gif" />');
        var url = $.param.querystring(uberTemplate, $.param.querystring());
        url = base_href + '/' + url + '?ajax_load=1';
        $.get(url, function(data) {
            var $data = $(data).find('#content-core');
            $uber_view_content.html($data.html());
            $events.trigger(success_event);
        }, 'html');
    };

    $content.delegate('#uber-view-switch a', 'click', function(evt) {
        var uberTemplate = $(this).data().templateid;
        $.bbq.pushState({
            'uberTemplate': uberTemplate
        });
        window.createCookie('uberTemplate', uberTemplate);
        evt.preventDefault();
    });

    if (faceted) {
        $(window.Faceted.Events).bind('FACETED-AJAX-QUERY-SUCCESS', function(evt){
            var uber_view = $("#uber-view-content");
            if (uber_view.length) {
                markSelectedButton();
                $events.trigger(success_event);
            }
        });
    }

    if ($uber_view_switch.length) {
        $(window).bind('hashchange', function(e) {
            // If faceted navigation is enabled, we don't have to make our own
            // AJAX request.
            markSelectedButton();
            if (!faceted) {
                loadContent();
            }
        });
        loadCookieSetttings();
        markSelectedButton();
        $(events).trigger(listing_event);
    }

});
