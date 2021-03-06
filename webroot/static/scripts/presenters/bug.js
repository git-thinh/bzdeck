/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Define the Bug Presenter.
 * @extends BzDeck.BasePresenter
 * @todo Move this to the worker thread.
 */
BzDeck.BugPresenter = class BugPresenter extends BzDeck.BasePresenter {
  /**
   * Get a BugPresenter instance.
   * @param {String} id - Unique instance identifier shared with the corresponding view.
   * @param {String} container_id - Unique instance identifier of the parent container view.
   * @param {Number} bug_id - Bug ID to show.
   * @param {Array.<Number>} [siblings] - Optional bug ID list that can be navigated with the Back and Forward buttons
   *  or keyboard shortcuts. If the bug is on a thread, all bugs on the thread should be listed here.
   * @returns {BugPresenter} New BugPresenter instance.
   */
  constructor (id, container_id, bug_id, siblings = []) {
    super(id); // Assign this.id

    this.container_id = container_id;
    this.bug_id = bug_id;
    this.siblings = siblings;

    // Attachments
    this.on('V#AttachFiles', data => this.bug.attach_files(data.files));
    this.on('V#AttachText', data => this.bug.attach_text(data.text));
    this.on('V#RemoveAttachment', data => this.bug.remove_attachment(data.hash));
    this.on('V#MoveUpAttachment', data => this.bug.move_up_attachment(data.hash));
    this.on('V#MoveDownAttachment', data => this.bug.move_down_attachment(data.hash));
    this.on('AttachmentView#EditAttachment', data => this.bug.edit_attachment(data));

    // Subscription
    this.on('V#Subscribe', data => this.bug.update_subscription('add'));
    this.on('V#Unsubscribe', data => this.bug.update_subscription('remove'));

    // Other changes
    this.on('V#EditComment', data => this.bug.edit_comment(data.text));
    this.on('V#EditField', data => this.bug.edit_field(data.name, data.value));
    this.on('V#EditFlag', data => this.bug.edit_flag(data.flag, data.added));
    this.on('V#AddFieldValue', data => this.bug.add_field_value(data.field, data.value));
    this.on('V#RemoveFieldValue', data => this.bug.remove_field_value(data.field, data.value));
    this.on('V#AddParticipant', data => this.bug.add_participant(data.field, data.email));
    this.on('V#RemoveParticipant', data => this.bug.remove_participant(data.field, data.email));

    // Timeline
    this.subscribe('V#CommentSelected');

    // Form submission
    this.on('V#Submit', () => this.bug.submit());

    // Other actions
    this.on('V#Initialized', () => this.load_bug());
    this.subscribe('V#OpeningTabRequested');

    // Check the fragment; use a timer to wait for the timeline rendering
    window.setTimeout(window => this.check_fragment(), 150);
    window.addEventListener('popstate', event => this.check_fragment());
    window.addEventListener('hashchange', event => this.check_fragment());
  }

  /**
   * Load the bug from the local database or remote Bugzilla instance.
   * @listens BugView#Initialized
   * @fires BugPresenter#LoadingStarted
   * @fires BugPresenter#LoadingFinished
   * @fires BugPresenter#BugDataAvailable
   * @fires BugPresenter#BugDataUnavailable
   */
  async load_bug () {
    const container_id = this.container_id;
    const bug_id = this.bug_id;

    this.trigger('#LoadingStarted', { container_id, bug_id });

    let bug = await BzDeck.collections.bugs.get(this.bug_id);
    let error_code = 0;
    let error_message = 'This bug data is not available.';

    if (!bug || bug.error) {
      if (!navigator.onLine) {
        error_message = 'You have to go online to load the bug.';
      } else {
        try {
          bug = await BzDeck.collections.bugs.get(this.bug_id, { id: this.bug_id });
          bug = await bug.fetch();
        } catch (error) {
          bug = {};
          error_message = 'Failed to retrieve data from Bugzilla.';
        }
      }
    }

    if (bug.data && bug.data.summary) {
      this.bug = bug;
      this.trigger('#BugDataAvailable', { container_id, id: this.bug_id, siblings: this.siblings });
      BzDeck.collections.users.add_from_bug(bug);
    } else {
      if (bug.error && bug.error.code) {
        error_code = bug.error.code;
      }

      if (error_code === 102) {
        error_message = 'You are not authorized to access this bug, probably because it has sensitive information such \
                         as unpublished security issues or marketing-related topics. '
      }

      this.trigger('#BugDataUnavailable', { container_id, bug_id, code: error_code, message: error_message });
    }

    this.trigger('#LoadingFinished', { container_id, bug_id });
  }

  /**
   * Called whenever a comment is selected. Update the location hash to include the comment ID.
   * @listens BugView#CommentSelected
   * @param {Number} number - Comment number.
   */
  on_comment_selected ({ number } = {}) {
    if (location.pathname === `/bug/${this.bug.id}`) {
      window.history.replaceState({}, document.title, `${location.pathname}#c${number}`);
    }
  }

  /**
   * Called in the constructor and whenever the location fragment or history state is updated. If the current bug is
   * still displayed, fire an event so the relevant views can do something.
   * @fires BugPresenter#HistoryUpdated
   */
  check_fragment () {
    if (this.bug && location.pathname === `/bug/${this.bug.id}`) {
      this.trigger('#HistoryUpdated', { hash: location.hash, state: history.state });
    }
  }

  /**
   * Called whenever a previewed bug is selected for details. Open the bug in a new tab with a list of the home page
   * thread so the user can easily navigate through those bugs.
   * @listens BugView#OpeningTabRequested
   */
  on_opening_tab_requested () {
    BzDeck.router.navigate('/bug/' + this.bug.id, { siblings: this.siblings });
  }
}
