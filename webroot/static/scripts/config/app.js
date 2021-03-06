/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Define the BzDeck app namespace.
 * @namespace
 */
const BzDeck = {};

/**
 * Define app configurations.
 * @member {Object}
 * @property {Object} hosts - List of supported Bugzilla instances.
 * @property {Object} app - App's path list used by Router.
 * @property {Object} grid - Columns on classic threads.
 * @property {Object} prefs - Preferences types and default values.
 * @property {Array.<Object>} folders - Navigator folder list.
 */
BzDeck.config = {
  hosts: {
    mozilla: {
      label: 'Mozilla',
      timezone: 'America/Los_Angeles',
      default_assignee: 'nobody@mozilla.org',
      origin: 'https://bugzilla.mozilla.org',
      markdown_supported: false,
      user_agent_accepted: true,
    },
    'mozilla-dev': {
      label: 'Mozilla Dev',
      timezone: 'America/Los_Angeles',
      default_assignee: 'nobody@mozilla.org',
      origin: 'https://bugzilla-dev.allizom.org',
      markdown_supported: false,
      user_agent_accepted: false,
    },
    'mozilla-merge': {
      label: 'Mozilla Merge',
      timezone: 'America/Los_Angeles',
      default_assignee: 'nobody@mozilla.org',
      origin: 'https://bugzilla-merge.allizom.org',
      markdown_supported: true,
      user_agent_accepted: false,
    }
  },
  app: {
    root: '/',
    launch_path: '/home/inbox',
  },
  grid: {
    default_columns: [
      // Custom
      { id: 'starred', label: 'Starred', type: 'boolean' },
      // Name
      { id: 'id', label: 'ID' /* instead of Bug ID */, type: 'integer' },
      { id: 'alias', hidden: true },
      { id: 'summary' },
      // Status
      { id: 'status', hidden: true },
      { id: 'resolution', hidden: true },
      { id: 'target_milestone', hidden: true },
      // Affected
      { id: 'classification', hidden: true },
      { id: 'product' },
      { id: 'component' },
      { id: 'version', hidden: true },
      { id: 'platform', hidden: true },
      { id: 'op_sys', hidden: true },
      // Importance
      { id: 'severity', hidden: true },
      { id: 'priority', hidden: true },
      // Notes
      { id: 'whiteboard', hidden: true },
      { id: 'keywords', hidden: true },
      { id: 'url', hidden: true },
      // Participants
      { id: 'creator', type: 'person', hidden: true },
      { id: 'assigned_to', type: 'person', hidden: true },
      { id: 'qa_contact', type: 'person', hidden: true },
      { id: 'mentors', label: 'Mentors' /* Not found in the config */, type: 'people', hidden: true },
      // Dates
      { id: 'creation_time', type: 'time', hidden: true },
      { id: 'last_change_time', type: 'time' },
    ]
  },
  prefs: {
    // Theme
    'ui.theme.selected': { type: 'string', default: 'Light' },
    // Timezone & Date Format
    'ui.date.timezone': { type: 'string', default: 'local' },
    'ui.date.relative': { type: 'boolean', default: true },
    // Notifications
    'notifications.show_desktop_notifications': { type: 'boolean', default: true },
    'notifications.ignore_cc_changes': { type: 'boolean', default: true },
    // Home
    'ui.home.layout': { type: 'string', default: 'vertical' },
    'ui.home.filter': { type: 'string', default: 'open' },
    // Timeline
    'ui.timeline.sort.order': { type: 'string', default: 'ascending' },
    'ui.timeline.font.family': { type: 'string', default: 'proportional' },
    'ui.timeline.show_cc_changes': { type: 'boolean', default: false },
    'ui.timeline.show_attachments': { type: 'integer', default: 2 },
    // Editing
    'editing.move_next_once_submitted': { type: 'boolean', default: false },
  },
  folders: [
    {
      id: 'navigator-folder-search',
      label: 'Search',
      data: { id: 'search' }
    },
    {
      id: 'navigator-folder-inbox',
      label: 'Inbox',
      selected: true,
      data: { id: 'inbox' }
    },
    {
      id: 'navigator-folder-starred',
      label: 'Starred',
      data: { id: 'starred' }
    },
    {
      id: 'navigator-folder-requests',
      label: 'Requests',
      data: { id: 'requests' }
    },
    {
      id: 'navigator-folder-reported',
      label: 'Reported',
      data: { id: 'reported' }
    },
    {
      id: 'navigator-folder-watching',
      label: 'Watching', // was CCed
      data: { id: 'watching' }
    },
    {
      id: 'navigator-folder-assigned',
      label: 'Assigned',
      data: { id: 'assigned' }
    },
    {
      id: 'navigator-folder-mentor',
      label: 'Mentor',
      data: { id: 'mentor' }
    },
    {
      id: 'navigator-folder-qa',
      label: 'QA',
      data: { id: 'qa' }
    },
    {
      id: 'navigator-folder-all',
      label: 'All Bugs',
      data: { id: 'all' }
    }
  ],
};

/**
 * Detect if the current user agent is compatible with APIs used in BzDeck.
 * @member {Boolean}
 * @name BzDeck.compatible
 */
Object.defineProperty(BzDeck, 'compatible', {
  get: () => {
    const features = [
      'Worker' in window, // Firefox 3.5
      'FileReader' in window, // Firefox 3.6
      'isInteger' in Number, // Firefox 16
      'Notification' in window, // Firefox 22
      'CSS' in window && 'supports' in CSS, // Firefox 23
      'SharedWorker' in window, // Firefox 29
      'URLSearchParams' in window, // Firefox 29
      'ServiceWorker' in window, // Firefox 33
      'mediaDevices' in navigator, // Firefox 36
      'BroadcastChannel' in window, // Firefox 38
      'CacheStorage' in window, // Firefox 41
      'Permissions' in window, // Firefox 45
      'animate' in Element.prototype, // Firefox 48
      (new URLSearchParams([['id', 1]])).toString() === 'id=1', // Firefox 53
      (new URLSearchParams({ id: 1 })).toString() === 'id=1', // Firefox 54
      'IntersectionObserver' in window, // Firefox 55
      !FlareTail.env.platform.android, // Temporarily disable Android support (#412)
    ];

    return features.every(item => item);
  },
});
