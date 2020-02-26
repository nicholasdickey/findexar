webpackHotUpdate("static/development/pages/_app.js",{

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "../node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "../node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "../node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "../node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "../node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "../node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! regenerator-runtime/runtime */ "../node_modules/regenerator-runtime/runtime.js");
/* harmony import */ var regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "../node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react-redux */ "../node_modules/react-redux/es/index.js");
/* harmony import */ var next_app__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! next/app */ "../node_modules/next/app.js");
/* harmony import */ var next_app__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(next_app__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! next/head */ "../node_modules/next/dist/next-server/lib/head.js");
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var immutable__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! immutable */ "../node_modules/immutable/dist/immutable.es.js");
/* harmony import */ var _material_ui_styles__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @material-ui/styles */ "../node_modules/@material-ui/styles/esm/index.js");
/* harmony import */ var _material_ui_core_CssBaseline__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @material-ui/core/CssBaseline */ "../node_modules/@material-ui/core/esm/CssBaseline/index.js");
/* harmony import */ var next_redux_wrapper__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! next-redux-wrapper */ "../node_modules/next-redux-wrapper/es6/index.js");
/* harmony import */ var _lib_store__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../lib/store */ "../lib/store.js");
/* harmony import */ var _theme__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../theme */ "./theme.js");
/* harmony import */ var window_or_global__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! window-or-global */ "../node_modules/window-or-global/lib/index.js");
/* harmony import */ var window_or_global__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(window_or_global__WEBPACK_IMPORTED_MODULE_17__);






var __jsx = react__WEBPACK_IMPORTED_MODULE_7___default.a.createElement;
//import 'babel-polyfill';













var MyApp =
/*#__PURE__*/
function (_App) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__["default"])(MyApp, _App);

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(MyApp, null, [{
    key: "getInitialProps",
    value: function getInitialProps(_ref) {
      var Component, ctx, pageProps;
      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.async(function getInitialProps$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              Component = _ref.Component, ctx = _ref.ctx;
              pageProps = {};

              if (!Component.getInitialProps) {
                _context.next = 6;
                break;
              }

              _context.next = 5;
              return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.awrap(Component.getInitialProps(ctx));

            case 5:
              pageProps = _context.sent;

            case 6:
              if (ctx.req && ctx.req.session.passport) {
                pageProps.user = ctx.req.session.passport.user;
              }

              return _context.abrupt("return", {
                pageProps: pageProps
              });

            case 8:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }]);

  function MyApp(props) {
    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, MyApp);

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(MyApp).call(this, props));
    _this.state = {
      user: props.pageProps.user
    };
    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(MyApp, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // Remove the server-side injected CSS.
      var jssStyles = document.querySelector('#jss-server-side');

      if (jssStyles) {
        jssStyles.parentNode.removeChild(jssStyles);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          Component = _this$props.Component,
          pageProps = _this$props.pageProps,
          store = _this$props.store;
      var meta = store && store.getState() && store.getState().app && store.getState().app.get ? store.getState().app.get("meta") : null;
      if (meta) meta = meta.toJS();else meta = {};
      var session = store && store.getState() && store.getState().session && store.getState().session ? store && store.getState() && store.getState().session && store.getState().session.toJS() : {};
      var colorTheme = +(store && store.getState() && store.getState().session && store.getState().session.get ? store.getState().session.get("theme") : 0); //   console.log("RENDER APP:", { session, theme: colorTheme, meta, Root })

      if (window_or_global__WEBPACK_IMPORTED_MODULE_17___default.a.__CLIENT__) window_or_global__WEBPACK_IMPORTED_MODULE_17___default.a.store = store;
      var muiTheme = Object(_theme__WEBPACK_IMPORTED_MODULE_16__["default"])({
        mode: colorTheme
      }); //  console.log('APP post creted muitheme:', muiTheme)

      return __jsx("div", null, __jsx(next_head__WEBPACK_IMPORTED_MODULE_10___default.a, null, __jsx("link", {
        rel: "canonical",
        href: meta.canonical
      }), __jsx("meta", {
        property: "comment",
        content: "NOT FACEBOOK meta share"
      }), __jsx("meta", {
        property: "ua",
        content: meta.ua
      }), meta.image_width ? __jsx("meta", {
        property: "og:image:width",
        content: meta.image_width
      }) : null, meta.image_height ? __jsx("meta", {
        property: "og:image:height",
        content: meta.image_height
      }) : null, __jsx("meta", {
        property: "og:type",
        content: "website"
      }), __jsx("meta", {
        property: "og:title",
        content: meta.title
      }), __jsx("meta", {
        name: "description",
        content: meta.description ? meta.description : ''
      }), __jsx("meta", {
        property: "og:description",
        content: meta.description ? meta.description : ''
      }), __jsx("meta", {
        property: "og:site_name",
        content: meta.site_name
      }), __jsx("meta", {
        property: "og:url",
        content: meta.url
      }), __jsx("meta", {
        property: "og:image",
        content: meta.image
      }), __jsx("link", {
        rel: "shortcut icon",
        type: "image/png",
        href: '/static/css/blue-bell.png'
      }), __jsx("meta", {
        property: "og:author",
        content: meta.author
      }), __jsx("meta", {
        property: "dcterms.replaces",
        content: meta.link
      }), __jsx("meta", {
        property: "dcterms.identifier",
        content: meta.tid
      }), __jsx("meta", {
        name: "pjax-timeout",
        content: "1000"
      }), __jsx("meta", {
        name: "is-dotcom",
        content: "true"
      }), __jsx("meta", {
        name: "google-site-verification",
        content: "PMhSQkvtt0XVBm8DIMXJiwTkUpMODTShDIAs5q0zGXc"
      }), __jsx("meta", {
        property: "cxid",
        content: meta.cxid
      }), __jsx("meta", {
        property: "txid",
        content: meta.txid
      }), __jsx("meta", {
        property: "channel",
        content: meta.channel
      }), __jsx("meta", {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      }), __jsx("meta", {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black"
      }), __jsx("meta", {
        name: "msvalidate.01",
        content: "F6078DEB781FF7EEBAAF3723CBE56F5E"
      }), __jsx("title", null, "My page")), __jsx(_material_ui_styles__WEBPACK_IMPORTED_MODULE_12__["ThemeProvider"], {
        theme: muiTheme
      }, __jsx(_material_ui_core_CssBaseline__WEBPACK_IMPORTED_MODULE_13__["default"], null), __jsx(react_redux__WEBPACK_IMPORTED_MODULE_8__["Provider"], {
        store: store
      }, __jsx(Component, pageProps))));
    }
  }]);

  return MyApp;
}(next_app__WEBPACK_IMPORTED_MODULE_9___default.a);

/* harmony default export */ __webpack_exports__["default"] = (Object(next_redux_wrapper__WEBPACK_IMPORTED_MODULE_14__["default"])(_lib_store__WEBPACK_IMPORTED_MODULE_15__["initStore"].bind(MyApp.route))(MyApp));

/***/ })

})
//# sourceMappingURL=_app.js.e4f3892b8dfc82dd9e85.hot-update.js.map