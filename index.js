
;(function ( factory ) {
    "use strict";

    if ("function" === typeof define && define.amd) {
        define(["knockout", "jquery", "jqueryui"], factory);
    } else if ("undefined" !== typeof module) {
        factory(require("knockout"), require("jquery"), require("jquery-ui"));
    } else {
        factory(window.ko, window.jQuery);
        // TODO: check for jqueryui
    }
})(function ( ko, $ ){
    "use strict";

    if (!ko || !$) {
        throw new TypeError("ko-ui-autocomplete: missing dependencies")
    }

    if (!ko.isObservableArray) {
        ko.isObservableArray = function ( object ) {
            return ko.isObservable(object) && "function" === typeof object.push;
        };
    }

    $.widget("custom.ko_autocomplete", $.ui.autocomplete, {
        _create: function ( ) {
            var options, that = this;


            options = this.options = $.extend({
                source: [ ],
                template: "<span data-bind='text:value'></span>",
                selected: null,
                strict: false
            }, this.options);

            if (!ko.isObservable(this.options.selected)) {
                this.options.selected = ko.observable(this.options.selected);
            }

            if (!ko.isObservableArray(this.options.source)) {
                this.options._source = ko.observableArray(this.options.source);
            } else {
                this.options._source = this.options.source;
            }

            this.options.source = function ( request, response ) {
                var matcher = new RegExp((options.strict ? "^" : "") +
                    $.ui.autocomplete.escapeRegex(request.term));
                console.log(request.term)
                response(options._source().map(function ( item ) {
                    if ("object" !== typeof item) {
                        item = {
                            label: item,
                            value: item
                        };
                    }
                    if (!request.term || matcher.test(item.label)) {
                        return item;
                    }
                }).filter(Boolean));
            };

            this.options.select = function ( event, ui ) {
                options.selected(ui.item);
            };

            this.options.change = function ( event, ui ) {
            };

          //  this.options.messages = {
               // noResults: '',
               // results: function () {}
           // };

            this._super();

            $('.ui-helper-hidden-accessible').remove();

            this.template = $("<li>");
            this.template.append(this.options.template);
            this.template = this.template[0];
            new ko.templateSources
                .anonymousTemplate(this.template)
                .nodes(this.template);

            if (this.options.selected) {
                this.element.val(this.options.selected());
            }

            if (this.options.class) {
                this.element.addClass(this.options.class);
            }

            if (this.options.dropdown) {

                this.element.blur(function () {
                    that.last_query = null;
                });
                // add button
                this.element.after(this.button = $("<a>+</a>"));
                this.button.click(function () {
                    if (that.last_query === "") {
                        that.element.blur();
                        that.last_query = null;
                    } else {
                        that._search("");
                        that.element.focus();
                    }
                });
            }
        },
        _search: function ( string ) {
            this._super(string);
            this.last_query = string;
        },
        _renderItem: function ( ul, item ) {
            var $ul = $(ul), $li, ctx;

            $ul.append($li = $("<li>"));

            if (this.options.bindingContext) {
                ctx = this.options.bindingContext.createChildContext(
                    item, this.options.as);
                ko.renderTemplate(
                    this.template, ctx, { }, $li[0], "replaceChildren");
            } else {
                $li.append($(this.template).clone());
                ko.applyBindings(item, $li[0]);
            }
            return $li;
        }
    });

    ko.bindingHandlers.ui_autocomplete = {
        /**
         * initialize binding handler
         * @param {Element} element dom piece to use
         * @param {Object} options finetune controls
         * @param {Array<String>} options.source=[] available tags
         */
        "init": function (
            element,
            valueAccessor,
            allBindingAccessor,
            viewModel,
            bindingContext
        ) {
            var options = valueAccessor(), $input, api;
            options.bindingContext = bindingContext;

            $(element).empty().append($input = $("<input>"));
            api = $input.ko_autocomplete(options);

            if ("function" === typeof options.api) {
                options.api.call(this, element, api, options);
            }
        }
    };
});
