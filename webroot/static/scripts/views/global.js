/**
 * BzDeck Global View
 * Copyright © 2015 Kohei Yoshino. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

BzDeck.views.Global = function GlobalView (prefs) {
  let datetime = FlareTail.util.datetime,
      value,
      theme = prefs['ui.theme.selected'],
      FTut = FlareTail.util.theme,
      $root = document.documentElement;

  // Automatically update relative dates on the app
  datetime.options.updater_enabled = true;

  // Date format
  value = prefs['ui.date.relative'];
  datetime.options.relative = value !== undefined ? value : true;

  // Date timezone
  value = prefs['ui.date.timezone'];
  datetime.options.timezone = value || 'local';

  // Timeline: Font
  value = prefs['ui.timeline.font.family'];
  $root.setAttribute('data-ui-timeline-font-family', value || 'proportional');

  // Timeline: Sort order
  value = prefs['ui.timeline.sort.order'];
  $root.setAttribute('data-ui-timeline-sort-order', value || 'ascending');

  // Timeline: Changes
  value = prefs['ui.timeline.show_cc_changes'];
  $root.setAttribute('data-ui-timeline-show-cc-changes', value !== undefined ? value : false);

  // Timeline: Attachments
  value = prefs['ui.timeline.display_attachments_inline'];
  $root.setAttribute('data-ui-timeline-display-attachments-inline', value !== undefined ? value : true);

  // Activate widgets
  // BzDeck.views.DetailsPage.swipe.init();

  // Change the theme
  if (theme && FTut.list.contains(theme)) {
    FTut.selected = theme;
  }

  // Preload images from CSS
  FTut.preload_images();

  // Update user name & image asynchronously
  this.on('UserController:UserInfoUpdated', data => {
    let user = BzDeck.controllers.users.get(data.name);

    for (let $email of [...document.querySelectorAll(`[itemprop="email"][content="${CSS.escape(user.email)}"]`)]) {
      let title = `${user.original_name || user.name}\n${user.email}`,
          $person = $email.closest('[itemtype$="Person"]'),
          $name = $person.querySelector('[itemprop="name"]'),
          $image = $person.querySelector('[itemprop="image"]');

      if ($person.title && $person.title !== title) {
        $person.title = title;
      }

      if ($name && $name.itemValue !== user.name) {
        $name.itemValue = user.name;
      }

      if ($image && $image.itemValue !== user.image) {
        $image.itemValue = user.image; // Blob URL
      }
    }
  });
};

BzDeck.views.Global.prototype = Object.create(BzDeck.views.Base.prototype);
BzDeck.views.Global.prototype.constructor = BzDeck.views.Global;

BzDeck.views.Global.prototype.toggle_unread = function (bugs, loaded, unread_num) {
  if (document.documentElement.getAttribute('data-current-tab') === 'home') {
    BzDeck.views.pages.home.update_title(document.title.replace(/(\s\(\d+\))?$/, unread_num ? ` (${unread_num})` : ''));
  }

  if (!loaded) {
    return;
  }

  if (bugs.length === 0) {
    BzDeck.views.statusbar.show('No new bugs to download'); // l10n

    return;
  }

  bugs.sort((a, b) => new Date(b.last_change_time) - new Date(a.last_change_time));

  let status = bugs.length > 1 ? `You have ${bugs.length} unread bugs` : 'You have 1 unread bug'; // l10n

  BzDeck.views.statusbar.show(status);
};

/* ------------------------------------------------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------------------------------------------------ */

window.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('dragenter', event => event.preventDefault());
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
window.addEventListener('wheel', event => event.preventDefault());

window.addEventListener('popstate', event => {
  // Hide sidebar
  if (FlareTail.util.ua.device.mobile) {
    document.documentElement.setAttribute('data-sidebar-hidden', 'true');
    document.querySelector('#sidebar').setAttribute('aria-hidden', 'true');
  }
});

window.addEventListener('click', event => {
  let $target = event.target;

  // Discard clicks on the fullscreen dialog
  if ($target === document) {
    return true;
  }

  if ($target.matches('[itemtype$="Person"]')) {
    BzDeck.router.navigate('/profile/' + $target.properties.email[0].itemValue);
    event.stopPropagation();
    event.preventDefault();

    return false;
  }

  if ($target.matches(':link')) {
    // Bug link: open in a new app tab
    if ($target.hasAttribute('data-bug-id')) {
      BzDeck.router.navigate('/bug/' + $target.getAttribute('data-bug-id'));

      event.preventDefault();

      return false;
    }

    // Attachment link: open in a new browser tab (TEMP)
    if ($target.hasAttribute('data-attachment-id')) {
      window.open(BzDeck.models.server.data.url + '/attachment.cgi?id='
                   + $target.getAttribute('data-attachment-id'), '_blank');

      event.preventDefault();

      return false;
    }

    // Normal link: open in a new browser tab
    $target.target = '_blank';

    return false;
  }

  return true;
});

window.addEventListener('keydown', event => {
  let modifiers = event.shiftKey || event.ctrlKey || event.metaKey || event.altKey,
      tab = event.keyCode === event.DOM_VK_TAB;

  // Stop showing the Search Bar in Firefox
  if (!event.target.matches('[role="textbox"]') && !modifiers && !tab) {
    event.preventDefault();
  }
});