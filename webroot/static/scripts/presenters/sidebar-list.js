/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Define the SidebarList Presenter.
 * @extends BzDeck.BasePresenter
 * @todo Move this to the worker thread.
 */
BzDeck.SidebarListPresenter = class SidebarListPresenter extends BzDeck.BasePresenter {
  /**
   * Get a SidebarListPresenter instance.
   * @param {String} id - Unique instance identifier shared with the corresponding view.
   * @returns {SidebarListPresenter} New SidebarListPresenter instance.
   */
  constructor (id) {
    super(id); // Assign this.id

    this.data = new Proxy({
      bugs: new Map(),
      preview_id: null
    },
    {
      set: (obj, prop, newval) => {
        const oldval = obj[prop];

        if (prop === 'preview_id') {
          BzDeck.router.navigate(location.pathname, { preview_id: newval }, true);
        }

        obj[prop] = newval;

        return true;
      }
    });
  }
}
