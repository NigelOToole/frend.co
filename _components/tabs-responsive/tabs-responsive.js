'use strict';
/* global enquire */

// Set Array prototype on NodeList for forEach() support
// https://gist.github.com/paulirish/12fb951a8b893a454b32#gistcomment-1474959
NodeList.prototype.forEach = Array.prototype.forEach;

/**
 * @param {object} options Object containing configuration overrides
 */
const FrtabsResponsive = function ({
    selector: selector = '.js-fr-tabsresp',
    readyClass: readyClass = 'fr-tabsresp--is-ready',
    headerSelector: headerSelector = '.js-fr-tabsresp__head',
    headerIdPrefix: headerIdPrefix = 'tabsresp-head',
    panelSelector: panelSelector = '.js-fr-tabsresp__panel',
    panelIdPrefix: panelIdPrefix = 'tabsresp-panel',
    tablistSelector: tablistSelector = '.js-fr-tabsresp__tablist',
    firstPanelsOpenByDefault: firstPanelsOpenByDefault = true, // Accordion only
    multiselectable: multiselectable = true,  // Accordion only
    mode: mode = 'tabs',
    responsiveBreakpoint: responsiveBreakpoint = 767
  } = {}) {



  const togglesSelector = tablistSelector + ' a' + ', ' + headerSelector;


  // CONSTANTS
  const doc = document;
  const docEl = doc.documentElement;


  // SUPPORTS
  if (!('querySelector' in doc) || !('addEventListener' in window) || !docEl.classList) { return; }


  // SETUP
  // Get component element NodeLists
  let components = doc.querySelectorAll(selector);


  // A11Y
  function _addA11y (component) {
    // Get component elements
    const panels = component.querySelectorAll(panelSelector);

    const tabLists = component.querySelectorAll(tablistSelector);
    const tabListItems = component.querySelectorAll(tablistSelector + ' li');
    const tabs = component.querySelectorAll(tablistSelector + ' a');

    const headers = component.querySelectorAll(headerSelector);

    // Add relevant roles and properties
    // Component
    if(mode === 'accordion') {
      component.setAttribute('role', 'tablist');
      component.setAttribute('aria-multiselectable', multiselectable);
    }

    // Panels
    panels.forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('tabindex', 0);

      if(mode === 'accordion') {
        panel.setAttribute('aria-labelledby', panel.id.replace(panelIdPrefix, headerIdPrefix));
      }
    });

    // Tab lists for tabs
    tabLists.forEach((tabList) => {
      tabList.setAttribute('role', 'tablist');
    });

    tabListItems.forEach((tabItem) => {
      tabItem.setAttribute('role', 'presentation');
    });

    tabs.forEach((tab) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tab.hash.substring(1));
    });

    // Headers for accordions
    headers.forEach((header) => {
      header.setAttribute('role', 'tab');
      header.setAttribute('aria-controls', header.id.replace(headerIdPrefix, panelIdPrefix));
      // make headers focusable, this is preferred over wrapping contents in native button element
      header.setAttribute('tabindex', 0);
    });

  }

  function _removeA11y (component) {
    // Get component elements
    const panels = component.querySelectorAll(panelSelector);

    const tabLists = component.querySelectorAll(tablistSelector);
    const tabListItems = component.querySelectorAll(tablistSelector + ' li');

    const toggles = component.querySelectorAll(togglesSelector);

    // Remove roles and properties
    // Component
    component.removeAttribute('role');
    component.removeAttribute('aria-multiselectable');

    // Panels
    panels.forEach((panel) => {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-labelledby');
      panel.removeAttribute('aria-hidden');
      // remove tabpanel focusablibility
      panel.removeAttribute('tabindex');
    });

    // Tab lists for tabs
    tabLists.forEach((tabList) => {
      tabList.removeAttribute('role');
    });

    tabListItems.forEach((tabItem) => {
      tabItem.removeAttribute('role');
    });

    // Tabs and Headers
    toggles.forEach((toggle) => {
      toggle.removeAttribute('role');
      toggle.removeAttribute('aria-controls');
      toggle.removeAttribute('aria-selected');
      toggle.removeAttribute('aria-expanded');
      toggle.removeAttribute('tabindex');
    });

  }


  // ACTIONS
  function _hideAllPanels (component) {
    let panels = component.querySelectorAll(panelSelector);
    let toggles = component.querySelectorAll(togglesSelector);

    panels.forEach((panel) => {
      panel.setAttribute('aria-hidden', 'true');
    });

    toggles.forEach((toggle) => {
      toggle.setAttribute('tabindex', -1);
      toggle.setAttribute('aria-selected', 'false');
      toggle.setAttribute('aria-expanded', 'false');
    });

  }

  function _hidePanel (target) {
    let activePanel = doc.getElementById(target.getAttribute('aria-controls'));

    activePanel.setAttribute('aria-hidden', 'true');

    target.setAttribute('aria-selected', 'false');

    // Detects wheter the target is an accordion header rather than rely on mode, trims first character to remove '.'
    if(target.classList.contains(headerSelector.substr(1))) {
      target.setAttribute('aria-expanded', 'false');
    }
  }

  function _showPanel (target, giveFocus) {
    let activePanel = doc.getElementById(target.getAttribute('aria-controls'));

    activePanel.setAttribute('aria-hidden', 'false');

    target.setAttribute('aria-selected', 'true');
    target.setAttribute('tabindex', 0);

    if(target.classList.contains(headerSelector.substr(1))) {
      target.setAttribute('aria-expanded', 'true');
    }

    // Focus on tab
    if (giveFocus && target.parentNode.parentNode.classList.contains(tablistSelector.substr(1))) {
      target.focus();
    }

  }

  function _togglePanel (target, giveFocus = true) {
    // Close target panel if already active in accordion
    if (target.getAttribute('aria-selected') === 'true' && mode === 'accordion') {
      _hidePanel(target);
      return;
    }

    let thisContainer;

    // Hide all other panels in tabs mode and if it is not multiselectable in accordion mode
    if (mode === 'tabs' || (mode === 'accordion' && !multiselectable)) {
      if (mode === 'tabs') {
        thisContainer = target.parentNode.parentNode.parentNode;
      }
      if (mode === 'accordion') {
        thisContainer = target.parentNode;
      }

      _hideAllPanels(thisContainer);
    }

    // Show target panel
    _showPanel(target, giveFocus);
  }


  function _giveHeaderFocus (headerSet, i) {
    // remove focusability from inactives
    headerSet.forEach((header) => {
      header.setAttribute('tabindex', -1);
    });
    // set active focus
    headerSet[i].setAttribute('tabindex', 0);
    headerSet[i].focus();
  }


  // EVENTS
  function _eventToggleClick (e) {
    _togglePanel(e.target);
    e.preventDefault();
  }

  function _eventKeydown (e) {
    // collect toggle targets, and their prev/next
    let currentToggle = e.target;
    // get context of accordion container and its children
    let thisContainer = currentToggle.parentNode;
    let theseHeaders = thisContainer.querySelectorAll(headerSelector);
    let currentToggleIndex = [].indexOf.call(theseHeaders, currentToggle);

    let previousTabItem = currentToggle.parentNode.previousElementSibling || currentToggle.parentNode.parentNode.lastElementChild;
    let nextTabItem = currentToggle.parentNode.nextElementSibling || currentToggle.parentNode.parentNode.firstElementChild;

    // catch enter/space, left/right and up/down arrow key events
    // if new panel show it, if next/prev move focus
    switch (e.keyCode) {
      case 13:
      case 32:
        _togglePanel(currentToggle);
        e.preventDefault();
        break;
      case 37:
      case 38:
        if(mode === 'accordion') {
          let previousHeaderIndex = (currentToggleIndex === 0) ? theseHeaders.length - 1 : currentToggleIndex - 1;
          _giveHeaderFocus(theseHeaders, previousHeaderIndex);
        }
        if(mode === 'tabs') {
          _togglePanel(previousTabItem.querySelector('[role="tab"]'));
        }
        e.preventDefault();
        break;
      case 39:
      case 40:
        if(mode === 'accordion') {
          let nextHeaderIndex = (currentToggleIndex < theseHeaders.length - 1) ? currentToggleIndex + 1 : 0;
          _giveHeaderFocus(theseHeaders, nextHeaderIndex);
        }
        if(mode === 'tabs') {
          _togglePanel(nextTabItem.querySelector('[role="tab"]'));
        }
        e.preventDefault();
        break;
      default:
        break;
    }
  }


  // BINDINGS
  function _bindEvents (component) {
    const toggles = component.querySelectorAll(togglesSelector);

    toggles.forEach((toggle) => {
      toggle.addEventListener('click', _eventToggleClick);
      toggle.addEventListener('keydown', _eventKeydown);
    });
  }

  function _unbindEvents (component) {
    const toggles = component.querySelectorAll(togglesSelector);

    toggles.forEach((toggle) => {
      toggle.removeEventListener('click', _eventToggleClick);
      toggle.removeEventListener('keydown', _eventKeydown);
    });
  }


  // DESTROY
  function destroy () {
    components.forEach((component) => {
      _removeA11y(component);
      _unbindEvents(component);
      component.classList.remove(readyClass);
    });
  }


  // INIT
  function init () {
    if (components.length) {
      components.forEach((component) => {
        _addA11y(component);
        _bindEvents(component);
        _hideAllPanels(component);
        // set all first accordion panels active on init if required (default behaviour)
        // otherwise make sure first accordion header for each is focusable
        if (mode === 'accordion') {
          if (firstPanelsOpenByDefault) {
            _togglePanel(component.querySelector(headerSelector));
          } else {
            component.querySelector(headerSelector).setAttribute('tabindex', 0);
          }
        }
        if (mode === 'tabs') {
          _togglePanel(component.querySelector(tablistSelector + ' a'), false);
        }
        // set ready style hook
        component.classList.add(readyClass);
      });
    }
  }
  init();


  // Change modes of the component - tabs or accordion
  function toggleMode (newMode) {
    if (mode !== newMode && (newMode === 'tabs' || newMode === 'accordion')) {
      destroy();

      mode = newMode;

      if (mode === 'tabs') {
        multiselectable = false;
      }

      init();

      //console.log('Mode: ' + mode);
    } else {
      //console.log('Invalid Mode: ' + mode);
    }
  }

  // Switch modes when the responsive brekpoint is met - uses enquire.js
  function _responsiveInit () {
    if (components.length && responsiveBreakpoint > 0) {

      enquire.register('screen and (max-width:' + responsiveBreakpoint + 'px)', {
        match: function() {
          toggleMode('accordion');
        },
        unmatch: function() {
          toggleMode('tabs');
        },
        deferSetup: true
      });
    }
  }
  _responsiveInit();

  // REVEAL API
  return {
    init,
    destroy,
    toggleMode
  };

};

// module exports
export default FrtabsResponsive;
